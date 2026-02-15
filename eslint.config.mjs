import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "out/**", "dist/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["*.config.js", "eslint.config.mjs", "postcss.config.js", "tailwind.config.js"],
    languageOptions: {
      globals: {
        module: "readonly",
        process: "readonly",
        require: "readonly"
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
);
