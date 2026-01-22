import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';
import { HealthRecord } from '@modules/diagnosis/health-record.entity';

import { ENTITY_STATUS } from '@shared/constants';

import { UserProfile } from './user-profile.entity';

@Entity('users')
export class User extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: ENTITY_STATUS.ACTIVE })
  status: ENTITY_STATUS;

  @Column({ type: 'varchar', unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  username: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => HealthRecord, (record) => record.user)
  healthRecords: HealthRecord[];
}
