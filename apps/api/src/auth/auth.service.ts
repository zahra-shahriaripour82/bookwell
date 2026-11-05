import { usersTable, gymsTable, membershipsTable } from '../db/schema.js';
import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { hash } from '@node-rs/argon2';
import { db } from '../index.js';

@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const password_hash = await hash(dto.password);

    try {
      const result = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(usersTable)
          .values({ email, password_hash, name: dto.name })
          .returning({ id: usersTable.id, email: usersTable.email });

        const [gym] = await tx
          .insert(gymsTable)
          .values({
            name: dto.gymName,
            timezone: dto.timezone,
            contact_email: email,
          })
          .returning({ id: gymsTable.id, name: gymsTable.name });

        await tx.insert(membershipsTable).values({
          user_id: user.id,
          gym_id: gym.id,
          role: 'owner',
          status: 'active',
        });

        return { user, gym };
      });
      return result;
    } catch (err) {
      const code = (err as { cause?: { code?: string } }).cause?.code;
      if (code === '23505') {
        throw new ConflictException('This email already has an account');
      }
      throw err;
    }
  }
}
