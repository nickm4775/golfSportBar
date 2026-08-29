import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QrResolveService } from '../application/experience.service';
import { ResolveQrDto } from './dto/experience.dto';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('public')
@Controller('public/qr')
export class PublicQrController {
  constructor(private readonly qrResolveService: QrResolveService) {}

  @Post('resolve')
  @ApiOperation({
    summary: 'Interpretar payload de QR',
    description:
      'Acepta gsb:table:<businessId>:<tableLabel>, gsb:reservation:<id>, JSON {type} o una URL http(s).',
  })
  @ApiCreatedResponse({ description: 'Acción tipada sin PII' })
  @ApiStandardErrors()
  resolve(@Body() dto: ResolveQrDto) {
    return this.qrResolveService.resolve(dto.payload);
  }
}
