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
  context: RequestContextData;
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

export interface RequestContextData {
  user?: UserAuthProfile;
  trace: string;
  span: string;
  parentSpan?: string;
}

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'inch';

export interface BodyMetrics {
  weight?: {
    value: number;
    unit: WeightUnit;
  };
  height?: {
    value: number;
    unit: HeightUnit;
  };
  bmi?: number;
}
