import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MemberInput } from '@pm/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMemberDto implements MemberInput {
  @ApiProperty({ example: 'Priya Sharma' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'priya@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiPropertyOptional({ example: 'Frontend Developer' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {}
