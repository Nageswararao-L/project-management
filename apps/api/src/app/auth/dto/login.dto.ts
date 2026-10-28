import { ApiProperty } from '@nestjs/swagger';
import type { LoginInput } from '@pm/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto implements LoginInput {
  @ApiProperty({ example: 'aarav.patel@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
