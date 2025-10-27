import { INestApplication, ValidationPipe } from '@nestjs/common';

export function setupTestApp(app: INestApplication) {
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  return app;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockLLMResponse = {
  text: 'This is a mock summary of the provided text.',
  tokensInput: 100,
  tokensOutput: 50,
  model: 'gemini-2.0-flash',
  provider: 'gemini',
};
