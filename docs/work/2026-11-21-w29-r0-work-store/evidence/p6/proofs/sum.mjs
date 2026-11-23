// Print the human summary of a make-docs JSON result read from stdin, or the raw text.
let s = "";
process.stdin.on("data", (d) => (s += d)).on("end", () => {
  try {
    const r = JSON.parse(s);
    console.log(r.summary ?? r.message ?? JSON.stringify(r).slice(0, 1500));
    if (r.ok === false) console.log(`[code ${r.code}] ${r.nextAction ?? ""}`);
  } catch {
    console.log(s.trim());
  }
});
