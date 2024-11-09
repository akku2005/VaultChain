'use strict';

module.exports = {
  root: true,
  env: {
    browser: false,
    es2021: true,
    node: true,
    commonjs: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script', // Explicitly set to script for CommonJS
  },
  plugins: ['import'],

  // Remove the standalone 'strict' rule
  rules: {
    // Explicitly set strict mode
    strict: ['error', 'global'],

    // Linebreak style configuration
    'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],

    // CommonJS-specific rules
    'no-console': 'off',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
      },
    ],
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_id'],
      },
    ],

    // Module and import rules adjusted for CommonJS
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
    'import/no-dynamic-require': 'off',
    'global-require': 'warn',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      },
    ],
  },

  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.cjs'],
      },
    },
  },
};
