module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    "airbnb-base",
    "plugin:security/recommended",
    "plugin:jest/recommended",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["security", "jest"],
  rules: {
    // Customized ESLint Rules
    "no-console": "off",
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "max-len": [
      "error",
      {
        code: 120,
        ignoreComments: true,
        ignoreTrailingComments: true,
      },
    ],
    "import/extensions": [
      "error",
      "always",
      {
        js: "always",
        mjs: "always",
      },
    ],
    "no-underscore-dangle": [
      "error",
      {
        allow: ["_id"],
      },
    ],

    // Security Rules
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-fs-filename": "warn",

    // Jest Rules
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".mjs"],
      },
    },
  },
};
