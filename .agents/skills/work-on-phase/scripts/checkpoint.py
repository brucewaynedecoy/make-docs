#!/usr/bin/env python3
"""Create or update lazy work-on-wave run state under .make-docs/runs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from work_on_wave_common import (
    WaveError,
    load_state,
    phase_key,
    resolve_target,
    save_state,
    state_path_for,
    target_from_parts,
    utc_now,
)


def build_checkpoint(args: argparse.Namespace) -> dict[str, Any]:
    resolution = resolve_target(args.target)
    state_path = state_path_for(resolution)
    state = load_state(state_path) or {
        "schemaVersion": 1,
        "phases": {},
        "createdAt": utc_now(),
    }
    state["updatedAt"] = utc_now()
    state["waveSlug"] = resolution["waveSlug"]
    state["waveDir"] = resolution["waveDir"]
    state["target"] = resolution["target"]
    state["coordinate"] = resolution["coordinate"]
    state["mode"] = args.mode or resolution["mode"]
    state["commitPolicy"] = args.commit_policy or state.get("commitPolicy") or "commit-required"
    state["nextPhasePath"] = resolution["phasePath"]
    state["activePhasePath"] = args.phase or resolution.get("phasePath")

    key = phase_key(args.phase or resolution.get("phasePath"))
    phase_state = state.setdefault("phases", {}).setdefault(key, {})
    phase_state["phasePath"] = args.phase or resolution.get("phasePath")
    if args.status:
        phase_state["status"] = args.status
    if args.note:
        phase_state.setdefault("notes", []).append({"at": utc_now(), "text": args.note})
    if args.validation_status or args.validation_command:
        validation = phase_state.setdefault("validation", {})
        if args.validation_status:
            validation["status"] = args.validation_status
        if args.validation_command:
            validation["commands"] = args.validation_command
    if args.review_status or args.review_required is not None:
        review = phase_state.setdefault("review", {})
        if args.review_status:
            review["status"] = args.review_status
        if args.review_required is not None:
            review["required"] = args.review_required
    if args.closeout_status:
        phase_state.setdefault("closeout", {})["status"] = args.closeout_status
    if args.commit_status or args.commit_sha:
        commit = phase_state.setdefault("commit", {})
        if args.commit_status:
            commit["status"] = args.commit_status
        if args.commit_sha:
            commit["sha"] = args.commit_sha
    if args.push_status:
        phase_state.setdefault("push", {})["status"] = args.push_status

    save_state(state_path, state)
    return {"statePath": state_path.as_posix(), "state": state}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="+", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--phase", help="Explicit phase path to update in state.")
    parser.add_argument("--mode", choices=["wave", "phase"])
    parser.add_argument(
        "--commit-policy",
        choices=["draft-only", "commit-required", "commit-and-push"],
    )
    parser.add_argument("--status", choices=["planned", "in-progress", "blocked", "complete"])
    parser.add_argument("--validation-status", choices=["pending", "passed", "failed"])
    parser.add_argument("--validation-command", action="append")
    parser.add_argument("--review-status", choices=["not-required", "pending", "passed", "waived", "failed"])
    parser.add_argument("--review-required", action=argparse.BooleanOptionalAction)
    parser.add_argument("--closeout-status", choices=["pending", "passed", "failed"])
    parser.add_argument("--commit-status", choices=["pending", "passed", "skipped", "failed"])
    parser.add_argument("--commit-sha")
    parser.add_argument("--push-status", choices=["pending", "passed", "skipped", "failed"])
    parser.add_argument("--note")
    args = parser.parse_args()

    try:
        args.target = target_from_parts(args.target)
        print(json.dumps(build_checkpoint(args), indent=2, sort_keys=True))
    except WaveError as error:
        parser.exit(2, f"checkpoint: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
