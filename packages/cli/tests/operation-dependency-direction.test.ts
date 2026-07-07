import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * R-CORE-2: dependencies are one-way. Surfaces depend on the operation core;
 * the core never imports a surface, and no surface imports another surface.
 *
 * Surfaces here are the MCP server (`src/mcp/**`) and, historically, the
 * legacy CLI operation adapter (`src/operations/cli.ts`) — deleted by the
 * W18 R11 Phase 4 pruning; a guard below keeps it deleted. `src/cli.ts` is
 * the binary's composition root — it wires every command together and is
 * exempt by design.
 *
 * One declared exemption (W18 R13 P2; PRD 43 R-KIT-3, R-HOME-1): the
 * maintainer conformance-kit generator (`src/conformance/kit.ts`) MAY import
 * the composition root. It is lab tooling — never a registered operation,
 * never on a shipped surface — whose executable-by-construction rule
 * requires driving the REAL CLI parser and the real `setup` path in-process;
 * a parallel reimplementation would be exactly the drift D-023 recorded.
 * The exemption is scoped to that one file, in the driver direction only.
 */
const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const COMPOSITION_ROOT = path.join(SRC_ROOT, "cli.ts");
const CONFORMANCE_LAB_DRIVER = path.join(SRC_ROOT, "conformance", "kit.ts");
/** The binary entry point delegates straight to the composition root. */
const BIN_ENTRY = path.join(SRC_ROOT, "index.ts");
const CLI_ADAPTER = path.join(SRC_ROOT, "operations", "cli.ts");
const MCP_DIR = path.join(SRC_ROOT, "mcp");

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g;

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (full.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

function resolvedImports(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const targets: string[] = [];
  for (const match of text.matchAll(IMPORT_RE)) {
    const specifier = match[1]!;
    if (!specifier.startsWith(".")) continue;
    targets.push(path.resolve(path.dirname(file), specifier));
  }
  return targets;
}

function isMcpSurface(resolved: string): boolean {
  return resolved === MCP_DIR || resolved.startsWith(MCP_DIR + path.sep);
}

function isCliAdapterSurface(resolved: string): boolean {
  return resolved === CLI_ADAPTER || resolved === CLI_ADAPTER.slice(0, -3);
}

function isCompositionRoot(resolved: string): boolean {
  return resolved === COMPOSITION_ROOT || resolved === COMPOSITION_ROOT.slice(0, -3);
}

describe("operation core dependency direction (R-CORE-2)", () => {
  const allFiles = listSourceFiles(SRC_ROOT);
  const coreFiles = allFiles.filter(
    (file) =>
      file !== COMPOSITION_ROOT &&
      file !== BIN_ENTRY &&
      file !== CLI_ADAPTER &&
      !file.startsWith(MCP_DIR + path.sep),
  );
  const mcpFiles = allFiles.filter((file) => file.startsWith(MCP_DIR + path.sep));

  it("the core never imports a surface", () => {
    const violations: string[] = [];
    for (const file of coreFiles) {
      for (const target of resolvedImports(file)) {
        // Declared exemption: the maintainer conformance-lab driver drives
        // the composition root in-process (see the header note).
        if (file === CONFORMANCE_LAB_DRIVER && isCompositionRoot(target)) {
          continue;
        }
        if (isMcpSurface(target) || isCliAdapterSurface(target) || isCompositionRoot(target)) {
          violations.push(`${path.relative(SRC_ROOT, file)} -> ${path.relative(SRC_ROOT, target)}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("the MCP surface never imports the CLI surface", () => {
    const violations: string[] = [];
    for (const file of mcpFiles) {
      for (const target of resolvedImports(file)) {
        if (isCliAdapterSurface(target) || isCompositionRoot(target)) {
          violations.push(`${path.relative(SRC_ROOT, file)} -> ${path.relative(SRC_ROOT, target)}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("the legacy CLI operation adapter stays deleted (R-RUN-2)", () => {
    expect(existsSync(CLI_ADAPTER)).toBe(false);
  });
});
