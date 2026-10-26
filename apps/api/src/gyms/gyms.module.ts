import { Module } from '@nestjs/common';
import { GymsController } from './gyms.controller.js';
import { GymsService } from './gyms.service.js';

@Module({
  controllers: [GymsController],
  providers: [GymsService]
})
export class GymsModule {}
