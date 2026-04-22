# Prompts Router

This directory stores reusable prompt starters, not authoritative rules and not generated outputs.
- Use it only when the user wants a stored prompt or a reusable workflow kickoff.
- Keep placeholder tokens explicit unless the user asks to instantiate them.
- When executing a prompt, read the target workflow in `docs/assets/references/`, the matching template in `docs/assets/templates/`, and the router in the target output directory.
- Do not write generated plans, PRDs, work backlogs, or designs here.
