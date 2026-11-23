/**
 * W33 R0 P1 name catalog (PRD 39 R-NAME-5).
 *
 * One entry for every admitted registry operation, every hand-defined MCP
 * tool, and every operation that W29 R0, W30 R0, W31 R0, and W32 R0 plan.
 * Each entry holds the current CLI path and MCP name and the new CLI path and
 * MCP name under PRD 39 R-NAME-1 to R-NAME-4.
 *
 * W33 R0 P2 built the command tree and the MCP names from it, so every
 * current entry's current names are its new names. `formerCli` and
 * `formerMcp` keep the names from before W33 R0 for the P3 migration
 * aliases. Operation IDs do not change. CLI paths here omit the leading
 * `make-docs`.
 */

export const NAME_CATALOG_ID = "make-docs.name-catalog.v1";

/** PRD 39 R-TOP-1: the eleven top-level groups. `run` is not a group. */
export const NAME_GROUPS = [
  "setup",
  "project",
  "resource",
  "work",
  "backlog",
  "lifecycle",
  "factory",
  "check",
  "mcp",
  "update",
  "uninstall",
] as const;
export type NameGroup = (typeof NAME_GROUPS)[number];

/** PRD 39 R-NAME-4. */
export const MCP_NAME_MAX_LENGTH = 26;

export type NameEndWordForm = "verb" | "exception";

export interface NameEndWord {
  word: string;
  form: NameEndWordForm;
  /** Why a word that is not a plain verb may end a path. Required for an exception. */
  note?: string;
}

/**
 * Words that may end a path (R-NAME-2: the verb comes last). In the `check`
 * group the group word is the verb, so its paths end with an object
 * (owner decision ND-01). Each word is a plain verb or a documented exception.
 */
export const NAME_END_WORDS: readonly NameEndWord[] = [
  { word: "abandon", form: "verb" },
  { word: "add", form: "verb" },
  { word: "apply", form: "verb" },
  { word: "attach-evidence", form: "verb" },
  { word: "check", form: "verb" },
  { word: "checkpoint", form: "verb" },
  { word: "claim", form: "verb" },
  { word: "clean", form: "verb" },
  { word: "close", form: "verb" },
  { word: "complete", form: "verb" },
  { word: "ensure", form: "verb" },
  { word: "export", form: "verb" },
  { word: "fail", form: "verb" },
  { word: "fix", form: "verb" },
  { word: "list", form: "verb" },
  { word: "lookup", form: "exception", note: "The registry ID `work.backlog-cache.lookup` uses it as the verb \"look up\"." },
  { word: "next", form: "exception", note: "PRD 52 names `make-docs work next`: show the next ready units." },
  { word: "open", form: "verb" },
  { word: "pause", form: "verb" },
  { word: "plan", form: "verb" },
  { word: "prepare", form: "verb" },
  { word: "preview", form: "verb" },
  { word: "read", form: "verb" },
  { word: "record", form: "verb" },
  { word: "recover", form: "verb" },
  { word: "refresh", form: "verb" },
  { word: "release", form: "verb" },
  { word: "repair", form: "verb" },
  { word: "report", form: "verb" },
  { word: "resolve", form: "verb" },
  { word: "restore", form: "verb" },
  { word: "resume", form: "verb" },
  { word: "save", form: "verb" },
  { word: "show", form: "verb" },
  { word: "snapshot", form: "verb" },
  { word: "start", form: "verb" },
  { word: "status", form: "exception", note: "PRD 52 and PRD 53 name `work status` and `factory status`: show the status." },
  { word: "sync", form: "verb" },
  { word: "update", form: "verb" },
  { word: "validate", form: "verb" },
  { word: "verify", form: "verb" },
  { word: "write", form: "verb" },
];

export const NAME_VERBS: readonly string[] = NAME_END_WORDS.map((entry) => entry.word);

/** One path word: lower case, with hyphens between the parts of a multi-word word. */
export const NAME_WORD_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Commands that are not registry operations or MCP tools. They keep their
 * paths in W33 R0. A catalog path must not take their place.
 */
export const NON_REGISTRY_COMMANDS = [
  "setup",
  "setup system",
  "setup reconfigure",
  "setup skills",
  "setup backup",
  "setup remove",
  "mcp",
  "update",
  "uninstall",
] as const;

export type NameCatalogEntryKind = "operation" | "hand-defined-tool";
export type NameCatalogStatus = "current" | "planned";
export type NameCatalogPlanner = "W29 R0" | "W30 R0" | "W31 R0" | "W32 R0";

export interface NameCatalogEntry {
  /** Registry operation ID, or the current MCP name of a hand-defined tool. */
  id: string;
  kind: NameCatalogEntryKind;
  status: NameCatalogStatus;
  /** The Wave that plans a `planned` entry. */
  plannedBy?: NameCatalogPlanner;
  group: NameGroup;
  /** Current CLI path after `make-docs`, or null when no command exists. */
  currentCli: string | null;
  /** Current MCP name, or null when no tool exists. */
  currentMcp: string | null;
  /**
   * CLI path before W33 R0, or null when none existed. W33 R0 P3 keeps it as a
   * hidden alias when it differs from `newCli` (PRD 39 R-MIG-1).
   */
  formerCli: string | null;
  /**
   * MCP name before W33 R0, or null when none existed. W33 R0 P3 keeps it as a
   * hidden alias when it differs from `newMcp`.
   */
  formerMcp: string | null;
  /** A name an earlier plan used for a planned entry. It never shipped. */
  formerPlannedMcp?: string;
  /** New CLI path after `make-docs`. */
  newCli: string;
  /** New MCP name: `newCli` with spaces and hyphens as underscores. */
  newMcp: string;
  /** False when W33 adds no CLI command and the MCP name uses the path it would have. */
  cliCommand: boolean;
  /** The natural path when R-NAME-4 forced a shorter one. Its MCP name passes 26 characters. */
  unshortenedCli?: string;
  /** Why a path was shortened or chosen, or why a tool has an MCP name only. */
  reason?: string;
  /** Owner decision that covers this entry. */
  decision?: NameOwnerDecisionId;
}

