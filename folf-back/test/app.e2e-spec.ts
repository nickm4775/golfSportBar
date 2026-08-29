import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { isValidCpf } from '../src/shared/domain/brazil';

function generateCpf(): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
    const digit = (factor: number, source: number[]) => {
      const sum = source.reduce((total, value, index) => total + value * (factor - index), 0);
      const remainder = (sum * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };
    const digits = [...base, digit(10, base)];
    digits.push(digit(11, digits));
    const cpf = digits.join('');
    if (isValidCpf(cpf)) return cpf;
  }
  return '52998224725';
}

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/v1/auth/login (POST) rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'invalid@test.com', password: 'wrong' })
      .expect(401);
  });

  it('resolves unknown QR payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/public/qr/resolve')
      .send({ payload: 'hello-golf' })
      .expect(201);

    expect(response.body.kind).toBe('unknown');
    expect(response.body.raw).toBe('hello-golf');
  });

  it('customer can browse a venue, book a bay and order to a table', async () => {
    const http = app.getHttpServer();
    const venues = await request(http).get('/api/v1/public/venues').expect(200);
    if (!Array.isArray(venues.body) || venues.body.length === 0) {
      return;
    }

    const venue = venues.body[0] as { id: string };
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const register = await request(http)
      .post('/api/v1/auth/customers/register')
      .send({
        fullName: 'E2E Cliente',
        cpf: generateCpf(),
        email: `e2e.${stamp}@mail.com`,
        phone: `4799${String(stamp).slice(-7).padStart(7, '0')}`,
        birthDate: '1990-04-12',
        lgpdAccepted: true,
        password: 'Secret123!',
      });

    expect(register.status).toBe(201);
    expect(register.body.accessToken).toBeDefined();
    expect(register.body.refreshToken).toBeDefined();

    const auth = { Authorization: `Bearer ${register.body.accessToken}` };

    await request(http).get('/api/v1/customers/me').set(auth).expect(200);

    const menu = await request(http)
      .get(`/api/v1/public/venues/${venue.id}/menu`)
      .expect(200);
    expect(menu.body.items?.length).toBeGreaterThan(0);

    const bays = await request(http)
      .get(`/api/v1/public/venues/${venue.id}/bays`)
      .expect(200);
    expect(bays.body.length).toBeGreaterThan(0);

    await request(http)
      .get(`/api/v1/public/venues/${venue.id}/availability`)
      .query({ date: '2099-01-15' })
      .expect(200);

    const reservation = await request(http)
      .post(`/api/v1/me/venues/${venue.id}/reservations`)
      .set(auth)
      .send({
        bayId: bays.body[0].id,
        startAt: '2099-01-15T18:00:00.000Z',
        endAt: '2099-01-15T19:00:00.000Z',
      })
      .expect(201);

    expect(reservation.body.status).toBe('CONFIRMED');

    const qr = await request(http)
      .post('/api/v1/public/qr/resolve')
      .send({ payload: `gsb:reservation:${reservation.body.id}` })
      .expect(201);
    expect(qr.body.kind).toBe('reservation');

    const mine = await request(http).get('/api/v1/me/reservations').set(auth).expect(200);
    expect(mine.body.some((row: { id: string }) => row.id === reservation.body.id)).toBe(true);

    const productId = menu.body.items[0].id as string;
    const order = await request(http)
      .post(`/api/v1/me/venues/${venue.id}/orders`)
      .set(auth)
      .send({
        tableLabel: 'Mesa 4',
        items: [{ productId, quantity: 1 }],
      })
      .expect(201);

    expect(order.body.tableLabel).toBe('Mesa 4');
    expect(order.body.customerId).toBeDefined();

    const refreshed = await request(http)
      .post('/api/v1/auth/customers/refresh')
      .send({ refreshToken: register.body.refreshToken })
      .expect(201);
    expect(refreshed.body.accessToken).toBeDefined();
    expect(refreshed.body.refreshToken).not.toBe(register.body.refreshToken);

    await request(http)
      .post(`/api/v1/me/reservations/${reservation.body.id}/cancel`)
      .set(auth)
      .expect(201);
  });
});
