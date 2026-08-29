import { ReservationStatus, SessionStatus } from '../../../../shared/domain/enums';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
