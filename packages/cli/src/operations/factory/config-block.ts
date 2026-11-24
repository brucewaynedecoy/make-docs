import { z } from "zod";
import { looksLikeSecret, nameWords } from "../work/work-store/schemas";
import {
  FACTORY_CLAIM_SIZES,
  FACTORY_STANDARD_ROLES,
  looksLikeCredential,
  FACTORY_CONTEXT_KINDS,
  FACTORY_NAME_MAX,
  FACTORY_NAME_PATTERN,
  describeFactoryFieldProblem,
  factoryFreeTextProblem,
  type FactoryContextKind,
} from "./records";

/**
 * W30 R0 P2 `factory:` config block (PRD 24 R-CONFIG-WORK-2 and
 * R-CONFIG-WORK-3, PRD 53 R-FACTORY-22, R-FACTORY-26, R-FACTORY-55,
 * R-FACTORY-60, and R-FACTORY-61).
 *
 * The block holds only the portable definition of each workflow, under
 * `factory.workflows.<workflow-name>`. It never holds a grant, a tool
 * binding, a task handle, an ID, a machine path, a digest, a receipt, a
 * claim, a lock, a proof result, or a secret. Those stay in the Store or in
 * the tools that own them. Every free-text value is one line of at most 120
 * characters, and the never-log check applies to the whole block.
 *
 * The shape below is new in W30 R0 P2. PRD 24 and PRD 53 name the fields;
 * the key names and nesting are this phase's choice.
 */

const factoryName = z
  .string()
  .max(FACTORY_NAME_MAX, `A name is at most ${FACTORY_NAME_MAX} characters.`)
  .regex(FACTORY_NAME_PATTERN, "A name uses lower-case letters, digits, and single hyphens, and starts with a letter.")
  .refine((value) => !looksLikeSecret(value), "A name looks like a key or a token.");

/**
 * A value that the block must not hold, even inside a free-text field
 * (R-CONFIG-WORK-3): a machine path, a digest, or an ID that Make Docs or
 * the Store makes.
 */
function portableValueProblem(value: string): string | null {
  if (/^(\/|~[\\/]|[A-Za-z]:[\\/]|\\\\)/.test(value.trim()) || /(^|\s)(\/[^\s/]+){2,}/.test(value) || value.includes("\\")) {
    return "looks like a machine path. The factory block holds portable choices only; paths stay in the Store.";
  }
  if (/\b[0-9a-f]{40}\b|\b[0-9a-f]{64}\b/i.test(value)) return "looks like a digest. Make Docs keeps digests in the Store.";
  if (/\b(wu|wc|fg|fa)-[a-z0-9]{8,}\b/.test(value) || /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(value)) {
    return "looks like an ID. Make Docs keeps IDs in the Store.";
  }
  return null;
}

/** One line of portable text: at most 120 characters, never-log clean, and no path, digest, or ID. */
const portableText = z.string().superRefine((value, context) => {
  const problem = factoryFreeTextProblem(value);
  if (problem) {
    context.addIssue({ code: "custom", message: describeFactoryFieldProblem("value", problem).replace("The field value ", "The value ") });
    return;
  }
  const portable = portableValueProblem(value);
  if (portable) context.addIssue({ code: "custom", message: `The value ${portable}` });
});

const capabilityIdForm = z
  .string()
  .max(FACTORY_NAME_MAX)
  .regex(FACTORY_NAME_PATTERN, "A capability ID uses lower-case letters and hyphens.");

/** A context kind from the fixed set. The refusal names the unknown kind (A54). */
const contextKind = z.string().superRefine((value, context) => {
  if (!(FACTORY_CONTEXT_KINDS as readonly string[]).includes(value)) {
    context.addIssue({
      code: "custom",
      message: `"${value.slice(0, 64)}" is not a context kind. The context kinds are ${FACTORY_CONTEXT_KINDS.join(", ")}.`,
    });
  }
}) as unknown as z.ZodType<FactoryContextKind>;

export const FactoryRoleDefinitionSchema = z
  .object({
    job: portableText,
    capabilities: z.array(capabilityIdForm).min(1).max(16),
    returns: portableText,
    /** Omitted: the contract default for `builder` and `reviewer`, and no context for any other role. */
    context: z.array(contextKind).max(FACTORY_CONTEXT_KINDS.length).optional(),
  })
  .strict();
