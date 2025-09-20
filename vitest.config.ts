import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import viteConfig from './vite.config.storybook';

export default defineConfig({
    test: {
        // Configure projects for two separate test environments.
        projects: [
            {
                // Traditional unit tests - inherit base config.
                ...viteConfig,
                test: {
                    name: 'unit',
                    include: ['packages/*/src/**/*.test.{js,ts,jsx,tsx}'],
                    environment: 'node',
                },
            },
            {
                // Storybook tests - inherit base config and add storybook plugin to existing plugins.
                ...viteConfig,
                plugins: [
                    ...[viteConfig.plugins ?? []],
                    storybookTest(),
                ],
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        headless: true,
                        instances: [{ browser: 'chromium' }],
                        provider: 'playwright',
                    },
                    setupFiles: ['./.storybook/vitest.setup.ts'],
                },
            },
        ],
    },
});