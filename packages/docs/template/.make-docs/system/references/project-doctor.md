# Project Doctor

## Purpose

Use this reference to find and fix known problems in a Make Docs project when the Make Docs CLI and MCP tools are not available.

This reference is the agent twin of the deterministic doctor operations `project.doctor.check` and `project.doctor.fix`. Both forms must find the same lines and propose the same changes. A change to either form needs a review of the other. When the CLI is available, prefer it:

- `make-docs project doctor check [--exclude <path>] [--target-root <path>] [--json]` reads only. It returns the findings and a review digest.
- `make-docs project doctor fix --review <digest> [--exclude <path>] [--check-json <file>] [--dry-run] [--target-root <path>] [--json]` changes only what the digest names. It keeps a backup in `.make-docs/backup/operations/` and reports the undo path. `--check-json` takes the saved check result (`check --json`) so a stale review names each changed file. `--dry-run` shows the planned changes and writes nothing.
- The MCP tools are `project_doctor_check` and `project_doctor_fix`. The fix needs `allowWrite=true`. The optional `reviewedFiles` input is the `files` list from the check result, the MCP form of `--check-json`. `dryRun=true` writes nothing.

## Check List

| Check ID | Scope | Finding | Fix |
| --- | --- | --- | --- |
| `task-id-case` | Markdown files under `docs/work/` | A task ID uses a lower-case `t`, such as `t3`. Make Docs writes task IDs with an upper-case `T`, such as `T3`. | Change the `t` to `T`. The number and all other text stay the same. |

Later checks are added here and in the CLI together.

## Agent Procedure

1. Ask the person which paths to leave out. Each excluded path is relative to the project folder. Do not accept a path that is absolute, uses `..`, starts with `~`, uses a backslash, has an empty or `.` part, passes through a symbolic link, or does not exist. Each part must match a folder or file name exactly, with the same upper and lower case, even on a file system that ignores case. Compare names in Unicode NFC form, so an accent written as one character or as a letter and a separate mark is the same name. Any other difference is a mismatch. Stop and say why.
2. Find every finding with the rules below. Change nothing yet.
3. Report the totals first, in plain words: the number of findings, lines, and files, and the number of task lines and prose references. Then list each finding with its file, line, current text, and replacement. If there are no findings, say that the check found no problems and changed nothing.
4. Tell the person that a prose finding can be something that is not a task ID. Ask them to review the list.
5. Fix only after the person approves this exact list. Before you edit a file, read it again. If it changed after your check, stop, name the file, and run the check again.
6. Change only the reviewed characters. Report each changed file. Keep a copy of each file before you edit it, and name each copy. Give the undo path: for a file that git tracks, `git -C '<project folder>' diff` shows the change and `git -C '<project folder>' restore -- '<file>'` undoes it from any current folder, but that also drops any earlier uncommitted edit in the file. Quote each file name with single quotes. For a file that git does not track, or in a folder without git, the undo path is the copy.

## Files the `task-id-case` Check Reads

- Read every `.md` file under `docs/work/`, at any depth.
- Stop with an error, and change nothing, when `docs` or `docs/work` is a symbolic link, or when any folder under `docs/work/` holds a symbolic link to a folder. Name the linked folder. Do not follow it. A Windows junction counts as a link.
- Skip a file or folder that the person excluded. Skip a Markdown file that is a symbolic link or not a regular file.
- Skip a hard-linked file: a file with more than one link (`nlink` above 1). Its bytes are shared with another path, maybe outside the project. Name it as skipped.
- Never read `.make-docs/archive/`. It is outside the scope, and archives stay as written.
- Skip each managed router file: a file named `AGENTS.md` or `CLAUDE.md` in any letter case, such as `agents.md`, at any depth under `docs/work/`. Make Docs manages these files. Their task IDs are fixed upstream in the shipped template and then reseeded, so the doctor never edits them. Name each one as skipped with the reason "managed router; fixed upstream by reseed".
- Skip a history record: a file whose front matter starts on line 1 with `---` and has `kind: history` (with or without quotes) before the closing `---` or `...`. A byte order mark at the start of the file is ignored. History records stay as written.
- Skip a file that is not valid UTF-8 text.

## Lines the `task-id-case` Check Skips

- Fenced code. A line whose first non-space characters are three or more backticks or tildes opens a fence. The fence closes at the next line that has only at least as many of the same character, after optional spaces. Skip the opening line, the closing line, and every line between them. A fence that never closes runs to the end of the file.

Inside other lines, skip these parts:

- Inline code: from a run of backticks to the next run of the same number of backticks on the same line.
- Link and image targets: the part inside `(...)` right after `]`. The link text in `[...]` is prose and is checked.
- A reference link definition, such as `[name]: target`: everything after `]:`.
- An autolink in `<...>` that starts with a scheme, such as `<https://example.com/t3>`.
- A bare URL, such as `https://example.com/t3`, up to the next space or `<` or `>`.
- An HTML tag, such as `<a id="t3">` or `</span>`: from `<` and a letter (or `</` and a letter) to the next `>`. Do not change it. Report each `t` and number word inside it as left unchanged, with the reason "inside an HTML tag". A tag can run over more than one line: when a line ends inside an open tag, such as `<a`, the tag goes on to the first `>` on a later line. A blank line or a fence ends it.

## What the `task-id-case` Check Finds

### Task lines

