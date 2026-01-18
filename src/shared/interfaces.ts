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

export interface AppRequest extends Request {
  id: string;
  user: any;
  partner: any;
  startTime: Date;
}
export interface UserAuthProfile {
  id: string;
  email: string;
  username: string;
}

export interface UserAuthSocialProfile {
  provider: string;
  providerUserId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  referrerCode?: string;
}
