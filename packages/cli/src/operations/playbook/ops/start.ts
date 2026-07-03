import path from "node:path";
import { z } from "zod";
import { PLAYBOOK_STEP_STATUSES } from "../../../playbook";
import type { OperationDefinition } from "../../registry";
import { createPlaybookRunState } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  ref: z.string(),
  requestedStack: z.string().nullish(),
  harness: z.string(),
  requiredCapabilities: z.array(z.string()).optional(),
  preferredCapabilities: z.array(z.string()).optional(),
  runId: z.string().optional(),
  parentRunId: z.string().nullish(),
  executionMode: z.enum(["serial", "parallel"]).optional(),
  outputSurfaceClaims: z.array(z.string()).optional(),
  currentStep: z.string().nullish(),
  currentGate: z.string().nullish(),
  // Run status is the shared W18 R6 step-status vocabulary (R-STATE-2).
  status: z.enum(PLAYBOOK_STEP_STATUSES).optional(),
  resumeHints: z.array(z.string()).optional(),
});

export const playbookStartOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  ReturnType<typeof createPlaybookRunState>
> = {
  id: "playbook.start",
  summary:
    "Operation `playbook.start`: create Make Docs-owned Playbook run state in the global store before execution begins.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return createPlaybookRunState({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      ref: input.ref,
      requestedStack: input.requestedStack,
      harness: input.harness,
      requiredCapabilities: input.requiredCapabilities,
      preferredCapabilities: input.preferredCapabilities,
      runId: input.runId,
      parentRunId: input.parentRunId,
      executionMode: input.executionMode,
      outputSurfaceClaims: input.outputSurfaceClaims,
      currentStep: input.currentStep,
      currentGate: input.currentGate,
      status: input.status,
      resumeHints: input.resumeHints,
    });
  },
};
