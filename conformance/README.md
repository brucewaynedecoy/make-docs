# Conformance Assets

This directory holds the current Make Docs support registry and the maintainer lab history.

The active registry uses version 2. It has six exact entries. Two entries have qualifying support evidence. Setup must keep every other native method unavailable.

The four old packaging scenarios are retired. Their sources and fixtures remain as history. The exact version 1 registry remains at `conformance/history/w19-r1-p8-tuple-registry.json`. Old package results cannot prove current setup or harness access.

## Active Support Registry

`conformance/tuple-registry.json` is the only authoring source for current support status. The controlled package build copies only this file to `conformance/tuple-registry.json` in the npm package. Installed setup loads that packaged copy from the package location. It does not use the working directory.

The package must not contain scenario files, result files, transcripts, fixtures, or maintainer tools. The template must not contain any conformance asset.

The package build validates the copied registry. It also checks that its SHA-256 digest matches the repo-root source.

## Version 2 Tuple

Each active tuple has these seven fields:

- `scenario`
- `harness`
- `connectionMethod`
- `surface`
- `scope`
- `modelOrProvider`
- `runtime`

Every value must be non-empty. Active tuples do not permit `null`, `*`, `any`, `auto`, or other wildcard values.

The current scenario families are:

- `setup-access/mcp-store-operations`
- `setup-access/bounded-rule-store-operations`
- `setup-access/permission-rule-store-operations`
- `setup-access/direct-resource-read`

`direct-cli` is valid only for `setup-access/direct-resource-read`. It proves Store-free resource access. It is not a Store-access setup method.

## Registry Shape

The registry is one JSON document.

- `record` is `make-docs.conformance.tuple-registry`.
- `schemaVersion` is `2`.
- `statuses` carries the three fixed status meanings.
- `verdictDerivation` carries the fixed status rules.
- `tuples` has one entry for each exact tuple.

Each tuple entry has an id, the full tuple, its derived status, evidence references, recorded results, planned scenarios, and notes.

Each recorded result repeats the full tuple. It also records these facts:

- Make Docs version
- executable digest
- behavior digest
- distribution type
- harness version
- native-config digest
- run date
- result reference
- evidence references

The loader rejects duplicate tuples. It also rejects a status that does not match the recorded evidence.

## Status Rules

Statuses are derived. A maintainer must not edit a status by hand.

- `provisional` means there is no qualifying proof.
- `implementation-validated` means only internal file and structure tests passed.
- `conformance-validated` means a qualifying real-harness result passed install, discover, invoke, and uninstall.

`blocked`, `unsupported`, and `inconsistent` results never promote a tuple. A `pass-with-caveats` result promotes only when the result surfaces its caveats.

One internal test cannot prove harness support. One native file cannot prove harness recognition. One detected harness cannot prove support.

## Setup-Access Lab

The maintainer-only setup-access mode creates one disposable first-run session. It accepts an exact scenario, harness, method, model or provider, runtime, harness version, packed product, and new session root.

Bootstrap creates only a provisional tuple in the session. It installs the packed product in the session. It uses the production native planner, writer, verifier, project operation, and receipt path. It does not write a result. It does not change support status.

The bootstrap rejects the real home, the repository, repository parents and children, and any non-empty target. The session root must be under a directory named `make-docs-conformance-lab`.

After the harness session, ingestion validates the measured result. The write mode requires a reviewed result. It then writes the result and updates the repo-root registry through the normal recording seam. Preview mode writes neither file.

See [operator-modes.md](operator-modes.md) for commands and evidence steps.

## Version 2 Results

Current setup-access result records use `conformance.result.v2`. Each result contains the complete seven-part tuple and the exact product and harness facts.

The normal ingestion seam derives the result from measured fields. Missing measurements produce `blocked`. Failed measurements produce `unsupported`. A passing result can promote only after maintainer review.

Version 1 package evidence is readable only through the historical loader. It cannot enter the active version 2 registry.

## Support-Claim Governance

<!-- support-claim-state: conformance-validated=2/6 -->

A public claim states only what a `conformance-validated` tuple proves. Until a tuple has that status and a reviewed qualifying record, setup must describe the method as unavailable. Any public claim must keep all recorded caveats and exact tuple limits.

The current registry supports two exact Claude Code tuples. Claude Code MCP passed Store read, Store write, denied-access, and cleanup proof. Claude Code direct CLI passed Store-free resource proof. Claude Code permission rules remain unavailable under the A35 exception because narrow sandbox Store access did not pass. The three Codex tuples remain unavailable because the disposable Codex home was not logged in.

Normal setup does not yet have an accepted source for the exact harness version, model or provider, and runtime facts. It must not use a wildcard. It can therefore keep a proved tuple unavailable until that production identity gap is resolved.

## Evidence Storage

Raw transcripts and scratch evidence stay in the disposable lab session. They do not live in repo-local `.make-docs/`.

Reviewed compact result records can be added under `conformance/results/<harness>/`. The registry remains the only queryable support-status source.

The three test layers stay separate:

- Unit tests validate pure contracts and functions.
- Integration tests validate CLI, MCP, Store, setup, and native-file behavior.
- Conformance sessions validate the real harness outcome for one exact tuple.

A passing lower layer cannot replace a missing conformance result.
