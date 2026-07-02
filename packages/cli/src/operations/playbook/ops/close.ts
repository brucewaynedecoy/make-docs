import { z } from "zod";
import { OperationPendingError } from "../../context";
import type { OperationDefinition } from "../../registry";

// Permissive on purpose: the input contract lands with the owning lineage.
const inputSchema = z.looseObject({});

export const playbookCloseOperation: OperationDefinition<z.infer<typeof inputSchema>, never> = {
  id: "playbook.close",
  summary:
    "Operation `playbook.close`: close out a Run Playbook run and finalize its run state (reserved; semantics land with the W18 R7 run-playbook state machine).",
  mutates: "write",
  status: "pending",
  pendingLineage: "the W18 R7 run-playbook state machine (PRD 35)",
  inputSchema,
  // Defense for direct handler calls; registry dispatch refuses pending ids first.
  handler() {
    throw new OperationPendingError(
      "Operation `playbook.close` is a reserved registry identifier; its semantics land with the W18 R7 run-playbook state machine (PRD 35).",
    );
  },
};
