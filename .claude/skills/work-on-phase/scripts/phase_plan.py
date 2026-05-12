#!/usr/bin/env python3
"""Produce a deterministic implementation brief for a docs/work phase."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from work_on_wave_common import WaveError, parse_phase, resolve_target


def build_plan(target: str) -> dict[str, object]:
    resolution = resolve_target(target)
    phase_path = resolution.get("phasePath")
    if not phase_path:
        raise WaveError("No incomplete phase found for this target.")
    phase = parse_phase(Path(str(phase_path)))
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
        "warnings": phase["warnings"],
        "parallelization": parallelization_for(phase),
    }


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
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", help="Wave/phase coordinate or docs/work path.")
    parser.add_argument("--json", action="store_true", help="Emit structured JSON instead of Markdown.")
    args = parser.parse_args()

    try:
        plan = build_plan(args.target)
        print(json.dumps(plan, indent=2, sort_keys=True) if args.json else render_markdown(plan))
    except WaveError as error:
        parser.exit(2, f"phase_plan: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
