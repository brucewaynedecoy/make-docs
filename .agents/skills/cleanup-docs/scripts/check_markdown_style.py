#!/usr/bin/env python3
"""Report and optionally fix Markdown source-formatting drift."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path


FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
LIST_RE = re.compile(
    r"^(?P<indent>[ \t]*)(?P<marker>(?:[-+*]|\d+[.)]))[ \t]+"
    r"(?:(?P<task>\[[ xX]\])[ \t]+)?(?P<text>.*)$"
)
HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+")
HTML_COMMENT_RE = re.compile(r"^\s*<!--.*-->\s*$")


@dataclass
class Finding:
    path: str
    line: int
    rule: str
    message: str
    text: str


def markdown_files(scopes: list[Path]) -> list[Path]:
    files: list[Path] = []
    for scope in scopes:
        if scope.is_file() and scope.suffix.lower() == ".md":
            files.append(scope)
        elif scope.is_dir():
            files.extend(path for path in scope.rglob("*.md") if path.is_file())
    return sorted(set(files))


def in_frontmatter(index: int, frontmatter_end: int | None) -> bool:
    return frontmatter_end is not None and index <= frontmatter_end


def frontmatter_end(lines: list[str]) -> int | None:
    if not lines or lines[0].strip() != "---":
        return None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return index
    return None


def is_table(line: str) -> bool:
    stripped = line.strip()
    return stripped.startswith("|") and stripped.endswith("|")


def is_structural(line: str) -> bool:
    stripped = line.strip()
    return (
        not stripped
        or HEADING_RE.match(line) is not None
        or LIST_RE.match(line) is not None
        or line.lstrip().startswith(">")
        or is_table(line)
        or HTML_COMMENT_RE.match(line) is not None
    )


def leading_indent(line: str) -> int:
    return len(line) - len(line.lstrip(" \t"))


def is_list_item(line: str) -> bool:
    return LIST_RE.match(line) is not None


def is_list_continuation(lines: list[str], index: int) -> bool:
    line = lines[index]
    if not line.strip() or is_list_item(line):
        return False
    indent = leading_indent(line)
    if indent == 0:
        return False

    previous = index - 1
    while previous >= 0:
        previous_line = lines[previous]
        if not previous_line.strip():
            return False
        match = LIST_RE.match(previous_line)
        if match:
            return indent > leading_indent(previous_line)
        previous -= 1
    return False


def is_top_level_prose(lines: list[str], index: int) -> bool:
    line = lines[index]
    return (
        leading_indent(line) == 0
        and not is_structural(line)
        and not is_list_continuation(lines, index)
    )


def is_list_line(lines: list[str], index: int) -> bool:
    return is_list_item(lines[index]) or is_list_continuation(lines, index)


def is_list_block_start(lines: list[str], index: int) -> bool:
    return is_list_item(lines[index]) and not (
        index > 0 and is_list_item(lines[index - 1])
    )


def list_block_end(lines: list[str], index: int) -> int:
    cursor = index + 1
    while cursor < len(lines) and is_list_line(lines, cursor):
        cursor += 1
    return cursor


def list_line_needs_blank_after(lines: list[str], index: int) -> bool:
    if not is_list_line(lines, index) or index + 1 >= len(lines):
        return False
    next_index = index + 1
    return (
        not is_list_line(lines, next_index)
        and lines[next_index].strip()
        and not is_structural(lines[next_index])
    )


def looks_like_wrapped_pair(left: str, right: str) -> bool:
    left_text = left.strip()
    right_text = right.strip()
    if is_structural(left) or is_structural(right):
        return False
    if left_text.endswith(("  ", "\\", ".", "!", "?", ":", ";")):
        return False
    if right_text.startswith(("#", "-", "*", "+", "|", ">", "`")):
        return False
    if len(left_text) < 45:
        return False
    return left_text[-1].isalnum() and right_text[0].islower()


def looks_like_wrapped_top_level_pair(lines: list[str], index: int) -> bool:
    return (
        index + 1 < len(lines)
        and is_top_level_prose(lines, index)
        and is_top_level_prose(lines, index + 1)
        and looks_like_wrapped_pair(lines[index], lines[index + 1])
    )


def looks_like_wrapped_list_continuation(lines: list[str], index: int) -> bool:
    if index + 1 >= len(lines):
        return False
    match = LIST_RE.match(lines[index])
    if not match or not is_list_continuation(lines, index + 1):
        return False
    item_text = match.group("text").strip()
    continuation_text = lines[index + 1].strip()
    if len(item_text) < 45:
        return False
    if item_text.endswith(("  ", "\\", ".", "!", "?", ":", ";")):
        return False
    return (
        bool(item_text)
        and bool(continuation_text)
        and item_text[-1].isalnum()
        and continuation_text[0].islower()
    )


def scan_text(path: Path, text: str) -> list[Finding]:
    lines = text.splitlines()
    findings: list[Finding] = []
    fence_marker = ""
    in_fence = False
    fm_end = frontmatter_end(lines)

    for index, line in enumerate(lines):
        line_no = index + 1
        stripped = line.lstrip()
        fence = FENCE_RE.match(stripped)
        if fence:
            marker = fence.group(1)
            if not in_fence:
                in_fence = True
                fence_marker = marker[0] * len(marker)
            elif marker[0] == fence_marker[0] and len(marker) >= len(fence_marker):
                in_fence = False
                fence_marker = ""
            continue
        if in_fence or in_frontmatter(index, fm_end):
            continue

        if is_list_block_start(lines, index):
            next_index = list_block_end(lines, index)
            if (
                next_index < len(lines)
                and lines[next_index].strip()
                and not is_structural(lines[next_index])
                and not is_list_continuation(lines, next_index)
            ):
                findings.append(
                    Finding(
                        str(path),
                        next_index + 1,
                        "list-spacing",
                        "List block should be separated from following paragraph by one blank line.",
                        lines[next_index].strip(),
                    )
                )

        if looks_like_wrapped_list_continuation(lines, index):
            findings.append(
                Finding(
                    str(path),
                    line_no,
                    "list-continuation-wrap",
                    "List item appears wrapped into an indented continuation; prefer one logical line or preserve indentation during manual cleanup.",
                    line.strip(),
                )
            )

        if looks_like_wrapped_top_level_pair(lines, index):
            findings.append(
                Finding(
                    str(path),
                    line_no,
                    "hard-wrap",
                    "Prose appears hard-wrapped mid-sentence; use editor soft-wrap instead.",
                    line.strip(),
                )
            )

    return findings


def fix_text(text: str) -> str:
    lines = text.splitlines()
    output: list[str] = []
    in_fence = False
    fence_marker = ""
    fm_end = frontmatter_end(lines)
    index = 0

    while index < len(lines):
        line = lines[index]
        stripped = line.lstrip()
        fence = FENCE_RE.match(stripped)
        if fence:
            marker = fence.group(1)
            if not in_fence:
                in_fence = True
                fence_marker = marker[0] * len(marker)
            elif marker[0] == fence_marker[0] and len(marker) >= len(fence_marker):
                in_fence = False
                fence_marker = ""
            output.append(line)
            index += 1
            continue

        if (
            in_fence
            or in_frontmatter(index, fm_end)
            or is_structural(line)
            or is_list_continuation(lines, index)
        ):
            output.append(line)
            index += 1
            if list_line_needs_blank_after(lines, index - 1):
                output.append("")
            continue

        if not is_top_level_prose(lines, index):
            output.append(line)
            index += 1
            continue

        paragraph = [line.strip()]
        index += 1
        while (
            index < len(lines)
            and is_top_level_prose(lines, index)
            and looks_like_wrapped_pair(paragraph[-1], lines[index])
        ):
            paragraph.append(lines[index].strip())
            index += 1
        output.append(" ".join(paragraph))

    result = "\n".join(output)
    if text.endswith("\n"):
        result += "\n"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scope", nargs="+", help="Markdown files or directories to inspect.")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--fix", action="store_true", help="Apply conservative fixes.")
    args = parser.parse_args()

    paths = [Path(scope).expanduser() for scope in args.scope]
    files = markdown_files(paths)
    findings: list[Finding] = []

    for path in files:
        text = path.read_text()
        file_findings = scan_text(path, text)
        findings.extend(file_findings)
        if args.fix and file_findings:
            fixed = fix_text(text)
            if fixed != text:
                path.write_text(fixed)

    if args.format == "json":
        print(json.dumps({"ok": not findings, "findings": [asdict(item) for item in findings]}, indent=2))
    elif findings:
        for finding in findings:
            print(f"{finding.path}:{finding.line}: {finding.rule}: {finding.message}")
            print(f"  {finding.text}")
    else:
        print("OK: no Markdown source-formatting drift found.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
