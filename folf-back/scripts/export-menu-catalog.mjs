/**
 * Export menu catalog from folf-front into src/database/seed/menu-catalog.json
 * Run: npm run export:menu
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const frontRoot = join(root, '../folf-front');

function resolveI18nKey(obj, key) {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return key;
    current = current[part];
  }
  return typeof current === 'string' ? current : key;
}

function extractArrayConst(source, exportName) {
  const match = source.match(
    new RegExp(`export const ${exportName}[^=]*=\\s*(\\[[\\s\\S]*?\\])\\s*as const`),
  );
  if (!match) throw new Error(`Could not parse ${exportName}`);
  return new Function(`return (${match[1]})`)();
}

const menuSource = readFileSync(
  join(frontRoot, 'src/infrastructure/menu/menuCatalog.ts'),
  'utf8',
);
const menuPt = JSON.parse(
  readFileSync(join(frontRoot, 'src/infrastructure/i18n/locales/pt/menu.json'), 'utf8'),
);

const rawItems = extractArrayConst(menuSource, 'menuCatalog');
const items = rawItems.map((item) => ({
  slug: item.id,
  categorySlug: item.category,
  namePt: resolveI18nKey(menuPt, item.nameKey),
  descriptionPt: resolveI18nKey(menuPt, item.descriptionKey),
  priceBrl: item.priceBrl,
  featured: item.featured,
  imageSrc: item.imageSrc,
}));

const categories = menuPt.categories;
const categoryList = Object.entries(categories).map(([slug, namePt], index) => ({
  slug,
  namePt,
  sortOrder: index,
}));

const storeSource = readFileSync(
  join(frontRoot, 'src/infrastructure/store/storeCatalog.ts'),
  'utf8',
);
const stores = extractArrayConst(storeSource, 'storeCatalog');
const storesPt = JSON.parse(
  readFileSync(join(frontRoot, 'src/infrastructure/i18n/locales/pt/stores.json'), 'utf8'),
);

const storeList = stores.map((store) => ({
  slug: store.id,
  name: resolveI18nKey(storesPt, store.nameKey),
  address: store.address,
  district: store.district,
  postalCode: store.postalCode,
  city: store.city,
  state: store.state,
  country: store.country,
  lat: store.lat,
  lng: store.lng,
}));

const output = {
  categories: categoryList,
  products: items,
  stores: storeList,
};

const outDir = join(root, 'src/database/seed');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'menu-catalog.json'), JSON.stringify(output, null, 2));
console.log(
  `Exported ${items.length} products, ${categoryList.length} categories, ${storeList.length} stores`,
);
