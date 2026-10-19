import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ["json", "json-summary", "text", "lcov"],
      enabled: true,
      include: [
        "src/*.ts",
      ],
    },
  },
});