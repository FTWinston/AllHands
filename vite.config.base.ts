import { Plugin, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import path from 'path';

/**
 * Our svgs are parsed into React components, but were still being emitted to the dist folder without this.
 */
export const preventSVGEmit: () => PluginOption = () => ({
    name: 'Prevent SVG emit',
    generateBundle(_opts, bundle) {
        for (const key in bundle) {
            if (key.endsWith('.svg')) {
                delete bundle[key];
            }
        }
    },
});

// Base configuration shared by all packages
export const baseViteConfig = {
    build: {
        sourcemap: true,
    },

    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
            },
        },
    },

    resolve: {
        alias: {
            'common-ui': path.resolve(__dirname, './packages/common-ui/src'),
            // Content files import every package by name, whichever package's build they're part of.
            'common-data': path.resolve(__dirname, './packages/common-data/src'),
            'engine': path.resolve(__dirname, './packages/engine/src'),
            'content': path.resolve(__dirname, './content'),
        },
    },

    plugins: [
        react(),
        svgr(),
        preventSVGEmit(),
        viteTsConfigPaths(),
    ],
};
