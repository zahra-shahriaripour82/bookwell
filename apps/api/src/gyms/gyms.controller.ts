import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GymsService } from './gyms.service.js';

@Controller('gyms')
export class GymsController {
  constructor(private gymsService: GymsService) {}

  @Get()
  findAll() {
    return this.gymsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }

  @Post()
  create(
    @Body() body: { name: string; timezone: string; contact_email: string },
  ) {
    return this.gymsService.create(body);
  }
}