export type NameOwnerDecisionId = `ND-${string}`;

export interface NameOwnerDecision {
  id: NameOwnerDecisionId;
  title: string;
  /** The choice in force. */
  choice: string;
  /** `accepted`: the owner took the proposal. `changed`: the owner chose another name. */
  outcome: "accepted" | "changed";
  /** What P1 proposed, when the owner changed it. */
  proposed?: string;
  decidedOn: string;
}

const DECIDED = "2026-11-22";

/** Choices the rules leave open. The owner decided each one on 2026-11-22. */
export const NAME_OWNER_DECISIONS: readonly NameOwnerDecision[] = [
  {
    id: "ND-01",
    title: "`check` paths end with an object",
    choice:
      "In the `check` group the group word is the verb, so a path is `check <object>`, such as `check prd`. Every other group ends with a verb. PRD 39 R-NAME-2 holds this exception.",
    outcome: "accepted",
    decidedOn: DECIDED,
  },
  {
    id: "ND-02",
    title: "`project persona list` keeps its path",
    choice:
      "R-NAME-2 needs a final verb, so the design row `project personas` is not used. The path stays `project persona list`, and the MCP name is `project_persona_list`.",
    outcome: "accepted",
    decidedOn: DECIDED,
  },
  {
    id: "ND-03",
    title: "`project state` keeps `state`",
    choice:
      "`project state status` and `project state recover` keep their paths. The MCP names become `project_state_status` and `project_state_recover`.",
    outcome: "changed",
    proposed: "`project status` and `project recover`, with the MCP names `project_status` and `project_recover` unchanged.",
    decidedOn: DECIDED,
  },
  {
    id: "ND-04",
    title: "Checkout move becomes `project move`",
    choice:
      "`project checkout-move preview` and `apply` become `project move preview` and `project move apply` (forced: 29 and 27 characters).",
    outcome: "accepted",
    decidedOn: DECIDED,
  },
  {
    id: "ND-05",
    title: "Checkout register becomes `project checkout`",
    choice:
      "`project checkout-register preview` and `apply` become `project checkout preview` and `project checkout apply` (forced: 33 and 31 characters). No `project register` subtree exists, so it is not confused with the `project_register` Store table or `project list`.",
    outcome: "changed",
    proposed: "`project register preview` and `project register apply`.",
    decidedOn: DECIDED,
  },
  {
    id: "ND-06",
    title: "Path hygiene becomes `project paths`",
    choice:
      "`project path-hygiene validate` and `repair` become `project paths validate` and `project paths repair` (forced: 29 and 27 characters).",
    outcome: "accepted",
    decidedOn: DECIDED,
  },
  {
    id: "ND-07",
    title: "Performance evidence becomes `check performance-evidence`",
    choice:
      "`run performance evidence validate` becomes `check performance-evidence`, and the MCP name is `check_performance_evidence` (26 characters).",
    outcome: "changed",
    proposed: "`check performance` (`check_performance`).",
    decidedOn: DECIDED,
  },
  {
    id: "ND-08",
    title: "UAT checks become `check uat <object>`",
    choice:
      "The six UAT validators become `check uat scenario`, `persona`, `target`, `evidence`, `finding`, and `result`. `evidence-reference` becomes `evidence` (forced: 28 characters). `uat persona resolve` becomes `check uat persona`: it resolves and checks the Persona and changes nothing.",
    outcome: "accepted",
    decidedOn: DECIDED,
  },
  {
    id: "ND-09",
    title: "`work item resolve` keeps its path",
    choice: "`work item resolve` keeps its path and its MCP name `work_item_resolve`.",
    outcome: "changed",
    proposed: "The design row `work resolve` (`work_resolve`).",
    decidedOn: DECIDED,
  },
  {
    id: "ND-10",
    title: "Hand-defined tools get paths but no new commands",
    choice:
      "`install_status`, `install_plan`, `manifest`, `config`, and `compatibility` go to `setup` as `setup status`, `setup plan`, `setup manifest read`, `setup config read`, and `setup compatibility check`. `domains` goes to `mcp` as `mcp domains list`. W33 adds no CLI command for them, so they are MCP only.",
    outcome: "accepted",
    decidedOn: DECIDED,
  },
];

const W29 = "W29 R0" as const;
const W30 = "W30 R0" as const;
const W31 = "W31 R0" as const;
const W32 = "W32 R0" as const;

/** Make the MCP name from a CLI path (R-NAME-3). */
export function mcpNameForCliPath(cliPath: string): string {
  return cliPath.replace(/[ -]/g, "_");
}

type EntryInput = Omit<NameCatalogEntry, "newMcp" | "cliCommand" | "formerCli" | "formerMcp"> & {
  cliCommand?: boolean;
  formerCli?: string | null;
  formerMcp?: string | null;
};

function entry(input: EntryInput): NameCatalogEntry {
  return {
    ...input,
    formerCli: input.formerCli ?? null,
    formerMcp: input.formerMcp ?? null,
    cliCommand: input.cliCommand ?? true,
    newMcp: mcpNameForCliPath(input.newCli),
  };
}

