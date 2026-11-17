import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Next 16 ships native ESLint flat configs; the legacy FlatCompat wrapper
// produces circular-structure errors with eslint-config-next >= 16.
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Pre-existing debt: pptxgenjs handles (render.ts) and the loose slide
      // item shape (types.ts) are still `any`. Track as warnings until typed.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
];

export default eslintConfig;