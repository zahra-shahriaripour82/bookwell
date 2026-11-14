import { usersTable, gymsTable, membershipsTable, sessionsTable } from '../db/schema.js';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { hash, verify } from '@node-rs/argon2';
import { db } from '../index.js';
import { LoginDto } from './dto/login.dto.js';

import { eq } from 'drizzle-orm';
import { hashToken, newToken } from './token.js';

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


async login(dto: LoginDto, userAgent: string| undefined) {
  
  const email = dto.email.toLowerCase().trim();
const DUMMY_HASH = await hash('not-a-real-password');  
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

const ok = await verify(user?.password_hash ?? DUMMY_HASH, dto.password);
if (!user || !ok) throw new UnauthorizedException('Email or password is wrong');

// user is found and the password is right → make the token and the session

  if (!ok) {
    throw new UnauthorizedException(
      'Email or password is wrong',
    );
  }

  
  const token = newToken();

  
  await db.insert(sessionsTable).values({
    token_hash: hashToken(token),
    user_id: user.id,
    remember_me: dto.rememberMe,
    user_agent: userAgent ?? null,
    expires_at: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ),
  });

  // 6. Return token and user
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}


}