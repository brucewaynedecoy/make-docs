<!-- make-docs:begin -->
# System Prompts Router

This always-local directory routes first-class Make Docs prompt resources. Prompt bodies are optional local projections.

- Use a valid local prompt body first. If it is absent, read `make-docs://system/prompt/<posix-relative-path>` with `make-docs resource read`.
- Keep prompt placeholders explicit unless the user asks to fill them.
- Before you run a prompt, read its governing contract, workflow reference, applicable template, and target output router.
- Keep reusable rules in contracts. A prompt may order or frame work, but it must not become a second policy source.
- Do not write generated plans, PRDs, work backlogs, designs, test evidence, or other project outputs here.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->
