// rev.mjs <make-docs bin> <coordinate> [level]: print a unit's revision from work next.
import { execFileSync } from "node:child_process";
const [md, coord, level] = process.argv.slice(2);
const levels = level ? [level] : ["task", "stage", "phase", "revision", "wave"];
for (const l of levels) {
  let out;
  try { out = execFileSync(md, ["work", "next", "--level", l, "--json"], { encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { out = e.stdout; }
  const r = JSON.parse(out);
  const u = [...(r.ready ?? []), ...(r.waiting ?? [])].find((x) => x.coordinate === coord || x.label === coord);
  if (u) { console.log(u.revision); process.exit(0); }
}
console.error("not found");
process.exit(1);
