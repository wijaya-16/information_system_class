import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist", "node_modules"] },

  // 1. Konfigurasi Frontend (React / Browser)
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["server/**/*.js"], // Abaikan folder server untuk aturan React
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // Mengizinkan window, document, dll.
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // 2. BAGIAN UTAMA: Konfigurasi Khusus Backend Server (Node.js)
  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // Mendaftarkan variabel Node.js seperti 'process', '__dirname', 'Buffer', dll.
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
