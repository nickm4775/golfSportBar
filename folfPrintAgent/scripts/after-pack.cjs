/**
 * Re-firma adhoc el .app de macOS para sellar Resources.
 * Sin esto, identity:null deja una firma linker-signed rota y Gatekeeper
 * reporta la app como dañada.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  if (!fs.existsSync(appPath)) {
    console.warn(`[after-pack] No se encontró ${appPath}`);
    return;
  }

  console.log(`[after-pack] Re-firma adhoc: ${appPath}`);
  execFileSync(
    'codesign',
    ['--force', '--deep', '--sign', '-', appPath],
    { stdio: 'inherit' },
  );
};
