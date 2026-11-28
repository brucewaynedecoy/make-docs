import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { platform } from "../platform";

/**
 * Writes a JSON file atomically: serialize to a temp sibling, then rename over
 * the destination. The platform layer supplies the supported atomic replacement, so concurrent
 * readers of the global config and manifest never observe a torn write.
 */
export function writeStoreJsonFile(filePath: string, value: unknown): void {
  // The same modes as the rest of the Store code: a new folder is for the owner only (0700), and so is the file (0600).
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  platform.atomicReplace(tempPath, filePath);
}
