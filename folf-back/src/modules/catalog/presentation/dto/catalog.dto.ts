import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrepStation } from '../../../../shared/domain/enums';

export class CreateBusinessProductDto {
  @ApiProperty({ example: 'Negroni' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'Gin, Campari e vermute' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 38 })
  @IsNumber()
  @Min(0)
  priceBrl!: number;

  @ApiPropertyOptional({ example: '/images/menu/negroni.png' })
  @IsOptional()
  @IsString()
  imageSrc?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ enum: PrepStation, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsEnum(PrepStation)
  prepStation?: PrepStation | null;
}

export class UpdateBusinessProductDto {
  @ApiPropertyOptional({ example: 'Negroni' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 45.0, description: 'Precio en BRL para este negocio' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceBrl?: number;

  @ApiPropertyOptional({ example: '/images/menu/negroni.png' })
  @IsOptional()
  @IsString()
  imageSrc?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Si el producto está disponible para venta' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ enum: PrepStation, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsEnum(PrepStation)
  prepStation?: PrepStation | null;
}
