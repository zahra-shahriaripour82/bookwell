import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { AppModule } from './../src/app.module.js';
import { db } from './../src/index.js';
import { usersTable } from './../src/db/schema.js';

describe('POST /auth/register (e2e)', () => {
  let app: INestApplication;

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

  // a new email every time, so tests never clash with old rows
  const newEmail = () => `sara+${Date.now()}${Math.random()}@test.com`;


  it('creates a user → 201, without password_hash', async () => {
    const email = newEmail();

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'longpassword1', name: 'Sara' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe(email);
    expect(res.body.password_hash).toBeUndefined();  
  });

  it('same email again → 409 CONFLICT', async () => {
    const email = newEmail();
    const body = { email, password: 'longpassword1', name: 'Sara' };

    await request(app.getHttpServer()).post('/auth/register').send(body).expect(201);
    const res = await request(app.getHttpServer()).post('/auth/register').send(body).expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

 
  it('same email in CAPITALS → 409', async () => {
  const email = newEmail();

  // First request: lowercase email
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password: 'longpassword1',
      name: 'Sara',
    })
    .expect(201);

  // Second request: uppercase email
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: email.toUpperCase(),
      password: 'longpassword1',
      name: 'Sara',
    })
    .expect(409);

  expect(res.body.error.code).toBe('CONFLICT');
});


  it('invalid email → 400 BAD_REQUEST', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'none', password: 'longpassword1', name: 'Sara' })
      .expect(400);

    expect(res.body.error.code).toBe('BAD_REQUEST');
  });


 it('password of 7 characters → 400', async () => {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: newEmail(),
      password: '1234567',
      name: 'Sara',
    })
    .expect(400);

  expect(res.body.error.code).toBe('BAD_REQUEST');
});

  
it('extra field like role → 400', async () => {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: newEmail(),
      password: 'longpassword1',
      name: 'Sara',
      role: 'owner',
    })
    .expect(400);

  expect(res.body.error.code).toBe('BAD_REQUEST');
});

 it('stores an argon2id hash, never the password', async () => {
  const email = newEmail();
  const password = 'longpassword1';

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password, name: 'Sara' })
    .expect(201);

  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  expect(row.password_hash.startsWith('$argon2id$')).toBe(true);
  expect(row.password_hash).not.toContain(password);
});
});