/** A current operation. Since W33 R0 P2 its current names are its new names. */
function current(
  id: string,
  group: NameGroup,
  formerCli: string,
  formerMcp: string,
  newCli: string,
  extra: Partial<EntryInput> = {},
): NameCatalogEntry {
  return entry({
    id,
    kind: "operation",
    status: "current",
    group,
    currentCli: newCli,
    currentMcp: mcpNameForCliPath(newCli),
    formerCli,
    formerMcp,
    newCli,
    ...extra,
  });
}

function planned(
  id: string,
  plannedBy: NameCatalogPlanner,
  group: NameGroup,
  newCli: string,
  extra: Partial<EntryInput> = {},
): NameCatalogEntry {
  return entry({ id, kind: "operation", status: "planned", plannedBy, group, currentCli: null, currentMcp: null, newCli, ...extra });
}

/** A hand-defined MCP tool. Its ID is its current MCP name; `formerName` is its name before W33 R0. */
function tool(
  formerName: string,
  group: NameGroup,
  newCli: string,
  reason: string,
): NameCatalogEntry {
  const name = mcpNameForCliPath(newCli);
  return entry({
    id: name,
    kind: "hand-defined-tool",
    status: "current",
    group,
    currentCli: null,
    currentMcp: name,
    formerCli: null,
    formerMcp: formerName,
    newCli,
    cliCommand: false,
    reason,
    decision: "ND-10",
  });
}

const TOOL_REASON = "MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have.";

