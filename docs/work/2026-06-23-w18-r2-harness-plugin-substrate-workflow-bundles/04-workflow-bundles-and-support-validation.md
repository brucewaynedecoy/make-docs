# P4 Workflow Bundles and Support Validation

## Goal

Add workflow bundle metadata and validation gates for package inclusion, Run Playbook boundaries, and support claims.

## Tasks

- [ ] Add bundle metadata for Idea/Brainstorm, Scaffold, Change Request/Iterate, and Use/Run candidates before implementation surfaces become public.
- [ ] Require every bundle to declare audience and exposure boundary: maintainer-only, non-maintainer request-capture, non-maintainer guided-change, or end-user run-stack usage.
- [ ] Require bundle metadata to distinguish request capture from authorized mutation where applicable.
- [ ] Ensure Use/Run can invoke generic Run Playbook without redefining playbook storage or making plugins mandatory.
- [ ] Add package validation that proves plugin payloads/manifests are included, excluded, or intentionally deferred.
- [ ] Keep conformance-lab records and generated local run artifacts out of shipped package/template paths by default.
- [ ] Add conformance scenario candidates for plugin, bundle, playbook, harness, model/provider, and runtime support claims.
- [ ] Update public wording to remain provisional until implementation or conformance evidence exists for the exact tuple claimed.

## Acceptance Criteria

- Workflow bundles share plugin substrate behavior rather than defining their own storage, manifest, audit, backup, uninstall, config, or support-claim rules.
- Non-maintainer entrypoints have explicit gates.
- Package and smoke validation prove the intended plugin asset boundary.
- Support language cites evidence or remains provisional.

## Validation Notes

Run the package validation chain when implementation touches shipped plugin payloads, plugin manifests, native exposure files, generated adapters, bundle metadata defaults, or public support wording.
