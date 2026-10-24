# W26 R0 Evidence

## P3 Shared Store and sandbox proof

The [local proof receipt](evidence/p3/2026-10-23-local-proof.json) records the W26 candidate build, 278 focused tests, isolated setup, CLI and MCP backlog snapshot parity, cache refusal and write behavior, and two denial probes. The candidate comes from source commit `0398949e`. The isolated project and Store held no live backlog data.

The [sandbox host receipt](evidence/p3/2026-10-23-sandbox-host-proof.json) records one allowed Store read through the same W26 candidate. A temporary generic MCP setup wrote a project grant and a machine grant into an isolated Store. The MCP host ran outside the sandbox with the setup connection key. The client ran under a macOS sandbox that denied reads and writes beneath the isolated test root. Direct reads of the Store config and setup receipt returned `EPERM`. The client then called `project_status` through the host. The host returned `storeAvailable: true` and `status: ready` for the selected test project.

The first sandbox run used a harness assertion that looked for status fields in the outer MCP result wrapper. The tool call succeeded. The corrected harness read `structuredContent.result`. The second run passed without a product change.

This proof satisfies P3 task t3 for one sandboxed client and one host-owned Store read. It does not test the saved `make_docs` entry. The saved Codex entries were not changed.

The [cross-interface receipt](evidence/p3/2026-10-24-cross-interface-proof.json) covers P3 tasks t1, t2, and t4. It uses the same W26 candidate hash as the local and sandbox receipts. A new test checks live changes to a temporary generic MCP client's project limit, absent and mismatched project grants, a revoked key, a wrong key, a valid key with an unavailable database, and an unsafe database. Each refused write leaves the project files and durable Store bytes unchanged. SQLite may create empty WAL and SHM sidecar files when it opens an unsafe test database; those files contain no committed Store change and the temporary test root is removed.

The same test checks CLI and MCP source facts for a committed test record, a dirty record, and a moved checkout. Both surfaces agree on the selected root, Git revision, record facts, and diagnostics. A dirty record changes its facts while keeping the same Git revision. A move changes the selected root while keeping the relative record facts and revision. The Store-free snapshot still works when a Store-backed call is denied.

The focused setup and Store tests prove the normal schema-3-to-current setup path, compatibility migration, interrupted conversion rollback, and installation rollback over changed files. The Backlog Review Skill source and this checkout's local Skill copy now use `backlog_snapshot`, `backlog_cache_read`, and `backlog_cache_write`. The root and shipped agent router text gives the same rule: stop only the failed Store operation and continue independent Store-free work.

P3 local proof is complete on this candidate. W25 may consume only these passed, version-bound Store and cache cases after it takes in the approved change. W25 still owns its visible Refresh proof. The saved `make_docs` connection and installed package were not changed.
