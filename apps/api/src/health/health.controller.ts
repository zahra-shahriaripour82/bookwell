import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../index.js';

@Controller('health')
export class HealthController {
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    try {
      await db.execute(sql`select 1`);
      return { api: 'ok', database: 'ok' };
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { api: 'ok', database: 'down' };
    }
  }
}
