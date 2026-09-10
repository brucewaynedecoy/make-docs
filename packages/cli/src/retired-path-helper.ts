import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { InstallManifest, PlannedAction } from "./types";
import { assertManagedPathHasNoSymlinks, hashText } from "./utils";

export const RETIRED_PATH_HELPER = ".make-docs/scripts/check_path_hygiene.py";
// Exact upstream bytes from c2a6e35 and dabd0b3. Never trust a filename alone.
const TRUSTED_HASHES = new Set([
  "be2eac13966e77a10d5743b97fc38c6cb60822f0629158007dbe8ab1629f3db4",
  "77c66f924a14118f124a4d9b321b6a9f68f194ecfbf97f18e21fc801e2a88b4c",
]);

/** Plan retirement inside the normal reviewed install transaction. */
export function planRetiredPathHelper(targetDir: string, manifest: InstallManifest | null, actions: PlannedAction[]): PlannedAction | null {
  const entry = manifest?.files[RETIRED_PATH_HELPER];
  const absolute = path.join(targetDir, RETIRED_PATH_HELPER);
  const base = { relativePath: RETIRED_PATH_HELPER, sourceId: entry?.sourceId ?? "file:" + RETIRED_PATH_HELPER };
  const preserve = (reason: string): PlannedAction => ({ ...base, type: "skip", reason: "Path helper cleanup incomplete: " + reason });
  try {
    assertManagedPathHasNoSymlinks(targetDir, RETIRED_PATH_HELPER);
    if (!existsSync(absolute)) {
      if (!entry) return null;
      if (entry.sourceId !== "file:" + RETIRED_PATH_HELPER || entry.ownershipClass === "project-owned" || !TRUSTED_HASHES.has(entry.hash)) {
        return preserve("the missing path does not have trusted managed ownership.");
      }
      return { ...base, type: "remove-managed", reason: "Forget the missing retired path helper." };
    }
    if (!lstatSync(absolute).isFile()) return preserve("the path is not a regular file.");
    if (!entry || entry.sourceId !== "file:" + RETIRED_PATH_HELPER || entry.ownershipClass === "project-owned" ||
        !TRUSTED_HASHES.has(entry.hash) || hashText(readFileSync(absolute, "utf8")) !== entry.hash) {
      return preserve("managed ownership or unchanged shipped bytes are not proved.");
    }
    // Check the resulting live instructions, including local resource overrides.
    const files = new Set<string>();
    const visit = (relative: string): void => {
      const full = path.join(targetDir, relative);
      if (!existsSync(full)) return;
      assertManagedPathHasNoSymlinks(targetDir, relative);
      const stat = lstatSync(full);
      if (stat.isDirectory()) {
        for (const name of readdirSync(full)) visit(relative + "/" + name);
      } else if (/\.(md|txt|rst)$/.test(relative)) files.add(relative);
    };
    for (const root of ["README.md", "AGENTS.md", "CLAUDE.md", ".make-docs/system", ".make-docs/prompts", ".make-docs/references"]) visit(root);
    for (const action of actions) if (action.relativePath.startsWith(".make-docs/system/")) files.add(action.relativePath);
    for (const file of files) {
      const action = actions.find(item => item.relativePath === file);
      if (action?.type === "remove-managed") continue;
      const replacement = action && ["create", "update", "generate", "strip-managed-block"].includes(action.type) ? action.content : undefined;
      const contents = replacement ?? (existsSync(path.join(targetDir, file)) ? readFileSync(path.join(targetDir, file), "utf8") : "");
      if (typeof contents === "string" && contents.includes("check_path_hygiene.py")) return preserve("a live instruction still uses Python: " + file);
    }
    return { ...base, type: "remove-managed", reason: "Remove the trusted Python path helper after CLI instructions are updated; prune its directory only if empty." };
  } catch (error) {
    return preserve(error instanceof Error ? error.message : String(error));
  }
}
