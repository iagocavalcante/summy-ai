import { Logger } from '@nestjs/common';

const logger = new Logger('Configuration');

export interface Configuration {
  // Server
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];

  // Database
  databaseUrl: string;
  databasePoolSize: number;

  // Redis
  redisHost: string;
  redisPort: number;
  redisPassword?: string;

  // LLM Providers
  geminiApiKey?: string;
  openaiApiKey?: string;

  // Rate Limiting
  rateLimitTtl: number;
  rateLimitMax: number;

  // Queue
  queueDefaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
    removeOnComplete: boolean | number;
    removeOnFail: boolean | number;
  };
}

export function validateConfiguration(): Configuration {
  const errors: string[] = [];

  // Required variables
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  // At least one LLM provider is required
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!geminiApiKey && !openaiApiKey) {
    errors.push(
      'At least one LLM provider API key is required (GEMINI_API_KEY or OPENAI_API_KEY)',
    );
  }

  if (errors.length > 0) {
    const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const config: Configuration = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3001'],
    databaseUrl: databaseUrl!,
    databasePoolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    redisHost,
    redisPort,
    redisPassword: process.env.REDIS_PASSWORD,
    geminiApiKey,
    openaiApiKey,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    queueDefaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  };

  logger.log('Configuration validated successfully');
  return config;
}

export default () => validateConfiguration();
