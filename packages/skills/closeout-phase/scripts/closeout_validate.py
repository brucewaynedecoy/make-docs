#!/usr/bin/env python3
"""Select and optionally run focused closeout validation commands."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def commands_from_probe(probe: dict[str, Any]) -> list[str]:
    hints = probe.get("validationHints") or []
    commands: list[str] = []
    for command in hints:
        if isinstance(command, str) and command not in commands:
            commands.append(command)
    if "git diff --check" not in commands:
        commands.append("git diff --check")
    return commands


def run_command(repo_root: Path, command: str) -> dict[str, Any]:
    result = subprocess.run(
        command,
        cwd=repo_root,
        shell=True,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return {
        "command": command,
        "returncode": result.returncode,
        "stdout": result.stdout[-4000:],
        "stderr": result.stderr[-4000:],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".", help="Repository root for command execution.")
    parser.add_argument("--probe-json", required=True, help="Path to closeout_probe.py JSON output.")
    parser.add_argument("--run", action="store_true", help="Run commands instead of only printing them.")
    parser.add_argument("--print-only", action="store_true", help="Print selected commands without running them.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    probe = load_json(Path(args.probe_json))
    commands = commands_from_probe(probe)
    output: dict[str, Any] = {"repoRoot": str(repo_root), "commands": commands, "ran": False}

    if args.run:
        output["ran"] = True
        output["results"] = [run_command(repo_root, command) for command in commands]

    print(json.dumps(output, indent=2, sort_keys=True))
    if args.run and any(result["returncode"] != 0 for result in output.get("results", [])):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
