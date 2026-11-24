import type { ADMITTED_OPERATION_IDS } from "./registry";

/**
 * The help text for each registry command (a leaf): one plain-words summary,
 * the usage line, the arguments, and the options that the command's own parser
 * accepts. `leaf-help.ts` renders it for `--help` on a leaf, and group help
 * lists each summary. A test checks that every registry operation has an
 * entry and that the usage and the option list name the same flags (W33 R0 P5).
 */

export interface LeafHelpItem {
  /** The flag or argument as the usage line spells it, such as `--repo-root <path>` or `<target>`. */
  name: string;
  text: string;
}

export interface LeafHelpEntry {
  /** One sentence in plain words: what the command does for you. */
  summary: string;
  /** The usage line after `make-docs <path>`. Empty when the command takes nothing. */
  usage: string;
  arguments?: LeafHelpItem[];
  options: LeafHelpItem[];
  /** Short plain-words notes printed after the options. */
  notes?: string[];
}

export type AdmittedOperationId = (typeof ADMITTED_OPERATION_IDS)[number];

const JSON_OPTION: LeafHelpItem = { name: "--json", text: "Print the full result as JSON." };
const REPO_ROOT: LeafHelpItem = {
  name: "--repo-root <path>",
  text: "The project folder. The default is found from this folder.",
};
const STORE_ROOT: LeafHelpItem = {
  name: "--store-root <path>",
  text: "The Make Docs Store folder. The default is MAKE_DOCS_HOME, else the usual Store folder.",
};
const TARGET_ROOT: LeafHelpItem = { name: "--target-root <path>", text: "The project folder. The default is this folder." };
const TARGET_PROJECT: LeafHelpItem = { name: "--target-root <project>", text: "The project folder. The default is this folder." };
const REQUIRED_TARGET_PROJECT: LeafHelpItem = { name: "--target-root <project>", text: "The project folder." };
const RUN_SELECTOR: LeafHelpItem = {
  name: "--run-id <id>|--last",
  text: "The run to change: its ID (a unique start of the ID is enough), or --last for the newest run.",
};
const EXPECTED_VERSION: LeafHelpItem = {
  name: "--expected-version <n>",
  text: "The run version you last read. The change stops if the run changed since then.",
};
const FACTORY_WRITE_TARGET: LeafHelpItem = { name: "--target-root <path>", text: "The project checkout to act on." };
const FACTORY_WRITE_PROJECT: LeafHelpItem = { name: "--project <name>", text: "The project to act on, by its name in the Store's project register." };
const FACTORY_READ_TARGET: LeafHelpItem = { name: "--target-root <path>", text: "The project checkout to read. The default is the project of this folder." };
const FACTORY_READ_PROJECT: LeafHelpItem = { name: "--project <name>", text: "The project to read, by its name in the Store's project register. The default is the project of this folder." };
const FACTORY_CLAIM_ID: LeafHelpItem = { name: "--claim-id <id>", text: "Your private claim ID of the unit's live claim." };
const FACTORY_WRITE_NOTE = "Name the project with --target-root or --project. This write never uses the current folder, and a refusal changes nothing.";
const FACTORY_READ_NOTE = "Without --target-root or --project, it reads the project of this folder and says so.";
const FACTORY_CLAIM_NOTE = "The claim ID is checked and never saved or shown. Keep it private, like a key.";
const REVIEW_DIGEST: LeafHelpItem = { name: "--review <digest>", text: "The review digest from the preview you approved." };

function lifecycleVersioned(summary: string, extraUsage = "", extraOptions: LeafHelpItem[] = []): LeafHelpEntry {
  return {
    summary,
    usage: `--run-id <id>|--last --expected-version <n>${extraUsage} [--repo-root <path>] [--store-root <path>] [--json]`,
    options: [RUN_SELECTOR, EXPECTED_VERSION, ...extraOptions, REPO_ROOT, STORE_ROOT, JSON_OPTION],
  };
}

const UAT_OPTIONS: LeafHelpItem[] = [
  {
    name: "--payload-json <file-or-json>",
    text: "The record to check, as a JSON file or inline JSON. It is the same object as the MCP tool input.",
  },
  { name: "--target-root <project>", text: "The project folder, when you give no payload. The default is this folder." },
  { name: "--persona <slug>", text: "The configured Persona, when you give no payload. The default is user." },
  JSON_OPTION,
];

function uat(summary: string): LeafHelpEntry {
  return {
    summary,
    usage: "[--payload-json <file-or-json>] [--target-root <project>] [--persona <slug>] [--json]",
    options: UAT_OPTIONS,
  };
}

const PATHS_OPTIONS: LeafHelpItem[] = [
  { name: "--target <dir>", text: "The project folder. The default is this folder. --target-root is the same." },
  { name: "--scope content|managed", text: "content checks local docs. managed checks the files that the Store says Make Docs installed." },
  { name: "--path <path>", text: "Check only this file or folder. Repeat it for more. Not with --scope managed." },
  { name: "--format text|json", text: "The output form. The default is json." },
  { name: "--include-skills", text: "Also check Skill folders." },
  { name: "--manifest <path>", text: "Read an old path list file instead of the Store or local docs." },
  { name: "--allow-comment-token <text>", text: "The comment text that marks a path finding as allowed." },
];

