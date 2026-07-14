import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "dist/**", "build/**", "apps/extension/dist/**", "output/**", "tmp/**", "out/**", "next-env.d.ts"]),
]);
