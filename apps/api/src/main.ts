import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Enable CORS with strict configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3001'];

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`Blocked CORS request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      maxAge: 3600,
    });

    // Enable validation with enhanced security
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: false,
        },
        disableErrorMessages: process.env.NODE_ENV === 'production',
      }),
    );

    // Add security headers
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
      res.removeHeader('X-Powered-By');
      next();
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.log(`Received ${signal}, starting graceful shutdown`);
      try {
        await app.close();
        logger.log('Application closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`API running on http://localhost:${port}`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
