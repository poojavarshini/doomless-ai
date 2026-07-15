import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "lib/**/*.test.ts", "apps/extension/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
