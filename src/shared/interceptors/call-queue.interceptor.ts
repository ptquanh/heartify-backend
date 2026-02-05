import { LRUCache } from 'lru-cache';
import {
  Observable,
  TimeoutError,
  catchError,
  finalize,
  throwError,
  timeout,
} from 'rxjs';

import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
  Optional,
  SetMetadata,
  UseInterceptors,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  DEFAULT_MAX_CONCURRENT_CALL,
  ERR_CODE,
  HEADER_KEY,
  METADATA_KEY,
} from '@shared/constants';

export const MaxConcurrencyCall = (maxConcurrency: number) =>
  SetMetadata(METADATA_KEY.MAX_CONCURRENCY_CALL, maxConcurrency);

@Injectable()
export class CallQueueInterceptor implements NestInterceptor {
  protected logger = new Logger(CallQueueInterceptor.name);

  constructor(
    protected reflector: Reflector,

    @Optional()
    protected cacheEngine = new LRUCache({
      max: 1000000,
    }),
  ) {}

  public async intercept(
    ctx: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const httpReq: any = ctx.switchToHttp().getRequest();
    const logId = httpReq.headers[HEADER_KEY.LOG_ID];

    const userIP =
      httpReq.ip ||
      httpReq.headers['x-forwarded-for']?.split(',').shift() ||
      httpReq.connection?.remoteAddress ||
      'unknown_ip';

    const method = httpReq.method;
    const user = httpReq.activeUser || httpReq.user || { id: userIP };

    const reqUrl = httpReq.url;
    const userId = user.id;

    const cacheKey = `${userId}:${method}:${reqUrl}`;

    const existingValue =
      (this.cacheEngine.get(cacheKey) as number | undefined) || 0;

    const maxConcurrencyCall =
      this.reflector.get(METADATA_KEY.MAX_CONCURRENCY_CALL, ctx.getHandler()) ||
      DEFAULT_MAX_CONCURRENT_CALL;

    const newValue = existingValue + 1;

    if (newValue > maxConcurrencyCall) {
      this.logger.warn(
        `user ${user.id} exceeded concurrency limit for cache key ${cacheKey}`,
      );

      return throwError(() => {
        return new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: 'Max concurrency call reached!',
            error: ERR_CODE.ALREADY_EXISTS,
          },
          HttpStatus.CONFLICT,
        );
      });
    }

    this.cacheEngine.set(cacheKey, newValue);

    return next.handle().pipe(
      timeout(60 * 3 * 1000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          this.logger.error(
            `Timeout error for user ${user.id}. Path: ${cacheKey}`,
          );
        }
        return throwError(() => {
          return new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message: 'Max concurrency call reached!',
              error: ERR_CODE.ALREADY_EXISTS,
            },
            HttpStatus.CONFLICT,
          );
        });
      }),
      finalize(() => {
        const existingValue =
          (this.cacheEngine.get(cacheKey) as number | undefined) || 0;

        if (existingValue === 0) {
          return;
        }

        const newValue = existingValue - 1;

        this.cacheEngine.set(cacheKey, newValue);
      }),
    );
  }
}

export function UseCallQueue(maxConcurrency = 1) {
  return applyDecorators(
    MaxConcurrencyCall(maxConcurrency),
    UseInterceptors(CallQueueInterceptor),
  );
}
