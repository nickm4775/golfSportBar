import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PublicVenueService } from '../application/experience.service';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('public')
@Controller('public/venues')
export class PublicVenueController {
  constructor(private readonly publicVenueService: PublicVenueService) {}

  @Get()
  @ApiOperation({ summary: 'Listar locales activos (mapa / directorio)' })
  @ApiOkResponse({ description: 'Locales públicos' })
  list() {
    return this.publicVenueService.listVenues();
  }

  @Get(':businessId')
  @ApiOperation({ summary: 'Detalle público de un local' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Local' })
  @ApiStandardErrors()
  getOne(@Param('businessId') businessId: string) {
    return this.publicVenueService.getVenue(businessId);
  }

  @Get(':businessId/menu')
  @ApiOperation({ summary: 'Carta pública del local' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({ name: 'category', required: false })
  @ApiOkResponse({ description: 'Menú disponible' })
  @ApiStandardErrors()
  menu(@Param('businessId') businessId: string, @Query('category') category?: string) {
    return this.publicVenueService.getMenu(businessId, category);
  }

  @Get(':businessId/bays')
  @ApiOperation({ summary: 'Bays activos del simulador' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Bays' })
  @ApiStandardErrors()
  bays(@Param('businessId') businessId: string) {
    return this.publicVenueService.listBays(businessId);
  }

  @Get(':businessId/availability')
  @ApiOperation({ summary: 'Huecos ocupados de reservas para un día' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-18' })
  @ApiQuery({ name: 'bayId', required: false })
  @ApiOkResponse({ description: 'Rangos ocupados por bay' })
  @ApiStandardErrors()
  availability(
    @Param('businessId') businessId: string,
    @Query('date') date: string,
    @Query('bayId') bayId?: string,
  ) {
    return this.publicVenueService.getAvailability(businessId, date, bayId);
  }
}
