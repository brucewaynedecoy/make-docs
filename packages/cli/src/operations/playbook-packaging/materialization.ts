/**
 * Per-kind dependency materialization (W18 R8 P2, R-DEPMAT-1).
 *
 * The dependency kind declared in the Playbook dependency registry determines
 * exactly how the compiler materializes it into the distributable:
 *
 * - `cli` and `package-manager` emit deterministic check scripts plus human
 *   instructions. A `cli` dependency on Make Docs itself references the
 *   stable operation identifier from the operation registry — never a CLI
 *   command string — so generated outputs survive CLI reorganization
 *   (R-DEPMAT-1, R-SCOPE-1). The emitted check may additionally include the
 *   human command form *derived* from the registry at compile time, but the
 *   identifier is always the stable reference carried in the script.
 * - `skill` and `plugin` emit harness-native manifest references where the
 *   selected container carries a manifest that can host the primitive, and
 *   degrade explicitly — a declared, documented manual step in the skill
 *   text — where it cannot (R-DEPMAT-1, R-CAP-4).
 * - `mcp` and `external-service` emit Make Docs metadata (a `runtimeCheck`
 *   record in the distributable's dependency declarations) plus a runtime
 *   availability check script.
 * - `reference` is copied into the distributable where redistribution is
 *   allowed and linked otherwise. Implementer decision (D9): a reference
 *   whose source resolves to a repository-local file is first-party content
 *   and redistribution is allowed; URLs and non-path sources are linked.
 *   A *required* reference that looks like a repository path but does not
 *   resolve is a missing dependency and fails closed before writes (R-GEN-2).
 * - `playbook` is included as an additional skill when the referenced
 *   Playbook is bundled into this distributable, and referenced when not.
 *
 * Implementer decisions recorded here (D9):
 * - `script` and `asset` dependency kinds exist in the W18 R6 vocabulary but
 *   R-DEPMAT-1 assigns them no materialization; they materialize as
 *   documented-only entries (human instructions in the skill text plus a
 *   dependency-declaration record) rather than inventing artifacts the
 *   contract does not call for.
 * - Check scripts are POSIX `sh` files under `checks/` at the container
 *   root; copied references live under `references/{dependencyId}/` so
 *   colliding basenames across dependencies cannot clobber each other.
 * - Runtime availability checks for `mcp`/`external-service` cannot probe a
 *   harness configuration portably, so the script honors an explicit
 *   `MAKE_DOCS_DEP_<ID>_AVAILABLE=1` override and otherwise exits `3`
 *   (verification required); the authoritative runtime evaluation belongs to
 *   the W18 R7 runner, which consumes the metadata record.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { PlaybookDependency, PlaybookDependencyKind } from "../../playbook";
// The operation registry is consulted at compile time only (functions are
// called at runtime, never during module evaluation), so this import is safe
// inside the registry -> package ops -> writer -> compiler module cycle.
import { hasOperation, operationCliPath } from "../registry";
import type { JsonValue } from "../types";
import type { HarnessContainerDeclaration } from "./capability-descriptor";
import type { PackagePlanStop, SourcePlaybookRef } from "./types";

export const DEPENDENCY_MATERIALIZATION_DISPOSITIONS = [
  "check-script",
  "manifest-reference",
  "declared-degradation",
  "metadata-with-runtime-check",
  "copied-reference",
  "linked-reference",
  "bundled-skill",
  "referenced-playbook",
  "documented-only",
  "unresolved",
] as const;
export type DependencyMaterializationDisposition =
  (typeof DEPENDENCY_MATERIALIZATION_DISPOSITIONS)[number];

/** A concrete file a dependency materializes into, relative to the container root. */
export interface DependencyMaterializedFile {
  path: string;
  content: string;
  executable: boolean;
}

export interface DependencyManifestReference {
  section: "skills" | "plugins" | "mcpServers";
  id: string;
}

export interface MaterializedDependency {
  dependencyId: string;
  kind: PlaybookDependencyKind | null;
  requirement: string | null;
  source: string;
  /** Canonical ref of the source Playbook that declared the dependency. */
  sourceRef: string;
  disposition: DependencyMaterializationDisposition;
  files: DependencyMaterializedFile[];
  manifestReference: DependencyManifestReference | null;
  /** Make Docs metadata carried into the distributable's dependency declarations. */
  metadata: Record<string, JsonValue>;
  /** Human instructions surfaced in the generated skill text. */
  instructions: string;
  /** The declared choice when the materialization degrades — never silent (R-CAP-4). */
  declaration: string | null;
  /** Stable operation identifier for `cli` dependencies on Make Docs itself. */
  operationId: string | null;
  stops: PackagePlanStop[];
}

