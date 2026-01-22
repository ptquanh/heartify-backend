import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';

import { HealthRecord } from './health-record.entity';

@Entity('diagnosis_assessments')
export class DiagnosisAssessment extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => HealthRecord, (record) => record.diagnosisAssessments)
  @JoinColumn({ name: 'health_record_id' })
  healthRecord: HealthRecord;

  @Column({ name: 'health_record_id' })
  healthRecordId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'framingham_cardiovascular_10yr',
  })
  algorithm: string;

  @Column({
    name: 'diagnosis_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  diagnosisPercent: number;

  @Column({ name: 'diagnosis_category', type: 'varchar', length: 20 })
  diagnosisCategory: string; // low, medium, high, critical

  @Column({ name: 'input_snapshot', type: 'jsonb', nullable: true })
  inputSnapshot: any;

  @Column({
    name: 'opik_trace_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  opikTraceId: string;

  @Column({ name: 'ai_advice_summary', type: 'text', nullable: true })
  aiAdviceSummary: string;
}
