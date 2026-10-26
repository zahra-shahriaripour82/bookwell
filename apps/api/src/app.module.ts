import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { LoggerModule } from 'nestjs-pino';
import { genReqId } from './common/request-id.js';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { GymsModule } from './gyms/gyms.module.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId,
        customProps: (req) => ({ requestId: req.id }),
      },
    }),
    GymsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
