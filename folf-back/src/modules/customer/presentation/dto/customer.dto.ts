import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { onlyDigits } from '../../../../shared/domain/brazil';

function digitsTransform({ value }: { value: unknown }) {
  return typeof value === 'string' ? onlyDigits(value) : value;
}

function emailTransform({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: '529.982.247-25', description: 'CPF brasileño (11 dígitos)' })
  @Transform(digitsTransform)
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF must contain 11 digits' })
  cpf!: string;

  @ApiProperty({ example: 'ana.souza@mail.com' })
  @Transform(emailTransform)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '(47) 99911-0011', description: 'Celular BR con DDD' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '1994-03-12', description: 'Fecha de nacimiento ISO (YYYY-MM-DD)' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: true, description: 'Consentimiento LGPD' })
  @Type(() => Boolean)
  @IsBoolean()
  @Equals(true, { message: 'LGPD consent is required' })
  lgpdAccepted!: true;

  @ApiPropertyOptional({ example: '88330-000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(digitsTransform)
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF must contain 11 digits' })
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(emailTransform)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegisterCustomerDto extends CreateCustomerDto {
  @ApiProperty({ example: 'Secret123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class CustomerLoginDto {
  @ApiProperty({
    example: 'ana.souza@mail.com',
    description: 'Email o CPF del cliente',
  })
  @IsString()
  identifier!: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(6)
  password!: string;
}
