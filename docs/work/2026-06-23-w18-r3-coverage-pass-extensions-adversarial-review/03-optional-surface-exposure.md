# P3 Optional Surface Exposure

## Goal

Implement only the adversarial-review exposure surface selected by downstream scope.

## Tasks

- [ ] Decide whether this phase is implementing no surface, a prompt, playbook, plugin, CLI command, MCP operation, conformance scenario, or a combination explicitly authorized by the work scope.
- [ ] If implementing a prompt, add it through the template-first prompt path and update `PROMPT_RULES`.
- [ ] If implementing a playbook, satisfy PRD 29 frontmatter, stack, body, validation, and Run Playbook boundaries.
- [ ] If implementing a plugin, satisfy PRD 30 payload, generated exposure, explicit selection, audit, backup, uninstall, and support metadata boundaries.
- [ ] If implementing CLI or MCP behavior, delegate deterministic behavior to accepted CLI/shared-core operations and keep MCP writes gated.
- [ ] If adding conformance scenarios, record them as evidence candidates without claiming support before reviewed results exist.
- [ ] Keep bare install, default sync, generic Run Playbook, and default plugin selection from implying adversarial review.

## Acceptance Criteria

- The implemented surface is explicitly selected by the work scope.
- No unselected surface changes behavior.
- Package/template and manifest changes match the selected surface only.
- Support wording remains provisional without evidence.

## Validation Notes

Run prompt-rule, playbook metadata, plugin substrate, CLI/MCP parity, or conformance validation only for surfaces this phase actually implements.
