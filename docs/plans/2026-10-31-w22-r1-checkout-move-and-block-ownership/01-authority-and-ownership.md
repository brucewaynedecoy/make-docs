---
title: "Authority and Ownership"
kind: "plan"
status: "draft"
coordinate: "W22 R1 P1"
---

# Authority and Ownership

## Purpose

Repair the move verifier while preserving the existing ownership contract. See the [overview](00-overview.md) for scope and authorization.

## Planned Rule Changes

1. Maintain a shared ownership classifier for move checks. Read the saved ownership class and provenance. Directory membership and an old operation path do not prove ownership.
2. For a current `managed-block` entry, require one ordered begin/end marker pair. Hash only the parsed block body. Preserve the prefix and suffix byte for byte.
3. For a fully owned file, retain the recorded full-file check. Keep exact path, file-kind, and safe-parent checks.
4. Treat missing, repeated, reversed, or malformed markers as a block-specific conflict. Do not silently adopt an edited or unknown block.
5. Separate durable ownership evidence from transient full-file snapshots. Exact snapshots can still guard a reviewed write or pending recovery. They must not reject ordinary user edits outside a block when locating a moved install.
6. Do not carry every historical applied operation path into permanent ownership evidence. Resolve current ownership from the valid ledger and retained recovery obligations.
7. Validate config structure and the project ID. Do not turn comments or unrelated desired settings into a permanent whole-config checksum requirement for a move.

## Existing Record Compatibility

Version 2.0.5 stores whole-file data in checkout verification evidence. A change to the digest algorithm alone will not repair those records.

Add an evidence-version 2 reader and writer inside the existing `verification_json` field. Keep the version 1 reader for 2.0.5 records. Do not change the database schema for this slice. An unknown evidence version stops the move. The read-only preview can describe a safe transition, but it cannot replace the old record.

For a version 1 record, first validate the saved ledger and its project ID. Verify that its digest matches the prior verification record. Read each saved ownership class and provenance. Compare the target's strictly parsed block body with that entry's saved block hash. Compare fully owned files with their saved full-file facts. Exclude project-owned prefix/suffix bytes from durable ownership proof. Build evidence version 2 only from these independently verified facts. The apply transaction may save it together with the path update. Keep the ledger and its ownership claims unchanged.

Current file bytes, an absent old path, a matching config ID, and a user approval cannot replace missing saved ownership proof. If a legacy record has only an aggregate whole-file digest and no usable per-block or trusted adoption facts, report the exact limit and stop the move. Do not recast the current files as the expected baseline. Pending recovery remains separate and retains its exact saved full-file snapshots.

Do not reset verification data to the current files merely to make the check pass. Do not use a user approval as proof that an unknown block was installed by Make Docs. Keep authentic schema-1 whole-file router adoption separate. That legacy transition still needs its exact trusted whole-file evidence before current managed-block rules can apply.

Register this bounded evidence transition under PRD 18 before implementation. Its first writer is 2.0.6. Its owner is the checkout move service under PRD 38. New writes use evidence version 2 only. Preserve version 1 data until a reviewed apply proves and replaces that selected record. Keep the old reader; removing it is outside W22 R1 and needs a separate compatibility decision. Do not use this transition to run a broad Store migration, cleanup, or adoption operation.

## Source Touchpoints

| Area | Expected owner | Work |
| --- | --- | --- |
| Durable move evidence | `packages/cli/src/store/installation-state.ts`: `managedContentDigest`, `checkoutVerificationEvidence`, `bindCheckout` | Make evidence ownership-scoped and version-aware. |
| Managed block parsing | `packages/cli/src/managed-block.ts`: `parseManagedBlock` | Reuse strict parsing; avoid a second parser with different marker rules. |
| Saved install data | `packages/cli/src/manifest.ts`: `loadManifest` and ownership validation | Read current ownership and provenance without creating a binding. |
| Declarative identity | `packages/cli/src/store/project-identity.ts` and config readers | Keep project identity separate from checkout and file text. |

Confirm exact signatures before implementation. The code review found these owners; it did not establish a final patch.

## PRD and Coverage Work

Update only the sections assigned in the [candidate matrix](00-overview.md#candidate-decision-matrix). PRD 15 remains the owner for block-only rules. PRD 38 owns move evidence and stable identity. PRD 18 owns safe legacy transitions. PRD 24 owns config facts. Add history only for material contract replacements.

Read the deterministic/agentic guidance before implementation. Shared deterministic operations must enforce the same ownership rules for CLI and MCP callers. Agent instructions cannot waive an operation-core check.

## Acceptance

- Root files with unchanged blocks and changed user text pass move ownership proof.
- Changed or invalid blocks remain visible as conflicts.
- Fully owned files still use full-file proof.
- A valid old record can move through saved per-block and fully owned-file proof, with no blind digest refresh.
- Missing, mismatched, or unknown saved proof cannot be replaced by current file bytes or approval.
- Evidence version 2 fits the existing JSON field; no broad Store migration is required.
- Pending recovery retains its exact protected snapshots.
- No live project or Store is needed to test these rules.
