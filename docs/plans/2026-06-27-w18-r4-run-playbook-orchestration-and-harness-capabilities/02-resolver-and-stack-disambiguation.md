# Resolver and Stack Disambiguation

## Objective

Define deterministic playbook selection so a runner never executes the wrong valid playbook.

## Scope

- Keep filesystem paths as `docs/assets/playbooks/<persona>/<slug>.md`.
- Treat `persona/slug` as the resolver identity.
- Treat `stack` as required frontmatter used for validation and disambiguation, not a path segment.
- Allow bare slug or title only when it resolves to exactly one candidate.

## Acceptance Criteria

- Future tests cover explicit path, `persona/slug`, bare unique slug, duplicate slug, duplicate title, invalid stack, and requested-stack mismatch.
- Selection messages display persona, slug, stack, title, and summary before execution when ambiguity is possible.
- Stack substitution fails closed instead of silently running a build-stack playbook as run-stack or the reverse.
