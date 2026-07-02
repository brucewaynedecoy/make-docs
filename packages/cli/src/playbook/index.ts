/**
 * Playbook core library: the single Playbook model, the staged parser, the
 * layered validator, and the shared diagnostic catalog (W18 R6, PRD 34).
 *
 * Pure and modular per R-MODEL-1 — source in, model plus diagnostics out —
 * with no presentation or filesystem effects. The `playbook.validate` and
 * `playbook.catalog` operations (Phase 4), the runner, and a future language
 * server all wrap this library so their diagnostics never diverge
 * (R-MODEL-6); `parseAndValidatePlaybook` is the canonical entry point.
 */

export * from "./source-span";
export * from "./diagnostics";
export * from "./model";
export * from "./detection";
export {
  parsePlaybook,
  type ParsePlaybookInput,
  type ParsePlaybookResult,
} from "./parser/parse-playbook";
export * from "./validator";
