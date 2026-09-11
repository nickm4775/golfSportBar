const fs = require('fs');
const path = require('path');

const srcUi = path.join(__dirname, '..', 'src', 'ui');
const distUi = path.join(__dirname, '..', 'dist', 'ui');
fs.mkdirSync(distUi, { recursive: true });
for (const file of fs.readdirSync(srcUi)) {
  if (file.endsWith('.html') || file.endsWith('.css')) {
    fs.copyFileSync(path.join(srcUi, file), path.join(distUi, file));
  }
}
