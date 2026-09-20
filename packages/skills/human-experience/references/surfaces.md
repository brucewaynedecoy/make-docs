# Surface Examples

Use the relevant example as a question to investigate, not a fixed design to copy.

| Surface | What to check |
| --- | --- |
| Decision package | Can an owner returning from another project explain the choice and its effect? |
| Guide | Can the intended reader find the starting point and complete the task from the actual steps? |
| Directory | Do file and folder names make purpose and ownership clear? Will a rename break an agreed path or workflow? |
| Command | Does the command match the user's task? Does normal output explain success, partial success, and failure? |
| Interface | Does the main path preserve context, show progress, and allow recovery? Can the intended audience perceive and operate it? |
| Handoff | Can the recipient act from the goal and source links? Can a person see what it permits? |

## Meaningful Output

Fictional output: `alias.write: accepted; node=8f16; alias=217e`.

The operation may be correct, but the normal output does not reveal the relationship. A useful human form is: `Added “R. Hale” as another name for Rowan Hale.` Keep exact identifiers available where the tool supports inspection or machine output. Do not change the machine contract just to produce this sentence.

## Bounded Findings

“Improve usability” is not an actionable finding. “The success message omits the selected project name, so someone working across projects cannot tell where the file was saved” names an observed problem. Recommend showing the destination with the result. Do not use that finding as permission to redesign project storage.

## Honest Review

State what the evidence supports. Reading a command's help can support a finding about its wording. It does not prove the command's actual behavior. A screenshot can show hierarchy and labels. It does not prove keyboard access. Add a check only when the unanswered question matters to the goal.
