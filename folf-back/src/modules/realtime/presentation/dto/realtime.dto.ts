import { ApiProperty } from '@nestjs/swagger';

export class RealtimeTokenDto {
  @ApiProperty()
  token!: string;

  @ApiProperty({ example: 600 })
  expiresIn!: number;

  @ApiProperty({ example: 'business:uuid', description: 'Canal con server-side subscribe (business: o customer:)' })
  channel!: string;
}
