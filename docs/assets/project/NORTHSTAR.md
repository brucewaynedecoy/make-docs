---
title: "North Star — Guiding Principles"
date: "2026-07-01"
kind: "artifact"
status: "living"
---

# North Star — Guiding Principles

This document captures durable guiding principles for Make Docs that should outlast any single design or decision. It is working guidance, not a contract. When a principle here conflicts with an accepted contract or design, the contract wins; but these principles should shape new designs, and departures from them should be deliberate and noted.

It is a living document. It begins with the principles that emerged from the review of Make Docs' deterministic logic and is meant to accumulate more over time.

## 1. Recorded versus re-derivable is the test for state

State worth persisting is a recorded decision or piece of evidence that cannot be reconstructed from the repository plus git: a review sign-off, a validation approval, a gate decision. Everything reconstructable from the repository and git is derivation, not state. Persist the former; re-derive the latter on demand. This test is the foundation the rest of these principles build on.

## 2. Deterministic logic earns a CLI or MCP slot only when it must

A deterministic operation earns a place in the Make Docs CLI or MCP surface only when it is one of:

- A fact-of-record: state, as defined in Principle 1, that cannot be re-derived.
- A canonical-identity or parse primitive that is both fiddly enough that agent variance is a real correctness risk and genuinely reused.

Anything else, meaning derivation an agent can do correctly from contracts and files and that is not correctness-critical, does not earn a slot. It belongs in an agent step or a Playbook, guided by structure rather than hardcoded as a script. The goal is to be deliberate and focused about what deterministic logic Make Docs owns, rather than accumulating scripted captures of behaviors that agents can perform correctly on their own.

## 3. Separate state and identity from judgment and derivation

When a piece of logic mixes concerns, split it. Keep the part that is a stable identity or a recorded fact; move the part that is judgment or re-derivation to agents and Playbooks. A worked example: the work-item resolver keeps its coordinate-to-canonical-identity function, because the evidence store needs a stable key and the resolution is error-prone to do by hand, and it drops its select-the-next-incomplete-phase function, because that is re-derivable judgment.

## 4. Discover load-bearing logic empirically; do not predict it

When removing deterministic logic that appears redundant, do not gamble on whether it was quietly load-bearing. Instead, rebuild the behavior as a Playbook, or let agents do it, and let any step that proves painful or error-prone announce itself as a candidate to promote back to a deterministic operation. The rebuild is the discovery mechanism. Because removed logic remains recoverable in version history, promoting a specific step back is cheap and targeted, not a rewrite. This converts the fear of cutting the legs out from under something into a controlled experiment that surfaces genuine dependencies.

## 5. Gate removal on traced invocations, not assumption

Before deleting anything, trace what actually calls it, meaning the skills, MCP tools, and code, rather than inferring that contracts and references must cover the behavior. "It works well without it" is only proven by confirming that nothing was quietly relying on it. This guards against mistaking a good outcome that depended on a script for a good outcome that never needed one.
