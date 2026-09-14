# Operator Modes for Setup-Access Conformance

This protocol is for maintainers. It does not add a shipped CLI command or MCP tool.

The rule is simple: the harness performs the work, and measured evidence records the result. A driver statement is useful context. It is not proof.

## Before You Start

Build and pack the candidate. Use only the resulting npm tarball.

Use a new session root under a directory named `make-docs-conformance-lab`. The root must be outside the repository and outside the real home. It must be absent or empty.

Record exact values for the harness version, model or provider, and runtime. Do not use a wildcard or an unknown value.

## Bootstrap One Exact Session

Run this form from the repository root:

```bash
npm run conformance:kit -- \
  --scenario setup-access/mcp-store-operations \
  --harness codex \
  --connection-method mcp \
  --model-or-provider openai/example-model \
  --runtime darwin-arm64/node-24 \
  --harness-version "codex-cli example" \
  --packed-product /absolute/path/to/make-docs.tgz \
  --session-root /tmp/make-docs-conformance-lab/codex-mcp
```

Choose the matching scenario and method:

| Scenario | Harness | Method |
| --- | --- | --- |
| `setup-access/mcp-store-operations` | Codex or Claude Code | `mcp` |
| `setup-access/bounded-rule-store-operations` | Codex | `command-rules` |
| `setup-access/permission-rule-store-operations` | Claude Code | `permission-rules` |
| `setup-access/direct-resource-read` | Codex or Claude Code | `direct-cli` |

Bootstrap installs the packed product only in the session. It creates one disposable home, project, Store, and evidence directory. It writes the reviewed native entry with the production adapter path. It writes project intent through the production project operation.

Bootstrap creates a provisional registry copy only in the session. It does not write a result. It does not change the repo-root registry.

Bootstrap also seeds one user-owned native value. Cleanup must remove only the managed Make Docs entry. It must preserve this value.

## Measure the Session

Drive the stated harness from the disposable home. Do not use the real harness home.

Fill `evidence/measurements.json` from exact evidence. Keep `null` for a condition that was not measured.

For MCP and rule methods, measure:

- native files
- caller or harness launch identity
- connection-method identity
- Store read
- Store write
- rejected access outside the allowed set
- cleanup
- user-content preservation

For `direct-cli`, measure:

- direct method identity
- Store-free resource read
- proof that no Store session opened
- cleanup
- user-content preservation

Add at least one exact evidence reference. Add every caveat. Add the transcript pointer and format.

A rule file, executable path, or environment value does not prove a harness launch. The real harness must supply a trustworthy launch fact. If it cannot, record the condition as failed or unmeasured.

Claude Code permission approval and sandbox file access are separate measurements. Do not infer one from the other.

## Preview Ingestion

Use preview first:

```bash
npm run conformance:ingest -- \
  --session-root /tmp/make-docs-conformance-lab/codex-mcp \
  --attestations /absolute/path/to/review.json
```

For setup-access, the review file can contain:

```json
{
  "reviewerStatus": "reviewed",
  "reason": "The evidence matches the measured session."
}
```

Preview validates the version 2 result and derives the registry status. It writes nothing.

Missing measurements produce a `blocked` result. Complete failed measurements produce an `unsupported` result. Only a complete passing result can qualify for support.

## Reviewed Write

The `--write` option changes the repo-root result and registry. Use it only after the maintainer reviews the preview.

```bash
npm run conformance:ingest -- \
  --session-root /tmp/make-docs-conformance-lab/codex-mcp \
  --attestations /absolute/path/to/review.json \
  --write
```

The review file must state `reviewerStatus: reviewed`. The source registry digest must still match the digest from bootstrap. Otherwise ingestion stops.

After a reviewed write, rebuild the package. Confirm that the behavior digest did not change. Confirm that the packaged registry digest changed to the new repo-root registry digest.

Remove the managed native entry after the measured run:

```bash
npm run conformance:kit -- \
  --cleanup-session /tmp/make-docs-conformance-lab/codex-mcp/session.json
```

Cleanup uses the same production adapter removal path. It writes `evidence/cleanup.json`. The record must show that the managed entry is absent and the seeded user content is unchanged.

Final installed acceptance must use the normal setup support loader. The provisional bootstrap path cannot satisfy final setup acceptance.

## Driver Modes

The evidence rules stay the same in each mode.

- Human-only: a maintainer drives the harness and records the measurements.
- Human with an assisting agent: the agent prepares and measures. The human drives the real harness and reviews the result.
- Agent-driven: an agent drives the harness through available terminal controls. The measured files remain the evidence.

If authentication, model routing, sandbox access, or another condition prevents the run, record an honest blocked result. Do not copy credentials from the real home into the session.

## Retired Packaging Path

The old packaging kit and its version 1 result path remain historical. The former first-pass suite returns a retirement error. Historical package evidence cannot enter the active version 2 setup-access registry.
