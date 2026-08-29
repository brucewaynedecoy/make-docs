#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["PyYAML>=6,<7"]
# ///
"""Reconcile and render gate-specific phase-item tallies."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from typing import Any

try:
    import yaml
except ImportError as exc:  # pragma: no cover - environment guard
    raise SystemExit(
        "PyYAML is required. Run this script with `uv run` or install PyYAML."
    ) from exc


TERMINAL_STATUSES = {
    "accepted",
    "controlled",
    "resolved",
    "deferred",
    "superseded",
    "duplicate",
    "excluded",
}


class TallyError(RuntimeError):
    """A state or tally invariant failed."""


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def read_state(path: Path) -> tuple[str, dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise TallyError("phase state must be a YAML mapping")
    return text, data


def validate_inventory(state: dict[str, Any]) -> list[dict[str, Any]]:
    phase_items = state.get("phase_items")
    if not isinstance(phase_items, dict):
        raise TallyError("phase_items is missing")
    items = phase_items.get("items")
    if not isinstance(items, list):
        raise TallyError("phase_items.items must be a list")
    if phase_items.get("total") != len(items):
        raise TallyError("phase_items.total does not equal the number of entries")

    keys = [item.get("item_key") for item in items]
    if any(not isinstance(key, str) or not key for key in keys):
        raise TallyError("every phase item needs a non-empty item_key")
    if len(keys) != len(set(keys)):
        raise TallyError("phase item keys are not unique")
    if [item.get("ordinal") for item in items] != list(range(1, len(items) + 1)):
        raise TallyError("phase item ordinals must be continuous from 1")
    return items


def item_alias_map(items: list[dict[str, Any]]) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in items:
        key = item["item_key"]
        display_id = item.get("display_id")
        if isinstance(display_id, str) and display_id:
            result[display_id] = key
        aliases = item.get("aliases") or []
        if isinstance(aliases, list):
            for alias in aliases:
                if isinstance(alias, str) and alias:
                    result[alias] = key
    return result


def fingerprint(
    gate: str,
    eligible_keys: list[str],
    presented_keys: list[str],
    items_by_key: dict[str, dict[str, Any]],
) -> str:
    payload = {
        "gate": gate,
        "eligible": [
            {
                "item_key": key,
                "display_id": items_by_key[key].get("display_id"),
                "status": items_by_key[key].get("status"),
                "affects_gate": items_by_key[key].get("affects_gate"),
            }
            for key in eligible_keys
        ],
        "presented": presented_keys,
    }
    digest = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return f"sha256:{digest}"


def reconcile_tally(
    state: dict[str, Any], gate: str, activate_key: str | None = None
) -> tuple[dict[str, Any], bool, list[str]]:
    items = validate_inventory(state)
    items_by_key = {item["item_key"]: item for item in items}
    aliases = item_alias_map(items)
    current_eligible = [
        item["item_key"] for item in items if item.get("affects_gate") == gate
    ]

    all_tallies = state.get("phase_tallies")
    if not isinstance(all_tallies, dict):
        all_tallies = {}
    saved = all_tallies.get(gate)
    if not isinstance(saved, dict):
        saved = {}

    warnings: list[str] = []
    saved_order = saved.get("presented_item_keys")
    if not isinstance(saved_order, list):
        saved_order = []

    order: list[str] = []
    for key in saved_order:
        if not isinstance(key, str) or key not in items_by_key:
            warnings.append(f"removed missing presentation key: {key!r}")
            continue
        if key in order:
            warnings.append(f"removed duplicate presentation key: {key}")
            continue
        order.append(key)

    recovery_status = saved.get("recovery_status")
    if recovery_status not in {"exact", "inferred"}:
        recovery_status = "exact" if order else None

    if not order:
        decision_order: list[str] = []
        decisions = state.get("decisions") or []
        if isinstance(decisions, list):
            for decision in decisions:
                if not isinstance(decision, dict):
                    continue
                decision_id = decision.get("id")
                key = aliases.get(decision_id) if isinstance(decision_id, str) else None
                if key in current_eligible and key not in decision_order:
                    decision_order.append(key)
        order.extend(decision_order)

        active = [
            item["item_key"]
            for item in items
            if item.get("affects_gate") == gate and item.get("status") == "active"
        ]
        if len(active) == 1 and active[0] not in order:
            order.append(active[0])
        if decision_order:
            recovery_status = "inferred"
            warnings.append("presentation order was inferred from durable state")
        else:
            recovery_status = "exact"
    else:
        decisions = state.get("decisions") or []
        if isinstance(decisions, list):
            for decision in decisions:
                if not isinstance(decision, dict):
                    continue
                decision_id = decision.get("id")
                key = aliases.get(decision_id) if isinstance(decision_id, str) else None
                if key in current_eligible and key not in order:
                    order.append(key)
                    recovery_status = "inferred"
                    warnings.append(f"recovered missing presented item from decisions: {key}")

    if activate_key is not None:
        if activate_key not in items_by_key:
            raise TallyError(f"unknown item key: {activate_key}")
        if activate_key not in current_eligible and activate_key not in order:
            raise TallyError(f"item {activate_key} does not affect gate {gate}")
        if activate_key not in order:
            order.append(activate_key)

    cohort = list(current_eligible)
    for key in order:
        if key not in cohort:
            cohort.append(key)

    current_key = activate_key if activate_key is not None else saved.get("current_item_key")
    if (
        current_key not in items_by_key
        or current_key not in cohort
        or items_by_key[current_key].get("status") in TERMINAL_STATUSES
    ):
        active = [key for key in current_eligible if items_by_key[key].get("status") == "active"]
        current_key = active[0] if len(active) == 1 else None

    remaining = sum(
        1
        for key in current_eligible
        if items_by_key[key].get("status") not in TERMINAL_STATUSES
    )
    new_tally = {
        "presented_item_keys": order,
        "current_item_key": current_key,
        "eligible_total": len(cohort),
        "presented_count": len(order),
        "remaining_count": remaining,
        "register_fingerprint": fingerprint(gate, cohort, order, items_by_key),
        "recovery_status": recovery_status,
        "reconciled_at": saved.get("reconciled_at"),
        "source_revision": saved.get("source_revision"),
    }

    comparable_saved = {
        key: saved.get(key)
        for key in new_tally
        if key not in {"reconciled_at", "source_revision"}
    }
    comparable_new = {
        key: value
        for key, value in new_tally.items()
        if key not in {"reconciled_at", "source_revision"}
    }
    changed = comparable_saved != comparable_new
    return new_tally, changed, warnings


def replace_top_level_block(text: str, key: str, replacement: str) -> str:
    inline_pattern = re.compile(rf"(?m)^{re.escape(key)}:[ \t]*\S[^\n]*\n")
    if inline_pattern.search(text):
        return inline_pattern.sub(replacement.rstrip() + "\n\n", text, count=1)
    pattern = re.compile(rf"(?ms)^{re.escape(key)}:\s*\n.*?(?=^[A-Za-z_][A-Za-z0-9_-]*:|\Z)")
    if pattern.search(text):
        return pattern.sub(replacement.rstrip() + "\n\n", text, count=1)
    marker = re.search(r"(?m)^decisions:", text)
    if marker is None:
        return text.rstrip() + "\n\n" + replacement.rstrip() + "\n"
    return text[: marker.start()] + replacement.rstrip() + "\n\n" + text[marker.start() :]


def write_tally(
    path: Path,
    original_text: str,
    state: dict[str, Any],
    gate: str,
    tally: dict[str, Any],
    expected_revision: int,
) -> tuple[int, dict[str, Any]]:
    current_revision = state.get("revision")
    if current_revision != expected_revision:
        raise TallyError(
            f"stale state: expected revision {expected_revision}, found {current_revision}"
        )
    new_revision = current_revision + 1
    now = utc_now()
    tally = dict(tally)
    tally["reconciled_at"] = now
    tally["source_revision"] = new_revision

    tallies = state.get("phase_tallies")
    if not isinstance(tallies, dict):
        tallies = {}
    tallies = dict(tallies)
    tallies[gate] = tally
    block = yaml.safe_dump(
        {"phase_tallies": tallies},
        sort_keys=False,
        allow_unicode=True,
        width=1000,
    )

    updated = replace_top_level_block(original_text, "phase_tallies", block)
    updated, revision_replacements = re.subn(
        r"(?m)^revision:\s*\d+\s*$", f"revision: {new_revision}", updated, count=1
    )
    updated, time_replacements = re.subn(
        r"(?m)^updated_at:.*$", f'updated_at: "{now}"', updated, count=1
    )
    if revision_replacements != 1 or time_replacements != 1:
        raise TallyError("could not update top-level revision or updated_at")

    parsed = yaml.safe_load(updated)
    if not isinstance(parsed, dict) or parsed.get("revision") != new_revision:
        raise TallyError("updated phase state did not validate")
    validate_inventory(parsed)

    path.parent.mkdir(parents=True, exist_ok=True)
    mode = path.stat().st_mode
    fd, temporary_name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(updated)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary_path, mode)
        os.replace(temporary_path, path)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()

    _, final_state = read_state(path)
    if final_state.get("revision") != new_revision:
        raise TallyError("phase state read-back revision did not match the write")
    final_tallies = final_state.get("phase_tallies")
    final_tally = final_tallies.get(gate) if isinstance(final_tallies, dict) else None
    if not isinstance(final_tally, dict):
        raise TallyError("phase tally was missing after write read-back")
    return new_revision, final_tally


def output(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, indent=2, sort_keys=True))


def add_common(parser: argparse.ArgumentParser, write: bool) -> None:
    parser.add_argument("--state", required=True, type=Path)
    parser.add_argument("--gate", required=True)
    if write:
        parser.add_argument("--expected-revision", required=True, type=int)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    reconcile_parser = commands.add_parser("reconcile")
    add_common(reconcile_parser, write=True)
    activate_parser = commands.add_parser("activate")
    add_common(activate_parser, write=True)
    activate_parser.add_argument("--item-key", required=True)
    label_parser = commands.add_parser("label")
    add_common(label_parser, write=False)
    label_parser.add_argument("--item-key", required=True)
    args = parser.parse_args()

    original_text, state = read_state(args.state)
    activate_key = args.item_key if args.command == "activate" else None
    tally, changed, warnings = reconcile_tally(state, args.gate, activate_key)

    if args.command in {"reconcile", "activate"}:
        if changed:
            new_revision, tally = write_tally(
                args.state,
                original_text,
                state,
                args.gate,
                tally,
                args.expected_revision,
            )
        else:
            if state.get("revision") != args.expected_revision:
                raise TallyError(
                    f"stale state: expected revision {args.expected_revision}, "
                    f"found {state.get('revision')}"
                )
            new_revision = state.get("revision")
        output(
            {
                "changed": changed,
                "gate": args.gate,
                "revision": new_revision,
                "tally": tally,
                "warnings": warnings,
            }
        )
        return 0

    item_key = args.item_key
    items = validate_inventory(state)
    items_by_key = {item["item_key"]: item for item in items}
    if item_key not in items_by_key:
        raise TallyError(f"unknown item key: {item_key}")
    if item_key not in tally["presented_item_keys"]:
        raise TallyError(f"activate {item_key} before rendering its first label")
    position = tally["presented_item_keys"].index(item_key) + 1
    item = items_by_key[item_key]
    label = (
        f"{position}/{tally['eligible_total']} - {item.get('title')} "
        f"[{item.get('display_id')}]"
    )
    output(
        {
            "gate": args.gate,
            "item_key": item_key,
            "label": label,
            "needs_reconcile": changed,
            "position": position,
            "recovery_status": tally["recovery_status"],
            "total": tally["eligible_total"],
            "warnings": warnings,
        }
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, TallyError, yaml.YAMLError) as exc:
        print(f"phase-tally error: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc
