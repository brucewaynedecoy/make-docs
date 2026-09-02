import { existsSync, lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  getManifestFileHash,
  loadManifest,
  MANIFEST_RELATIVE_PATH,
  writeManifest,
} from "../../manifest";
import {
  assertLifecyclePlanSnapshotCurrent,
  createLifecycleMutationReceipt,
  createLifecyclePlanSnapshot,
} from "../../lifecycle-plan";
import { parseManagedBlock } from "../../managed-block";
import {
  createProjectSurfaceRouterAssets,
  createRouterOwnershipManifestEntry,
  getThinRouterManagedBody,
} from "../../project-projection";
import { resolveInstallProfile } from "../../profile";
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
    if (!manifest?.projectId || !manifest.resourceProjection || !manifest.routerOwnership) {
      throw new OperationError(
        "This project does not have trusted P4 manifest evidence. Run `make-docs setup reconfigure` before you ensure a project surface.",
      );
    }
    const actions: PlannedAction[] = [];
    const surfaceAction = planMigrationRoutingSurface(targetRoot, input.surface);
    const surfacePath = surfaceAction.relativePath;
    actions.push(surfaceAction);
    for (const entry of Object.values(manifest.routerOwnership.routers)) {
      if (entry.routerClass !== "bootstrap") continue;
      const relativePath = entry.relativePath;
      assertManagedPathHasNoSymlinks(targetRoot, relativePath);
      const fileEntry = manifest.files[relativePath];
      if (
        fileEntry?.ownershipClass !== "managed-block" ||
        fileEntry.sourceId !== entry.sourceId ||
        entry.ownershipClass !== "managed-snapshot" ||
        entry.provenanceState !== "verified" ||
        entry.lifecycleDisposition !== "active" ||
        entry.installedHash !== fileEntry.hash
      ) {
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
    const surfaceRouterAssets = createProjectSurfaceRouterAssets(
      resolveInstallProfile(manifest.selections),
      input.surface,
    );
    const surfaceRouterActions: PlannedAction[] = [];
    for (const asset of surfaceRouterAssets) {
      assertManagedPathHasNoSymlinks(targetRoot, asset.relativePath);
      const absolutePath = relativePathToTarget(targetRoot, asset.relativePath);
      const contentHash = getManifestFileHash(asset.relativePath, asset.content);
      if (!contentHash) {
        throw new OperationError(`Generated project surface router is malformed: ${asset.relativePath}.`);
      }
      if (!existsSync(absolutePath)) {
        const action: PlannedAction = {
          type: "create",
          disposition: "create",
          relativePath: asset.relativePath,
          sourceId: asset.sourceId,
          content: asset.content,
          contentHash,
          reason: "Configured project surface router is absent.",
        };
        actions.push(action);
        surfaceRouterActions.push(action);
        continue;
      }
      if (!lstatSync(absolutePath).isFile() || lstatSync(absolutePath).isSymbolicLink()) {
        throw new OperationError(`Project surface router is not a safe file: ${asset.relativePath}.`);
      }
      const currentContent = readFileSync(absolutePath, "utf8");
      const currentHash = getManifestFileHash(asset.relativePath, currentContent);
      const fileEntry = manifest.files[asset.relativePath];
      const ownershipEntry = manifest.routerOwnership.routers[asset.relativePath];
      if (
        currentContent !== asset.content ||
        currentHash !== contentHash ||
        fileEntry?.hash !== contentHash ||
        fileEntry.sourceId !== asset.sourceId ||
        fileEntry.ownershipClass !== "managed-block" ||
        ownershipEntry?.sourceId !== asset.sourceId ||
        ownershipEntry.routerClass !== "on-demand-surface" ||
        ownershipEntry.ownershipClass !== "managed-snapshot" ||
        ownershipEntry.provenanceState !== "verified" ||
        ownershipEntry.lifecycleDisposition !== "active" ||
        ownershipEntry.installedHash !== contentHash
      ) {
        throw new OperationError(
          `Project surface router ownership or content requires explicit review: ${asset.relativePath}.`,
        );
      }
      const action: PlannedAction = {
        type: "noop",
        disposition: "preserve",
        relativePath: asset.relativePath,
        sourceId: asset.sourceId,
        contentHash,
        reason: "Configured project surface router is valid and unchanged.",
      };
      actions.push(action);
      surfaceRouterActions.push(action);
    }
    const snapshot = createLifecyclePlanSnapshot(targetRoot, actions);
    if (!context.dryRun) {
      assertLifecyclePlanSnapshotCurrent(targetRoot, snapshot);
      assertManagedPathHasNoSymlinks(targetRoot, MANIFEST_RELATIVE_PATH);
      for (const action of actions) {
        assertManagedPathHasNoSymlinks(targetRoot, action.relativePath);
      }
      applyMigrationRoutingSurface(targetRoot, surfaceAction, surfaceRouterActions);
      const updatedAt = context.now();
      const nextFiles = { ...manifest.files };
      const nextRouters = { ...manifest.routerOwnership.routers };
      for (const asset of surfaceRouterAssets) {
        const contentHash = getManifestFileHash(asset.relativePath, asset.content)!;
        nextFiles[asset.relativePath] = {
          hash: contentHash,
          sourceId: asset.sourceId,
          ownershipClass: "managed-block",
        };
        const harness = asset.sourceId.split(":")[1] as keyof typeof HARNESS_TO_INSTRUCTION;
        nextRouters[asset.relativePath] = createRouterOwnershipManifestEntry({
          asset,
          harness,
          instructionKind: HARNESS_TO_INSTRUCTION[harness],
          packageMeta: { name: manifest.packageName, version: manifest.packageVersion },
          verifiedAt: updatedAt,
          previous: manifest.routerOwnership.routers[asset.relativePath],
        });
      }
      writeManifest(targetRoot, {
        ...manifest,
        updatedAt,
        files: nextFiles,
        routerOwnership: {
          ...manifest.routerOwnership,
          routers: nextRouters,
        },
      });
    }
    const receipt = context.dryRun || actions.every((action) => action.type === "noop")
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
