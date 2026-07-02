/**
 * Structural validation layer (R-DOC-1, R-DOC-3, R-DOC-5, R-MODEL-4).
 *
 * Heading presence and order (PB-DOC-001), frontmatter field presence and
 * enum values (PB-FM-002, PB-FM-008), and the file-naming convention
 * (PB-FILE-007) are enforced by the parser stages and already sit in the
 * parse diagnostics; this layer adds the structural checks that need the
 * assembled model: persona/folder agreement (PB-FM-012) and required
 * narrative sections being non-empty, not merely present (PB-DOC-013).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import type { PlaybookModel } from "../model";

/** Structural layer entry point; appends diagnostics without early exit. */
export function validateStructuralLayer(
  model: PlaybookModel,
  diagnostics: PlaybookDiagnostic[],
): void {
  const { persona, directoryPersona } = model.identity;
  if (persona !== null && directoryPersona !== null && persona !== directoryPersona) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-FM-012", {
        message: `Frontmatter \`persona\` is \`${persona}\` but the containing folder is \`${directoryPersona}\`; the persona must match the folder.`,
        section: "frontmatter",
        field: "persona",
        span: model.frontmatter.persona?.span ?? null,
      }),
    );
  }

  for (const presence of Object.values(model.narrativeSections)) {
    // A missing section is already a PB-DOC-001 from the parser; only an
    // empty-but-present narrative section is diagnosed here (R-DOC-6).
    if (presence.present && !presence.nonEmpty) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DOC-013", {
          message: `Required narrative section \`## ${presence.heading}\` is empty.`,
          section: `## ${presence.heading}`,
          span: presence.span,
        }),
      );
    }
  }
}
