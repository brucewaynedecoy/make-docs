/**
 * Playbook file detection (R-DOC-2).
 *
 * New Playbooks use the `<slug>.playbook.md` suffix. For migration, a plain
 * `<slug>.md` file with frontmatter `kind: playbook` is also detected as a
 * Playbook; it is a deprecated form and triggers the PB-FILE-007 rename
 * diagnostic in the parser.
 */

import { PLAYBOOK_FILE_SUFFIX, type PlaybookFileForm } from "./model";

function baseName(sourcePath: string): string {
  const normalized = sourcePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  return segments.at(-1) ?? normalized;
}

/** Parent directory name, used as the persona implied by the containing folder. */
export function playbookDirectoryPersona(sourcePath: string): string | null {
  const normalized = sourcePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  return segments.length >= 2 ? segments.at(-2)! : null;
}

export function playbookSlugFromPath(sourcePath: string): string {
  const fileName = baseName(sourcePath);
  if (fileName.endsWith(PLAYBOOK_FILE_SUFFIX)) {
    return fileName.slice(0, -PLAYBOOK_FILE_SUFFIX.length);
  }
  if (fileName.endsWith(".md")) {
    return fileName.slice(0, -".md".length);
  }
  return fileName;
}

/**
 * Classifies the file form from its name and frontmatter `kind`. The
 * `<slug>.playbook.md` suffix is authoritative on its own; the plain
 * `<slug>.md` form counts only when the frontmatter declares
 * `kind: playbook`.
 */
export function detectPlaybookFileForm(
  sourcePath: string,
  frontmatterKind: string | null,
): PlaybookFileForm {
  const fileName = baseName(sourcePath);
  if (fileName.endsWith(PLAYBOOK_FILE_SUFFIX)) {
    return "playbook-suffix";
  }
  if (fileName.endsWith(".md") && frontmatterKind === "playbook") {
    return "deprecated-plain";
  }
  return "not-playbook";
}
