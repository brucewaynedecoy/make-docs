#!/usr/bin/env python3
"""Resolve a docs/work wave or phase coordinate for work-on-wave."""

from __future__ import annotations

import argparse
import json

from work_on_wave_common import WaveError, resolve_target, target_from_parts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="+", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--json", action="store_true", help="Emit JSON. Default is JSON.")
    args = parser.parse_args()

    try:
        print(json.dumps(resolve_target(target_from_parts(args.target)), indent=2, sort_keys=True))
    except WaveError as error:
        parser.exit(2, f"resolve_wave: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