export type FactoryRoleDefinition = z.infer<typeof FactoryRoleDefinitionSchema>;

export const FACTORY_DEFAULT_ROUND_LIMIT = 3;

export const FactoryWorkflowDefinitionSchema = z
  .object({
    type: factoryName,
    /** A plain number, as `Type version: N` in the type file states it (R-FACTORY-61). */
    typeVersion: z.number().int().positive(),
    roles: z.record(factoryName, FactoryRoleDefinitionSchema).refine((roles) => Object.keys(roles).length >= 1, "A workflow needs at least one role."),
    roundLimit: z.number().int().min(0).max(20).default(FACTORY_DEFAULT_ROUND_LIMIT),
    limits: z
      .object({
        parallelWorkers: z.number().int().min(1).max(64).optional(),
        claimSize: z.enum(FACTORY_CLAIM_SIZES).default("phase"),
      })
      .strict()
      .default({ claimSize: "phase" }),
    gates: z.array(portableText).max(16).default([]),
    escalations: z.array(portableText).max(16).default([]),
    steps: z.object({ preflight: z.boolean().default(false) }).strict().default({ preflight: false }),
    integrationOwner: factoryName.optional(),
    /** The human channel kind, such as `wait-in-session` or `messaging-tool`. Never an account. */
    humanChannel: factoryName,
  })
  .strict()
  .superRefine((workflow, context) => {
    // Owner decisions 2026-11-23: only a custom role (one the project adds) must list its context kinds.
    // Builder and reviewer keep their defaults; the foreman and the front desk need no list.
    for (const [role, entry] of Object.entries(workflow.roles)) {
      if (entry.context === undefined && !(FACTORY_STANDARD_ROLES as readonly string[]).includes(role)) {
        context.addIssue({ code: "custom", path: ["roles", role, "context"], message: factoryRoleNeedsContextMessage(role) });
      }
    }
    if (workflow.integrationOwner !== undefined && !(workflow.integrationOwner in workflow.roles)) {
      context.addIssue({ code: "custom", path: ["integrationOwner"], message: `The integration owner "${factoryConfigPathSegment(workflow.integrationOwner)}" is not one of the workflow's roles.` });
    }
  });
export type FactoryWorkflowDefinition = z.infer<typeof FactoryWorkflowDefinitionSchema>;

export const FactoryConfigBlockSchema = z
  .object({
    workflows: z.record(factoryName, FactoryWorkflowDefinitionSchema).default({}),
  })
  .strict();
export type FactoryConfigBlock = z.infer<typeof FactoryConfigBlockSchema>;

/** The refusal of a custom role with no context list. A name that looks like a token is hidden. */
export function factoryRoleNeedsContextMessage(role: string): string {
  return `The role "${factoryConfigPathSegment(role)}" has no context list. A custom role must list its context kinds, for example [unit-record, requirements].`;
}
// The message text is the owner's wording of 2026-11-23, to match the factory contract.

/** What a config error shows in place of a name that looks like a key or a token. */
export const FACTORY_HIDDEN_NAME = "<name hidden>";

/**
 * A key path segment that an error may show. A workflow or role name that
 * looks like a key or a token is hidden, so a refusal never repeats a secret
 * that a person typed as a name (W30 R0 P2 review).
 */
export function factoryConfigPathSegment(segment: string): string {
  return looksLikeSecret(segment) || looksLikeCredential(segment) ? FACTORY_HIDDEN_NAME : segment;
}

/* ------------------------------------------------------------------------ */
/* State and secret keys                                                    */
/* ------------------------------------------------------------------------ */

/** The keys that the block accepts at each level. `*` is a name that the person chose: a workflow or a role. */
const FACTORY_CONFIG_KEYS: Readonly<Record<string, readonly string[] | "names">> = Object.freeze({
  "": ["workflows"],
  workflows: "names",
  "workflows.*": ["type", "typeVersion", "roles", "roundLimit", "limits", "gates", "escalations", "steps", "integrationOwner", "humanChannel"],
  "workflows.*.roles": "names",
  "workflows.*.roles.*": ["job", "capabilities", "returns", "context"],
  "workflows.*.limits": ["parallelWorkers", "claimSize"],
  "workflows.*.steps": ["preflight"],
});

