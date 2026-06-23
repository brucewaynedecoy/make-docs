# Selection Source Policy and Provenance

## Objective

Plan the selection and trust behavior around purpose-led UI, non-interactive inputs, alternate manifests, and persisted manifest provenance.

## Selection Contract

- Purpose-led selection shows purpose first and concrete skill second.
- Candidate rows show skill source, supported harnesses, trust/provenance, and manifest identity before selection.
- Multiple candidates for one purpose require user choice unless the effective manifest marks exactly one default candidate and the user has already opted into skills.
- `--selected-skills all` expands against the effective manifest after validation.
- `--selected-skills none` remains an empty selected-skill set.
- Bare default installs remain skill-free.

## Source Policy

- File-path alternate manifests are the first supported implementation target.
- URL alternate manifests require immutable refs plus manifest digest before install.
- Mutable branches, unauthenticated HTTP, and unpinned remote manifests are invalid for installation.
- Remote skill payloads inside any manifest require immutable refs and integrity metadata before install.
- Local file sources are allowed only when explicitly supplied and must be displayed as local/custom.
- Third-party sources must be labeled third-party even when satisfying a first-party purpose id.

## Manifest Provenance

Persist resolved skill names in `selectedSkills`. Add explanatory selection provenance for review and support without replacing `selectedSkills` or `skillFiles`.

Recommended provenance fields include selected purpose id, effective manifest id, candidate skill name, source policy class, and source provenance.

## Acceptance

- Interactive and non-interactive selection use the same effective manifest.
- Reconfigure, audit, backup, uninstall, and support output can explain why a selected skill is present.
- The selection state remains executable from resolved selected skill names.
