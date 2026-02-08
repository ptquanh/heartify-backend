import { OperationResult, PaginationResult } from 'mvc-common-toolkit';
import { Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { RiskAssessmentPayloadDto } from '@modules/risk-assessment/risk-assessment.dto';
import { RiskAssessmentService } from '@modules/risk-assessment/risk-assessment.service';
import { UserService } from '@modules/user/user.service';

import { ERR_CODE, HEIGHT_UNIT, WEIGHT_UNIT } from '@shared/constants';
import {
  generateNotFoundResult,
  generateSuccessResult,
} from '@shared/helpers/operation-result.helper';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import {
  CreateHealthRecordDTO,
  HealthRecordPaginationDTO,
} from './health-record.dto';
import { HealthRecord } from './health-record.entity';

@Injectable()
export class HealthRecordService extends BaseCRUDService<HealthRecord> {
  protected logger = new Logger(HealthRecordService.name);

  constructor(
    @InjectRepository(HealthRecord)
    protected repo: Repository<HealthRecord>,

    private readonly userService: UserService,
    private readonly riskService: RiskAssessmentService,
  ) {
    super(repo);
  }

  async createHealthRecord(
    userId: string,
    dto: CreateHealthRecordDTO,
  ): Promise<OperationResult<HealthRecord>> {
    const user = await this.userService.findOne(
      { id: userId },
      { relations: { profile: true } },
    );

    if (!user) {
      return generateNotFoundResult('User not found', ERR_CODE.USER_NOT_FOUND);
    }

    if (!user.profile || !user.profile.dateOfBirth) {
      return generateNotFoundResult(
        'User profile incomplete (DOB required for risk assessment)',
        ERR_CODE.USER_PROFILE_INCOMPLETE,
      );
    }

    const age = this.userService.getAge(user.profile.dateOfBirth);

    const riskPayload: RiskAssessmentPayloadDto = {
      age,
      gender: user.profile.gender,
      isSmoker: dto.isSmoker,
      isDiabetic: dto.isDiabetic,
      isTreatedHypertension: dto.isTreatedHypertension,
      systolicBp: dto.systolicBp,
      totalCholesterol: dto.totalCholesterol,
      hdlCholesterol: dto.hdlCholesterol,
      weight: dto.measurements?.weight?.value,
      height: dto.measurements?.height?.value,
    };

    const riskResult = this.riskService.calculateRisk(riskPayload);

    if (!riskResult.success) {
      return generateNotFoundResult(
        'Failed to calculate risk',
        ERR_CODE.RISK_ASSESSMENT_FAILED,
      );
    }

    if (dto.measurements?.weight && dto.measurements?.height) {
      const bmi = this.calculateBMI(
        dto.measurements.weight,
        dto.measurements.height,
      );
      if (bmi) {
        dto.measurements.bmi = bmi;
      }
    }

    const healthRecord = await this.create({
      ...dto,
      userId,
      recordedAt: new Date(),
      ageAtRecord: age,
      riskLevel: riskResult.data.riskLevel,
      riskScore: riskResult.data.riskScore,
      riskPercentage: riskResult.data.riskPercentage,
      riskAlgorithm: riskResult.data.algorithmUsed,
      identifiedRiskFactors: riskResult.data.riskFactors,
    });

    return generateSuccessResult(healthRecord);
  }

  private calculateBMI(
    weight: { value: number; unit: string },
    height: { value: number; unit: string },
  ): number {
    let weightInKg = weight.value;
    if (weight.unit === WEIGHT_UNIT.LB) {
      weightInKg = weight.value * 0.453592;
    }

    let heightInMeters = height.value;
    if (height.unit === HEIGHT_UNIT.CM) {
      heightInMeters = height.value / 100;
    } else if (height.unit === HEIGHT_UNIT.IN) {
      heightInMeters = height.value * 0.0254;
    }

    if (heightInMeters <= 0) {
      return 0;
    }

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  }

  async getHealthRecordById(
    userId: string,
    recordId: string,
  ): Promise<OperationResult<HealthRecord>> {
    const record = await this.findOne({ id: recordId, userId });
    return generateSuccessResult(record);
  }

  async paginateHealthRecords(
    userId: string,
    dto: HealthRecordPaginationDTO,
  ): Promise<PaginationResult<HealthRecord>> {
    dto.addFilter({ userId });
    const records = await this.paginate(dto, dto.filter);
    return records;
  }
}
