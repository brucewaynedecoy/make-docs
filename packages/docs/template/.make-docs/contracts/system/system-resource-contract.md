# System Resource Contract

## Purpose

Use this contract to author, identify, list, and read Make Docs system resources.

A system resource is reusable Make Docs content owned by the shipped template. Contracts, prompts, references, and templates are four peer resource types. A peer type has the same identity and catalog standing as each other type.

## Upstream Authority

Author system resources only in these upstream roots:

| Type | Upstream root |
| --- | --- |
| `contract` | `.make-docs/contracts/system/` |
| `prompt` | `.make-docs/prompts/system/` |
| `reference` | `.make-docs/references/system/` |
| `template` | `.make-docs/templates/system/` |

The catalog at `.make-docs/system-resources.catalog.json` is the one upstream inventory. Its schema is `.make-docs/system-resources.schema.json`.

Routers named `AGENTS.md` or `CLAUDE.md` are local instruction surfaces. They are not content resources and do not receive a system-resource URI.

## Stable Identity

Each resource has one stable URI:

`make-docs://system/<type>/<posix-relative-path>`

The type is singular. The path is the file path relative to its type root. A POSIX-relative path uses `/` as the separator on every platform.

The path is case-sensitive. It must not be empty or absolute. It must not contain `.` or `..` segments. It must not expose a package, project, home, or temporary installation path.

## Resource Metadata

The catalog supplies or derives this metadata for each current resource:

| Field | Source |
| --- | --- |
| `uri` | Stable URI derived from type and relative path |
| `type` | Catalog type entry |
| `path` | Path relative to the type root |
| `mediaType` | Catalog default or a later explicit resource override |
| `origin` | Effective source selected by the resolver |
| `providerIdentity` | Installed provider identity |
| `packageIdentity` | Installed package identity |
| `versionOrRef` | Provider version or immutable reference |
| `digest` | Hash algorithm and hash derived from the exact resource bytes |
| `localPath` | Local path when a trusted local source supplied the bytes |
| `provenanceState` | Evidence state for the provider or trusted local source |
| `content` | Exact resource bytes |

Here, a provider is an installed source of resource bytes. Provenance is evidence of where those bytes came from and who owns them.

The catalog and path supply the fields known during authoring. Origin, provider, package, version, digest, local path, provenance, and content fields are derived when the provider inventory is built or read. A catalog entry must not prefill a false provider version, local path, or digest.

## Provider And Projection

The installed provider is the default list and read source. A project does not need a local copy of a resource.

An explicit, trustworthy local projection may supply the same URI under `.make-docs/system/{contracts,prompts,references,templates}/`. Local projection is optional. It must retain provider, version, URI, path, ownership, and hash evidence. A changed or untrusted local file must not silently replace provider bytes.

## Prompt Boundary

A prompt is a first-class resource. Do not store a current prompt below the reference root. A prompt may route an agent through a workflow, but the governing contract owns reusable rules and constraints.

Do not add prompt inclusion, template mode, reference mode, or another legacy resource selection field. Resource availability does not depend on local projection.

## System Workflow Composition

A system workflow is a named catalog composition of current contract, prompt, reference, and template URIs. It does not create a fifth resource type, generic workflow engine, Playbook, Protocol, Skill requirement, or local projection requirement.

The Naive-UAT workflow is the first catalog composition. Its governing policy remains in `make-docs://system/contract/naive-uat-contract.md`.

## Preserved Legacy Files

The catalog may name physically preserved legacy files that are not current resources. A preserved legacy file keeps its bytes for later reviewed migration. Its presence does not give it a URI, provider standing, product capability, or support claim.

The Playbook contract and Playbook defaults remain preserved for the later traced retirement phase. They are not current Make Docs resources.

## Validation

Validation must prove:

- the catalog matches its schema;
- all four types occur exactly once;
- each source root matches its type;
- every current resource derives one unique URI;
- every workflow URI resolves in the current inventory;
- routers are excluded from the content inventory;
- preserved legacy files are excluded from current resource identity;
- prompt files live under the prompt root;
- no legacy resource selection field appears as current authority.
