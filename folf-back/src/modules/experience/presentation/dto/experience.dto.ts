import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from '../../../order/presentation/dto/order.dto';

export class ResolveQrDto {
  @ApiProperty({
    example: 'gsb:table:11111111-1111-4111-8111-111111111111:Mesa 4',
    description: 'Contenido crudo del QR',
  })
  @IsString()
  @MinLength(1)
  payload!: string;
}

export class CustomerCreateReservationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bayId!: string;

  @ApiProperty({ example: '2026-08-18T18:00:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2026-08-18T19:00:00.000Z' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CustomerCreateOrderDto {
  @ApiProperty({ example: 'Mesa 4' })
  @IsString()
  @MinLength(1)
  tableLabel!: string;

  @ApiPropertyOptional({ example: 'Sin hielo' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export class RefreshCustomerDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  refreshToken!: string;
}
