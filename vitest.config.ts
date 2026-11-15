import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
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
                    include: ['packages/*/src/**/*.test.{js,ts,jsx,tsx}', 'content/**/*.test.{ts,tsx}'],
                    exclude: ['**/*.data.test.ts', '**/*.balance.test.ts'],
                    setupFiles: ['vitest.setup.ts'],
                    environment: 'node',
                    // Colyseus calls process.send(), which breaks vitest's child-process (forks) pool.
                    pool: 'threads',
                },
            },
            {
                // Simulations that play encounters out to see whether they're tuned right. They're slow, and fail when tuning changes, so aren't run on CI.
                ...viteConfig,
                test: {
                    name: 'balance',
                    include: ['packages/*/src/**/*.balance.test.ts', 'content/**/*.balance.test.ts'],
                    setupFiles: ['vitest.setup.ts'],
                    environment: 'node',
                    pool: 'threads',
                },
            },
            {
                // Checks on the game's data (e.g. card synergy tags), which can fail while that data is a work in progress, so aren't run on CI.
                ...viteConfig,
                test: {
                    name: 'data',
                    include: ['packages/*/src/**/*.data.test.ts', 'content/**/*.data.test.ts'],
                    setupFiles: ['vitest.setup.ts'],
                    environment: 'node',
                    pool: 'threads',
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
                        provider: playwright(),
                    },
                },
            },
        ],
    },
});