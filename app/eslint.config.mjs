import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import reactNative from "eslint-plugin-react-native";
import prettier from "eslint-plugin-prettier";

const eslintConfig = [
  // Base recommended configurations
  js.configs.recommended,

  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".expo/**",
      "web-build/**",
      "babel.config.js",
      "metro.config.js",
      "*.config.js",
      "assets/**",
      "high quality recordings/**",
      "supabase/**",
      "*.d.ts",
      "*.log",
      ".DS_Store",
      "android/**",
      "ios/**",
    ],
  },

  // Global configuration for all files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
      globals: {
        React: "readonly",
        JSX: "readonly",
        __DEV__: "readonly",
        console: "readonly",
        process: "readonly",
        require: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        NodeJS: "readonly",
        Buffer: "readonly",
        global: "readonly",
        module: "readonly",
        exports: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      "react-native": reactNative,
      prettier,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React specific rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      "react/jsx-props-no-spreading": "off",
      "react/no-unescaped-entities": "warn",
      "react/no-danger": "warn",
      "react/self-closing-comp": ["error", { component: true, html: true }],

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native specific rules
      "react-native/no-unused-styles": "warn",
      "react-native/split-platform-components": "warn",
      "react-native/no-inline-styles": "warn",
      "react-native/no-color-literals": "warn",
      "react-native/no-raw-text": "off",

      // Accessibility rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/accessible-emoji": "off",

      // Import organization and validation
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      // Prettier rules
      "prettier/prettier": "warn",

      // General best practices
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "no-alert": "warn",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["warn", "always"],
    },
  },
];

export default eslintConfig;
