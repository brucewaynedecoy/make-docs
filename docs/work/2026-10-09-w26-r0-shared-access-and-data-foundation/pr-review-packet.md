# W26 PR Review Packet

Status: local review packet ready. No W26 push or PR action has taken place.

## Branch and base

- Source branch: `w26-r0-simplified-store-access`.
- Base: local `main` and `origin/main` at `180f3da0aa9b76723db96ac524d23b73b5df50e8` when this packet was prepared.
- The branch starts at that base. Its diff has no W25 widget or live app file.
- The saved `make_docs` MCP entry and the installed Make Docs package were not changed.

## Scope for review

- W26 R0 adds one shared Store access path. MCP uses a reviewed connection key plus current machine and project grants. Direct CLI keeps its local operator route. Generic setup returns a client-owned configuration object. First-party setup keeps review and recovery boundaries.
- W26 R1 gives MCP tools short, fixed names. It removes the old long names without aliases. The shipped Backlog Review Skill uses `backlog_snapshot`, `backlog_cache_read`, and `backlog_cache_write`.
- P3 adds repeatable grant and source-version tests. It updates the Backlog Review Skill copy in this checkout and records the temporary host proof.

## Local commits on the branch

1. `2bf8233b` — W26 R0 plan and work records.
2. `39b12140` — W26 R0 shared core and setup.
3. `bdf0b0d0` — W26 R1 name design and work records.
4. `0398949e` — W26 R1 tool source, tests, and shipped Skill files.
5. `aac45ed4` — W26 R1 shipped and checkout Skill instruction parity.
6. W26 R0 P3 proof and this packet: see the branch tip after the local commit.

## Proof and limits

- The [P3 evidence report](evidence.md#p3-shared-store-and-sandbox-proof) links the local, sandbox, and cross-interface receipts. All three name candidate `dist/index.js` SHA-256 `37e1a87009652dab324bf14d0fd8a25b7509499c7ef8071c7e95299e89da4b2e`.
- The full repository suite passed: 19 smoke tests and 1,662 CLI tests. Five CLI tests were skipped by their own conditions. The TypeScript check and document path check passed.
- The [cross-interface test](../../../packages/cli/tests/w26-p3-cross-interface.test.ts) checks allowed reads; read-only, missing, out-of-scope, revoked, denied, unavailable, and unsafe cases; refused-write data; Store-free continuation; and CLI/MCP facts for clean, dirty, and moved source.
- Isolated setup and schema-3 upgrade pass in [CLI setup tests](../../../packages/cli/tests/cli.test.ts). Compatibility migration and interrupted conversion rollback pass in [bridge tests](../../../packages/cli/tests/w22-r0-p5-compatibility-bridge.test.ts). File rollback passes in [installation tests](../../../packages/cli/tests/installation-state.test.ts). The sandbox client cannot read the test Store files but can call an allowed Store tool through a temporary W26 MCP host.
- The root and shipped agent routers tell the agent to stop only the failed Store operation. The shipped Skill and checkout copy now use the current tool names and keep optional cache refusal separate from source facts.
- An unsafe Store probe can make empty SQLite WAL and SHM sidecar files. It changes no durable Store bytes or project data. The test removes its temporary root.
- The saved `make_docs` entry still runs the installed package. A package install or change to that saved entry needs separate owner approval. This PR does not claim installed-host proof.
- W25 must test its visible Refresh flow after it takes in the approved W26 change. No W25 widget or live app proof is claimed here.

## Suggested review focus

1. Check that the MCP key only selects a connection and that current grants still limit each Store call.
2. Check that setup leaves user-owned entries alone and keeps recovery steps clear.
3. Check the tool name map and the client change from old names to new names.
4. Check the denial matrix, source-version parity, rollback, and sandbox receipts.
5. Check that the W25 Refresh work stays in W25.

## Proposed PR text

Title: `W26: shared Store access and clear MCP tool names`

Summary:

- Add reviewed MCP connection keys and current machine/project Store grants.
- Add repeat-safe first-party and generic setup paths with bounded recovery.
- Replace long MCP tool names with short fixed names and update the shipped Backlog Review Skill.
- Prove CLI/MCP parity, grant refusal, migration, rollback, source-version changes, and sandbox host access.

Test plan:

- Full repository test suite and TypeScript check.
- P3 grant and source-version test on temporary projects and Stores.
- Schema-3 setup, compatibility migration, interrupted rollback, and installation recovery tests.
- Temporary sandbox host receipt with direct Store reads denied to the client.

Limits:

- The saved `make_docs` connection and installed package were not changed.
- W25 owns live widget Refresh proof after integration.

## Decision needed

The owner can approve a push and PR open as one separate action after reviewing this local packet. That approval does not include an installed package change, saved connection change, merge, or release.
