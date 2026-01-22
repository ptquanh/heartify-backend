import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';

import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ name: 'encrypted_full_name', type: 'varchar' })
  encryptedFullName: string;

  @Column({ name: 'encrypted_phone', type: 'varchar', nullable: true })
  encryptedPhone: string;

  @Column({ name: 'email_hash', type: 'varchar', length: 64, unique: true })
  emailHash: string;

  @Column({ name: 'encrypted_email', type: 'varchar' })
  encryptedEmail: string;

  @Column({ name: 'encryption_version', type: 'smallint', default: 1 })
  encryptionVersion: number;
}
