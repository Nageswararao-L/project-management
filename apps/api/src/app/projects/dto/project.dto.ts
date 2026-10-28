import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  Priority,
  ProjectHealth,
  ProjectInput,
  ProjectStatus,
} from '@pm/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { IsIsoDate, ToArray, Trim } from '../../common/validation';

export class CreateProjectDto implements ProjectInput {
  @ApiProperty({ example: 'CRM-01', description: 'Short unique project code' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9][A-Z0-9_-]{1,19}$/, {
    message:
      'code must be 2-20 characters: letters, numbers, "-" or "_" (e.g. CRM-01)',
  })
  code!: string;

  @ApiProperty({ example: 'CRM Revamp' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  client?: string | null;

  @ApiProperty({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  status!: ProjectStatus;

  @ApiProperty({ enum: Priority })
  @IsEnum(Priority)
  priority!: Priority;

  @ApiProperty({ example: '2026-01-05' })
  @IsIsoDate()
  startDate!: string;

  @ApiProperty({ example: '2026-03-31' })
  @IsIsoDate()
  endDate!: string;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  managerId?: number | null;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectQueryDto {
  @ApiPropertyOptional({ description: 'Search code, name or client' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, isArray: true })
  @IsOptional()
  @ToArray()
  @IsEnum(ProjectStatus, { each: true })
  status?: ProjectStatus[];

  @ApiPropertyOptional({ enum: Priority, isArray: true })
  @IsOptional()
  @ToArray()
  @IsEnum(Priority, { each: true })
  priority?: Priority[];

  @ApiPropertyOptional({ enum: ProjectHealth, isArray: true })
  @IsOptional()
  @ToArray()
  @IsEnum(ProjectHealth, { each: true })
  health?: ProjectHealth[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number;
}
