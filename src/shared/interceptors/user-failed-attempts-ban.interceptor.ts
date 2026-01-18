import {
  AuditService,
  ErrorLog,
  RedisService,
  scripts,
} from 'mvc-common-toolkit';
import { Observable, lastValueFrom, of } from 'rxjs';

import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  SetMetadata,
  UseInterceptors,
  applyDecorators,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { UserService } from '@modules/user/user.service';

import {
  APP_ACTION,
  DEFAULT_FAILED_ATTEMPTS_BAN,
  ENTITY_STATUS,
  INJECTION_TOKEN,
  METADATA_KEY,
} from '@shared/constants';

import { UserAPICallInterceptor } from './user-api-call.interceptor';

@Injectable()
export class UserInvalidAttemptBanInterceptor
  extends UserAPICallInterceptor
  implements NestInterceptor
{
  protected logger = new Logger(UserInvalidAttemptBanInterceptor.name);

  constructor(
    configService: ConfigService,
    reflector: Reflector,

    @Inject(INJECTION_TOKEN.REDIS_SERVICE)
    protected cacheEngine: RedisService,

    @Inject(INJECTION_TOKEN.AUDIT_SERVICE)
    protected auditService: AuditService,

    protected userService: UserService,
  ) {
    super(configService, reflector);
  }

  public async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const { routeIdentifier, userId, logId } =
      this.getUserAndAPICallInfo(context);

    const maxAttemptsAllowed =
      this.reflector.get(
        METADATA_KEY.MAX_ATTEMPTS_ALLOWED,
        context.getHandler(),
      ) ?? DEFAULT_FAILED_ATTEMPTS_BAN;

    let responseBody: any;

    try {
      responseBody = await lastValueFrom(next.handle());

      if (responseBody?.success) return of(responseBody);
      if (responseBody?.httpCode === HttpStatus.FORBIDDEN) {
        await this.increaseForbiddenCount(
          userId,
          routeIdentifier,
          maxAttemptsAllowed,
          logId,
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        await this.increaseForbiddenCount(
          userId,
          routeIdentifier,
          maxAttemptsAllowed,
          logId,
        );
      }

      throw error;
    }

    return of(responseBody);
  }

  protected async increaseForbiddenCount(
    userId: string,
    routeIdentifier: string,
    maxAttemptsAllowed: number,
    logId: string,
  ) {
    const failedAttemptCacheKey = `user:${userId}:route:${routeIdentifier}:failed-attempts`;

    try {
      const result = await this.cacheEngine.eval(
        scripts.luaScripts.incrementAndCompareNumber(),
        1,
        failedAttemptCacheKey,
        'gte',
        maxAttemptsAllowed,
        60 * 60 * 24 * 30, // TTL
      );

      if (Number(result) === 1) {
        const msg = `userId ${userId} locked for reaching max attempts`;
        this.auditService.emitLog(
          new ErrorLog({
            message: msg,
            action: APP_ACTION.BAN_TOO_MANY_FAILED_ATTEMPTS,
            logId,
            userId,
            payload: {
              cacheKey: failedAttemptCacheKey,
            },
          }),
        );

        const user = await this.userService.findByID(userId);

        await Promise.all([
          this.userService.updateByID(userId, {
            status: ENTITY_STATUS.SUSPENDED,
            metadata: {
              ...user.metadata,
              reason: 'reached_max_failed_attempts',
              endpoint: routeIdentifier,
            },
          }),
          this.cacheEngine.del(failedAttemptCacheKey),
        ]);
      }
    } catch (error) {
      this.logger.error(error.message, error.stack);
      this.auditService.emitLog(
        new ErrorLog({
          message: error.message,
          action: APP_ACTION.BAN_TOO_MANY_FAILED_ATTEMPTS,
          logId,
          userId,
          payload: {
            cacheKey: failedAttemptCacheKey,
          },
        }),
      );
    }
  }
}

export function UseMaxAttempts(maxAttemptsAllowed = 3) {
  return applyDecorators(
    UseInterceptors(UserInvalidAttemptBanInterceptor),
    SetMetadata(METADATA_KEY.MAX_ATTEMPTS_ALLOWED, maxAttemptsAllowed),
  );
}
