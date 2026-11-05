import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsTimeZone,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  gymName!: string;

  @IsTimeZone()
  timezone!: string;
}
