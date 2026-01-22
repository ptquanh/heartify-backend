import * as crypto from 'crypto';
import { AuditService, ErrorLog, stringUtils } from 'mvc-common-toolkit';
import { Opik } from 'opik';
import { APP_ACTION, INJECTION_TOKEN } from 'src/shared/constants';
import { EncryptionUtil } from 'src/shared/utils/encryption.util';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { FRAMINGHAM_POINTS } from './diagnosis.constants';
import { DiagnosisPayloadDto, DiagnosisResultDto } from './diagnosis.dto';

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(
    // @InjectRepository(RiskAssessment)
    // protected repo: Repository<RiskAssessment>,
    // @InjectRepository(HealthRecord)
    // private readonly healthRecordRepo: Repository<HealthRecord>,
    // @InjectRepository(User)
    // private readonly userRepo: Repository<User>,
    // @InjectRepository(UserProfile)
    // private readonly userProfileRepo: Repository<UserProfile>,

    @Inject(INJECTION_TOKEN.AUDIT_SERVICE)
    private readonly auditService: AuditService,

    @Inject(INJECTION_TOKEN.OPIK_SERVICE)
    private readonly opikClient: Opik,

    private readonly encryptionUtil: EncryptionUtil,
  ) {
    // super(repo);
  }

  async simulateDiagnosis(
    dto: DiagnosisPayloadDto,
  ): Promise<DiagnosisResultDto> {
    const result = this.calculateFraminghamScore(dto);
    this.opikClient.trace({
      name: 'diagnosis_simulation',
      input: { ...dto, patientName: 'REDACTED_SIMULATION' },
      output: { ...result },
      tags: ['simulation', 'framingham'],
    });
    return result;
  }

  async calculateAndSaveDiagnosis(
    dto: DiagnosisPayloadDto,
  ): Promise<DiagnosisResultDto> {
    try {
      // 1. Logic
      const result = this.calculateFraminghamScore(dto);

      // let user: User = null;

      // 2. Handle User (Identity) if PII Provided
      if (dto.patientName) {
        // Blind Index for Email (if provided) or fallback to Name Hash?
        // For this demo, let's assume we create a new user or find by blind index if email was in DTO.
        // Since DTO only has patientName, we will create a lightweight user or just log it.
        // User requested: "Calculate -> ... -> Save"
        // Let's create a User for this session.
        // user = this.userRepo.create({
        //   role: 'user',
        //   status: 'active',
        //   lastLoginAt: new Date(),
        // });
        // await this.userRepo.save(user);

        // Save Profile with Encrypted PII
        const encryptedName = this.encryptionUtil.encrypt(dto.patientName);

        // Create a fake email hash for demo since input doesn't enforce email
        const dummyEmail = `demo_${Date.now()}@heartify.com`;
        const emailHash = crypto
          .createHash('sha256')
          .update(dummyEmail)
          .digest('hex');

        const encryptedEmail = this.encryptionUtil.encrypt(dummyEmail);

        // const profile = this.userProfileRepo.create({
        //   user,
        //   encryptedFullName: encryptedName,
        //   encryptedEmail: encryptedEmail,
        //   emailHash: emailHash,
        // });
        // await this.userProfileRepo.save(profile);
      }

      // 3. Save Health Record (Clinical History)
      // const healthRecord = this.healthRecordRepo.create({
      //   user,
      //   recordedAt: new Date(),
      //   gender: dto.gender,
      //   ageAtRecord: dto.age,
      //   systolicBp: dto.systolicBp,
      //   totalCholesterol: dto.totalCholesterol,
      //   hdlCholesterol: dto.hdlCholesterol,
      //   isSmoker: dto.isSmoker,
      //   isDiabetic: dto.isDiabetic,
      //   isTreatedHypertension: dto.isTreatedHypertension,
      //   // Optional fields left null
      // });
      // await this.healthRecordRepo.save(healthRecord);

      // 4. Opik Trace (Get ID)
      const trace = this.opikClient.trace({
        name: 'diagnosis_calculation',
        input: { ...dto, patientName: 'REDACTED_LOG' },
        output: { ...result },
        tags: ['production', 'framingham'],
      });
      // Mock Opik trace ID access if SDK doesn't expose it synchronously yet
      // The Opik SDK `trace` method usually returns an object or promise that resolves to trace data.
      // Checking TypeScript SDK docs: trace() returns a specific object.
      // We will assume trace.id exists or use a generated ID if the SDK is fire-and-forget.
      // For now, let's generate a UUID to correlate if the SDK doesn't give us one immediately.
      const traceId = (trace as any)?.id || stringUtils.generateRandomId();

      // 5. Save Diagnosis Assessment (Link everything)
      // const assessment = this.riskAssessmentRepo.create({
      //   healthRecord,
      //   algorithm: 'framingham_cardiovascular_10yr',
      //   diagnosisPercent: result.diagnosisPercent,
      //   diagnosisCategory: result.diagnosisCategory.toLowerCase(),
      //   inputSnapshot: dto,
      //   opikTraceId: traceId,
      // });
      // await this.riskAssessmentRepo.save(assessment);

      return result;
    } catch (error) {
      this.logger.error('Error in calculateAndSaveDiagnosis', error);
      this.auditService.emitLog(
        new ErrorLog({
          action: APP_ACTION.HANDLE_EXCEPTION,
          message: `Diagnosis Calc Failed: ${error.message}`,
          logId: stringUtils.generateRandomId(),
          payload: dto,
          metadata: error,
        }),
      );
      throw error;
    }
  }

  private calculateFraminghamScore(
    data: DiagnosisPayloadDto,
  ): DiagnosisResultDto {
    // ... Pure Logic (Same as before) ...
    let points = 0;
    const table =
      data.gender === 'Male' ? FRAMINGHAM_POINTS.MEN : FRAMINGHAM_POINTS.WOMEN;

    // 1. Age
    const ageKey = this.getRangeKey(data.age, Object.keys(table.AGE));
    points += table.AGE[ageKey] || 0;

    // 2. Col
    const cholAgeKey = this.getRangeKey(
      data.age,
      Object.keys(table.TOTAL_CHOLESTEROL),
    );
    const cholTable = table.TOTAL_CHOLESTEROL[cholAgeKey];
    const cholKey = this.getRangeKey(
      data.totalCholesterol,
      Object.keys(cholTable),
      true,
    );
    points += cholTable[cholKey] || 0;

    // 3. Smoke
    if (data.isSmoker) {
      const smokerAgeKey = this.getRangeKey(
        data.age,
        Object.keys(table.SMOKER),
      );
      points += table.SMOKER[smokerAgeKey] || 0;
    }

    // 4. HDL
    const hdlKey = this.getRangeKey(
      data.hdlCholesterol,
      Object.keys(table.HDL),
      true,
    );
    points += table.HDL[hdlKey] || 0;

    // 5. BP
    const bpAgeKey = data.isTreatedHypertension ? 'TREATED' : 'UNTREATED';
    const bpTable = table.SYSTOLIC_BP[bpAgeKey];
    const bpKey = this.getRangeKey(data.systolicBp, Object.keys(bpTable), true);
    points += bpTable[bpKey] || 0;

    // 6. Diabetes
    if (data.isDiabetic) points += data.gender === 'Male' ? 3 : 4;

    // Diagnosis Lookup
    let diagnosisString = table.DIAGNOSIS_PERCENT[points.toString()];
    if (!diagnosisString) {
      if (points < 9 && data.gender === 'Female') diagnosisString = '<1';
      else if (points < 0 && data.gender === 'Male') diagnosisString = '<1';
      else if (points > 25) diagnosisString = '>=30';
      else diagnosisString = 'Unknown';
    }

    let diagnosisNum = 0;
    if (diagnosisString.includes('<')) diagnosisNum = 0.5;
    else if (diagnosisString.includes('>=')) diagnosisNum = 30;
    else diagnosisNum = parseFloat(diagnosisString);

    return {
      points,
      diagnosisPercent: diagnosisNum,
      diagnosisCategory:
        diagnosisNum < 10 ? 'Low' : diagnosisNum < 20 ? 'Moderate' : 'High',
    };
  }

  private getRangeKey(
    value: number,
    keys: string[],
    isValueKeys = false,
  ): string {
    for (const key of keys) {
      if (key.includes('-')) {
        const [min, max] = key.split('-').map(Number);
        if (value >= min && value <= max) return key;
      } else if (key.startsWith('<')) {
        const max = Number(key.substring(1));
        if (value < max) return key;
      } else if (key.startsWith('>=')) {
        const min = Number(key.substring(2));
        if (value >= min) return key;
      } else if (key.startsWith('>')) {
        const min = Number(key.substring(1));
        if (value > min) return key;
      } else {
        if (Number(key) === value) return key;
      }
    }
    return keys[keys.length - 1];
  }
}
