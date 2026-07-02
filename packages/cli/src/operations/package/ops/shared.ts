import { z } from "zod";
import {
  PLAYBOOK_PACKAGE_OUTPUT_KINDS,
  PLAYBOOK_PACKAGE_SCOPES,
  PLAYBOOK_PACKAGE_SURFACES,
} from "../../playbook-packaging";

/**
 * Structured package target shared by the `package.*` operations; replaces
 * the CLI's `--harness/--output-kind/--surface/--scope` argv quartet.
 */
export const packageTargetSchema = z.object({
  harness: z.string().min(1),
  outputKind: z.enum(PLAYBOOK_PACKAGE_OUTPUT_KINDS),
  surface: z.enum(PLAYBOOK_PACKAGE_SURFACES),
  scope: z.enum(PLAYBOOK_PACKAGE_SCOPES),
});

export const packagePlatformSchema = z.enum(["posix", "windows"]);

// Mirrors `PackageAdapterPreconditionState`, which is declared as a bare type
// union upstream with no exported constant array to enum over.
export const packagePreconditionStatesSchema = z.record(
  z.string(),
  z.enum(["satisfied", "unknown", "unsupported"]),
);
