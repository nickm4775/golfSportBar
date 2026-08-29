import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import {
  buildSwaggerDocument,
  swaggerUiOptions,
} from './shared/infrastructure/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.setGlobalPrefix('api/v1');

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors(
    corsOrigins?.length
      ? { origin: corsOrigins, credentials: true }
      : { origin: true, credentials: true },
  );

  // Sin barra final los assets de Swagger (css/js) resuelven mal en rutas anidadas.
  app.use('/api/docs', (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/docs') {
      return res.redirect(301, '/api/docs/');
    }
    next();
  });

  const document = SwaggerModule.createDocument(app, buildSwaggerDocument(), {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document, swaggerUiOptions);

  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  console.log(`FOLF API running on ${baseUrl}/api/v1`);
  console.log(`Swagger docs at ${baseUrl}/api/docs`);
}

bootstrap();
