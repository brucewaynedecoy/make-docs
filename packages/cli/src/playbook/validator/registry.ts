/**
 * Registry validation layer (R-DEP-2, R-DEP-3, R-MODEL-4).
 *
 * The dependencies-block field schema is enforced at parse time (PB-DEP-009);
 * this layer validates the typed registry records the parser preserved raw:
 * `kind` and `requirement` must come from their fixed enumerations, with
 * `asset` supported as the optional additional kind (PB-DEP-014), `id`
 * values must be non-empty and unique within the Playbook (PB-DEP-015), and
 * a declared `probe` must match the executable-token pattern (PB-DEP-030,
 * PRD 40 R-DEP-2).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_DEPENDENCY_KINDS,
  PLAYBOOK_DEPENDENCY_REQUIREMENTS,
  PLAYBOOK_PROBE_TOKEN_RE,
  type PlaybookModel,
} from "../model";

const DEPENDENCIES_SECTION = "## Dependencies";

/** Registry layer entry point; each row reports independently. */
export function validateRegistryLayer(
  model: PlaybookModel,
  diagnostics: PlaybookDiagnostic[],
): void {
  const seenIds = new Set<string>();
  for (const entry of model.dependencies.entries) {
    const label = entry.id.value || "(empty)";

    if (!entry.id.value) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-015", {
          message: "A dependency entry has an empty `id`.",
          section: DEPENDENCIES_SECTION,
          field: "id",
          span: entry.id.span ?? entry.span,
        }),
      );
    } else if (seenIds.has(entry.id.value)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-015", {
          message: `Dependency \`${entry.id.value}\` is declared more than once; \`id\` values must be unique within the Playbook.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.id`,
          span: entry.id.span ?? entry.span,
        }),
      );
    } else {
      seenIds.add(entry.id.value);
    }

    if (entry.kind.value === null) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-014", {
          message: `Dependency \`${label}\` declares \`kind\` \`${entry.kind.raw ?? ""}\`, which is not one of ${PLAYBOOK_DEPENDENCY_KINDS.join(", ")}.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.kind`,
          span: entry.kind.span ?? entry.span,
        }),
      );
    }

    if (entry.requirement.value === null) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-014", {
          message: `Dependency \`${label}\` declares \`requirement\` \`${entry.requirement.raw ?? ""}\`, which is not one of ${PLAYBOOK_DEPENDENCY_REQUIREMENTS.join(", ")}.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.requirement`,
          span: entry.requirement.span ?? entry.span,
        }),
      );
    }

    // A declared probe is the executable target dependency checks verify
    // (PRD 40 R-DEP-2); prose does not probe. The defaulted-from-id form is
    // exempt: an id outside the token pattern already fails as a probe
    // target downstream and is not the author's probe declaration.
    if (entry.probeDeclared && !PLAYBOOK_PROBE_TOKEN_RE.test(entry.probe.value)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-030", {
          message: `Dependency \`${label}\` declares \`probe\` \`${entry.probe.value}\`, which is not a single executable token.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.probe`,
          span: entry.probe.span ?? entry.span,
        }),
      );
    }
  }
}
