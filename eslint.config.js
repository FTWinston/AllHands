// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import stylistic from '@stylistic/eslint-plugin';

export default [
    {
        ignores: ['**/dist/', '**/node_modules/', '.vscode/'],
    },
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mts,ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@stylistic': stylistic,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            '@stylistic/indent': ['error', 4],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/eol-last': ['error', 'always'],
            '@stylistic/linebreak-style': ['error', 'windows'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/space-before-function-paren': ['error', 'never'],
            '@stylistic/brace-style': ['error', '1tbs'],
            curly: ['error', 'all'],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    ...storybook.configs['flat/recommended'],
];
