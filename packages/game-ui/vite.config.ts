import { defineConfig } from 'vite';
import { baseViteConfig } from '../../vite.config.base';
import * as path from 'path';

export default defineConfig({
    ...baseViteConfig,
    base: './', // Use relative paths for Electron compatibility
    resolve: {
        alias: {
            ...baseViteConfig.resolve?.alias,
            src: path.resolve(__dirname, 'src'),
        },
    },
});