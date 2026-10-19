import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('error format and request ids (e2e)', () => {
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

  it('returns 404 in our error format for an unknown route', async () => {
    const res = await request(app.getHttpServer())
      .get('/does-not-exist')
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('generates a UUID request ID when no header is provided', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);

    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('uses the provided request ID when available', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-ID', 'test-request-id')
      .expect(200);

    expect(res.headers['x-request-id']).toBe('test-request-id');
  });
  it('generates a new request ID when the provided ID is too long', async () => {
    const longId = 'a'.repeat(100);

    const res = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-ID', longId)
      .expect(200);

    expect(res.headers['x-request-id']).not.toBe(longId);

    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
