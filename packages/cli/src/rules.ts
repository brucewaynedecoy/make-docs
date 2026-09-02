import type { Capability, InstallProfile } from "./types";

export interface PromptRule {
  relativePath: string;
  requires: Capability[];
}

export const PROMPT_RULES: PromptRule[] = [
  {
    relativePath: ".make-docs/system/prompts/docs-path-hygiene-cleanup.prompt.md",
    requires: [],
  },
  {
    relativePath: ".make-docs/system/prompts/request-to-design.prompt.md",
    requires: ["designs"],
  },
  {
    relativePath: ".make-docs/system/prompts/designs-to-plan.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: ".make-docs/system/prompts/designs-to-plan-change.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: ".make-docs/system/prompts/plan-to-prd-change.prompt.md",
    requires: ["plans", "prd"],
  },
  {
    relativePath: ".make-docs/system/prompts/plan-to-prd-green-field.prompt.md",
    requires: ["plans", "prd"],
  },
  {
    relativePath: ".make-docs/system/prompts/prd-change-to-work.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: ".make-docs/system/prompts/prd-to-work-full-prd.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: ".make-docs/system/prompts/prd-to-work-prd-feature.prompt.md",
    requires: ["prd", "work"],
  },
  {
    relativePath: ".make-docs/system/prompts/coverage-pass-developer-guide.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/coverage-pass-user-guide.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/coverage-pass-prd-reconciliation.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/coverage-pass-testing-uat.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/naive-uat-facilitator.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/naive-uat-tester.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/work-to-guides.prompt.md",
    requires: ["work"],
  },
  {
    relativePath: ".make-docs/system/prompts/update-readme-green-field.prompt.md",
    requires: ["designs", "plans"],
  },
  {
    relativePath: ".make-docs/system/prompts/session-to-history-record.prompt.md",
    requires: [],
  },
  {
    relativePath: ".make-docs/system/prompts/work-to-commit-message.prompt.md",
    requires: [],
  },
];

const PLAN_TEMPLATE_PATHS = [
  ".make-docs/system/templates/plan-overview.md",
  ".make-docs/system/templates/plan-prd.md",
  ".make-docs/system/templates/plan-prd-decompose.md",
  ".make-docs/system/templates/plan-prd-change.md",
];

const PRD_TEMPLATE_PATHS = [
  ".make-docs/system/templates/prd-architecture.md",
  ".make-docs/system/templates/prd-glossary.md",
  ".make-docs/system/templates/prd-index.md",
  ".make-docs/system/templates/prd-overview.md",
  ".make-docs/system/templates/prd-reference.md",
  ".make-docs/system/templates/prd-risk-register.md",
  ".make-docs/system/templates/prd-subsystem.md",
];

const WORK_TEMPLATE_PATHS = [
  ".make-docs/system/templates/work-index.md",
  ".make-docs/system/templates/work-phase.md",
];

const ALWAYS_TEMPLATE_PATHS = [
  ".make-docs/system/templates/guide-developer.md",
  ".make-docs/system/templates/guide-user.md",
  ".make-docs/system/templates/history-record.md",
  ".make-docs/system/templates/naive-uat-scenario.md",
];

const REQUIRED_REFERENCE_PATHS = {
  designs: [
    ".make-docs/system/references/design-workflow.md",
    ".make-docs/system/contracts/design-contract.md",
  ],
  plans: [
    ".make-docs/system/references/planning-workflow.md",
    ".make-docs/system/contracts/output-contract.md",
    ".make-docs/system/references/prd-change-management.md",
  ],
  prd: [
    ".make-docs/system/references/execution-workflow.md",
    ".make-docs/system/contracts/output-contract.md",
    ".make-docs/system/references/prd-change-management.md",
  ],
  work: [
    ".make-docs/system/references/execution-workflow.md",
    ".make-docs/system/contracts/output-contract.md",
    ".make-docs/system/references/prd-change-management.md",
  ],
} as const;

const ALWAYS_REFERENCE_PATHS = [
  ".make-docs/system/contracts/guide-contract.md",
  ".make-docs/system/contracts/deferred-obligation-contract.md",
  ".make-docs/system/contracts/naive-uat-contract.md",
  ".make-docs/system/references/wave-model.md",
  ".make-docs/system/references/lifecycle.md",
  ".make-docs/system/contracts/coverage-pass-contract.md",
  ".make-docs/system/contracts/history-record-contract.md",
  ".make-docs/system/contracts/commit-message-convention.md",
  ".make-docs/system/contracts/system-resource-contract.md",
  ".make-docs/system/references/path-and-link-hygiene.md",
  ".make-docs/system/references/naive-uat-workflow.md",
  ".make-docs/system-resources.catalog.json",
  ".make-docs/system-resources.schema.json",
];

const ALWAYS_SCRIPT_PATHS = [".make-docs/scripts/check_path_hygiene.py"];

const ALWAYS_PLAYBOOK_DEFAULT_PATHS = [
  "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
  "docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md",
  "docs/assets/playbooks/user/naive-uat-tester.playbook.md",
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

export function getScriptPaths(_profile: InstallProfile): string[] {
  return [...ALWAYS_SCRIPT_PATHS];
}

export function getPlaybookDefaultPaths(_profile: InstallProfile): string[] {
  return [...ALWAYS_PLAYBOOK_DEFAULT_PATHS];
}

export function getTemplatePaths(profile: InstallProfile): string[] {
  const paths = new Set<string>();

  for (const templatePath of ALWAYS_TEMPLATE_PATHS) {
    paths.add(templatePath);
  }

  if (profile.capabilityState.designs.effectiveSelection) {
    paths.add(".make-docs/system/templates/design.md");
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
    paths.add(".make-docs/system/references/harness-capability-matrix.md");
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
