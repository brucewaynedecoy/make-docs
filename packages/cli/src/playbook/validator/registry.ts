/**
 * Registry validation layer (R-DEP-2, R-DEP-3, R-MODEL-4).
 *
 * The exact six-column table schema is enforced at parse time (PB-DEP-009);
 * this layer validates the typed registry records the parser preserved raw:
 * `Kind` and `Requirement` must come from their fixed enumerations, with
 * `asset` supported as the optional additional kind (PB-DEP-014), and `ID`
 * values must be non-empty and unique within the Playbook (PB-DEP-015).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_DEPENDENCY_KINDS,
  PLAYBOOK_DEPENDENCY_REQUIREMENTS,
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
          message: "A dependency registry row has an empty `ID`.",
          section: DEPENDENCIES_SECTION,
          field: "ID",
          span: entry.id.span ?? entry.span,
        }),
      );
    } else if (seenIds.has(entry.id.value)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-015", {
          message: `Dependency \`${entry.id.value}\` is declared more than once; \`ID\` values must be unique within the Playbook.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.ID`,
          span: entry.id.span ?? entry.span,
        }),
      );
    } else {
      seenIds.add(entry.id.value);
    }

    if (entry.kind.value === null) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-014", {
          message: `Dependency \`${label}\` declares \`Kind\` \`${entry.kind.raw ?? ""}\`, which is not one of ${PLAYBOOK_DEPENDENCY_KINDS.join(", ")}.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.Kind`,
          span: entry.kind.span ?? entry.span,
        }),
      );
    }

    if (entry.requirement.value === null) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-014", {
          message: `Dependency \`${label}\` declares \`Requirement\` \`${entry.requirement.raw ?? ""}\`, which is not one of ${PLAYBOOK_DEPENDENCY_REQUIREMENTS.join(", ")}.`,
          section: DEPENDENCIES_SECTION,
          field: `${label}.Requirement`,
          span: entry.requirement.span ?? entry.span,
        }),
      );
    }
  }
}
