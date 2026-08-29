import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../shared/infrastructure/database/entities';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});
