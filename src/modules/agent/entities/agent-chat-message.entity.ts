import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';
import { User } from '@modules/user/entities/user.entity';

import { AGENT_CHAT_MESSAGE_ROLE } from '@shared/constants';

@Entity('agent_chat_messages')
export class AgentChatMessage extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'text',
    enum: [AGENT_CHAT_MESSAGE_ROLE.USER, AGENT_CHAT_MESSAGE_ROLE.ASSISTANT],
  })
  role: AGENT_CHAT_MESSAGE_ROLE;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
