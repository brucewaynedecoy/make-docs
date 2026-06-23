# Phase 03: Provider Cache and Safety Validation

## Purpose

Plan provider-backed and hybrid-cache safety requirements without making those modes the default before evidence exists.

## Provider Boundary

- A provider can be the future Rust CLI/MCP surface, the npm installer bundle, a later approved remote source, or another approved immutable source.
- Provider-backed mode must be explicit opt-in or an explicit profile choice at first.
- Provider-backed mode must never be an accidental side effect of the TypeScript/Rust split.
- Remote system asset sources remain deferred until trust, pinning, caching, and confirmation policy are resolved.

## Cache Boundary

- A cache is not an unpinned source of truth.
- A cached asset set must record provider identity, provider version or immutable ref, hash algorithm, and expected hash set.
- Cache misses or hash mismatches must rehydrate from an approved provider or fall back to a reviewed materialization path.
- The CLI must not silently use a different asset version.

## Safety Boundary

- The local bootstrap remains materialized in every mode.
- On-demand writes must go through existing managed-file review and conflict handling.
- Backup and uninstall must continue to trust one reviewed audit snapshot.
- Skills and plugins remain outside system asset materialization and keep their own delivery and trust decisions.

## Validation

- Extend future package validation beyond current smoke-pack coverage only when provider/cache source work is implemented.
- Required future checks include provider outage behavior, stale provider hashes, cache misses, on-demand conflict handling, and TypeScript/Rust manifest compatibility.
