import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { ENTITY_STATUS } from '@shared/constants';
import { AuditWithTimezone } from '@shared/models/audit.model';

@Entity('users')
export class User extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: ENTITY_STATUS.ACTIVE })
  status: ENTITY_STATUS;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;
}
