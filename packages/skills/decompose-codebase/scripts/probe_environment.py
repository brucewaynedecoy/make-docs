#!/usr/bin/env python3
"""Probe likely harness and MCP configuration for the decompose-codebase skill."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover - Python 3.11+ ships tomllib
    tomllib = None


RECOMMENDED_MCP = ("jdocmunch", "jcodemunch")
MCP_MAP_KEYS = ("mcpServers", "mcp_servers")


def load_json(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    try:
        return json.loads(path.read_text()), None
    except FileNotFoundError:
        return None, None
    except json.JSONDecodeError as exc:
        return None, f"json parse error: {exc}"


def load_toml(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    if tomllib is None:
        return None, "tomllib unavailable"
    try:
        return tomllib.loads(path.read_text()), None
    except FileNotFoundError:
        return None, None
    except tomllib.TOMLDecodeError as exc:
        return None, f"toml parse error: {exc}"


def infer_transport(config: dict[str, Any]) -> str:
    if config.get("url"):
        return "http"
    if config.get("command") or config.get("args"):
        return "stdio"
    return "unknown"


def find_mcp_maps(payload: Any) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            if key in MCP_MAP_KEYS and isinstance(value, dict):
                found.append(value)
            found.extend(find_mcp_maps(value))
    elif isinstance(payload, list):
        for item in payload:
            found.extend(find_mcp_maps(item))
    return found


def extract_servers(
    payload: dict[str, Any] | None,
    path: Path,
    harness: str,
) -> list[dict[str, Any]]:
    if not payload:
        return []

    servers: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for mapping in find_mcp_maps(payload):
        for name, config in mapping.items():
            if not isinstance(config, dict):
                config = {"value": config}
            key = (name, str(path))
            if key in seen:
                continue
            seen.add(key)
            servers.append(
                {
                    "name": name,
                    "configured": True,
                    "transport": infer_transport(config),
                    "harness": harness,
                    "source": str(path),
                }
            )
    return servers


def current_env_markers() -> dict[str, list[str]]:
    env = os.environ
    return {
        "codex": sorted(key for key in env if key.startswith("CODEX_")),
        "claude-code": sorted(key for key in env if key.startswith("CLAUDE_CODE_")),
        "opencode": sorted(key for key in env if key.startswith("OPENCODE_")),
    }


def score_harness(env_markers: dict[str, list[str]], sources: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    scores: dict[str, dict[str, Any]] = {
        "codex": {"score": 0, "evidence": []},
        "claude-code": {"score": 0, "evidence": []},
        "opencode": {"score": 0, "evidence": []},
    }

    if "CODEX_THREAD_ID" in env_markers["codex"]:
        scores["codex"]["score"] += 5
        scores["codex"]["evidence"].append("env:CODEX_THREAD_ID")
    if env_markers["codex"]:
        scores["codex"]["score"] += 2
        scores["codex"]["evidence"].append("env:CODEX_*")
    if env_markers["claude-code"]:
        scores["claude-code"]["score"] += 3
        scores["claude-code"]["evidence"].append("env:CLAUDE_CODE_*")
    if env_markers["opencode"]:
        scores["opencode"]["score"] += 3
        scores["opencode"]["evidence"].append("env:OPENCODE_*")

    for source in sources:
        if not source["exists"]:
            continue
        harness = source["harness"]
        if harness in scores:
            scores[harness]["score"] += 1
            scores[harness]["evidence"].append(f"config:{source['path']}")

    return scores


def detect_harness(env_markers: dict[str, list[str]], sources: list[dict[str, Any]]) -> dict[str, Any]:
    scores = score_harness(env_markers, sources)
    ranked = sorted(scores.items(), key=lambda item: item[1]["score"], reverse=True)
    top_name, top_data = ranked[0]
    next_score = ranked[1][1]["score"]

    if top_data["score"] == 0:
        return {"name": "unknown", "confidence": "low", "evidence": []}

    confidence = "high" if top_data["score"] >= 5 and top_data["score"] > next_score else "medium"
    if top_data["score"] == next_score:
        confidence = "low"

    return {
        "name": top_name,
        "confidence": confidence,
        "evidence": top_data["evidence"],
    }


def detect_parallel_support(harness_guess: dict[str, Any]) -> dict[str, Any]:
    name = harness_guess["name"]
    if name == "codex":
        return {
            "supported": True,
            "confidence": "high",
            "evidence": ["codex sessions commonly expose agent tools and parallel workstreams"],
        }
    if name == "claude-code":
        return {
            "supported": True,
            "confidence": "medium",
            "evidence": ["claude-code environments commonly expose task-oriented parallelism"],
        }
    if name == "opencode":
        return {
            "supported": False,
            "confidence": "low",
            "evidence": ["parallel behavior should be confirmed before assuming agent spawning"],
        }
    return {
        "supported": False,
        "confidence": "low",
        "evidence": ["no active harness markers found"],
    }


def detect_delegation_support(harness_guess: dict[str, Any]) -> dict[str, Any]:
    name = harness_guess["name"]
    if name == "codex":
        return {
            "preferred_mode": "parallel-agents",
            "parallel_agents": {
                "supported": True,
                "confidence": "high",
                "evidence": ["codex sessions commonly expose delegated workers that can run in parallel"],
            },
            "subagents": {
                "supported": True,
                "confidence": "high",
                "evidence": ["codex sessions commonly expose delegated workers even when full parallel fan-out is constrained"],
            },
            "single_agent_fallback": True,
        }
    if name == "claude-code":
        return {
            "preferred_mode": "parallel-agents",
            "parallel_agents": {
                "supported": True,
                "confidence": "medium",
                "evidence": ["claude-code environments commonly expose task-oriented delegated workers"],
            },
            "subagents": {
                "supported": True,
                "confidence": "medium",
                "evidence": ["claude-code environments commonly expose delegated workers even when concurrency varies"],
            },
            "single_agent_fallback": True,
        }
    if name == "opencode":
        return {
            "preferred_mode": "subagents",
            "parallel_agents": {
                "supported": False,
                "confidence": "low",
                "evidence": ["parallel delegation should be confirmed before assuming concurrent worker support"],
            },
            "subagents": {
                "supported": True,
                "confidence": "low",
                "evidence": ["delegate-first behavior is still preferred if the session exposes worker tools"],
            },
            "single_agent_fallback": True,
        }
    return {
        "preferred_mode": "single-agent",
        "parallel_agents": {
            "supported": False,
            "confidence": "low",
            "evidence": ["no active harness markers found"],
        },
        "subagents": {
            "supported": False,
            "confidence": "low",
            "evidence": ["no delegated worker support can be inferred safely"],
        },
        "single_agent_fallback": True,
    }


def gather_sources(home: Path, cwd: Path) -> list[dict[str, Any]]:
    return [
        {"path": home / ".codex" / "config.toml", "harness": "codex", "format": "toml"},
        {"path": home / ".codex" / "config.json", "harness": "codex", "format": "json"},
        {"path": home / ".claude" / ".claude.json", "harness": "claude-code", "format": "json"},
        {"path": home / ".config" / "opencode" / "config.json", "harness": "opencode", "format": "json"},
        {"path": home / ".config" / "opencode" / "config.toml", "harness": "opencode", "format": "toml"},
        {"path": home / ".opencode.json", "harness": "opencode", "format": "json"},
        {"path": home / ".opencode" / "config.json", "harness": "opencode", "format": "json"},
        {"path": cwd / ".mcp.json", "harness": "repo-local", "format": "json"},
        {"path": cwd / "mcp.json", "harness": "repo-local", "format": "json"},
    ]


def probe() -> dict[str, Any]:
    home = Path.home()
    cwd = Path.cwd()
    env_markers = current_env_markers()
    source_specs = gather_sources(home, cwd)

    checked: list[dict[str, Any]] = []
    servers: list[dict[str, Any]] = []
    for spec in source_specs:
        path = spec["path"]
        fmt = spec["format"]
        exists = path.exists()
        parsed = False
        note = None
        payload = None

        if exists:
            if fmt == "json":
                payload, note = load_json(path)
            else:
                payload, note = load_toml(path)
            parsed = payload is not None and note is None
            servers.extend(extract_servers(payload, path, spec["harness"]))

        checked.append(
            {
                "path": str(path),
                "harness": spec["harness"],
                "format": fmt,
                "exists": exists,
                "parsed": parsed,
                "note": note,
            }
        )

    harness_guess = detect_harness(env_markers, checked)
    parallel = detect_parallel_support(harness_guess)
    delegation = detect_delegation_support(harness_guess)

    notes = [
        "Configured MCP servers do not prove live session access; confirm availability in the current session before relying on MCP tools.",
        "Default to planning mode first unless the user explicitly approves direct execution.",
        "For decomposition, use the delegation ladder by default when the session allows it: parallel agents, then subagents, then single-agent fallback.",
    ]

    configured_names = {server["name"] for server in servers}
    for server_name in RECOMMENDED_MCP:
        if server_name in configured_names:
            notes.append(f"Recommended MCP server '{server_name}' is configured locally.")
        else:
            notes.append(f"Recommended MCP server '{server_name}' was not found in the checked local configs.")

    if env_markers["codex"] and env_markers["claude-code"]:
        notes.append("Both Codex and Claude Code environment markers are present; prefer active-session evidence over dormant config files.")

    return {
        "harness_guess": harness_guess,
        "parallel_agent_support": parallel,
        "delegation_support": delegation,
        "configured_mcp_servers": sorted(servers, key=lambda item: (item["name"], item["source"])),
        "config_sources_checked": checked,
        "session_access_must_be_confirmed": True,
        "recommended_mode": "planning",
        "notes": notes,
    }


def render_text(result: dict[str, Any]) -> str:
    lines = [
        f"Harness guess: {result['harness_guess']['name']} ({result['harness_guess']['confidence']})",
        f"Parallel agent support: {result['parallel_agent_support']['supported']} ({result['parallel_agent_support']['confidence']})",
        f"Delegation preference: {result['delegation_support']['preferred_mode']}",
        f"Recommended mode: {result['recommended_mode']}",
        f"Session MCP access must be confirmed: {result['session_access_must_be_confirmed']}",
        "",
        "Configured MCP servers:",
    ]
    if result["configured_mcp_servers"]:
        for server in result["configured_mcp_servers"]:
            lines.append(
                f"- {server['name']} via {server['harness']} ({server['transport']}) from {server['source']}"
            )
    else:
        lines.append("- none found in checked configs")

    lines.extend(["", "Notes:"])
    for note in result["notes"]:
        lines.append(f"- {note}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--format",
        choices=("json", "text"),
        default="text",
        help="Output format.",
    )
    args = parser.parse_args()

    result = probe()
    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(render_text(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
