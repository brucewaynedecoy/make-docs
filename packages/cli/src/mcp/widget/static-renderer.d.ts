import type { BacklogReportV1 } from "../../operations/work/backlog/schemas.js";
import type { BacklogDisplayV1 } from "../../operations/work/backlog/presentation.js";
export const reportMarkup: string;
export const reportStyles: string;
export interface LiveReportHooks {
  wavesRendered?(): void;
  themeChanged?(button: HTMLButtonElement, dark: boolean): void;
  dataChanged?(open: boolean): void;
  dataViewportHeight?(): number;
}
export function mountStaticReport(report: BacklogReportV1, presentation: BacklogDisplayV1, root: HTMLElement, hooks?: LiveReportHooks): () => void;
