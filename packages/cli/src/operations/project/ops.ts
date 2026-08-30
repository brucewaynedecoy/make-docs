import { existsSync, lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadManifest, MANIFEST_RELATIVE_PATH } from "../../manifest";
import {
  assertLifecyclePlanSnapshotCurrent,
  createLifecycleMutationReceipt,
  createLifecyclePlanSnapshot,
} from "../../lifecycle-plan";
import { parseManagedBlock } from "../../managed-block";
import { getThinRouterManagedBody } from "../../project-projection";
import type { LifecycleMutationReceipt, PlannedAction } from "../../types";
import { HARNESS_TO_INSTRUCTION } from "../../types";
import { assertManagedPathHasNoSymlinks, relativePathToTarget } from "../../utils";
import {
  applyMigrationRoutingSurface,
  planMigrationRoutingSurface,
} from "../../migration";
import {
  validateProjectPathHygiene,
  type PathHygieneValidationResult,
} from "../../path-hygiene";
import type { OperationDefinition } from "../registry";
import { OperationError } from "../types";

const inputSchema = z.object({
  surface: z.enum(["archive", "artifacts", "assets"]),
  targetRoot: z.string().min(1).optional(),
}).strict();

const pathHygieneInputSchema = z.object({
  targetRoot: z.string().min(1).optional(),
  manifest: z.string().min(1).optional(),
  includeSkills: z.boolean().optional(),
  allowCommentToken: z.string().min(1).optional(),
}).strict();

export interface ProjectSurfaceEnsureOutput {
  schemaVersion: 1;
  targetRoot: string;
  surface: "archive" | "artifacts" | "assets";
  dryRun: boolean;
  plan: { snapshotId: string; actions: PlannedAction[] };
  receipt: LifecycleMutationReceipt | null;
}

export type ProjectPathHygieneValidateOutput = PathHygieneValidationResult;

export const projectOperations: OperationDefinition[] = [{
  id: "project.surface.ensure",
  summary: "Ensure one selected project support surface and its configured routers.",
  mutates: "write",
  status: "active",
  inputSchema,
  handler(rawInput, context) {
    const input = inputSchema.parse(rawInput);
    const targetRoot = path.resolve(input.targetRoot ?? context.cwd);
    const manifest = loadManifest(targetRoot);
    if (!manifest?.projectId || !manifest.resourceProjection) {
      throw new OperationError(
        "This project does not have trusted P4 manifest evidence. Run `make-docs setup reconfigure` before you ensure a project surface.",
      );
    }
    const actions: PlannedAction[] = [];
    const surfaceAction = planMigrationRoutingSurface(targetRoot, input.surface);
    const surfacePath = surfaceAction.relativePath;
    actions.push(surfaceAction);
    for (const [harness, instruction] of Object.entries(HARNESS_TO_INSTRUCTION)) {
      if (!manifest.selections.harnesses[harness as keyof typeof HARNESS_TO_INSTRUCTION]) continue;
      for (const relativePath of [instruction, `docs/${instruction}`]) {
        assertManagedPathHasNoSymlinks(targetRoot, relativePath);
        const entry = manifest.files[relativePath];
        if (entry?.ownershipClass !== "managed-block") {
          throw new OperationError(`Router ownership is not trusted for ${relativePath}. Run setup reconfigure and review the conflict.`);
        }
        const absolutePath = relativePathToTarget(targetRoot, relativePath);
        if (!existsSync(absolutePath) || lstatSync(absolutePath).isSymbolicLink()) {
          throw new OperationError(`Router evidence is missing or unsafe at ${relativePath}. Run setup reconfigure and review the plan.`);
        }
        const parsed = parseManagedBlock(readFileSync(absolutePath, "utf8"));
        if (parsed.state !== "valid" || parsed.body !== getThinRouterManagedBody(relativePath)) {
          throw new OperationError(`Router evidence changed or is malformed at ${relativePath}. Run setup reconfigure and review the conflict.`);
        }
        actions.push({ type: "noop", disposition: "preserve", relativePath, reason: "Configured router is valid and unchanged." });
      }
    }
    const snapshot = createLifecyclePlanSnapshot(targetRoot, actions);
    if (!context.dryRun) {
      assertLifecyclePlanSnapshotCurrent(targetRoot, snapshot);
      assertManagedPathHasNoSymlinks(targetRoot, MANIFEST_RELATIVE_PATH);
      for (const action of actions) {
        assertManagedPathHasNoSymlinks(targetRoot, action.relativePath);
      }
      applyMigrationRoutingSurface(targetRoot, surfaceAction);
    }
    const receipt = context.dryRun || actions[0]?.type === "noop"
      ? null
      : createLifecycleMutationReceipt({
          operation: "project.surface.ensure",
          projectId: manifest.projectId,
          manifestSchemaVersion: manifest.schemaVersion,
          profileId: manifest.profileId,
          selectedResourceTypes: manifest.selections.resourceProjection ?? [],
          actions,
          committedAt: context.now(),
        });
    return {
      schemaVersion: 1,
      targetRoot,
      surface: input.surface,
      dryRun: context.dryRun,
      plan: { snapshotId: snapshot.id, actions },
      receipt,
    } satisfies ProjectSurfaceEnsureOutput;
  },
}, {
  id: "project.path-hygiene.validate",
  summary: "Validate managed project paths with the TypeScript path-hygiene core.",
  mutates: "read",
  status: "active",
  inputSchema: pathHygieneInputSchema,
  handler(rawInput, context) {
    const input = pathHygieneInputSchema.parse(rawInput);
    const targetRoot = path.resolve(input.targetRoot ?? context.cwd);
    return validateProjectPathHygiene({
      projectRoot: targetRoot,
      ...(input.manifest ? { manifestPath: input.manifest } : {}),
      ...(input.includeSkills !== undefined ? { includeSkills: input.includeSkills } : {}),
      ...(input.allowCommentToken ? { allowToken: input.allowCommentToken } : {}),
    });
  },
}];
