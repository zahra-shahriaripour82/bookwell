import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { hashToken } from './token.js';
import { db } from '../index.js';
import { sessionsTable, usersTable } from '../db/schema.js';
import { and, eq, gt } from 'drizzle-orm';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 1. read the co-slot cookie from the Cookie header
    const token = (req.headers.cookie ?? '')
      .split(';')
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith('co-slot='))
      ?.slice('co-slot='.length);
    if (!token) throw new UnauthorizedException('Not logged in');

    const [row] = await db
      .select({
        session: sessionsTable,
        user: {
          id: usersTable.id,
          email: usersTable.email,
          name: usersTable.name,
        },
      })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.user_id, usersTable.id))
      .where(
        and(
          eq(sessionsTable.token_hash, hashToken(token)),
          gt(sessionsTable.expires_at, new Date()),
        ),
      );
    if (!row) throw new UnauthorizedException('Not logged in');

    await db
      .update(sessionsTable)
      .set({ last_used_at: new Date() })
      .where(eq(sessionsTable.id, row.session.id));

    const idleLimitMs = row.session.remember_me
      ? 7 * 24 * 60 * 60 * 1000
      : 15 * 60 * 1000;

    if (Date.now() - row.session.last_used_at.getTime() > idleLimitMs) {
      await db
        .delete(sessionsTable)
        .where(eq(sessionsTable.id, row.session.id));
      throw new UnauthorizedException('Not logged in');
    }

    req.user = row.user;
    req.sessionId = row.session.id;
    return true;
  }
}
