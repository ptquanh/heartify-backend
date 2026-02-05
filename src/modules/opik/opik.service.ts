import { Opik } from 'opik';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { INJECTION_TOKEN } from '@shared/constants';

@Injectable()
export class OpikService {
  private readonly logger = new Logger(OpikService.name);

  constructor(
    @Inject(INJECTION_TOKEN.OPIK_SERVICE)
    private readonly opikClient: Opik,
  ) {}

  trace(traceParams: any) {
    try {
      this.opikClient.trace(traceParams);
    } catch (error) {
      this.logger.error('Failed to send trace to Opik', error);
    }
  }
}
