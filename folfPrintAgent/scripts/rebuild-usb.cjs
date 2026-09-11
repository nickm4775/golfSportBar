#!/usr/bin/env node
/**
 * Rebuild native `usb` for the bundled Electron ABI.
 * - Forces C++17 (node-addon-api needs void_t / is_*_v; binding.gyp pins c++1y)
 * - Builds for host arch only (universal x86_64+arm64 often breaks deps paths on macOS)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'node_modules', 'usb', 'build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}

const hostArch = os.arch() === 'arm64' ? 'arm64' : os.arch() === 'x64' ? 'x64' : os.arch();

const env = {
  ...process.env,
  CXXFLAGS: `${process.env.CXXFLAGS || ''} -std=c++17`.trim(),
  npm_config_cxxflags: '-std=c++17',
  npm_config_arch: hostArch,
  npm_config_target_arch: hostArch,
};

const bin = path.join(root, 'node_modules', '@electron', 'rebuild', 'lib', 'cli.js');
const args = ['-f', '-w', 'usb'];
const result = spawnSync(process.execPath, [bin, ...args], {
  env,
  stdio: 'inherit',
  cwd: root,
});

if (result.status !== 0) {
  console.error(
    '\n[warn] Native usb rebuild failed. Discovery USB still works via OS commands; USB print needs a successful rebuild.',
  );
  console.error('Tip: npm run rebuild\n');
  process.exit(result.status || 1);
}

console.log(`usb rebuilt for Electron (${hostArch}) OK`);