export const NAME_CATALOG: readonly NameCatalogEntry[] = [
  // setup
  tool("install_status", "setup", "setup status", `${TOOL_REASON} It reads the installed state.`),
  tool("install_plan", "setup", "setup plan", `${TOOL_REASON} \`make-docs setup --dry-run\` already shows the plan.`),
  tool("manifest", "setup", "setup manifest read", `${TOOL_REASON} R-NAME-2 needs the final verb \`read\`.`),
  tool("config", "setup", "setup config read", `${TOOL_REASON} R-NAME-2 needs the final verb \`read\`.`),
  tool("compatibility", "setup", "setup compatibility check", `${TOOL_REASON} R-NAME-2 needs the final verb \`check\`.`),
  current("setup.store.check", "setup", "setup store check", "setup_store_check", "setup store check"),
  current("setup.store.clean", "setup", "setup store clean", "setup_store_clean", "setup store clean"),

  // project
  current("project.state.status", "project", "project state status", "project_status", "project state status", {
    reason: "The owner kept the path. The MCP name now follows R-NAME-3.",
    decision: "ND-03",
  }),
  current("project.state.recover", "project", "project state recover", "project_recover", "project state recover", {
    reason: "The owner kept the path. The MCP name now follows R-NAME-3.",
    decision: "ND-03",
  }),
  current("project.checkout-move.preview", "project", "project checkout-move preview", "checkout_move_preview", "project move preview", {
    unshortenedCli: "project checkout-move preview",
    reason: "Shortened: `project_checkout_move_preview` has 29 characters. Design row.",
    decision: "ND-04",
  }),
  current("project.checkout-move.apply", "project", "project checkout-move apply", "checkout_move_apply", "project move apply", {
    unshortenedCli: "project checkout-move apply",
    reason: "Shortened: `project_checkout_move_apply` has 27 characters.",
    decision: "ND-04",
  }),
  current("project.checkout-register.preview", "project", "project checkout-register preview", "checkout_register_preview", "project checkout preview", {
    unshortenedCli: "project checkout-register preview",
    reason: "Shortened: `project_checkout_register_preview` has 33 characters.",
    decision: "ND-05",
  }),
  current("project.checkout-register.apply", "project", "project checkout-register apply", "checkout_register_apply", "project checkout apply", {
    unshortenedCli: "project checkout-register apply",
    reason: "Shortened: `project_checkout_register_apply` has 31 characters.",
    decision: "ND-05",
  }),
  current("project.persona.list", "project", "project persona list", "personas", "project persona list", {
    reason: "R-NAME-2 needs a final verb, so the design row `project personas` is not used.",
    decision: "ND-02",
  }),
  current("project.layout.preview", "project", "project layout preview", "layout_preview", "project layout preview"),
  current("project.layout.prepare", "project", "project layout prepare", "layout_prepare", "project layout prepare"),
  current("project.layout.apply", "project", "project layout apply", "layout_apply", "project layout apply"),
  current("project.layout.verify", "project", "project layout verify", "layout_verify", "project layout verify"),
  current("project.surface.ensure", "project", "project surface ensure", "surface_ensure", "project surface ensure"),
  current("project.path-hygiene.validate", "project", "project path-hygiene validate", "paths_validate", "project paths validate", {
    unshortenedCli: "project path-hygiene validate",
    reason: "Shortened: `project_path_hygiene_validate` has 29 characters.",
    decision: "ND-06",
  }),
  current("project.path-hygiene.repair", "project", "project path-hygiene repair", "paths_repair", "project paths repair", {
    unshortenedCli: "project path-hygiene repair",
    reason: "Shortened: `project_path_hygiene_repair` has 27 characters.",
    decision: "ND-06",
  }),
  current("project.register.list", "project", "project list", "project_list", "project list", {
    formerPlannedMcp: "project_register_list",
    reason: "PRD 39 R-STORE-CMD names `make-docs project list`. The earlier plan named the tool `project_register_list`. W32 R0 P3 landed it.",
  }),
  current("project.doctor.check", "project", "project doctor check", "project_doctor_check", "project doctor check"),
  current("project.doctor.fix", "project", "project doctor fix", "project_doctor_fix", "project doctor fix"),

  // resource
  current("resource.list", "resource", "resource list", "resource_list", "resource list"),
  current("resource.read", "resource", "resource read", "resource_read", "resource read"),
  current("resource.ensure", "resource", "resource ensure", "resource_ensure", "resource ensure"),

  // work
  current("work.item.resolve", "work", "run work item resolve", "work_item_resolve", "work item resolve", {
    reason: "The owner kept the path and the MCP name instead of the design row `work resolve`.",
    decision: "ND-09",
  }),
  current("work.evidence.record", "work", "run work evidence record", "evidence_record", "work evidence record"),
  current("work.evidence.read", "work", "run work evidence read", "evidence_read", "work evidence read"),
  planned("work.queue.status", W29, "work", "work status"),
  planned("work.queue.sync", W29, "work", "work sync"),
  planned("work.queue.next", W29, "work", "work next"),
  planned("work.queue.claim", W29, "work", "work claim"),
  planned("work.queue.release", W29, "work", "work release"),
  planned("work.queue.report", W29, "work", "work report"),
  planned("work.queue.close", W29, "work", "work close"),
  planned("work.queue.export", W29, "work", "work export"),
  planned("work.queue.add", W29, "work", "work add"),

  // backlog
  current("work.backlog.snapshot", "backlog", "run work backlog snapshot", "backlog_snapshot", "backlog snapshot"),
  current("work.backlog-cache.lookup", "backlog", "run work backlog-cache lookup", "backlog_cache_read", "backlog cache lookup"),
  current("work.backlog-cache.write", "backlog", "run work backlog-cache write", "backlog_cache_write", "backlog cache write"),
  current("backlog.review.open", "backlog", "run backlog review open", "backlog_review_open", "backlog review open"),
  current("backlog.review.refresh", "backlog", "run backlog review refresh", "backlog_review_refresh", "backlog review refresh"),

  // lifecycle
  current("lifecycle.start", "lifecycle", "run lifecycle start", "lifecycle_start", "lifecycle start"),
  current("lifecycle.show", "lifecycle", "run lifecycle show", "lifecycle_show", "lifecycle show"),
  current("lifecycle.list", "lifecycle", "run lifecycle list", "lifecycle_list", "lifecycle list"),
  current("lifecycle.checkpoint", "lifecycle", "run lifecycle checkpoint", "lifecycle_checkpoint", "lifecycle checkpoint"),
  current("lifecycle.pause", "lifecycle", "run lifecycle pause", "lifecycle_pause", "lifecycle pause"),
  current("lifecycle.resume", "lifecycle", "run lifecycle resume", "lifecycle_resume", "lifecycle resume"),
  current("lifecycle.attach-evidence", "lifecycle", "run lifecycle attach-evidence", "lifecycle_attach_evidence", "lifecycle attach-evidence"),
  current("lifecycle.complete", "lifecycle", "run lifecycle complete", "lifecycle_complete", "lifecycle complete"),
  current("lifecycle.fail", "lifecycle", "run lifecycle fail", "lifecycle_fail", "lifecycle fail"),
  current("lifecycle.abandon", "lifecycle", "run lifecycle abandon", "lifecycle_abandon", "lifecycle abandon"),

  // factory
  planned("factory.status", W30, "factory", "factory status"),
  planned("factory.tools.save", W30, "factory", "factory tools save"),
  planned("factory.workflow.save", W30, "factory", "factory workflow save"),
  planned("factory.workflow.show", W30, "factory", "factory workflow show"),
  planned("factory.workflow.list", W30, "factory", "factory workflow list"),
  planned("factory.proof.save", W30, "factory", "factory proof save"),
  planned("factory.assignment.start", W30, "factory", "factory assignment start"),
  planned("factory.assignment.update", W30, "factory", "factory assignment update"),
  planned("factory.assignment.list", W30, "factory", "factory assignment list"),
  planned("factory.restore", W30, "factory", "factory restore"),

  // check
  current("prd.authority.validate", "check", "run prd authority validate", "prd_validate", "check prd", {
    reason: "Design row. The `check` group word is the verb.",
    decision: "ND-01",
  }),
  current("performance.evidence.validate", "check", "run performance evidence validate", "performance_validate", "check performance-evidence", {
    reason: "The owner chose the full object. `check_performance_evidence` has 26 characters.",
    decision: "ND-07",
  }),
  current("uat.scenario.validate", "check", "run uat scenario validate", "uat_scenario_validate", "check uat scenario", { decision: "ND-08" }),
  current("uat.persona.resolve", "check", "run uat persona resolve", "uat_persona_resolve", "check uat persona", {
    reason: "It resolves and checks the Persona and changes nothing, so it is a `check`.",
    decision: "ND-08",
  }),
  current("uat.target.validate", "check", "run uat target validate", "uat_target_validate", "check uat target", { decision: "ND-08" }),
  current("uat.evidence-reference.validate", "check", "run uat evidence-reference validate", "uat_evidence_validate", "check uat evidence", {
    unshortenedCli: "check uat evidence-reference",
    reason: "Shortened: `check_uat_evidence_reference` has 28 characters.",
    decision: "ND-08",
  }),
  current("uat.finding.validate", "check", "run uat finding validate", "uat_finding_validate", "check uat finding", { decision: "ND-08" }),
  current("uat.result.validate", "check", "run uat result validate", "uat_result_validate", "check uat result", { decision: "ND-08" }),

  // mcp
  tool("domains", "mcp", "mcp domains list", `${TOOL_REASON} It lists operation domains for MCP clients. R-NAME-2 needs the final verb \`list\`.`),
];

