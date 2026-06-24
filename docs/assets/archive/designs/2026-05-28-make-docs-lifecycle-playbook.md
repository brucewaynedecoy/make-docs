# Make Docs Lifecycle Playbook and Terminology Overlay

> **Superseded 2026-06-17 (Sense-A → Sense-B).** This design framed the
> playbook as a single operating manual. The consolidated, current design
> is
> [2026-06-17-make-docs-lifecycle-foundation.md](./2026-06-17-make-docs-lifecycle-foundation.md),
> where a **playbook** is a persona-scoped procedural output type (under
> `docs/library/playbooks/<persona>/`) and make-docs's own lifecycle
> playbook is the dogfooded instance. The stage list and gap-analysis
> intent below remain useful as historical context; for the current
> direction on personas, configuration, the restructure, and the overlay,
> see [docs/artifacts/evolution-direction.md](../../../artifacts/evolution-direction.md).

## Purpose

Capture the decision to introduce a user-facing **lifecycle playbook**
for Make Docs that walks consumers through the full
ideation-to-archive workflow, and to plan for a **terminology overlay**
so teams can rename Make Docs's canonical vocabulary (wave, phase,
PRD, work backlog) to match their own without forking the project.

The motivation: today Make Docs has dense, high-quality coverage of a
narrow slice of the lifecycle (PRD → work backlog → phase execution
→ closeout) and very little coverage of the surrounding stages
(ideation, architecture, design-to-plan handoff on the front end;
testing, soft launch, deployment, archival, retrospective on the back
end). Users who want to apply Make Docs end-to-end have to invent the
missing stages themselves, and users who prefer their own terminology
have to either accept ours or fork. A canonical playbook plus a
deliberate overlay surface fixes both without making Make Docs
prescriptive.

## Context

What Make Docs already provides for the workflow surface:

- Reference contracts in `docs/assets/references/`:
  `design-workflow.md`, `planning-workflow.md`, `execution-workflow.md`,
  `output-contract.md`, `wave-model.md`, `guide-contract.md`,
  `history-record-contract.md`, `prd-change-management.md`.
- Templates in `docs/assets/templates/` for designs, plans (overview,
  PRD, PRD change, PRD decompose), guides (developer, user), and
  history records.
- Skills in `packages/skills/` for `decompose-codebase`, `cleanup-docs`,
  `archive-docs`, `work-on-wave`, `work-on-phase`, `closeout-phase`,
  `closeout-commit`.
- A documented router pattern (`docs/CLAUDE.md`, `AGENTS.md` files)
  that points agents at the right reference for the task at hand.

What is missing:

- A single canonical narrative that names the stages, their inputs and
  exits, and their relationships. Today you can reach any individual
  contract from the router, but there is no document that says "here
  is the whole arc, here is where you are in it, here is what comes
  next."
- Stage coverage outside the implementation slice. Early stages
  (green-field ideation, architecture, requirements gathering) and
  late stages (testing, soft launch, deployment, archival,
  retrospective) have at most partial coverage and in some cases none.
- A terminology surface. The words `wave`, `phase`, `PRD`, and `work
  backlog` are embedded directly in reference prose, skill prose,
  template prose, and even file paths. A team that calls these
  `sprint`, `story`, `spec`, and `backlog` cannot adopt Make Docs
  without either translating in their head or modifying the repo.

Forces shaping the decision:

- **Make Docs should not paint users into corners.** The user has
  stated this explicitly as a long-term north star. The playbook
  must be guidance, not automation; the overlay must rename, not
  restructure.
- **Repo structure is the contract.** File paths, frontmatter fields,
  and skill names are the parts users build automation against.
  Renaming them via overlay would break user automation; the overlay
  must operate on *presented* vocabulary, not on stored vocabulary.
