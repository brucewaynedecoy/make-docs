import path from "node:path";
import { z } from "zod";
import type { OperationDefinition } from "../../registry";
import { invokePlaybook, type PlaybookInvocationPlan } from "../index";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  storeRoot: z.string().optional(),
  ref: z.string(),
  requestedStack: z.string().nullish(),
  harness: z.string(),
  runId: z.string().optional(),
  outputSurfaceClaims: z.array(z.string()).optional(),
  allowUnattended: z.boolean().optional(),
  requiredCapabilities: z.array(z.string()).optional(),
  preferredCapabilities: z.array(z.string()).optional(),
});

export const playbookInvokeOperation: OperationDefinition<
  z.infer<typeof inputSchema>,
  PlaybookInvocationPlan
> = {
  id: "playbook.invoke",
  summary:
    "Operation `playbook.invoke`: build a generic Run Playbook invocation plan without requiring plugin packaging.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    return invokePlaybook({
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      storeRoot: input.storeRoot,
      ref: input.ref,
      requestedStack: input.requestedStack,
      harness: input.harness,
      runId: input.runId,
      outputSurfaceClaims: input.outputSurfaceClaims,
      allowUnattended: input.allowUnattended,
      requiredCapabilities: input.requiredCapabilities,
      preferredCapabilities: input.preferredCapabilities,
    });
  },
};
