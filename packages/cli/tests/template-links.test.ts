import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  APPROVED_EXTERNAL_URI_SCHEMES,
  type TemplateLinkDocument,
  validateTemplateLinks,
} from "../src/template-links";
import { loadSystemResourceProvider } from "../src/operations/resource";
import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const REPRESENTATIVE_WORK_ROOT =
  "docs/work/2026-06-23-w10-r1-package-and-deployment-boundaries";

function loadSystemResourceUris(): ReadonlySet<string> {
  const provider = loadSystemResourceProvider({
    root: path.join(REPO_ROOT, "packages/docs/template"),
    packageName: "@brucewaynedecoy/make-docs",
    version: "test",
    source: "development",
  });
  if (!provider.ok) {
    throw new Error(provider.error.message);
  }
  return new Set(provider.value.resources.map((entry) => entry.identity.uri));
}

const SYSTEM_RESOURCE_URIS = loadSystemResourceUris();

function collectMarkdownFiles(directory: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const fullPath = path.join(current, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".md")) {
        files.push(path.relative(REPO_ROOT, fullPath).split(path.sep).join("/"));
      }
    }
  };
  walk(directory);
  return files.sort();
}

function templateDocument(templatePath: string): TemplateLinkDocument {
  const fileName = path.posix.basename(templatePath);
  const base = {
    templatePath,
    renderedPath: templatePath,
    contents: readFileSync(path.join(REPO_ROOT, templatePath), "utf8"),
  };

  if (fileName === "design.md") {
    return {
      ...base,
      renderedPath: "docs/designs/2026-04-15-docs-contract-v2-execution.md",
      allowedWholeLinkTokens: ["NEXT_PROMPT_LINK"],
      representativeReplacements: {
        NEXT_PROMPT_LINK:
          "[Baseline plan prompt](make-docs://system/prompt/designs-to-plan.prompt.md)",
      },
    };
  }

  if (fileName === "prd-index.md") {
    return {
      ...base,
      renderedPath: "docs/prd/00-index.md",
      allowedWholeLinkTokens: [
        "INDEX_LINK",
        "PRODUCT_OVERVIEW_LINK",
        "ARCHITECTURE_OVERVIEW_LINK",
        "RISK_REGISTER_LINK",
        "GLOSSARY_LINK",
        "ADAPTIVE_DOC_LINKS",
      ],
      representativeReplacements: {
        INDEX_LINK: "[PRD Index](00-index.md)",
        PRODUCT_OVERVIEW_LINK: "[Product Overview](01-product-overview.md)",
        ARCHITECTURE_OVERVIEW_LINK:
          "[Architecture Overview](02-architecture-overview.md)",
        RISK_REGISTER_LINK:
          "[Open Questions and Risk Register](03-open-questions-and-risk-register.md)",
        GLOSSARY_LINK: "[Glossary](04-glossary.md)",
        ADAPTIVE_DOC_LINKS:
          "[Installation Profile](05-installation-profile-and-manifest-lifecycle.md)",
      },
    };
  }

  if (fileName === "work-index.md" || fileName === "rebuild-backlog-index.md") {
    return {
      ...base,
      renderedPath: `${REPRESENTATIVE_WORK_ROOT}/00-index.md`,
      allowedWholeLinkTokens: ["PHASE_ONE_LINK", "PHASE_TWO_LINK"],
      representativeReplacements: {
        PHASE_ONE_LINK: "[Requirements and Scope](01-requirements-and-scope-gate.md)",
        PHASE_TWO_LINK:
          "[Shared Command and Runtime Contract](02-shared-command-and-runtime-contract.md)",
      },
    };
  }

  if (fileName === "work-phase.md" || fileName === "rebuild-backlog-phase.md") {
    return {
      ...base,
      renderedPath: `${REPRESENTATIVE_WORK_ROOT}/01-requirements-and-scope-gate.md`,
      allowedWholeLinkTokens: ["SOURCE_PRD_LINK_ONE", "SOURCE_PRD_LINK_TWO"],
      representativeReplacements: {
        SOURCE_PRD_LINK_ONE:
          "[Package Runtime](../../prd/16-package-runtime-and-deployment-boundaries.md)",
        SOURCE_PRD_LINK_TWO:
          "[Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)",
      },
    };
  }

  if (fileName === "naive-uat-scenario.md") {
    return {
      ...base,
      renderedPath: "docs/prd/46-naive-end-user-acceptance-testing.md",
      allowedWholeLinkTokens: ["PRD_LINKS_AND_ANCHORS", "O_LINK_OR_NONE"],
      representativeReplacements: {
        PRD_LINKS_AND_ANCHORS:
          "[Naive UAT requirements](46-naive-end-user-acceptance-testing.md)",
        O_LINK_OR_NONE:
          "[Open obligations](03-open-questions-and-risk-register.md)",
      },
    };
  }

  if (fileName === "plan-prd-change.md") {
    return {
      ...base,
      renderedPath:
        "docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-prd-change-docs-and-baseline-reconciliation.md",
      allowedWholeLinkTokens: ["INDEX_OR_LINK_PATH"],
      nonLinkTokens: ["LINK_UPDATE"],
      representativeReplacements: {
        INDEX_OR_LINK_PATH: "[PRD Index](../../prd/00-index.md)",
      },
    };
  }

  return base;
}

