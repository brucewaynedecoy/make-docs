#!/usr/bin/env python3
"""Check whether a work-on-wave phase may be declared complete."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from work_on_wave_common import (
    WaveError,
    changed_files,
    has_code_changes,
    load_state,
    parse_phase,
    phase_key,
    resolve_target,
    state_path_for,
)


def build_gate_report(target: str, commit_policy: str | None = None) -> dict[str, object]:
    resolution = resolve_target(target)
    phase_path = resolution.get("phasePath")
    if not phase_path:
        raise WaveError("No phase path resolved for phase gate.")
    phase = parse_phase(Path(str(phase_path)))
    state = load_state(state_path_for(resolution)) or {}
    key = phase_key(phase_path)
    phase_state = state.get("phases", {}).get(key, {})
    policy = commit_policy or state.get("commitPolicy") or "commit-required"
    blockers: list[str] = []

    if phase["uncheckedTasks"]:
        blockers.append(f"{len(phase['uncheckedTasks'])} unchecked task(s) remain in the phase doc")

    validation = phase_state.get("validation", {})
    if validation.get("status") != "passed":
        blockers.append("validation has not been recorded as passed")

    repo_root = Path(resolution["repoRoot"])
    files = changed_files(repo_root)
    review = phase_state.get("review", {})
    review_required = bool(review.get("required")) or has_code_changes(files)
    if review_required and review.get("status") not in {"passed", "waived"}:
        blockers.append("code review is required and has not passed or been waived")

    closeout = phase_state.get("closeout", {})
    if closeout.get("status") != "passed":
        blockers.append("closeout-phase has not been recorded as passed")

    commit = phase_state.get("commit", {})
    if policy == "commit-required" and not (commit.get("status") == "passed" and commit.get("sha")):
        blockers.append("phase commit is required but no committed SHA is recorded")
    if policy == "commit-and-push":
        if not (commit.get("status") == "passed" and commit.get("sha")):
            blockers.append("phase commit is required but no committed SHA is recorded")
        if phase_state.get("push", {}).get("status") != "passed":
            blockers.append("phase push is required but is not recorded as passed")

    return {
        "phasePath": phase_path,
        "commitPolicy": policy,
        "status": "passed" if not blockers else "blocked",
        "blockers": blockers,
        "state": phase_state,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument(
        "--commit-policy",
        choices=["draft-only", "commit-required", "commit-and-push"],
        help="Override state commit policy.",
    )
    args = parser.parse_args()

    try:
        print(json.dumps(build_gate_report(args.target, args.commit_policy), indent=2, sort_keys=True))
    except WaveError as error:
        parser.exit(2, f"phase_gate: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
