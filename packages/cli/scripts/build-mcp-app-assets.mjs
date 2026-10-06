import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const path = (relative) => new URL(relative, import.meta.url);
const template = await readFile(path("../../skills/backlog-review/assets/backlog-review-report.html"), "utf8");
const one = (pattern, label) => {
  const matches = [...template.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(`Expected one accepted ${label}.`);
  return matches[0][1];
};
const styles = one(/<style>([\s\S]*?)<\/style>/g, "style block");
const markup = one(/(<main class="shell">[\s\S]*?<\/main>)/g, "report body");
let renderer = one(/<script>\s*([\s\S]*?)<\/script>/g, "renderer");
for (const line of ['"use strict";', 'const report = JSON.parse(document.querySelector("#backlog-report-data").textContent);',
  'const presentation = JSON.parse(document.querySelector("#backlog-presentation-data").textContent);']) {
  if (renderer.split(line).length !== 2) throw new Error("Accepted renderer data boundary changed.");
  renderer = renderer.replace(line, "");
}
// Removed data declarations and the closing tag leave blank-line indentation.
renderer = renderer.replace(/^[\t ]+$/gm, "");
const rendererModule = `// Generated from the accepted static report. Run scripts/build-mcp-app-assets.mjs.\n`
  + `export const reportMarkup = ${JSON.stringify(markup)};\nexport const reportStyles = ${JSON.stringify(styles)};\n`
  + `export function mountStaticReport(report, presentation, root) {\n`
  + `  const nativeDocument = root.ownerDocument, nativeWindow = nativeDocument.defaultView;\n`
  + `  let disposed = false; const cleanups = []; const frames = new Set();\n`
  + `  const listen = (target, type, listener, options) => { target.addEventListener(type, listener, options); cleanups.push(() => target.removeEventListener(type, listener, options)); };\n`
  + `  const document = new Proxy(nativeDocument, { get(target, key) {\n`
  + `    if (key === 'querySelector') return root.querySelector.bind(root);\n`
  + `    if (key === 'querySelectorAll') return root.querySelectorAll.bind(root);\n`
  + `    if (key === 'getElementById') return id => root.querySelector('#' + id);\n`
  + `    const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;\n`
  + `  }, set(target, key, value) { return Reflect.set(target, key, value, target); } });\n`
  + `  const window = new Proxy(nativeWindow, { get(target, key) {\n`
  + `    if (key === 'addEventListener') return (type, listener, options) => listen(target, type, listener, options);\n`
  + `    if (key === 'matchMedia') return query => { const media = target.matchMedia(query); return new Proxy(media, { get(object, name) {\n`
  + `      if (name === 'addEventListener') return (type, listener, options) => listen(object, type, listener, options);\n`
  + `      const value = Reflect.get(object, name, object); return typeof value === 'function' ? value.bind(object) : value;\n`
  + `    } }); };\n`
  + `    const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;\n`
  + `  } });\n`
  + `  const requestAnimationFrame = callback => { const id = nativeWindow.requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); }); frames.add(id); return id; };\n`
  + renderer + `\n  return () => { disposed = true; cleanups.forEach(cleanup => cleanup()); frames.forEach(id => nativeWindow.cancelAnimationFrame(id)); };\n}\n`;
const rendererPath = path("../src/mcp/widget/static-renderer.js");
const bundled = await build({
  entryPoints: [fileURLToPath(path("../src/mcp/widget/entry.ts"))], bundle: true, write: false,
  platform: "browser", format: "iife", target: "es2022", minify: true, legalComments: "inline",
  supported: { "template-literal": false },
  alias: { "node:crypto": fileURLToPath(path("../src/mcp/widget/browser-crypto.ts")) },
  plugins: [{ name: "accepted-report-renderer", setup(api) {
    api.onResolve({ filter: /^\.\/static-renderer\.js$/ }, () => ({ path: fileURLToPath(rendererPath) }));
    api.onLoad({ filter: /\/widget\/static-renderer\.js$/ }, () => ({ contents: rendererModule, loader: "js" }));
  } }],
});
const code = bundled.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Backlog review</title>\n<style>${styles}</style>\n<style>[hidden] { display: none !important; }</style>\n</head>\n<body>\n<div id="widgetEmpty" class="shell"><h1>Backlog review</h1><p>No report is loaded. Ask for a backlog review in chat.</p><footer><p id="widgetStatus" role="status" aria-live="polite">Status: Report unavailable</p></footer></div>\n<div id="widgetReport" hidden></div>\n<script>${code}</script>\n</body>\n</html>\n`;
const moduleText = "// Generated from backlog-review-v1.html by scripts/build-mcp-app-assets.mjs.\n" + `export default ${JSON.stringify(html)};\n`;
for (const [output, content] of [[rendererPath, rendererModule], [path("../src/mcp/assets/backlog-review-v1.html"), html],
  [path("../src/mcp/assets/backlog-review-v1.ts"), moduleText]]) {
  if (process.argv.includes("--check")) {
    if (await readFile(output, "utf8") !== content) throw new Error(`Generated widget differs: ${fileURLToPath(output)}. Run scripts/build-mcp-app-assets.mjs.`);
  } else await writeFile(output, content, "utf8");
}
