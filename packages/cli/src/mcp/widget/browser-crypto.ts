/** Browser adapter for the existing pure identity validators. No identity rule is repeated here. */
let values: Map<string, string> | null = null;
let missing: Set<string> | null = null;
let queue: Promise<unknown> = Promise.resolve();

export function createHash(algorithm: string) {
  if (algorithm !== "sha256") throw new Error("Unsupported widget identity hash.");
  let input = "";
  return { update(value: string) { input += value; return this; }, digest(encoding: string) {
    if (encoding !== "hex" || values === null || missing === null) throw new Error("Widget hash validation is not active.");
    const found = values.get(input);
    if (found !== undefined) return found;
    missing.add(input);
    // A collection pass is never returned to the caller. Its provisional value
    // lets pure validators discover all independent record hashes in one pass.
    return "0".repeat(64);
  } };
}

/** Only a pass with no missing hashes can return or reject the parsed result. */
export function withBrowserHashes<T>(parse: () => T, cryptoProvider: Crypto = globalThis.crypto): Promise<T> {
  const run = async () => {
    if (!cryptoProvider?.subtle) throw new Error("This host cannot validate report identity. Continue the review in chat.");
    values = new Map();
    const cache = values;
    try {
      for (let attempt = 0; attempt < 16; attempt += 1) {
        missing = new Set();
        let result: T | undefined, failure: unknown, failed = false;
        try { result = parse(); } catch (error) { failed = true; failure = error; }
        if (missing.size === 0) {
          if (failed) throw failure;
          return result as T;
        }
        await Promise.all(Array.from(missing, async input => {
          const digest = await cryptoProvider.subtle.digest("SHA-256", new TextEncoder().encode(input));
          cache.set(input, Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join(""));
        }));
      }
      throw new Error("Report identity validation exceeded its bounded replay count.");
    } finally { values = null; missing = null; }
  };
  const result = queue.then(run, run);
  queue = result.then(() => undefined, () => undefined);
  return result;
}
