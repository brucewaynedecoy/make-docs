import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applySkillAdoptionReview, buildSkillAdoptionReview, presentSkillAdoptionReview } from "../src/skills-adoption";
import { defaultSelections } from "../src/profile";
import { loadEffectiveSkillRegistry } from "../src/skill-registry";
import { applySkillRegistrySelectionMetadata } from "../src/skill-catalog";
import { PACKAGE_ROOT, hashText } from "../src/utils";
import { readInstallationManifest, withInstallationDatabase } from "../src/store/installation-state";

// W28 R0 P8 (D-054): the adoption review must refuse a plan that the apply would refuse.
let temp: string, root: string, store: string, home: string;
beforeEach(() => {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), "make-docs-w28-adoption-"));
  root = path.join(temp, "project");
  store = path.join(temp, "store");
  home = path.join(temp, "home");
  fs.mkdirSync(root);
  fs.mkdirSync(home);
  vi.stubEnv("MAKE_DOCS_HOME", store);
  vi.stubEnv("HOME", home);
  vi.spyOn(os, "homedir").mockReturnValue(home);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  fs.rmSync(temp, { recursive: true, force: true });
});

function options() {
  const effectiveRegistry = loadEffectiveSkillRegistry({ packageRoot: PACKAGE_ROOT });
  const selections = defaultSelections();
  selections.skills = true;
  selections.selectedSkills = ["preflight"];
  selections.skillScope = "project";
  selections.harnesses = { codex: true, "claude-code": true };
  return { targetDir: root, selections: applySkillRegistrySelectionMetadata(selections, effectiveRegistry), adoptExisting: ["preflight"], effectiveRegistry };
}

test("an adoption review of an install recorded by an older CLI names the setup route instead of reporting ready", async () => {
  const first = await buildSkillAdoptionReview(options());
  expect(applySkillAdoptionReview(first, first.digest).status).toBe("completed");

  const currentVersion = (JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")) as { version: string }).version;
  const manifest = readInstallationManifest(root)!;
  const older = JSON.parse(JSON.stringify(manifest).replaceAll(currentVersion, "2.0.7")) as typeof manifest;
  // The installed Skill file is a clean managed copy from the older package, so the review plans an update.
  const skillPath = ".agents/skills/preflight/SKILL.md";
  const olderBytes = "# Older preflight\n";
  older.files[skillPath] = { ...older.files[skillPath]!, hash: hashText(olderBytes) };
  withInstallationDatabase(root, db => {
    const row = db.prepare("SELECT checkout_id FROM installation_checkouts WHERE project_id=?").get(manifest.projectId!) as { checkout_id: string };
    db.prepare("UPDATE installation_ledgers SET manifest_json=? WHERE checkout_id=?").run(JSON.stringify(older), row.checkout_id);
  }, { storeRoot: store });
  fs.writeFileSync(path.join(root, skillPath), olderBytes);

  const review = await buildSkillAdoptionReview(options());
  const presented = presentSkillAdoptionReview(review);
  expect(presented.status).toBe("blocked");
  expect(presented.blockers.join("\n")).toContain("This install was recorded by make-docs 2.0.7");
  expect(presented.blockers.join("\n")).toContain("Run `make-docs setup` first");
  expect(() => applySkillAdoptionReview(review, review.digest)).toThrow("Run `make-docs setup` first");
});
