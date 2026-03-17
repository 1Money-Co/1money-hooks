/* eslint-disable */
const js = require('@eslint/js');
const globals = require('globals');
const typescriptParser = require('@typescript-eslint/parser');
const eslintReact = require('eslint-plugin-react');
const eslintTypescript = require('@typescript-eslint/eslint-plugin');
const eslintPrettier = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: [
      'build/**',
      'configs/**',
      'coverage/**',
      'dist/**',
      'es/**',
      'lib/**',
      'node_modules/**',
    ]
  },
  js.configs.recommended,
  {
    files: [
      '**/*.d.ts'
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: false
        },
        project: false
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': ['off']
    }
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx'
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        ...globals.browser,
        ...globals.es2022
      }
    },
    plugins: {
      react: eslintReact,
      typescript: eslintTypescript,
      prettier: eslintPrettier,
    },
    rules: {
      '@typescript-eslint/no-empty-interface': ['off'],
      '@typescript-eslint/camelcase': ['off'],
      '@typescript-eslint/array-type': ['off'],
      '@typescript-eslint/no-use-before-define': ['off'],
      '@typescript-eslint/no-angle-bracket-type-assertion': ['off'],
      '@typescript-eslint/interface-name-prefix': ['off'],
      'no-console': ['error', { 'allow': ['warn', 'error', 'info'] }],
      'semi': ['error', 'always'],
      'prefer-spread': ['warn'],
      'no-unused-vars': ['off'],
      'no-extra-semi': ['warn'],
      'quotes': ['error', 'single'],
      'linebreak-style': ['warn', 'unix'],
      'prettier/prettier': [
        'warn',
        {
          'printWidth': 50,
          'tabWidth': 2,
          'singleQuote': true,
          'jsxSingleQuote': true,
          'semi': true,
          'trailingComma': 'none',
          'endOfLine': 'auto',
          'arrowParens': 'avoid',
          'rangeEnd': 0
        }
      ]
    },
    ignores: [
      'build/*',
      'configs/*',
      'es/*',
      'lib/*',
      'dist/*',
      'node_modules/*',
      '**/__test__/*',
      '**/*.d.ts',
      'gulpfile.js',
      '*.config.js',
      '.fatherrc.ts',
      'vitest.config.ts',
      '**/__tests__/**',
    ]
  }
];
