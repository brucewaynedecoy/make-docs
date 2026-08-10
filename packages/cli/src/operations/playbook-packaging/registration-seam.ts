/**
 * Marketplace and registration seam (W18 R8 P4, R-MKT-1/R-MKT-2).
 *
 * Registration and marketplace files are generated INTO the distributable
 * (`registration/*` plus the `.make-docs/registration.json` record); a user's
 * global marketplace surface is never auto-mutated without an explicit global
 * scope AND approval, and the shipping default is generate-but-do-not-install
 * (R-MKT-1).
 *
 * The R-MKT-2 auto-registration opt-in is a config-gated policy seam whose
 * configuration home is the machine-level global store owned by the Runtime
 * and Global Store lineage (`docs/assets/artifacts/runtime-and-global-store.md`,
 * PRD 38): the packaging writer READS the documented
 * `settings.marketplaceAutoRegistration` key of `~/.make-docs/config.json`
 * through the store's own loader and defines nothing of the store schema —
 * the key already exists there, is additive, and an absent key means off
 * (R-SCOPE-1).
 *
 * Seam semantics shipped by this wave: the opt-in is recognized and recorded,
 * but no auto-registration behavior ships enabled — even a granted opt-in
 * with explicit global scope and approval yields `generate-only`, with the
 * withhold reasons declared, because R-MKT-2 permits opting into
 * auto-registration only "later": actually installing a registration file
 * requires the install-discover-invoke-uninstall evidence bar owned by the
 * W18 R9 conformance lineage (PRD 20; PRD 36 R-PROV-3/R-TEST-5). The decision record
 * is the seam future work consumes; nothing here may be widened silently.
 */

import { loadGlobalConfig, resolveStoreRoot } from "../../store";
import type { PackagePlanStop, PlaybookPackageScope } from "./types";

/**
 * The documented global-store config key the seam reads (R-MKT-2). The key
 * lives in `settings` of `~/.make-docs/config.json`; its schema is owned by
 * the Runtime and Global Store lineage, not by packaging.
 */
export const MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY =
  "settings.marketplaceAutoRegistration" as const;

/** Where the R-MKT-2 opt-in lives; recorded on every seam decision. */
export const MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME =
  "global store `~/.make-docs/config.json` (Runtime and Global Store lineage, docs/assets/artifacts/runtime-and-global-store.md)" as const;

/**
 * Named approval a calling surface must grant before any write may touch a
 * user's global marketplace surface (R-MKT-1). Wired through the operation
 * context's named approvals like `reviewed-overwrite`.
 */
export const GLOBAL_MARKETPLACE_REGISTRATION_APPROVAL =
  "global-marketplace-registration" as const;

/** A registration/marketplace file generated into the distributable. */
export interface MarketplaceRegistrationFilePlan {
  /** Container-relative path of the generated copy inside the distributable. */
  generatedAt: string;
  /** Harness registration surface the file WOULD install at; never auto-written. */
  installAt: string;
}

export const MARKETPLACE_REGISTRATION_WITHHOLD_REASONS = [
  "auto-registration-opt-in-off",
  "scope-not-global",
  "global-approval-missing",
  "auto-registration-unshipped-pending-conformance",
] as const;
export type MarketplaceRegistrationWithholdReason =
  (typeof MARKETPLACE_REGISTRATION_WITHHOLD_REASONS)[number];

/**
 * The seam decision recorded on every package-write result: what the opt-in
 * key said, what R-MKT-1 gating applied, and why installation was withheld.
 * `disposition` is always `generate-only` in this wave; no auto-registration
 * behavior ships enabled (R-MKT-1, R-MKT-2).
 */
export interface MarketplaceRegistrationSeamDecision {
  configKey: typeof MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY;
  configHome: typeof MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME;
  autoRegistrationOptIn: boolean;
  scope: PlaybookPackageScope;
  globalApprovalGranted: boolean;
  disposition: "generate-only";
  withheldBecause: MarketplaceRegistrationWithholdReason[];
  files: MarketplaceRegistrationFilePlan[];
}

