# Human Experience Reference

## Start with the Human Goal

The [Human Experience Contract](../contracts/human-experience-contract.md) owns the rules and exact forms. This reference explains them. Read it by `make-docs://system/reference/human-experience.md` when no valid local copy exists.

Start with a concrete task. “An operator can identify a failed import and safely retry only the failed rows” gives a design direction. “Expose import state records” describes machinery but leaves the human task unclear.

Ask what changes for the people who use, read, operate, maintain, review, recover, or rely on the result. A Persona supplies the audience; the local intent supplies the goal. A clear role such as “on-call operator” is enough when no configured Persona fits.

## Examples and Counterexamples

These examples are interpretation aids, not extra policy or finished evidence.

| Change | Impact and useful promise | Weak result and proof that can reveal it |
| --- | --- | --- |
| Command output | `direct`: An operator can identify the project, result, and next safe action. Exact run IDs remain available in detail output. | A wall of IDs can be correct but leave the operator lost. Inspect the installed success, partial, and failure output; compare human and machine meaning. |
| Document or report | `direct`: A reader can find the decision, owner, source, and open limit without reading the full report. | A valid heading list can still bury the decision. Review the actual rendered document and follow its source links. |
| Public API or SDK | `direct`: An integrator can understand a failed call and recover without guessing state. | An unexplained error code exposes the model but not the action. Exercise the public error and retry path and inspect its documentation. |
| File tree | `direct`: A maintainer can tell which files are project content, generated copies, and source authority. | Three identical file names with no ownership clues invite edits to the wrong copy. Inspect the actual tree and instructions together. |
| Reliability repair | `indirect`: A queued task survives a restart without duplicate work. Normal controls stay the same. | “No UI change” misses the person's lost work. Use restart and duplicate-prevention evidence tied to that risk. |
| Recovery workflow | `direct`: An operator sees what will change, what remains safe, and where to resume. | A generic “done” after partial recovery hides state. Inspect interruption, partial result, and resume evidence. |
| Internal refactor | `none`: Existing output, operating steps, errors, timing bounds, and resource behavior remain within the same accepted boundary. | “Internal only” is not proof. Use focused compatibility evidence for the claimed unchanged boundaries. |
| Agent-only integration | Often `direct` or `indirect`: The maintainer can review decisions or recover the agent's actions. | Selecting `none` only because the first caller is an agent ignores the people who rely on it. Review the claimed effect; a structure check cannot decide it. |

## A Full Intent Example

For a command-result change, a completed design section can read:

```markdown
## Human Experience Intent

Impact: `direct`

Affected humans: Operators who retry failed imports.

Human goal or effect: Identify failed rows and retry them without repeating successful work.

Experience promises:

- Show the import name and distinct complete, partial, or failed state.
- Name the safe next action and retain the last useful context.
- Keep full row IDs available through the documented detail output.

Complexity kept out of the human path:

- Internal state keys and receipt layout are not needed to choose a retry.

Evidence required:

- Inspect installed output for complete, partial, and failed imports.
- Compare the visible counts and status with machine output.
- Exercise retry and confirm successful rows are preserved.
```

For indirect work, use the same fields with `Impact: indirect`. Tie each promise to a material human effect, such as avoiding lost work or reducing a known wait. Do not invent a new interface just to fill the form.

## A Short None Example

```markdown
## Human Experience Intent

Impact: `none`

Reason: This private helper split preserves behavior and its accepted operating bounds.

Preserved experience: Public output, errors, operating steps, and resource limits remain unchanged.

Evidence required:

- Compare public results and errors before and after the split.
- Check the same operating and resource limits with the focused regression cases.
```

A statement that a private helper has no effect is a claim to review. If the split changes latency, recovery, or maintenance effort, reconsider the impact. A complete short form does not settle that question.

## Missing Product Choice

Suppose a request says “simplify account recovery,” but current authority does not say who may restore access or which proof is needed. The author can identify the affected people and current failure. It cannot invent the recovery permission rule. Stop with that one product choice, its proposed result, and the effects of the real alternatives. Do not fill the intent with invented promises.

## Review the Actual Result

Use each accepted promise as a question about evidence. Can the reader identify the subject and its relationships? Does the result preserve context? Are waiting, partial, failure, and success distinct? Is the next action useful? Can a person recover and stay in control? Is exact detail discoverable when needed?

Use human names before internal IDs, but keep material facts visible. For example, a project name plus “3 rows failed; review the failed rows before retry” helps a decision. A short “success” message that hides those failures breaks meaning even if a JSON record remains exact elsewhere.

Reuse a suitable screenshot, document, command transcript, fixture, or functional result. Record the promise, evidence, observation, conclusion, reviewer, and limit. If evidence is insufficient, use current testing authority to select the smallest useful next activity. Do not create a second run just to call it Human Experience Review.

An agent review can show that structure, wording, and evidence agree. It cannot prove a person's lived ease, confidence, or joy. Keep that limit visible in completion claims.