export interface DependencyMaterializationContext {
  repoRoot: string;
  source: SourcePlaybookRef;
  /** Selected container; null when container selection failed upstream. */
  container: HarnessContainerDeclaration | null;
  /** Refs and slugs of every Playbook bundled into this distributable. */
  bundledRefs: Set<string>;
  /** Skill id per bundled source ref, for `playbook` bundled-skill pointers. */
  skillIdByRef: Map<string, string>;
}

export function materializeDependency(
  dependency: PlaybookDependency,
  context: DependencyMaterializationContext,
): MaterializedDependency {
  const dependencyId = dependency.id.value;
  const kind = dependency.kind.value;
  const base: MaterializedDependency = {
    dependencyId,
    kind,
    requirement: dependency.requirement.value,
    source: dependency.source.value,
    sourceRef: context.source.ref,
    disposition: "documented-only",
    files: [],
    manifestReference: null,
    metadata: {},
    instructions: "",
    declaration: null,
    operationId: null,
    stops: [],
  };
  switch (kind) {
    case "cli":
      return materializeCli(base, dependency);
    case "package-manager":
      return materializePackageManager(base, dependency);
    case "skill":
    case "plugin":
      return materializeHarnessPrimitive(base, dependency, kind, context);
    case "mcp":
    case "external-service":
      return materializeRuntimeChecked(base, dependency, kind);
    case "reference":
      return materializeReference(base, dependency, context);
    case "playbook":
      return materializePlaybook(base, dependency, context);
    case "script":
      return {
        ...base,
        disposition: "documented-only",
        instructions: `Provide the helper script dependency \`${dependencyId}\`: ${dependency.source.value}.`,
      };
    case "asset":
      return {
        ...base,
        disposition: "documented-only",
        instructions: `Provide the asset dependency \`${dependencyId}\`: ${dependency.source.value}.`,
      };
    default:
      return {
        ...base,
        disposition: "unresolved",
        instructions: `Dependency \`${dependencyId}\` declares an unknown kind and requires review.`,
        stops: [
          {
            reason: "manual-review-required",
            message: `Dependency \`${dependencyId}\` in ${context.source.ref} declares an unknown kind (\`${dependency.kind.raw ?? "missing"}\`); resolve it before packaging.`,
            ref: context.source.ref,
          },
        ],
      };
  }
}

function materializeCli(
  base: MaterializedDependency,
  dependency: PlaybookDependency,
): MaterializedDependency {
  const source = dependency.source.value;
  // A `cli` dependency on Make Docs itself names a stable operation registry
  // identifier as its source; the identifier — not a CLI command string — is
  // the reference carried in generated output (R-DEPMAT-1, R-SCOPE-1).
  if (hasOperation(source)) {
    const derivedCommand = `make-docs run ${operationCliPath(source)}`;
    return {
      ...base,
      disposition: "check-script",
      operationId: source,
      metadata: { operation: source },
      instructions:
        `Requires the Make Docs operation \`${source}\` ` +
        `(the current CLI form, derived from the operation registry, is \`${derivedCommand}\`).`,
      files: [
        checkScriptFile(base.dependencyId, [
          `# stable-reference: operation:${source}`,
          `# The command form below is derived from the operation registry at`,
          `# compile time; the operation identifier above is the stable reference.`,
          `MAKE_DOCS_OPERATION="${source}"`,
          `DERIVED_COMMAND="${derivedCommand}"`,
          `if ! command -v make-docs >/dev/null 2>&1; then`,
          `  echo "missing cli dependency: make-docs (operation $MAKE_DOCS_OPERATION)" >&2`,
          `  exit 1`,
          `fi`,
          `echo "ok: make-docs provides operation $MAKE_DOCS_OPERATION ($DERIVED_COMMAND)"`,
        ], base),
      ],
    };
  }
  const binary = executableToken(source, base.dependencyId);
  return {
    ...base,
    disposition: "check-script",
    instructions: `Requires the \`${binary}\` CLI on PATH${fallbackNote(dependency)}.`,
    files: [
      checkScriptFile(base.dependencyId, [
        `if ! command -v ${binary} >/dev/null 2>&1; then`,
        `  echo "missing cli dependency: ${binary}" >&2`,
        `  exit 1`,
        `fi`,
        `echo "ok: ${binary} is available"`,
      ], base),
    ],
  };
}

