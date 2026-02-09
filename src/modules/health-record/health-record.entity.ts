import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';
import {
  HealthRiskFactor,
  RiskAssessmentAlgorithm,
  RiskLevel,
} from '@modules/risk-assessment/risk-assessment.constants';
import { User } from '@modules/user/entities/user.entity';

import { BodyMetrics } from '@shared/interfaces';

export enum HealthRecordType {
  GENERAL_CHECKUP = 'GENERAL_CHECKUP',
  HOME_MEASUREMENT = 'HOME_MEASUREMENT',
  HOSPITAL_VISIT = 'HOSPITAL_VISIT',
}

@Entity('health_records')
@Index('idx_health_history', ['userId', 'recordedAt'])
export class HealthRecord extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.healthRecords)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'health_record_type',
    type: 'varchar',
  })
  healthRecordType: HealthRecordType;

  @Column({
    name: 'reason',
    type: 'text',
    nullable: true,
  })
  reason: string;

  @Column({
    name: 'doctor_name',
    type: 'varchar',
    nullable: true,
  })
  doctorName: string;

  @Column({
    name: 'recorded_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  recordedAt: Date;

  @Column({
    name: 'health_record_name',
    type: 'varchar',
    nullable: true,
  })
  healthRecordName: string;

  @Column({
    name: 'medical_facility_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  medicalFacilityName: string;

  @Column({ name: 'age_at_record', type: 'integer' })
  ageAtRecord: number;

  @Column({ name: 'systolic_bp', type: 'integer' })
  systolicBp: number;

  @Column({
    name: 'diastolic_bp',
    type: 'integer',
    nullable: true,
  })
  diastolicBp: number;

  @Column({
    name: 'total_cholesterol',
    type: 'decimal',
    precision: 6,
    scale: 2,
  })
  totalCholesterol: number;

  @Column({
    name: 'hdl_cholesterol',
    type: 'decimal',
    precision: 6,
    scale: 2,
  })
  hdlCholesterol: number;

  @Column({
    name: 'measurements',
    type: 'jsonb',
    nullable: true,
  })
  measurements: BodyMetrics;

  @Column({
    name: 'risk_level',
    type: 'varchar',
    length: 50,
  })
  riskLevel: RiskLevel;

  @Column({
    name: 'risk_score',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  riskScore: number;

  @Column({
    name: 'risk_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  riskPercentage: number;

  @Column({
    name: 'risk_algorithm',
    type: 'varchar',
    length: 50,
  })
  riskAlgorithm: RiskAssessmentAlgorithm;

  @Column({
    name: 'identified_risk_factors',
    type: 'jsonb',
    nullable: true,
  })
  identifiedRiskFactors: HealthRiskFactor[];
}