- **The decision-frame contract from
  [2026-05-28-coverage-pass-contract-and-skill-evolution.md](./2026-05-28-coverage-pass-contract-and-skill-evolution.md)
  is a prerequisite.** Adding new stage skills before the
  decision-frame mechanics are centralized would recreate the
  duplication problem the contract is designed to solve. The playbook
  surfaces the gaps; the contract is what lets us fill them cheaply.
- **Users should be able to skip or reorder stages.** Real product
  workflows are not linear. The playbook must read as a *map*, not a
  required sequence.

## Decision

1. **Create a `docs/playbooks/` directory** with one canonical
   playbook document, `make-docs-lifecycle.md`, structured as a
   numbered list of lifecycle stages. Each stage section follows a
   uniform template:

   - **Purpose** — what this stage produces.
   - **Inputs** — what must exist before starting.
   - **Decision points** — the named verdicts that close the stage
     (e.g. `proceed` / `iterate` / `cancel` / `defer`).
   - **Suggested assists** — skills, references, templates, starter
     prompts, MCP tools that *can* help; never required.
   - **Exit criteria** — what must be true to consider the stage done.
   - **Handoff** — what the next stage inherits.

   The initial stage list (subject to refinement during the planning
   phase that follows this design):

   1. Green-field ideation / requirements gathering
   2. Architecture
   3. Design (existing — `docs/designs/`)
   4. Planning (existing — `docs/plans/`)
   5. PRD authoring (existing — `docs/prd/`)
   6. Work backlog generation (existing — `docs/work/`)
   7. Implementation loop (existing — `work-on-phase`, `work-on-wave`)
   8. Coverage passes (closeout) (existing — `closeout-phase`,
      `closeout-commit`; centralized by the coverage-pass contract)
   9. Testing — automated, then user-acceptance
   10. Soft launch / deployment
   11. Documentation archival (existing — `archive-docs`)
   12. Retrospective

2. **Use the playbook to drive a gap analysis.** Each stage gets a
   one-line status flag: `skill-backed`, `reference-only`,
   `starter-prompt-only`, or `not-yet-covered`. The result is a
   single artifact — a gap report — that becomes the input to the
   next round of planning. New stages that warrant a skill get one;
   stages that only need a contract get a contract; stages that only
   need an opinionated starter get a prompt.

3. **Treat the playbook as a guide, not an automation.** It lives in
   `docs/playbooks/`, is discoverable from the root `README.md` and
   `docs/CLAUDE.md`, and is referenced by the relevant
   stage-specific skills and contracts. It does not encode required
   transitions, does not enforce stage order, and does not gate any
   skill. Users who want to wire it into automation are free to;
   Make Docs itself does not.

4. **Plan for a terminology overlay**, but do not build it yet. The
   target shape is a single config file (working name:
   `.make-docs/terminology.yml`) that maps Make Docs canonical
   terms to user-chosen terms. The overlay operates on:

   - generated text inside artifacts that skills produce (e.g.
     history record summaries, plan overviews, guide stubs);
   - user-visible CLI output and skill prose.

   The overlay explicitly does **not** rename:

   - file paths (`docs/work/`, `docs/prd/`, etc.);
   - frontmatter field names;
   - skill names;
   - reference contract names.

   The overlay only becomes viable after the playbook lands, because
   the playbook is what concentrates the canonical vocabulary into
   one user-facing surface. Building the overlay first would leave
   the vocabulary scattered across reference files where the
   overlay cannot safely touch it.

5. **Sequence the work explicitly** so each step's value is visible
   on its own and so we never commit to a downstream decision before
   the upstream one is in place:

   - **First:** land the coverage-pass contract and skill refactor
     (separate design and plan; already in flight).
   - **Next:** build the playbook TOC as its own plan; the output
     is the playbook document itself plus the gap report.
   - **Next:** work the gap report. Each gap becomes a small
     focused plan (new skill, new contract, or new starter prompt,
     whichever the stage warrants).
   - **Finally:** design and build the terminology overlay, once
     the playbook is the single user-facing surface for stage
     vocabulary.

