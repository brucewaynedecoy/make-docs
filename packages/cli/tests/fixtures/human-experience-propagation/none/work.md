---
title: "Private parser extraction work"
kind: "work"
status: "active"
coordinate: "W20 R0 P3"
source:
  type: "plan"
  path: "plan.md"
---

# Private Parser Extraction Work

[Source plan](./plan.md)

Preserved human boundary: The public command accepts the same input and returns the same output, error text, exit status, and timing boundary.

Implementation work: Extract the private token scanner.

Observable acceptance: All accepted public command fixtures keep the same bytes, exit status, and timing boundary.

## Current Testing Decisions

| Testing type | Decision informed | Reason now | Product maturity | Scope | Executor | Gate effect | Effort budget | Stop condition | Evidence retained | Rerun trigger | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Automated Implementation Testing | Did public output, errors, and exit status stay byte-identical after the extraction? | Exact output, error, and exit-status bytes define the preserved boundary. | Private refactor fixture | Fixed public command cases | Implementation test runner | Must pass before the none boundary is accepted. | One fixed-case comparison | Stop after every accepted case matches. | [Evidence](./evidence.md) | The parser or public command cases change. | selected |
| Performance Testing | Did the accepted public timing boundary remain unchanged after the extraction? | The preserved boundary includes the accepted timing limit. | Private refactor fixture | Accepted public timing case | Performance sampler | Must stay within the prior timing limit. | One bounded timing comparison | Stop after the prior timing limit is checked. | [Evidence](./evidence.md) | The timing limit or execution path changes. | selected |
| Guided Progress Review | Can guided review change the current boundary-preservation decision? | The byte and timing checks prove the unchanged public boundary. | Private refactor fixture | Public command result | Not assigned | Does not block this fixture. | None | Stop while the public interaction stays byte-identical. | This decision record | Output meaning or recovery changes. | not-needed-now |
| Unassisted Goal Testing | Can an unassisted attempt reveal a changed human path in this none case? | No new or changed human path exists in this none case. | Private refactor fixture | Preserved command use | Not assigned | Cannot support a new human-outcome claim. | None | Stop without inventing an interaction. | This decision record | A new human path is introduced. | not-needed-now |

Human Experience Review: Required to confirm the preserved boundary.
