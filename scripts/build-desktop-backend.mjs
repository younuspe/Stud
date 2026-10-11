import { chmodSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { createRequire } from 'node:module';

// Tauri's production webview cannot execute the TypeScript/Express API server on
// its own. Bundle the server with esbuild and ship the same Node runtime used for
// this build so `src-tauri/src/lib.rs` can spawn it as a sidecar.
const root = process.cwd();
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 22) {
  throw new Error(`Supru desktop packaging requires Node.js 22 or newer; found ${process.versions.node}`);
}
const runtimeDir = resolve(root, 'src-tauri', 'resources');
const backendDir = resolve(root, 'src-tauri', 'dist-server');
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
  // Bundling everything means Express and friends (CommonJS) run inside one ESM
  // file. esbuild's interop leaves bare `require(...)` calls for builtins, so we
  // provide a working require via a banner instead of leaving them to throw.
  packages: 'bundle',
  // `vite` is only reached via a dynamic import on the dev path; keep it external
  // so the production bundle never tries to resolve its dev-only tooling.
  external: ['vite'],
  banner: {
    js: [
      "import { createRequire as __supruCreateRequire } from 'node:module';",
      'const require = __supruCreateRequire(import.meta.url);',
    ].join('\n'),
  },
  sourcemap: false,
  legalComments: 'none',
});

console.log('Prepared packaged API runtime:', nodeTarget);
console.log('Bundled API server:', resolve(backendDir, 'server.mjs'));
