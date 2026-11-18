import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only this project's tests. `webdev-landing-page-morro/` is a legacy copy of
    // the site and must not be executed as part of the current suite.
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
