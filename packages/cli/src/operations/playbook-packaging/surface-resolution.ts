import { OperationError } from "../types";
import { getHarnessPackageAdapter } from "./adapters";
import type {
  PackageAdapterExposureMode,
  PackageAdapterPathTemplate,
  PackagePlanStop,
  PackageSurfacePreconditionResult,
  PackageSurfaceResolution,
  PackageSurfaceResolutionInput,
  PlaybookPackageSurface,
} from "./types";
import { validatePackageTarget } from "./validation";

export function resolvePackageSurface(input: PackageSurfaceResolutionInput): PackageSurfaceResolution {
  const target = validatePackageTarget(input.target);
  const adapter = getHarnessPackageAdapter({
    harnessId: target.harness,
    adapters: input.adapters,
  });
  if (!adapter.supportedOutputKinds.includes(target.outputKind)) {
    return unsupportedResolution(input, "unsupported-output-kind", `Harness \`${target.harness}\` does not support ${target.outputKind} outputs.`);
  }
  if (!adapter.supportedScopes.includes(target.scope)) {
    return unsupportedResolution(input, "manual-review-required", `Harness \`${target.harness}\` does not support ${target.scope} scope.`);
  }

  const template = selectPathTemplate(adapter.pathTemplates, {
    outputKind: target.outputKind,
    requestedSurface: target.surface,
    scope: target.scope,
  });
  if (!template) {
    return unsupportedResolution(input, "unsupported-surface", `No ${target.outputKind} ${target.surface} path template exists for ${target.harness} ${target.scope}.`);
  }

  const preconditions = adapter.preconditions.map((precondition): PackageSurfacePreconditionResult => ({
    ...precondition,
    state: input.preconditions?.[precondition.id] ?? "unknown",
  }));
  const stops: PackagePlanStop[] = [];
  for (const precondition of preconditions) {
    if (precondition.required && precondition.state !== "satisfied") {
      stops.push({
        reason: "manual-review-required",
        message: `Precondition \`${precondition.id}\` is ${precondition.state}. ${precondition.description}`,
      });
    }
  }

  const exposureMode = chooseExposureMode({
    preferred: adapter.preferredExposureMode,
    fallback: adapter.fallbackExposureMode,
    platform: input.platform ?? "posix",
    symlinkAvailable: input.symlinkAvailable ?? true,
    scope: target.scope,
  });
  const fallbackUsed = exposureMode !== adapter.preferredExposureMode;
  const concreteSurface = template.surface === "auto" ? "native" : template.surface;
  return {
    status: stops.length > 0 ? "manual-review-required" : "ready",
    harnessId: adapter.harnessId,
    outputKind: target.outputKind,
    requestedSurface: target.surface,
    surface: concreteSurface,
    scope: target.scope,
    path: renderTemplate(template.template, input.packageId),
    exposureMode,
    fallbackExposureMode: adapter.fallbackExposureMode,
    fallbackUsed,
    preconditions,
    lifecycleRules: adapter.lifecycleRules,
    conformanceRequirements: adapter.conformanceRequirements,
    stops,
  };
}

export function readPackageSurfaceResolution(input: PackageSurfaceResolutionInput): {
  value: PackageSurfaceResolution;
  provenance: {
    domain: "playbook-packaging";
    operation: "playbook-package-surface-resolve";
    source: "shared";
    target: string;
  };
} {
  return {
    value: resolvePackageSurface(input),
    provenance: {
      domain: "playbook-packaging",
      operation: "playbook-package-surface-resolve",
      source: "shared",
      target: input.target.harness,
    },
  };
}

function selectPathTemplate(
  templates: PackageAdapterPathTemplate[],
  input: {
    outputKind: string;
    requestedSurface: PlaybookPackageSurface;
    scope: string;
  },
): PackageAdapterPathTemplate | null {
  const candidates = templates.filter(
    (template) => template.outputKind === input.outputKind && template.scope === input.scope,
  );
  if (input.requestedSurface !== "auto") {
    return candidates.find((template) => template.surface === input.requestedSurface) ?? null;
  }
  return candidates.find((template) => template.surface === "native") ??
    candidates.find((template) => template.surface === "agents-standard") ??
    null;
}

function chooseExposureMode(input: {
  preferred: PackageAdapterExposureMode;
  fallback: PackageAdapterExposureMode;
  platform: "posix" | "windows";
  symlinkAvailable: boolean;
  scope: string;
}): PackageAdapterExposureMode {
  if (input.scope === "export-only") {
    return "export-only";
  }
  if (input.preferred !== "symlink") {
    return input.preferred;
  }
  if (input.platform === "windows" || !input.symlinkAvailable) {
    if (input.fallback === "generated-adapter") {
      throw new OperationError("Symlink fallback must not create generic generated stubs for package exposure.");
    }
    return input.fallback;
  }
  return "symlink";
}

function renderTemplate(template: string, packageId: string): string {
  return template.replaceAll("{packageId}", packageId);
}

function unsupportedResolution(
  input: PackageSurfaceResolutionInput,
  reason: PackagePlanStop["reason"],
  message: string,
): PackageSurfaceResolution {
  return {
    status: "unsupported",
    harnessId: input.target.harness,
    outputKind: input.target.outputKind,
    requestedSurface: input.target.surface,
    surface: input.target.surface === "auto" ? "native" : input.target.surface,
    scope: input.target.scope,
    path: "",
    exposureMode: "copy-mirror",
    fallbackExposureMode: "copy-mirror",
    fallbackUsed: true,
    preconditions: [],
    lifecycleRules: [],
    conformanceRequirements: [],
    stops: [{ reason, message }],
  };
}
