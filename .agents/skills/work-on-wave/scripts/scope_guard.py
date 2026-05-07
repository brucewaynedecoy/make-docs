#!/usr/bin/env python3
"""Detect changed files outside the current work-on-wave phase scope."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from work_on_wave_common import WaveError, changed_files, parse_phase, resolve_target


def is_allowed(path: str, allowed: list[str], wave_slug: str, phase_path: str) -> bool:
    normalized = path.strip("/")
    if normalized == phase_path or normalized.startswith(f"docs/work/{wave_slug}/"):
        return True
    if normalized.startswith(("docs/assets/history/", "docs/guides/")):
        return True
    for item in allowed:
        clean = item.strip("./")
        if not clean:
            continue
        if normalized == clean or normalized.startswith(clean.rstrip("/") + "/"):
            return True
    return False


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
    out_of_scope = [
        file
        for file in files
        if not is_allowed(file, allowed, resolution["waveSlug"], phase_relative)
    ]
    return {
        "phasePath": phase_path,
        "declaredPaths": allowed,
        "changedFiles": files,
        "outOfScope": out_of_scope,
        "status": "passed" if not out_of_scope else "warning",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--changed", action="append", help="Changed path override for tests/smoke runs.")
    args = parser.parse_args()

    try:
        print(json.dumps(build_scope_report(args.target, args.changed), indent=2, sort_keys=True))
    except WaveError as error:
        parser.exit(2, f"scope_guard: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
