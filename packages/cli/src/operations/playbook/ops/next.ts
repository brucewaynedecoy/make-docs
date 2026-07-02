import { z } from "zod";
import { OperationPendingError } from "../../context";
import type { OperationDefinition } from "../../registry";

// Permissive on purpose: the input contract lands with the owning lineage.
const inputSchema = z.looseObject({});

export const playbookNextOperation: OperationDefinition<z.infer<typeof inputSchema>, never> = {
  id: "playbook.next",
  summary:
    "Operation `playbook.next`: report the next runnable step for a Run Playbook run (reserved; semantics land with the W18 R7 run-playbook state machine).",
  mutates: "read",
  status: "pending",
  pendingLineage: "the W18 R7 run-playbook state machine (PRD 35)",
  inputSchema,
  // Defense for direct handler calls; registry dispatch refuses pending ids first.
  handler() {
    throw new OperationPendingError(
      "Operation `playbook.next` is a reserved registry identifier; its semantics land with the W18 R7 run-playbook state machine (PRD 35).",
    );
  },
};
