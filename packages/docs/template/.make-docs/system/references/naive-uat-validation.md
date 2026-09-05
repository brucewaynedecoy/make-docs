# Unassisted Goal Testing Typed Validation

## Scope

Use the workflow in `make-docs://system/reference/naive-uat-workflow.md` first. These read-only helpers check record structure, current file digests, and links. They do not certify executor qualification, human judgment, acceptance, or a support claim. An output with `valid: true` means only that the submitted record passed these checks. `qualification_verified` and `independently_verified` are false. A recorded human conclusion remains the assessor's conclusion.

## CLI And MCP

The stable paths are:

- `make-docs run uat persona resolve`
- `make-docs run uat scenario validate`
- `make-docs run uat target validate`
- `make-docs run uat evidence-reference validate`
- `make-docs run uat finding validate`
- `make-docs run uat result validate`

Each accepts `--payload-json <file-or-inline-JSON>` and `--json`. The payload is the same object as the derived MCP tool input. The Persona helper also accepts `--target-root <project>` and `--persona <configured-slug>`. Other helpers use the payload. All payloads can include `targetRoot` and `persona`. Omit `persona` to use canonical `user`. The MCP names replace punctuation in each stable operation ID with underscores and add `make_docs_`.

## Reference Fields

A file reference has `path` and `sha256`. Use a current SHA-256 digest of the complete file. Paths use project-relative forward slashes. Evidence and artifact references stay under `docs/assets/<selected-slug>/testing/`. Source scenario and current gate authority references name files under `docs/prd/`. Links, traversal, missing files, changed digests, and Persona frontmatter drift fail closed. No helper moves or rewrites an artifact.

Large external capture can remain external. Retain its consent, retention, redaction, and capture reference in a Persona-scoped metadata file. Pass that file's reference to the helper. The helper does not fetch or certify external capture.

## Payloads

| Operation | Required payload fields |
| --- | --- |
| Persona | No required fields; optional `artifact` file reference checks applicable Persona frontmatter |
| Scenario | `source` file reference and `scenario` typed record |
| Target | `target` record |
| Evidence reference | `evidence` file reference |
| Finding | `record` file reference and `finding` record |
| Result | `record` file reference, `decision`, and `result`; activated results also require `run` |

The decision body uses `testing_type`, `decision_informed`, `reason_now`, `product_maturity`, `scope`, `executor`, `gate_effect`, `effort_budget`, `stop_condition`, `evidence_retained`, and `rerun_trigger`. This is body data, not required frontmatter. `gate_effect` defaults to `advisory`.

The scenario uses the fields in the governing scenario template. Typed names are `selected_persona`, `scenario_id`, `scenario_version`, `title`, `user_goal`, `source_requirements`, `target_user`, `current_uncertainty`, `supported_scope`, `build_identity`, `environment`, `starting_state`, `public_resources`, `prohibited_context`, `tester_prompt`, `operator_success_outcomes`, `setup`, `teardown`, `evidence_requirements`, `severity_rules`, `finding_route`, and `decision`. List fields use arrays. Version is a positive integer.

`tester_packet` contains only `situation`, `goal`, `starting_state`, `public_resources`, `safety_limits`, `consent_notice`, and `tester_teardown`. `packet_review` records `reviewer`, an `evidence` file reference, and the recorded `no_hidden_guidance: true` judgment. The helper checks structural separation and direct leaks. It cannot judge all forms of coaching.

A target has `build_identity`, `environment`, `supported_scope`, `target_user`, `normally_consumable_form`, `audience_consumption_evidence`, `qualification`, `consent`, `capture`, and `readiness`.

Qualification records `executor`, `kind` (`human` or `agent`), `separate_context`, `assessed_by`, `assessment`, and `isolation_evidence` file references. The recorded access judgments are `no_private_knowledge`, `no_repository_access`, `no_private_memory`, `no_implementation_conversation`, `no_coaching`, and `public_information_only`. Each must be true before an activated target qualifies for record validation. The assessor must differ from the executor. Supporting evidence must exist and match its digest. These checks do not replace an assessor's inspection of the actual access limits.

