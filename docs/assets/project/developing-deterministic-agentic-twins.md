# Developing Deterministic and Agentic Twins

When working with or creating any Deterministic/Agentic "Twins" (i.e., business logic, processes, etc., that are implemented as both deterministic business logic in the CLI and agentic logic that agents execute), you must consider the following guidelines:

1. Having a deterministic way to do this is almost always better from a cost/token-saving and reliability perspective than having agents follow instructions to do this.
2. As a loose rule, we like having both a deterministic and agentic way of doing things like this.
3. Since the logic must necessarily live in the Make Docs CLI (accessible via commands and MCP server), it would be necessary for an agentic method exist in Make Docs instructions, because it is possible for a project to be initialized with Make Docs without having access to the CLI.
4. Whenever logic is implemented as both deterministic logic and as agentic logic, it will be absolutely critical for future changes made to one to trigger evaluation of the other to help ensure as much parity as possible.
