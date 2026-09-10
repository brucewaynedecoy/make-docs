# Decisions That Make Sense at a Glance

Use the smallest explanation that preserves the choice's meaning. These are fictional examples, not Make Docs product decisions.

## One Open Choice

**How should import handle an unchanged file you imported before?**

The plan requires one copy of each source. It leaves repeat imports open.

1. **Skip the unchanged file — recommended.** Repeat imports stay quick and do not add copies.
2. **Ask on every repeat.** You choose each case, but large imports need more attention.

Both keep the original file. Changed files still follow the agreed review rule.

Use the available choice control for those alternatives, or ask whether the owner approves the recommendation. Do not ask another confirmation after a clear answer.

## Several Changes with One Larger Effect

“Remove local copies” and “load defaults from a shared cache” may sound like separate cleanup tasks. Together they can change where users edit files and whether offline work succeeds.

First state the combined effect in the user's terms. For example: “These changes would move your editable guides out of this project. That changes the agreed editing workflow.” Check whether the accepted requirements already rule out that outcome. Do not offer a forbidden outcome as a valid choice. If a departure is necessary, name it and request the exact change in authority before affected edits.

## An Answer Already Exists

If the PRD says user edits survive an update, apply that rule. Investigate how to preserve them. Do not ask whether overwriting is acceptable just because it is easier to implement.

## Uncertain Evidence

Separate observation from inference. “The test fixture preserves edits” is an observation. “The installed update path also preserves edits” needs evidence from that path. If the missing evidence can be gathered within scope, gather it before turning uncertainty into an owner decision.
