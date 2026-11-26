---
title: Trying the Work Store and the Factory
kind: guide
persona: user
path: workflows
status: draft
order: 30
tags:
  - work-store
  - factory
  - walkthrough
  - store
  - try-it
applies-to:
  - cli
  - skills
  - work
related:
  - "getting-started-installing-make-docs.md"
  - "cli-lifecycle-managing-installations.md"
  - "skills-installing-and-managing-skills.md"
  - "concepts-wave-revision-phase-coordinates.md"
  - "../maintainer/cli-development-local-build-and-install.md"
  - "../../prd/52-work-store-and-work-queue.md"
  - "../../prd/53-factory-setup-and-orchestration.md"
  - "../../../.make-docs/system/references/work-store.md"
  - "../../../.make-docs/system/contracts/factory-contract.md"
  - "../../work/2026-11-21-w29-r0-work-store/evidence.md"
  - "../../work/2026-11-21-w30-r0-factory/evidence.md"
---

# Trying the Work Store and the Factory

## Overview

This guide is a hands-on walk through the new parts of the 2.1.0 build of Make Docs. You install the build on your own computer. Then you try each new capability in a small practice project, one scenario at a time.

Each scenario tells you four things:

- **Why**: why a person does this.
- **Do**: the exact command, or the exact words to say to your agent tool.
- **You see**: real output from a practice run. Paths and IDs are shortened. Your times and IDs differ.
- **If it goes another way**: what that means and what to do.

The build reports version `2.1.0`. Before the release, you build it from the maintainer repository. This guide calls it "the 2.1.0 build".

Part 1 covers the work store. Part 2 covers factory setup. Part 3 covers a factory run. Part 4 covers the smaller changes. A checklist at the end lets you tick off each scenario.

### Words You Will See

| Word | What it means |
| --- | --- |
| Store | The one Make Docs database on your computer. By default it is the folder `.make-docs` in your home folder. |
| Work store | The part of the Store that holds your backlog work: phases, stages, tasks, and quick items. |
| Repo copy | The `docs/work/` files. When the work store is in charge, these files are its copy in your project. |
| Unit | One piece of work: a wave, revision, phase, stage, task, or quick item. You name it by its coordinate, such as `W1 R0 P1 T2`. |
| Sync | Make Docs compares the `docs/work/` files with the work store, and moves each change to the other side. |
| Conflict | Both sides changed the same file. Make Docs stops for that file, and a person picks a side. |
| Claim | A time-limited hold on a unit, so two agents do not do the same work. |
| Claim ID | A private key that a new claim gives you once. You need it to report, close, renew, or release that claim. |
| Factory | Make Docs plans and records work that your agent tools do: a builder builds, a separate reviewer checks, and you accept. |
| Workflow | One saved factory setup for one project: which tool fills each role, how it wakes, and how it reaches you. |
| Foreman | The agent that runs the factory loop. It gives jobs to the other roles and judges the results. |
| Grant | A permission that you give the factory for one kind of action, such as a merge. |
| Drift | Something changed after setup, such as a tool version. A drifted workflow takes no new work until it is fixed. |

## Before You Start

### What You Need

- Node.js 24 or later, and npm.
- git.
- A checkout of the Make Docs maintainer repository, to build the package.
- For Parts 2 and 3: an agent tool that can read and write files, run commands, start a helper agent, wait for it, and read its result.

### Install the Build

The method below installs the build into its own practice folder. Your current `make-docs` command stays as it is. The steps come from [Building and Installing the CLI Locally](../maintainer/cli-development-local-build-and-install.md).

1. Build and pack the CLI. Run this from the root of the maintainer repository:

   ```bash
   npm install
   cd packages/cli
   npm run prepack
   npm pack
   ```

2. Make a practice folder, and install the packed file there:

   ```bash
   mkdir -p "$HOME/make-docs-practice/tool"
   TARBALL="$(ls brucewaynedecoy-make-docs-*.tgz | tail -n 1)"
   npm install --prefix "$HOME/make-docs-practice/tool" "./$TARBALL"
   ```

3. Point the `make-docs` command at the build, for this terminal only:

   ```bash
   alias make-docs="$HOME/make-docs-practice/tool/node_modules/.bin/make-docs"
   ```

Each new terminal needs step 3 again.

