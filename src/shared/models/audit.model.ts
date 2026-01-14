import {
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

export class Audit {
  @CreateDateColumn({
    name: 'created_at',
  })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    select: false,
  })
  deletedAt: Date;
}

export class AuditWithTimezone {
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    select: false,
  })
  deletedAt: Date;
}
