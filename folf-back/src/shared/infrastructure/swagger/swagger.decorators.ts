import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from './swagger-responses.dto';

export function ApiStandardErrors() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: 'Token inválido o ausente', type: ErrorResponseDto }),
    ApiForbiddenResponse({ description: 'Sin acceso al negocio o permiso insuficiente', type: ErrorResponseDto }),
    ApiNotFoundResponse({ description: 'Recurso no encontrado', type: ErrorResponseDto }),
    ApiBadRequestResponse({ description: 'Datos inválidos o regla de negocio', type: ErrorResponseDto }),
    ApiConflictResponse({ description: 'Conflicto (ej. reserva solapada)', type: ErrorResponseDto }),
  );
}

export function ApiBusinessIdParam() {
  return applyDecorators(
    // Documented via @ApiParam on each handler
  );
}
