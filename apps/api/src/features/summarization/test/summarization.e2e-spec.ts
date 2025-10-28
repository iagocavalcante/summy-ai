/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { TestDatabase } from '../../../../test/test-db.setup';
import {
  setupTestApp,
  delay,
  mockLLMResponse,
} from '../../../../test/test-helpers';
import { LLMService } from '../../llm/llm.service';

describe('Summarization API (e2e)', () => {
  let app: INestApplication;
  let testDb: TestDatabase;
  let llmService: LLMService;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupTestApp(app);
    await app.init();

    llmService = moduleFixture.get<LLMService>(LLMService);
  });

  afterAll(async () => {
    await testDb.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await testDb.cleanup();
  });

  describe('POST /summarization', () => {
    it('should create a summarization request successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'This is a test article about technology.' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
      expect(typeof response.body.id).toBe('string');
    });

    it('should reject empty text', async () => {
      const response = await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: '' })
        .expect(400);

      expect(response.body.message).toContain('text should not be empty');
    });

    it('should reject missing text field', async () => {
      await request(app.getHttpServer())
        .post('/summarization')
        .send({})
        .expect(400);
    });

    it('should reject text that is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Hi' })
        .expect(400);

      const messages = Array.isArray(response.body.message)
        ? response.body.message
        : [response.body.message];
      expect(messages.join(' ')).toContain('at least 10 characters');
    });

    it('should accept optional userId', async () => {
      const response = await request(app.getHttpServer())
        .post('/summarization')
        .send({
          text: 'This is a test article about technology.',
          userId: 'user123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');
    });
  });

  describe('GET /summarization/:id', () => {
    it('should retrieve a summarization by id', async () => {
      // Create a request first
      const createResponse = await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'This is a test article about technology.' })
        .expect(201);

      const { id } = createResponse.body;

      // Retrieve it
      const getResponse = await request(app.getHttpServer())
        .get(`/summarization/${id}`)
        .expect(200);

      expect(getResponse.body.id).toBe(id);
      expect(getResponse.body).toHaveProperty('originalText');
      expect(getResponse.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent id', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/summarization/${fakeId}`)
        .expect(404);
    });
  });

  describe('GET /summarization', () => {
    it('should retrieve all summarizations with default limit', async () => {
      // Create multiple requests
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'First test article.' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Second test article.' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/summarization')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      // Create 3 requests
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/summarization')
          .send({ text: `Test article ${i + 1}.` })
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/summarization?limit=2')
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('should filter by status', async () => {
      // Create a request
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Test article.' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/summarization?status=PENDING')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: { status: string }) => {
        expect(item.status).toBe('PENDING');
      });
    });

    it('should return empty array when filtering by non-matching status', async () => {
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Test article.' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/summarization?status=COMPLETED')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should reject invalid status values', async () => {
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Test article for testing status filter.' })
        .expect(201);

      // Invalid status should be rejected with 400
      await request(app.getHttpServer())
        .get('/summarization?status=INVALID_STATUS')
        .expect(400);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should complete full summarization workflow', async () => {
      // Mock LLM service
      jest.spyOn(llmService, 'summarize').mockResolvedValue(mockLLMResponse);

      // 1. Create request
      const createResponse = await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'This is a test article about technology.' })
        .expect(201);

      const { id } = createResponse.body;
      expect(createResponse.body.status).toBe('PENDING');

      // 2. Wait for processing
      await delay(500);

      // 3. Check status has changed
      const statusResponse = await request(app.getHttpServer())
        .get(`/summarization/${id}`)
        .expect(200);

      expect(['PENDING', 'PROCESSING', 'COMPLETED']).toContain(
        statusResponse.body.status,
      );

      // 4. Verify in list
      const listResponse = await request(app.getHttpServer())
        .get('/summarization')
        .expect(200);

      const found = listResponse.body.find(
        (item: { id: string }) => item.id === id,
      );
      expect(found).toBeDefined();
    }, 10000);
  });
});
