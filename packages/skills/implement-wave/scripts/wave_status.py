#!/usr/bin/env python3
"""Report implement-wave progress for a docs/work wave or phase."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from implement_wave_common import WaveError, load_state, parse_phase, resolve_target, state_path_for


def build_status(target: str) -> dict[str, object]:
    resolution = resolve_target(target)
    phases = []
    for item in resolution["phases"]:
        phase_state = parse_phase(Path(item["path"]))
        phases.append(
            {
                **item,
                "taskCount": len(phase_state["tasks"]),
                "uncheckedTasks": phase_state["uncheckedTasks"],
                "warnings": phase_state["warnings"],
            }
        )
    state_path = state_path_for(resolution)
    return {
        "resolution": resolution,
        "phases": phases,
        "nextPhasePath": resolution["phasePath"],
        "statePath": state_path.as_posix(),
        "state": load_state(state_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--json", action="store_true", help="Emit JSON. Default is JSON.")
    args = parser.parse_args()

    try:
        print(json.dumps(build_status(args.target), indent=2, sort_keys=True))
    except WaveError as error:
        parser.exit(2, f"wave_status: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
