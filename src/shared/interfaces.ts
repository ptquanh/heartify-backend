import { QueryRunner } from 'typeorm';

import { HEIGHT_UNIT, WEIGHT_UNIT } from './constants';

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

export interface BodyMetrics {
  weight?: {
    value: number;
    unit: WEIGHT_UNIT;
  };
  height?: {
    value: number;
    unit: HEIGHT_UNIT;
  };
  bmi?: number;
}