When the practice pass is done and you want the build as your normal `make-docs` command, first make the backup in [Way 2](#way-2-back-up-your-real-store-first). Then run `npm install -g "./$TARBALL"` from `packages/cli`. Then run `command -v make-docs` and `make-docs --version`. If the version is still the older one, your older copy is in another npm folder. Add `--prefix` with that folder to the install command.

### Check the Version

```bash
make-docs --version
```

You see:

```text
2.1.0
```

An older copy shows a lower number. To make sure, run `make-docs factory --help`. The build lists the factory commands. An older copy does not know the `factory` group.

### Safety: Your Real Store Gets an Upgrade

Read this section before you run any other command.

The 2.1.0 build uses Store schema 9. The released 2.0.9 CLI uses schema 6. The first command of the new build that writes to a schema 6 Store upgrades it to schema 9. After that, an older CLI cannot use that Store. It reports that the Store's schema is newer than it supports.

The upgrade saves its own copy beside the Store file, named `store.db.bridge-v6-to-v9-<id>.backup`. Do not rely on that copy alone.

You have two safe ways forward. Use the practice Store for your first pass.

#### Way 1 (recommended for the first pass): use a practice Store

The `MAKE_DOCS_HOME` setting tells Make Docs which Store folder to use. Set it to a new folder. Then every command in that terminal uses the practice Store, and your real Store is not touched.

```bash
mkdir -p "$HOME/make-docs-practice/store"
export MAKE_DOCS_HOME="$HOME/make-docs-practice/store"
echo "Store for this terminal: $MAKE_DOCS_HOME"
```

Check the last line before each session. It must name the practice folder.

> **Warning:** an empty `MAKE_DOCS_HOME` counts as not set. Make Docs then uses your real Store. Do not build the value from a command that can fail, such as `mktemp`, unless you check the result. A fixed folder, as above, is safer.

Each new terminal needs the `export` line again. Your agent tool sees the practice Store only when it runs `make-docs` from a shell that has this setting. Start your agent tool from this same terminal. Then ask it to run `echo "$MAKE_DOCS_HOME"` and to stop if the line is empty.

> **Warning about MCP:** your agent tool can also reach Make Docs through an MCP server (a tool server that the agent tool starts from its own settings). That server may not see the setting from your terminal, so it may use your real Store. For the practice pass, tell your agent tool: "Use the `make-docs` command in the shell, not the Make Docs MCP tools."

#### Way 2: back up your real Store first

Use this way only when you are ready to upgrade your real Store.

1. Stop every Make Docs command and every agent tool session that uses Make Docs.
2. Make a dated copy, and make the copy read-only:

   ```bash
   BACKUP="$HOME/make-docs-store-backup-$(date +%Y%m%d-%H%M%S)"
   cp -Rp "$HOME/.make-docs" "$BACKUP"
   chmod -R a-w "$BACKUP"
   echo "Backup: $BACKUP"
   ```

3. To go back to 2.0.9 later, stop every Make Docs command again. Move the upgraded `$HOME/.make-docs` folder aside. Copy the backup folder back to `$HOME/.make-docs`, and make it writable with `chmod -R u+w "$HOME/.make-docs"`.

### Make the Practice Project

Every scenario uses one small practice project named `garden`. It has git and one backlog with two phases.

1. Check that `MAKE_DOCS_HOME` names the practice Store. Then make the project folder:

   ```bash
   mkdir -p "$HOME/make-docs-practice/garden"
   cd "$HOME/make-docs-practice/garden"
   git init -b main
   ```

2. Install Make Docs in it:

   ```bash
   make-docs setup
   ```

   The wizard asks about your agent tools. For Part 1, you can pick none for each tool. For Parts 2 and 3, pick the method that your agent tool uses. Setup creates the practice Store: its plan says `Create a fresh schema-9 Store.` To skip the wizard, `make-docs setup --help` lists the flags that turn off each agent tool.

3. Check the project name. Setup gives a new project its name. It takes the name from the folder name, so it writes `projectName: garden` into `.make-docs/config.yaml`. Its plan says `Project name: garden, from the checkout folder name.` Open the file. It looks like this, with your own ID, and with your own tool choices in place of `...`:

   ```yaml
   {
     projectName: garden,
     harnessIntegrations: [ ... ],
     resourceProjection: [],
     projectId: 661a5b74-8ed5-4590-b2be-91f832f2366d
   }
   ```

   You can change the name in that file at any time. If setup says that the name `garden` belongs to another project in this Store, an earlier practice project still holds it. Setup then writes no name and still finishes. With the practice Store, delete the `$HOME/make-docs-practice` folder and start again from Way 1. With your real Store, choose another name, add `projectName: <name>` to the file, and use that name where this guide says `garden`.

4. Add the practice backlog:

   ```bash
   B=docs/work/2026-11-25-w1-r0-first-release
   mkdir -p "$B"
   cat > "$B/00-index.md" <<'EOF'
   ---
   title: "W1 R0 First Release"
   kind: "work"
   status: "active"
   coordinate: "W1 R0"
   ---

   # W1 R0 First Release

   ## Purpose

   Ship the first release of the garden planner.
   EOF
   cat > "$B/01-build.md" <<'EOF'
   ---
   title: "Phase 1: Build"
   kind: "work"
   status: "active"
   coordinate: "W1 R0 P1"
   ---

   # Phase 1: Build

   ## Stage 1 - Core

   ### Tasks

   - [ ] T1: Add the plant list.
   - [ ] T2: Add the watering schedule.

   ## Stage 2 - Check

   ### Dependencies

   - Stage 1 is complete.

   ### Tasks

   - [ ] T3: Test the schedule.
   EOF
   cat > "$B/02-ship.md" <<'EOF'
   ---
   title: "Phase 2: Ship"
   kind: "work"
   status: "active"
   coordinate: "W1 R0 P2"
   ---

   # Phase 2: Ship

   ### Dependencies

   - P1 is complete.
   - The owner approves the release notes.

   ### Tasks

   - [ ] T1: Write the release notes.
   EOF
   git add -A
   git commit -m "Practice backlog"
   ```

The line "The owner approves the release notes." names no unit. So Make Docs reads it as a gate: a condition that a person records as met.

## Part 1: The Work Store

The work store keeps your backlog work in the Store. Agents can then ask "what is ready?", claim a unit, and close it, with the same answer for every agent. The `docs/work/` files stay in your project as its repo copy. Each scenario below builds on the one before it. Run them in order.

To find a unit's version for `--expected-version`, add `--json` to `make-docs work next` and read the unit's `"revision"` value. A command that changes a unit gives you the new value in its line `Unit revision: <n>`.

### Scenario 1: First sync

**Why:** the first sync brings your existing backlog into the work store.

**Do:**

```bash
make-docs work sync
```

**You see:**

```text
First sync of this checkout: 3 work files and 9 units entered the store. Make Docs wrote and removed no project file.
```

The first sync only imports. `git status` shows no change to `docs/work/`.

**If it goes another way:** a line that names a file and its first failing line means that Make Docs cannot read that file. It leaves the file alone. Fix the named line, then sync again.

### Scenario 2: Who is in charge

**Why:** you want to know whether the work store or the files decide, and why.

**Do:**

```bash
make-docs work status
```

**You see:**

```text
The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.
Repo copies are on: sync keeps the docs/work/ files and the store the same.
10 open units: 5 ready, 5 waiting. 0 quick items. 0 live claims.
Sync check: the files and the store match.
Changes nothing.
```

Without a usable Store, the first line says that the `docs/work/` files are the authority instead. Scenario 9 shows that case.

### Scenario 3: What is ready, and why the rest waits

**Why:** an agent or a person wants the next safe piece of work.

**Do:**

```bash
make-docs work next
make-docs work next --level task
```

**You see:**

```text
Ready phases (1), in order. Read each unit's revision with --json, for --expected-version:
  W1 R0 P1: Phase 1: Build (docs/work/2026-11-25-w1-r0-first-release/01-build.md)
Waiting (1):
  W1 R0 P2: Phase 2: Ship
    - Waits for W1 R0 P1 to close. Next: Finish or close W1 R0 P1.
    - Waits for this condition: "The owner approves the release notes.". Next: When the condition is true, record it as met with `make-docs work report`.
Sync check: the files and the store match.
Changes nothing.
```

```text
Ready tasks (2), in order. Read each unit's revision with --json, for --expected-version:
  W1 R0 P1 T1: Add the plant list. (docs/work/2026-11-25-w1-r0-first-release/01-build.md)
  W1 R0 P1 T2: Add the watering schedule. (docs/work/2026-11-25-w1-r0-first-release/01-build.md)
Waiting (2):
  W1 R0 P1 T3: Test the schedule.
    - Part of W1 R0 P1 S2, which is not ready yet. Next: Run `make-docs work next --level stage` to see why W1 R0 P1 S2 waits.
  W1 R0 P2 T1: Write the release notes.
    - Part of W1 R0 P2, which is not ready yet. Next: Run `make-docs work next --level phase` to see why W1 R0 P2 waits.
Sync check: the files and the store match.
Changes nothing.
```

Each waiting unit names each reason, and one next step for each reason.

### Scenario 4: Claim a task, report progress, and close it

**Why:** a claim stops two agents from doing the same task.

**Do:** claim `T1` as `alex`. The task handle is a short label that another person can check, such as a terminal or session name.

```bash
make-docs work claim "W1 R0 P1 T1" --claimant alex --task-handle terminal-1 --expected-version 1
```

**You see:**

```text
Claimed W1 R0 P1 T1 for alex until 2026-11-25T23:10:15.089Z.
Claim ID: wc-<id>. Unit revision: 1.
Keep the claim ID private, like a key: Make Docs shows it only now. Report, close, release, and renew need it.
Renew at least every 10 minutes: make-docs work claim W1 R0 P1 T1 --claimant alex --claim-id <claim ID> --expected-version 1
Sync: 0 files imported, 0 files written, 0 copies removed.
```

Copy the claim ID now. No other command shows it again.

**Do:** try to take the same task as a second person:

```bash
make-docs work claim "W1 R0 P1 T1" --claimant sam --expected-version 1
```

**You see:** a refusal. The command exits with code 1.

```text
Not claimed: W1 R0 P1 T1. The unit has a live claim. Its holder renews it with --claim-id; nobody else can claim it now.
  Claimant: alex. Ends: 2026-11-25T23:10:15.089Z.
This claim changed no unit.
```

**Do:** report progress, then close the task. Put your claim ID in place of `<claim ID>`.

```bash
make-docs work report "W1 R0 P1 T1" --claim-id <claim ID> --status in-progress --note "Plant list shows ten plants." --expected-version 1
make-docs work close "W1 R0 P1 T1" --claim-id <claim ID> --expected-version 3
```

**You see:**

```text
Reported on W1 R0 P1 T1: status open to in-progress, recorded a note.
Unit revision: 3.
Latest note (2026-11-25T22:40:15.586Z): Plant list shows ten plants.
Store-only edits (the file copy does not show them):
  - The store records W1 R0 P1 T1 as in-progress. The file shows [ ].
```

```text
Closed W1 R0 P1 T1 as done, and released its claim. Closing every task does not close its phase. The next sync shows it in docs/work/2026-11-25-w1-r0-first-release/01-build.md.
Unit revision: 4.
```

**Do:** sync, and look at the file:

```bash
make-docs work sync
git diff
```

**You see:** `Wrote: docs/work/2026-11-25-w1-r0-first-release/01-build.md.` The diff shows `- [x] T1: Add the plant list.` Commit the change with `git commit -am "T1 done"`.

**If it goes another way:**

- `The unit changed since you read it.` Your `--expected-version` is old. Read the unit again with `make-docs work next --level task --json`, and use its `"revision"`.
- `A live claim holds the unit, and this request does not name its claim ID.` Add `--claim-id`. Only the holder changes a claimed unit.
- To let go of a claim without closing the unit, use `make-docs work release <unit> --claim-id <claim ID> --expected-version <n>`.

### Scenario 5: Edit a work file by hand

**Why:** a person can still tick a box in the file. The edit reaches the work store at the next sync.

**Do:** tick `T2` in the file, then check and sync:

```bash
sed -i.bak 's/- \[ \] T2:/- [x] T2:/' docs/work/2026-11-25-w1-r0-first-release/01-build.md && rm docs/work/2026-11-25-w1-r0-first-release/01-build.md.bak
make-docs work status
make-docs work sync
```

You can also make the edit in your editor.

**You see:**

```text
Sync check: 1 file to import. The next work write command, or make-docs work sync, applies the changes.
```

```text
Sync: 1 file imported, 0 files written, 0 copies removed.
```

Commit the change. Now both tasks of Stage 1 are done. A stage does not close on its own when its tasks close.

**Do:** look at the stages, then close Stage 1. Use the `"revision"` of `W1 R0 P1 S1` from `make-docs work next --level stage --json`.

```bash
make-docs work next --level stage
make-docs work close "W1 R0 P1 S1" --expected-version 1
```

**You see:**

```text
Closed W1 R0 P1 S1 as done. The next sync shows it in docs/work/2026-11-25-w1-r0-first-release/01-build.md.
Unit revision: 2.
Store-only edits (the file copy does not show them):
  - The store records W1 R0 P1 S1 as closed (done). The file shows no status.
```

`make-docs work next --level task` now lists `W1 R0 P1 T3: Test the schedule.` as ready.

### Scenario 6: Record evidence

**Why:** you keep proof, such as a test run, beside the phase it belongs to.

**Do:**

```bash
echo '{"command":"npm test","result":"passed","tests":12}' > "$HOME/make-docs-practice/test-run.json"
make-docs work evidence record "W1 R0 P1" --kind test-run --payload-json "$HOME/make-docs-practice/test-run.json"
make-docs work evidence read "W1 R0 P1"
```

**You see:** both commands print JSON. The record names the project, the wave folder, the phase file, `"evidenceKind": "test-run"`, and the time. The read lists each saved record with its payload.

### Scenario 7: A conflict, and the one settle command

**Why:** when the file and the work store both change, Make Docs does not guess. You pick a side with one command.

**Do:** close `T3` in the store. Then change its title in the file before you sync. Use the `"revision"` of `T3` from `make-docs work next --level task --json`.

```bash
make-docs work close "W1 R0 P1 T3" --expected-version <n>
sed -i.bak 's/T3: Test the schedule./T3: Test the schedule on a phone./' docs/work/2026-11-25-w1-r0-first-release/01-build.md && rm docs/work/2026-11-25-w1-r0-first-release/01-build.md.bak
make-docs work sync
```

**You see:**

```text
Sync stopped for docs/work/2026-11-25-w1-r0-first-release/01-build.md.
The file and the store both changed. A person decides.
File: present (sha256 79c9eadfd7ee).
Store: revision 15, 6 units.
What differs:
- W1 R0 P1 S1: file no status, "Core"; store closed (done), "Core".
- W1 R0 P1 T3: file [ ], "Test the schedule on a phone."; store closed (done), "Test the schedule.".
These units wait until you choose: W1 R0 P1, W1 R0 P1 S1, W1 R0 P1 S2, W1 R0 P1 T1, W1 R0 P1 T2, W1 R0 P1 T3. Other files continue.
Choose one:
- Keep the file. Make Docs imports it and replaces the store's version. Run: make-docs work sync --settle docs/work/2026-11-25-w1-r0-first-release/01-build.md --keep-file
- Keep the store. Make Docs rewrites the file from the store. Run: make-docs work sync --settle docs/work/2026-11-25-w1-r0-first-release/01-build.md --keep-store
```

`make-docs work status` shows the same two commands. `make-docs work next` says that phase 1 waits: `Its file ... has a sync conflict.`

**Do:** keep the store:

```bash
make-docs work sync --settle docs/work/2026-11-25-w1-r0-first-release/01-build.md --keep-store
git diff
```

**You see:**

```text
Settled docs/work/2026-11-25-w1-r0-first-release/01-build.md (both-changed) with --keep-store: Keep the store. Make Docs rewrites the file from the store.
Sync: 0 files imported, 1 file written, 0 copies removed.
```

The file now shows `- [x] T3: Test the schedule.` Phase 1 is ready again. Commit the change.

**If it goes another way:** other conflict kinds offer other choices. A deleted file offers `--restore` or `--accept-deletion`. A file whose work left the store offers `--reimport` or `--remove-file`. The report always names the two commands that fit.

### Scenario 8: A gate and a quick item

**Why:** a gate holds work until a person says a condition is true. A quick item is a small task with no design, plan, or PRD.

**Do:** record the gate of phase 2 as met. Use the `"revision"` of `W1 R0 P2` from `make-docs work next --json`.

```bash
make-docs work report "W1 R0 P2" --met-gate "The owner approves the release notes." --expected-version <n>
```

**You see:**

```text
Reported on W1 R0 P2: recorded 1 gate as met.
Unit revision: 2.
Store-only edits (the file copy does not show them):
  - The store records the gate "The owner approves the release notes." of W1 R0 P2 as met.
```

**Do:** add a quick item, and read it:

```bash
make-docs work add "Pick a logo color"
make-docs resource read make-docs://project/garden/tasks/1
```

**You see:**

```text
Added task 1: Pick a logo color. It lives only in the work store. Unit revision: 1.
Read it from any folder: make-docs resource read make-docs://project/garden/tasks/1
```

```text
# task 1: Pick a logo color

make-docs://project/garden/tasks/1

- Status: open
- Claim: none
- Links: none

This quick item has no body.
```

`make-docs resource read make-docs://project/garden/backlog/W1/R0/` shows the revision and its phases the same way. These addresses name the project in full, so they give the same answer from any folder.

### Scenario 9: A teammate with no Store

**Why:** a teammate can use the same backlog without Make Docs or without a Store. The files are then the authority for them.

**Do:** make a clone that acts as the teammate. Give it its own empty Store setting.

```bash
git clone "$HOME/make-docs-practice/garden" "$HOME/make-docs-practice/garden-teammate"
cd "$HOME/make-docs-practice/garden-teammate"
MAKE_DOCS_HOME="$HOME/make-docs-practice/no-store" make-docs work status
MAKE_DOCS_HOME="$HOME/make-docs-practice/no-store" make-docs work claim "W1 R0 P1" --claimant sam --expected-version 1
```

**You see:**

```text
The docs/work/ files are the authority, because this computer has no Make Docs Store.
Next: Run make-docs setup to create the Store. Read and edit the docs/work/ files directly. They are the authority until the Store is usable.
Changes nothing.
```

```text
This computer has no Make Docs Store. Nothing changed, and Make Docs created no Store. Only operation 'work.queue.claim' stopped. Independent Store-free work can continue. Next: Run make-docs setup to create the Store, then run this command again. Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot --target-root . in the checkout, which reads them without the Store.
```

No folder is made at `no-store`. Without a Store there are no claims. Two people can pick the same unit, so talk first.

**Do:** the teammate ticks a box and commits. Then you pull and sync in your own project:

```bash
sed -i.bak 's/- \[ \] T1: Write/- [x] T1: Write/' docs/work/2026-11-25-w1-r0-first-release/02-ship.md && rm docs/work/2026-11-25-w1-r0-first-release/02-ship.md.bak
git commit -am "Release notes written"
cd "$HOME/make-docs-practice/garden"
git pull "$HOME/make-docs-practice/garden-teammate" main
make-docs work sync
```

**You see:** `Sync: 1 file imported, 0 files written, 0 copies removed.` The teammate's tick is now in the work store.

**If it goes another way:** `make-docs backlog snapshot` needs `--target-root`. Without it, it says `` `backlog snapshot` requires --target-root. `` Run `make-docs backlog snapshot --target-root .` instead.

## Part 2: Factory Setup

The factory lets your agent tools do approved backlog work for you. A builder builds. A separate reviewer checks the actual work. The foreman sends defects back for correction. You hear only about the things that need you, and you accept the result at the end.

Make Docs never starts a tool. Your agent tool does the work. Make Docs plans the work, checks each step, and records it.

The factory stays off until you ask for setup.

### Scenario 10: Install the two factory Skills

**Why:** the `factory-setup` Skill sets up a workflow. The `factory` Skill runs it. Your agent tool needs both.

**Do:** in the practice project, look at the Skills that the project has now. Then preview the change, and apply it:

```bash
make-docs
make-docs setup skills --skill-scope project --selected-skills factory,factory-setup --dry-run
make-docs setup skills --skill-scope project --selected-skills factory,factory-setup
```

`--selected-skills` replaces the whole selected set. In your own projects, list every Skill that you want to keep. The bare `make-docs` command shows the current set in its line `Skills: <n> selected` and its `- selection:` line.

**You see:** the preview lists `Selected skills: factory and factory-setup` and the planned Skill files.

**If it goes another way:** `Platforms: none` and `Planned skill file operations: - none` mean that the project has no agent tool selected. Run `make-docs setup reconfigure` and pick the method that your agent tool uses, then try again.

### Scenario 11: Start factory setup

**Why:** setup finds your tools, learns what each can do, asks you a few choices, proves each needed capability, and runs one small test task.

**Do:** start your agent tool from the terminal that has the practice `MAKE_DOCS_HOME`. Then say:

> Use the factory-setup skill to set up a factory workflow for project garden. Use the make-docs command in the shell, not the Make Docs MCP tools.

Some agent tools name a Skill with a sign before it, such as `$factory-setup`. Use the form that your tool uses.

**What happens:** setup runs six steps: find the tools, read each tool, interview you, wire and prove, save and test, and the summary. First it checks the CLI, the Store, and the project. It stops at the first missing part, names it, and saves nothing.

You can watch the state from a second terminal. Before setup saves anything, you see:

```bash
make-docs factory workflow list --target-root "$HOME/make-docs-practice/garden"
```

```text
Project: project garden (<project-id>), as named.
Checkout: …/make-docs-practice/garden.
No factory workflow is in the config or saved yet.
Changes nothing.
```

**If it goes another way:**

| Setup says | It means | Fix |
| --- | --- | --- |
| `store-unavailable` | No usable Store. | Run `make-docs setup` in the project. |
| `store-denied` | The agent has no Store write access. | Run `make-docs setup --target <checkout>`, and grant Store write to the agent. |
| `store-unsafe` | The Store is not safe to use. | Run `make-docs setup store check`, and follow its next step. |
| `project-checkout-unclear` | The project has no single checkout. | Name the checkout path. |

### Scenario 12: Answer the interview

**Why:** setup asks only for your preferences and permissions. It finds every fact itself: your tools, their versions, the project, and whether the folder uses git.

**What setup asks:** one decision at a time, with its recommendation first and at most two choices.

1. **Workflow type.** `build-then-review` (one builder and a separate reviewer), `lead-and-specialists` (the foreman splits one unit across specialists), or `staged-backlog` (the foreman works through ready units in order, such as a whole wave).
2. **Human channel.** How the factory reaches you: a tool that can message you and read your answer, or "wait in session" (it asks in the chat and waits for you).
3. **Wake method.** What starts the foreman again: an event, a schedule, or you.
4. **Limits.** The defaults are 3 correction rounds, the parallel workers that your tools allow, and a claim size of one phase.
5. **Preflight.** Whether the factory settles owner choices before each unit. The recommendation is off.
6. **Added events.** Other events that must always reach you. The recommendation is none.
7. **Grants.** Only for actions that this work can need, such as a merge. The recommendation is no grant: the factory asks you each time.
8. **Working copies.** A separate working copy for each worker, or none. Setup skips this question when a rule forbids worktrees or the folder has no git.
9. **Known losses.** Each thing that the workflow runs without, such as "No tool can wake on its own." You accept each one, or pick a fix.

A clear "yes" takes the recommendation.

**Two workflow types were proved with real tools.** Pick one of them for your first pass:

| Type | Proved with | What it showed |
| --- | --- | --- |
| `staged-backlog` | One agent tool in every role, with a fresh helper agent for each builder and each reviewer. Human channel "wait in session". Wake by the person. | Two phases done, one correction round, one acceptance request. |
| `lead-and-specialists` | One tool that runs several agent sessions at once as the foreman, plus one agent tool for the specialists and the reviewer. Human channel: that agent's chat, opened on a phone. Wake by an event. | Two parts built at the same time, one review, one escalation answered away from the session, one acceptance request. |

`build-then-review` ships too. No real-tool proof ran for it on its own.

### Scenario 13: The test task and the closing summary

**Why:** only a passed test task makes a workflow ready. The summary tells you, in plain words, what you now have.

**What happens:** setup saves the choices, then runs one small task from start to end. A fresh builder does it. A separate fresh reviewer checks it. Setup saves the result. The CLI says:

```text
Saved workflow main for project garden (<project-id>).
Plan revision 1 (new). Readiness: wired: saved and proved, but no test task has passed under this plan.
Next: Run the test task under plan revision 1 and record it with make-docs factory proof save --plan-digest a8bdea08….
```

```text
Saved a passed test task for workflow main of project garden (<project-id>), under plan revision 1.
Plan revision 1 is now the ready revision. The workflow is ready and takes new work.
```

Setup ends with a summary. This sample is the one-tool sample of the `factory-setup` Skill, shortened. The agent writes the real text, so your tool names and words differ:

```text
Factory setup for project garden is done. Workflow main is ready: it can take new work.

Roles. Tool A (version 1.0) fills every role: it is the front desk and the foreman, and it starts a fresh helper agent for each builder and each reviewer. A reviewer is never the agent that built the work. All five capabilities that these roles need are proved.
Wake. No tool can wake on its own. The factory runs only while you keep a session open.
Human channel. Wait in session: when the factory needs a decision, it asks you in the chat and waits for you.
Test task. Tool A took a small request, a fresh builder wrote one line, a separate fresh reviewer checked it, and the result came back to you. It passed under plan revision 1.
Known losses you accepted.
- No tool can wake on its own, so the factory runs only while a session is open.
Grants. None. The factory asks you before each merge, deploy, publish, or payment.
Open manual steps. None.
Next. Ask for the factory skill to run work.
```

Setup does not start a run. A manual step is something only you can do, such as a sign-in or an app permission. Setup never does one for you. It lists each one with what to do, why, whether it is required, and what it unblocks.

**Do:** check the result yourself:

```bash
make-docs factory status --target-root "$HOME/make-docs-practice/garden"
```

**You see** (a practice run with a stand-in tool named `tool-a`):

```text
Factory status for project garden (<project-id>), as named.
Checkout …/make-docs-practice/garden (the checkout of this call):
  Workflow main: ready: it takes new work. Plan revision 1.
  No open assignment.
Bound tools of this machine, with the age of each proof. A proof older than 30 days is old:
- tool-a (Tool A): available, version 1.0, last reported today.
  - launch-agent: proved today.
  - read-agent-result: proved today.
  - read-write-files: proved today.
  - run-commands: proved today.
  - wait-for-agent: proved today.
Changes nothing.
```

**If it goes another way:** `wired` means that the test task has not passed under the current plan. `draft` means that a role has no proved tool. Ask for the `factory-setup` Skill again. A rerun updates the same workflow, and shows you what changed.

## Part 3: A Factory Run

### Scenario 14: Ask for a run

**Why:** you hand the factory an approved scope and come back to accept it.

**Do:** say to your agent tool:

> Use the factory skill. Run workflow main of project garden on W1 R0.

Use a fresh copy of the practice backlog, or a new backlog, so that some units are still open.

**What happens:** the foreman reads the workflow and refuses it when it is not `ready`. It checks each bound tool again. Then, at each wake, it syncs the work queue, checks each open job, has each result reviewed by an agent that did not build it, sends defects back within the round limit, accepts units on the reviewer's evidence, closes them, and takes the next ready unit.

A finished helper returns control to the foreman. You do not need to start the run again after each unit.

### Scenario 15: What you hear, and what you do not

**Why:** the factory keeps quiet unless it needs you.

You hear only these five floor events, plus any event that you added at setup:

1. An action outside the authority that you granted, such as a merge, a deploy, a publish, or spending money.
2. A scope change: the outcome, the scope, or the acceptance criteria.
3. A correction loop that stops, because it fails the same way again or reaches its round limit.
4. A missing tool, a missing permission, or broken wiring. A drifted workflow is this event.
5. Work that is ready for you to accept at the end of the scope.

You do not hear routine progress. To look at any time, run:

```bash
make-docs factory status --target-root "$HOME/make-docs-practice/garden"
```

While a job runs, the status shows a line like this:

```text
  Lifecycle run run-garden-1:
    - task 1 (builder, part main): tool tool-a (Tool A), offered, last check 2026-11-25T22:44:30.492Z; round 0 of 3; claimed by foreman-1 until 2026-11-25T23:14:30.143Z.
```

### Scenario 16: A correction round

**Why:** the reviewer finds a defect. The builder fixes it. You do not need to act.

**What happens:** the reviewer returns defects with evidence. The foreman moves the builder's job to `needs-correction` and sends it back. The CLI counts each round:

```text
Moved the assignment for task 1 (builder, part main) in project garden (<project-id>) from in-review to needs-correction.
Round count 1 of 3. Last check 2026-11-25T22:44:47.943Z. Version 5.
```

A separate fresh reviewer checks the fix. You see the round count in `make-docs factory status` and in the acceptance request. You hear about corrections only when the loop stops (floor event 3).

### Scenario 17: An escalation, and how to answer it

**Why:** the factory needs a decision that only you can make, such as a merge.

**What happens:** the foreman tries to accept a unit and merge it. With no grant, the CLI refuses, and nothing changes:

```text
Refused for project garden (<project-id>). No grant names the action merge.
Next: Ask the person through the human channel.
Reason code: grant-missing. Nothing changed.
```

The foreman then sends you one self-contained message through your human channel. Each message names the project, what happened, what it needs, whether it is required, what it blocks, and what happens after you answer. This sample follows the message form of the `factory` Skill. The agent writes the real text, so your words differ:

```text
Project garden: phase 2 is ready to merge, but no merge permission is saved.

What happened: The reviewer passed phase 2. The CLI refused the merge (code grant-missing: no permission names this action).
What I need: Say yes or no to one merge of phase 2.
Required or optional: Required for the merge. Other work goes on.
What it blocks: The merge of phase 2.
After you answer: On yes, the factory records your permission, accepts phase 2, and merges it. On no, phase 2 stays reviewed, not accepted, and not merged.
```

**Do:** answer in plain words, such as "yes, once". In the recorded proof, the owner answered `once` from a phone.

**What happens next:** the foreman saves a one-time grant, then accepts and merges:

```text
Saved the grants of workflow main for project garden (<project-id>): 1 grant added, 0 grants revoked.
- merge: once, usable. Granted by the person at 2026-11-25T22:45:09.862Z. Grant ID fg-<id>, version 1.
This grant-only save resolved no plan, saved no plan revision, and did not change readiness.
```

```text
Used the once grant for merge, which is now spent.
The assignment is accepted, which is final.
```

`make-docs factory workflow show main --target-root "$HOME/make-docs-practice/garden"` lists the spent grant and its one use.

### Scenario 18: The one acceptance request

**Why:** a reviewed unit is not your acceptance. You accept the whole scope once, at the end.

**What happens:** the foreman sends one request. This sample is the request form of the `factory` Skill, filled in for the practice backlog. The agent writes the real text:

```text
Project garden: W1 R0 is ready for you to accept.

What happened: The factory finished W1 R0. A separate reviewer checked each unit against its requirements.
- W1 R0 P1: <one line on the result>. Correction rounds: 1. Evidence: <link>.
- W1 R0 P2: <one line on the result>. Correction rounds: 0. Evidence: <link>.
Open limits: none.
What I need: Accept the result, or name what to change.
Required or optional: Required. The work is reviewed, but it is not accepted until you accept it.
What it blocks: nothing else.
After you answer: On accept, the factory records your answer and ends the run. On a change, it opens the change as new work and tells you the plan.
```

**Do:** answer `accept`, or say what to change. Both recorded proofs ended this way.

### Scenario 19: Look at a workflow

**Do:**

```bash
make-docs factory workflow list --target-root "$HOME/make-docs-practice/garden"
make-docs factory workflow show main --target-root "$HOME/make-docs-practice/garden"
```

**You see:**

```text
1 workflow:
- Workflow main: ready: it takes new work.
-   Ready revision: 1. Latest revision: 1.
Changes nothing.
```

`workflow show` adds the current plan digest (a short fingerprint of the exact saved plan), the ready revision, each drift reason, the grants, and each grant use. Add `--revision <n>` for an older plan.

### Scenario 20: Drift, and the fix line for each kind

**Why:** a tool can change after setup. A drifted workflow takes no new work, and it names the smallest fix.

The CLI never contacts a tool. Your agent tool reports tool facts with `make-docs factory tools save`. The foreman does this before it takes new work.

**Do (hands-on): a hand edit of the config.** Change `roundLimit: 3` to `roundLimit: 5` in the workflow's entry in `.make-docs/config.yaml`. Then:

```bash
make-docs factory status --target-root "$HOME/make-docs-practice/garden"
```

**You see:**

```text
  Workflow main: drifted: something changed without a save, so it takes no new work. Ready revision 1.
    - config-changed: The workflow's entry in the factory block of .make-docs/config.yaml changed since the last save. Next: Undo the change to restore the saved plan, or save the workflow with make-docs factory workflow save and pass a new test task.
```

Undo the edit, for example with `git checkout .make-docs/config.yaml`. The status says `ready` again, with no new test task.

**A lost tool** (`tool-missing`). You see this when your agent tool reports a bound tool as gone:

```text
  Workflow main: drifted: something changed without a save, so it takes no new work. Ready revision 1.
    - tool-missing: Tool tool-a for the builder, foreman, front-desk and reviewer roles is missing on this machine. Next: Bring tool-a back and report it with make-docs factory tools save.
```

`make-docs factory workflow show` adds a second way: `If that cannot work: Bind another tool to the builder, foreman, front-desk and reviewer roles with make-docs factory workflow save.` When the tool is reported back, the workflow is `ready` again with no new step.

**A changed version** (`tool-version-changed`). You see this after your agent tool updates:

```text
    - tool-version-changed: Tool tool-a for the builder, foreman, front-desk and reviewer roles reports version 1.1, but its proof is for version 1.0. Next: Prove tool-a again and save it with make-docs factory tools save, save the workflow, and pass a new test task. If version 1.0 comes back, the workflow is ready again with no new step.
```

The fix is a setup rerun: ask for the `factory-setup` Skill again.

**A changed binding** (`binding-changed`). You see this when a proved fact of a bound tool changed, for example after setup of a second workflow proved the same tool again with another "does not cover" list:

```text
    - binding-changed: The proved facts of the tool for the foreman role changed since the last save. Next: Undo the change to restore the saved plan, or save the workflow with make-docs factory workflow save and pass a new test task.
```

A save makes a new plan revision. The workflow is `wired` until a new test task passes, then `ready`.

The samples for a lost tool, a changed version, and a changed binding come from a practice run with a stand-in tool named `tool-a`.

### Scenario 21: Get the local factory copies back

**Why:** Make Docs writes read-only copies of each workflow to `.make-docs/factory/`. Make Docs never reads them. If they get lost or edited, you write them again from the Store.

**Do:**

```bash
rm -rf "$HOME/make-docs-practice/garden/.make-docs/factory"
make-docs factory restore --target-root "$HOME/make-docs-practice/garden"
```

**You see:**

```text
Wrote the factory copies of project garden (<project-id>) again in checkout …/make-docs-practice/garden: .gitignore, tools.md, workflow-main.md.
The copies hold no grant. Make Docs never reads them as input.
```

### Scenario 22: File backups for work outside git

**Why:** in a folder without git, there is no `git restore`. So the foreman saves a copy of each file before a worker changes it.

**Try it:** make a second practice project with no git, such as `$HOME/make-docs-practice/notes`, set it up as in [Make the Practice Project](#make-the-practice-project) without `git init`, and run the factory on a small task there.

**What happens:** before the builder changes a file, the foreman saves its backup:

```text
Saved the backups of 1 file for the assignment of task 1 (builder, part main) in project notes (<project-id>), checkout …/make-docs-practice/notes.
- notes.md: backed up. Backup .make-docs/backup/factory/fa-<id>/notes.md, digest 56ca0222….
The backups are in .make-docs/backup/factory/, and its README.md says how to get a file back. Make Docs removes them when the work is accepted or closed, or after 30 days.
```

**To get a file back:** open `.make-docs/backup/factory/README.md` in that project. Find the folder of the job. The backup has the same path as the original file. Copy it back.

In a folder with git, the same call gives `not-needed` and writes no copy. Git is the undo there.

### Scenario 23: Remove a saved workflow

**Why:** you want to start the factory again from nothing, or stop using a workflow.

**Do:** review first. The review changes nothing.

```bash
make-docs factory workflow clean main --target-root "$HOME/make-docs-practice/garden"
```

**You see:**

```text
Review: removing saved workflow main from project garden (<project-id>) would delete these Store records, in this order:
- 0 backup records, each with its backup file.
- 3 final assignments.
- 1 grant use.
- 1 grant.
- 1 test task result.
- 2 plan revisions.
- 1 saved binding.
The config of checkout …/make-docs-practice/garden still has the entry factory.workflows.main. Make Docs never edits it. While it stays, the workflow shows as draft: in the config, but not saved.
A removal cannot be undone. The machine's tool list stays, and so do the project's other workflows and its work.
To remove it, run: make-docs factory workflow clean main --review 94b51cd4…, and name the project the same way.
This review changed nothing.
```

**Do:** run the command that the review gives, with its full digest and the same `--target-root`.

**You see:** `Removed saved workflow main from project garden …`, with the same list. `make-docs factory workflow list` then shows `main` as `draft`. Remove the entry from `.make-docs/config.yaml` to drop it fully.

**If it goes another way:** while a job of the workflow is open, the review says `The removal is refused now:` and `1 assignment of this workflow is open.` Finish or cancel the job first. If the workflow changed after your review, the removal refuses with `review-mismatch`. Review again.

## Part 4: The Smaller Changes

### Scenario 24: Task ID case and the project doctor

**Why:** Make Docs now writes task IDs with an upper-case `T`, such as `T3`. Every reader still accepts `t3`. The project doctor finds old forms and fixes them after your review.

**Do:** add an old-style phase to the practice project, commit it, and check:

```bash
mkdir -p docs/work/2026-11-25-w2-r0-old-style
printf -- '---\ntitle: "Phase 1: Tidy"\nkind: "work"\ncoordinate: "W2 R0 P1"\n---\n\n# Phase 1: Tidy\n\n### Tasks\n\n- [x] t1: Sort the seed list.\n- [x] t2: Remove old photos.\n' > docs/work/2026-11-25-w2-r0-old-style/01-tidy.md
git add -A && git commit -m "Old style phase"
make-docs project doctor check
```

**You see** (shortened):

```text
Project doctor: Found 2 lower-case task IDs on 2 lines in 1 file: 2 task lines and 0 prose references, and 1 phase file with no status line whose tasks are all checked. Nothing changed.

docs/work/2026-11-25-w2-r0-old-style/01-tidy.md
  line 11: t1 -> T1 (task line)
  line 12: t2 -> T2 (task line)
  line 4: add status: "completed" (status line)

Review digest: 313e35b8…
Next: Review each finding. Then run: make-docs project doctor fix --review 313e35b8… --target-root …/make-docs-practice/garden
```

**Do:** run the fix line that the check gives you.

**You see:**

```text
Project doctor fix: Changed 2 task IDs and added 1 status line in 1 file. No other text changed.
Changed: docs/work/2026-11-25-w2-r0-old-style/01-tidy.md (3) backup: .make-docs/backup/operations/<id>/1-before
Undo: Git tracks 1 changed file. …
```

A second `make-docs project doctor check` says `No problems found`.

### Scenario 25: Store review and Store cleanup

**Why:** you can see every project that the Store knows, and remove only Store rows that fixed rules prove safe to remove.

**Do:**

```bash
make-docs project list
make-docs setup store check
make-docs setup store clean --dry-run
```

**You see:**

```text
The Store knows 2 projects with 2 checkouts.

garden
  Project ID: <project-id>
  Last seen: 2026-11-25T22:46:33.640Z
  Checkout:
    …/make-docs-practice/garden
```

```text
Store check: Clean would remove nothing. 3 rows wait for the 30-day window; the first can go on 2026-12-25. Nothing needs your decision. No crash leftover blocks this computer. Nothing was changed.
Store: …/make-docs-practice/store/store.db (schema 9, 976.0 KB).

Fixed rules:
  STORE-RULE-001 Dead-owner lock with no pending operation: would remove nothing.
  …
  STORE-RULE-009 Harness receipt history beyond the kept count: would remove nothing.
```

A new practice Store has nothing to clean yet. When `clean` does remove rows, it first saves a backup in the Store's `backup/` folder and keeps the three newest. Its help, `make-docs setup store clean --help`, gives the restore steps.

Only Make Docs writes the Store. Do not edit `store.db` with another program.

`make-docs uninstall` keeps the Store unless you add `--remove-store`. Even then, the clean backups in the Store's `backup/` folder stay.

### Scenario 26: Old command names still work

**Why:** the command tree changed. Every capability now has its own top-level group, and `run` is no longer a group. Your old habits keep working for two minor releases, and each old name tells you the new one.

**Do:** run three old names from the table below. Run the old path check name from the tenth row, with `> /dev/null` at the end. Run the old lifecycle name from the sixth row, with `list` as the command and `> /dev/null` at the end. Then run the old group name alone: `make-docs`, then the word `run`.

<!-- make-docs:former-names -->
| Old name | New name |
| --- | --- |
| `make-docs run work item resolve` | `make-docs work item resolve` |
| `make-docs run work evidence record` and `read` | `make-docs work evidence record` and `read` |
| `make-docs run work backlog snapshot` | `make-docs backlog snapshot` |
| `make-docs run work backlog-cache lookup` and `write` | `make-docs backlog cache lookup` and `write` |
| `make-docs run backlog review open` and `refresh` | `make-docs backlog review open` and `refresh` |
| `make-docs run lifecycle <command>` | `make-docs lifecycle <command>` |
| `make-docs run prd authority validate` | `make-docs check prd` |
| `make-docs run performance evidence validate` | `make-docs check performance-evidence` |
| `make-docs run uat <kind> validate`, `run uat persona resolve`, `run uat evidence-reference validate` | `make-docs check uat <kind>`, `check uat persona`, `check uat evidence` |
| `make-docs project path-hygiene validate` and `repair` | `make-docs project paths validate` and `repair` |
| `make-docs project checkout-move preview` and `apply` | `make-docs project move preview` and `apply` |
| `make-docs project checkout-register preview` and `apply` | `make-docs project checkout preview` and `apply` |

**You see:** each old name runs the same command. First it prints one line that names the new command and says that the old name stops working in 2.3.0. The old group name alone prints that it is no longer a command group, and it names the `work`, `backlog`, `lifecycle`, and `check` groups.

In 2.3.0 an old name returns `command-renamed` with the new name. In 2.4.0 it is gone.

Each MCP tool name is now its command path after `make-docs`, joined with underscores, such as `work_status` or `factory_workflow_show`.

### Scenario 27: Skill helper scripts now run inside the CLI

**Why:** no Make Docs Skill ships a Python script now. You need no Python for them. Each Skill calls a CLI command instead.

| Skill | Old helper | Now |
| --- | --- | --- |
| `decompose-codebase` | `validate_output.py` | `make-docs check decomposition` |
| `archive-docs` | `trace_relationships.py` | `make-docs project relations list` |
| `cleanup-docs` | a Markdown style script | `make-docs project markdown validate` and `repair` |

**Do:**

```bash
make-docs project markdown validate
make-docs project relations list
```

**You see:**

```text
Markdown style check: Checked 4 Markdown files. No style findings. Changes nothing.
```

```text
Document relations: Read 6 artifacts and found 0 relations: 0 Markdown links, 0 related: entries, 0 history coordinates, and 0 same-slug guesses. Changes nothing.
```

`make-docs check decomposition` checks a decompose-codebase result and exits with 1 when it finds a problem.

### Scenario 28: Write commands refuse when there is no Store

**Why:** before, many write commands made a stray empty Store and then failed. Now 26 CLI write commands refuse the same clear way, and make nothing. Only `make-docs setup` creates a Store.

The 26 commands are: the seven work queue writes (`work sync`, `claim`, `release`, `report`, `close`, `export`, and `add`), `work evidence record`, `backlog cache write`, `resource ensure`, `project surface ensure`, the eight `lifecycle` writes, `project layout prepare`, `apply`, and `verify`, `project state recover`, and `project doctor fix`.

**Do:**

```bash
MAKE_DOCS_HOME="$HOME/make-docs-practice/no-store" make-docs work add "Test"
MAKE_DOCS_HOME="$HOME/make-docs-practice/no-store" make-docs lifecycle start --stage implementation --repo-root .
```

**You see:** each command exits with code 1.

```text
This computer has no Make Docs Store. Nothing changed, and Make Docs created no Store. Only operation 'work.queue.add' stopped. Independent Store-free work can continue. Next: Run make-docs setup to create the Store, then run this command again. Until the Store is usable, the docs/work/ files are the authority. Read them directly, or run make-docs backlog snapshot --target-root . in the checkout, which reads them without the Store.
```

```text
This computer has no Make Docs Store. Nothing changed, and Make Docs created no Store. Only operation 'lifecycle.start' stopped. Independent Store-free work can continue. Next: Run make-docs setup to create the Store, then run this command again.
```

With `--json`, the result carries the code `store-unavailable` and the detail `"maintenanceCode":"store-absent"`. No `no-store` folder is made.

## Checklist

Tick each box when the scenario did what this guide says.

| Done | Scenario | One line |
| --- | --- | --- |
| [ ] | 0 | Build installed, version checked, practice Store set, practice project made. |
| [ ] | 1 | First sync imports the backlog and writes no file. |
| [ ] | 2 | `work status` names the authority and why. |
| [ ] | 3 | `work next` lists ready units and why the rest wait. |
| [ ] | 4 | Claim, refused second claim, report, close, and sync into the file. |
| [ ] | 5 | A hand edit reaches the store; a stage closes. |
| [ ] | 6 | Evidence recorded and read back. |
| [ ] | 7 | A both-changed conflict, settled with one command. |
| [ ] | 8 | A gate recorded as met; a quick item added and read. |
| [ ] | 9 | A teammate with no Store uses the files; their edit syncs in. |
| [ ] | 10 | The two factory Skills installed. |
| [ ] | 11 | Factory setup started; missing parts stop it. |
| [ ] | 12 | Interview answered; known losses accepted. |
| [ ] | 13 | Test task passed; summary read; `factory status` says ready. |
| [ ] | 14 | A run asked for on a backlog. |
| [ ] | 15 | Only floor events reached you; `factory status` showed progress. |
| [ ] | 16 | A correction round ran without you. |
| [ ] | 17 | An escalation answered; a grant saved and spent. |
| [ ] | 18 | One acceptance request answered. |
| [ ] | 19 | `factory workflow list` and `show` read. |
| [ ] | 20 | Drift seen and fixed: config edit, lost tool, version, binding. |
| [ ] | 21 | `factory restore` wrote the copies again. |
| [ ] | 22 | A file backup saved outside git, and its README read. |
| [ ] | 23 | `factory workflow clean` reviewed, then applied. |
| [ ] | 24 | Doctor found and fixed lower-case task IDs. |
| [ ] | 25 | `project list`, `setup store check`, and `setup store clean --dry-run` read. |
| [ ] | 26 | Old command names ran and named the new ones. |
| [ ] | 27 | Markdown and relations commands ran with no Python. |
| [ ] | 28 | A write command with no Store refused and made nothing. |

## When You Finish

- To leave the practice setup, close the terminal, or run `unset MAKE_DOCS_HOME` and `unalias make-docs`.
- To remove the practice files, delete the `$HOME/make-docs-practice` folder. Your real Store is not in it.
- When you want the build on your real Store, make the backup in [Way 2](#way-2-back-up-your-real-store-first) first.

## Related Resources

- [Installing Make Docs](getting-started-installing-make-docs.md)
- [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md)
- [Installing and Managing Skills](skills-installing-and-managing-skills.md)
- [Wave, Revision, and Phase Coordinates](concepts-wave-revision-phase-coordinates.md)
- [Work Store reference](../../../.make-docs/system/references/work-store.md)
- [Factory contract](../../../.make-docs/system/contracts/factory-contract.md)
- [PRD 52: Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [PRD 53: Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [W29 R0 work store evidence](../../work/2026-11-21-w29-r0-work-store/evidence.md)
- [W30 R0 factory evidence](../../work/2026-11-21-w30-r0-factory/evidence.md)

## Future Coverage

- Blocked by: the 2.1.0 release.
  Update when: version 2.1.0 is on npm.
  Guide change: replace the build and pack steps in [Install the Build](#install-the-build) with an install of the released package.
