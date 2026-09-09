import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Redirects the make-docs global store (~/.make-docs) to a temp directory
    // for every test worker so tests never touch the real home directory.
    // Durable Store writes share disk I/O; bound suite workers to avoid false timeout failures.
    maxWorkers: 2,
    // Durable Store integration cases include many fsync writes, not timing assertions.
    testTimeout: 20000,
    setupFiles: ["tests/setup.ts"],
  },
});
