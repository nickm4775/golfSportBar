import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiPropertyOptional({ example: 'BAY_BUSY' })
  code?: string;

  @ApiProperty({ example: 'Bay already has an active session' })
  message!: string | string[];
}

export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'JWT con sub, email, name, activeBusinessId, permissions y businesses',
  })
  accessToken!: string;

  @ApiProperty({ description: 'Token opaco de renovación' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Segundos hasta expirar el access token' })
  expiresIn!: number;
}

export class CustomerAuthResponseDto {
  @ApiProperty({ description: 'JWT de acceso (kind CUSTOMER)' })
  accessToken!: string;

  @ApiProperty({ description: 'Token opaco de renovación' })
  refreshToken!: string;

  @ApiProperty({ example: 900, description: 'Segundos hasta expirar el access token' })
  expiresIn!: number;
}

export class BusinessSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'bc-centro' })
  slug!: string;

  @ApiProperty({ example: 'FOLF BC Centro' })
  name!: string;

  @ApiProperty({ example: 'ADMIN' })
  role!: string;
}

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin@folf.local' })
  email!: string;

  @ApiProperty({ example: 'Admin' })
  name!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  activeBusinessId?: string;

  @ApiProperty({ type: [String], example: ['business:read', 'orders:create'] })
  permissions!: string[];

  @ApiProperty({ type: [BusinessSummaryDto] })
  businesses!: BusinessSummaryDto[];
}