/**
 * The state and secret key words that the block refuses (R-CONFIG-WORK-3,
 * R-FACTORY-26). Each word compares whole, without letter case and without a
 * plural `s`. `id` and `uuid` match only as the last word, as in `toolId`.
 */
const FACTORY_CONFIG_FORBIDDEN: ReadonlyArray<{ words: readonly string[]; last?: boolean; what: string; secret?: boolean }> = Object.freeze([
  { words: ["token", "secret", "password", "passwd", "passphrase", "credential", "apikey", "privatekey", "auth", "cookie", "bearer"], what: "a secret", secret: true },
  { words: ["env", "environment"], what: "an environment value", secret: true },
  { words: ["grant", "permission", "allow", "approval"], what: "a grant" },
  { words: ["digest", "hash", "sha", "sha256", "checksum"], what: "a digest" },
  { words: ["receipt", "proof", "transcript", "prompt", "brief"], what: "a receipt, proof, or log" },
  { words: ["claim", "lease", "lock", "handle"], what: "claim or lock state" },
  { words: ["path", "dir", "directory", "folder", "file", "location", "url"], what: "a machine path" },
  { words: ["checkout", "machine", "binding", "bound", "account", "tool"], what: "a machine binding" },
  { words: ["revision", "ready", "readiness", "state", "status"], what: "saved factory state" },
  { words: ["id", "uuid"], last: true, what: "an ID" },
]);

function forbiddenFactoryKey(key: string): (typeof FACTORY_CONFIG_FORBIDDEN)[number] | null {
  const forms = nameWords(key).map((word) => word.toLowerCase()).map((word) =>
    /(sh|ch|x|ss)es$/.test(word) ? word.slice(0, -2) : word === "ids" ? "id" : word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word,
  );
  const pairs = forms.slice(1).map((word, index) => `${forms[index]}${word}`);
  for (const entry of FACTORY_CONFIG_FORBIDDEN) {
    if (entry.last) {
      if (forms.length > 0 && entry.words.includes(forms.at(-1)!)) return entry;
      continue;
    }
    if (forms.some((word) => entry.words.includes(word)) || pairs.some((pair) => entry.words.includes(pair))) return entry;
  }
  return null;
}

export interface FactoryConfigFieldProblem {
  /** The key path inside the `factory` block, such as `workflows.ship.grants`. */
  path: string;
  message: string;
}

/**
 * Name each key in a `factory` block that holds state or a secret
 * (R-CONFIG-WORK-3). Only keys that the block does not accept are checked;
 * a workflow or role name is the person's own name. Other unknown keys are
 * left to the schema's own refusal.
 */
export function factoryConfigStateFieldProblems(value: unknown): FactoryConfigFieldProblem[] {
  const problems: FactoryConfigFieldProblem[] = [];
  const visit = (node: unknown, at: string, pattern: string): void => {
    if (node === null || typeof node !== "object" || Array.isArray(node)) return;
    const allowed = FACTORY_CONFIG_KEYS[pattern];
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const keyPath = at === "" ? key : `${at}.${key}`;
      if (allowed === "names") {
        visit(child, at === "" ? factoryConfigPathSegment(key) : `${at}.${factoryConfigPathSegment(key)}`, pattern === "" ? "*" : `${pattern}.*`);
        continue;
      }
      if (allowed?.includes(key)) {
        visit(child, keyPath, pattern === "" ? key : `${pattern}.${key}`);
        continue;
      }
      const hit = forbiddenFactoryKey(key);
      if (hit) {
        problems.push({
          path: keyPath,
          message: `factory.${keyPath} holds ${hit.what}. The factory block holds portable workflow choices only. ${hit.secret ? "A secret stays with the tool that owns it." : "Make Docs keeps this in the Store."} Remove the key.`,
        });
      }
    }
  };
  visit(value, "", "");
  return problems;
}

/** Parse a `factory` block. An absent or null block keeps the default: no factory workflow (R-CONFIG-WORK-4). */
export function parseFactoryConfigBlock(value: unknown): FactoryConfigBlock {
  return FactoryConfigBlockSchema.parse(value ?? {});
}
