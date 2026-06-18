#!/usr/bin/env python3
"""Tests for work-on-wave helper scripts."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from checkpoint import build_checkpoint  # noqa: E402
from phase_plan import build_plan  # noqa: E402
from work_on_wave_common import parse_phase, resolve_target, save_state, state_path_for  # noqa: E402
from phase_gate import build_gate_report  # noqa: E402
from scope_guard import build_scope_report  # noqa: E402


class WorkOnWaveHelperTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="work-on-wave-test-"))
        subprocess.run(["git", "init", "-q"], cwd=self.temp_dir, check=True, stdout=subprocess.DEVNULL)
        self.work_dir = self.temp_dir / "docs" / "work" / "2026-05-07-w1-r0-sample"
        self.work_dir.mkdir(parents=True)
        (self.work_dir / "00-index.md").write_text("# Sample Work Backlog\n", encoding="utf-8")
        (self.work_dir / "01-first.md").write_text(
            "\n".join(
                [
                    "# Phase 1: First",
                    "",
                    "## Stage 1 - Build",
                    "",
                    "### Tasks",
                    "",
                    "- [ ] t1: Update `src/app.ts`.",
                    "- [x] t2: Update docs.",
                    "",
                    "### Acceptance criteria",
                    "",
                    "- App behavior is covered.",
                    "",
                    "### Dependencies",
                    "",
                    "- t2 depends on t1.",
                    "",
                    "### Validation commands",
                    "",
                    "- `npm test`",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        (self.work_dir / "02-second.md").write_text(
            "\n".join(
                [
                    "# Phase 2: Second",
                    "",
                    "## Stage 1 - Done",
                    "",
                    "### Tasks",
                    "",
                    "- [x] t1: Finish the second phase.",
                    "",
                    "### Acceptance criteria",
                    "",
                    "- Phase is complete.",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        self.previous_cwd = Path.cwd()

    def tearDown(self) -> None:
        import os

        os.chdir(self.previous_cwd)
        shutil.rmtree(self.temp_dir)

    def test_resolves_wave_phase_and_direct_paths(self) -> None:
        resolution = resolve_target("W1 R0", self.temp_dir)
        self.assertEqual(resolution["waveSlug"], "2026-05-07-w1-r0-sample")
        self.assertTrue(str(resolution["phasePath"]).endswith("01-first.md"))

        phase_resolution = resolve_target("W1 R0 P2", self.temp_dir)
        self.assertEqual(phase_resolution["mode"], "phase")
        self.assertTrue(str(phase_resolution["phasePath"]).endswith("02-second.md"))

        direct_resolution = resolve_target("docs/work/2026-05-07-w1-r0-sample/01-first.md", self.temp_dir)
        self.assertEqual(direct_resolution["mode"], "phase")

    def test_helper_scripts_accept_split_coordinate_tokens(self) -> None:
        result = subprocess.run(
            [
                "python3",
                str(SCRIPT_DIR / "resolve_wave.py"),
                "W1",
                "R0",
                "P2",
                "--json",
            ],
            cwd=self.temp_dir,
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)["phasePath"].endswith("02-second.md"))

    def test_parses_phase_tasks_acceptance_dependencies_and_validation(self) -> None:
        phase = parse_phase(self.work_dir / "01-first.md")

        self.assertEqual(len(phase["tasks"]), 2)
        self.assertEqual(len(phase["uncheckedTasks"]), 1)
        self.assertEqual(phase["acceptanceCriteria"][0]["text"], "App behavior is covered.")
        self.assertEqual(phase["dependencies"][0]["text"], "t2 depends on t1.")
        self.assertEqual(phase["validationCommands"][0]["command"], "npm test")
        self.assertIn("src/app.ts", phase["declaredPaths"])

    def test_checkpoint_creates_lazy_state_under_make_docs_runs(self) -> None:
        self.assertFalse((self.temp_dir / ".make-docs").exists())
        import os

        os.chdir(self.temp_dir)
        result = build_checkpoint(
            SimpleNamespace(
                target="W1 R0 P1",
                phase=None,
                mode=None,
                commit_policy="commit-required",
                status="in-progress",
                validation_status="passed",
                validation_command=["npm test"],
                review_status="not-required",
                review_required=False,
                closeout_status=None,
                commit_status=None,
                commit_sha=None,
                push_status=None,
                note="checkpoint",
            )
        )

        state_path = Path(result["statePath"])
        self.assertTrue(state_path.exists())
        self.assertEqual(state_path.parent.parent.name, "runs")
        state = json.loads(state_path.read_text(encoding="utf-8"))
        self.assertEqual(state["commitPolicy"], "commit-required")
        self.assertEqual(state["waveDir"], "docs/work/2026-05-07-w1-r0-sample")
        self.assertEqual(
            state["activePhasePath"],
            "docs/work/2026-05-07-w1-r0-sample/01-first.md",
        )
        self.assertEqual(
            state["nextPhasePath"],
            "docs/work/2026-05-07-w1-r0-sample/01-first.md",
        )
        self.assertEqual(
            state["phases"]["01-first.md"]["phasePath"],
            "docs/work/2026-05-07-w1-r0-sample/01-first.md",
        )
        self.assertIn("01-first.md", state["phases"])
        self.assertNotIn(str(self.temp_dir), json.dumps(state))

    def test_scope_guard_reports_out_of_scope_changes(self) -> None:
        report = build_scope_report(
            str(self.work_dir / "01-first.md"),
            [
                "docs/work/2026-05-07-w1-r0-sample/01-first.md",
                "src/app.ts",
                "src/other.ts",
            ],
        )

        self.assertEqual(report["status"], "warning")
        self.assertEqual(report["outOfScope"], ["src/other.ts"])

    def test_scope_guard_allows_managed_state_and_lockfile_derivatives(self) -> None:
        report = build_scope_report(
            str(self.work_dir / "01-first.md"),
            [
                "Cargo.toml",
                "Cargo.lock",
                ".make-docs/runs/2026-05-07-w1-r0-sample/state.json",
            ],
        )

        self.assertEqual(report["status"], "warning")
        self.assertEqual(report["outOfScope"], ["Cargo.toml"])
        self.assertEqual({item["path"] for item in report["allowedDerived"]}, {"Cargo.lock", ".make-docs/runs/2026-05-07-w1-r0-sample/state.json"})

    def test_phase_plan_warns_when_linked_source_count_conflicts(self) -> None:
        source = self.temp_dir / "docs" / "prd" / "01-source.md"
        source.parent.mkdir(parents=True)
        source.write_text("The implementation requires eleven crate stubs.\n", encoding="utf-8")
        (self.work_dir / "01-first.md").write_text(
            "# Phase 1: First\n\n"
            "[Source](../../prd/01-source.md)\n\n"
            "### Tasks\n\n"
            "- [ ] t1: Update `src/app.ts`.\n"
            "- [ ] t2: Update docs.\n",
            encoding="utf-8",
        )
        import os

        os.chdir(self.temp_dir)
        plan = build_plan("W1 R0 P1")

        self.assertIn("mentions 11 expected item(s)", plan["warnings"][0])

    def test_phase_gate_blocks_missing_evidence_and_passes_complete_state(self) -> None:
        complete_phase = self.work_dir / "03-complete.md"
        complete_phase.write_text(
            "\n".join(
                [
                    "# Phase 3: Complete",
                    "",
                    "## Stage 1 - Done",
                    "",
                    "### Tasks",
                    "",
                    "- [x] t1: Complete work.",
                    "",
                    "### Acceptance criteria",
                    "",
                    "- Complete.",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        import os

        os.chdir(self.temp_dir)
        blocked = build_gate_report(str(complete_phase), "commit-required")
        self.assertEqual(blocked["status"], "blocked")
        self.assertIn("validation has not been recorded as passed", blocked["blockers"])

        resolution = resolve_target(str(complete_phase), self.temp_dir)
        state_path = state_path_for(resolution)
        save_state(
            state_path,
            {
                "schemaVersion": 1,
                "waveDir": self.work_dir.as_posix(),
                "target": (self.work_dir / "03-complete.md").as_posix(),
                "activePhasePath": complete_phase.as_posix(),
                "commitPolicy": "commit-required",
                "phases": {
                    "03-complete.md": {
                        "phasePath": complete_phase.as_posix(),
                        "validation": {"status": "passed"},
                        "review": {"status": "not-required", "required": False},
                        "closeout": {"status": "passed"},
                        "commit": {"status": "passed", "sha": "abc123"},
                    }
                },
            },
        )

        passed = build_gate_report(str(complete_phase), "commit-required")
        self.assertEqual(passed["status"], "passed")
        self.assertEqual(passed["blockers"], [])

        refreshed = build_checkpoint(
            SimpleNamespace(
                target=str(complete_phase),
                phase=None,
                mode=None,
                commit_policy=None,
                status="complete",
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
        self.assertNotIn(str(self.temp_dir), json.dumps(refreshed["state"]))
        self.assertEqual(refreshed["state"]["target"], "docs/work/2026-05-07-w1-r0-sample/03-complete.md")
        self.assertEqual(
            refreshed["state"]["phases"]["03-complete.md"]["phasePath"],
            "docs/work/2026-05-07-w1-r0-sample/03-complete.md",
        )


if __name__ == "__main__":
    unittest.main()
