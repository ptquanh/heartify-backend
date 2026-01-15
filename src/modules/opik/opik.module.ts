import { Opik } from 'opik';
import { ENV_KEY, INJECTION_TOKEN } from 'src/shared/constants';

import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const opikServiceProvider: Provider = {
  provide: INJECTION_TOKEN.OPIK_SERVICE,
  useFactory: (config: ConfigService) => {
    return new Opik({
      apiKey: config.getOrThrow(ENV_KEY.OPIK_API_KEY),
      projectName: config.getOrThrow(ENV_KEY.OPIK_PROJECT),
      workspaceName: config.getOrThrow(ENV_KEY.OPIK_WORKSPACE),
    });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [opikServiceProvider],
  exports: [INJECTION_TOKEN.OPIK_SERVICE],
})
export class OpikModule {}