A line that starts with `- [ ] `, `- [x] `, or `- [X] ` (after an optional byte order mark on line 1), then a lower-case `t` and a number with no leading zero, then `:`, a space, or the end of the line. Example: `- [ ] t3: Write the test.` The rest of the line is then checked as prose.

### Prose references

A lower-case `t` and a number of one to three digits with no leading zero, such as `t3` or `t11`, that stands alone as a word:

- The character before it is the start of the line, a space, a tab, one of `( [ { " ' * ~ | , ;`, or a left curly quote: `“` (U+201C) or `‘` (U+2018).
- The character before it can also be a joiner: `/`, `-`, `–`, or `—`. Then an ID must end right before the joiner. An ID here is `t`, `T`, or `A` and a number of one to three digits, such as `t1`, `T1`, or `A41`, whose own left side passes this same rule. Work from left to right along the line. This finds every lower-case ID in `t1-t3`, `t1–t10`, `t1/t2/t4`, `T1-t3`, `T1/t2`, and `A41-t5`. It does not find `t3` or `t4` in a path such as `a/t3/t4`.
- The character after it is the end of the line, a space, a tab, one of `) ] } " ' * ~ | , ; : ! ?`, or a right curly quote: `”` (U+201D) or `’` (U+2019).
- A `.` after it is allowed only at the end of a sentence: the end of the line, or a space, a tab, `)`, `"`, `'`, or `*` after the dot.
- A joiner after it is allowed only before `t`, `T`, or `A` and a digit, as in `t1/t4`, `t6/A41`, or `t1-t3`.

The start or end of a skipped part (inline code, a link target, a URL, or an HTML tag) also counts as a word edge on either side. So `<b>t3</b>` is a finding.

Everything else is not a finding. The check does not find a task ID inside a word or a snake_case name, after a dot, after a slash or dash that does not follow an ID, with four or more digits, in a range without a second `t` (`t1-6`), in emphasis written with underscores (`_t3_`), or inside an HTML tag. Strikethrough such as `~~t3~~` is found.

### Known risk

A prose finding is a lower-case `t` and a number that stands alone as a word. It can be something that is not a task ID, such as a table label or a product name. The person reviews each prose finding before the fix.

The edge of a skipped part counts as a word edge, so text glued to inline code, a link target, a URL, or an HTML tag is found. Examples: `t3` in `word<span>t3</span>word`, in `` `code`t3 ``, and in `<https://example.com>t3`. Review these findings with the rest.

## Shared Examples

Each pair shows one line before and after the fix. A line with no change is not a finding. The CLI tests read these pairs, so both forms must give the same answer.

```text
before: - [ ] t3: Write the test.
after:  - [ ] T3: Write the test.
before: - [x] t12: Depends on t3 and P2 t11.
after:  - [x] T12: Depends on T3 and P2 T11.
before: - [x] t6 Add tests for the old form.
after:  - [x] T6 Add tests for the old form.
before: Tasks t1–t10 are done. P6 t1-t6/A41-A50 passed, and t1/t4/t6 too.
after:  Tasks T1–T10 are done. P6 T1-T6/A41-A50 passed, and T1/T4/T6 too.
before: | t3 | Updated (t4, t5) and "t6"; done: t7. Keep t8's note.
after:  | T3 | Updated (T4, T5) and "T6"; done: T7. Keep T8's note.
before: Moved to [P2 t12](02-phase.md#t12-task) and [t3](t3.md).
after:  Moved to [P2 T12](02-phase.md#t12-task) and [T3](t3.md).
before: Run `- [ ] t3:` and ``t4`` but fix t5.
after:  Run `- [ ] t3:` and ``t4`` but fix T5.
before: See https://example.com/t3 and <https://example.com/t4> for t5.
after:  See https://example.com/t3 and <https://example.com/t4> for T5.
before: Use an AWS t3 instance.
after:  Use an AWS T3 instance.
before: Skip at3, t3x, t3_a, foo_t3, v1.t3, t3.5, t3.md, .t3/worktrees, t3/w31-r0, t3-56a6, t2026, t0, t01, \t2026, t1-6, a/t3/t4, and _t3_.
after:  Skip at3, t3x, t3_a, foo_t3, v1.t3, t3.5, t3.md, .t3/worktrees, t3/w31-r0, t3-56a6, t2026, t0, t01, \t2026, t1-6, a/t3/t4, and _t3_.
before: Mixed: T1-t3, T1–t10, T1/t2, and A41-t5.
after:  Mixed: T1-T3, T1–T10, T1/T2, and A41-T5.
before: Struck ~~t3~~ is still a finding.
after:  Struck ~~T3~~ is still a finding.
before: <a id="t3"></a> Anchor for t4.
after:  <a id="t3"></a> Anchor for T4.
before: Glued word<span>t3</span>word and <https://example.com>t4.
after:  Glued word<span>T3</span>word and <https://example.com>T4.
before: Already upper case: T3 and W29 R0 P1 T3.
after:  Already upper case: T3 and W29 R0 P1 T3.
```

The line `Use an AWS t3 instance.` shows the known risk: the check finds it, and the person decides in review. In the anchor line, the check reports `t3` inside the HTML tag as left unchanged.

## Related

- Task ID form: a task ID is an upper-case `T` and a number without a leading zero, such as `T3`. Every reader accepts `t3` and `T3` as the same ID.
- Use `path-and-link-hygiene.md` for path and link rules.
