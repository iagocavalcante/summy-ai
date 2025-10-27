import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateSummarizationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Text must be at least 10 characters long' })
  @MaxLength(50000, { message: 'Text must not exceed 50000 characters' })
  text: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
