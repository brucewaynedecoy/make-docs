import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateDesignBody } from "../src/design-body";
import { validateGeneratedDocumentMetadata } from "../src/document-metadata";
import { buildCloseoutProbe, probeCloseout } from "../src/operations/closeout";
import { TEMPLATE_ROOT } from "../src/utils";

const direct = `Impact: \`direct\`

Affected humans: Import operators.

Human goal or effect: Retry failed rows without repeating successful work.

Experience promises:

- Show the import name, result, and next safe action.

Complexity kept out of the human path:

- Internal row keys remain available in detail output.

Evidence required:

- Inspect installed partial-failure output and exercise retry.`;
const indirect = `Impact: \`indirect\`

Affected humans: Operators who rely on queued imports.

Human goal or effect: Preserve accepted work through a service restart without changing normal controls.

Experience promises:

- Restart does not lose rows or repeat completed work.

Complexity kept out of the human path:

- Queue replay details do not become required operating steps.

Evidence required:

- Restart during an import and compare retained and completed rows.`;
const none = `Impact: \`none\`

Reason: A private helper split preserves the accepted behavior and operating limits.

Preserved experience: Public results, errors, steps, and resource bounds stay unchanged.

Evidence required:

- Compare results, errors, and accepted operating bounds.`;
const design = (intent: string) => `---\nkind: design\nstatus: draft\n---\n# Retry Imports\n\n## Context\n\nSome rows can fail.\n\n## Human Experience Intent\n\n${intent}\n\n## Decision\n\nKeep retry scoped to failed rows.\n`;
const historical = "---\nkind: design\n---\n# Older design\n\n## Context\n\nExisting intent.\n\n## Decision\n\nPreserve current behavior.\n";
const codes = (text: string) => validateDesignBody(text, "required").map(f => f.code);
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("Human Experience design structure", () => {
  it.each([direct, indirect, none])("accepts an authored conditional form", intent => {
    expect(validateDesignBody(design(intent), "required")).toEqual([]);
    expect(validateGeneratedDocumentMetadata(design(intent), { humanExperienceMode: "required" })).toEqual([]);
  });

  it("preserves historical and minor-edited designs unless the author selects required mode", () => {
    expect(validateDesignBody(historical)).toEqual([]);
    expect(validateGeneratedDocumentMetadata(historical + "\nA spelling repair.\n")).toEqual([]);
    expect(codes(historical)).toEqual(["hx-section-missing"]);
    expect(validateGeneratedDocumentMetadata(historical, { humanExperienceMode: "required" })).toEqual([
      expect.objectContaining({ code: "hx-section-missing", message: expect.stringContaining("Add one") }),
    ]);
    expect(validateGeneratedDocumentMetadata(historical.replace(/---[\s\S]*?---\n/u, ""), {
      sourcePath: "docs/designs/old.md", humanExperienceMode: "required",
    })).toEqual([expect.objectContaining({ code: "hx-section-missing" })]);
  });

  it.each([
    ["missing field", design(direct.replace("Affected humans: Import operators.\n", "")), "hx-fields"],
    ["invalid impact", design(direct.replace("`direct`", "`headless`")), "hx-impact"],
    ["two values", design(direct.replace("`direct`", "direct or indirect")), "hx-impact"],
    ["duplicate impact", design(direct + "\nImpact: direct"), "hx-impact"],
    ["duplicate section", design(direct) + "\n## Human Experience Intent\n" + direct, "hx-section-count"],
    ["wrong level", design(direct).replace("## Human Experience Intent", "### Human Experience Intent"), "hx-section-position"],
    ["wrong position", design(direct).replace("## Context", "## Decision").replace(/## Decision\n\nKeep/u, "## Context\n\nKeep"), "hx-section-position"],
    ["field order", design(direct.replace("Affected humans: Import operators.\n\nHuman goal or effect: Retry failed rows without repeating successful work.", "Human goal or effect: Retry failed rows without repeating successful work.\n\nAffected humans: Import operators.")), "hx-fields"],
    ["wrong form", design(none.replace("Reason:", "Affected humans:")), "hx-fields"],
    ["duplicate field", design(direct + "\nEvidence required: Inspect output."), "hx-fields"],
    ["empty scalar", design(direct.replace("Affected humans: Import operators.", "Affected humans:")), "hx-empty-field"],
    ["empty list", design(direct.replace("- Inspect installed partial-failure output and exercise retry.", "- <!-- fill later -->")), "hx-empty-field"],
    ["placeholder", design(direct.replace("Import operators.", "{{HUMANS}}")), "hx-placeholder"],
    ["unfinished value", design(none.replace("Public results, errors, steps, and resource bounds stay unchanged.", "TBD")), "hx-placeholder"],
  ])("reports %s with a repair", (_label, text, code) => {
    expect(codes(text)).toContain(code);
    expect(validateDesignBody(text, "required").every(f => f.field && f.message)).toBe(true);
  });

  it("ignores fenced and commented structure, including long and tilde fences", () => {
    for (const fence of ["```", "````", "~~~"]) {
      const example = `${fence}markdown\n## Human Experience Intent\nImpact: invalid\n${fence}\n`;
      expect(validateDesignBody(historical + example)).toEqual([]);
      expect(codes(historical + example)).toEqual(["hx-section-missing"]);
      expect(validateDesignBody(design(direct + "\n" + example), "required")).toEqual([]);
    }
    expect(codes(historical + "\n<!--\n## Human Experience Intent\nImpact: direct\n-->\n")).toEqual(["hx-section-missing"]);
    expect(validateDesignBody(design(direct).replace(/\n/gu, "\r\n"), "required")).toEqual([]);
  });

  it("keeps metadata findings and does not judge a misleading but well-formed none claim", () => {
    const misleading = design(none.replace("A private helper split preserves the accepted behavior and operating limits.", "Only an agent calls this API; humans never matter.").replace("Public results, errors, steps, and resource bounds stay unchanged.", "Operators receive new failure output and must use new recovery steps."));
    // Interpretation-review negative: authority requires reconsidering this effect. Structure cannot decide meaning.
    expect(validateDesignBody(misleading, "required")).toEqual([]);
    const findings = validateGeneratedDocumentMetadata(historical.replace("kind: design", "kind: design\nsource:\n  type: invented"), { humanExperienceMode: "required" });
    expect(findings.map(f => f.code)).toEqual(["hx-section-missing", "invalid-source-type"]);
  });

  it("renders the shipped template into each valid form and catches its unresolved placeholders", () => {
    const template = readFileSync(path.join(TEMPLATE_ROOT, ".make-docs/system/templates/design.md"), "utf8");
    expect(codes(template)).toContain("hx-placeholder");
    for (const intent of [direct, indirect, none]) {
      const rendered = template.replace(/## Human Experience Intent[\s\S]*?(?=## Decision)/u, `## Human Experience Intent\n\n${intent}\n\n`);
      expect(validateDesignBody(rendered, "required")).toEqual([]);
    }
  });

  it("checks tracked and untracked changed designs through both internal closeout callers", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-hx-closeout-"));
    roots.push(root);
    const file = "docs/designs/older.md";
    mkdirSync(path.join(root, "docs/designs"), { recursive: true });
    writeFileSync(path.join(root, file), historical);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-m", "fixture"], { cwd: root, stdio: "ignore" });
    writeFileSync(path.join(root, file), historical + "\nMinor edit.\n");
    writeFileSync(path.join(root, "docs/designs/new.md"), historical);
    writeFileSync(path.join(root, "docs/designs/AGENTS.md"), "# Router\n");
    expect(buildCloseoutProbe({ repoRoot: root, scope: "full" }).metadataValidation).toEqual([]);
    const required = { repoRoot: root, scope: "full" as const, humanExperienceRequiredPaths: [file, "docs/designs/new.md"] };
    const probe = probeCloseout(required).value;
    expect(probe.metadataValidation).toEqual([
      { path: "docs/designs/new.md", findings: [expect.objectContaining({ code: "hx-section-missing" })] },
      { path: file, findings: [expect.objectContaining({ code: "hx-section-missing" })] },
    ]);
    writeFileSync(path.join(root, file), design(direct));
    writeFileSync(path.join(root, "docs/designs/new.md"), design(none));
    expect(buildCloseoutProbe(required).metadataValidation).toEqual([]);
    writeFileSync(path.join(root, file), design(direct.replace("`direct`", "bad")));
    expect(buildCloseoutProbe({ repoRoot: root, scope: "full" }).metadataValidation).toEqual([
      { path: file, findings: [expect.objectContaining({ code: "hx-impact" })] },
    ]);
  });
});
