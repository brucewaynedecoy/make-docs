import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildPlaybookCatalog,
  resolvePlaybook,
} from "../src/operations";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function writePlaybook(
  root: string,
  persona: string,
  slug: string,
  stack: "build" | "run",
  title = slug,
): string {
  return writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      `stack: ${stack}`,
      `summary: ${title} summary.`,
      "---",
      "",
      `# ${title}`,
      "",
    ].join("\n"),
  );
}

describe("playbook operation domain", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("catalogs valid playbooks with persona, slug, stack, title, and summary", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    const catalog = buildPlaybookCatalog({ repoRoot: root });

    expect(catalog.entries).toEqual([
      expect.objectContaining({
        path: "docs/assets/playbooks/user/use-system.md",
        persona: "user",
        slug: "use-system",
        ref: "user/use-system",
        stack: "run",
        title: "Use System",
        summary: "Use System summary.",
      }),
    ]);
    expect(catalog.diagnostics).toEqual([]);
  });

  test("resolves explicit paths before catalog references", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    const playbookPath = writePlaybook(root, "developer", "build-stack", "build", "Build Stack");

    const resolution = resolvePlaybook({
      repoRoot: root,
      ref: playbookPath,
      requestedStack: "build",
    });

    expect(resolution.mode).toBe("explicit-path");
    expect(resolution.entry).toEqual(
      expect.objectContaining({
        ref: "developer/build-stack",
        stack: "build",
      }),
    );
  });

  test("resolves persona slug as the canonical catalog identity", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    const resolution = resolvePlaybook({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "run",
    });

    expect(resolution.mode).toBe("qualified-ref");
    expect(resolution.entry.ref).toBe("user/use-system");
  });

  test("allows bare slug or title only when it maps to exactly one candidate", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");
    writePlaybook(root, "developer", "build-stack", "build", "Build Stack");

    expect(resolvePlaybook({ repoRoot: root, ref: "use-system" }).entry.ref).toBe("user/use-system");
    expect(resolvePlaybook({ repoRoot: root, ref: "Build Stack" }).entry.ref).toBe("developer/build-stack");
  });

  test("fails closed for ambiguous bare refs with persona and stack guidance", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "review", "run", "Review");
    writePlaybook(root, "developer", "review", "build", "Review");

    expect(() => resolvePlaybook({ repoRoot: root, ref: "review" })).toThrow(
      "provide persona/slug and, if needed, a stack",
    );
  });

  test("fails before execution when the requested stack does not match", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    expect(() => resolvePlaybook({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "build",
    })).toThrow("has stack `run`, but `build` was requested");
  });
});
