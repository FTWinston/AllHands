import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
    framework: {
        name: getAbsolutePath('@storybook/react-vite'),
        options: {
            builder: {
                viteConfigPath: 'vite.config.storybook.ts',
            },
        },
    },

    stories: [
        '../packages/*/src/**/*.mdx',
        '../packages/*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    ],
    addons: [
        getAbsolutePath('@storybook/addon-a11y'),
        getAbsolutePath('@storybook/addon-docs'),
        getAbsolutePath('@chromatic-com/storybook'),
        getAbsolutePath('@storybook/addon-vitest'),
    ],

    typescript: {
        reactDocgen: 'react-docgen-typescript',
    },
};

export default config;

function getAbsolutePath(value: string) {
    return dirname(require.resolve(join(value, 'package.json')));
}