function diagnosticCodes(document: TemplateLinkDocument): string[] {
  return validateTemplateLinks({
    documents: [document],
    targetExists: (target) => existsSync(path.join(REPO_ROOT, target)),
    systemResourceUris: SYSTEM_RESOURCE_URIS,
  }).map((diagnostic) => diagnostic.code);
}

describe("template link validation", () => {
  test("all shipped and skill templates pass raw and representative-render checks", () => {
    const upstreamTemplates = collectMarkdownFiles(
      path.join(REPO_ROOT, "packages/docs/template/.make-docs/system/templates"),
    );
    const shippedTemplates = collectMarkdownFiles(
      path.join(REPO_ROOT, "packages/cli/template/.make-docs/system/templates"),
    );
    const skillTemplates = collectMarkdownFiles(path.join(REPO_ROOT, "packages/skills")).filter(
      (filePath) => filePath.includes("/assets/templates/"),
    );
    const documents = [...upstreamTemplates, ...shippedTemplates, ...skillTemplates].map(
      templateDocument,
    );

    expect(documents.length).toBeGreaterThanOrEqual(30);
    expect(
      validateTemplateLinks({
        documents,
        targetExists: (target) => existsSync(path.join(REPO_ROOT, target)),
        systemResourceUris: SYSTEM_RESOURCE_URIS,
      }),
    ).toEqual([]);
  });

  test("uses the contract external schemes and a cataloged representative prompt URI", () => {
    expect([...APPROVED_EXTERNAL_URI_SCHEMES].sort()).toEqual(["http", "https", "mailto"]);
    expect(
      SYSTEM_RESOURCE_URIS.has(
        "make-docs://system/prompt/designs-to-plan.prompt.md",
      ),
    ).toBe(true);
  });

  test("rejects an unknown whole-link token", () => {
    expect(
      diagnosticCodes({
        templatePath: "virtual/unknown.md",
        renderedPath: "docs/prd/00-index.md",
        contents: "- {{UNKNOWN_LINK}}\n",
      }),
    ).toContain("unknown-whole-link-token");
  });

  test("rejects a partial token inside a Markdown link", () => {
    expect(
      diagnosticCodes({
        templatePath: "virtual/partial.md",
        renderedPath: "docs/prd/00-index.md",
        contents: "[Partial](./{{TARGET}}.md)\n",
      }),
    ).toContain("partial-link-token");
  });

  test("rejects a declared link token left unresolved after rendering", () => {
    expect(
      diagnosticCodes({
        templatePath: "virtual/unresolved.md",
        renderedPath: "docs/prd/00-index.md",
        contents: "- {{SOURCE_PRD_LINK_ONE}}\n",
        allowedWholeLinkTokens: ["SOURCE_PRD_LINK_ONE"],
      }),
    ).toContain("unresolved-rendered-link-token");
  });

  test("rejects a rendered relative link whose target is missing", () => {
    expect(
      diagnosticCodes({
        templatePath: "virtual/missing.md",
        renderedPath: "docs/prd/00-index.md",
        contents: "- {{SOURCE_PRD_LINK_ONE}}\n",
        allowedWholeLinkTokens: ["SOURCE_PRD_LINK_ONE"],
        representativeReplacements: {
          SOURCE_PRD_LINK_ONE: "[Missing](99-not-present.md)",
        },
      }),
    ).toContain("missing-relative-link-target");
  });

  test.each([
    [
      "wrong system-resource authority",
      "make-docs://other/prompt/designs-to-plan.prompt.md",
      "invalid-system-resource-uri",
    ],
    [
      "unknown system-resource type",
      "make-docs://system/script/designs-to-plan.prompt.md",
      "invalid-system-resource-uri",
    ],
    [
      "malformed system-resource URI",
      "make-docs://system/prompt/designs-to-plan.prompt.md?raw=true",
      "invalid-system-resource-uri",
    ],
    [
      "unknown system-resource path",
      "make-docs://system/prompt/not-present.prompt.md",
      "unknown-system-resource-uri",
    ],
    ["JavaScript URI", "javascript:alert(1)", "unsupported-uri-scheme"],
    ["invented URI scheme", "invented://example/resource", "unsupported-uri-scheme"],
  ])("rejects %s", (_label, target, expectedCode) => {
    expect(
      diagnosticCodes({
        templatePath: "virtual/uri.md",
        renderedPath: "docs/prd/00-index.md",
        contents: `[Target](${target})\n`,
      }),
    ).toContain(expectedCode);
  });
});
