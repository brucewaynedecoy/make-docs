---
title: "Make Docs 2.0.6 Release Preparation"
kind: "plan"
status: "draft"
coordinate: "W22 R1 P4"
---

# Make Docs 2.0.6 Release Preparation

## Purpose

Prepare a 2.0.6 release candidate after the repair and development proof pass. The final versioned artifact proof runs in this phase, after the bump. This phase is planned only. Package files remain at their current versions during this planning task.

## Version and Package Scope

Bump the publishable CLI package at `packages/cli/package.json` from `2.0.5` to `2.0.6`. Update the CLI workspace version entries in `package-lock.json` through the repo's supported package process. Keep the private root package version at `0.0.0`. Do not change unrelated dependencies.

Check the source for stale current-release examples and generated package metadata. Change only text that claims the current version. Keep historical 2.0.5 records intact. Rebuild generated artifacts through their owning scripts.

The prepack step copies the upstream template from `packages/docs/template/` and builds the CLI. Author changed reusable system guidance upstream first. The maintainer repo's installed resource copies are downstream. Do not hand-edit them as the source of a product fix.

## Release Documentation

Write a scoped release note at `docs/assets/project/YYYY-MM-DD-v2.0.6-release-notes.md` during this future phase. Use the actual writing date. Do not backdate it to the plan date. Follow the established [2.0.5 release note](../../assets/project/2026-10-24-v2.0.5-release-notes.md). Explain:

- Setup now detects and reviews a moved checkout before fresh-install selection.
- Move checks preserve user text outside valid Make Docs blocks.
- Existing project IDs, checkout IDs, install records, and history are retained.
- Changed blocks, ambiguous paths, active work, and unsafe paths still need a safe review.
- Root and kit installs need separate explicit targets.
- The exact tested scope and any remaining platform or package limits.

Keep earlier release caveats unless fresh proof closes their exact scope. Do not claim broader speed, scale, platform, Copilot-client, or end-user proof from this repair.

Use the current [release runbook](../../../RELEASING.md). Update [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), that runbook, and the [maintainer release guide](../../assets/maintainer/release-packaging-validation-and-release-reference.md) only where the package proof or release steps change. Link the new evidence from the scoped work record. Close the drift entry only after its required tests and installed proof pass.

## Candidate Proof

First apply the planned version bump. Then run the required source and full CLI checks against that final tree. Record the reviewed source commit and tree state, package and lock versions, packed package identity, and tarball SHA-256 digest. Build one final 2.0.6 tarball after those checks. A development candidate that still reports 2.0.5 cannot satisfy this step.

Install that exact artifact in clean temporary homes with explicit disposable Stores and the source repository unavailable. Verify both package metadata and `make-docs --version` report 2.0.6. Run the authentic 2.0.5-to-2.0.6 moved-checkout fixture and the existing PRD 10 candidate matrix. Use that same digest for the required real-host Windows, macOS, and Linux proof and the complete `npm run smoke:pack` path. Record what ran and what remained blocked. A later artifact rebuild or relevant tree change invalidates the artifact-bound results.

Inspect `.github/workflows/publish-npm.yml` and `.github/workflows/platform-safety.yml` before a release decision. Check the tarball contents, template projection, command/tool projection, no-scripts behavior, and existing package safety rules. Record the artifact identity so the approved publish uses the tested package.

## Security and Prior Limits

Review the exact candidate, license, package contents, dependency changes, automated results, and open GitHub security alerts under `RELEASING.md`. Resolve or explicitly assess high-severity findings before a release recommendation. Record the finding scope, decision, and evidence. This review does not authorize broad dependency upgrades or an unrelated security project.

Carry forward the 2.0.5 release limits, including any unproved platform/client cases and existing bounded performance waivers. Only fresh evidence for the exact old limitation can close it. The rename repair does not close Copilot-client coverage or speed/scale claims.


## Publication Path and Approval

The current `.github/workflows/publish-npm.yml` starts when a GitHub release is published. Before using it, recheck the workflow against the approved candidate. It requires the release tag `v2.0.6` to match the CLI package version. The tagged commit must be on the history of `origin/main`.

The workflow uses Node.js 24 and npm 11.17.0. It runs `npm ci`, CLI prepack, the smoke harness, the full CLI suite with `--testTimeout=120000`, and default-resource checks. It then packs and inspects the exact artifact. Retain each required result with the candidate evidence.

Before staging, verify that the tarball to stage is the exact approved candidate digest. The current release workflow rebuilds a package from the release tag. The implementation must add an explicit artifact-match guard. If the workflow tarball differs from the approved candidate, stop staging until that exact replacement passes the required installed and platform proof. Matching a source revision or version alone is insufficient. Carry the tested artifact and its evidence through the release decision; do not silently substitute a new build.

The workflow runs `npm stage publish` with provenance. This stages the package for npm review. A human must then approve the staged package on npm with two-factor authentication before it becomes public. A published GitHub release or a successful staging job does not prove public npm availability.

Obtain later explicit authorization for the tag, GitHub release, npm staging, and public npm approval. Before npm approval, inspect the stage identity and download the staged tarball when needed to verify the approved digest. After approval, check the public version, stable `latest` dist tag, provenance link, downloaded package integrity, and a clean installed version result. None of those actions is authorized by this plan.


## Release Gate

- The repair satisfies the existing ownership rules and reviewed path flow.
- Required regression, repo, and package checks pass.
- Required Windows, macOS, and Linux installed results use the same final digest. Missing proof blocks the affected release claim unless PRD 10 has an explicit valid owner exception.
- Source revision, final tree, package/lock metadata, installed version, tested digest, and staged digest agree on the CLI's 2.0.6 release.
- The authentic 2.0.5 seed, complete smoke proof, existing fixed legacy matrix, and security review have no unresolved blocking result.
- Release notes describe the shipped behavior and test limits.
- The final diff contains no unrelated changes.
- Publication, tagging, pushing, merging, and any live Make Kit repair each require the user's later explicit authorization.

Do not publish, tag, change the global Make Docs install, or update the real Store merely because the candidate is ready. A live root or kit repair is a later operation with its own preview and approval.
