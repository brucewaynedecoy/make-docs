/**
 * The layered Playbook validator (R-MODEL-4, R-AUTH-3).
 *
 * Validation is layered so diagnostics are specific — structural, registry,
 * workflow (with the orchestration policy shape), cross-reference integrity,
 * and consistency — and every layer reports independently: a registry error
 * never suppresses workflow diagnostics. The validator is this contract's
 * executable enforcement and enforces exactly the rules the Playbook contract
 * at `.make-docs/contracts/system/playbook-contract.md` states, in strict
 * parity with it. Like the parser, it is pure: it operates on the parsed
 * Playbook model and touches neither the filesystem nor presentation.
 *
 * `parseAndValidatePlaybook` is the canonical entry point — the complete
 * parse-plus-validate picture the `playbook.validate` operation and a future
 * language server wrap (R-MODEL-6). `validatePlaybook` runs the semantic
 * layers over an already-parsed model and returns only the validation-layer
 * diagnostics; the parse-stage diagnostics (heading spine, frontmatter
 * schema, table schema, block shape, reference resolution, file naming) sit
 * in the parse result the caller already holds.
 */

import { derivePlaybookRunnable, type PlaybookDiagnostic } from "../diagnostics";
import type { PlaybookModel } from "../model";
import {
  parsePlaybook,
  type ParsePlaybookInput,
  type ParsePlaybookResult,
} from "../parser/parse-playbook";
import { validateConsistencyLayer } from "./consistency";
import { validateCrossReferenceLayer } from "./cross-reference";
import { validateOrchestrationPolicyLayer } from "./orchestration-policy";
import { validateRegistryLayer } from "./registry";
import { validateStructuralLayer } from "./structural";
import { validateWorkflowLayer } from "./workflow";

/**
 * Runs the semantic validation layers over a parsed Playbook model and
 * returns their diagnostics. Layers report independently; no layer's errors
 * suppress another layer's diagnostics.
 */
export function validatePlaybook(model: PlaybookModel): PlaybookDiagnostic[] {
  const diagnostics: PlaybookDiagnostic[] = [];
  validateStructuralLayer(model, diagnostics);
  validateRegistryLayer(model, diagnostics);
  validateWorkflowLayer(model, diagnostics);
  validateOrchestrationPolicyLayer(model, diagnostics);
  validateCrossReferenceLayer(model, diagnostics);
  validateConsistencyLayer(model, diagnostics);
  return diagnostics;
}

/**
 * Parses and validates a Playbook in one pass: the staged parser produces the
 * model and its parse diagnostics, the layered validator appends the semantic
 * diagnostics, and `runnable` is re-derived over the combined set — the model
 * stays fail-soft for diagnostics and fail-closed for execution (R-MODEL-3).
 */
export function parseAndValidatePlaybook(input: ParsePlaybookInput): ParsePlaybookResult {
  const { model, diagnostics } = parsePlaybook(input);
  diagnostics.push(...validatePlaybook(model));
  model.runnable = derivePlaybookRunnable(diagnostics);
  return { model, diagnostics };
}
