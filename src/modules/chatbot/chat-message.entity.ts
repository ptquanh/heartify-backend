import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';
import { User } from '@modules/user/entities/user.entity';

import { CHATBOT_MESSAGE_ROLE } from '@shared/constants';

@Entity('chat_messages')
export class ChatMessage extends AuditWithTimezone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'text', enum: ['user', 'model'] })
  role: CHATBOT_MESSAGE_ROLE;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
