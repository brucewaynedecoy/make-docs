import { lstatSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { preparePlannedFileChange, recordPlannedFileChange } from "./store/installation-state";

/** Remove each reviewed file through the Store journal. Never follow links. */
export function removeInstallationPath(projectRoot: string, relativePath: string): boolean {
  const absolute = path.isAbsolute(relativePath) ? relativePath : path.resolve(projectRoot, relativePath);
  let stat;
  try { stat = lstatSync(absolute); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    for (const name of readdirSync(absolute).sort()) removeInstallationPath(projectRoot, path.join(relativePath, name));
    recordPlannedFileChange(projectRoot, relativePath, { kind: "missing" }, () => rmdirSync(absolute));
  } else {
    recordPlannedFileChange(projectRoot, relativePath, { kind: "missing" }, () => unlinkSync(absolute));
  }
  return true;
}

export function pruneInstallationParents(projectRoot: string, start: string, boundary: string): void {
  let current = path.resolve(start);
  const end = path.resolve(boundary);
  while (current !== end && current.startsWith(end + path.sep)) {
    let stat;
    try { stat = lstatSync(current); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { current = path.dirname(current); continue; } throw error; }
    if (stat.isSymbolicLink() || !stat.isDirectory() || readdirSync(current).length) return;
    const relative = current.startsWith(path.resolve(projectRoot) + path.sep) ? path.relative(projectRoot, current) : current;
    recordPlannedFileChange(projectRoot, relative, { kind: "missing" }, () => rmdirSync(current));
    current = path.dirname(current);
  }
}

/** Declare a complete removal scope before any member is changed. */
export function prepareInstallationRemoval(projectRoot: string, relativePath: string): Array<() => void> {
  const absolute = path.isAbsolute(relativePath) ? relativePath : path.resolve(projectRoot, relativePath);
  let stat;
  try { stat = lstatSync(absolute); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  const changes: Array<() => void> = [];
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    for (const name of readdirSync(absolute).sort()) changes.push(...prepareInstallationRemoval(projectRoot, path.join(relativePath, name)));
    changes.push(preparePlannedFileChange(projectRoot, relativePath, { kind: "missing" }, () => rmdirSync(absolute)));
  } else changes.push(preparePlannedFileChange(projectRoot, relativePath, { kind: "missing" }, () => unlinkSync(absolute)));
  return changes;
}
