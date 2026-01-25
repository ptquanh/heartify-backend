import { Repository } from 'typeorm';

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
  Gender,
  RiskAssessmentAlgorithm,
  RiskLevel,
} from '@modules/risk-assessment/risk-assessment.constants';
import { RiskAssessmentService } from '@modules/risk-assessment/risk-assessment.service';
import { UserService } from '@modules/user/user.service';

import { ERR_CODE } from '@shared/constants';

import { CreateHealthRecordDto } from './health-record.dto';
import { HealthRecord } from './health-record.entity';
import { HealthRecordService } from './health-record.service';

describe('HealthRecordService', () => {
  let service: HealthRecordService;
  let repo: Repository<HealthRecord>;
  let userService: UserService;
  let riskService: RiskAssessmentService;

  const mockRepo = {
    save: jest.fn(),
    create: jest.fn(), // BaseCRUDService might stick to create or just return object
    find: jest.fn(),
    findOneBy: jest.fn(),
    count: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
    getAge: jest.fn(),
  };

  const mockRiskService = {
    calculateRisk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthRecordService,
        {
          provide: getRepositoryToken(HealthRecord),
          useValue: mockRepo,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: RiskAssessmentService,
          useValue: mockRiskService,
        },
      ],
    }).compile();

    service = module.get<HealthRecordService>(HealthRecordService);
    repo = module.get<Repository<HealthRecord>>(
      getRepositoryToken(HealthRecord),
    );
    userService = module.get<UserService>(UserService);
    riskService = module.get<RiskAssessmentService>(RiskAssessmentService);

    // BaseCRUDService assigns repo to this.model.
    // Ensure spies are cleared
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHealthRecord', () => {
    const userId = 'user-123';
    const dto: CreateHealthRecordDto = {
      systolicBp: 120,
      diastolicBp: 80,
      totalCholesterol: 200,
      hdlCholesterol: 50,
      isSmoker: false,
      isDiabetic: false,
      isTreatedHypertension: false,
    };

    it('should create record successfully', async () => {
      // Mock User
      mockUserService.findOne.mockResolvedValue({
        id: userId,
        profile: {
          dateOfBirth: new Date('1980-01-01'),
          gender: Gender.MALE,
        },
      });
      mockUserService.getAge.mockReturnValue(46);

      // Mock Risk
      const riskResult = {
        success: true,
        data: {
          riskLevel: RiskLevel.LOW,
          riskScore: 2,
          riskPercentage: 1.5,
          algorithmUsed: RiskAssessmentAlgorithm.ASCVD,
          riskFactors: [],
        },
      };
      mockRiskService.calculateRisk.mockReturnValue(riskResult);

      // Mock Save (via spyOn BaseCRUDService.create which calls repo.save)
      // BaseCRUDService.create calls: save(dto) -> return findByID(id)
      // But we can mock repo.save directly if we assume implementation details.
      // BaseCRUDService.create calls this.model.save(dto) and then this.findByID(created.id)

      const savedEntity = { ...dto, id: 'rec-1', userId };
      mockRepo.save.mockResolvedValue(savedEntity);
      // findByID calls findOneBy
      mockRepo.findOneBy.mockResolvedValue(savedEntity);

      const result = await service.createHealthRecord(userId, dto);

      expect(userService.findOne).toHaveBeenCalledWith(
        { id: userId },
        { relations: { profile: true } },
      );
      expect(riskService.calculateRisk).toHaveBeenCalled(); // checks args implicitly or add check
      expect(repo.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(savedEntity);
    });

    it('should return error if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);
      const result = await service.createHealthRecord(userId, dto);
      expect(result.success).toBe(false);
      expect(result.code).toBe(ERR_CODE.USER_NOT_FOUND);
    });

    it('should return error if profile incomplete', async () => {
      mockUserService.findOne.mockResolvedValue({ id: userId, profile: {} }); // no dob
      const result = await service.createHealthRecord(userId, dto);
      expect(result.success).toBe(false);
      expect(result.code).toBe(ERR_CODE.USER_PROFILE_INCOMPLETE);
    });

    it('should return error if risk calculation fails', async () => {
      mockUserService.findOne.mockResolvedValue({
        id: userId,
        profile: {
          dateOfBirth: new Date('1980-01-01'),
          gender: Gender.MALE,
        },
      });
      mockUserService.getAge.mockReturnValue(46);

      mockRiskService.calculateRisk.mockReturnValue({ success: false });

      const result = await service.createHealthRecord(userId, dto);
      expect(result.success).toBe(false);
      expect(result.code).toBe(ERR_CODE.RISK_ASSESSMENT_FAILED);
    });
  });
});
