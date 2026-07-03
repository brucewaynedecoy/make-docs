/**
 * Harness capability descriptor (W18 R8 P1, R-CAP-2).
 *
 * The descriptor is the single place harness-specific packaging knowledge
 * lives: the harness identifier, the agentic primitives it supports, its
 * native distributable container(s) and their file layout including paths and
 * manifest filenames, a lifecycle event map from logical Playbook events to
 * harness hook points, the exposure modes it supports, its registration
 * model, and its preconditions. Adapter declarations no longer author path
 * templates themselves; they derive them from the descriptor via
 * {@link deriveAdapterPathTemplates} so the descriptor stays the carrier of
 * harness paths and manifest shapes (R-CAP-2, R-ADAPT-1).
 *
 * Implementer decisions recorded here:
 * - Descriptor content is authored as typed constants and checked with
 *   invariant validation ({@link validateHarnessCapabilityDescriptor}), the
 *   same pattern the adapter declarations use.
 * - `registration.autoRegister` is typed as `false`: registration and
 *   marketplace files are generated but never auto-installed (R-MKT-1); the
 *   config-gated opt-in seam is owned by the global-store lineage (R-MKT-2)
 *   and is not represented here.
 * - Verification status vocabulary (W18 R8 P3, R-ADAPT-1): `provisional` is
 *   the unverified state — the declared shapes are not (or not fully)
 *   confirmed against the real harness — and `verified` means the declared
 *   contract was confirmed where the verification reference names. Support
 *   statuses are a separate, tuple-bound axis owned by the W18 R9 conformance
 *   lineage (R-PROV-3, R-TEST-5); no verification status is
 *   harness-recognition evidence.
 * - Re-verification mechanism (W18 R8 P3, R-ADAPT-1): a `verified`
 *   verification block records a `contractDigest` — a deterministic
 *   fingerprint of the declared contract surface (placement paths, manifest
 *   filenames, skill file templates, registration files and model, hosted
 *   primitives, hook points, and exposure modes) computed by
 *   {@link computeHarnessContractDigest} and recorded as a literal at
 *   verification time. Validation recomputes the digest on every load, so any
 *   change to declared paths, manifest shapes, or registration steps fails
 *   validation and demands re-verification against the real harness before
 *   the recorded digest (and its reference) may be updated in review.
 *   `provisional` contracts carry no digest: they make no verified claim to
 *   invalidate and are already gated to export-only or provisional output
 *   without a support claim ({@link capSupportStatusForVerification}).
 */

import { createHash } from "node:crypto";
import { PLAYBOOK_KNOWN_EVENTS, type PlaybookKnownEvent } from "../../playbook";
import { OperationError } from "../types";
import {
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SURFACES,
  type PackageAdapterExposureMode,
  type PackageAdapterPathTemplate,
  type PackageAdapterPrecondition,
  type PlaybookPackageOutputKind,
  type PlaybookPackageScope,
  type PlaybookPackageSupportStatus,
  type PlaybookPackageSurface,
} from "./types";

/**
 * The agentic primitives a harness may host (R-CAP-1). The list carries the
 * design's enumeration — plugin, hook, extension, skill, MCP server — as a
 * closed vocabulary so container declarations and implied-agentic mapping
 * share one spelling.
 */
export const HARNESS_AGENTIC_PRIMITIVES = [
  "skill",
  "plugin",
  "extension",
  "hook",
  "mcp-server",
] as const;
export type HarnessAgenticPrimitive = (typeof HARNESS_AGENTIC_PRIMITIVES)[number];

/**
 * Native container kinds a descriptor may declare. `outputKind` `plugin` is
 * the harness's richest native container, which the adapter realizes as a
 * plugin, an extension, or another native container per the descriptor —
 * nothing hardcodes `plugin` as the only native container (R-CAP-3).
 */
export const HARNESS_CONTAINER_KINDS = [
  "plugin",
  "extension",
  "skills-directory",
] as const;
export type HarnessContainerKind = (typeof HARNESS_CONTAINER_KINDS)[number];

/** The two distributable profiles `outputKind` maps onto (R-CAP-3). */
export const DISTRIBUTABLE_PROFILES = ["native", "portable"] as const;
export type DistributableProfile = (typeof DISTRIBUTABLE_PROFILES)[number];

export const HARNESS_REGISTRATION_MODEL_KINDS = [
  "marketplace-entry",
  "direct-discovery",
  "settings-reference",
] as const;
export type HarnessRegistrationModelKind = (typeof HARNESS_REGISTRATION_MODEL_KINDS)[number];

