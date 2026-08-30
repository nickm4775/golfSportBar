#!/bin/sh
set -e

echo "Esperando PostgreSQL..."

until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => client.end()).then(() => process.exit(0)).catch(() => process.exit(1));
" >/dev/null 2>&1
do
  echo "PostgreSQL no disponible, reintentando en 2s..."
  sleep 2
done

echo "PostgreSQL listo."

echo "Aplicando migraciones..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@folf.local}"
SHOULD_SEED=false

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  SHOULD_SEED=true
  echo "RUN_DB_SEED=true — ejecutando seed..."
else
  if node -e "
const { Client } = require('pg');
const email = process.env.SEED_ADMIN_EMAIL || 'admin@folf.local';
const client = new Client({ connectionString: process.env.DATABASE_URL });
client
  .connect()
  .then(() => client.query('SELECT 1 FROM users WHERE email = \$1 LIMIT 1', [email]))
  .then((result) => {
    client.end();
    process.exit(result.rowCount > 0 ? 0 : 1);
  })
  .catch(() => process.exit(1));
" >/dev/null 2>&1; then
    echo "Seed ya aplicado (admin ${ADMIN_EMAIL} existe)."
  else
    SHOULD_SEED=true
    echo "Admin no encontrado — ejecutando seed..."
  fi
fi

if [ "$SHOULD_SEED" = "true" ]; then
  echo "ATENCIÓN: el seed vacía la base y carga usuarios + negocio + carta + 3 bays"
  node dist/database/seed.js
fi

echo "Iniciando API..."
exec node dist/main.js
