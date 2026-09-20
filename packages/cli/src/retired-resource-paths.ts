/** Exact former shipped names. These are migration inputs, never catalog aliases. */
const REPLACEMENTS: Readonly<Record<string, string>> = {
  '.make-docs/system/templates/guide-developer.md': '.make-docs/system/templates/guide-maintainer.md',
  '.make-docs/system/prompts/coverage-pass-developer-guide.prompt.md': '.make-docs/system/prompts/coverage-pass-maintainer-guide.prompt.md',
};

export function getRetiredResourceReplacement(relativePath: string): string | undefined {
  return REPLACEMENTS[relativePath];
}
