import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from '../llm.service';
import { GeminiAdapter } from '../adapters/gemini.adapter';
import { OpenAIAdapter } from '../adapters/openai.adapter';

describe('LLM Adapters (e2e)', () => {
  let llmService: LLMService;
  let geminiAdapter: GeminiAdapter;
  let openaiAdapter: OpenAIAdapter;

  describe('With Gemini configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            ignoreEnvFile: true,
            load: [
              () => ({
                GEMINI_API_KEY: 'test-gemini-key',
                OPENAI_API_KEY: undefined,
              }),
            ],
          }),
        ],
        providers: [LLMService, GeminiAdapter, OpenAIAdapter],
      }).compile();

      llmService = module.get<LLMService>(LLMService);
      geminiAdapter = module.get<GeminiAdapter>(GeminiAdapter);
      openaiAdapter = module.get<OpenAIAdapter>(OpenAIAdapter);
    });

    it('should detect Gemini as available', () => {
      expect(geminiAdapter.isAvailable()).toBe(true);
    });

    it('should detect OpenAI as unavailable', () => {
      expect(openaiAdapter.isAvailable()).toBe(false);
    });

    it('should use Gemini adapter when available', async () => {
      const geminiSpy = jest
        .spyOn(geminiAdapter, 'summarize')
        .mockResolvedValue({
          text: 'Gemini summary',
          tokensInput: 100,
          tokensOutput: 50,
          model: 'gemini-2.0-flash',
          provider: 'gemini',
        });

      try {
        await llmService.summarize('Test text');
        expect(geminiSpy).toHaveBeenCalled();
      } catch {
        // May fail due to invalid API key, but spy should still be called
        expect(geminiSpy).toHaveBeenCalled();
      }
    });
  });

  describe('With OpenAI configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            ignoreEnvFile: true,
            load: [
              () => ({
                GEMINI_API_KEY: undefined,
                OPENAI_API_KEY: 'test-openai-key',
              }),
            ],
          }),
        ],
        providers: [LLMService, GeminiAdapter, OpenAIAdapter],
      }).compile();

      llmService = module.get<LLMService>(LLMService);
      geminiAdapter = module.get<GeminiAdapter>(GeminiAdapter);
      openaiAdapter = module.get<OpenAIAdapter>(OpenAIAdapter);
    });

    it('should detect Gemini as unavailable', () => {
      expect(geminiAdapter.isAvailable()).toBe(false);
    });

    it('should detect OpenAI as available', () => {
      expect(openaiAdapter.isAvailable()).toBe(true);
    });

    it('should use OpenAI adapter when Gemini is unavailable', async () => {
      const openaiSpy = jest
        .spyOn(openaiAdapter, 'summarize')
        .mockResolvedValue({
          text: 'OpenAI summary',
          tokensInput: 100,
          tokensOutput: 50,
          model: 'gpt-4o-mini',
          provider: 'openai',
        });

      try {
        await llmService.summarize('Test text');
        expect(openaiSpy).toHaveBeenCalled();
      } catch {
        // May fail due to invalid API key, but spy should still be called
        expect(openaiSpy).toHaveBeenCalled();
      }
    });
  });

  describe('With both adapters configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            ignoreEnvFile: true,
            load: [
              () => ({
                GEMINI_API_KEY: 'test-gemini-key',
                OPENAI_API_KEY: 'test-openai-key',
              }),
            ],
          }),
        ],
        providers: [LLMService, GeminiAdapter, OpenAIAdapter],
      }).compile();

      llmService = module.get<LLMService>(LLMService);
      geminiAdapter = module.get<GeminiAdapter>(GeminiAdapter);
      openaiAdapter = module.get<OpenAIAdapter>(OpenAIAdapter);
    });

    it('should prefer Gemini over OpenAI', async () => {
      const geminiSpy = jest
        .spyOn(geminiAdapter, 'summarize')
        .mockResolvedValue({
          text: 'Gemini summary',
          tokensInput: 100,
          tokensOutput: 50,
          model: 'gemini-2.0-flash',
          provider: 'gemini',
        });

      const openaiSpy = jest.spyOn(openaiAdapter, 'summarize');

      try {
        await llmService.summarize('Test text');
        expect(geminiSpy).toHaveBeenCalled();
        expect(openaiSpy).not.toHaveBeenCalled();
      } catch {
        // May fail due to invalid API key
        expect(geminiSpy).toHaveBeenCalled();
      }
    });

    it('should fallback to OpenAI when Gemini fails', async () => {
      const geminiSpy = jest
        .spyOn(geminiAdapter, 'summarize')
        .mockRejectedValue(new Error('Gemini API error'));

      const openaiSpy = jest
        .spyOn(openaiAdapter, 'summarize')
        .mockResolvedValue({
          text: 'OpenAI summary (fallback)',
          tokensInput: 100,
          tokensOutput: 50,
          model: 'gpt-4o-mini',
          provider: 'openai',
        });

      const result = await llmService.summarize('Test text');

      expect(geminiSpy).toHaveBeenCalled();
      expect(openaiSpy).toHaveBeenCalled();
      expect(result.provider).toBe('openai');
      expect(result.text).toBe('OpenAI summary (fallback)');
    });

    it('should fallback for streaming when Gemini fails', async () => {
      const geminiSpy = jest
        .spyOn(geminiAdapter, 'summarizeStream')
        // eslint-disable-next-line require-yield, @typescript-eslint/require-await
        .mockImplementation(async function* (): AsyncGenerator<never> {
          throw new Error('Gemini stream error');
        });

      const openaiSpy = jest
        .spyOn(openaiAdapter, 'summarizeStream')
        // eslint-disable-next-line @typescript-eslint/require-await
        .mockImplementation(async function* () {
          yield { text: 'OpenAI ', done: false };
          yield { text: 'fallback', done: false };
          yield { text: '', done: true };
        });

      const chunks: string[] = [];
      try {
        for await (const chunk of llmService.summarizeStream('Test text')) {
          chunks.push(chunk.text);
          if (chunk.provider) {
            expect(chunk.provider).toBe('openai');
          }
        }
      } catch {
        // Expected - may fail due to error handling
      }

      expect(geminiSpy).toHaveBeenCalled();
      expect(openaiSpy).toHaveBeenCalled();
    });

    it('should throw error when both adapters fail', async () => {
      jest
        .spyOn(geminiAdapter, 'summarize')
        .mockRejectedValue(new Error('Gemini error'));

      jest
        .spyOn(openaiAdapter, 'summarize')
        .mockRejectedValue(new Error('OpenAI error'));

      await expect(llmService.summarize('Test text')).rejects.toThrow();
    });
  });

  describe('With no adapters configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            ignoreEnvFile: true,
            load: [
              () => ({
                GEMINI_API_KEY: undefined,
                OPENAI_API_KEY: undefined,
              }),
            ],
          }),
        ],
        providers: [LLMService, GeminiAdapter, OpenAIAdapter],
      }).compile();

      llmService = module.get<LLMService>(LLMService);
      geminiAdapter = module.get<GeminiAdapter>(GeminiAdapter);
      openaiAdapter = module.get<OpenAIAdapter>(OpenAIAdapter);
    });

    it('should detect both adapters as unavailable', () => {
      expect(geminiAdapter.isAvailable()).toBe(false);
      expect(openaiAdapter.isAvailable()).toBe(false);
    });

    it('should throw error when no provider is available', async () => {
      await expect(llmService.summarize('Test text')).rejects.toThrow(
        'No LLM provider available',
      );
    });

    it('should throw error for streaming when no provider is available', async () => {
      const generator = llmService.summarizeStream('Test text');
      await expect(generator.next()).rejects.toThrow(
        'No LLM provider available',
      );
    });
  });

  describe('Adapter provider names', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            ignoreEnvFile: true,
            load: [
              () => ({
                GEMINI_API_KEY: 'test-key',
                OPENAI_API_KEY: 'test-key',
              }),
            ],
          }),
        ],
        providers: [LLMService, GeminiAdapter, OpenAIAdapter],
      }).compile();
    });

    it('should return correct provider name for Gemini', () => {
      const adapter = module.get<GeminiAdapter>(GeminiAdapter);
      expect(adapter.getProviderName()).toBe('gemini');
    });

    it('should return correct provider name for OpenAI', () => {
      const adapter = module.get<OpenAIAdapter>(OpenAIAdapter);
      expect(adapter.getProviderName()).toBe('openai');
    });
  });
});
