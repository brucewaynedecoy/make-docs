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

/**
 * A lab-facing command claim on the interrogation block (PRD 43 R-HOME-2;
 * PRD 36 R-CAP-2 as enhanced by PRD 43): a concrete harness command the
 * conformance lab renders into kits, verification-marked like every other
 * descriptor claim, with a reference naming where the claim was confirmed or
 * what remains unverified.
 */
export interface HarnessLabCommandClaim {
  command: string;
  args: string[];
  status: HarnessDescriptorVerificationStatus;
  reference: string;
}

/**
 * One listing-capture form the discover instrument renders from (PRD 43
 * R-INST-1): a capture of the harness's own listing surface as command
 * output, a directory listing, or a manifest read. Paths are
 * workspace-relative; `{packageId}` markers are rendered by kit generation.
 */
export type HarnessLabListingCaptureForm =
  | { kind: "command-output"; command: string; args: string[] }
  | { kind: "directory-listing"; path: string }
  | { kind: "manifest-read"; path: string };

export interface HarnessLabListingCapture {
  /** Stable lowercase slug id; the capture's evidence files are named from it. */
  id: string;
  /** What the capture shows and how ingestion should read it. */
  description: string;
  status: HarnessDescriptorVerificationStatus;
  reference: string;
  form: HarnessLabListingCaptureForm;
}

/**
 * The lab-facing interrogation block (W18 R13 P2 t1; PRD 43 R-HOME-2,
 * enhancing PRD 36 R-CAP-2): everything a conformance kit needs to know
 * about a harness beyond its packaging contract — how to pin its version,
 * how to launch it, the listing surfaces the discover instrument captures,
 * where (if anywhere) the harness evidences skill invocation, and the
 * workspace conventions a lab session should honor. The descriptor is the
 * single home of this knowledge: a kit-local table of harness facts is the
 * R-021 regression vector and is prohibited. Absent knowledge is stated
 * honestly — `null` claims and `knownGaps` entries — never invented.
 *
 * Implementer decisions recorded here (W18 R13 P2 t1):
 * - Every claim carries its own verification marking, and a claim may be
 *   `verified` only on a descriptor whose packaging-contract verification is
 *   itself `verified` — lab knowledge is never more confirmed than the
 *   contract it rides on.
 * - The block is deliberately EXCLUDED from {@link computeHarnessContractDigest}:
 *   the digest fingerprints the packaging contract surface an adapter's
 *   verification claim covers (R-ADAPT-1), while each interrogation claim is
 *   individually verification-marked; folding the lab block into the digest
 *   would force contract re-verification ceremony for lab-note edits without
 *   adding honesty the per-claim markings do not already carry.
 */
