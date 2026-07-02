import path from "node:path";
import { z } from "zod";
import {
  validatePackagePlan,
  writePlaybookPackageOutputs,
  type PlaybookPackageWriteInput,
} from "../../playbook-packaging";
import type { OperationDefinition } from "../../registry";
import { packagePlatformSchema, packagePreconditionStatesSchema } from "./shared";

const inputSchema = z.object({
  repoRoot: z.string().optional(),
  homeDir: z.string().optional(),
  // Structured plan object (the CLI's `--plan-json` payload, already parsed);
  // its shape is validated by `validatePackagePlan` in the handler rather
  // than re-modelled in zod.
  plan: z.looseObject({}),
  platform: packagePlatformSchema.optional(),
  symlinkAvailable: z.boolean().optional(),
  preconditions: packagePreconditionStatesSchema.optional(),
});

type PackageWriteInput = z.infer<typeof inputSchema>;

const definition: OperationDefinition<PackageWriteInput> = {
  id: "package.write",
  summary: "Write accepted Playbook package outputs and lifecycle-visible records.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(input, context) {
    const request: PlaybookPackageWriteInput = {
      repoRoot: path.resolve(context.cwd, input.repoRoot ?? "."),
      homeDir: input.homeDir,
      plan: validatePackagePlan(input.plan),
      platform: input.platform,
      symlinkAvailable: input.symlinkAvailable,
      preconditions: input.preconditions,
      // R-CORE-1: safety gates are context-owned, not input fields. Writes
      // happen only when the calling surface granted them and dry-run is
      // off; destructive confirmations arrive as named approvals instead of
      // per-surface flags. They stay conditional (the impl decides when an
      // overwrite or stale removal needs them), so they are not declared as
      // registry-level `requiredApprovals`.
      write: context.writesAllowed && !context.dryRun,
      reviewedOverwrite: context.approvals.has("reviewed-overwrite"),
      backupSnapshotReviewed: context.approvals.has("backup-snapshot-reviewed"),
    };
    return writePlaybookPackageOutputs(request);
  },
};

export const packageWriteOperation = definition as OperationDefinition;
