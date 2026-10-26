import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../index.js';
import { gymsTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';

@Injectable()
export class GymsService {
  async findAll() {
    return db.select().from(gymsTable);
  }

  async findOne(id: string) {
    const [gym] = await db.select().from(gymsTable).where(eq(gymsTable.id, id));

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    return gym;
  }

  async create(data: {
    name: string;
    timezone: string;
    contact_email: string;
  }) {
    const [gym] = await db.insert(gymsTable).values(data).returning();

    return gym;
  }
}
