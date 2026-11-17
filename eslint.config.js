import * as astroEslintParser from 'astro-eslint-parser';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroEslintParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,astro}'],
    rules: {
      'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
    },
  },
  {
    // Define the configuration for `<script>` tag.
    // Script in `<script>` is assigned a virtual file name with the `.js` extension.
    files: ['**/*.{ts,tsx}', '**/*.astro/*.js'],
    languageOptions: {
      parser: typescriptParser,
    },
    rules: {
      // Note: you must disable the base rule as it can report incorrect errors
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['src/components/common/Analytics.astro', 'src/components/common/Analytics.astro/**'],
    rules: {
      'prefer-rest-params': 'off',
      'no-var': 'off',
    },
  },
  {
    files: ['**/*.cjs', '**/*.mjs', 'scripts/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.{js,ts,mjs,cjs}'],
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-ignore': 'allow-with-description', 'ts-nocheck': 'allow-with-description' },
      ],
    },
  },
  {
    files: ['src/i18n/generated/**'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    ignores: [
      'dist',
      'node_modules',
      '.github',
      '.wrangler',
      '**/.wrangler/**',
      '**/.wrangler-tmp/**',
      'types.generated.d.ts',
      '.astro',
      '**/*.yaml',
      '**/*.yml',
      'src/pages/keystatic/',
    ],
  },
];
