import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { eq } from 'drizzle-orm';

import { AppModule } from '../src/app.module.js';
import { db } from '../src/index.js';
import { sessionsTable } from '../src/db/schema.js';
import { hashToken } from '../src/auth/token.js';

describe('Logout, log out everywhere, my devices, idle expiry (e2e)', () => {
  let app: INestApplication;
  const password = 'longpassword1';

  // ---------- helpers ----------

  // A new email every time, so a second run against the same database never gets 409.
  const newEmail = () => `sara+${Date.now()}${Math.random()}@test.com`;

  const server = () => app.getHttpServer();

  // Register a user and return her email.
  const registerUser = async () => {
    const email = newEmail();
    await request(server())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Sara',
        gymName: 'Fit Gym',
        timezone: 'Europe/Stockholm',
      })
      .expect(201);
    return email;
  };

  // Log in and return the "co-slot=..." part of Set-Cookie, ready for .set('Cookie', ...).
  const login = async (
    email: string,
    rememberMe = false,
    device = 'test-device',
  ) => {
    const res = await request(server())
      .post('/auth/login')
      .set('User-Agent', device)
      .send({ email, password, rememberMe })
      .expect(200);
    const setCookie = ([] as string[]).concat(
      res.headers['set-cookie'] ?? [],
    )[0];
    if (!setCookie) throw new Error('No Set-Cookie header');
    return setCookie.split(';')[0]; // "co-slot=abc..."
  };

  const tokenOf = (cookie: string) => cookie.slice('co-slot='.length);

  // Make a session look idle by moving last_used_at into the past.
  const makeIdle = async (cookie: string, minutesAgo: number) => {
    await db
      .update(sessionsTable)
      .set({ last_used_at: new Date(Date.now() - minutesAgo * 60 * 1000) })
      .where(eq(sessionsTable.token_hash, hashToken(tokenOf(cookie))));
  };

  const me = (cookie?: string) => {
    const req = request(server()).get('/auth/me');
    return cookie ? req.set('Cookie', cookie) : req;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- A3: log out ----------

  it('logout → 204, then the old cookie gets 401', async () => {
    const cookie = await login(await registerUser());

    const res = await request(server())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .expect(204);

    // the browser is told to forget the cookie
    const setCookie =
      ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0] ?? '';
    expect(setCookie).toMatch(/^co-slot=;/);

    // and the server forgot the session: a copied cookie is worthless now
    await me(cookie).expect(401);
  });

  it('logout without a cookie → 401', async () => {
    await request(server()).post('/auth/logout').expect(401);
  });

  it('logout removes the session row from the database', async () => {
    const cookie = await login(await registerUser());
    await request(server())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .expect(204);

    const rows = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token_hash, hashToken(tokenOf(cookie))));
    expect(rows).toHaveLength(0);
  });

  // ---------- A5: log out everywhere ----------

  it('logout-all from the phone → laptop gets 401, phone still gets 200', async () => {
    const email = await registerUser();
    const phone = await login(email, true, 'iPhone');
    const laptop = await login(email, true, 'MacBook');

    await request(server())
      .post('/auth/logout-all')
      .set('Cookie', phone)
      .expect(204);

    await me(laptop).expect(401);
    const res = await me(phone).expect(200);
    expect(res.body.email).toBe(email);
  });

  it('logout-all never touches another user', async () => {
    const sara = await login(await registerUser());
    const lisaEmail = await registerUser();
    const lisa = await login(lisaEmail);

    await request(server())
      .post('/auth/logout-all')
      .set('Cookie', sara)
      .expect(204);

    const res = await me(lisa).expect(200);
    expect(res.body.email).toBe(lisaEmail);
  });

  it('logout-all without a cookie → 401', async () => {
    await request(server()).post('/auth/logout-all').expect(401);
  });

  // ---------- A5: my devices ----------

  it('GET /auth/sessions → both devices, exactly one is current, no hash or token', async () => {
    const email = await registerUser();
    const phone = await login(email, false, 'iPhone');
    await login(email, false, 'MacBook');

    const res = await request(server())
      .get('/auth/sessions')
      .set('Cookie', phone)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(
      res.body.map((s: { user_agent: string }) => s.user_agent).sort(),
    ).toEqual(['MacBook', 'iPhone']);

    const current = res.body.filter((s: { current: boolean }) => s.current);
    expect(current).toHaveLength(1);
    expect(current[0].user_agent).toBe('iPhone');

    const text = JSON.stringify(res.body);
    expect(text).not.toContain('token_hash');
    expect(text).not.toContain(tokenOf(phone));
  });

  it('GET /auth/sessions without a cookie → 401', async () => {
    await request(server()).get('/auth/sessions').expect(401);
  });

  // ---------- A4: sessions die by themselves ----------

  it('not remembered, 16 minutes idle → 401', async () => {
    const cookie = await login(await registerUser(), false);
    await makeIdle(cookie, 16);
    await me(cookie).expect(401);
  });

  it('not remembered, 14 minutes idle → still 200 (edge of the limit)', async () => {
    const cookie = await login(await registerUser(), false);
    await makeIdle(cookie, 14);
    await me(cookie).expect(200);
  });

  it('remembered, 16 minutes idle → still 200', async () => {
    const cookie = await login(await registerUser(), true);
    await makeIdle(cookie, 16);
    await me(cookie).expect(200);
  });

  it('remembered, 8 days idle → 401', async () => {
    const cookie = await login(await registerUser(), true);
    await makeIdle(cookie, 8 * 24 * 60);
    await me(cookie).expect(401);
  });

  it('past expires_at (the 30-day hard end) → 401, even if used just now', async () => {
    const cookie = await login(await registerUser(), true);
    await db
      .update(sessionsTable)
      .set({ expires_at: new Date(Date.now() - 60 * 1000) })
      .where(eq(sessionsTable.token_hash, hashToken(tokenOf(cookie))));
    await me(cookie).expect(401);
  });

  it('using a session moves last_used_at forward (so active users stay logged in)', async () => {
    const cookie = await login(await registerUser(), false);
    await makeIdle(cookie, 10);
    await me(cookie).expect(200);

    const [row] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token_hash, hashToken(tokenOf(cookie))));
    expect(Date.now() - row!.last_used_at.getTime()).toBeLessThan(60 * 1000);
  });
});
