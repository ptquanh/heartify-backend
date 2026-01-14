import {
  AxiosHttpService,
  RedisService,
  stringUtils,
  workflows,
} from 'mvc-common-toolkit';

import { Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ENV_KEY, INJECTION_TOKEN } from '@shared/constants';

const httpServiceProvider: Provider = {
  provide: INJECTION_TOKEN.HTTP_SERVICE,
  useFactory: () => {
    return new AxiosHttpService();
  },
};

const redisServiceProvider: Provider = {
  provide: INJECTION_TOKEN.REDIS_SERVICE,
  useFactory: (config: ConfigService) => {
    return new RedisService({
      host: config.get(ENV_KEY.REDIS_HOST, 'localhost'),
      port: config.get(ENV_KEY.REDIS_PORT, 6379),
      password: config.get(ENV_KEY.REDIS_PASSWORD),
      keyPrefix: config.get(ENV_KEY.SERVICE_NAME, 'greenflag-backend'),
    });
  },
  inject: [ConfigService],
};

const JwtModuleProvider = JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('JwtModule');
    let secret = configService.get(ENV_KEY.JWT_SECRET);
    if (!secret) {
      logger.warn(
        'JWT_SECRET config is not set. A random secret will be used, and all JWTs will be invalid after a restart.',
      );

      secret = stringUtils.generatePassword();
    }
    return {
      secret,
      signOptions: {
        expiresIn: configService.get(ENV_KEY.JWT_EXPIRATION, '24h'),
      },
    };
  },
});

const syncTaskQueueProvider: Provider = {
  provide: INJECTION_TOKEN.SYNC_TASK_QUEUE,
  useFactory: () => {
    return new workflows.SyncTaskQueue();
  },
};

@Global()
@Module({
  providers: [httpServiceProvider, redisServiceProvider, syncTaskQueueProvider],
  exports: [
    INJECTION_TOKEN.HTTP_SERVICE,
    INJECTION_TOKEN.REDIS_SERVICE,
    INJECTION_TOKEN.SYNC_TASK_QUEUE,
    JwtModuleProvider,
  ],
  imports: [JwtModuleProvider],
})
export class GlobalModule {}
