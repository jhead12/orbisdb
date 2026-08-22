// eslint.config.js or eslint.config.mjs (mjs is preferred for clarity)

import js from "@eslint/js";
import json from "@eslint/json";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  // Base configuration for all JavaScript and TypeScript files
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        alert: "readonly",
        confirm: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Other globals
        crypto: "readonly",
      },
    },
    rules: {
      "comma-dangle": ["warn", "always-multiline"],
    },
  },
  // TypeScript files configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
      next: nextPlugin,
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        alert: "readonly",
        confirm: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Other globals
        crypto: "readonly",
        // Project-specific globals
        Papa: "readonly",
        orbis: "readonly",
        shortAddress: "readonly",
        cliColors: "readonly",
        createNewContext: "readonly",
        saveInSettings: "readonly",
        LoopPluginVariables: "readonly",
        // Common event handler parameters
        e: "readonly",
        event: "readonly",
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json", // Adjust the path to your tsconfig.json
      },
    },
    rules: {
      // ESLint recommended rules
      "no-const-assign": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unused-vars": "off", // Turned off in favor of TypeScript's version
      "constructor-super": "error",
      "valid-typeof": "error",

      // TypeScript ESLint recommended rules
      "@typescript-eslint/no-unused-vars": "warn",

      // Original rules
      "comma-dangle": ["warn", "always-multiline"],
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // JSON files configuration
  {
    files: ["**/*.jsonc", "**/*.json5"],
    plugins: {
      json: json,
    },
    languageOptions: {
      parserOptions: {},
    },
    rules: {},
  },
  // Ignore problematic files
  {
    ignores: [
      "**/*.css",
      "**/*.json",
      "node_modules/**",
      // Next.js build output, regenerated locally by `next build`/`next dev` —
      // not source, shouldn't be linted.
      "**/.next/**",
      // Scaffold templates for plugin authors, not real source: they use
      // {{...}}/TEMPLATE: placeholder markers and import a nonexistent
      // ./baseDataSource, so they were never meant to compile or run as-is.
      "server/plugins/_template/**",
    ],
  },
];
