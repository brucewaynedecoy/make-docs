#!/usr/bin/env python3
"""Shared helpers for the implement-wave skill scripts."""

from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


WR_COORD_RE = re.compile(r"\bw\s*(\d+)\s*r\s*(\d+)(?:\s*p\s*(\d+))?\b", re.IGNORECASE)
WR_DIR_RE = re.compile(r"w(\d+)-r(\d+)", re.IGNORECASE)
PHASE_FILE_RE = re.compile(r"^(0[1-9]|[1-9]\d)-(.+)\.md$")
TASK_RE = re.compile(r"^- \[([ xX])\] (t[1-9]\d*):\s*(.+)$")
ACCEPTANCE_CHECKBOX_RE = re.compile(r"^- \[[ xX]\]\s+")
PATHLIKE_RE = re.compile(
    r"`((?:\.?[A-Za-z0-9_-]+/)[A-Za-z0-9_./@+-]+|[A-Za-z0-9_.-]+\.(?:ts|tsx|js|mjs|py|rs|md|json|yaml|yml|toml|sh))`"
)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")


class WaveError(RuntimeError):
    """Expected user-facing failure."""


def find_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    for candidate in [current, *current.parents]:
        if (candidate / "docs" / "work").exists() or (candidate / ".git").exists():
            return candidate
    return current


def phase_sort_key(path: Path) -> tuple[int, str]:
    match = PHASE_FILE_RE.match(path.name)
    return (int(match.group(1)) if match else 999, path.name)


def phase_number(path: Path) -> int | None:
    match = PHASE_FILE_RE.match(path.name)
    return int(match.group(1)) if match else None


def phase_docs(wave_dir: Path) -> list[Path]:
    return sorted(
        [
            path
            for path in wave_dir.glob("*.md")
            if PHASE_FILE_RE.match(path.name) and not path.name.startswith("00-")
        ],
        key=phase_sort_key,
    )


def coordinate_for_path(path: Path) -> dict[str, int | None]:
    wr = WR_DIR_RE.search(path.as_posix())
    return {
        "w": int(wr.group(1)) if wr else None,
        "r": int(wr.group(2)) if wr else None,
        "p": phase_number(path) if path.is_file() else None,
    }


