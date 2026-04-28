import type { Capability, InstallProfile } from "./types";

export interface PromptRule {
  relativePath: string;
  requires: Capability[];
}

export const PROMPT_RULES: PromptRule[] = [
  {
    relativePath: "docs/assets/prompts/request-to-design.prompt.md",
    requires: ["designs"],
  },
  {
    relativePath: "docs/assets/prompts/designs-to-plan.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: "docs/assets/prompts/designs-to-plan-change.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: "docs/assets/prompts/plan-to-prd-change.prompt.md",
    requires: ["plans", "prd"],
  },
  {
    relativePath: "docs/assets/prompts/plan-to-prd-green-field.prompt.md",
    requires: ["plans", "prd"],
  },
  {
    relativePath: "docs/assets/prompts/prd-change-to-work.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: "docs/assets/prompts/prd-to-work-full-prd.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: "docs/assets/prompts/prd-to-work-prd-feature.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: "docs/assets/prompts/update-readme-green-field.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: "docs/assets/prompts/session-to-history-record.prompt.md",
    requires: [],
  },
  {
    relativePath: "docs/assets/prompts/work-to-commit-message.prompt.md",
    requires: [],
  },
];

const PLAN_TEMPLATE_PATHS = [
  "docs/assets/templates/plan-overview.md",
  "docs/assets/templates/plan-prd.md",
  "docs/assets/templates/plan-prd-decompose.md",
  "docs/assets/templates/plan-prd-change.md",
];

const PRD_TEMPLATE_PATHS = [
  "docs/assets/templates/prd-architecture.md",
  "docs/assets/templates/prd-change-addition.md",
  "docs/assets/templates/prd-change-revision.md",
  "docs/assets/templates/prd-glossary.md",
  "docs/assets/templates/prd-index.md",
  "docs/assets/templates/prd-overview.md",
  "docs/assets/templates/prd-reference.md",
  "docs/assets/templates/prd-risk-register.md",
  "docs/assets/templates/prd-subsystem.md",
];

const WORK_TEMPLATE_PATHS = [
  "docs/assets/templates/work-index.md",
  "docs/assets/templates/work-phase.md",
];

const ALWAYS_TEMPLATE_PATHS = [
  "docs/assets/templates/guide-developer.md",
  "docs/assets/templates/guide-user.md",
  "docs/assets/templates/history-record.md",
];

const REQUIRED_REFERENCE_PATHS = {
  designs: ["docs/assets/references/design-workflow.md", "docs/assets/references/design-contract.md"],
  plans: [
    "docs/assets/references/planning-workflow.md",
    "docs/assets/references/output-contract.md",
    "docs/assets/references/prd-change-management.md",
  ],
  prd: [
    "docs/assets/references/execution-workflow.md",
    "docs/assets/references/output-contract.md",
    "docs/assets/references/prd-change-management.md",
  ],
  work: [
    "docs/assets/references/execution-workflow.md",
    "docs/assets/references/output-contract.md",
    "docs/assets/references/prd-change-management.md",
  ],
} as const;

const ALWAYS_REFERENCE_PATHS = [
  "docs/assets/references/guide-contract.md",
  "docs/assets/references/wave-model.md",
  "docs/assets/references/history-record-contract.md",
  "docs/assets/references/commit-message-convention.md",
];

export function profileHasCapabilities(
  profile: InstallProfile,
  capabilities: Capability[],
): boolean {
  return capabilities.every(
    (capability) => profile.capabilityState[capability].effectiveSelection,
  );
}

export function getPromptPaths(profile: InstallProfile): string[] {
  return PROMPT_RULES.filter((rule) => profileHasCapabilities(profile, rule.requires)).map(
    (rule) => rule.relativePath,
  );
}

export function getTemplatePaths(profile: InstallProfile): string[] {
  const paths = new Set<string>();

  for (const templatePath of ALWAYS_TEMPLATE_PATHS) {
    paths.add(templatePath);
  }

  if (profile.capabilityState.designs.effectiveSelection) {
    paths.add("docs/assets/templates/design.md");
  }

  if (profile.capabilityState.plans.effectiveSelection) {
    for (const templatePath of PLAN_TEMPLATE_PATHS) {
      paths.add(templatePath);
    }
  }

  if (profile.capabilityState.prd.effectiveSelection) {
    for (const templatePath of PRD_TEMPLATE_PATHS) {
      paths.add(templatePath);
    }
  }

  if (profile.capabilityState.work.effectiveSelection) {
    for (const templatePath of WORK_TEMPLATE_PATHS) {
      paths.add(templatePath);
    }
  }

  return Array.from(paths).sort();
}

export function getReferencePaths(profile: InstallProfile): string[] {
  const paths = new Set<string>();

  for (const referencePath of ALWAYS_REFERENCE_PATHS) {
    paths.add(referencePath);
  }

  for (const capability of Object.keys(REQUIRED_REFERENCE_PATHS) as Capability[]) {
    if (profile.capabilityState[capability].effectiveSelection) {
      for (const referencePath of REQUIRED_REFERENCE_PATHS[capability]) {
        paths.add(referencePath);
      }
    }
  }

  if (profile.effectiveCapabilities.length > 0) {
    paths.add("docs/assets/references/harness-capability-matrix.md");
  }

  return Array.from(paths).sort();
}

export function getReferenceDirInstalled(profile: InstallProfile): boolean {
  return getReferencePaths(profile).length > 0;
}

export function getTemplateDirInstalled(profile: InstallProfile): boolean {
  return getTemplatePaths(profile).length > 0;
}

export function getPromptsDirInstalled(profile: InstallProfile): boolean {
  return getPromptPaths(profile).length > 0;
}