export const HARNESS_DESCRIPTOR_VERIFICATION_STATUSES = ["provisional", "verified"] as const;
export type HarnessDescriptorVerificationStatus =
  (typeof HARNESS_DESCRIPTOR_VERIFICATION_STATUSES)[number];

/** One concrete placement of a container for a (surface, scope) pair. */
export interface HarnessContainerPlacement {
  surface: Exclude<PlaybookPackageSurface, "auto">;
  scope: PlaybookPackageScope;
  /** Path template with `{packageId}` and optional `<user-home>` markers. */
  pathTemplate: string;
}

/** The container's file layout: paths, manifest filenames, registration files (R-CAP-2). */
export interface HarnessContainerLayout {
  placements: HarnessContainerPlacement[];
  /** Manifest path relative to the container root; null when the container has none. */
  manifestFilename: string | null;
  /** Where each projected skill lands within the container; null when the container is the skill. */
  skillFileTemplate: string | null;
  /** Registration/marketplace files the container participates in (generated, never auto-installed; R-MKT-1). */
  registrationFiles: string[];
}

export interface HarnessContainerDeclaration {
  containerId: string;
  kind: HarnessContainerKind;
  /** Which distributable profile this container realizes (R-CAP-3). */
  profile: DistributableProfile;
  /** Relative richness within the harness; the adapter selects the richest match (R-CAP-4). */
  richness: number;
  /** Primitives this container can carry; always includes `skill` (R-CAP-3). */
  hostedPrimitives: HarnessAgenticPrimitive[];
  layout: HarnessContainerLayout;
}

export interface HarnessRegistrationModel {
  kind: HarnessRegistrationModelKind;
  description: string;
  /** Always false: generate but do not auto-register (R-MKT-1). */
  autoRegister: false;
}

/** A logical Playbook event bound to a concrete harness hook point (R-CAP-5). */
export interface HarnessLifecycleHookBinding {
  hookPoint: string;
  description: string;
}

export interface HarnessDescriptorVerification {
  status: HarnessDescriptorVerificationStatus;
  /** Where the contract was (or will be) confirmed (R-ADAPT-1). */
  reference: string;
  /** Declared shapes that remain inferred and await real-harness verification. */
  provisionalNotes: string[];
  /**
   * Fingerprint of the declared contract surface recorded at verification
   * time; required (and revalidated) for `verified` contracts so changing
   * declared paths, manifest shapes, or registration steps invalidates the
   * verification and demands re-verification (R-ADAPT-1). `null` for
   * `provisional` contracts, which make no verified claim to invalidate.
   */
  contractDigest: string | null;
}

export interface HarnessCapabilityDescriptor {
  harnessId: string;
  supportedPrimitives: HarnessAgenticPrimitive[];
  containers: HarnessContainerDeclaration[];
  /** Logical event → harness hook point; absent events have no hook support (R-CAP-5). */
  lifecycleEventMap: Partial<Record<PlaybookKnownEvent, HarnessLifecycleHookBinding>>;
  supportedExposureModes: PackageAdapterExposureMode[];
  preferredExposureMode: PackageAdapterExposureMode;
  fallbackExposureMode: PackageAdapterExposureMode;
  registration: HarnessRegistrationModel;
  preconditions: PackageAdapterPrecondition[];
  verification: HarnessDescriptorVerification;
}

/**
 * Computes the fingerprint of a descriptor's declared contract surface — the
 * placement paths, manifest filenames, skill file templates, registration
 * files and model kind, hosted primitives, hook points, and exposure modes an
 * adapter's verification claim covers (R-ADAPT-1). The digest is recorded as
 * a literal on `verified` contracts and recomputed by validation so a drifted
 * declaration fails closed demanding re-verification.
 */
