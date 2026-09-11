import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrinterConnectionType } from '../../../../shared/domain/enums';

export class PairAgentDto {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  deviceId!: string;

  @ApiProperty()
  @IsString()
  deviceName!: string;

  @ApiProperty({ example: 'macos' })
  @IsString()
  platform!: string;
}

export class AgentHeartbeatPrinterDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: PrinterConnectionType })
  @IsEnum(PrinterConnectionType)
  connectionType!: PrinterConnectionType;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty({ example: 80 })
  @IsInt()
  @Min(32)
  @Max(80)
  paperWidth!: number;

  @ApiProperty()
  @IsBoolean()
  isOnline!: boolean;
}

export class AgentRuntimeHeartbeatDto {
  @ApiProperty()
  @IsUUID()
  agentId!: string;

  @ApiPropertyOptional({ example: 'online' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [AgentHeartbeatPrinterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentHeartbeatPrinterDto)
  printers?: AgentHeartbeatPrinterDto[];
}

export class AckPrintJobDto {
  @ApiProperty({ enum: ['printed', 'failed'] })
  @IsIn(['printed', 'failed'])
  status!: 'printed' | 'failed';

  @ApiProperty()
  @IsUUID()
  agentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}
