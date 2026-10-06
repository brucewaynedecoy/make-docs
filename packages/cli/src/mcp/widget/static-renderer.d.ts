import type { BacklogReportV1 } from "../../operations/work/backlog/schemas.js";
import type { BacklogDisplayV1 } from "../../operations/work/backlog/presentation.js";
export const reportMarkup: string;
export const reportStyles: string;
export function mountStaticReport(report: BacklogReportV1, presentation: BacklogDisplayV1, root: HTMLElement): () => void;