export const OPERATION_LEAF_HELP: Readonly<Record<AdmittedOperationId, LeafHelpEntry>> = {
  "prd.authority.validate": {
    summary: "Check that the active PRDs describe the product, not edits to it. Changes nothing.",
    usage: "[--target-root <project>] [--json]",
    options: [TARGET_PROJECT, JSON_OPTION],
  },
  "performance.evidence.validate": {
    summary: "Check the shape and links of performance evidence records. Runs no benchmark. Changes nothing.",
    usage: "[--target-root <project>] [--json]",
    options: [TARGET_PROJECT, JSON_OPTION],
  },
  "work.item.resolve": {
    summary: "Find a work item from its coordinate or path, and show its project, wave, and phase file. Changes nothing.",
    usage: "<coordinate-or-path> [--repo-root <path>] [--json]",
    arguments: [{ name: "<coordinate-or-path>", text: "A coordinate such as 'W33 R0 P5', or a path to a backlog or phase file." }],
    options: [REPO_ROOT, JSON_OPTION],
  },
  "work.evidence.record": {
    summary: "Save one piece of work evidence for a work item in the Make Docs Store.",
    usage: "<coordinate-or-path> --kind <kind> --payload-json <file-or-json> [--repo-root <path>] [--store-root <path>] [--json]",
    arguments: [{ name: "<coordinate-or-path>", text: "The work item, as a coordinate or a path." }],
    options: [
      { name: "--kind <kind>", text: "The kind of evidence, such as a test run." },
      { name: "--payload-json <file-or-json>", text: "The evidence, as a JSON file or inline JSON." },
      REPO_ROOT,
      STORE_ROOT,
      JSON_OPTION,
    ],
  },
  "work.evidence.read": {
    summary: "Show the work evidence saved for a phase or a whole wave. Changes nothing.",
    usage: "<coordinate-or-path> [--repo-root <path>] [--store-root <path>] [--json]",
    arguments: [{ name: "<coordinate-or-path>", text: "The phase or wave, as a coordinate or a path." }],
    options: [REPO_ROOT, STORE_ROOT, JSON_OPTION],
  },
  "work.backlog.snapshot": {
    summary: "Read every live and archived work record into one backlog snapshot. Changes nothing.",
    usage: "--target-root <project> [--work-store] [--json]",
    options: [
      REQUIRED_TARGET_PROJECT,
      { name: "--work-store", text: "Also read the work store when it is the authority, and add readiness facts. Without it, the snapshot reads the docs/work/ files." },
      JSON_OPTION,
    ],
  },
  "work.backlog-cache.lookup": {
    summary: "Find saved backlog review notes that still match the current snapshot. Changes nothing.",
    usage: "--target-root <project> --snapshot-json <file-or-json> [--json]",
    options: [
      REQUIRED_TARGET_PROJECT,
      { name: "--snapshot-json <file-or-json>", text: "The snapshot from make-docs backlog snapshot." },
      JSON_OPTION,
    ],
  },
  "work.backlog-cache.write": {
    summary: "Save backlog review notes in the Store cache, so the next review can reuse them.",
    usage: "--target-root <project> --snapshot-json <file-or-json> --records-json <file-or-json> [--json]",
    options: [
      REQUIRED_TARGET_PROJECT,
      { name: "--snapshot-json <file-or-json>", text: "The snapshot from make-docs backlog snapshot." },
      { name: "--records-json <file-or-json>", text: "The review notes to save, one per work record." },
      JSON_OPTION,
    ],
  },
  "backlog.review.open": {
    summary: "Open a checked backlog report in the review app, with a short summary for chat. Changes nothing.",
    usage: "--report-json <file-or-json> [--json]",
    options: [{ name: "--report-json <file-or-json>", text: "The backlog report to open." }, JSON_OPTION],
  },
  "backlog.review.refresh": {
    summary: "Read the current backlog facts again and keep the report you reviewed before. Changes nothing.",
    usage: "--envelope-json <file-or-json> [--json]",
    options: [{ name: "--envelope-json <file-or-json>", text: "The review session data from the review app." }, JSON_OPTION],
  },
  "resource.list": {
    summary: "List the Make Docs system resources: contracts, prompts, references, and templates. Changes nothing.",
    usage: "[--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json] [--target <dir>]",
    options: [
      { name: "--type <contract|prompt|reference|template>", text: "List only this kind of resource." },
      { name: "--prefix <path>", text: "List only resources whose path starts with this." },
      { name: "--origin <effective|local|installed>", text: "Which copy to read: the one that applies (effective), the project copy (local), or the installed copy." },
      { name: "--format table|json", text: "The output form. The default is table." },
      { name: "--target <dir>", text: "The project folder. The default is this folder." },
    ],
  },
  "resource.read": {
    summary: "Print one Make Docs system resource, byte for byte. Changes nothing.",
    usage: "<uri> [--origin <effective|local|installed>] [--format raw|json] [--target <dir>]",
    arguments: [{ name: "<uri>", text: "The resource URI, such as make-docs://system/reference/lifecycle.md." }],
    options: [
      { name: "--origin <effective|local|installed>", text: "Which copy to read: the one that applies (effective), the project copy (local), or the installed copy." },
      { name: "--format raw|json", text: "raw prints the file. json adds its type and where it came from. The default is raw." },
      { name: "--target <dir>", text: "The project folder. The default is this folder." },
    ],
  },
  "resource.ensure": {
    summary: "Copy one managed system resource into this project.",
    usage: "<uri> --allow-write --approve resource-projection-write [--dry-run] [--target <dir>]",
    arguments: [{ name: "<uri>", text: "The resource URI to copy." }],
    options: [
      { name: "--allow-write", text: "Allow this command to write files." },
      { name: "--approve resource-projection-write", text: "Approve the copy." },
      { name: "--dry-run", text: "Show what would change, and change nothing." },
      { name: "--target <dir>", text: "The project folder. The default is this folder." },
    ],
  },
  "project.state.status": {
    summary: "Show this project's install state from the Store and the next safe step. Changes nothing.",
    usage: "[--target-root <path>] [--json]",
    options: [TARGET_ROOT, JSON_OPTION],
    notes: [
      "Install state is kept in the Make Docs Store.",
      "When an operation is unfinished, run make-docs project state recover to finish or undo it.",
      "Use --help or -h to read this help without reading the Store or changing files.",
    ],
  },
  "project.state.recover": {
    summary: "Finish or undo one unfinished install operation.",
    usage: "<operation-id> --resume|--rollback [--dry-run] [--target-root <path>] [--json]",
    arguments: [{ name: "<operation-id>", text: "The unfinished operation, from make-docs project state status." }],
    options: [
      { name: "--resume|--rollback", text: "--resume does the remaining checked steps. --rollback puts back the earlier files. Changed files stop both." },
      { name: "--dry-run", text: "Show what would change, and change nothing." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: [
      "Run make-docs project state status first to find the operation ID.",
      "--resume works only on a complete saved plan. --rollback puts back the checked earlier file state.",
      "A file that changed since the operation stops recovery, so your changes stay.",
      "Add --dry-run to see the recovery first.",
      "Use --help or -h to read this help without reading the Store or changing files.",
    ],
  },
  "project.checkout-move.preview": {
    summary: "Show which saved checkout this moved folder can take over. Changes nothing.",
    usage: "[--source-checkout <id>] [--target-root <path>] [--json]",
    options: [
      { name: "--source-checkout <id>", text: "Show only this saved checkout." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "project.checkout-move.apply": {
    summary: "Give this folder the saved checkout ID of its old folder. Project files stay the same.",
    usage: "--source-checkout <id> --source-root <path> --review <digest> [--dry-run] [--target-root <path>] [--json]",
    options: [
      { name: "--source-checkout <id>", text: "The saved checkout ID from the preview." },
      { name: "--source-root <path>", text: "The old folder from the preview." },
      REVIEW_DIGEST,
      { name: "--dry-run", text: "Show what would change, and change nothing." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "project.checkout-register.preview": {
    summary: "Show the new checkout ID this folder would get. Changes nothing.",
    usage: "[--target-root <path>] [--json]",
    options: [TARGET_ROOT, JSON_OPTION],
  },
  "project.checkout-register.apply": {
    summary: "Save this folder as a new checkout of its project.",
    usage: "--review <digest> [--target-root <path>] [--json]",
    options: [REVIEW_DIGEST, TARGET_ROOT, JSON_OPTION],
  },
  "project.persona.list": {
    summary: "List this project's Personas. Needs no Store. Changes nothing.",
    usage: "[--target-root <path>] [--json]",
    options: [TARGET_ROOT, JSON_OPTION],
  },
  "project.register.list": {
    summary: "List every project that the Make Docs Store knows. Changes nothing.",
    usage: "[--target-root <path>] [--json]",
    options: [
      { name: "--target-root <path>", text: "The project whose agent access allows the Store read. The default is this folder." },
      JSON_OPTION,
    ],
    notes: ["--target-root does not limit the list. Every project in the Store is listed."],
  },
  "project.layout.preview": {
    summary: "Show where each old file would move, with its links and any blockers. Changes nothing.",
    usage: "[--map <source>=<destination>] [--target-root <path>] [--json]",
    options: [
      { name: "--map <source>=<destination>", text: "Your choice for one file. Repeat it for each choice." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "project.layout.prepare": {
    summary: "Save a reviewed layout plan in the Store before any file moves.",
    usage: "--review <digest> --mode cli|manual [--map <source>=<destination>] [--target-root <path>] [--json]",
    options: [
      REVIEW_DIGEST,
      { name: "--mode cli|manual", text: "cli lets make-docs move the files. manual means you move them." },
      { name: "--map <source>=<destination>", text: "Your choice for one file. Repeat it for each choice." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "project.layout.apply": {
    summary: "Move the files of one prepared cli layout plan, then check them.",
    usage: "<operation-id> [--target-root <path>] [--json]",
    arguments: [{ name: "<operation-id>", text: "The prepared plan, from make-docs project layout prepare." }],
    options: [TARGET_ROOT, JSON_OPTION],
  },
  "project.layout.verify": {
    summary: "Check a manual layout plan after you moved the files, and record that it is done.",
    usage: "<operation-id> [--target-root <path>] [--json]",
    arguments: [{ name: "<operation-id>", text: "The prepared plan, from make-docs project layout prepare." }],
    options: [TARGET_ROOT, JSON_OPTION],
  },
  "project.surface.ensure": {
    summary: "Make one project support folder and its instruction files.",
    usage: "<archive|artifacts|assets> [--dry-run] [--target-root <path>] [--json]",
    arguments: [{ name: "<archive|artifacts|assets>", text: "The support folder to make." }],
    options: [{ name: "--dry-run", text: "Show what would change, and change nothing." }, TARGET_ROOT, JSON_OPTION],
  },
  "project.path-hygiene.validate": {
    summary: "Check this project's docs for unsafe paths and links. Changes nothing.",
    usage: "[--target <dir>] [--scope content|managed] [--path <path>] [--format text|json] [--include-skills] [--manifest <path>] [--allow-comment-token <text>]",
    options: PATHS_OPTIONS,
  },
  "project.path-hygiene.repair": {
    summary: "Fix unsafe paths and links in this project's docs. Shows the changes first.",
    usage: "[--apply|--dry-run] [--target <dir>] [--scope content|managed] [--path <path>] [--format text|json] [--include-skills] [--manifest <path>] [--allow-comment-token <text>]",
    options: [
      { name: "--apply|--dry-run", text: "--apply writes the fixes. --dry-run only shows them. The default is to only show them." },
      ...PATHS_OPTIONS,
    ],
  },
  "project.doctor.check": {
    summary: "Check project files for known problems, show each exact fix, and give a review digest. Changes nothing.",
    usage: "[--exclude <path>] [--target-root <path>] [--json]",
    options: [
      { name: "--exclude <path>", text: "Leave out this folder or file. Repeat it for more." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "project.doctor.fix": {
    summary: "Make only the fixes that a doctor check's review digest names, with a backup and a way to undo.",
    usage: "--review <digest> [--exclude <path>] [--check-json <file>] [--dry-run] [--target-root <path>] [--json]",
    options: [
      { name: "--review <digest>", text: "The review digest from make-docs project doctor check." },
      { name: "--exclude <path>", text: "Leave out this folder or file. Use the same ones as the check." },
      { name: "--check-json <file>", text: "The saved check result (check --json), so fix can name each file that changed after the check." },
      { name: "--dry-run", text: "Show what would change, and change nothing." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "setup.store.check": {
    summary: "Check the Make Docs Store: what clean would remove, what needs your choice, and what blocks this computer. Changes nothing.",
    usage: "[--json]",
    options: [JSON_OPTION],
    notes: [
      "Check also reads a Store that was changed outside Make Docs.",
      "Run make-docs setup store clean to remove what the fixed rules prove.",
    ],
  },
  "setup.store.clean": {
    summary: "Back up the Make Docs Store, then remove only what the fixed rules prove is safe to remove.",
    usage: "[--yes] [--dry-run] [--json]",
    options: [
      { name: "--yes", text: "Clean without a question. A run with no terminal needs it." },
      { name: "--dry-run", text: "Show what clean would do, and change nothing." },
      JSON_OPTION,
    ],
    notes: [
      "Clean first saves a backup in the backup folder of the Store: MAKE_DOCS_HOME/backup/ when MAKE_DOCS_HOME is set, else ~/.make-docs/backup/. It keeps the three newest backups.",
      "Then it removes only what the fixed rules prove, in one transaction, and shrinks the file.",
      "To restore a backup, stop every Make Docs command and MCP server, copy the backup over the Store database file, and delete that file's -wal and -shm files. Clean prints the exact paths.",
    ],
  },
  "lifecycle.start": {
    summary: "Start a lifecycle run for this project in the Make Docs Store.",
    usage: "--stage <stage> [--run-id <id>] [--checkpoint <name>] [--metadata-json <file-or-json>] [--repo-root <path>] [--store-root <path>] [--json]",
    options: [
      { name: "--stage <stage>", text: "The lifecycle stage the run starts in." },
      { name: "--run-id <id>", text: "The ID for the new run. The default is a new ID." },
      { name: "--checkpoint <name>", text: "The first checkpoint name." },
      { name: "--metadata-json <file-or-json>", text: "Extra data to keep with the run." },
      REPO_ROOT,
      STORE_ROOT,
      JSON_OPTION,
    ],
  },
  "lifecycle.show": {
    summary: "Show one lifecycle run and its evidence. Changes nothing.",
    usage: "--run-id <id>|--last [--repo-root <path>] [--store-root <path>] [--json]",
    options: [
      { name: "--run-id <id>|--last", text: "The run to show: its ID (a unique start of the ID is enough), or --last for the newest run." },
      REPO_ROOT,
      STORE_ROOT,
      JSON_OPTION,
    ],
  },
  "lifecycle.list": {
    summary: "List this project's lifecycle runs. Changes nothing.",
    usage: "[--repo-root <path>] [--store-root <path>] [--json]",
    options: [REPO_ROOT, STORE_ROOT, JSON_OPTION],
  },
  "lifecycle.checkpoint": lifecycleVersioned(
    "Record a checkpoint in a lifecycle run.",
    " --checkpoint <name> [--stage <stage>] [--metadata-json <file-or-json>]",
    [
      { name: "--checkpoint <name>", text: "The checkpoint name." },
      { name: "--stage <stage>", text: "Move the run to this stage." },
      { name: "--metadata-json <file-or-json>", text: "Extra data to keep with the checkpoint." },
    ],
  ),
  "lifecycle.pause": lifecycleVersioned("Pause an active lifecycle run."),
  "lifecycle.resume": lifecycleVersioned("Resume a paused lifecycle run."),
  "lifecycle.attach-evidence": lifecycleVersioned(
    "Link one piece of evidence to a lifecycle run.",
    " --evidence-id <id> --kind <kind> [--project-path <path>] [--external-reference <ref>] [--digest <sha256>]",
    [
      { name: "--evidence-id <id>", text: "The evidence ID." },
      { name: "--kind <kind>", text: "The kind of evidence." },
      { name: "--project-path <path>", text: "Where the evidence is in the project." },
      { name: "--external-reference <ref>", text: "Where the evidence is outside the project." },
      { name: "--digest <sha256>", text: "The evidence file's SHA-256 digest." },
    ],
  ),
  "lifecycle.complete": lifecycleVersioned("Mark a lifecycle run as done."),
  "lifecycle.fail": lifecycleVersioned("Mark a lifecycle run as failed."),
  "lifecycle.abandon": lifecycleVersioned("Stop a lifecycle run that will not finish."),
  "uat.scenario.validate": uat("Check one user test scenario record. Changes nothing."),
  "uat.persona.resolve": uat("Find the Persona for a user test and check it. Changes nothing."),
  "uat.target.validate": uat("Check one user test target record. Changes nothing."),
  "uat.evidence-reference.validate": uat("Check one user test evidence link and its file digest. Changes nothing."),
  "uat.finding.validate": uat("Check one user test finding record. Changes nothing."),
  "uat.result.validate": uat("Check one user test result record. Changes nothing."),
  // W34 R0 P1: the Skill check commands (PRD 39 R-SKILL-CHECK).
  "decomposition.output.validate": {
    summary: "Check a decompose-codebase result: PRD names and sections, source anchors, work backlogs, task IDs, acceptance criteria, and links. Changes nothing.",
    usage: "[--target-root <path>] [--json]",
    options: [TARGET_ROOT, JSON_OPTION],
    notes: [
      "Each finding names its rule ID, such as decomposition.task-id.sequence, and its file.",
      "The command exits with 1 when it finds a problem.",
    ],
  },
  "project.relations.list": {
    summary: "List how designs, plans, work backlogs, history records, and guides relate: links, related: entries, W/R coordinates, and same-slug matches. Changes nothing.",
    usage: "[--path <path>] [--target-root <path>] [--json]",
    options: [
      { name: "--path <path>", text: "Show only this artifact and the artifacts that relate to it, such as docs/plans/2026-01-01-w1-r0-example/." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: ["Guide folders come from the project's Personas, as make-docs project persona list shows them."],
  },
  "project.markdown-style.validate": {
    summary: "Check Markdown source style: blank lines between blocks, wrapped paragraphs, and wrapped list items. Changes nothing.",
    usage: "[--path <path>] [--target-root <path>] [--json]",
    options: [
      { name: "--path <path>", text: "A Markdown file or folder in the project to check. Repeat it for more. The default is docs." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: [
      "It skips AGENTS.md and CLAUDE.md routers, files with a make-docs managed block, and the folders that project paths validate skips, such as node_modules and .make-docs/backup. It lists each one it skips.",
      "Exit codes: 0 when it finds nothing, 1 when it finds a problem, 2 on an error, as project paths validate does.",
    ],
  },
  "project.markdown-style.repair": {
    summary: "Fix the Markdown style findings that the check marks as fixable. Shows the changes first.",
    usage: "[--apply|--dry-run] [--path <path>] [--target-root <path>] [--json]",
    options: [
      { name: "--apply|--dry-run", text: "--apply writes the fixes. --dry-run only shows them. The default is to only show them." },
      { name: "--path <path>", text: "A Markdown file or folder in the project to repair. Repeat it for more. The default is docs." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: [
      "Repair adds blank lines between blocks and joins wrapped paragraphs. It does not change lists, tables, quotes, code, or front matter.",
      "It shows each exact change: the lines it removes and the line it adds. --json also gives each file before and after.",
      "It never changes AGENTS.md or CLAUDE.md routers, files with a make-docs managed block, or the folders that project paths validate skips.",
      "Exit codes: 0 when no finding is left, 1 when a finding is left, 2 on an error, as project paths repair does. A preview leaves every finding, so it exits 1 when there is something to fix.",
    ],
  },
  // W29 R0 P4: the work queue (PRD 52). Units are coordinates such as `W29 R0 P4 T3`, or quick item numbers such as `7`.
  "work.queue.status": {
    summary: "Say whether the work store or the docs/work/ files are in charge of this project's work, and why, with each sync conflict and its settle commands. Changes nothing.",
    usage: "[--target-root <path>] [--json]",
    options: [TARGET_ROOT, JSON_OPTION],
    notes: ["Status also checks sync, and names each file that the next sync would import, write, or remove."],
  },
  "work.queue.sync": {
    summary: "Sync the docs/work/ files and the work store both ways, or settle one conflict with the choice its report names.",
    usage: "[--settle <path> --keep-file|--keep-store|--restore|--accept-deletion|--reimport|--remove-file] [--expected-revision <n>] [--dry-run] [--target-root <path>] [--json]",
    options: [
      { name: "--settle <path>", text: "The work file whose conflict you settle. Give it with one choice." },
      { name: "--keep-file|--keep-store|--restore|--accept-deletion|--reimport|--remove-file", text: "The settle choice. Each conflict offers two; its report names them." },
      { name: "--expected-revision <n>", text: "The store revision that the conflict report showed. The settle stops if it changed." },
      { name: "--dry-run", text: "Show what sync would do, and change nothing." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: [
      "Every other work command syncs first, so you seldom need this one.",
      "Sync never writes a path on the sync hold list (work.syncHold in .make-docs/config.yaml).",
    ],
  },
  "work.queue.next": {
    summary: "List the work that is ready, in order, and why each other open unit waits, with one next action for each reason. Changes nothing.",
    usage: "[--level <kind>] [--claimant <name>] [--no-quick-items] [--limit <n>] [--target-root <path>] [--json]",
    options: [
      { name: "--level <kind>", text: "wave, revision, phase, stage, task, or quick-item. The default is phase." },
      { name: "--claimant <name>", text: "Your claimant name. Units inside a unit you hold are ready for you. work next never shows a claim ID." },
      { name: "--no-quick-items", text: "Leave quick items out." },
      { name: "--limit <n>", text: "Show at most this many ready units." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: ["Archived backlogs never show here. A wave is ready when all its revisions are closed."],
  },
  "work.queue.claim": {
    summary: "Claim a ready unit for a time limit, renew your claim, or take over an expired claim after you check the old task handle.",
    usage: "<unit> --claimant <name> --expected-version <n> [--claim-id <id>] [--task-handle <text>] [--ttl <seconds>] [--takeover-from <name> --handle <seen>] [--target-root <path>] [--json]",
    arguments: [{ name: "<unit>", text: "A coordinate such as W29 R0 P4 T3, or a quick item number such as 7." }],
    options: [
      { name: "--claimant <name>", text: "Who claims the unit." },
      { name: "--expected-version <n>", text: "The unit revision from work next. The claim stops if the unit changed." },
      { name: "--claim-id <id>", text: "Your claim ID, to renew your live claim. Leave it out for a new claim." },
      { name: "--task-handle <text>", text: "A handle that another claimant can check, such as a task ID." },
      { name: "--ttl <seconds>", text: "How long the claim lasts: 1200 to 86400 seconds. The default is 1800." },
      { name: "--takeover-from <name>", text: "Take over the expired claim of this claimant." },
      { name: "--handle <seen>", text: "What the handle check saw: running, stopped, finished, not-found, or no-handle." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: ["A new claim shows its claim ID once. Keep it private, like a key: renew, report, close, and release need it. No other result shows it."],
  },
  "work.queue.release": {
    summary: "Release a claim without closing its unit: your own claim with its claim ID, or anyone's expired claim after a check of its task handle.",
    usage: "<unit> --expected-version <n> [--claim-id <id>|--handle <seen>] [--target-root <path>] [--json]",
    arguments: [{ name: "<unit>", text: "A coordinate such as W29 R0 P4 T3, or a quick item number such as 7." }],
    options: [
      { name: "--expected-version <n>", text: "The unit revision you last read." },
      { name: "--claim-id <id>|--handle <seen>", text: "Your claim ID. Or, for an expired claim of anyone, what the check of its task handle saw: stopped, finished, not-found, or no-handle." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  "work.queue.report": {
    summary: "Record progress on a unit: a status change, a short note, an evidence link, cleared blockers, or met gates.",
    usage: "<unit> --expected-version <n> [--claim-id <id>] [--status <status>] [--evidence <path>] [--clear-blockers] [--met-gate <text>] [--note <text>] [--target-root <path>] [--json]",
    arguments: [{ name: "<unit>", text: "A coordinate such as W29 R0 P4 T3, or a quick item number such as 7." }],
    options: [
      { name: "--expected-version <n>", text: "The unit revision you last read." },
      { name: "--claim-id <id>", text: "Your claim ID. A claimed unit changes only through its holder." },
      { name: "--status <status>", text: "open, in-progress, or blocked." },
      { name: "--evidence <path>", text: "A repository-relative path to an evidence file to link." },
      { name: "--clear-blockers", text: "Clear every blocker. A blocked unit opens again." },
      { name: "--met-gate <text>", text: "A gate text to record as met, exactly as work next shows it. Repeat it for more." },
      { name: "--note <text>", text: "A short progress note: one line of plain text, at most 256 characters. It replaces the unit's last note." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: ["A cleared blocker, a met gate, and a status the file cannot show stay in the store only. The report names each one."],
  },
  "work.queue.close": {
    summary: "Close a unit as done, cancelled, or superseded, and release its claim.",
    usage: "<unit> --expected-version <n> [--claim-id <id>] [--handle <seen>] [--outcome <outcome>] [--target-root <path>] [--json]",
    arguments: [{ name: "<unit>", text: "A coordinate such as W29 R0 P4 T3, or a quick item number such as 7." }],
    options: [
      { name: "--expected-version <n>", text: "The unit revision you last read." },
      { name: "--claim-id <id>", text: "Your claim ID. A claimed unit closes only through its holder." },
      { name: "--handle <seen>", text: "For a unit whose claim ran out: what the check of its task handle saw: stopped, finished, not-found, or no-handle." },
      { name: "--outcome <outcome>", text: "done, cancelled, or superseded. The default is done." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: ["Closing every task does not close the phase. The next sync shows the close in the work file."],
  },
  "work.queue.export": {
    summary: "Write the backlog files that the work store holds to a folder you name, or the quick item list to a file you name.",
    usage: "[--to <dir>] [--quick <file>] [--path <path>] [--target-root <path>] [--json]",
    options: [
      { name: "--to <dir>", text: "A folder outside docs/work/ for the backlog files." },
      { name: "--quick <file>", text: "A file for the project's quick item list." },
      { name: "--path <path>", text: "Only this work file or folder, such as docs/work/2042-06-01-w1-r0-aurora/. Repeat it for more." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
    notes: ["Export never writes into docs/work/ or .make-docs/archive/work/. Sync owns those files."],
  },
  "work.queue.add": {
    summary: "Add a quick item with the next quick item number of the project. It lives only in the work store.",
    usage: "<title> [--body <text>] [--request <path>] [--target-root <path>] [--json]",
    arguments: [{ name: "<title>", text: "The quick item title." }],
    options: [
      { name: "--body <text>", text: "More detail." },
      { name: "--request <path>", text: "A repository-relative path to the request that created it." },
      TARGET_ROOT,
      JSON_OPTION,
    ],
  },
  // W30 R0 P3 factory commands (PRD 53). A write names its project; a read may use the current folder's.
  "factory.status": {
    summary: "Show one project's factory: one group for each checkout that runs one, then each lifecycle run, with readiness, claimed units, tools, states, and last checks. Changes nothing.",
    usage: "[--run <run-id>] [--target-root <path>] [--project <name>] [--json]",
    options: [{ name: "--run <run-id>", text: "Show only this lifecycle run." }, FACTORY_READ_TARGET, FACTORY_READ_PROJECT, JSON_OPTION],
    notes: [FACTORY_READ_NOTE],
  },
  "factory.tools.save": {
    summary: "Check and save this machine's agent tools and their capability proofs, as the agent reports them. It takes no project and contacts no tool.",
    usage: "--tools-json <file> [--json]",
    options: [
      { name: "--tools-json <file>", text: "A JSON file, or inline JSON, with the list of tools: each with toolId, kind, label, state, reportedVersion, capabilities, proofs, and expectedVersion (null for a new tool)." },
      JSON_OPTION,
    ],
    notes: ["This command acts on this machine. Every project on this machine uses the same tool list."],
  },
  "factory.workflow.save": {
    summary: "Check and save one workflow's choices and tool bindings, and save a new plan revision when the plan changed; or write or revoke grants only.",
    usage: "<workflow> [--expected-version <n>] [--binding-json <file>] [--grants-json <file>] [--ready] [--target-root <path>] [--project <name>] [--json]",
    arguments: [{ name: "<workflow>", text: "The workflow name, as the factory block of the config names it." }],
    options: [
      { name: "--expected-version <n>", text: "The workflow version that you read. Leave it out for a new workflow or a grant-only save." },
      { name: "--binding-json <file>", text: "A JSON file, or inline JSON, with roles, worktreeMethod, channelRef, wakeMethod, wakeRef, and knownLosses. Leave it out for a grant-only save." },
      { name: "--grants-json <file>", text: "A JSON file, or inline JSON, with grants to add and grants to revoke. Grants are never part of the plan." },
      { name: "--ready", text: "Ask for ready. It is refused unless a passed test task ran under the plan that this save gives." },
      FACTORY_WRITE_TARGET,
      FACTORY_WRITE_PROJECT,
      JSON_OPTION,
    ],
    notes: [FACTORY_WRITE_NOTE],
  },
  "factory.workflow.show": {
    summary: "Show one workflow's latest or named plan revision, its live readiness and drift reasons, and its grants beside the plan. Changes nothing.",
    usage: "<workflow> [--revision <n>] [--target-root <path>] [--project <name>] [--json]",
    arguments: [{ name: "<workflow>", text: "The workflow name." }],
    options: [{ name: "--revision <n>", text: "A kept plan revision. The default is the latest." }, FACTORY_READ_TARGET, FACTORY_READ_PROJECT, JSON_OPTION],
    notes: [FACTORY_READ_NOTE],
  },
  "factory.workflow.list": {
    summary: "List one project's factory workflows with their live readiness. Changes nothing.",
    usage: "[--target-root <path>] [--project <name>] [--json]",
    options: [FACTORY_READ_TARGET, FACTORY_READ_PROJECT, JSON_OPTION],
    notes: [FACTORY_READ_NOTE],
  },
  "factory.proof.save": {
    summary: "Save a test task result for the current plan, and make that plan revision the ready revision when the test task passed.",
    usage: "<workflow> --outcome <passed|failed> --test-task <text> --plan-digest <digest> --path <text> [--manual-step <text>] [--expected-version <n>] [--target-root <path>] [--project <name>] [--json]",
    arguments: [{ name: "<workflow>", text: "The workflow name." }],
    options: [
      { name: "--outcome <passed|failed>", text: "The test task result." },
      { name: "--test-task <text>", text: "The test task, as one short line." },
      { name: "--plan-digest <digest>", text: "The plan digest that the test task ran under, from workflow save or workflow show." },
      { name: "--path <text>", text: "One step of the path that the test task exercised. Repeat it for each step." },
      { name: "--manual-step <text>", text: "One open manual step. Repeat it for each step." },
      { name: "--expected-version <n>", text: "The version of the last result with this outcome. Leave it out for the first one." },
      FACTORY_WRITE_TARGET,
      FACTORY_WRITE_PROJECT,
      JSON_OPTION,
    ],
    notes: [FACTORY_WRITE_NOTE],
  },
  "factory.assignment.start": {
    summary: "Record a new assignment of one job to a tool, under the ready plan revision, in the checkout that the call names. Only the holder of the unit's claim starts it.",
    usage: "<unit> --workflow <name> --role <name> --run-id <id> [--claim-id <id>] [--part <name>] [--tool <name>] [--task-handle <text>] [--reset-rounds] [--target-root <path>] [--project <name>] [--json]",
    arguments: [{ name: "<unit>", text: "A coordinate such as W29 R0 P4, or a quick item number such as 7." }],
    options: [
      { name: "--workflow <name>", text: "The workflow that runs the job." },
      { name: "--role <name>", text: "The role of the job, such as builder or reviewer." },
      { name: "--run-id <id>", text: "The lifecycle run of the claim: a run of this project that has not ended." },
      FACTORY_CLAIM_ID,
      { name: "--part <name>", text: "The part label of the job. The default is main." },
      { name: "--tool <name>", text: "The tool doing the job. It must be the tool that the ready plan binds to the role, which is the default." },
      { name: "--task-handle <text>", text: "A handle that another agent can check, such as a task ID." },
      { name: "--reset-rounds", text: "Spend a once grant for reset-correction-rounds, so this assignment starts at round 0." },
      FACTORY_WRITE_TARGET,
      FACTORY_WRITE_PROJECT,
      JSON_OPTION,
    ],
    notes: [FACTORY_WRITE_NOTE, FACTORY_CLAIM_NOTE],
  },
  "factory.assignment.save": {
    summary: "Move an assignment along the status move table, record a check, or record the use of a grant. Only the holder of the unit's claim updates it.",
    usage: "<assignment> --expected-version <n> [--claim-id <id>] [--status <status>] [--reason <code>] [--task-handle <text>] [--grant-use <action>] [--target-root <path>] [--project <name>] [--json]",
    arguments: [{ name: "<assignment>", text: "The assignment ID from assignment start or assignment list." }],
    options: [
      { name: "--expected-version <n>", text: "The assignment version that you read." },
      FACTORY_CLAIM_ID,
      { name: "--status <status>", text: "The new status. Leave it out to record a check only." },
      { name: "--reason <code>", text: "The status history reason code of a move, from the factory contract." },
      { name: "--task-handle <text>", text: "A new task handle." },
      { name: "--grant-use <action>", text: "Record the use of a grant for this action, such as merge." },
      FACTORY_WRITE_TARGET,
      FACTORY_WRITE_PROJECT,
      JSON_OPTION,
    ],
    notes: [FACTORY_WRITE_NOTE, FACTORY_CLAIM_NOTE],
  },
  "factory.assignment.list": {
    summary: "List one project's open factory assignments, or every assignment. Changes nothing.",
    usage: "[--workflow <name>] [--all] [--target-root <path>] [--project <name>] [--json]",
    options: [{ name: "--workflow <name>", text: "Only this workflow." }, { name: "--all", text: "Also list final assignments." }, FACTORY_READ_TARGET, FACTORY_READ_PROJECT, JSON_OPTION],
    notes: [FACTORY_READ_NOTE],
  },
  "factory.restore": {
    summary: "Write the .make-docs/factory/ copies of one checkout again from the Store, with the latest plan revisions and no grant.",
    usage: "[--target-root <path>] [--project <name>] [--json]",
    options: [FACTORY_WRITE_TARGET, FACTORY_WRITE_PROJECT, JSON_OPTION],
    notes: [FACTORY_WRITE_NOTE],
  },
};

/** The help entry of one registry operation. Throws when the table has none. */
export function leafHelpEntry(operationId: string): LeafHelpEntry {
  const entry = OPERATION_LEAF_HELP[operationId as AdmittedOperationId];
  if (entry === undefined) {
    throw new Error(`Operation \`${operationId}\` has no leaf help; add one in src/operations/leaf-help-table.ts.`);
  }
  return entry;
}
