# Scenario and Result Contract

## Purpose

Define the lab evidence model that can support harness/model claims without committing raw provider logs by default.

## Requirements

- Scenario specs define behavior, expected evidence, safety mode, and versioned scenario identity without assuming a model provider.
- Result records capture harness, model name, provider or routing layer when known, model version or immutable id when available, make-docs version, runtime distribution, scenario id/version, run date, produced files, relevant diffs, exit status, transcript/log pointer, normalized verdict, reason, caveats, and reviewer status.
- Verdicts are `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`.
- Safety modes are read-only, dry-run, temp-fixture apply, destructive temp-fixture apply, and external-provider run.
- Raw transcripts, provider logs, and temporary workspaces default to local generated storage, not source control.

## Acceptance Criteria

- Scenario and result schemas are small enough to review.
- Blocked runs cannot be presented as evidence.
- Redacted evidence bundles are opt-in and tied to stronger or disputed claims.
