/**
 * The one place that splits the path of a factory backup file (W30 R0 round
 * 4, 2026-11-24). A backup file is at
 * `<checkout folder>/.make-docs/backup/factory/<assignment ID>/<path of the file inside the project>`.
 *
 * The checkout folder's own path can hold `.make-docs`, and so can the path
 * of the backed-up file. So the split is at the last backup folder marker
 * that the record's assignment ID follows. Factory cleanup, the reviewed
 * workflow removal, and the `setup store check` decision item all use this
 * function, so they name the same checkout folder and the same path inside
 * the project.
 *
 * This module imports nothing, so the Store table catalog can use it.
 */

/** The words of the backup folder inside a checkout. */
export const FACTORY_BACKUP_FOLDER_WORDS = Object.freeze([".make-docs", "backup", "factory"] as const);

export interface FactoryBackupPathParts {
  /** The checkout folder that the path names, as written in the path. */
  root: string;
  /** The path inside the project, from `.make-docs` on, with `/` between the parts. It never holds the checkout folder. */
  projectPath: string;
}

/**
 * Split a backup path at a `/.make-docs/backup/factory/<assignment ID>/`.
 * The backed-up file's own path can hold that whole part too. So, with the
 * record's `originalPath`, the split is at the marker where the checkout
 * folder plus the rest of the path is exactly `originalPath` (round 5).
 * Without `originalPath`, or when no marker fits it, the split is at the
 * last marker. It reads the text only and works for both path separators. It
 * returns null when the path holds no such part, so a caller never guesses.
 */
export function splitFactoryBackupPath(backupPath: string, assignmentId: string, originalPath?: string | null): FactoryBackupPathParts | null {
  if (assignmentId.length === 0) return null;
  let best: { at: number; separator: string } | null = null;
  let exact: { at: number; separator: string } | null = null;
  for (const separator of ["/", "\\"]) {
    const marker = `${separator}${[...FACTORY_BACKUP_FOLDER_WORDS, assignmentId].join(separator)}${separator}`;
    for (let at = backupPath.indexOf(marker); at >= 0; at = backupPath.indexOf(marker, at + 1)) {
      if (at === 0) continue;
      if (best === null || at > best.at) best = { at, separator };
      // The original file is at <checkout folder>/<rest>, and its backup is at <checkout folder><marker><rest>.
      if (exact === null && typeof originalPath === "string" && originalPath === `${backupPath.slice(0, at)}${separator}${backupPath.slice(at + marker.length)}`) exact = { at, separator };
    }
  }
  best = exact ?? best;
  if (best === null) return null;
  return {
    root: backupPath.slice(0, best.at),
    projectPath: backupPath.slice(best.at + 1).split(best.separator).join("/"),
  };
}