export interface HarnessLabInterrogation {
  /** Command printing the harness version (pins a session's harness version); null when unknown. */
  versionCommand: HarnessLabCommandClaim | null;
  /** How to launch the harness interactively inside a session workspace; null when unknown. */
  launchCommand: HarnessLabCommandClaim | null;
  /** Listing surfaces the discover instrument captures (R-INST-1). */
  listingCaptures: HarnessLabListingCapture[];
  /** Where the harness logs or evidences skill invocation; null when no surface is known. */
  invocationEvidence: {
    description: string;
    status: HarnessDescriptorVerificationStatus;
    reference: string;
  } | null;
  /** Workspace conventions lab sessions should honor (rendered into prompts). */
  workspaceNotes: string[];
  /** Honest absences: lab knowledge this descriptor deliberately does not claim. */
  knownGaps: string[];
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
  /**
   * The lab-facing interrogation block (PRD 43 R-HOME-2). Optional: an
   * absent block is the honest statement that no lab interrogation knowledge
   * is claimed for this harness yet, and kit generation for it fails closed
   * rather than inventing harness facts.
   */
  labInterrogation?: HarnessLabInterrogation;
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
  // Registration model / registration file consistency (W18 R8 P4, R-MKT-1,
  // R-CAP-2): a marketplace-entry model needs a registration file to generate
  // into the distributable, and direct discovery has no registration surface,
  // so declaring one would invite an install path no contract verified.
  const declaredRegistrationFiles = descriptor.containers.flatMap(
    (container) => container.layout.registrationFiles,
  );
  if (
    descriptor.registration.kind === "marketplace-entry" &&
    declaredRegistrationFiles.length === 0
  ) {
    throw new OperationError(
      `${label} declares a marketplace-entry registration model but no container declares a registration file to generate (R-MKT-1, R-CAP-2).`,
    );
  }
  if (
    descriptor.registration.kind === "direct-discovery" &&
    declaredRegistrationFiles.length > 0
  ) {
    throw new OperationError(
      `${label} declares direct-discovery registration but a container declares registration files; direct discovery has no registration surface (R-CAP-2).`,
    );
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
  validateHarnessLabInterrogation(descriptor, label);
  return descriptor;
}

/**
 * Validates the optional lab-facing interrogation block (W18 R13 P2 t1;
 * PRD 43 R-HOME-2): every claim carries a non-empty reference, listing
 * captures use unique slug ids with workspace-relative paths, and no claim
 * is marked `verified` on a descriptor whose packaging contract is still
 * `provisional` — lab knowledge never outruns the contract verification.
 */
function validateHarnessLabInterrogation(
  descriptor: HarnessCapabilityDescriptor,
  label: string,
): void {
  const interrogation = descriptor.labInterrogation;
  if (!interrogation) {
    return;
  }
  const contractVerified = descriptor.verification.status === "verified";
  const assertClaimStatus = (claimLabel: string, status: HarnessDescriptorVerificationStatus, reference: string): void => {
    if (reference.length === 0) {
      throw new OperationError(
        `${label} lab interrogation ${claimLabel} must carry a reference naming where the claim was confirmed or what remains unverified (R-HOME-2).`,
      );
    }
    if (status === "verified" && !contractVerified) {
      throw new OperationError(
        `${label} lab interrogation ${claimLabel} claims verified lab knowledge on a provisional contract; lab claims are never more confirmed than the packaging contract they ride on (R-HOME-2, R-ADAPT-1).`,
      );
    }
  };
  for (const [name, claim] of [
    ["versionCommand", interrogation.versionCommand],
    ["launchCommand", interrogation.launchCommand],
  ] as const) {
    if (!claim) {
      continue;
    }
    if (claim.command.length === 0 || claim.args.some((arg) => arg.length === 0)) {
      throw new OperationError(`${label} lab interrogation ${name} must use non-empty command tokens.`);
    }
    assertClaimStatus(name, claim.status, claim.reference);
  }
  const captureIds = new Set<string>();
  for (const capture of interrogation.listingCaptures) {
    const captureLabel = `listing capture \`${capture.id}\``;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(capture.id)) {
      throw new OperationError(`${label} lab interrogation ${captureLabel} must use a lowercase slug id.`);
    }
    if (captureIds.has(capture.id)) {
      throw new OperationError(`${label} lab interrogation declares duplicate ${captureLabel}.`);
    }
    captureIds.add(capture.id);
    if (capture.description.length === 0) {
      throw new OperationError(`${label} lab interrogation ${captureLabel} must carry a description.`);
    }
    assertClaimStatus(captureLabel, capture.status, capture.reference);
    if (capture.form.kind === "command-output") {
      if (capture.form.command.length === 0 || capture.form.args.some((arg) => arg.length === 0)) {
        throw new OperationError(`${label} lab interrogation ${captureLabel} must use non-empty command tokens.`);
      }
    } else if (
      capture.form.path.length === 0 ||
      capture.form.path.startsWith("/") ||
      capture.form.path.startsWith("<user-home>") ||
      capture.form.path.split("/").includes("..")
    ) {
      throw new OperationError(
        `${label} lab interrogation ${captureLabel} must name a workspace-relative path (no absolute paths, no \`..\`, no user-home markers).`,
      );
    }
  }
  if (interrogation.invocationEvidence) {
    if (interrogation.invocationEvidence.description.length === 0) {
      throw new OperationError(`${label} lab interrogation invocationEvidence must carry a description.`);
    }
    assertClaimStatus(
      "invocationEvidence",
      interrogation.invocationEvidence.status,
      interrogation.invocationEvidence.reference,
    );
  }
  for (const [family, notes] of [
    ["workspaceNotes", interrogation.workspaceNotes],
    ["knownGaps", interrogation.knownGaps],
  ] as const) {
    if (notes.some((note) => note.length === 0)) {
      throw new OperationError(`${label} lab interrogation ${family} entries must be non-empty.`);
    }
  }
}
