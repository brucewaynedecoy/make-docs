# Make Docs Technical Debt

## Purpose

This catalog keeps known technical debt visible to Make Docs maintainers.

The catalog is not product authority and does not authorize implementation. Each item with a current product effect links to its canonical question, risk, or drift record in the PRD register.

Prefer deletion, consolidation, and a clear transition over indefinite compatibility for unused or retired behavior. Keep a compatibility path only when a known installation needs it. Give each retained path a removal condition.

## Catalog Rules

- Give each item a stable `TD-###` id.
- State the current residue and why it creates cost or confusion.
- Link the canonical authority record.
- Name the desired end state.
- Keep implementation status honest.
- Do not use this catalog to activate a retired product feature.
- Close an item only after code, tests, documentation, and installed behavior agree.

## Current Items

| ID | Status | Summary | Canonical record | Next step |
| --- | --- | --- | --- | --- |
| `TD-001` | Open | Retired plugin-product fields and code remain live in schema, manifests, lifecycle output, audit output, Store settings, and tests. | [D-036](../../prd/03-open-questions-and-risk-register.md#d-036-retired-plugin-product-leaves-live-product-and-schema-surface) | Trace the full surface. Prepare a bounded removal design and plan. |

## TD-001 Retired Plugin Product Surface

Status: `open`

### Current residue

- Installation selections still include plugin enablement, scope, selected ids, manifest source, and provenance.
- Manifest parsing still validates and writes plugin selection data.
- Lifecycle and audit output still present plugin state.
- Plugin lifecycle tests still exercise a Make Docs-owned plugin path.
- Global Store configuration still includes `marketplaceAutoRegistration`.
- Product authority says Make Docs has no general plugin or workflow-bundle product.

### Why this is debt

The residue can make a retired product look current. It increases the number of types, branches, tests, and migration cases that maintainers must understand. It also encourages future work to reuse an unsupported surface instead of making a clear product decision.

### Desired result

Remove the Make Docs plugin-product surface from current code, schemas, new manifests, lifecycle output, audit output, Store settings, tests, package checks, and current documentation.

Preserve user-owned native harness files through the existing ownership rules. Do not preserve a Make Docs plugin product only to protect those files.

If a known installation needs a transition, use the smallest clear migration or incompatibility error. Record its removal condition. Do not retain an indefinite compatibility path for a hypothetical installation.

### Next step

Perform a read-only reference and installation audit. Then prepare a bounded cleanup design and plan. Do not remove code until that audit defines the exact deletion set and transition behavior.
