import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig([
    globalIgnores([
        '**/node_modules/**',
        '**/dist/**',
        'packages/am/src/features/api/types/endpoints.ts', // Do not lint auto-generated endpoint file.
    ]),
    {
        files: ['packages/*/src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
        languageOptions: {
            globals: globals.browser,
            parser: parserTs,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
                project: [
                    './tsconfig.json',
                    './tsconfig.node.json',
                    './packages/*/tsconfig.json',
                    './packages/*/tsconfig.node.json',
                ],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@stylistic': stylistic,
            '@typescript-eslint': tseslint,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            import: importPlugin,
            js,
            'jsx-a11y': jsxA11y,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tseslint.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.flatConfigs.recommended.rules,
            ...stylistic.configs.recommended.rules,
            '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
            'arrow-spacing': ['warn', { before: true, after: true }],
            'no-var': 'warn',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': 'error',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@stylistic/comma-dangle': ['warn', {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                functions: 'never',
                imports: 'always-multiline',
                enums: 'always-multiline',
            }],
            '@stylistic/semi': ['warn', 'always'],
            '@stylistic/indent': ['warn', 4],
            '@stylistic/indent-binary-ops': ['warn', 4],
            '@stylistic/jsx-indent-props': ['warn', 4],
            '@stylistic/jsx-closing-tag-location': ['warn', 'line-aligned'],
            '@stylistic/member-delimiter-style': ['warn', {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false,
                },
                multilineDetection: 'brackets',
            }],
            '@stylistic/max-statements-per-line': 'off',
            '@stylistic/multiline-ternary': 'off',
            '@stylistic/brace-style': ['warn', '1tbs'],
            'import/order': ['warn', {
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                    'type',
                ],
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
                pathGroupsExcludedImportTypes: ['builtin'],
            }],
            'import/newline-after-import': ['warn', { count: 1 }],
            'import/no-duplicates': ['warn', {
                "considerQueryString": true,
                "prefer-inline": true,
            }],
            'import/first': 'warn',
        },

    },
    // Define __dirname and process as globals for engine and game-app
    {
        files: [
            'packages/engine/src/**/*.{js,ts}',
            'packages/game-app/src/**/*.{js,ts}',
        ],
        languageOptions: {
            globals: {
                __dirname: 'readonly',
                process: 'readonly',
            },
        },
    },
    // Disable react-hooks/rules-of-hooks for story files
    {
        files: ['**/*.stories.tsx'],
        rules: {
            'react-hooks/rules-of-hooks': 'off',
        },
    },
]);