def parse_phase(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    title = next((line[2:].strip() for line in lines if line.startswith("# ")), path.stem)
    tasks: list[dict[str, Any]] = []
    acceptance: list[dict[str, Any]] = []
    dependencies: list[dict[str, Any]] = []
    validation_commands: list[dict[str, Any]] = []
    declared_paths: set[str] = set()
    links: set[str] = set()
    stages: dict[str, dict[str, Any]] = {}
    heading_stack: list[tuple[int, str]] = []

    for index, line in enumerate(lines, start=1):
        if heading_match := HEADING_RE.match(line):
            level = len(heading_match.group(1))
            title_text = heading_match.group(2).strip()
            heading_stack = [item for item in heading_stack if item[0] < level]
            heading_stack.append((level, title_text))
            if level == 2 and title_text.lower().startswith("stage "):
                stages.setdefault(title_text, {"tasks": [], "acceptanceCriteria": []})
            continue

        current_h2 = next((title for level, title in reversed(heading_stack) if level == 2), "")
        current_h3 = next((title for level, title in reversed(heading_stack) if level == 3), "")
        section = current_h3.lower()

        if match := TASK_RE.match(line):
            task = {
                "id": match.group(2),
                "checked": match.group(1).lower() == "x",
                "text": match.group(3).strip(),
                "line": index,
                "stage": current_h2,
                "section": current_h3,
            }
            tasks.append(task)
            stages.setdefault(current_h2 or "Unstaged", {"tasks": [], "acceptanceCriteria": []})[
                "tasks"
            ].append(task)

        if section == "acceptance criteria" and line.startswith("- "):
            item = {
                "text": line[2:].strip(),
                "line": index,
                "usesCheckbox": bool(ACCEPTANCE_CHECKBOX_RE.match(line)),
                "stage": current_h2,
            }
            acceptance.append(item)
            stages.setdefault(current_h2 or "Unstaged", {"tasks": [], "acceptanceCriteria": []})[
                "acceptanceCriteria"
            ].append(item)

        if section == "dependencies" and line.startswith("- "):
            dependencies.append({"text": line[2:].strip(), "line": index, "stage": current_h2})

        if section in {"validation commands", "validation", "checks"}:
            stripped = line.strip()
            if stripped.startswith("- `") and stripped.endswith("`"):
                validation_commands.append(
                    {"command": stripped[3:-1].strip(), "line": index, "stage": current_h2}
                )
            elif stripped.startswith("`") and stripped.endswith("`"):
                validation_commands.append(
                    {"command": stripped[1:-1].strip(), "line": index, "stage": current_h2}
                )

        for path_match in PATHLIKE_RE.finditer(line):
            declared_paths.add(path_match.group(1))
        for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", line):
            if not link.startswith(("http://", "https://", "#", "mailto:")):
                links.add(link)
                if "/" in link and not link.startswith("../"):
                    declared_paths.add(link)

    stage_list = [
        {"name": name, "tasks": data["tasks"], "acceptanceCriteria": data["acceptanceCriteria"]}
        for name, data in stages.items()
        if name
    ]
    unchecked = [task for task in tasks if not task["checked"]]
    return {
        "path": path.as_posix(),
        "title": title,
        "coordinate": coordinate_for_path(path),
        "tasks": tasks,
        "uncheckedTasks": unchecked,
        "acceptanceCriteria": acceptance,
        "dependencies": dependencies,
        "validationCommands": validation_commands,
        "declaredPaths": sorted(declared_paths),
        "sourceLinks": sorted(links),
        "stages": stage_list,
        "isComplete": bool(tasks) and not unchecked,
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


def resolve_target(target: str, repo_root: Path | None = None) -> dict[str, Any]:
    root = find_repo_root(repo_root)
    raw = target.strip()
    candidate = (root / raw).resolve() if not Path(raw).is_absolute() else Path(raw).resolve()
    if candidate.exists():
        return resolve_path(candidate, find_repo_root(candidate.parent))

    coord = WR_COORD_RE.search(raw)
    if not coord:
        raise WaveError(f"Could not parse target `{target}` as a coordinate or path.")
    wave = int(coord.group(1))
    revision = int(coord.group(2))
    phase = int(coord.group(3)) if coord.group(3) else None
    work_root = root / "docs" / "work"
    matches = sorted(
        [
            path
            for path in work_root.glob("*")
            if path.is_dir() and re.search(fr"w0*{wave}-r0*{revision}\b", path.name, re.IGNORECASE)
        ]
    )
    if not matches:
        raise WaveError(f"No docs/work wave directory found for W{wave} R{revision}.")
    if len(matches) > 1:
        raise WaveError(
            "Ambiguous wave coordinate; candidates: "
            + ", ".join(path.relative_to(root).as_posix() for path in matches)
        )
    wave_dir = matches[0]
    phases = phase_docs(wave_dir)
    phase_doc = None
    mode = "wave"
    if phase is not None:
        mode = "phase"
        phase_matches = [path for path in phases if phase_number(path) == phase]
        if not phase_matches:
            raise WaveError(f"No phase P{phase} found under {wave_dir.relative_to(root)}.")
        phase_doc = phase_matches[0]
    else:
        phase_doc = next((path for path in phases if not parse_phase(path)["isComplete"]), None)

    return build_resolution(root, wave_dir, phases, phase_doc, mode, raw)


def resolve_path(path: Path, repo_root: Path) -> dict[str, Any]:
    root = find_repo_root(repo_root)
    if path.is_file():
        wave_dir = path.parent
        phases = phase_docs(wave_dir)
        return build_resolution(root, wave_dir, phases, path, "phase", path.as_posix())
    if path.is_dir():
        phases = phase_docs(path)
        phase_doc = next((phase for phase in phases if not parse_phase(phase)["isComplete"]), None)
        return build_resolution(root, path, phases, phase_doc, "wave", path.as_posix())
    raise WaveError(f"Path does not resolve to a wave directory or phase file: {path}")


def build_resolution(
    root: Path,
    wave_dir: Path,
    phases: list[Path],
    phase_doc: Path | None,
    mode: str,
    target: str,
) -> dict[str, Any]:
    return {
        "target": target,
        "mode": mode,
        "repoRoot": root.as_posix(),
        "waveDir": wave_dir.as_posix(),
        "waveSlug": wave_dir.name,
        "phasePath": phase_doc.as_posix() if phase_doc else None,
        "coordinate": coordinate_for_path(phase_doc or wave_dir),
        "phases": [
            {
                "path": path.as_posix(),
                "phase": phase_number(path),
                "title": parse_phase(path)["title"],
                "isComplete": parse_phase(path)["isComplete"],
                "uncheckedTaskCount": len(parse_phase(path)["uncheckedTasks"]),
            }
            for path in phases
        ],
    }


def state_path_for(resolution: dict[str, Any]) -> Path:
    return Path(resolution["repoRoot"]) / ".make-docs" / "runs" / resolution["waveSlug"] / "state.json"


def load_state(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def run_git(repo_root: Path, args: list[str]) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise WaveError(result.stderr.strip() or result.stdout.strip() or "git command failed")
    return result.stdout


def changed_files(repo_root: Path) -> list[str]:
    output = run_git(repo_root, ["status", "--porcelain"])
    files: list[str] = []
    for line in output.splitlines():
        if not line:
            continue
        path = line[3:]
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        files.append(path)
    return sorted(set(files))


def phase_key(path: str | Path | None) -> str:
    if not path:
        return "wave"
    return Path(path).name


def has_code_changes(files: list[str]) -> bool:
    code_suffixes = {
        ".ts",
        ".tsx",
        ".js",
        ".mjs",
        ".cjs",
        ".py",
        ".rs",
        ".go",
        ".java",
        ".rb",
        ".sh",
        ".swift",
        ".kt",
        ".cs",
        ".php",
    }
    return any(Path(file).suffix in code_suffixes for file in files)
