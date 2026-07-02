import path from "node:path";
import { z } from "zod";
import {
  createPlaybookPackagePlan,
  PLAYBOOK_PACKAGE_REVIEW_STATUSES,
  type PlaybookPackagePlannerInput,
} from "../../playbook-packaging";
import type { OperationDefinition } from "../../registry";
import { packageTargetSchema } from "./shared";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  refs: z.array(z.string().min(1)).min(1),
  requestedStack: z.enum(["build", "run"]).nullable().optional(),
  target: packageTargetSchema,
  packageId: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  reviewStatus: z.enum(PLAYBOOK_PACKAGE_REVIEW_STATUSES).optional(),
  reviewedBy: z.string().optional(),
  supportEvidenceRefs: z.array(z.string()).optional(),
  nonInteractive: z.boolean().optional(),
});

type PackagePlanInput = z.infer<typeof inputSchema>;

const definition: OperationDefinition<PackagePlanInput> = {
  id: "package.plan",
  summary: "Create a reviewable Playbook package plan without writing generated outputs.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input, context) {
    return createPlaybookPackagePlan({
      ...input,
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
    } as unknown as PlaybookPackagePlannerInput);
  },
};

export const packagePlanOperation = definition as OperationDefinition;
