<!-- make-docs:begin -->
# System Resources Router

This always-local directory routes the four peer Make Docs system-resource types. Resource bodies are optional.

- Use a valid local body in `contracts/`, `prompts/`, `references/`, or `templates/` first.
- If a required body is absent, read its stable `make-docs://system/<type>/<posix-relative-path>` URI with `make-docs resource read`.
- Resource selection controls bodies only. It does not remove this router or any typed directory router.
- Keep reusable policy in contracts and explanatory workflow guidance in references.
- Do not write generated project documentation here.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->
