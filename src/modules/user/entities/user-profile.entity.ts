import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';
import { Gender } from '@modules/risk-assessment/risk-assessment.constants';

import { BodyMetrics } from '@shared/interfaces';

import { User } from './user.entity';

export interface HealthConditionEntry {
  options: string[];
  details?: string;
}

@Entity('user_profiles')
export class UserProfile extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({
    name: 'gender',
    type: 'enum',
    enum: Gender,
    default: Gender.MALE,
  })
  gender: Gender;

  @Column({
    name: 'latest_measurements',
    type: 'jsonb',
    nullable: true,
  })
  latestMeasurements: BodyMetrics;

  @Column({ name: 'country', type: 'varchar', length: 3 })
  country: string;

  @Column({ name: 'allergies', type: 'jsonb', nullable: true })
  allergies: HealthConditionEntry;

  @Column({ name: 'medical_conditions', type: 'jsonb', nullable: true })
  medicalConditions: HealthConditionEntry;

  @Column({ name: 'medications', type: 'jsonb', nullable: true })
  medications: HealthConditionEntry;

  @Column({ name: 'physical_limitations', type: 'jsonb', nullable: true })
  physicalLimitations: HealthConditionEntry;
}
