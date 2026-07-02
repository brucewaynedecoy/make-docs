import { z } from "zod";
import {
  resolvePackageSurface,
  type PackageSurfaceResolutionInput,
} from "../../playbook-packaging";
import type { OperationDefinition } from "../../registry";
import {
  packagePlatformSchema,
  packagePreconditionStatesSchema,
  packageTargetSchema,
} from "./shared";

const inputSchema = z.object({
  target: packageTargetSchema,
  packageId: z.string().min(1),
  platform: packagePlatformSchema.optional(),
  symlinkAvailable: z.boolean().optional(),
  preconditions: packagePreconditionStatesSchema.optional(),
});

type PackageSurfaceResolveInput = z.infer<typeof inputSchema>;

const definition: OperationDefinition<PackageSurfaceResolveInput> = {
  id: "package.surface-resolve",
  summary: "Resolve a Playbook package target through a harness adapter without writing outputs.",
  mutates: "read",
  status: "active",
  inputSchema,
  handler(input) {
    return resolvePackageSurface(input as unknown as PackageSurfaceResolutionInput);
  },
};

export const packageSurfaceResolveOperation = definition as OperationDefinition;
