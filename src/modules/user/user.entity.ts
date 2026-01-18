import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';

import { ENTITY_STATUS } from '@shared/constants';

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

  @Column({ default: ENTITY_STATUS.INACTIVE })
  status: ENTITY_STATUS;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;
}
