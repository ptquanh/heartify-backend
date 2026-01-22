import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';
import { User } from '@modules/user/entities/user.entity';

import { DiagnosisAssessment } from './entities/diagnosis-assessment.entity';

@Entity('health_records')
@Index('idx_health_history', ['userId', 'recordedAt'])
export class HealthRecord extends AuditWithTimezone {
  @ManyToOne(() => User, (user) => user.healthRecords)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({
    name: 'recorded_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  recordedAt: Date;

  @Column({ type: 'varchar', length: 10 })
  gender: string;

  @Column({ name: 'age_at_record', type: 'integer' })
  ageAtRecord: number;

  // Clinical Metrics (Plaintext as requested)
  @Column({ name: 'systolic_bp', type: 'integer' })
  systolicBp: number;

  @Column({ name: 'diastolic_bp', type: 'integer', nullable: true })
  diastolicBp: number;

  @Column({ name: 'total_cholesterol', type: 'integer' })
  totalCholesterol: number;

  @Column({ name: 'hdl_cholesterol', type: 'integer' })
  hdlCholesterol: number;

  @Column({ name: 'is_smoker', type: 'boolean', default: false })
  isSmoker: boolean;

  @Column({ name: 'is_diabetic', type: 'boolean', default: false })
  isDiabetic: boolean;

  @Column({ name: 'is_treated_hypertension', type: 'boolean', default: false })
  isTreatedHypertension: boolean;

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weightKg: number;

  @Column({ name: 'height_cm', type: 'integer', nullable: true })
  heightCm: number;

  @OneToMany(() => DiagnosisAssessment, (assessment) => assessment.healthRecord)
  diagnosisAssessments: DiagnosisAssessment[];
}