/**
 * Reads the R-MKT-2 opt-in from the global store. An absent store, absent
 * key, or unreadable config all mean off — the seam is additive and off by
 * default, and the store loader's degrade-to-defaults behavior already
 * guarantees `false` in every non-explicit case.
 */
export function readMarketplaceAutoRegistrationOptIn(
  options: { storeRoot?: string; homeDir?: string; env?: NodeJS.ProcessEnv } = {},
): boolean {
  const storeRoot = resolveStoreRoot(options);
  return loadGlobalConfig(storeRoot).config.settings.marketplaceAutoRegistration;
}

/**
 * Resolves the seam for one package write. Pure: the opt-in value is read by
 * the caller (writer) so tests and embedders can inject it.
 */
export function resolveMarketplaceRegistrationSeam(input: {
  scope: PlaybookPackageScope;
  autoRegistrationOptIn: boolean;
  globalApprovalGranted: boolean;
  files: MarketplaceRegistrationFilePlan[];
}): MarketplaceRegistrationSeamDecision {
  const withheldBecause: MarketplaceRegistrationWithholdReason[] = [];
  if (!input.autoRegistrationOptIn) {
    withheldBecause.push("auto-registration-opt-in-off");
  } else {
    // Even a granted opt-in only ever permits what R-MKT-1 allows: explicit
    // global scope plus approval — and the install behavior itself stays
    // unshipped pending the W18 R9 evidence bar.
    if (input.scope !== "global") {
      withheldBecause.push("scope-not-global");
    }
    if (!input.globalApprovalGranted) {
      withheldBecause.push("global-approval-missing");
    }
    withheldBecause.push("auto-registration-unshipped-pending-conformance");
  }
  return {
    configKey: MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY,
    configHome: MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME,
    autoRegistrationOptIn: input.autoRegistrationOptIn,
    scope: input.scope,
    globalApprovalGranted: input.globalApprovalGranted,
    disposition: "generate-only",
    withheldBecause,
    files: input.files,
  };
}

/**
 * The R-MKT-1 protection audit on the writer's write set: no planned write
 * path — canonical payload, symlink exposure root, or copy-mirror file — may
 * land on a harness registration surface. The user's GLOBAL marketplace
 * (the `<user-home>/`-rooted form of a declared registration file) requires
 * explicit global scope AND the named approval; a project-local registration
 * surface still requires the named approval. Generated registration copies
 * belong under `registration/` inside the distributable, so every legitimate
 * write already passes; this fails closed if a descriptor or plan ever routes
 * a write onto a marketplace surface.
 */
export function globalMarketplaceProtectionStops(input: {
  registrationInstallTargets: string[];
  plannedWritePaths: string[];
  scope: PlaybookPackageScope;
  globalApprovalGranted: boolean;
}): PackagePlanStop[] {
  const globalTargets = new Set<string>();
  const projectTargets = new Set<string>();
  for (const target of input.registrationInstallTargets) {
    const normalized = normalizeSeamPath(target);
    if (normalized.startsWith("<user-home>/")) {
      globalTargets.add(normalized);
    } else {
      projectTargets.add(normalized);
      globalTargets.add(`<user-home>/${normalized}`);
    }
  }

  const stops: PackagePlanStop[] = [];
  for (const planned of input.plannedWritePaths) {
    const normalized = normalizeSeamPath(planned);
    if (globalTargets.has(normalized)) {
      if (input.scope === "global" && input.globalApprovalGranted) {
        continue;
      }
      stops.push({
        reason: "manual-review-required",
        message: `Write at ${normalized} would mutate the user's global marketplace surface without explicit global scope and the \`${GLOBAL_MARKETPLACE_REGISTRATION_APPROVAL}\` approval; registration files are generated into the distributable, never auto-installed (R-MKT-1).`,
        path: normalized,
      });
      continue;
    }
    if (projectTargets.has(normalized) && !input.globalApprovalGranted) {
      stops.push({
        reason: "manual-review-required",
        message: `Write at ${normalized} would mutate a harness registration surface without the \`${GLOBAL_MARKETPLACE_REGISTRATION_APPROVAL}\` approval; the default is generate but do not install (R-MKT-1).`,
        path: normalized,
      });
    }
  }
  return stops;
}

function normalizeSeamPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/$/, "");
}
