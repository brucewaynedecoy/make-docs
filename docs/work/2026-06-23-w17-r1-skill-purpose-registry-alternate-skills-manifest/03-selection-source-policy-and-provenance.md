# P3 Selection Source Policy and Provenance

## Tasks

- [ ] Add explicit alternate file-manifest input to the skills command or selection pipeline.
- [ ] Update interactive skills UI to group by purpose and show candidate skill, source, harness support, trust, and provenance.
- [ ] Update non-interactive selected-skill parsing so `all` expands against the effective manifest.
- [ ] Enforce remote manifest policy: immutable ref plus digest before install.
- [ ] Enforce remote skill payload policy: immutable ref plus integrity metadata before install.
- [ ] Preserve `selectedSkills` as resolved skill names and add selection provenance without replacing `skillFiles`.

## Acceptance Criteria

- Built-in, alternate file-manifest, `all`, and `none` selection paths use the same effective manifest.
- Rejected remote manifests explain the policy failure before mutation.
- Reconfigure and support output can explain purpose/manifest provenance for installed skills.

## Validation Notes

Cover interactive and non-interactive flows, including no-TTY rejection paths.