export interface NameCatalogProblem {
  rule:
    | "R-NAME-1"
    | "R-NAME-2"
    | "R-NAME-3"
    | "R-NAME-4"
    | "duplicate-cli"
    | "duplicate-mcp"
    | "alias-collision"
    | "family-split"
    | "non-registry-collision"
    | "prefix-collision"
    | "missing-reason"
    | "unknown-decision"
    | "shortening-not-forced"
    | "shape";
  id: string;
  message: string;
}

function words(cliPath: string): string[] {
  return cliPath.split(" ");
}

/** Family of an operation ID: `domain.object` for three segments, `domain` for two. */
export function operationFamily(id: string): string {
  const parts = id.split(".");
  return parts.length === 3 ? `${parts[0]}.${parts[1]}` : parts[0]!;
}

/** Check every entry against R-NAME-1 to R-NAME-4 and the catalog's own shape. */
export function validateNameCatalog(
  entries: readonly NameCatalogEntry[],
  decisions: readonly NameOwnerDecision[] = NAME_OWNER_DECISIONS,
): NameCatalogProblem[] {
  const problems: NameCatalogProblem[] = [];
  const add = (rule: NameCatalogProblem["rule"], id: string, message: string) => problems.push({ rule, id, message });
  const groups = new Set<string>(NAME_GROUPS);
  const verbs = new Set<string>(NAME_VERBS);
  const decisionIds = new Set(decisions.map((decision) => decision.id));

  for (const item of entries) {
    const tokens = words(item.newCli);
    // R-NAME-1: one capability, one group.
    if (!groups.has(item.group)) add("R-NAME-1", item.id, `Group \`${item.group}\` is not a PRD 39 R-TOP-1 group.`);
    if (tokens[0] !== item.group) add("R-NAME-1", item.id, `\`${item.newCli}\` does not start with its group \`${item.group}\`.`);
    for (const word of tokens.slice(1, -1)) {
      if (groups.has(word)) add("R-NAME-1", item.id, `\`${item.newCli}\` puts the group word \`${word}\` inside another group.`);
    }
    // R-NAME-2: group, object if needed, verb; lower-case hyphenated words.
    if (tokens.length < 2) add("R-NAME-2", item.id, `\`${item.newCli}\` has no word after its group.`);
    for (const word of tokens) {
      if (!NAME_WORD_PATTERN.test(word)) add("R-NAME-2", item.id, `\`${word}\` in \`${item.newCli}\` is not a lower-case hyphenated word.`);
    }
    const last = tokens[tokens.length - 1]!;
    if (item.group === "check") {
      if (verbs.has(last)) add("R-NAME-2", item.id, `\`${item.newCli}\` ends with a verb. In \`check\` the group word is the verb.`);
    } else if (tokens.length >= 2 && !verbs.has(last)) {
      add("R-NAME-2", item.id, `\`${item.newCli}\` does not end with a verb.`);
    }
    // R-NAME-3: one MCP rule.
    if (item.newMcp !== mcpNameForCliPath(item.newCli)) {
      add("R-NAME-3", item.id, `\`${item.newMcp}\` is not \`${item.newCli}\` with underscores.`);
    }
    // R-NAME-4: at most 26 characters.
    if (item.newMcp.length > MCP_NAME_MAX_LENGTH) {
      add("R-NAME-4", item.id, `\`${item.newMcp}\` has ${item.newMcp.length} characters. Shorten the CLI path.`);
    }
    if (item.unshortenedCli !== undefined) {
      if (mcpNameForCliPath(item.unshortenedCli).length <= MCP_NAME_MAX_LENGTH) {
        add("shortening-not-forced", item.id, `\`${item.unshortenedCli}\` fits ${MCP_NAME_MAX_LENGTH} characters, so R-NAME-4 does not force a shorter path.`);
      }
      if (!item.reason) add("missing-reason", item.id, "A shortened path needs a reason.");
    }
    if (!item.cliCommand && !item.reason) add("missing-reason", item.id, "An MCP-only name needs a reason.");
    if (item.decision !== undefined && !decisionIds.has(item.decision)) {
      add("unknown-decision", item.id, `Owner decision ${item.decision} does not exist.`);
    }
    // Shape.
    if (item.status === "planned" && (item.currentCli !== null || item.currentMcp !== null || !item.plannedBy)) {
      add("shape", item.id, "A planned entry has no current names and names its Wave.");
    }
    if (item.status === "current" && item.plannedBy !== undefined) add("shape", item.id, "A current entry names no planning Wave.");
    if (item.kind === "hand-defined-tool" && (item.currentMcp !== item.id || item.status !== "current")) {
      add("shape", item.id, "A hand-defined tool is current and its ID is its current MCP name.");
    }
    if (item.kind === "operation" && item.status === "current" && (item.currentCli === null || item.currentMcp === null)) {
      add("shape", item.id, "A current operation has a current CLI path and MCP name.");
    }
    // W33 R0 P2: the live names are the new names.
    if (item.status === "current" && (item.currentMcp !== item.newMcp || item.currentCli !== (item.cliCommand ? item.newCli : null))) {
      add("shape", item.id, "A current entry's current names are its new names.");
    }
    if (item.status === "planned" && (item.formerCli !== null || item.formerMcp !== null)) {
      add("shape", item.id, "A planned entry has no former names.");
    }
  }

  // Unique names.
  const seen = (key: (item: NameCatalogEntry) => string, rule: "duplicate-cli" | "duplicate-mcp") => {
    const owner = new Map<string, string>();
    for (const item of entries) {
      const value = key(item);
      const other = owner.get(value);
      if (other !== undefined) add(rule, item.id, `\`${value}\` is also the name of ${other}.`);
      else owner.set(value, item.id);
    }
  };
  seen((item) => item.newCli, "duplicate-cli");
  seen((item) => item.newMcp, "duplicate-mcp");
  const ids = new Map<string, number>();
  for (const item of entries) ids.set(item.id, (ids.get(item.id) ?? 0) + 1);
  for (const [id, count] of ids) if (count > 1) add("shape", id, `ID ${id} has ${count} entries.`);

  // A new name must not be another entry's old name: P3 keeps old names as aliases.
  const oldCli = new Map<string, string>();
  const oldMcp = new Map<string, string>();
  for (const item of entries) {
    if (item.formerCli) oldCli.set(item.formerCli, item.id);
    if (item.formerMcp) oldMcp.set(item.formerMcp, item.id);
    if (item.formerPlannedMcp) oldMcp.set(item.formerPlannedMcp, item.id);
  }
  for (const item of entries) {
    const cliOwner = oldCli.get(item.newCli);
    if (cliOwner !== undefined && cliOwner !== item.id) add("alias-collision", item.id, `\`${item.newCli}\` is the current path of ${cliOwner}.`);
    const mcpOwner = oldMcp.get(item.newMcp);
    if (mcpOwner !== undefined && mcpOwner !== item.id) add("alias-collision", item.id, `\`${item.newMcp}\` is the current name of ${mcpOwner}.`);
  }

  // One operation family lives in one group.
  const familyGroup = new Map<string, { group: NameGroup; id: string }>();
  for (const item of entries) {
    if (item.kind !== "operation") continue;
    const family = operationFamily(item.id);
    const first = familyGroup.get(family);
    if (first === undefined) familyGroup.set(family, { group: item.group, id: item.id });
    else if (first.group !== item.group) {
      add("family-split", item.id, `Family \`${family}\` is in \`${item.group}\` and in \`${first.group}\` (${first.id}).`);
    }
  }

  // A full command must not also start a longer command.
  for (const item of entries) {
    for (const other of entries) {
      if (other !== item && other.newCli.startsWith(`${item.newCli} `)) {
        add("prefix-collision", other.id, `\`${other.newCli}\` starts with the full command \`${item.newCli}\` of ${item.id}.`);
      }
    }
  }

  // Commands outside the registry keep their paths.
  for (const item of entries) {
    for (const command of NON_REGISTRY_COMMANDS) {
      const multiWord = command.includes(" ");
      if (item.newCli === command || (multiWord && item.newCli.startsWith(`${command} `))) {
        add("non-registry-collision", item.id, `\`${item.newCli}\` takes the place of \`make-docs ${command}\`.`);
      }
    }
  }
  return problems;
}

