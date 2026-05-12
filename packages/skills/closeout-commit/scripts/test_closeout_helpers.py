#!/usr/bin/env python3
"""Tests for closeout-commit fast-path helper scripts."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import closeout_history
import closeout_probe
import closeout_validate


class CloseoutProbeTests(unittest.TestCase):
    def test_classifies_skill_script_and_cli_test_paths(self) -> None:
        self.assertEqual(closeout_probe.classify_path("packages/skills/x/SKILL.md"), "skill")
        self.assertEqual(closeout_probe.classify_path("packages/cli/tests/install.test.ts"), "tests")
        self.assertEqual(closeout_probe.classify_path("packages/cli/src/index.ts"), "code")

    def test_extracts_work_coordinates_from_paths(self) -> None:
        coordinates = closeout_probe.extract_coordinates(
            ["docs/work/2026-05-05-w14-r1-example/02-closeout.md"]
        )

        self.assertEqual(coordinates[0]["w"], 14)
        self.assertEqual(coordinates[0]["r"], 1)
        self.assertEqual(coordinates[0]["p"], 2)

    def test_next_risk_ids_advance_existing_numbers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            register = root / "docs" / "prd" / "03-open-questions-and-risk-register.md"
            register.parent.mkdir(parents=True)
            register.write_text("### D-003 Drift\n### Q-002 Question\n### R-009 Risk\n")

            result = closeout_probe.next_risk_ids(root)

        self.assertEqual(result["next"], {"D": "D-004", "Q": "Q-003", "R": "R-010"})

    def test_validation_hints_include_helper_tests(self) -> None:
        hints = closeout_probe.validation_hints(
            [
                {
                    "path": "packages/skills/closeout-commit/scripts/closeout_probe.py",
                    "category": "skill",
                }
            ]
        )

        self.assertIn("python3 -B packages/skills/closeout-commit/scripts/test_closeout_helpers.py", hints)
        self.assertIn("git diff --check", hints)

    def test_rust_validation_hints_do_not_include_make_docs_npm_without_node_workspace(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "Cargo.toml").write_text("[workspace]\n", encoding="utf-8")

            hints = closeout_probe.validation_hints(
                [{"path": "crates/demo/src/lib.rs", "category": "code"}],
                root,
            )

        self.assertIn("cargo metadata --format-version 1", hints)
        self.assertIn("cargo test --workspace", hints)
        self.assertNotIn("npm test -w make-docs -- consistency install skill-catalog skill-registry", hints)


class CloseoutValidateTests(unittest.TestCase):
    def test_commands_from_probe_deduplicates_diff_check(self) -> None:
        commands = closeout_validate.commands_from_probe(
            {"validationHints": ["git diff --check", "git diff --check"]}
        )

        self.assertEqual(commands, ["git diff --check"])


class CloseoutHistoryTests(unittest.TestCase):
    def test_render_history_records_no_gap_and_validation_defaults(self) -> None:
        contents = closeout_history.render_history(
            "commit",
            "Fast Path Closeout",
            "2026-05-06",
            {
                "files": [{"path": "packages/skills/closeout-commit/SKILL.md"}],
                "validationHints": ["git diff --check"],
                "coordinates": [{"w": 14, "r": 1}],
            },
            {},
        )

        self.assertIn("coordinate: W14 R1", contents)
        self.assertIn("No novel gaps were found.", contents)
        self.assertIn("`git diff --check`", contents)

    def test_generated_history_json_is_serializable(self) -> None:
        contents = closeout_history.render_history("commit", "Closeout", "2026-05-06", {}, {})
        payload = {"contents": contents}

        self.assertIsInstance(json.dumps(payload), str)

    def test_phase_history_filename_uses_coordinate_prefix(self) -> None:
        filename = closeout_history.history_filename(
            "phase",
            "2026-05-11",
            "Tool Manifest Crate Closeout",
            {},
            {"coordinate": {"w": 1, "r": 0, "p": 2}},
        )

        self.assertEqual(filename, "2026-05-11-w1-r0-p2-tool-manifest-crate-closeout.md")


if __name__ == "__main__":
    unittest.main()
