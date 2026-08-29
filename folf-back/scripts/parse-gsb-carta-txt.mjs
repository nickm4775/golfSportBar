/**
 * Parse root carta.txt (Golf Sport Bar) into seed/menu-catalog.json
 * Run: npm run parse:gsb-carta
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cartaPath = join(root, '../carta.txt');
const outDir = join(root, 'src/database/seed');
const outPath = join(outDir, 'menu-catalog.json');

const PRICE_RE = /R[S$]\s*([\d.]+)(?:,(\d{2}))?/i;

const CATEGORIES = [
  { slug: 'classicos', namePt: 'Clássicos' },
  { slug: 'autorais', namePt: 'Autorais' },
  { slug: 'petiscos', namePt: 'Petiscos' },
  { slug: 'pizzas', namePt: 'Pizzas' },
  { slug: 'burgers', namePt: 'Burgers' },
  { slug: 'sobremesas', namePt: 'Sobremesas' },
  { slug: 'refrigerantes', namePt: 'Refrigerantes' },
  { slug: 'aguas', namePt: 'Águas' },
  { slug: 'energeticos', namePt: 'Energéticos' },
  { slug: 'mocktails', namePt: 'Drinks sem álcool' },
  { slug: 'cervejas', namePt: 'Cervejas' },
  { slug: 'caipiras', namePt: 'Caipiras' },
  { slug: 'doses', namePt: 'Doses' },
  { slug: 'garrafas', namePt: 'Garrafas' },
];

const SECTION_HEADERS = new Map([
  ['classicos', 'classicos'],
  ['autorais', 'autorais'],
  ['petiscos', 'petiscos'],
  ['sobremesas', 'sobremesas'],
  ['bebidas', 'bebidas'],
  ['refrigerantes', 'refrigerantes'],
  ['drinks-sem-alcool', 'mocktails'],
  ['cervejas', 'cervejas'],
  ['caipiras', 'caipiras'],
  ['doses', 'doses'],
  ['garrafas', 'garrafas'],
  ['frutas', 'frutas'],
]);

const MISSING_PRICE_DEFAULTS = new Map([['camarao-crocante', 119]]);

const STORE = {
  slug: 'bc-centro',
  name: 'Golf Sport Bar — Centro BC',
  address: 'R. 3600, N205',
  district: 'Centro',
  postalCode: '88330-248',
  city: 'Balneário Camboriú',
  state: 'SC',
  country: 'Brasil',
  lat: -27.001654891900937,
  lng: -48.622958970800916,
};

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function titleCaseName(name) {
  const lowerParticles = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'a', 'o']);
  return name
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && lowerParticles.has(lower)) return lower;
      if (/^[0-9]/.test(word)) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/\bPina\b/g, 'Piña')
    .replace(/\bTaca\b/g, 'Taça')
    .replace(/\bCafe\b/g, 'Café');
}

function parsePriceMatch(match) {
  if (!match) return null;
  const intPart = match[1].replace(/\./g, '');
  const cents = match[2] ?? '00';
  return Number(`${intPart}.${cents}`);
}

function extractPrice(text) {
  const match = text.match(PRICE_RE);
  if (!match) return { price: null, withoutPrice: text.trim() };
  const price = parsePriceMatch(match);
  const withoutPrice = `${text.slice(0, match.index)}${text.slice(match.index + match[0].length)}`
    .replace(/\s+/g, ' ')
    .trim();
  return { price, withoutPrice };
}

function isSectionHeader(line) {
  const key = slugify(line.replace(/:/g, ' '));
  return SECTION_HEADERS.has(key) ? SECTION_HEADERS.get(key) : null;
}

function looksLikeProductName(line) {
  const { withoutPrice } = extractPrice(line);
  let candidate = withoutPrice;
  if (candidate.includes(':')) {
    candidate = candidate.split(':')[0].trim();
  }
  if (!candidate) return false;
  if (/^\(.*\)$/.test(candidate)) return false; // options line, not a product name
  if (/^[›‹]/.test(candidate)) return false;

  const letters = candidate.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 2) return false;
  const lowerCount = (candidate.match(/[a-zà-ÿ]/g) || []).length;
  // Product names are mostly uppercase; descriptions have many lowercase letters.
  if (lowerCount >= 3) return false;
  return true;
}

function resolveCategory(sectionSlug, productName) {
  const upper = productName.toUpperCase();
  if (sectionSlug === 'petiscos') {
    if (upper.startsWith('PIZZA')) return 'pizzas';
    if (/\bBLEND\b/.test(upper) || /\bBURGER\b/.test(upper)) return 'burgers';
    return 'petiscos';
  }
  if (sectionSlug === 'refrigerantes' || sectionSlug === 'bebidas') {
    if (/^ÁGUA|^AGUA/i.test(productName)) return 'aguas';
    if (/^RED\s*BULL/i.test(productName)) return 'energeticos';
  }
  if (sectionSlug === 'bebidas') return 'refrigerantes';
  return sectionSlug;
}

function slugForProduct(categorySlug, namePt) {
  const base = slugify(namePt);
  if (categorySlug === 'mocktails') return `mock-${base.replace(/^mock-/, '')}`;
  if (categorySlug === 'caipiras') return `caipira-${base.replace(/^caipira-/, '')}`;
  if (categorySlug === 'doses') return `dose-${base.replace(/^dose-/, '')}`;
  if (categorySlug === 'garrafas') return `garrafa-${base.replace(/^garrafa-/, '')}`;
  // Short aliases matching prior catalog where helpful
  const aliases = {
    'classic-gin-tonica': 'classic-gin',
    'gin-frutas-vermelhas': 'gin-frutas',
    'pina-colada': 'pina-colada',
    'negroni-negroni-coffee': 'negroni',
    'malibu-watermelon-splash': 'malibu-watermelon',
    'gin-citric-tropical': 'gin-citric',
    'burrata-ao-pesto': 'burrata-pesto',
    'pastel-de-brie': 'pastel-brie',
    'croquete-de-costela': 'croquete-costela',
    'camarao-alho-e-oleo': 'camarao-alho',
    'cubos-de-mignon': 'cubos-mignon',
    'isca-de-picanha': 'isca-picanha',
    'taboa-de-frios': 'taboa-frios',
    'taca-de-sorvete': 'taca-sorvete',
    'agua-sem-gas': 'agua-sem-gas',
    'agua-com-gas': 'agua-com-gas',
    'agua-de-coco': 'agua-coco',
  };
  return aliases[base] ?? base;
}

function cleanDescription(parts) {
  return parts
    .map((p) =>
      p
        .replace(/^[›‹]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join(' ')
    .replace(/\s+\./g, '.')
    .trim();
}

function parseCarta(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const products = [];
  const usedSlugs = new Set();
  const warnings = [];
  let sectionSlug = null;
  let caipiraFruitNote = '';
  let i = 0;

  const uniqueSlug = (base) => {
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    usedSlugs.add(slug);
    return slug;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    const header = isSectionHeader(trimmed);
    if (header) {
      if (header === 'frutas') {
        const noteParts = [];
        i += 1;
        while (i < lines.length) {
          const next = lines[i].trim();
          if (!next) {
            i += 1;
            continue;
          }
          if (isSectionHeader(next)) break;
          noteParts.push(next);
          i += 1;
        }
        const fruitText = noteParts.join(' ').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
        caipiraFruitNote = fruitText ? `Frutas: ${fruitText}.` : '';
        continue;
      }
      sectionSlug = header;
      i += 1;
      continue;
    }

    if (!sectionSlug || sectionSlug === 'bebidas') {
      // Under BEBIDAS without subsection yet: try product with inferred category
      if (sectionSlug !== 'bebidas') {
        i += 1;
        continue;
      }
    }

    if (!looksLikeProductName(trimmed) && sectionSlug === 'refrigerantes') {
      // Options line right after REFRIGERANTES header, e.g. (COCA-COLA...) R$ 9
      const { price, withoutPrice } = extractPrice(trimmed);
      if (price != null) {
        let desc = withoutPrice.replace(/^\(+|\)+$/g, '').trim();
        if (desc && !desc.endsWith('.')) desc = `${desc}.`;
        const slug = uniqueSlug('refrigerantes');
        products.push({
          slug,
          categorySlug: 'refrigerantes',
          namePt: 'Refrigerantes',
          descriptionPt: desc,
          priceBrl: price,
          featured: false,
          imageSrc: `/images/menu/${slug}.png`,
        });
        i += 1;
        continue;
      }
    }

    if (!looksLikeProductName(trimmed)) {
      i += 1;
      continue;
    }

    // Parse product starting at this line
    let nameLine = trimmed;
    let { price, withoutPrice } = extractPrice(nameLine);
    let namePtRaw = withoutPrice;
    let inlineDesc = '';

    if (namePtRaw.includes(':')) {
      const [left, ...rest] = namePtRaw.split(':');
      namePtRaw = left.trim();
      inlineDesc = rest.join(':').trim();
    }

    // Glued name+price already handled by extractPrice (NAPOLITANAR$ → NAPOLITANA)
    // Also handle CHICKEN BURGERR$ → CHICKEN BURGER via extractPrice leaving BURGER

    const descParts = [];
    if (inlineDesc) descParts.push(inlineDesc);

    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].trim();
      if (!next) {
        j += 1;
        // blank line: keep scanning for price/desc unless next product name follows
        continue;
      }
      if (isSectionHeader(next)) break;
      if (looksLikeProductName(next)) {
        // Next product — stop here (CAMARÃO CROCANTE without price is handled via defaults)
        break;
      }

      const priceOnly = extractPrice(next);
      if (priceOnly.price != null && !priceOnly.withoutPrice) {
        if (price == null) price = priceOnly.price;
        j += 1;
        break;
      }
      if (priceOnly.price != null && priceOnly.withoutPrice) {
        // desc + price on same line
        if (price == null) price = priceOnly.price;
        descParts.push(priceOnly.withoutPrice.replace(/^\(|\)$/g, '').trim());
        j += 1;
        break;
      }

      descParts.push(next.replace(/^\(|\)$/g, '').trim());
      j += 1;
    }

    const activeSection = sectionSlug === 'bebidas' ? 'refrigerantes' : sectionSlug;
    let namePt = titleCaseName(namePtRaw.replace(/:+$/, '').trim());
    // Fix common OCR/glued leftovers
    namePt = namePt.replace(/Burgerr$/i, 'Burger').replace(/Napolitanar$/i, 'Napolitana');

    let categorySlug = resolveCategory(activeSection, namePt);

    // Água / Red Bull while still on refrigerantes section
    if (activeSection === 'refrigerantes' || sectionSlug === 'bebidas') {
      categorySlug = resolveCategory(activeSection, namePt);
    }

    let descriptionPt = cleanDescription(descParts);
    if (categorySlug === 'caipiras' && caipiraFruitNote) {
      descriptionPt = caipiraFruitNote;
    }

    let slugBase = slugForProduct(categorySlug, namePt);
    // Prefer camarao-crocante alias
    if (slugify(namePt) === 'camarao-crocante') slugBase = 'camarao-crocante';
    if (slugify(namePt) === 'calabresa-acebolada') slugBase = 'calabresa-acebolada';
    if (slugify(namePt) === 'paper-plane') slugBase = 'paper-plane';
    if (slugify(namePt) === 'red-bull') slugBase = 'red-bull';
    if (slugify(namePt) === 'pink-lemonade') slugBase = 'pink-lemonade';
    if (slugify(namePt) === 'arnold-palmer') slugBase = 'arnold-palmer';
    if (slugify(namePt).startsWith('ballantine')) slugBase = slugForProduct(categorySlug, namePt);
    if (slugify(namePt) === 'heineken-zero') slugBase = slugForProduct(categorySlug, 'Heineken Zero');

    if (price == null) {
      const defaultPrice = MISSING_PRICE_DEFAULTS.get(slugBase);
      if (defaultPrice != null) {
        price = defaultPrice;
        warnings.push(
          `Missing price for "${namePt}" — using default R$ ${defaultPrice}`,
        );
      } else {
        warnings.push(`Skipping "${namePt}" — no price found`);
        i = j;
        continue;
      }
    }

    const slug = uniqueSlug(slugBase);
    products.push({
      slug,
      categorySlug,
      namePt,
      descriptionPt,
      priceBrl: price,
      featured: false,
      imageSrc: `/images/menu/${slug}.png`,
    });

    i = j;
  }

  if (caipiraFruitNote) {
    for (const product of products) {
      if (product.categorySlug === 'caipiras' && !product.descriptionPt) {
        product.descriptionPt = caipiraFruitNote;
      }
    }
  }

  return { products, warnings };
}

const text = readFileSync(cartaPath, 'utf8');
const { products, warnings } = parseCarta(text);

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (products.length === 0) {
  console.error('Parse failed: 0 products');
  process.exit(1);
}

const usedCategories = new Set(products.map((p) => p.categorySlug));
const categories = CATEGORIES.filter((c) => usedCategories.has(c.slug)).map(
  (c, index) => ({ ...c, sortOrder: index }),
);

const output = {
  categories,
  products,
  stores: [STORE],
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(
  `Wrote ${products.length} products in ${categories.length} categories → ${outPath}`,
);
