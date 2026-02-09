import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';

@Entity('exercises')
export class Exercise extends AuditWithTimezone {
  @PrimaryColumn({ name: 'hash_id', type: 'varchar' })
  hashId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'body_part', type: 'varchar', length: 255, nullable: true })
  bodyPart: string;

  @Column({ name: 'equipment', type: 'varchar', length: 255, nullable: true })
  equipment: string;

  @Column({ name: 'gif_url', type: 'text', nullable: true })
  gifUrl: string;

  @Column({ name: 'target', type: 'varchar', length: 255, nullable: true })
  target: string;

  @Column({ name: 'secondary_muscles', type: 'jsonb', nullable: true })
  secondaryMuscles: string[];

  @Column({ name: 'instructions', type: 'jsonb', nullable: true })
  instructions: string[];
}
