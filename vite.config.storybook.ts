import { defineConfig } from 'vite';
import { baseViteConfig } from './vite.config.base';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { CanonicalizeContext } from 'sass';

/*
 * A custom resolver to handle 'src' alias based on the package context, for imports starting with "src" in typescript files.
 * (Individual packages resolve this to their own src directory. Storybook runs across all packages, so needs to replicate that.)
 */
const dynamicSrcAliasPlugin = {
    name: 'dynamic-src-alias',
    resolveId(id: string, importer?: string) {
        if (importer && (id === 'src' || id.startsWith('src/'))) {
            // First, determine which package the importer belongs to.
            const normalizedImporter = path.normalize(importer);
            let srcPath: string | null;

            if (normalizedImporter.includes(path.normalize('packages/common-ui/'))) {
                srcPath = path.resolve(__dirname, 'packages/common-ui/src');
            } else if (normalizedImporter.includes(path.normalize('packages/game-ui/'))) {
                srcPath = path.resolve(__dirname, 'packages/game-ui/src');
            } else if (normalizedImporter.includes(path.normalize('packages/player-ui/'))) {
                srcPath = path.resolve(__dirname, 'packages/player-ui/src');
            } else {
                return null;
            }

            // Resolve using the src directory of that package.
            return id === 'src'
                ? srcPath
                : path.resolve(srcPath, id.slice(4));
        }
        return null;
    }
};

// https://vitejs.dev/config
export default defineConfig({
    ...baseViteConfig,
    plugins: [
        ...baseViteConfig.plugins,
        dynamicSrcAliasPlugin,
    ],
});
