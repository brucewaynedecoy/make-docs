#!/usr/bin/env python3
"""Tests for work-on-phase helper behavior."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from work_on_wave_common import WaveError, resolve_target


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

    def test_rejects_directory_targets(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            wave_dir = root / "docs" / "work" / "2026-05-12-w1-r0-demo"
            wave_dir.mkdir(parents=True)
            (wave_dir / "01-first.md").write_text("# First\n\n### Tasks\n\n- [ ] t1: Do it\n")

            with self.assertRaisesRegex(WaveError, "directory targets are ambiguous"):
                resolve_target(wave_dir.as_posix(), root)


if __name__ == "__main__":
    unittest.main()
