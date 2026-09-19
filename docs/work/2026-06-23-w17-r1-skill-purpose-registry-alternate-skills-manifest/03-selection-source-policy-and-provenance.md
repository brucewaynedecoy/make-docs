# P3 Selection Source Policy and Provenance

## Tasks

- [x] t1: Add explicit alternate file-manifest input to the skills command or selection pipeline.
- [x] t2: Update interactive skills UI to group by purpose and show candidate skill, source, harness support, trust, and provenance.
- [x] t3: Update non-interactive selected-skill parsing so `all` expands against the effective manifest.
- [x] t4: Enforce remote manifest policy: immutable ref plus digest before install.
- [x] t5: Enforce remote skill payload policy: immutable ref plus integrity metadata before install.
- [x] t6: Preserve `selectedSkills` as resolved skill names and add selection provenance without replacing `skillFiles`.

## Acceptance Criteria

- Built-in, alternate file-manifest, `all`, and `none` selection paths use the same effective manifest.
- Rejected remote manifests explain the policy failure before mutation.
- Reconfigure and support output can explain purpose/manifest provenance for installed skills.

## Validation Notes

Cover interactive and non-interactive flows, including no-TTY rejection paths.

## Implementation Notes

- `make-docs` and `make-docs skills` now accept `--skill-manifest <file>` for an explicit local skills manifest.
- The CLI loads one effective manifest for the run, normalizes local manifest skill sources to file URLs, and passes the effective registry through selection parsing, catalog choices, UI state, and install planning.
- `--selected-skills all` now expands against the effective manifest, so alternate local manifests can replace the packaged first-party set for that run.
- Interactive skill choices now expose purpose grouping, candidate skill name, source policy, skill source, supported harnesses, provenance label, and existing selection status.
- Install selections keep `selectedSkills` as resolved skill names and add `skillManifest` plus `skillSelectionProvenance` metadata without replacing `skillFiles`.
- Remote manifest references currently fail before mutation because no immutable ref plus digest input exists yet.
- Non-first-party alternate manifests cannot install remote skill payloads unless the skill provenance is `remote-pinned` and includes immutable ref plus digest metadata.
- Static argument validation now rejects `--no-skills --skill-manifest` and cross-command `--selected-skills` conflicts before any manifest loading or install mutation.

## Coverage Decisions

- Developer guide update: completed in `docs/assets/library/developer/skills-catalog-and-distribution-model.md` to describe the first-party skills manifest shape, purpose/provenance metadata, alternate local manifest input, and remote pinning policy.
- User guide update: completed in `docs/assets/library/user/skills-installing-and-managing-skills.md` to describe current first-party skills, purpose-led selection, `--skill-manifest`, `all` expansion, provenance persistence, and remote policy stops.
- PRD update: not required; PRD 27 already owns the source policy, provenance, selected-skill, and support-output requirements.
- UAT: deferred until the full W17 R1 wave is complete, per the wave instruction.

## Validation Evidence

- `npm test -w packages/cli -- cli skill-registry skill-catalog skills-ui --reporter=dot`
- `npm run build -w packages/cli`
