import { Request } from 'express';
import { CacheService, SET_CACHE_POLICY } from 'mvc-common-toolkit';
import { Observable, throwError } from 'rxjs';

import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  SetMetadata,
  UseInterceptors,
  applyDecorators,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { INJECTION_TOKEN, METADATA_KEY } from '@shared/constants';

@Injectable()
export class RateLimitingInterceptor implements NestInterceptor {
  constructor(
    protected configService: ConfigService,
    protected reflector: Reflector,

    @Inject(INJECTION_TOKEN.REDIS_SERVICE)
    protected cacheService: CacheService,
  ) {}

  public async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const rateLimit =
      this.reflector.get(METADATA_KEY.RATE_LIMITING, context.getHandler()) ||
      60;

    const request: Request = context.switchToHttp().getRequest();
    const requestIp = request.ips.length ? request.ips[0] : request.ip;
    const endpoint = context.switchToHttp().getRequest().originalUrl;
    const method = context.switchToHttp().getRequest().method;

    const key = `route_rate_limiting:${endpoint}:${method}:${requestIp}`;
    const userReqCount = (parseInt(await this.cacheService.get(key)) || 0) + 1;

    if (userReqCount > rateLimit) {
      return throwError(() => {
        return new BadRequestException('too many request');
      });
    }

    await this.cacheService.set(key, userReqCount, {
      policy: SET_CACHE_POLICY.WITH_TTL,
      value: 60,
    });

    return next.handle();
  }
}

export const ReqPerMinute = (reqPerMinute: number) =>
  SetMetadata(METADATA_KEY.RATE_LIMITING, reqPerMinute);

export const ApplyRateLimiting = (req_per_minute = 60) => {
  return applyDecorators(
    UseInterceptors(RateLimitingInterceptor),
    ReqPerMinute(req_per_minute),
  );
};
