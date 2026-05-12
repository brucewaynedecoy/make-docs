#!/usr/bin/env python3
"""Detect changed files outside the current work-on-wave phase scope."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from work_on_wave_common import WaveError, changed_files, parse_phase, resolve_target, target_from_parts


LOCKFILE_MANIFESTS = {
    "Cargo.lock": ("Cargo.toml",),
    "package-lock.json": ("package.json",),
    "pnpm-lock.yaml": ("package.json", "pnpm-workspace.yaml"),
    "yarn.lock": ("package.json",),
    "bun.lockb": ("package.json",),
}


def is_allowed(path: str, allowed: list[str], wave_slug: str, phase_path: str) -> bool:
    normalized = path.strip("/")
    if normalized == phase_path or normalized.startswith(f"docs/work/{wave_slug}/"):
        return True
    if normalized.startswith(("docs/assets/history/", "docs/guides/")):
        return True
    for item in allowed:
        clean = item.strip("/")
        if clean.startswith("./"):
            clean = clean[2:]
        if not clean:
            continue
        if normalized == clean or normalized.startswith(clean.rstrip("/") + "/"):
            return True
    return False


def derived_reason(path: str, files: list[str]) -> str | None:
    name = Path(path).name
    manifests = LOCKFILE_MANIFESTS.get(name)
    if not manifests:
        return None
    normalized_files = {file.strip("/") for file in files}
    parent = Path(path).parent.as_posix()
    for manifest in manifests:
        candidate = f"{parent}/{manifest}" if parent != "." else manifest
        if candidate in normalized_files:
            return f"{name} is derived from changed dependency manifest {candidate}"
    return None


def managed_state_reason(path: str, wave_slug: str) -> str | None:
    normalized = path.strip("/")
    expected_prefix = f".make-docs/runs/{wave_slug}/"
    if normalized.startswith(expected_prefix) and normalized.endswith("/state.json"):
        return "managed work-on-phase checkpoint state"
    return None


def build_scope_report(target: str, explicit_changed: list[str] | None = None) -> dict[str, object]:
    resolution = resolve_target(target)
    phase_path = resolution.get("phasePath")
    if not phase_path:
        raise WaveError("No phase path resolved for scope guard.")
    repo_root = Path(resolution["repoRoot"])
    phase = parse_phase(Path(str(phase_path)))
    phase_relative = Path(str(phase_path)).relative_to(repo_root).as_posix()
    allowed = list(phase["declaredPaths"])
    files = explicit_changed if explicit_changed is not None else changed_files(repo_root)
    out_of_scope = []
    allowed_derived = []
    for file in files:
        if is_allowed(file, allowed, resolution["waveSlug"], phase_relative):
            continue
        reason = managed_state_reason(file, resolution["waveSlug"]) or derived_reason(file, files)
        if reason:
            allowed_derived.append({"path": file, "reason": reason})
            continue
        out_of_scope.append(file)
    return {
        "phasePath": phase_path,
        "declaredPaths": allowed,
        "changedFiles": files,
        "allowedDerived": allowed_derived,
        "outOfScope": out_of_scope,
        "status": "passed" if not out_of_scope else "warning",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="+", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--changed", action="append", help="Changed path override for tests/smoke runs.")
    args = parser.parse_args()

    try:
        print(json.dumps(build_scope_report(target_from_parts(args.target), args.changed), indent=2, sort_keys=True))
    except WaveError as error:
        parser.exit(2, f"scope_guard: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