export interface NameCatalogSources {
  /** Every operation the registry holds. */
  registeredOperationIds: readonly string[];
  /** Current CLI path (root and path) of each registered operation. */
  currentCliByOperation: ReadonlyMap<string, string>;
  /** Current MCP name of each registered operation. */
  currentMcpByOperation: ReadonlyMap<string, string>;
  /** Names of the hand-defined MCP tools. */
  handDefinedTools: readonly string[];
  /** Whether each registered operation reads or writes. */
  mutatesByOperation: ReadonlyMap<string, "read" | "write">;
}

/** Check that the catalog and the registry and MCP tools hold the same set and current names. */
export function checkNameCatalogCoverage(
  entries: readonly NameCatalogEntry[],
  sources: NameCatalogSources,
): string[] {
  const problems: string[] = [];
  const registered = new Set(sources.registeredOperationIds);
  const tools = new Set(sources.handDefinedTools);
  const byId = new Map(entries.map((item) => [item.id, item]));
  for (const id of registered) {
    const item = byId.get(id);
    if (item === undefined) {
      problems.push(`Registry operation ${id} has no catalog entry.`);
      continue;
    }
    if (item.kind !== "operation" || item.status !== "current") problems.push(`Registry operation ${id} must be a current operation entry.`);
    const cli = sources.currentCliByOperation.get(id);
    if (item.currentCli !== cli) problems.push(`${id}: catalog current CLI \`${item.currentCli}\` differs from the registry \`${cli}\`.`);
    const mcp = sources.currentMcpByOperation.get(id);
    if (item.currentMcp !== mcp) problems.push(`${id}: catalog current MCP \`${item.currentMcp}\` differs from the server \`${mcp}\`.`);
  }
  for (const name of tools) {
    const item = byId.get(name);
    if (item === undefined || item.kind !== "hand-defined-tool") problems.push(`Hand-defined tool ${name} has no catalog entry.`);
  }
  for (const item of entries) {
    if (item.kind === "hand-defined-tool" && !tools.has(item.id)) problems.push(`Catalog tool ${item.id} is not a hand-defined MCP tool.`);
    if (item.kind === "operation" && item.status === "current" && !registered.has(item.id)) {
      problems.push(`Catalog operation ${item.id} is current but not in the registry.`);
    }
    if (item.kind === "operation" && item.status === "planned" && registered.has(item.id)) {
      problems.push(`Catalog operation ${item.id} is planned but the registry holds it. Mark it current.`);
    }
    // PRD 39 R-TOP-1: `check` holds read-only validators.
    if (item.group === "check" && sources.mutatesByOperation.get(item.id) !== "read") {
      problems.push(`Check entry ${item.id} is not a read-only registry operation.`);
    }
  }
  return problems;
}

