import { defineConfig } from 'vite';
import { baseViteConfig } from '../../vite.config.base';
import * as path from 'path';

export default defineConfig({
    ...baseViteConfig,
    base: './', // Use relative paths for Electron compatibility
    envPrefix: ['VITE_', 'DEV_TOOLS'], // Expose DEV_TOOLS (from .env.devtools), the same variable the engine's build reads.
    resolve: {
        alias: {
            ...baseViteConfig.resolve?.alias,
            src: path.resolve(__dirname, 'src'),
        },
    },
});