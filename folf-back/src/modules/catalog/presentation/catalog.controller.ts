import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from '../application/catalog.service';
import {
  CreateBusinessProductDto,
  UpdateBusinessProductDto,
} from './dto/catalog.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('catalog')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('businesses/:businessId')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('menu')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('catalog:read')
  @ApiOperation({
    summary: 'Carta del negocio',
    description:
      'Devuelve categorías e ítems con precio por negocio. Por defecto solo disponibles. Filtrable por categoría slug.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({
    name: 'category',
    required: false,
    example: 'classicos',
    description: 'Slug de categoría (classicos, autorais, petiscos, etc.)',
  })
  @ApiQuery({
    name: 'includeUnavailable',
    required: false,
    type: Boolean,
    description: 'Incluir productos no disponibles (panel de gestión).',
  })
  @ApiOkResponse({ description: 'Categorías e ítems del menú' })
  @ApiStandardErrors()
  getMenu(
    @Param('businessId') businessId: string,
    @Query('category') category?: string,
    @Query('includeUnavailable') includeUnavailable?: string,
  ) {
    return this.catalogService.getMenu(
      businessId,
      category,
      includeUnavailable === 'true' || includeUnavailable === '1',
    );
  }

  @Post('products')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('catalog:write')
  @ApiOperation({
    summary: 'Crear producto en la carta del local',
    description: 'Crea un producto global y lo asocia solo a este negocio.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Producto creado' })
  @ApiStandardErrors()
  createProduct(
    @Param('businessId') businessId: string,
    @Body() dto: CreateBusinessProductDto,
  ) {
    return this.catalogService.createProduct(businessId, dto);
  }

  @Patch('products/:productId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('catalog:write')
  @ApiOperation({
    summary: 'Actualizar producto del negocio',
    description:
      'Modifica identidad del producto (global) y/o precio y disponibilidad locales.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'productId', format: 'uuid', description: 'ID del producto global' })
  @ApiOkResponse({ description: 'Producto actualizado' })
  @ApiStandardErrors()
  updateProduct(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateBusinessProductDto,
  ) {
    return this.catalogService.updateBusinessProduct(businessId, productId, dto);
  }

  @Delete('products/:productId')
  @HttpCode(204)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('catalog:write')
  @ApiOperation({
    summary: 'Quitar producto de la carta del local',
    description: 'Elimina la asociación con este negocio. No borra el producto global.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Producto quitado de la carta' })
  @ApiStandardErrors()
  async removeProduct(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
  ) {
    await this.catalogService.removeBusinessProduct(businessId, productId);
  }
}