A finding has `finding_id`, `run_id`, `scenario_id`, `scenario_version`, `observed_behavior`, `expected_human_outcome`, `severity`, `reproducibility`, `supported_scope`, `source_requirement`, `owner`, `disposition`, `disposition_authority`, and `evidence`. Severity uses the contract's four values. The last two evidence fields use file references. The disposition authority body must contain a JSON record with the exact `finding_id`, `owner`, and `disposition`. An isolation note or another unrelated record cannot prove a disposition. Owning requirement and work links do not become evidence destinations.

A run has `run_id`, `scenario_ref` (file reference plus `scenario_id` and `scenario_version`), `selected_persona`, `persona_primitive`, `persona_resolution`, `work_coordinate`, `product_build`, `environment`, `support_scope`, `target_user`, `qualification`, `public_resources_used`, `interventions`, `observations`, `reproduction`, `evidence_refs`, `findings`, `cleanup_state`, `review`, and `validity`. Each intervention records `description`, `material_coaching`, and `assessed_by`. Validity records `private_knowledge`, `broken_setup`, `lost_evidence`, and `assessed_by`. A material validity failure cannot be recorded as a valid conclusion.

## Canonical Bodies And Existing Markdown

The canonical scenario stays in its owning active PRD. The helper accepts its existing Markdown field table and tester-packet bullets. Pass a typed transcription as `scenario`; the helper compares it with that source. Use the current table field names. List cells use semicolon-separated values. The combined Product Build And Environment cell must equal the complete supplied build identity, a semicolon and space, and the complete supplied environment. Substrings do not prove source equality. Separate Build Identity and Environment rows remain supported. The testing decision table precedes the scenario. The Current Uncertainty row supplies the bounded question.

A PRD can instead contain the typed scenario as a JSON body record. This is optional. It does not create another canonical location. For a Markdown scenario, a result payload includes the same typed transcription as `run.scenario`, which is checked against the source again. Existing historical records remain readable. These helpers do not require a bulk conversion or relabel an earlier walkthrough.

Finding and result helpers compare submitted typed records with a JSON body record in the referenced Persona artifact. A JSON fenced block or a JSON file is supported. The result body contains `decision`, `result`, and any `run`, `gate_authority`, or `future_obligation`; it excludes transport roots and the artifact's own file reference. This optional typed helper format does not replace manual workflow records.

## Results And Gates

The result is preserved. The helper never upgrades evidence to `clear`, closes findings, or rewrites a result after a waiver, obligation, timebox, or later run. A `clear` result with findings returns `valid: false` and `validation_status: unverified`; it retains the recorded result and all finding/disposition references for review. Free-text disposition labels do not prove accepted closure. The helper adds no status vocabulary and does not infer resolution from text such as open, unresolved, closed, or accepted risk. `not-needed-now` has no run and uses executor `none`. For an activated run, the decision executor must equal the recorded qualification executor, and the decision scope must equal the run support scope.

Blocking requires `gate_authority`: a current PRD file reference plus `result`, `outcome`, and `gate_effect`. The authority body records those exact three fields. Its outcome must match `decision_informed`; its result and effect must match the submitted result and decision. A matching typed record is evidence of the recorded authority, not proof of owner acceptance by the helper.

Only an accepted future outcome uses `future_obligation`: `id` (`O-###`), `owner`, `trigger`, `target`, `exit_criteria`, `reason`, and `accepted_authority` reference. The cited acceptance body must contain the exact obligation `id`, `owner`, `trigger`, `target`, `exit_criteria`, and `reason` as a JSON body record. A matching file digest alone does not prove this link. No helper creates an obligation or a Store row. Use the existing lifecycle operations for lifecycle state and bounded evidence receipts. Repository records remain authoritative.
