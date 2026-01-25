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
}
