import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '@modules/audit/audit.module';
import { GlobalModule } from '@modules/global/global.module';
import { OpikModule } from '@modules/opik/opik.module';
import { TestOpikModule } from '@modules/test-opik/test-opik.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('DB_HOST'),
        port: +configService.getOrThrow('DB_PORT'),
        username: configService.getOrThrow('DB_USERNAME'),
        password: configService.getOrThrow('DB_PASSWORD'),
        database: configService.getOrThrow('DB_SCHEMA'),
        autoLoadEntities: true,
        entities: [],
        synchronize:
          configService.get('DB_SYNCHRONIZE')?.toLowerCase() === 'true',
        logging: configService.get('DB_LOGGING')?.toLowerCase() === 'true',
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    GlobalModule,
    AuditModule,
    OpikModule,
    TestOpikModule,
  ],
})
export class AppModule {}
