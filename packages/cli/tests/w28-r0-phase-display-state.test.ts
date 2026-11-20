import { expect, test } from "vitest";
import { phaseDisplayState } from "../src/operations/work/backlog/presentation";
import type { WorkPhaseFact } from "../src/operations/work/backlog/schemas";

// W28 R0 P9: a recorded status matches whole completion values, so `incomplete` is not complete.
function phase(status: string | null, completed: boolean[]): WorkPhaseFact {
  return {
    recordedStatus: { value: status, evidence: [] },
    tasks: completed.map(value => ({ completed: { value, evidence: [] } })),
  } as unknown as WorkPhaseFact;
}

test.each(["complete", "completed", "closed", "done", "Completed"])("status %s displays as complete", status => {
  expect(phaseDisplayState(phase(status, [false]))).toBe("complete");
});

test("status incomplete falls through to the task checks", () => {
  expect(phaseDisplayState(phase("incomplete", [true, false]))).toBe("open");
  expect(phaseDisplayState(phase("incomplete", [true, true]))).toBe("complete");
});
