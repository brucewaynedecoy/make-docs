import type { AgenticSkillFileRole } from "./types";

const SHARED_AGENTICS_SKILL_DIR = ".make-docs/agentics/skills";
const HARNESS_SKILL_DIRS = [".claude/skills", ".agents/skills"] as const;

export function classifyAgenticSkillFileRole(options: {
  relativePath: string;
  sourceId?: string;
}): AgenticSkillFileRole | undefined {
  const normalizedPath = normalizePath(options.relativePath);
  const sourceId = options.sourceId ?? "";

  if (
    sourceId.startsWith("skill:shared:") ||
    sourceId.startsWith("skill-shared-asset:") ||
    isSharedAgenticsSkillPath(normalizedPath)
  ) {
    return "shared-payload";
  }

  if (sourceId.startsWith("skill-exposure:")) {
    return "native-exposure";
  }

  if (sourceId.startsWith("skill-copy-mirror-asset:")) {
    return "copy-mirror";
  }

  if (isLegacyDuplicatedSkillSource(sourceId)) {
    return "legacy-duplicated-payload";
  }

  if (sourceId.startsWith("skill-stub:")) {
    return "generated-stub";
  }

  if (isHarnessSkillPath(normalizedPath)) {
    return "legacy-duplicated-payload";
  }

  return undefined;
}

export function formatAgenticSkillFileRole(
  role: AgenticSkillFileRole | undefined,
): string | undefined {
  switch (role) {
    case "shared-payload":
      return "shared payload";
    case "native-exposure":
      return "native harness exposure";
    case "copy-mirror":
      return "managed copy mirror";
    case "generated-stub":
      return "generated harness stub";
    case "legacy-duplicated-payload":
      return "legacy duplicated payload";
    case undefined:
      return undefined;
  }
}

export function isSharedAgenticsSkillPath(relativePath: string): boolean {
  return matchesKnownRoot(normalizePath(relativePath), SHARED_AGENTICS_SKILL_DIR);
}

export function isHarnessSkillPath(relativePath: string): boolean {
  const normalizedPath = normalizePath(relativePath);
  return HARNESS_SKILL_DIRS.some((root) => matchesKnownRoot(normalizedPath, root));
}

function isLegacyDuplicatedSkillSource(sourceId: string): boolean {
  return (
    sourceId.startsWith("skill-asset:") ||
    sourceId.startsWith("retired-skill-asset:") ||
    (sourceId.startsWith("skill:") &&
      !sourceId.startsWith("skill:shared:") &&
      !sourceId.startsWith("skill-stub:"))
  );
}

function matchesKnownRoot(relativePath: string, root: string): boolean {
  return relativePath === root || relativePath.startsWith(`${root}/`) || relativePath.includes(`/${root}/`);
}

function normalizePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/");
}
