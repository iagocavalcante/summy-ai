import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
  Get,
  Param,
  Query,
  ValidationPipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SummarizationService } from './summarization.service';
import { CreateSummarizationDto } from './dto/create-summarization.dto';

@Controller('summarization')
export class SummarizationController {
  private readonly logger = new Logger(SummarizationController.name);

  constructor(private readonly summarizationService: SummarizationService) {}

  @Post()
  async create(@Body(ValidationPipe) createDto: CreateSummarizationDto) {
    this.logger.log('Creating summarization request', {
      textLength: createDto.text.length,
      userId: createDto.userId,
    });
    return this.summarizationService.create(createDto);
  }

  @Sse('stream/:id')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid request ID format');
    }

    const stream = this.summarizationService.streamSummary(id);

    return new Observable((observer) => {
      void (async () => {
        try {
          for await (const chunk of stream) {
            observer.next({
              data: JSON.stringify(chunk),
            } as MessageEvent);

            if (chunk.done) {
              observer.complete();
              break;
            }
          }
        } catch (error) {
          this.logger.error(`Error streaming for request ${id}`, error);
          observer.error(error);
        }
      })();
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid request ID format');
    }

    return this.summarizationService.findOne(id);
  }

  @Get()
  async getAll(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    // Validate limit
    let parsedLimit = 10;
    if (limit) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }
    }

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    let validStatus:
      | 'PENDING'
      | 'PROCESSING'
      | 'COMPLETED'
      | 'FAILED'
      | undefined;

    if (status) {
      if (!validStatuses.includes(status)) {
        throw new BadRequestException(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        );
      }
      validStatus = status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    }

    return this.summarizationService.findAll(parsedLimit, validStatus);
  }
}
