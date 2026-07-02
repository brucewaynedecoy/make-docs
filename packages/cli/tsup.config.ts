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
  // `zod` is bundled because the operation registry imports it eagerly at CLI
  // startup; the packed tarball must keep working when invoked directly with
  // `node dist/index.js` and no installed node_modules.
  noExternal: ["@clack/core", "@clack/prompts", "yaml", "zod"],
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
