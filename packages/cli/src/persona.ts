import path from "node:path";
import { loadMakeDocsConfigOrThrow } from "./config";

/** Reads project knowledge only. It does not require an installation or Store. */
export function listProjectPersonas(targetRoot: string) {
  const root = path.resolve(targetRoot);
  const loaded = loadMakeDocsConfigOrThrow(root);
  return {
    status: "ready" as const,
    targetRoot: root,
    configPath: loaded.configPath,
    configPresent: loaded.present,
    personas: loaded.config.personas.map(persona => ({
      ...persona,
      builtin: persona.slug === "user" || persona.slug === "maintainer",
      displaySources: loaded.personaDisplaySources[persona.slug]!,
    })),
  };
}
