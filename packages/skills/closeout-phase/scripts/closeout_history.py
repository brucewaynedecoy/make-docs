#!/usr/bin/env python3
"""Create a closeout history-entry skeleton from probe data."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path
from typing import Any


SLUG_RE = re.compile(r"[^a-z0-9]+")


def load_json(path: str | None) -> dict[str, Any]:
    if not path:
        return {}
    return json.loads(Path(path).read_text(encoding="utf-8"))


def slugify(value: str) -> str:
    slug = SLUG_RE.sub("-", value.lower()).strip("-")
    return slug or "closeout"


def coordinate_label(probe: dict[str, Any], phase: dict[str, Any]) -> str:
    coordinate = phase.get("coordinate")
    if coordinate:
        parts = [f"W{coordinate.get('w')}", f"R{coordinate.get('r')}"]
        if coordinate.get("p") is not None:
            parts.append(f"P{coordinate.get('p')}")
        return " ".join(part for part in parts if "None" not in part)
    for item in probe.get("coordinates", []):
        if item.get("w") is not None and item.get("r") is not None:
            parts = [f"W{item['w']}", f"R{item['r']}"]
            if item.get("p") is not None:
                parts.append(f"P{item['p']}")
            return " ".join(parts)
    return "Uncoordinated"


def coordinate_slug(probe: dict[str, Any], phase: dict[str, Any]) -> str | None:
    coordinate = phase.get("coordinate")
    if coordinate and coordinate.get("w") is not None and coordinate.get("r") is not None:
        parts = [f"w{coordinate['w']}", f"r{coordinate['r']}"]
        if coordinate.get("p") is not None:
            parts.append(f"p{coordinate['p']}")
        return "-".join(parts)
    for item in probe.get("coordinates", []):
        if item.get("w") is not None and item.get("r") is not None:
            parts = [f"w{item['w']}", f"r{item['r']}"]
            if item.get("p") is not None:
                parts.append(f"p{item['p']}")
            return "-".join(parts)
    return None


def history_filename(mode: str, date: str, title: str, probe: dict[str, Any], phase: dict[str, Any]) -> str:
    title_slug = slugify(title)
    if mode == "phase":
        coord = coordinate_slug(probe, phase)
        if coord:
            return f"{date}-{coord}-{title_slug}.md"
    return f"{date}-{title_slug}.md"


def default_title(mode: str, probe: dict[str, Any], phase: dict[str, Any]) -> str:
    if phase.get("title"):
        return f"{phase['title']} Closeout"
    files = probe.get("files", [])
    if files:
        first = Path(files[0]["path"]).stem.replace("-", " ")
        return f"{first.title()} Closeout"
    return "Closeout"


def render_history(
    mode: str,
    title: str,
    date: str,
    probe: dict[str, Any],
    phase: dict[str, Any],
) -> str:
    coordinate = coordinate_label(probe, phase)
    files = [file["path"] for file in probe.get("files", [])]
    validations = probe.get("validationHints", ["git diff --check"])
    task_lines: list[str] = []
    for task in phase.get("tasks", []):
        marker = "checked" if task.get("checked") else "unchecked"
        task_lines.append(f"- `{task.get('id')}` {marker}: {task.get('text')}")
    if not task_lines and mode == "phase":
        task_lines.append("- No phase task data was available from the probe.")

    file_lines = [f"- `{path}`" for path in files] or ["- No changed files were reported by the probe."]
    validation_lines = [f"- `{command}`" for command in validations]

    sections = [
        "---",
        f"date: {date}",
        f"coordinate: {coordinate}",
        f"closeout: {mode}",
        "---",
        "",
        f"# {title}",
        "",
        "## Purpose",
        "",
        "Document the closeout decisions for the current change set before drafting the commit message.",
        "",
        "## Changes",
        "",
        *file_lines,
        "",
    ]
    if mode == "phase":
        sections.extend(["## Task Status", "", *task_lines, ""])
    sections.extend(
        [
            "## Gap Decisions",
            "",
            "No novel gaps were found.",
            "",
            "## Guide Decisions",
            "",
            "No new developer guide was needed. No new user guide was needed.",
            "",
            "## Validation",
            "",
            *validation_lines,
            "",
            "## Commit Message Source",
            "",
            "Use the repository commit-message convention and this history entry as the source for the draft.",
            "",
            "## Links",
            "",
            "- Add relevant PRD, plan, work, guide, or archive links before finalizing closeout.",
            "",
        ]
    )
    return "\n".join(sections)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".", help="Repository root.")
    parser.add_argument("--mode", choices=["commit", "phase"], required=True)
    parser.add_argument("--probe-json", help="Path to closeout_probe.py JSON output.")
    parser.add_argument("--phase-json", help="Path to work_phase_state.py JSON output.")
    parser.add_argument("--title", help="History entry title.")
    parser.add_argument("--date", default=dt.date.today().isoformat(), help="Date prefix.")
    parser.add_argument("--output-dir", default="docs/assets/history", help="History directory.")
    parser.add_argument("--write", action="store_true", help="Write the skeleton file.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    probe = load_json(args.probe_json)
    phase = load_json(args.phase_json)
    title = args.title or default_title(args.mode, probe, phase)
    contents = render_history(args.mode, title, args.date, probe, phase)
    output_path = repo_root / args.output_dir / history_filename(
        args.mode, args.date, title, probe, phase
    )

    result = {"path": str(output_path), "wrote": False, "contents": contents}
    if args.write:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        if output_path.exists():
            result["contents"] = output_path.read_text(encoding="utf-8")
        else:
            output_path.write_text(contents, encoding="utf-8")
            result["wrote"] = True

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
