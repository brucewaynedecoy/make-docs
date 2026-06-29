# P4 Workflow Bundles and Support Validation

## Goal

Add workflow bundle metadata and validation gates for package inclusion, Run Playbook boundaries, and support claims.

## Tasks

- [x] Add bundle metadata for Idea/Brainstorm, Scaffold, Change Request/Iterate, and Use/Run candidates before implementation surfaces become public.
- [x] Require every bundle to declare audience and exposure boundary: maintainer-only, non-maintainer request-capture, non-maintainer guided-change, or end-user run-stack usage.
- [x] Require bundle metadata to distinguish request capture from authorized mutation where applicable.
- [x] Ensure Use/Run can invoke generic Run Playbook without redefining playbook storage or making plugins mandatory.
- [x] Add package validation that proves plugin payloads/manifests are included, excluded, or intentionally deferred.
- [x] Keep conformance-lab records and generated local run artifacts out of shipped package/template paths by default.
- [x] Add conformance scenario candidates for plugin, bundle, playbook, harness, model/provider, and runtime support claims.
- [x] Update public wording to remain provisional until implementation or conformance evidence exists for the exact tuple claimed.

## Acceptance Criteria

- Workflow bundles share plugin substrate behavior rather than defining their own storage, manifest, audit, backup, uninstall, config, or support-claim rules.
- Non-maintainer entrypoints have explicit gates.
- Package and smoke validation prove the intended plugin asset boundary.
- Support language cites evidence or remains provisional.

## Validation Notes

Run the package validation chain when implementation touches shipped plugin payloads, plugin manifests, native exposure files, generated adapters, bundle metadata defaults, or public support wording.

Validation completed:

- `npm test -w packages/cli -- --run tests/workflow-bundles.test.ts tests/plugin-substrate.test.ts tests/plugin-lifecycle.test.ts --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`
- `git diff --check`

Manual UAT was deferred during phase execution. The final wave-level coverage decision is recorded in [2026-06-29-w18-r2-wave-closeout-and-manual-test-coverage.md](../../assets/archive/history/2026-06-29-w18-r2-wave-closeout-and-manual-test-coverage.md).
