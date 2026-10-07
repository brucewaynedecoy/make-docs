/** Standard host container bounds are UI facts, not report or action authority. */
export interface BacklogContainerBounds { height: number | null; maxHeight: number | null }
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
export function readBacklogContainerBounds(context: unknown): BacklogContainerBounds | null {
  if (!object(context) || !object(context.containerDimensions)) return null;
  const dimensions = context.containerDimensions;
  if ("height" in dimensions) return positive(dimensions.height) ? { height: dimensions.height, maxHeight: null } : null;
  return positive(dimensions.maxHeight) ? { height: null, maxHeight: dimensions.maxHeight } : null;
}
export function backlogContainerHeight(bounds: BacklogContainerBounds | null, ownHeight: number): number {
  return bounds?.height ?? bounds?.maxHeight ?? ownHeight;
}
export function constrainBacklogHeight(requested: number, bounds: BacklogContainerBounds | null): number {
  return bounds?.height ?? Math.min(requested, bounds?.maxHeight ?? requested);
}
