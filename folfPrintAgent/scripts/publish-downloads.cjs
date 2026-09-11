#!/usr/bin/env node
/**
 * Copia artefactos de NEGOCENDA_PrintAgent/release a
 * NEGOCENDA_Front/public/downloads/print-agent con los nombres que espera el modal.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'release');
const destDir = path.resolve(root, '../NEGOCENDA_Front/public/downloads/print-agent');

const mappings = [
  { from: /^Negocenda-Print-Agent-mac\.dmg$/, to: 'Negocenda-Print-Agent.dmg' },
  { from: /^Negocenda-Print-Agent\.dmg$/, to: 'Negocenda-Print-Agent.dmg' },
  { from: /^Negocenda-Print-Agent-Setup\.exe$/, to: 'Negocenda-Print-Agent-Setup.exe' },
  { from: /^Negocenda-Print-Agent\.AppImage$/, to: 'Negocenda-Print-Agent.AppImage' },
];

if (!fs.existsSync(releaseDir)) {
  console.error('No hay carpeta release/. Ejecuta primero: npm run dist:mac|win|linux');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
const files = fs.readdirSync(releaseDir);
let copied = 0;
for (const file of files) {
  for (const map of mappings) {
    if (map.from.test(file)) {
      const src = path.join(releaseDir, file);
      const dest = path.join(destDir, map.to);
      fs.copyFileSync(src, dest);
      console.log(`OK ${file} -> ${dest}`);
      copied += 1;
    }
  }
}

if (copied === 0) {
  console.error('No se encontraron instaladores en release/.');
  process.exit(1);
}
console.log(`Publicados ${copied} archivo(s) en ${destDir}`);
