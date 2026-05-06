#!/usr/bin/env python3
"""Report and optionally fix Markdown source-formatting drift."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path


FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
LIST_RE = re.compile(
    r"^(?P<indent>[ \t]*)(?P<marker>(?:[-+*]|\d+[.)]))[ \t]+"
    r"(?:(?P<task>\[[ xX]\])[ \t]+)?(?P<text>.*)$"
)
HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+")
HTML_COMMENT_START_RE = re.compile(r"^\s*<!--")
HTML_COMMENT_END_RE = re.compile(r"-->\s*$")


@dataclass
class Block:
    block_type: str
    start: int
    end: int
    protected: bool = False


@dataclass
class Finding:
    path: str
    start_line: int
    end_line: int
    rule: str
    message: str
    fixable: bool
    confidence: float
    block_type: str
    preview: str


def markdown_files(scopes: list[Path]) -> list[Path]:
    files: list[Path] = []
    for scope in scopes:
        if scope.is_file() and scope.suffix.lower() == ".md":
            files.append(scope)
        elif scope.is_dir():
            files.extend(path for path in scope.rglob("*.md") if path.is_file())
    return sorted(set(files))


def frontmatter_end(lines: list[str]) -> int | None:
    if not lines or lines[0].strip() != "---":
        return None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return index
    return None


def leading_indent(line: str) -> int:
    return len(line) - len(line.lstrip(" \t"))


def is_table(line: str) -> bool:
    stripped = line.strip()
    return stripped.startswith("|") and stripped.endswith("|")


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
        if is_list_item(previous_line):
            return indent > leading_indent(previous_line)
        previous -= 1
    return False


def is_list_line(lines: list[str], index: int) -> bool:
    return is_list_item(lines[index]) or is_list_continuation(lines, index)


def is_code_fence(line: str) -> bool:
    return FENCE_RE.match(line.lstrip()) is not None


def is_comment_start(line: str) -> bool:
    return HTML_COMMENT_START_RE.match(line) is not None


def is_heading(line: str) -> bool:
    return HEADING_RE.match(line) is not None


def is_blockquote(line: str) -> bool:
    return line.lstrip().startswith(">")


def parse_code_fence(lines: list[str], start: int) -> int:
    match = FENCE_RE.match(lines[start].lstrip())
    if match is None:
        return start
    marker = match.group(1)
    fence_char = marker[0]
    fence_len = len(marker)
    cursor = start + 1
    while cursor < len(lines):
        closing = FENCE_RE.match(lines[cursor].lstrip())
        if closing and closing.group(1)[0] == fence_char and len(closing.group(1)) >= fence_len:
            return cursor
        cursor += 1
    return len(lines) - 1


def parse_comment(lines: list[str], start: int) -> int:
    cursor = start
    while cursor < len(lines):
        if HTML_COMMENT_END_RE.search(lines[cursor]):
            return cursor
        cursor += 1
    return len(lines) - 1


def list_block_end(lines: list[str], start: int) -> int:
    cursor = start + 1
    while cursor < len(lines) and is_list_line(lines, cursor):
        cursor += 1
    return cursor - 1


def same_type_block_end(lines: list[str], start: int, block_type: str) -> int:
    cursor = start + 1
    while cursor < len(lines):
        line = lines[cursor]
        if not line.strip():
            break
        if block_type == "table" and not is_table(line):
            break
        if block_type == "blockquote" and not is_blockquote(line):
            break
        if block_type == "indented" and leading_indent(line) == 0:
            break
        cursor += 1
    return cursor - 1


def is_paragraph_line(lines: list[str], index: int) -> bool:
    line = lines[index]
    return (
        bool(line.strip())
        and leading_indent(line) == 0
        and not is_heading(line)
        and not is_code_fence(line)
        and not is_comment_start(line)
        and not is_table(line)
        and not is_blockquote(line)
        and not is_list_item(line)
    )


def paragraph_end(lines: list[str], start: int) -> int:
    cursor = start + 1
    while cursor < len(lines) and is_paragraph_line(lines, cursor):
        cursor += 1
    return cursor - 1


def parse_blocks(lines: list[str]) -> list[Block]:
    blocks: list[Block] = []
    index = 0
    fm_end = frontmatter_end(lines)
    if fm_end is not None:
        blocks.append(Block("frontmatter", 0, fm_end, protected=True))
        index = fm_end + 1

    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if is_code_fence(line):
            end = parse_code_fence(lines, index)
            blocks.append(Block("code-fence", index, end, protected=True))
        elif is_comment_start(line):
            end = parse_comment(lines, index)
            blocks.append(Block("comment", index, end, protected=True))
        elif is_heading(line):
            end = index
            blocks.append(Block("heading", index, end))
        elif is_table(line):
            end = same_type_block_end(lines, index, "table")
            blocks.append(Block("table", index, end, protected=True))
        elif is_blockquote(line):
            end = same_type_block_end(lines, index, "blockquote")
            blocks.append(Block("blockquote", index, end, protected=True))
        elif is_list_item(line):
            end = list_block_end(lines, index)
            blocks.append(Block("list", index, end, protected=True))
        elif leading_indent(line) > 0:
            end = same_type_block_end(lines, index, "indented")
            blocks.append(Block("indented", index, end, protected=True))
        else:
            end = paragraph_end(lines, index)
            blocks.append(Block("paragraph", index, end))
        index = end + 1
    return blocks


def preview(lines: list[str], start: int, end: int) -> str:
    text = " ".join(line.strip() for line in lines[start : end + 1] if line.strip())
    return text[:160]


def has_blank_between(left: Block, right: Block) -> bool:
    return right.start > left.end + 1


def find_block_spacing(path: Path, lines: list[str], blocks: list[Block]) -> list[Finding]:
    findings: list[Finding] = []
    for left, right in zip(blocks, blocks[1:]):
        if has_blank_between(left, right):
            continue
        findings.append(
            Finding(
                path=str(path),
                start_line=right.start + 1,
                end_line=right.start + 1,
                rule="block-spacing",
                message=f"Block `{right.block_type}` must be separated from previous `{left.block_type}` block by one blank line.",
                fixable=True,
                confidence=1.0,
                block_type=f"{left.block_type}->{right.block_type}",
                preview=preview(lines, right.start, right.end),
            )
        )
    return findings


def find_paragraph_wraps(path: Path, lines: list[str], blocks: list[Block]) -> list[Finding]:
    findings: list[Finding] = []
    for block in blocks:
        if block.block_type != "paragraph" or block.start == block.end:
            continue
        findings.append(
            Finding(
                path=str(path),
                start_line=block.start + 1,
                end_line=block.end + 1,
                rule="paragraph-wrap",
                message="Paragraph spans multiple source lines; use one logical source line unless Markdown structure requires otherwise.",
                fixable=True,
                confidence=0.95,
                block_type=block.block_type,
                preview=preview(lines, block.start, block.end),
            )
        )
    return findings


def find_list_continuation_wraps(path: Path, lines: list[str], blocks: list[Block]) -> list[Finding]:
    findings: list[Finding] = []
    for block in blocks:
        if block.block_type != "list":
            continue
        for index in range(block.start, block.end):
            if not is_list_item(lines[index]) or not is_list_continuation(lines, index + 1):
                continue
            findings.append(
                Finding(
                    path=str(path),
                    start_line=index + 1,
                    end_line=index + 2,
                    rule="list-continuation-wrap",
                    message="List item uses wrapped continuation text; prefer one logical list-item line or preserve indentation during manual cleanup.",
                    fixable=False,
                    confidence=0.7,
                    block_type=block.block_type,
                    preview=preview(lines, index, index + 1),
                )
            )
    return findings


def scan_text(path: Path, text: str) -> list[Finding]:
    lines = text.splitlines()
    blocks = parse_blocks(lines)
    findings: list[Finding] = []
    findings.extend(find_block_spacing(path, lines, blocks))
    findings.extend(find_paragraph_wraps(path, lines, blocks))
    findings.extend(find_list_continuation_wraps(path, lines, blocks))
    return findings


def fix_block_spacing(text: str) -> str:
    lines = text.splitlines()
    blocks = parse_blocks(lines)
    insert_after = {
        left.end
        for left, right in zip(blocks, blocks[1:])
        if not has_blank_between(left, right)
    }
    output: list[str] = []
    for index, line in enumerate(lines):
        output.append(line)
        if index in insert_after:
            output.append("")
    result = "\n".join(output)
    if text.endswith("\n"):
        result += "\n"
    return result


def fix_paragraph_wraps(text: str) -> str:
    lines = text.splitlines()
    blocks = parse_blocks(lines)
    paragraph_blocks = {
        block.start: block for block in blocks if block.block_type == "paragraph" and block.start < block.end
    }
    output: list[str] = []
    index = 0
    while index < len(lines):
        block = paragraph_blocks.get(index)
        if block is None:
            output.append(lines[index])
            index += 1
            continue
        output.append(" ".join(line.strip() for line in lines[block.start : block.end + 1]))
        index = block.end + 1
    result = "\n".join(output)
    if text.endswith("\n"):
        result += "\n"
    return result


def fix_text(text: str) -> str:
    return fix_paragraph_wraps(fix_block_spacing(text))


def print_text_findings(findings: list[Finding]) -> None:
    grouped: dict[str, dict[str, list[Finding]]] = defaultdict(lambda: defaultdict(list))
    for finding in findings:
        grouped[finding.path][finding.rule].append(finding)

    for path in sorted(grouped):
        print(path)
        for rule in sorted(grouped[path]):
            print(f"  {rule}")
            for finding in grouped[path][rule]:
                fixable = "fixable" if finding.fixable else "manual-review"
                print(
                    f"    {finding.start_line}-{finding.end_line}: {fixable}: {finding.message}"
                )
                print(f"      {finding.preview}")


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
        if args.fix and any(finding.fixable for finding in file_findings):
            fixed = fix_text(text)
            if fixed != text:
                path.write_text(fixed)

    if args.format == "json":
        print(json.dumps({"ok": not findings, "findings": [asdict(item) for item in findings]}, indent=2))
    elif findings:
        print_text_findings(findings)
    else:
        print("OK: no Markdown source-formatting drift found.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
