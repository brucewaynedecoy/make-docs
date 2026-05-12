#!/usr/bin/env python3
"""Produce a deterministic implementation brief for a docs/work phase."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from work_on_wave_common import WaveError, parse_phase, resolve_target, target_from_parts


NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
}
COUNT_RE = re.compile(
    r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+"
    r"(?:crate\s+)?(?:stub|stubs|task|tasks|phase\s+output|phase\s+outputs)\b",
    re.IGNORECASE,
)


def build_plan(target: str) -> dict[str, object]:
    resolution = resolve_target(target)
    phase_path = resolution.get("phasePath")
    if not phase_path:
        raise WaveError("No incomplete phase found for this target.")
    phase = parse_phase(Path(str(phase_path)))
    warnings = list(phase["warnings"])
    warnings.extend(consistency_warnings(Path(str(phase_path)), phase))
    return {
        "target": target,
        "mode": resolution["mode"],
        "waveDir": resolution["waveDir"],
        "phasePath": phase_path,
        "title": phase["title"],
        "coordinate": phase["coordinate"],
        "stages": phase["stages"],
        "dependencies": phase["dependencies"],
        "validationCommands": phase["validationCommands"],
        "declaredPaths": phase["declaredPaths"],
        "warnings": warnings,
        "parallelization": parallelization_for(phase),
    }


def count_value(raw: str) -> int:
    if raw.isdigit():
        return int(raw)
    return NUMBER_WORDS[raw.lower()]


def linked_markdown_docs(phase_path: Path, phase: dict[str, object]) -> list[Path]:
    docs: list[Path] = []
    for raw in phase.get("sourceLinks", []):
        if not isinstance(raw, str) or not raw.endswith(".md"):
            continue
        candidate = (phase_path.parent / raw).resolve()
        if candidate.exists() and candidate not in docs:
            docs.append(candidate)
    return docs


def consistency_warnings(phase_path: Path, phase: dict[str, object]) -> list[str]:
    task_count = len(phase.get("tasks", []))
    warnings: list[str] = []
    for doc in linked_markdown_docs(phase_path, phase):
        try:
            text = doc.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for match in COUNT_RE.finditer(text):
            expected = count_value(match.group(1))
            if expected != task_count:
                rel = doc.as_posix()
                warnings.append(
                    f"linked source {rel} mentions {expected} expected item(s), but this phase has {task_count} task(s)"
                )
                break
    return warnings


def parallelization_for(phase: dict[str, object]) -> list[str]:
    stages = phase.get("stages", [])
    if not isinstance(stages, list):
        return []
    dependencies = phase.get("dependencies", [])
    dependency_text = " ".join(
        str(item.get("text", "")).lower()
        for item in dependencies
        if isinstance(item, dict)
    )
    if "depend" in dependency_text or "stage" in dependency_text:
        return [
            "Explicit dependency notes are present; implement dependency gates serially first, then parallelize only clearly disjoint tasks.",
        ]
    independent = [
        stage["name"]
        for stage in stages
        if isinstance(stage, dict)
        and stage.get("tasks")
        and not any(
            "depend" in str(item.get("text", "")).lower()
            for item in stage.get("acceptanceCriteria", [])
            if isinstance(item, dict)
        )
    ]
    if len(independent) <= 1:
        return ["Implement serially unless the phase dependency notes identify disjoint work."]
    return [
        "Candidate parallel stages: " + ", ".join(independent),
        "Keep worker write scopes disjoint and integrate through the coordinator.",
    ]


def render_markdown(plan: dict[str, object]) -> str:
    lines = [
        f"# Phase Plan: {plan['title']}",
        "",
        f"- Phase: `{plan['phasePath']}`",
        f"- Mode: `{plan['mode']}`",
        "",
        "## Stages",
    ]
    for stage in plan["stages"]:  # type: ignore[index]
        lines.append(f"- {stage['name']}: {len(stage['tasks'])} task(s), {len(stage['acceptanceCriteria'])} acceptance item(s)")
    lines.extend(["", "## Dependencies"])
    dependencies = plan["dependencies"]  # type: ignore[index]
    if dependencies:
        for item in dependencies:
            lines.append(f"- {item['text']}")
    else:
        lines.append("- No explicit dependency bullets found.")
    lines.extend(["", "## Validation"])
    commands = plan["validationCommands"]  # type: ignore[index]
    if commands:
        for item in commands:
            lines.append(f"- `{item['command']}`")
    else:
        lines.append("- No explicit validation commands found; derive focused validation from touched code/docs.")
    lines.extend(["", "## Scope Hints"])
    paths = plan["declaredPaths"]  # type: ignore[index]
    if paths:
        for path in paths:
            lines.append(f"- `{path}`")
    else:
        lines.append("- No declared file paths found in the phase.")
    lines.extend(["", "## Parallelization"])
    for item in plan["parallelization"]:  # type: ignore[index]
        lines.append(f"- {item}")
    warnings = plan["warnings"]  # type: ignore[index]
    if warnings:
        lines.extend(["", "## Consistency Warnings"])
        for warning in warnings:
            lines.append(f"- {warning}")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="+", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--json", action="store_true", help="Emit structured JSON instead of Markdown.")
    args = parser.parse_args()

    try:
        plan = build_plan(target_from_parts(args.target))
        print(json.dumps(plan, indent=2, sort_keys=True) if args.json else render_markdown(plan))
    except WaveError as error:
        parser.exit(2, f"phase_plan: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
