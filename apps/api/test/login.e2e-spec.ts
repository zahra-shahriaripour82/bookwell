
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { eq } from 'drizzle-orm';

import { AppModule } from '../src/app.module.js';
import { db } from '../src/index.js';
import {
  usersTable,
  sessionsTable,
} from '../src/db/schema.js';
import { hashToken } from '../src/auth/token.js';

describe('Auth Login (e2e)', () => {
  let app: INestApplication;

  const email = 'login-test@example.com';
  const password = 'StrongPassword123';

  let userId: string;

  const validBody = () => ({
    email,
    password,
    name: 'Sara',
    gymName: 'Test Gym',
    timezone: 'Europe/Stockholm',
  });

  const getCookie = (res: SupertestResponse): string => {
    const cookies = res.headers['set-cookie'];

    if (!cookies) {
      throw new Error('Set-Cookie header is missing');
    }

    const cookie = Array.isArray(cookies)
      ? cookies[0]
      : cookies;

    if (!cookie?.startsWith('co-slot=')) {
      throw new Error('co-slot cookie is missing');
    }

    return cookie.slice('co-slot='.length).split(';')[0];
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validBody())
      .expect(201);

    userId = registerResponse.body.user?.id;

    if (!userId) {
      const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        throw new Error('Test user was not created');
      }

      userId = user.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should login successfully and return user without token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
        rememberMe: false,
      })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(email);
    expect(res.body).not.toHaveProperty('token');
  });

  it('should return a secure HttpOnly cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
        rememberMe: false,
      })
      .expect(200);

    const cookies = res.headers['set-cookie'];

    expect(cookies).toBeDefined();

    const cookieHeader = Array.isArray(cookies)
      ? cookies.join(';')
      : cookies;

    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('Secure');
    expect(cookieHeader).toContain('SameSite=Lax');
  });

  it('should reject wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'WrongPassword123',
        rememberMe: false,
      })
      .expect(401);
  });

  it('should reject unknown email with the same error message', async () => {
    const wrongPasswordResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'WrongPassword123',
        rememberMe: false,
      })
      .expect(401);

    const unknownEmailResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'unknown@example.com',
        password,
        rememberMe: false,
      })
      .expect(401);

    expect(unknownEmailResponse.body.error.message).toBe(
      wrongPasswordResponse.body.error.message,
    );
  });

  it('should return current user when valid cookie is provided', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
        rememberMe: false,
      })
      .expect(200);

    const cookie = getCookie(loginResponse);

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `co-slot=${cookie}`)
      .expect(200);

    expect(meResponse.body.email).toBe(email);
    expect(meResponse.body.id).toBe(userId);
  });

  it('should reject request without cookie', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('should reject fake cookie', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'co-slot=fake')
      .expect(401);
  });

  it('should store hashed token instead of raw token in database', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
        rememberMe: false,
      })
      .expect(200);

    const token = getCookie(loginResponse);
    const expectedHash = hashToken(token);

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token_hash, expectedHash));

    expect(session).toBeDefined();

    if (!session) {
      throw new Error('Session was not created');
    }

    expect(session.user_id).toBe(userId);
    expect(session.token_hash).toBe(expectedHash);
    expect(session.token_hash).not.toBe(token);
  });

  it('should create a new session for every successful login', async () => {
    const firstLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
        rememberMe: false,
      })
      .expect(200);

    const secondLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
        rememberMe: false,
      })
      .expect(200);

    const firstCookie = getCookie(firstLogin);
    const secondCookie = getCookie(secondLogin);

    expect(firstCookie).not.toBe(secondCookie);
  });
});
