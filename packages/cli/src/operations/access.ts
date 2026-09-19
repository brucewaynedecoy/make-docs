export type StoreAccess = "none" | "read" | "write";
export type ProjectAccess = "none" | "read" | "write";
export type HostConfigAccess = "none" | "write";

export interface OperationAccess {
  readonly store: StoreAccess;
  readonly project: ProjectAccess;
  readonly hostConfig: HostConfigAccess;
}

export const NO_ACCESS: OperationAccess = Object.freeze({
  store: "none",
  project: "none",
  hostConfig: "none",
});

export const PROJECT_READ_ACCESS: OperationAccess = Object.freeze({
  store: "none",
  project: "read",
  hostConfig: "none",
});

export const STORE_READ_PROJECT_READ_ACCESS: OperationAccess = Object.freeze({
  store: "read",
  project: "read",
  hostConfig: "none",
});

export const STORE_WRITE_PROJECT_READ_ACCESS: OperationAccess = Object.freeze({
  store: "write",
  project: "read",
  hostConfig: "none",
});

export const STORE_WRITE_PROJECT_WRITE_ACCESS: OperationAccess = Object.freeze({
  store: "write",
  project: "write",
  hostConfig: "none",
});

export const PROJECT_WRITE_ACCESS: OperationAccess = Object.freeze({
  store: "none",
  project: "write",
  hostConfig: "none",
});

export function cloneOperationAccess(access: OperationAccess): OperationAccess {
  return { ...access };
}

export function assertOperationAccess(
  operation: string,
  access: unknown,
  mutation: "read" | "write",
): asserts access is OperationAccess {
  if (!isRecord(access)) {
    throw new Error(`Operation \`${operation}\` must declare complete access metadata.`);
  }

  const keys = Object.keys(access).sort();
  if (keys.join(",") !== "hostConfig,project,store") {
    throw new Error(
      `Operation \`${operation}\` access metadata must declare only store, project, and hostConfig.`,
    );
  }

  if (!isAccessLevel(access.store) || !isAccessLevel(access.project)) {
    throw new Error(
      `Operation \`${operation}\` access.store and access.project must be none, read, or write.`,
    );
  }
  if (access.hostConfig !== "none" && access.hostConfig !== "write") {
    throw new Error(
      `Operation \`${operation}\` access.hostConfig must be none or write.`,
    );
  }

  if (
    mutation === "read" &&
    (access.store === "write" || access.project === "write" || access.hostConfig === "write")
  ) {
    throw new Error(
      `Read-only operation \`${operation}\` cannot declare write access.`,
    );
  }
  if (
    mutation === "write" &&
    access.store !== "write" &&
    access.project !== "write" &&
    access.hostConfig !== "write"
  ) {
    throw new Error(
      `Mutating operation \`${operation}\` must declare the state that it writes.`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAccessLevel(value: unknown): value is StoreAccess | ProjectAccess {
  return value === "none" || value === "read" || value === "write";
}
