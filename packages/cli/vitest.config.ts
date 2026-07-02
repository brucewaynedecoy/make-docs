import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Redirects the make-docs global store (~/.make-docs) to a temp directory
    // for every test worker so tests never touch the real home directory.
    setupFiles: ["tests/setup.ts"],
  },
});
