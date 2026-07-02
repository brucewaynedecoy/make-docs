import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { evaluateHarnessCapabilities, type HarnessCapabilityEvaluation } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  harness: z.string(),
  requiredCapabilities: z.array(z.string()).optional(),
  preferredCapabilities: z.array(z.string()).optional(),
});

export const playbookCapabilitiesOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  HarnessCapabilityEvaluation
> = {
  id: "playbook.capabilities",
  summary:
    "Operation `playbook.capabilities`: evaluate reviewed harness capabilities for a playbook execution request and report required/preferred coverage with guidance.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return evaluateHarnessCapabilities({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      harness: input.harness,
      requiredCapabilities: input.requiredCapabilities,
      preferredCapabilities: input.preferredCapabilities,
    });
  },
};