export function computeHarnessContractDigest(
  descriptor: Omit<HarnessCapabilityDescriptor, "verification">,
): string {
  const contractSurface = {
    harnessId: descriptor.harnessId,
    supportedPrimitives: [...descriptor.supportedPrimitives].sort(),
    containers: descriptor.containers.map((container) => ({
      containerId: container.containerId,
      kind: container.kind,
      profile: container.profile,
      hostedPrimitives: [...container.hostedPrimitives].sort(),
      placements: container.layout.placements.map((placement) => ({
        surface: placement.surface,
        scope: placement.scope,
        pathTemplate: placement.pathTemplate,
      })),
      manifestFilename: container.layout.manifestFilename,
      skillFileTemplate: container.layout.skillFileTemplate,
      registrationFiles: [...container.layout.registrationFiles],
    })),
    lifecycleEventMap: Object.entries(descriptor.lifecycleEventMap)
      .map(([event, binding]) => [event, binding?.hookPoint ?? null] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
    registrationModel: descriptor.registration.kind,
    supportedExposureModes: [...descriptor.supportedExposureModes].sort(),
  };
  const digest = createHash("sha256").update(JSON.stringify(contractSurface)).digest("hex");
  return `sha256:${digest.slice(0, 16)}`;
}

/**
 * The R-ADAPT-1 status gate: an adapter whose contract is unverified may
 * produce only export-only or provisional output and must not carry a support
 * claim, so a `validated` support claim is capped to `provisional` unless the
 * harness contract verification is `verified`. Tuple-bound conformance
 * evidence stays the separate W18 R9 bar (R-PROV-3, R-TEST-5).
 */
export function capSupportStatusForVerification(
  status: PlaybookPackageSupportStatus,
  verification: HarnessDescriptorVerification | null | undefined,
): PlaybookPackageSupportStatus {
  if (status === "validated" && verification?.status !== "verified") {
    return "provisional";
  }
  return status;
}

export function profileForOutputKind(outputKind: PlaybookPackageOutputKind): DistributableProfile {
  return outputKind === "plugin" ? "native" : "portable";
}

export function outputKindForProfile(profile: DistributableProfile): PlaybookPackageOutputKind {
  return profile === "native" ? "plugin" : "skills-bundle";
}

/**
 * Derives the adapter path templates from the descriptor so the descriptor —
 * not the adapter module — carries harness paths and manifest shapes (R-CAP-2).
 */
export function deriveAdapterPathTemplates(
  descriptor: HarnessCapabilityDescriptor,
): PackageAdapterPathTemplate[] {
  return descriptor.containers.flatMap((container) =>
    container.layout.placements.map((placement) => ({
      outputKind: outputKindForProfile(container.profile),
      surface: placement.surface,
      scope: placement.scope,
      template: placement.pathTemplate,
    })),
  );
}

/**
 * Derives the descriptor-owned fields of a harness adapter declaration.
 * Ownership classes, lifecycle rules, and conformance requirements stay
 * adapter-side: they are Make Docs lifecycle policy, not harness packaging
 * knowledge. The verification reference and status ride along so every
 * adapter declaration — not just the descriptor — names where its contract
 * was confirmed and how far that confirmation goes (R-ADAPT-1).
 */
export function deriveAdapterDeclarationCore(descriptor: HarnessCapabilityDescriptor): {
  harnessId: string;
  supportedOutputKinds: PlaybookPackageOutputKind[];
  supportedSurfaces: PlaybookPackageSurface[];
  supportedScopes: PlaybookPackageScope[];
  pathTemplates: PackageAdapterPathTemplate[];
  preconditions: PackageAdapterPrecondition[];
  preferredExposureMode: PackageAdapterExposureMode;
  fallbackExposureMode: PackageAdapterExposureMode;
  verification: HarnessDescriptorVerification;
} {
  const pathTemplates = deriveAdapterPathTemplates(descriptor);
  const surfaces = new Set(pathTemplates.map((template) => template.surface));
  const scopes = new Set(pathTemplates.map((template) => template.scope));
  const outputKinds = new Set(pathTemplates.map((template) => template.outputKind));
  return {
    harnessId: descriptor.harnessId,
    supportedOutputKinds: PLAYBOOK_PACKAGE_OUTPUT_KINDS.filter((kind) => outputKinds.has(kind)),
    supportedSurfaces: PLAYBOOK_PACKAGE_SURFACES.filter(
      (surface) => surface === "auto" || surfaces.has(surface),
    ),
    supportedScopes: PLAYBOOK_PACKAGE_SCOPES.filter((scope) => scopes.has(scope)),
    pathTemplates,
    preconditions: descriptor.preconditions,
    preferredExposureMode: descriptor.preferredExposureMode,
    fallbackExposureMode: descriptor.fallbackExposureMode,
    verification: descriptor.verification,
  };
}

const KNOWN_EVENT_SET = new Set<string>(PLAYBOOK_KNOWN_EVENTS);

export function validateHarnessCapabilityDescriptor(
  descriptor: HarnessCapabilityDescriptor,
): HarnessCapabilityDescriptor {
  const label = `harness capability descriptor \`${descriptor.harnessId}\``;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(descriptor.harnessId) || descriptor.harnessId === "generic") {
    throw new OperationError(
      "Harness capability descriptor harnessId must be a lowercase slug and `generic` is a surface/profile concept, not a harness id.",
    );
  }
  if (descriptor.supportedPrimitives.length === 0 || !descriptor.supportedPrimitives.includes("skill")) {
    throw new OperationError(`${label} must support at least the \`skill\` primitive.`);
  }
  if (descriptor.containers.length === 0) {
    throw new OperationError(`${label} must declare at least one distributable container.`);
  }
  const placementKeys = new Set<string>();
  for (const container of descriptor.containers) {
    const containerLabel = `${label} container \`${container.containerId}\``;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(container.containerId)) {
      throw new OperationError(`${containerLabel} must use a lowercase slug id.`);
    }
    if (!container.hostedPrimitives.includes("skill")) {
      throw new OperationError(
        `${containerLabel} must host the \`skill\` primitive: every distributable carries one or more skills (R-CAP-3).`,
      );
    }
    for (const primitive of container.hostedPrimitives) {
      if (!descriptor.supportedPrimitives.includes(primitive)) {
        throw new OperationError(
          `${containerLabel} hosts \`${primitive}\`, which the harness does not declare as a supported primitive.`,
        );
      }
    }
    if (container.layout.placements.length === 0) {
      throw new OperationError(`${containerLabel} must declare at least one placement.`);
    }
    for (const placement of container.layout.placements) {
      if (placement.pathTemplate.length === 0) {
        throw new OperationError(`${containerLabel} placement path template must be non-empty.`);
      }
      const key = `${container.profile}:${placement.surface}:${placement.scope}`;
      if (placementKeys.has(key)) {
        throw new OperationError(
          `${label} declares duplicate ${container.profile} placement for surface \`${placement.surface}\` and scope \`${placement.scope}\`.`,
        );
      }
      placementKeys.add(key);
    }
  }
  const events = Object.keys(descriptor.lifecycleEventMap);
  for (const event of events) {
    if (!KNOWN_EVENT_SET.has(event)) {
      throw new OperationError(`${label} maps unknown lifecycle event \`${event}\`.`);
    }
    if (!descriptor.lifecycleEventMap[event as PlaybookKnownEvent]?.hookPoint) {
      throw new OperationError(`${label} lifecycle event \`${event}\` must name a hook point.`);
    }
  }
  if (events.length > 0 && !descriptor.supportedPrimitives.includes("hook")) {
    throw new OperationError(
      `${label} maps lifecycle events but does not declare the \`hook\` primitive.`,
    );
  }
  if (descriptor.supportedExposureModes.length === 0) {
    throw new OperationError(`${label} must declare at least one exposure mode.`);
  }
  for (const mode of [descriptor.preferredExposureMode, descriptor.fallbackExposureMode]) {
    if (!descriptor.supportedExposureModes.includes(mode)) {
      throw new OperationError(
        `${label} preferred/fallback exposure mode \`${mode}\` is not in its supported exposure modes.`,
      );
    }
  }
  if (descriptor.registration.autoRegister !== false) {
    throw new OperationError(
      `${label} must not auto-register: the default is generate but do not install (R-MKT-1).`,
    );
  }
  if (descriptor.registration.description.length === 0) {
    throw new OperationError(`${label} registration model must carry a description.`);
  }
  for (const precondition of descriptor.preconditions) {
    if (precondition.id.length === 0 || precondition.description.length === 0) {
      throw new OperationError(`${label} preconditions must carry an id and description.`);
    }
  }
  if (descriptor.verification.reference.length === 0) {
    throw new OperationError(
      `${label} must carry a verification reference naming where the contract was confirmed (R-ADAPT-1).`,
    );
  }
  if (descriptor.verification.status === "verified") {
    const expectedDigest = computeHarnessContractDigest(descriptor);
    if (descriptor.verification.contractDigest === null) {
      throw new OperationError(
        `${label} claims a verified contract without a recorded contract digest; record ${expectedDigest} at verification time (R-ADAPT-1).`,
      );
    }
    if (descriptor.verification.contractDigest !== expectedDigest) {
      throw new OperationError(
        `${label} declared contract surface changed since verification (recorded ${descriptor.verification.contractDigest}, current ${expectedDigest}); re-verify the paths, manifest shapes, and registration steps against the real harness and update the verification reference and digest (R-ADAPT-1).`,
      );
    }
  } else if (descriptor.verification.provisionalNotes.length === 0) {
    throw new OperationError(
      `${label} provisional verification must name what remains unverified in provisionalNotes (R-ADAPT-1).`,
    );
  }
  return descriptor;
}
