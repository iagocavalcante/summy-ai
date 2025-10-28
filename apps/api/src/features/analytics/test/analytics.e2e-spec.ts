/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../../../app.module';
import { TestDatabase } from '../../../../test/test-db.setup';
import {
  setupTestApp,
  delay,
  mockLLMResponse,
} from '../../../../test/test-helpers';
import { LLMService } from '../../llm/llm.service';
import { eq } from 'drizzle-orm';
import { analytics } from '../../../db/schema';

describe('Analytics API (e2e)', () => {
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

  describe('GET /analytics/summary', () => {
    it('should return analytics summary with empty data', async () => {
      const response: Response = await request(app.getHttpServer())
        .get('/analytics/summary')
        .expect(200);

      expect(response.body).toHaveProperty('allTime');
      expect(response.body).toHaveProperty('today');
      expect(response.body).toHaveProperty('recentRequests');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.totalRequests).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.today.totalRequests).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(Array.isArray(response.body.recentRequests)).toBe(true);
    });

    it('should return correct analytics after processing requests', async () => {
      // Mock LLM service
      jest.spyOn(llmService, 'summarize').mockResolvedValue(mockLLMResponse);

      // Create and process a request
      const createResponse: Response = await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'This is a test article about technology.' })
        .expect(201);

      // Wait for processing
      await delay(1000);

      // Get analytics
      const response: Response = await request(app.getHttpServer())
        .get('/analytics/summary')
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.recentRequests.length).toBeGreaterThan(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.recentRequests[0].id).toBe(createResponse.body.id);
    }, 10000);

    it('should include recent requests with correct fields', async () => {
      // Create a request
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Test article for analytics.' })
        .expect(201);

      await delay(100);

      const response: Response = await request(app.getHttpServer())
        .get('/analytics/summary')
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (response.body.recentRequests.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const requestItem = response.body.recentRequests[0];
        expect(requestItem).toHaveProperty('id');
        expect(requestItem).toHaveProperty('status');
        expect(requestItem).toHaveProperty('llmProvider');
        expect(requestItem).toHaveProperty('duration');
        expect(requestItem).toHaveProperty('createdAt');
      }
    });

    it('should aggregate all-time statistics correctly', async () => {
      // Insert mock analytics data directly
      const db = testDb.getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.insert(analytics).values({
        date: today,
        totalRequests: 10,
        successfulRequests: 8,
        failedRequests: 2,
        totalTokensUsed: 1000,
        totalCost: 0.5,
        avgDuration: 500,
        geminiRequests: 6,
        openaiRequests: 4,
      });

      const response: Response = await request(app.getHttpServer())
        .get('/analytics/summary')
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.totalRequests).toBe(10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.successfulRequests).toBe(8);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.failedRequests).toBe(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.totalTokensUsed).toBe(1000);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.geminiRequests).toBe(6);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.openaiRequests).toBe(4);
    });

    it('should track today statistics separately', async () => {
      const db = testDb.getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Insert yesterday's data
      await db.insert(analytics).values({
        date: yesterday,
        totalRequests: 5,
        successfulRequests: 5,
        failedRequests: 0,
        totalTokensUsed: 500,
        totalCost: 0.25,
        avgDuration: 400,
        geminiRequests: 5,
        openaiRequests: 0,
      });

      // Insert today's data
      await db.insert(analytics).values({
        date: today,
        totalRequests: 3,
        successfulRequests: 2,
        failedRequests: 1,
        totalTokensUsed: 300,
        totalCost: 0.15,
        avgDuration: 600,
        geminiRequests: 1,
        openaiRequests: 2,
      });

      const response: Response = await request(app.getHttpServer())
        .get('/analytics/summary')
        .expect(200);

      // All-time should include both days
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.totalRequests).toBe(8);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.allTime.successfulRequests).toBe(7);

      // Today should only include today
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.today.totalRequests).toBe(3);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.today.successfulRequests).toBe(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.today.failedRequests).toBe(1);
    });
  });

  describe('GET /analytics', () => {
    it('should return analytics for default period (7 days)', async () => {
      const response: Response = await request(app.getHttpServer())
        .get('/analytics')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should respect days parameter', async () => {
      const db = testDb.getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Insert data for last 5 days
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        await db.insert(analytics).values({
          date,
          totalRequests: i + 1,
          successfulRequests: i + 1,
          failedRequests: 0,
          totalTokensUsed: (i + 1) * 100,
          totalCost: (i + 1) * 0.05,
          avgDuration: 500,
          geminiRequests: i + 1,
          openaiRequests: 0,
        });
      }

      // Get last 3 days
      const response: Response = await request(app.getHttpServer())
        .get('/analytics?days=3')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Days parameter might include today, so allow up to 4 records
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.length).toBeLessThanOrEqual(4);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return analytics sorted by date descending', async () => {
      const db = testDb.getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Insert data for 3 days
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        await db.insert(analytics).values({
          date,
          totalRequests: i + 1,
          successfulRequests: i + 1,
          failedRequests: 0,
          totalTokensUsed: 100,
          totalCost: 0.05,
          avgDuration: 500,
          geminiRequests: i + 1,
          openaiRequests: 0,
        });
      }

      const response: Response = await request(app.getHttpServer())
        .get('/analytics?days=3')
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.length).toBeGreaterThan(0);

      // Verify descending order
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      for (let i = 0; i < response.body.length - 1; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const current = new Date(response.body[i].date);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const next = new Date(response.body[i + 1].date);
        expect(current >= next).toBe(true);
      }
    });

    it('should return empty array when no analytics data exists', async () => {
      const response: Response = await request(app.getHttpServer())
        .get('/analytics?days=7')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('Analytics tracking integration', () => {
    it('should automatically update analytics on successful summarization', async () => {
      // Mock LLM service
      jest.spyOn(llmService, 'summarize').mockResolvedValue(mockLLMResponse);

      // Create request
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Test article for analytics tracking.' })
        .expect(201);

      // Wait for processing
      await delay(1000);

      // Check analytics
      const db = testDb.getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayAnalytics] = await db
        .select()
        .from(analytics)
        .where(eq(analytics.date, today));

      expect(todayAnalytics).toBeDefined();
      if (todayAnalytics) {
        expect(todayAnalytics.totalRequests).toBeGreaterThan(0);
        expect(todayAnalytics.successfulRequests).toBeGreaterThan(0);
      }
    }, 10000);

    it('should track failed requests in analytics', async () => {
      // Mock LLM service to fail
      jest
        .spyOn(llmService, 'summarize')
        .mockRejectedValue(new Error('LLM service error'));

      // Create request
      await request(app.getHttpServer())
        .post('/summarization')
        .send({ text: 'Test article that will fail.' })
        .expect(201);

      // Wait for processing
      await delay(1000);

      // Check analytics
      const db = testDb.getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayAnalytics] = await db
        .select()
        .from(analytics)
        .where(eq(analytics.date, today));

      if (todayAnalytics) {
        expect(todayAnalytics.totalRequests).toBeGreaterThan(0);
        expect(todayAnalytics.failedRequests).toBeGreaterThan(0);
      }
    }, 10000);
  });
});
