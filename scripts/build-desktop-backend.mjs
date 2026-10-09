import { chmodSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';

// Tauri's production webview cannot execute the TypeScript/Express API server
// by itself. Bundle the server and ship the same Node runtime used for this build.
const root = process.cwd();
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 22) {
  throw new Error(`Supru desktop packaging requires Node.js 22 or newer; found ${process.versions.node}`);
}
const runtimeDir = resolve(root, 'resources');
const backendDir = resolve(root, 'dist-server');
mkdirSync(runtimeDir, { recursive: true });
mkdirSync(backendDir, { recursive: true });

const nodeTarget = resolve(runtimeDir, 'node');
copyFileSync(process.execPath, nodeTarget);
chmodSync(nodeTarget, 0o755);

await build({
  entryPoints: [resolve(root, 'server.ts')],
  outfile: resolve(backendDir, 'server.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'bundle',
  external: ['vite'],
  sourcemap: false,
  legalComments: 'none',
});

console.log('Prepared packaged API runtime:', nodeTarget);
console.log('Bundled API server:', resolve(backendDir, 'server.mjs'));
