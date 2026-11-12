// Bundles the engine, and the common-data source it imports, into dist/index.js for game-app to load.
// Type declarations come separately, from tsc -b.
import { build } from 'esbuild';

// Set DEV_TOOLS=true (as build:devtools does, via .env.devtools) to build with the dev tools enabled.
const devTools = process.env.DEV_TOOLS === 'true';

await build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    platform: 'node',
    target: 'node22', // Electron 38's Node version.
    format: 'cjs', // game-app's compiled main.js loads this with require().
    sourcemap: true,
    keepNames: true,
    // Each file's paths, experimentalDecorators and useDefineForClassFields come from its nearest tsconfig.json,
    // so engine and common-data each resolve their own src/* alias, and Colyseus' @type decorators work.
    define: {
        'process.env.DEV_TOOLS': JSON.stringify(String(devTools)),
    },
    external: [
        // Provided by the Electron runtime.
        'electron',
        // Left to node_modules: @colyseus/core must share one copy of @colyseus/schema with our state classes,
        // and these packages (and express) have optional and dynamic requires that don't bundle cleanly.
        'colyseus',
        '@colyseus/*',
        'express',
    ],
    logLevel: 'info',
});
