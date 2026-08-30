import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ReservationStatus, SessionStatus } from '../../../../shared/domain/enums';
import { MAX_COMPANION_COUNT, MIN_COMPANION_COUNT } from '../../domain/gspro-pricing';

export class CreateBayDto {
  @ApiProperty({ example: 'BAY-4', description: 'Código único del bay en el negocio' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Bay 4', description: 'Nombre visible del bay' })
  @IsString()
  name!: string;
}

export class UpdateBayDto {
  @ApiPropertyOptional({ example: 'BAY-4' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Bay 4' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateReservationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bayId!: string;

  @ApiProperty({ format: 'uuid', description: 'Cliente de la ficha' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ example: '2026-08-18T18:00:00.000Z', description: 'Inicio ISO 8601' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2026-08-18T19:00:00.000Z', description: 'Fin ISO 8601' })
  @IsDateString()
  endAt!: string;

  @ApiProperty({
    example: 1,
    minimum: MIN_COMPANION_COUNT,
    maximum: MAX_COMPANION_COUNT,
    description: 'Acompañantes (0–3). Personas totales = 1 + companionCount',
  })
  @IsInt()
  @Min(MIN_COMPANION_COUNT)
  @Max(MAX_COMPANION_COUNT)
  @Type(() => Number)
  companionCount!: number;

  @ApiPropertyOptional({
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
    description: 'PENDING | CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED | NO_SHOW',
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReservationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({
    minimum: MIN_COMPANION_COUNT,
    maximum: MAX_COMPANION_COUNT,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_COMPANION_COUNT)
  @Max(MAX_COMPANION_COUNT)
  @Type(() => Number)
  companionCount?: number;

  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWalkInSessionDto {
  @ApiProperty({ format: 'uuid', description: 'Bay donde iniciar la sesión' })
  @IsUUID()
  bayId!: string;

  @ApiProperty({
    example: 1,
    minimum: MIN_COMPANION_COUNT,
    maximum: MAX_COMPANION_COUNT,
    description: 'Acompañantes (0–3)',
  })
  @IsInt()
  @Min(MIN_COMPANION_COUNT)
  @Max(MAX_COMPANION_COUNT)
  @Type(() => Number)
  companionCount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckInSessionDto {
  @ApiProperty({ format: 'uuid', description: 'Reserva confirmada a check-in' })
  @IsUUID()
  reservationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSessionDto {
  @ApiProperty({
    enum: SessionStatus,
    example: SessionStatus.COMPLETED,
    description: 'ACTIVE → COMPLETED | CANCELLED',
  })
  @IsEnum(SessionStatus)
  status!: SessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
