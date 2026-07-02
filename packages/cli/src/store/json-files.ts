import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Writes a JSON file atomically: serialize to a temp sibling, then rename over
 * the destination. Rename is atomic on POSIX filesystems, so concurrent
 * readers of the global config and manifest never observe a torn write.
 */
export function writeStoreJsonFile(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(tempPath, filePath);
}
