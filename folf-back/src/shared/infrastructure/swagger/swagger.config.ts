import { DocumentBuilder } from '@nestjs/swagger';

export const SWAGGER_BEARER_AUTH = 'access-token';

export function buildSwaggerDocument() {
  return new DocumentBuilder()
    .setTitle('FOLF API')
    .setDescription(
      [
        'API multi-tenant para gestión de bares **FOLF** (Golf Sport Bar).',
        '',
        '## Autenticación',
        '1. Registrate con `POST /auth/register` o iniciá sesión con `POST /auth/login`.',
        '2. Copiá el `accessToken` (JWT) de la respuesta.',
        '3. Clic en **Authorize** (arriba a la derecha) y pegá: `Bearer <token>`.',
        '4. El JWT incluye email, name, negocios, permisos y activeBusinessId.',
        '',
        '## Multi-tenant',
        'El tenant es el **negocio** (`businessId`). Cada usuario puede pertenecer a varios negocios con distintos roles.',
        '',
        '## Roles',
        '`ADMIN` · `OWNER` · `MANAGER` · `WAITER` · `COOK` · `BARTENDER`',
        '',
        '## Módulos',
        '| Tag | Descripción |',
        '|-----|-------------|',
        '| auth | Registro, login y perfil |',
        '| organizations | Cuentas administrador |',
        '| businesses | Negocios y staff |',
        '| roles | Roles y permisos |',
        '| catalog | Carta de productos |',
        '| orders | Pedidos de bar/cocina |',
        '| gspro | Simulador: bays, reservas y sesiones |',
        '| analytics | Dashboard y KPIs por periodo |',
        '| realtime | Token WebSocket Centrifugo |',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Backend local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en POST /auth/login o POST /auth/register',
      },
      SWAGGER_BEARER_AUTH,
    )
    .addTag('auth', 'Autenticación JWT')
    .addTag('organizations', 'Organizaciones del administrador')
    .addTag('businesses', 'Negocios (bares) y miembros')
    .addTag('roles', 'Roles y permisos RBAC')
    .addTag('catalog', 'Carta de productos por negocio')
    .addTag('orders', 'Pedidos y ítems')
    .addTag('gspro', 'Simulador GSPro: bays, reservas y sesiones')
    .addTag('analytics', 'Dashboard y KPIs por periodo')
    .addTag('realtime', 'Token de conexión Centrifugo')
    .build();
}

export const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    docExpansion: 'list',
  },
  customSiteTitle: 'FOLF API Docs',
};
