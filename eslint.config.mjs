import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/.turbo/**", "**/coverage/**"],
  },

  // Base: ESLint recommended + TypeScript recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Web (Next.js + React)
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // API (Fastify, Node.js)
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Shared package
  {
    files: ["packages/shared/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier: must be last to disable conflicting rules
  prettierConfig,
);
