import coreConfig from "./eslint.config.mjs";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  ...coreConfig,
  ...compat.extends("next/typescript"),
];
