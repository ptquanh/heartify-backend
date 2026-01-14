import { QueryRunner } from 'typeorm';

export interface PaginationResult<T = any> {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface RunnerUser {
  alias: string;
  runner: QueryRunner;
}
