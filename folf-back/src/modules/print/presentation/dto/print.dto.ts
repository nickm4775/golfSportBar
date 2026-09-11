import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PrepStation,
  PrintExecutionMode,
  PrintJobExecutedBy,
  PrintJobStatus,
} from '../../../../shared/domain/enums';

export class UpdatePrintSettingsDto {
  @ApiPropertyOptional({ enum: PrintExecutionMode })
  @IsOptional()
  @IsEnum(PrintExecutionMode)
  printExecutionMode?: PrintExecutionMode;
}

export class UpsertPrinterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '192.168.1.50', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  host?: string | null;

  @ApiPropertyOptional({ example: 9100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  paperWidth?: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  agentPrinterId?: string | null;
}

export class DiscoverPrintersDto {
  @ApiPropertyOptional({ example: '192.168.1.0/24' })
  @IsOptional()
  @IsString()
  cidr?: string;
}

export class UpdatePrintJobDto {
  @ApiProperty({ enum: PrintJobStatus })
  @IsEnum(PrintJobStatus)
  status!: PrintJobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({ enum: PrintJobExecutedBy })
  @IsOptional()
  @IsEnum(PrintJobExecutedBy)
  executedBy?: PrintJobExecutedBy;
}

export class AgentDiscoverPrinterDto {
  @ApiProperty()
  @IsString()
  host!: string;

  @ApiProperty()
  @IsInt()
  port!: number;

  @ApiProperty()
  @IsInt()
  latencyMs!: number;
}

export class AgentDiscoverResultDto {
  @ApiProperty()
  @IsUUID()
  requestId!: string;

  @ApiProperty({ type: [AgentDiscoverPrinterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentDiscoverPrinterDto)
  printers!: AgentDiscoverPrinterDto[];
}

export class AgentProbeResultDto {
  @ApiProperty()
  @IsUUID()
  requestId!: string;

  @ApiPropertyOptional({ enum: PrepStation })
  @IsOptional()
  @IsEnum(PrepStation)
  station?: PrepStation;

  @ApiProperty()
  @IsBoolean()
  online!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  latencyMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}

export class AgentPrinterStatusDto {
  @ApiProperty({ enum: PrepStation })
  @IsEnum(PrepStation)
  station!: PrepStation;

  @ApiProperty()
  @IsBoolean()
  online!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  latencyMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error?: string;
}

export class AgentHeartbeatDto {
  @ApiPropertyOptional({ type: [AgentPrinterStatusDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentPrinterStatusDto)
  printers?: AgentPrinterStatusDto[];
}
