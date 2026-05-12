#!/usr/bin/env python3
"""Tests for work-on-phase helper behavior."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from checkpoint import build_checkpoint
from phase_plan import build_plan
from scope_guard import build_scope_report
from work_on_wave_common import WaveError, parse_phase, resolve_target, save_state, state_path_for


class WorkOnPhaseHelperTests(unittest.TestCase):
    def test_requires_explicit_phase_coordinate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wave_dir = root / "docs" / "work" / "2026-05-12-w1-r0-demo"
            wave_dir.mkdir(parents=True)
            (wave_dir / "01-first.md").write_text("# First\n\n### Tasks\n\n- [ ] t1: Do it\n")

            with self.assertRaisesRegex(WaveError, "requires an explicit phase target"):
                resolve_target("W1 R0", root)

    def test_resolves_explicit_phase_coordinate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wave_dir = root / "docs" / "work" / "2026-05-12-w1-r0-demo"
            wave_dir.mkdir(parents=True)
            phase = wave_dir / "01-first.md"
            phase.write_text("# First\n\n### Tasks\n\n- [ ] t1: Do it\n")

            resolution = resolve_target("W1 R0 P1", root)

            self.assertEqual(resolution["mode"], "phase")
            self.assertEqual(Path(str(resolution["phasePath"])).resolve(), phase.resolve())

    def test_helper_scripts_accept_split_coordinate_tokens(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wave_dir = root / "docs" / "work" / "2026-05-12-w1-r0-demo"
            wave_dir.mkdir(parents=True)
            (wave_dir / "01-first.md").write_text("# First\n\n### Tasks\n\n- [ ] t1: Do it\n")

            result = subprocess.run(
                [
                    "python3",
                    str(Path(__file__).resolve().parent / "resolve_wave.py"),
                    "W1",
                    "R0",
                    "P1",
                    "--json",
                ],
                cwd=root,
                check=False,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(json.loads(result.stdout)["phasePath"].endswith("01-first.md"))

    def test_rejects_directory_targets(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wave_dir = root / "docs" / "work" / "2026-05-12-w1-r0-demo"
            wave_dir.mkdir(parents=True)
            (wave_dir / "01-first.md").write_text("# First\n\n### Tasks\n\n- [ ] t1: Do it\n")

            with self.assertRaisesRegex(WaveError, "directory targets are ambiguous"):
                resolve_target(wave_dir.as_posix(), root)

    def test_parses_directory_dotfile_and_extensionless_scope_hints(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            phase = root / "docs" / "work" / "2026-05-12-w1-r0-demo" / "01-first.md"
            phase.parent.mkdir(parents=True)
            phase.write_text(
                "# First\n\n"
                "### Tasks\n\n"
                "- [ ] t1: Update `.gitignore`, `justfile`, and `tools/`.\n",
                encoding="utf-8",
            )

            parsed = parse_phase(phase)

        self.assertIn(".gitignore", parsed["declaredPaths"])
        self.assertIn("justfile", parsed["declaredPaths"])
        self.assertIn("tools/", parsed["declaredPaths"])

    def test_checkpoint_refreshes_top_level_target_for_reused_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wave_dir = root / "docs" / "work" / "2026-05-12-w1-r0-demo"
            wave_dir.mkdir(parents=True)
            (wave_dir / "01-first.md").write_text("# First\n\n### Tasks\n\n- [x] t1: Done\n")
            (wave_dir / "02-second.md").write_text("# Second\n\n### Tasks\n\n- [x] t1: Done\n")
            resolution = resolve_target("W1 R0 P1", root)
            state_path = state_path_for(resolution)
            save_state(
                state_path,
                {
                    "schemaVersion": 1,
                    "waveSlug": "2026-05-12-w1-r0-demo",
                    "waveDir": wave_dir.as_posix(),
                    "target": "W1 R0 P1",
                    "mode": "phase",
                    "commitPolicy": "draft-only",
                    "phases": {},
                },
            )
            import os

            previous = Path.cwd()
            try:
                os.chdir(root)
                result = build_checkpoint(
                    SimpleNamespace(
                        target="W1 R0 P2",
                        phase=None,
                        mode=None,
                        commit_policy=None,
                        status="in-progress",
                        validation_status=None,
                        validation_command=None,
                        review_status=None,
                        review_required=None,
                        closeout_status=None,
                        commit_status=None,
                        commit_sha=None,
                        push_status=None,
                        note=None,
                    )
                )
            finally:
                os.chdir(previous)

        state = result["state"]
        self.assertEqual(state["target"], "W1 R0 P2")
        self.assertEqual(state["coordinate"], {"w": 1, "r": 0, "p": 2})
        self.assertTrue(state["activePhasePath"].endswith("02-second.md"))

    def test_scope_guard_allows_managed_state_and_lockfile_derivatives(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            phase = root / "docs" / "work" / "2026-05-12-w1-r0-demo" / "01-first.md"
            phase.parent.mkdir(parents=True)
            phase.write_text(
                "# First\n\n### Tasks\n\n- [ ] t1: Update `Cargo.toml`.\n",
                encoding="utf-8",
            )

            report = build_scope_report(
                phase.as_posix(),
                [
                    "Cargo.toml",
                    "Cargo.lock",
                    ".make-docs/runs/2026-05-12-w1-r0-demo/state.json",
                ],
            )

        self.assertEqual(report["status"], "passed")
        self.assertEqual(report["outOfScope"], [])
        self.assertEqual({item["path"] for item in report["allowedDerived"]}, {"Cargo.lock", ".make-docs/runs/2026-05-12-w1-r0-demo/state.json"})

    def test_scope_guard_allows_dotfile_and_extensionless_hints(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            phase = root / "docs" / "work" / "2026-05-12-w1-r0-demo" / "01-first.md"
            phase.parent.mkdir(parents=True)
            phase.write_text(
                "# First\n\n### Tasks\n\n- [ ] t1: Update `.gitignore`, `justfile`, and `tools/`.\n",
                encoding="utf-8",
            )

            report = build_scope_report(
                phase.as_posix(),
                [".gitignore", "justfile", "tools/check.py"],
            )

        self.assertEqual(report["status"], "passed")
        self.assertEqual(report["outOfScope"], [])

    def test_phase_plan_warns_when_linked_source_count_conflicts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "docs" / "prd" / "01-source.md"
            source.parent.mkdir(parents=True)
            source.write_text("The implementation requires thirteen crate stubs.\n", encoding="utf-8")
            phase = root / "docs" / "work" / "2026-05-12-w1-r0-demo" / "01-first.md"
            phase.parent.mkdir(parents=True)
            phase.write_text(
                "# First\n\n"
                "[Source](../../prd/01-source.md)\n\n"
                "### Tasks\n\n"
                "- [ ] t1: Do it\n",
                encoding="utf-8",
            )
            import os

            previous = Path.cwd()
            try:
                os.chdir(root)
                plan = build_plan("W1 R0 P1")
            finally:
                os.chdir(previous)

        self.assertIn("mentions 13 expected item(s)", plan["warnings"][0])


if __name__ == "__main__":
    unittest.main()
