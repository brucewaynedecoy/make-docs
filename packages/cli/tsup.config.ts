import { defineConfig } from "tsup";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, "../..");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  platform: "node",
  sourcemap: true,
  clean: true,
  bundle: true,
  noExternal: ["@clack/core", "@clack/prompts", "yaml"],
  esbuildPlugins: [
    {
      name: "yaml-browser-entry",
      setup(build) {
        build.onResolve({ filter: /^yaml$/ }, () => ({
          path: path.join(repoRoot, "node_modules/yaml/browser/index.js"),
        }));
      },
    },
  ],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
