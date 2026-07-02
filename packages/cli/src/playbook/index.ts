/**
 * Playbook core library: the single Playbook model, the staged parser, and
 * the diagnostic catalog (W18 R6, PRD 34).
 *
 * Pure and modular per R-MODEL-1 — source in, model plus diagnostics out —
 * with no presentation or filesystem effects. The `playbook.validate` and
 * `playbook.catalog` operations (Phase 4), the layered validator (Phase 3),
 * the runner, and a future language server all wrap this library.
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
