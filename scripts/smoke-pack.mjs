import { execFileSync, spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const cliPackageDir = path.join(repoRoot, "packages", "cli");
const npmHome = mkdtempSync(path.join(os.tmpdir(), "starter-docs-npm-home-"));
const packOutputDir = mkdtempSync(path.join(os.tmpdir(), "starter-docs-pack-output-"));

const EXPECTED_SKILL_PATHS = [
  ".claude/skills/archive-docs/SKILL.md",
  ".claude/skills/archive-docs/agents/openai.yaml",
  ".claude/skills/archive-docs/references/archive-workflow.md",
  ".claude/skills/archive-docs/scripts/trace_relationships.py",
  ".agents/skills/archive-docs/SKILL.md",
  ".agents/skills/archive-docs/agents/openai.yaml",
  ".agents/skills/archive-docs/references/archive-workflow.md",
  ".agents/skills/archive-docs/scripts/trace_relationships.py",
];

const LEGACY_SKILL_PATHS = [
  ".claude/skills/archive-docs-archive.md",
  ".claude/skills/archive-docs-staleness-check.md",
  ".claude/skills/archive-docs-deprecate.md",
  ".claude/skills/archive-docs-archive-impact.md",
  ".claude/skills/decompose-codebase.md",
  ".agents/skills/archive-docs-archive.md",
  ".agents/skills/archive-docs-staleness-check.md",
  ".agents/skills/archive-docs-deprecate.md",
  ".agents/skills/archive-docs-archive-impact.md",
  ".agents/skills/decompose-codebase.md",
  ".claude/skill-assets/archive-docs/references/archive-workflow.md",
  ".claude/skill-assets/archive-docs/scripts/trace_relationships.py",
  ".agents/skill-assets/archive-docs/references/archive-workflow.md",
  ".agents/skill-assets/archive-docs/scripts/trace_relationships.py",
];

function npmEnv() {
  const cacheDir = path.join(npmHome, ".npm");
  mkdirSync(cacheDir, { recursive: true });

  return {
    ...process.env,
    HOME: npmHome,
    npm_config_cache: cacheDir,
  };
}

execFileSync("npm", ["run", "prepack"], {
  cwd: cliPackageDir,
  stdio: "inherit",
  env: npmEnv(),
});

const packOutput = execFileSync(
  "npm",
  ["pack", "--json", "--ignore-scripts", "--pack-destination", packOutputDir],
  {
    cwd: cliPackageDir,
    encoding: "utf8",
    env: npmEnv(),
  },
);
const [{ filename }] = JSON.parse(packOutput);
const tarballPath = path.join(packOutputDir, filename);

const unpackDir = mkdtempSync(path.join(os.tmpdir(), "starter-docs-pack-"));
const targetDir = mkdtempSync(path.join(os.tmpdir(), "starter-docs-smoke-"));

try {
  execFileSync("tar", ["-xzf", tarballPath, "-C", unpackDir], { stdio: "inherit" });
  const packageRoot = path.join(unpackDir, "package");
  const packedCli = path.join(packageRoot, "dist/index.js");
  const fixtureServer = await startRepoFixtureServer(repoRoot);

  try {
    rewritePackedSkillRegistry(packageRoot, fixtureServer.baseUrl);
    execFileSync(
      "node",
      [packedCli, "init", "--yes", "--target", targetDir],
      { stdio: "inherit" },
    );
  } finally {
    await fixtureServer.close();
  }

  const manifestPath = path.join(targetDir, "docs/.starter-docs/manifest.json");
  assertExists(manifestPath, "Smoke pack install did not produce a manifest.");
  assertExists(
    path.join(targetDir, "docs/AGENTS.md"),
    "Smoke pack install did not produce docs/AGENTS.md.",
  );

  assertDirectoryEntries(path.join(targetDir, ".claude/skills"), ["archive-docs"]);
  assertDirectoryEntries(path.join(targetDir, ".agents/skills"), ["archive-docs"]);

  for (const relativePath of EXPECTED_SKILL_PATHS) {
    assertExists(
      path.join(targetDir, relativePath),
      `Smoke pack install did not produce ${relativePath}.`,
    );
  }

  assertMissing(
    path.join(targetDir, ".claude/skills/decompose-codebase"),
    "Smoke pack install should not install optional skill .claude/skills/decompose-codebase by default.",
  );
  assertMissing(
    path.join(targetDir, ".agents/skills/decompose-codebase"),
    "Smoke pack install should not install optional skill .agents/skills/decompose-codebase by default.",
  );
  assertMissing(
    path.join(targetDir, ".claude/skill-assets"),
    "Smoke pack install should not produce legacy .claude/skill-assets directory.",
  );
  assertMissing(
    path.join(targetDir, ".agents/skill-assets"),
    "Smoke pack install should not produce legacy .agents/skill-assets directory.",
  );

  for (const relativePath of LEGACY_SKILL_PATHS) {
    assertMissing(
      path.join(targetDir, relativePath),
      `Smoke pack install left legacy skill artifact ${relativePath}.`,
    );
  }

  const customFilePath = path.join(targetDir, "docs/.templates/custom-smoke.md");
  writeFileSync(customFilePath, "preserve this unmanaged smoke fixture\n", "utf8");

  execFileSync(
    "node",
    [packedCli, "backup", "--yes", "--target", targetDir],
    { stdio: "inherit" },
  );

  const backupRoot = path.join(targetDir, ".backup");
  const backupDir = getOnlyBackupDirectory(backupRoot);
  assertExists(path.join(backupDir, "AGENTS.md"), "Smoke pack backup did not copy AGENTS.md.");
  assertExists(
    path.join(backupDir, "docs/.starter-docs/manifest.json"),
    "Smoke pack backup did not copy the starter-docs manifest.",
  );

  execFileSync(
    "node",
    [packedCli, "uninstall", "--yes", "--target", targetDir],
    { stdio: "inherit" },
  );

  assertMissing(path.join(targetDir, "AGENTS.md"), "Smoke pack uninstall left AGENTS.md behind.");
  assertMissing(path.join(targetDir, "CLAUDE.md"), "Smoke pack uninstall left CLAUDE.md behind.");
  assertMissing(
    path.join(targetDir, "docs/.starter-docs/manifest.json"),
    "Smoke pack uninstall left the starter-docs manifest behind.",
  );
  assertExists(customFilePath, "Smoke pack uninstall removed an unmanaged custom file.");
  assertExists(backupRoot, "Smoke pack uninstall removed the .backup directory.");
  assertExists(path.join(backupDir, "AGENTS.md"), "Smoke pack uninstall modified the backup tree.");
} finally {
  rmSync(unpackDir, { recursive: true, force: true });
  rmSync(targetDir, { recursive: true, force: true });
  rmSync(packOutputDir, { recursive: true, force: true });
  rmSync(npmHome, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
}

function rewritePackedSkillRegistry(packageRoot, baseUrl) {
  const registryPath = path.join(packageRoot, "skill-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));

  registry.skills = registry.skills.map((entry) => ({
    ...entry,
    source: rewriteSkillSource(entry.source, baseUrl),
  }));

  writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

function rewriteSkillSource(source, baseUrl) {
  const normalizedSource = source.startsWith("url:") ? source.slice("url:".length) : source;
  const marker = "/packages/skills/";
  const markerIndex = normalizedSource.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Smoke pack could not map skill source ${source} to a local fixture.`);
  }

  const relativePath = normalizedSource.slice(markerIndex);
  return new URL(ensureTrailingSlash(relativePath), ensureTrailingSlash(baseUrl)).href;
}

async function startRepoFixtureServer(rootDir) {
  const fixtureScript = `
    import { createServer } from "node:http";
    import { readFileSync, statSync } from "node:fs";
    import path from "node:path";

    const rootDir = process.argv[1];

    function guessContentType(filePath) {
      if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
      if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "application/yaml; charset=utf-8";
      if (filePath.endsWith(".py")) return "text/x-python; charset=utf-8";
      return "application/octet-stream";
    }

    const server = createServer((request, response) => {
      if (!request.url) {
        response.writeHead(400).end("Missing request URL");
        return;
      }

      const requestUrl = new URL(request.url, "http://127.0.0.1");
      const relativePath = decodeURIComponent(requestUrl.pathname);
      const absolutePath = path.resolve(rootDir, \`.\${relativePath}\`);
      const rootWithSep = \`\${rootDir}\${path.sep}\`;

      if (absolutePath !== rootDir && !absolutePath.startsWith(rootWithSep)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      let stats;
      try {
        stats = statSync(absolutePath);
      } catch {
        response.writeHead(404).end("Not Found");
        return;
      }

      if (!stats.isFile()) {
        response.writeHead(404).end("Not Found");
        return;
      }

      const body = readFileSync(absolutePath);
      response.writeHead(200, {
        "Content-Length": body.byteLength,
        "Content-Type": guessContentType(absolutePath),
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      response.end(body);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        console.error("Smoke pack fixture server did not expose a TCP port.");
        process.exit(1);
        return;
      }

      process.stdout.write(\`\${address.port}\\n\`);
    });
  `;

  const serverProcess = spawn(process.execPath, ["--input-type=module", "-e", fixtureScript, rootDir], {
    stdio: ["ignore", "pipe", "inherit"],
  });

  const baseUrl = await new Promise((resolve, reject) => {
    const onExit = (code) => {
      reject(new Error(`Smoke pack fixture server exited before startup (code ${code ?? "null"}).`));
    };

    serverProcess.once("exit", onExit);
    serverProcess.stdout.once("data", (chunk) => {
      serverProcess.off("exit", onExit);
      resolve(`http://127.0.0.1:${String(chunk).trim()}`);
    });
    serverProcess.once("error", reject);
  });

  return {
    baseUrl,
    close: () =>
      new Promise((resolve) => {
        if (serverProcess.exitCode !== null) {
          resolve();
          return;
        }

        serverProcess.once("exit", () => resolve());
        serverProcess.kill();
      }),
  };
}

function assertExists(filePath, message) {
  if (!existsSync(filePath)) {
    throw new Error(message);
  }
}

function assertMissing(filePath, message) {
  if (existsSync(filePath)) {
    throw new Error(message);
  }
}

function assertDirectoryEntries(directoryPath, expectedEntries) {
  assertExists(directoryPath, `Smoke pack install did not produce ${directoryPath}.`);
  const actualEntries = readdirSync(directoryPath).sort();
  const expected = [...expectedEntries].sort();

  if (actualEntries.length !== expected.length) {
    throw new Error(
      `Unexpected contents in ${directoryPath}: expected ${expected.join(", ")}, got ${actualEntries.join(", ") || "(empty)"}.`,
    );
  }

  expected.forEach((entry, index) => {
    if (actualEntries[index] !== entry) {
      throw new Error(
        `Unexpected contents in ${directoryPath}: expected ${expected.join(", ")}, got ${actualEntries.join(", ") || "(empty)"}.`,
      );
    }
  });
}

function getOnlyBackupDirectory(backupRoot) {
  assertExists(backupRoot, "Smoke pack backup did not produce a .backup directory.");
  const backupEntries = readdirSync(backupRoot).filter((entry) =>
    existsSync(path.join(backupRoot, entry)),
  );

  if (backupEntries.length !== 1) {
    throw new Error(
      `Expected exactly one smoke-pack backup directory, found ${backupEntries.join(", ") || "(none)"}.`,
    );
  }

  return path.join(backupRoot, backupEntries[0]);
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
