import { OrderItemStatus, OrderStatus } from '../../../../shared/domain/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ format: 'uuid', description: 'ID del producto global' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Extra limón' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Cliente de la ficha' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ example: 'Mesa 4', description: 'Identificador de mesa o ubicación' })
  @IsOptional()
  @IsString()
  tableLabel?: string;

  @ApiPropertyOptional({ example: 'Sin hielo', description: 'Notas generales del pedido' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.IN_PROGRESS,
    description: 'DRAFT | OPEN | IN_PROGRESS | COMPLETED | CANCELLED',
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class AddOrderItemDto {
  @ApiProperty({ format: 'uuid', description: 'ID del producto global' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Extra limón' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderItemStatusDto {
  @ApiProperty({
    enum: OrderItemStatus,
    example: OrderItemStatus.PREPARING,
    description: 'PENDING | PREPARING | SERVED | CANCELLED',
  })
  @IsEnum(OrderItemStatus)
  status!: OrderItemStatus;
}