function materializePackageManager(
  base: MaterializedDependency,
  dependency: PlaybookDependency,
): MaterializedDependency {
  const binary = executableToken(dependency.source.value, base.dependencyId);
  return {
    ...base,
    disposition: "check-script",
    instructions:
      `Requires the \`${binary}\` package manager on PATH; ` +
      `install per: ${dependency.source.value}${fallbackNote(dependency)}.`,
    files: [
      checkScriptFile(base.dependencyId, [
        `if ! command -v ${binary} >/dev/null 2>&1; then`,
        `  echo "missing package-manager dependency: ${binary}" >&2`,
        `  exit 1`,
        `fi`,
        `echo "ok: ${binary} is available"`,
      ], base),
    ],
  };
}

function materializeHarnessPrimitive(
  base: MaterializedDependency,
  dependency: PlaybookDependency,
  kind: "skill" | "plugin",
  context: DependencyMaterializationContext,
): MaterializedDependency {
  const referencedId = executableToken(dependency.source.value, base.dependencyId);
  const container = context.container;
  const supported =
    container !== null &&
    container.hostedPrimitives.includes(kind) &&
    container.layout.manifestFilename !== null;
  if (supported) {
    return {
      ...base,
      disposition: "manifest-reference",
      manifestReference: { section: kind === "skill" ? "skills" : "plugins", id: referencedId },
      instructions: `Declared as a ${kind} dependency (\`${referencedId}\`) in the harness manifest.`,
    };
  }
  const gap = container === null
    ? "no container was selected"
    : container.layout.manifestFilename === null
      ? `container \`${container.containerId}\` has no harness manifest to reference it from`
      : `container \`${container.containerId}\` does not host the ${kind} primitive`;
  const declaration =
    `The target cannot carry a native ${kind} dependency reference for \`${base.dependencyId}\` (${gap}); ` +
    `it degrades to a documented manual step in the skill text — install \`${referencedId}\` yourself (R-DEPMAT-1, R-CAP-4).`;
  return {
    ...base,
    disposition: "declared-degradation",
    declaration,
    instructions:
      `Manual step: install the \`${referencedId}\` ${kind} in the target harness before using this skill` +
      `${fallbackNote(dependency)}.`,
  };
}

function materializeRuntimeChecked(
  base: MaterializedDependency,
  dependency: PlaybookDependency,
  kind: "mcp" | "external-service",
): MaterializedDependency {
  const target = dependency.source.value;
  const envToken = envVarToken(base.dependencyId);
  return {
    ...base,
    disposition: "metadata-with-runtime-check",
    metadata: {
      runtimeCheck: {
        type: kind === "mcp" ? "mcp-server-available" : "external-service-available",
        target,
      },
    },
    instructions: kind === "mcp"
      ? `Requires the \`${target}\` MCP server to be configured in the harness at run time${fallbackNote(dependency)}.`
      : `Requires the external service \`${target}\` to be reachable at run time${fallbackNote(dependency)}.`,
    files: [
      checkScriptFile(base.dependencyId, [
        `# Runtime availability check: the authoritative evaluation happens at`,
        `# run time from the Make Docs dependency metadata; this script honors`,
        `# an explicit availability override and otherwise reports that`,
        `# verification is required (exit 3).`,
        `if [ "\${MAKE_DOCS_DEP_${envToken}_AVAILABLE:-}" = "1" ]; then`,
        `  echo "ok: ${base.dependencyId} availability confirmed by override"`,
        `  exit 0`,
        `fi`,
        `echo "runtime dependency ${base.dependencyId} (${kind}) requires verification: ${target}" >&2`,
        `exit 3`,
      ], base),
    ],
  };
}