// PRD command lists (R-NAME-5: a PRD command list and the catalog must agree).

export interface PrdCommandRow {
  id: string;
  /** CLI path after `make-docs`, without flags or arguments. */
  cli: string;
  mcp?: string;
}

/** Text from a heading to the next heading of the same or a higher level. */
export function markdownSection(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) throw new Error(`Heading not found: ${heading}`);
  const level = heading.match(/^#+/)![0].length;
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^(#+) /);
    if (match && match[1]!.length <= level) break;
    out.push(line);
  }
  return out.join("\n");
}

function stripArguments(command: string): string {
  const out: string[] = [];
  for (const word of command.trim().split(/\s+/)) {
    if (/^[[<-]/.test(word)) break;
    out.push(word);
  }
  return out.join(" ");
}

/** Rows of `| \`id\` | \`make-docs path ...\` | ...` tables, with an optional MCP column. */
export function parsePrdOperationTable(section: string): PrdCommandRow[] {
  const rows: PrdCommandRow[] = [];
  for (const line of section.split("\n")) {
    const match = line.match(/^\| `([a-z][a-z0-9.-]*)` \| `make-docs ([^`]+)` \|(?: `([a-z0-9_]+)` \|)?/);
    if (!match) continue;
    rows.push({ id: match[1]!, cli: stripArguments(match[2]!), ...(match[3] ? { mcp: match[3] } : {}) });
  }
  return rows;
}

/**
 * PRD 53 rows can list several operations in one row:
 * `| \`factory.workflow.save\`, \`.show\`, \`.list\` | \`make-docs factory workflow save \| show \| list\` |`.
 */
export function parsePrdGroupedOperationTable(section: string): PrdCommandRow[] {
  const rows: PrdCommandRow[] = [];
  for (const line of section.split("\n")) {
    const match = line.match(/^\| (`[a-z][^|]*?) \| `make-docs ((?:[^`\\]|\\\|)+)` \|/);
    if (!match) continue;
    const ids = [...match[1]!.matchAll(/`([a-z.][a-z0-9.-]*)`/g)].map((found) => found[1]!);
    const paths = match[2]!.split(/\s*\\\|\s*/).map((part) => part.trim());
    if (ids.length !== paths.length) throw new Error(`Row lists ${ids.length} operations and ${paths.length} paths: ${line}`);
    const firstId = ids[0]!;
    const firstPath = stripArguments(paths[0]!);
    ids.forEach((id, index) => {
      const fullId = id.startsWith(".") ? firstId.replace(/\.[^.]+$/, id) : id;
      const cli = index === 0 ? firstPath : firstPath.replace(/ [^ ]+$/, ` ${paths[index]}`);
      rows.push({ id: fullId, cli });
    });
  }
  return rows;
}

/** Compare a PRD list with the catalog entries it covers. */
export function comparePrdCommandList(
  listName: string,
  rows: readonly PrdCommandRow[],
  entries: readonly NameCatalogEntry[],
  covers: (item: NameCatalogEntry) => boolean,
): string[] {
  const problems: string[] = [];
  const expected = new Map(entries.filter(covers).map((item) => [item.id, item]));
  const listed = new Set<string>();
  for (const row of rows) {
    listed.add(row.id);
    const item = entries.find((candidate) => candidate.id === row.id);
    if (item === undefined) {
      problems.push(`${listName} lists ${row.id}, which the catalog does not have.`);
      continue;
    }
    if (row.cli !== item.newCli) problems.push(`${listName} gives ${row.id} the path \`${row.cli}\`; the catalog has \`${item.newCli}\`.`);
    if (row.mcp !== undefined && row.mcp !== item.newMcp) {
      problems.push(`${listName} gives ${row.id} the tool \`${row.mcp}\`; the catalog has \`${item.newMcp}\`.`);
    }
  }
  for (const id of expected.keys()) {
    if (!listed.has(id)) problems.push(`${listName} misses ${id}, which the catalog has.`);
  }
  return problems;
}

/** PRD 39 R-RUN-4: the work queue IDs, `make-docs work <verb>`, `work_<verb>`, and the factory shapes. */
export function compareRRun4(rRun4: string, entries: readonly NameCatalogEntry[]): string[] {
  const problems: string[] = [];
  const queueIds = [...rRun4.matchAll(/`(work\.queue\.[a-z-]+)`/g)].map((found) => found[1]!);
  const catalogQueue = entries.filter((item) => item.id.startsWith("work.queue.")).map((item) => item.id);
  for (const id of queueIds) if (!catalogQueue.includes(id)) problems.push(`R-RUN-4 lists ${id}, which the catalog does not have.`);
  for (const id of catalogQueue) if (!queueIds.includes(id)) problems.push(`R-RUN-4 misses ${id}, which the catalog has.`);
  if (!rRun4.includes("`make-docs work <verb>`") || !rRun4.includes("`work_<verb>`")) {
    problems.push("R-RUN-4 no longer names `make-docs work <verb>` and `work_<verb>`.");
  }
  for (const item of entries.filter((candidate) => candidate.id.startsWith("work.queue."))) {
    const verb = item.id.split(".")[2]!;
    if (item.newCli !== `work ${verb}` || item.newMcp !== `work_${verb}`) {
      problems.push(`R-RUN-4 needs ${item.id} at \`work ${verb}\` and \`work_${verb}\`; the catalog has \`${item.newCli}\`.`);
    }
  }
  if (!rRun4.includes("`make-docs factory <noun> <verb>`") || !rRun4.includes("`make-docs factory <verb>`")) {
    problems.push("R-RUN-4 no longer names the factory path shapes.");
  }
  for (const item of entries.filter((candidate) => candidate.id.startsWith("factory."))) {
    const expected = item.id.split(".").join(" ");
    if (item.newCli !== expected) problems.push(`R-RUN-4 needs ${item.id} at \`${expected}\`; the catalog has \`${item.newCli}\`.`);
  }
  for (const example of [...rRun4.matchAll(/`(factory_[a-z_]+)`/g)].map((found) => found[1]!)) {
    if (!entries.some((item) => item.newMcp === example)) problems.push(`R-RUN-4 example \`${example}\` is not a catalog MCP name.`);
  }
  return problems;
}

const SNAKE_NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const DOTTED_ID = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){1,2}$/;

/**
 * PRD 25 R-MCP-PROFILE lines: every tool name (a backticked word with an
 * underscore) is a current, new, or former catalog MCP name, and every backticked
 * operation ID is a catalog ID.
 */
export function compareMcpProfileNames(prd25: string, entries: readonly NameCatalogEntry[]): string[] {
  const problems: string[] = [];
  const names = new Set<string>();
  for (const item of entries) {
    names.add(item.newMcp);
    if (item.currentMcp) names.add(item.currentMcp);
    if (item.formerMcp) names.add(item.formerMcp);
  }
  const ids = new Set(entries.map((item) => item.id));
  const lines = prd25.split("\n").filter((line) => /^- R-MCP-PROFILE-\d+ /.test(line));
  if (lines.length === 0) problems.push("PRD 25 has no R-MCP-PROFILE lines.");
  for (const line of lines) {
    const requirement = line.match(/^- (R-MCP-PROFILE-\d+)/)![1]!;
    for (const token of [...line.matchAll(/`([^`]+)`/g)].map((found) => found[1]!)) {
      if (SNAKE_NAME.test(token) && !names.has(token)) {
        problems.push(`${requirement} names the tool \`${token}\`, which is not a current, new, or former catalog name.`);
      }
      if (DOTTED_ID.test(token) && !ids.has(token)) {
        problems.push(`${requirement} names the operation \`${token}\`, which the catalog does not have.`);
      }
    }
  }
  return problems;
}

/** PRD 51 R-BACKLOG-APP-1: the five `backlog` group paths. */
export function compareBacklogAppPaths(prd51: string, entries: readonly NameCatalogEntry[]): string[] {
  const problems: string[] = [];
  const line = prd51.split("\n").find((candidate) => candidate.startsWith("- R-BACKLOG-APP-1 "));
  if (line === undefined) return ["PRD 51 has no R-BACKLOG-APP-1 line."];
  const listed = [...line.matchAll(/`make-docs ([^`]+)`/g)].map((found) => found[1]!);
  const expected = entries.filter((item) => item.group === "backlog").map((item) => item.newCli);
  for (const cli of listed) if (!expected.includes(cli)) problems.push(`R-BACKLOG-APP-1 names \`${cli}\`, which is not a catalog \`backlog\` path.`);
  for (const cli of expected) if (!listed.includes(cli)) problems.push(`R-BACKLOG-APP-1 misses \`${cli}\`.`);
  return problems;
}

/**
 * PRD 39 R-RUN-1: "active `run <prefix>` commands for `a`, `b`, and `c`" and
 * "planned `<prefix>` commands for ...". Active paths must equal the former
 * `run` paths, which W33 R0 P3 keeps as migration aliases. Planned paths must
 * equal the new paths of planned `run`-tree operations (the work queue and
 * the factory).
 */
export function parseRRun1(rRun1: string): { active: string[]; planned: string[] } {
  const start = rRun1.indexOf("It contains ");
  if (start < 0) throw new Error("R-RUN-1 has no `It contains` list.");
  const body = rRun1.slice(start + "It contains ".length);
  const active: string[] = [];
  const planned: string[] = [];
  for (const chunk of body.split(/(?=\b(?:active|planned) `)/)) {
    const match = chunk.match(/^(active|planned) `([^`]+)`/);
    if (!match) continue;
    const target = match[1] === "active" ? active : planned;
    const prefix = match[2]!;
    const forAt = chunk.indexOf(" commands for ");
    if (forAt < 0) {
      target.push(prefix);
      continue;
    }
    for (const item of [...chunk.slice(forAt).matchAll(/`([^`]+)`/g)].map((found) => found[1]!)) {
      target.push(`${prefix} ${item}`);
    }
  }
  return { active, planned };
}

export function compareRRun1(rRun1: string, entries: readonly NameCatalogEntry[]): string[] {
  const problems: string[] = [];
  const { active, planned } = parseRRun1(rRun1);
  const currentRun = entries.filter((item) => item.formerCli?.startsWith("run ")).map((item) => item.formerCli!);
  const plannedRun = entries
    .filter((item) => item.status === "planned" && (item.group === "work" || item.group === "factory"))
    .map((item) => item.newCli);
  for (const cli of active) if (!currentRun.includes(cli)) problems.push(`R-RUN-1 lists active \`${cli}\`, which the registry does not have.`);
  for (const cli of currentRun) if (!active.includes(cli)) problems.push(`R-RUN-1 misses active \`${cli}\`.`);
  for (const cli of planned) if (!plannedRun.includes(cli)) problems.push(`R-RUN-1 lists planned \`${cli}\`, which the catalog does not plan.`);
  for (const cli of plannedRun) if (!planned.includes(cli)) problems.push(`R-RUN-1 misses planned \`${cli}\`.`);
  return problems;
}
