#!/usr/bin/env python3
"""Parse a work backlog phase into compact closeout state JSON."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


WR_RE = re.compile(r"w(\d+)-r(\d+)", re.IGNORECASE)
PHASE_FILE_RE = re.compile(r"^(0[1-9]|[1-9]\d)-")
TASK_RE = re.compile(r"^- \[([ xX])\] (t[1-9]\d*):\s*(.+)$")
ACCEPTANCE_CHECKBOX_RE = re.compile(r"^- \[[ xX]\]\s+")


def coordinate_for_path(path: Path) -> dict[str, int | None]:
    as_posix = path.as_posix()
    wr = WR_RE.search(as_posix)
    phase = PHASE_FILE_RE.match(path.name)
    return {
        "w": int(wr.group(1)) if wr else None,
        "r": int(wr.group(2)) if wr else None,
        "p": int(phase.group(1)) if phase else None,
    }


def parse_phase(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    title = next((line[2:].strip() for line in lines if line.startswith("# ")), path.stem)

    tasks: list[dict[str, Any]] = []
    acceptance: list[dict[str, Any]] = []
    links: list[str] = []
    current_h2 = ""
    current_h3 = ""

    for index, line in enumerate(lines, start=1):
        if line.startswith("## "):
            current_h2 = line[3:].strip()
            current_h3 = ""
            continue
        if line.startswith("### "):
            current_h3 = line[4:].strip()
            continue
        if match := TASK_RE.match(line):
            tasks.append(
                {
                    "id": match.group(2),
                    "checked": match.group(1).lower() == "x",
                    "text": match.group(3).strip(),
                    "line": index,
                    "stage": current_h2,
                    "section": current_h3,
                }
            )
            continue
        if current_h3.lower() == "acceptance criteria" and line.startswith("- "):
            acceptance.append(
                {
                    "text": line[2:].strip(),
                    "line": index,
                    "usesCheckbox": bool(ACCEPTANCE_CHECKBOX_RE.match(line)),
                    "stage": current_h2,
                }
            )
        for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", line):
            if not link.startswith(("http://", "https://", "#", "mailto:")):
                links.append(link)

    return {
        "path": path.as_posix(),
        "title": title,
        "coordinate": coordinate_for_path(path),
        "tasks": tasks,
        "uncheckedTasks": [task for task in tasks if not task["checked"]],
        "acceptanceCriteria": acceptance,
        "sourceLinks": sorted(set(links)),
        "warnings": warnings_for(tasks, acceptance),
    }


def warnings_for(tasks: list[dict[str, Any]], acceptance: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    expected = 1
    seen: set[str] = set()
    for task in tasks:
        task_id = task["id"]
        if task_id in seen:
            warnings.append(f"duplicate task id {task_id}")
        seen.add(task_id)
        if task_id != f"t{expected}":
            warnings.append(f"expected task id t{expected}, found {task_id}")
        expected += 1
    if any(item["usesCheckbox"] for item in acceptance):
        warnings.append("acceptance criteria contains checkbox syntax")
    return warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase_path", help="Path to a docs/work phase markdown file.")
    parser.add_argument("--json", action="store_true", help="Emit JSON. Present for readability.")
    args = parser.parse_args()

    print(json.dumps(parse_phase(Path(args.phase_path)), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