function materializeReference(
  base: MaterializedDependency,
  dependency: PlaybookDependency,
  context: DependencyMaterializationContext,
): MaterializedDependency {
  const source = dependency.source.value;
  if (isExternalUrl(source)) {
    return {
      ...base,
      disposition: "linked-reference",
      instructions: `Reference (linked; external sources are not redistributed): ${source}.`,
    };
  }
  const resolved = resolveLocalReference(source, context);
  if (resolved) {
    const relativePath = `references/${base.dependencyId}/${path.basename(resolved)}`;
    return {
      ...base,
      disposition: "copied-reference",
      metadata: { copiedFrom: repoRelative(resolved, context.repoRoot) },
      instructions: `Reference (copied from the Playbook's authority source): \`${relativePath}\`.`,
      files: [
        {
          path: relativePath,
          content: readFileSync(resolved, "utf8"),
          executable: false,
        },
      ],
    };
  }
  if (looksLikeRepoPath(source)) {
    const required = dependency.requirement.value === "required";
    return {
      ...base,
      disposition: "linked-reference",
      instructions: `Reference (linked; the source could not be resolved for redistribution): ${source}.`,
      stops: required
        ? [
            {
              reason: "unresolved-target",
              message: `Required reference dependency \`${base.dependencyId}\` in ${context.source.ref} names \`${source}\`, which does not resolve to a repository file; packaging fails closed before writes (R-GEN-2).`,
              ref: context.source.ref,
              path: source,
            },
          ]
        : [],
    };
  }
  return {
    ...base,
    disposition: "linked-reference",
    instructions: `Reference (linked): ${source}.`,
  };
}

function materializePlaybook(
  base: MaterializedDependency,
  dependency: PlaybookDependency,
  context: DependencyMaterializationContext,
): MaterializedDependency {
  const source = dependency.source.value;
  const token = executableToken(source, base.dependencyId);
  const bundled = context.bundledRefs.has(source) || context.bundledRefs.has(token);
  if (bundled) {
    const skillId = context.skillIdByRef.get(source) ??
      context.skillIdByRef.get(token) ??
      [...context.skillIdByRef.entries()].find(([ref]) => ref.endsWith(`/${token}`))?.[1] ??
      token;
    return {
      ...base,
      disposition: "bundled-skill",
      metadata: { bundledSkillId: skillId },
      instructions: `Bundled into this distributable as the \`${skillId}\` skill.`,
    };
  }
  return {
    ...base,
    disposition: "referenced-playbook",
    instructions:
      `Requires the \`${source}\` Playbook, which is not bundled here; ` +
      `package it separately or consult the source repository${fallbackNote(dependency)}.`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function dependencyCheckScriptPath(dependencyId: string): string {
  return `checks/${dependencyId}.sh`;
}

function checkScriptFile(
  dependencyId: string,
  bodyLines: string[],
  base: MaterializedDependency,
): DependencyMaterializedFile {
  return {
    path: dependencyCheckScriptPath(dependencyId),
    executable: true,
    content: [
      "#!/bin/sh",
      "# Generated by Make Docs playbook packaging. Do not edit.",
      `# dependency: ${dependencyId} (kind: ${base.kind ?? "unknown"}, requirement: ${base.requirement ?? "unspecified"})`,
      `# provenance: ${base.sourceRef}`,
      ...bodyLines,
      "",
    ].join("\n"),
  };
}

function executableToken(source: string, fallback: string): string {
  const token = source.trim().split(/\s+/)[0] ?? "";
  return /^[A-Za-z0-9@][\w@./-]*$/.test(token) ? token : fallback;
}

function envVarToken(dependencyId: string): string {
  return dependencyId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function fallbackNote(dependency: PlaybookDependency): string {
  const fallback = dependency.fallback.value.trim();
  return fallback.length > 0 && fallback.toLowerCase() !== "none"
    ? ` (fallback: ${fallback})`
    : "";
}

function isExternalUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function looksLikeRepoPath(value: string): boolean {
  return /^[.\w][\w./ -]*\.[A-Za-z0-9]+$/.test(value) || value.includes("/");
}

function resolveLocalReference(
  source: string,
  context: DependencyMaterializationContext,
): string | null {
  if (source.trim().length === 0 || source.includes("\0")) {
    return null;
  }
  const candidates = [
    path.resolve(context.repoRoot, source),
    path.resolve(context.repoRoot, path.dirname(context.source.path), source),
  ];
  for (const candidate of candidates) {
    if (!candidate.startsWith(context.repoRoot + path.sep)) {
      continue;
    }
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function repoRelative(absolutePath: string, repoRoot: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}
