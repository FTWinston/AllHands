import { defineConfig } from 'vite';
import { baseViteConfig } from '../../vite.config.base';
import * as path from 'path';

export default defineConfig({
    ...baseViteConfig,
    resolve: {
        alias: {
            ...baseViteConfig.resolve?.alias,
            src: path.resolve(__dirname, 'src'),
        },
    },
});