## Alternatives Considered

**Alternative A — Skip the playbook; document each stage in its own
reference.** This is roughly where Make Docs is today. Rejected
because it gives users no map and forces them to discover stage
relationships by reading every reference. The playbook is the map
that makes the references navigable.

**Alternative B — Build the playbook as runnable automation (one big
skill that walks users through stages).** Rejected. Real lifecycles
are non-linear; users skip, reorder, and revisit stages. Encoding
the playbook as automation would make Make Docs prescriptive in
exactly the way the user wants to avoid.

**Alternative C — Build the terminology overlay first, then let the
playbook inherit it.** Rejected. Today the canonical vocabulary is
scattered across reference contracts, skill prose, and templates.
An overlay applied to that surface would either miss most of the
vocabulary or require invasive rewrites of the references. The
playbook is the natural concentrator; build it first, overlay
later.

**Alternative D — Rename file paths and frontmatter fields through
the overlay.** Rejected. File paths and frontmatter are the
contract users build automation against. Renaming them would
silently break that automation on every overlay change. The
overlay must be a presentation layer.

**Alternative E — One mega design covering both contract,
skill refactor, playbook, and overlay.** Considered, then rejected
in favor of two separate designs (this one and the coverage-pass
contract design). The contract is tactical and concrete; the
playbook is strategic and longer-horizon. Splitting them keeps
each design reviewable on its own merits and avoids committing to
the playbook shape before the contract has informed it.

## Consequences

**Positive:**

- Users get a single canonical entry point that explains the whole
  arc, including stages Make Docs does not yet cover.
- Stage gaps become visible and tractable — each gap is one row in
  a report with a defined remediation type (skill, contract, or
  starter prompt).
- Future stage additions (testing, launch, archival,
  retrospective) reuse the coverage-pass contract for their
  mechanics, so they stay short and uniform.
- The terminology overlay becomes feasible *and* safe, because the
  vocabulary surface is bounded and the overlay never touches
  paths or frontmatter.

**Negative / risks:**

- **R-1:** Risk that the playbook drifts away from the actual repo
  state over time. Mitigated by linking every stage entry directly
  to the skills/contracts it references and treating playbook
  updates as part of the closeout for any stage-affecting change.
- **R-2:** Risk that the playbook becomes too prescriptive
  despite the design's intent. Mitigated by the uniform "suggested
  assists" framing and explicit non-goals in the playbook itself.
- **R-3:** Risk that the overlay scope creeps to include file
  paths or frontmatter. Mitigated by encoding the overlay's
  non-renaming scope in its own future design doc and validating
  against it before shipping.
- **R-4:** Risk that the gap report turns into a backlog of skills
  the project cannot afford to build. Mitigated by letting most
  gaps resolve as starter prompts or reference entries rather than
  new skills; new skills are only created when a stage has
  procedural complexity that benefits from delegation or scripting.

**Operational:**

- After this design lands, the next concrete artifact is a
  planning doc for the playbook itself, producing the
  `docs/playbooks/make-docs-lifecycle.md` document and a
  companion gap report.
- The playbook becomes the canonical place where the user's
  long-term vision ("flexible workflows; no corners") is made
  visible to consumers. Every future stage addition should be
  reviewed against that framing.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../../prompts/designs-to-plan.prompt.md)
- Why: This is net-new product surface (playbook + future overlay)
  not covered by any active PRD namespace; baseline planning is the
  correct downstream workflow. The planning doc should sequence
  the playbook authorship and gap report first, and defer the
  overlay to a later design once the playbook is in place.
- Coordinate Handoff: not applicable — `baseline-plan` route.
  Sequencing note: the matching plan for this design should be
  authored *after* the coverage-pass contract plan
  ([../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md](../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md))
  lands, since the playbook depends on the contract for stage
  mechanics.
