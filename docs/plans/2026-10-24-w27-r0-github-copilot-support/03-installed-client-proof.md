---
title: "W27 R0 P3 Installed Client Proof"
kind: "plan"
status: "draft"
coordinate: "W27 R0 P3"
---

# W27 R0 P3 Installed Client Proof

## Purpose

Prove the supported behavior in real GitHub Copilot CLI and app sessions.

## Proof Matrix

For each client, record the installed version, host platform, package build, native entry source, connection identity, tool list, allowed Store read, denied Store write or wrong target, Store-free resource read, and recovery text. Check sandbox use in the CLI and the app where available. Check project trust and a same-name project entry. Do not use a CLI pass to claim an app pass.

## Lifecycle Proof

Apply in a disposable profile. Repeat setup without change. Change the owned entry and detect drift. Remove or disable it and show that access stops. Repair only after review. Rotate the connection key and show that the old key fails. Remove Make Docs-owned state and show that unrelated servers stay in place. Keep logs redacted.

## Release Gate

Run build, type, focused and package tests, plus platform checks for each claimed host. Review the real setup text against the Human Experience promises. Give a short optional normal-use handoff. Record gaps and leave any unproved client or platform blocked. Ask for separate commit, push, PR, or installed-connection approval when those actions are requested.
