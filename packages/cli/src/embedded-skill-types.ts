export interface EmbeddedSkillPayload {
  entryPoint: string;
  assets: Array<{ source: string; installPath: string }>;
  files: Record<string, { base64: string; sha256: string }>;
}

export interface EmbeddedSkillBundle {
  schemaVersion: 1;
  packageDigest: string;
  registryDigest: string;
  payloads: Record<string, EmbeddedSkillPayload>;
  digest: string;
}
