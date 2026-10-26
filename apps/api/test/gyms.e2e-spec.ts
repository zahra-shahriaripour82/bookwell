import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from "@nestjs/common";
import { GymsModule } from '../src/gyms/gyms.module.js';

describe('error format and request ids (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GymsModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });





it('returns all gyms', async () => {
  const res = await request(app.getHttpServer())
    .get('/gyms')
    .expect(200);

  expect(Array.isArray(res.body)).toBe(true);
     expect(res.body.requestId).toBe(res.headers['x-request-id']);
});

it('create gyms', async () => {
  const res = await request(app.getHttpServer())
    .post('/gyms')
    .send({
        name:'Test Gym',
        timezone:'America/New_York',
        contact_email:'test@example.com'
    })
    .expect(201);

  expect(res.body).toHaveProperty('id');
 expect(res.body.name).toBe('Test Gym');
 expect(res.body.timezone).toBe('America/New_York');
  expect(res.body.contact_email).toBe('test@example.com');

   expect(res.body.requestId).toBe(res.headers['x-request-id']);
});

});