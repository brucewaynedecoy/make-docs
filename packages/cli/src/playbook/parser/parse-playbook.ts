/**
 * The staged Playbook parser pipeline (R-MODEL-1..R-MODEL-3).
 *
 * One parser produces one fully resolved Playbook model, and every downstream
 * consumer reads that model instead of re-parsing Markdown. Parsing proceeds
 * in fixed stages — split frontmatter, parse frontmatter, locate and verify
 * headings, parse the fenced dependencies block, locate and parse the
 * `playbook` workflow block, resolve cross-references, assemble the model —
 * and each stage emits diagnostics while continuing where possible, so one
 * error never masks the rest. Fail-soft for diagnostics, fail-closed for
 * execution: the model is runnable only with zero errors.
 *
 * The library is pure: source text and its path come in, a model plus
 * diagnostics come out. There are no presentation or filesystem effects; the
 * caller reads the input file. The `playbook.validate` and `playbook.catalog`
 * operations, the runner, and a future language server all wrap this same
 * library (R-MODEL-6).
 */

import { createHash } from "node:crypto";
import {
  createPlaybookDiagnostic,
  derivePlaybookRunnable,
  type PlaybookDiagnostic,
} from "../diagnostics";
import {
  detectPlaybookFileForm,
  playbookDirectoryPersona,
  playbookSlugFromPath,
} from "../detection";
import type { PlaybookIdentity, PlaybookModel } from "../model";
import { LineIndex } from "../source-span";
import { parseDependenciesBlockStage } from "./dependencies-block";
import { parseFrontmatterStage, splitFrontmatter } from "./frontmatter";
import { scanHeadingsStage } from "./headings";
import { resolveCrossReferencesStage } from "./resolve";
import { parseWorkflowBlockStage } from "./workflow-block";

export interface ParsePlaybookInput {
  /** Path the source was read from; used for naming-form detection and identity. */
  sourcePath: string;
  /** Full Playbook source text. */
  source: string;
}

export interface ParsePlaybookResult {
  model: PlaybookModel;
  diagnostics: PlaybookDiagnostic[];
}

export function parsePlaybook(input: ParsePlaybookInput): ParsePlaybookResult {
  const diagnostics: PlaybookDiagnostic[] = [];
  const index = new LineIndex(input.source);

  // Stage 1: split frontmatter from body.
  const split = splitFrontmatter(input.source);

  // Stage 2: parse the frontmatter against the document schema.
  const frontmatter = parseFrontmatterStage(split, index, diagnostics);

  // File-form detection (R-DOC-2): the deprecated plain `<slug>.md` form with
  // `kind: playbook` parses but carries the PB-FILE-007 rename warning.
  const rawKind = typeof frontmatter.raw.kind === "string" ? frontmatter.raw.kind : null;
  const fileForm = detectPlaybookFileForm(input.sourcePath, rawKind);
  if (fileForm === "deprecated-plain") {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FILE-007", {
        message: `\`${input.sourcePath}\` uses the deprecated plain \`<slug>.md\` form; rename it to \`${playbookSlugFromPath(input.sourcePath)}.playbook.md\`.`,
        section: "file",
        span: frontmatter.kind?.span ?? null,
      }),
    );
  }

  // Stage 3: locate the required headings and verify presence and order.
  const headings = scanHeadingsStage(split.body, split.bodyOffset, index, diagnostics);

  // Stage 4: parse the fenced dependencies block (PRD 40 R-DEP-1..2).
  const dependenciesSection = headings.requiredSections.get("Dependencies") ?? null;
  const dependencies = parseDependenciesBlockStage(
    input.source,
    split.bodyOffset,
    dependenciesSection,
    headings.fencedBlocks,
    headings.lines,
    index,
    diagnostics,
  );

  // Stage 5: locate and parse the `playbook` workflow contract block. The
  // dependencies section is excluded so its own `playbook` fence never
  // counts against the workflow block (PRD 40 R-DEP-1 fence discipline).
  const workflow = parseWorkflowBlockStage(
    input.source,
    split.bodyOffset,
    headings.requiredSections.get("Workflow") ?? null,
    dependenciesSection,
    headings.fencedBlocks,
    index,
    diagnostics,
  );

  // Stage 6: resolve cross-references between steps, the registry, and routing.
  resolveCrossReferencesStage(dependencies, workflow, diagnostics);

  // Stage 7: assemble the Playbook model.
  const slug = playbookSlugFromPath(input.sourcePath);
  const persona = frontmatter.persona?.value ?? null;
  const identity: PlaybookIdentity = {
    canonicalRef:
      frontmatter.id?.value ?? (persona ? `${persona}/${slug}` : slug),
    sourcePath: input.sourcePath,
    sourceDigest: createHash("sha256").update(input.source).digest("hex"),
    slug,
    fileForm,
    schemaVersion: frontmatter.schemaVersion?.value ?? null,
    workflowSchemaVersion: frontmatter.workflowSchemaVersion?.value ?? null,
    persona,
    directoryPersona: playbookDirectoryPersona(input.sourcePath),
    stack: frontmatter.stack.value,
    status: frontmatter.status.value,
  };

  const model: PlaybookModel = {
    identity,
    frontmatter,
    dependencies,
    workflow,
    narrativeSections: headings.narrativeSections,
    runnable: derivePlaybookRunnable(diagnostics),
  };

  return { model, diagnostics };
}
