import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { HealthController } from './health/health.controller.js';
import { AppController } from './app.controller.js';
import { genReqId } from './common/request-id.js';
import { AppService } from './app.service.js';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId,
        customProps: (req) => ({ requestId: req.id }),
      },
    }),
    AuthModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }) },
    
  ],
})
export class AppModule {}
