// eslint.config.js
const globals = require('globals');
const js = require('@eslint/js');
const airbnbBase = require('eslint-config-airbnb-base');

module.exports = [
  {
    // Global settings
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        // Add Jest globals
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
      sourceType: 'script',
      ecmaVersion: 'latest',
    },

    // Base rules
    rules: {
      ...js.configs.recommended.rules,
      ...airbnbBase.rules,

      // Custom rules
      strict: ['error', 'global'],
      'no-console': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],
    },

    // Plugins
    plugins: {
      // You can add plugins here if needed
    },
  },

  // Specific configuration for test files
  {
    files: ['**/*.test.js', '**/*.spec.js', 'jest.setup.js'],
    rules: {
      'no-undef': 'off', // Disable no-undef for test files
    },
  },

  // Ignore patterns
  {
    ignores: ['node_modules/', 'logs/', 'coverage/', 'dist/', '*.config.js', 'jest.config.js'],
  },
];
