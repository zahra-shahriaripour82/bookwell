import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';

describe(' gyms (e2e)', () => {
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

  it('returns 404 for an unknown gym', async () => {
    const res = await request(app.getHttpServer())
      .get('/gyms/00000000-0000-4000-8000-000000000000')
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('returns all gyms', async () => {
    const res = await request(app.getHttpServer()).get('/gyms').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('create gyms', async () => {
    const res = await request(app.getHttpServer())
      .post('/gyms')
      .send({
        name: 'Test Gym',
        timezone: 'America/New_York',
        contact_email: 'test@example.com',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Gym');
    expect(res.body.timezone).toBe('America/New_York');
    expect(res.body.contact_email).toBe('test@example.com');

    expect(res.headers['x-request-id']).toBeDefined();
  });
});
