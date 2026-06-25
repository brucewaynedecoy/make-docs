<!-- make-docs:begin -->
# Prompts Router

This directory stores reusable prompt starters classified as process references, not authoritative rules and not generated outputs.

- Use it only when the user wants a stored prompt or a reusable workflow kickoff.
- Keep placeholder tokens explicit unless the user asks to instantiate them.
- When executing a prompt, read the target workflow in `.make-docs/references/system/`, the matching contract in `.make-docs/contracts/system/`, the matching template in `.make-docs/templates/system/`, and the router in the target output directory.
- Do not write generated plans, PRDs, work backlogs, or designs here.
<!-- make-docs:end -->
