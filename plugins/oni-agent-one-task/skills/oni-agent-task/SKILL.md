---
name: oni-agent-task
description: Open a tracked task with a persistent memory file at .claude/TASK.md, so the work survives losing the session. Use when the user runs /oni-agent-task, says "start a task", "track this", "let's work on X", or describes a multi-step piece of work while no task is active. Only one task exists at a time; starting a new one replaces the current task's context and requires confirmation.
---

# Open a task

One task at a time, recorded in `.claude/TASK.md`, written so a session with no memory of this
one can pick it up. Format and discipline: `references/task-file.md` — load it before writing
the file.

## First: is a task already open?

Read `.claude/TASK.md` before anything else.

**If it exists**, its context is about to be destroyed. Stop and confirm, showing what is being
discarded — the goal, how much of `Done means` is checked, and what `Next` said:

> A task is already open: **"Fix the stale-lockfile detection"** — 2 of 4 criteria met, next
> step was "add the packageManager tiebreaker". Starting a new task deletes this. The file is
> gitignored, so it cannot be recovered. Replace it?

Wait for an actual answer. Do not accept an implied yes because the user's message sounded like
a new task — describing new work is not the same as abandoning current work, and the whole
value of this file is that it does not silently vanish.

If they would rather keep it, offer to finish it, or to note the new idea in `Know this` and
come back to it. Do not maintain two tasks; the single-task constraint is what keeps the file
honest.

**If it does not exist**, continue.

## Settle "done" before writing anything

The one thing that cannot be reconstructed later is what the user actually meant by finished.
Establish it now, in their words, as criteria concrete enough to check.

Ask if it is not already clear. "Make the hook better" is not a task; "the Stop hook blocks when
TASK.md is stale and stays silent otherwise" is. A vague goal produces a task file that can
never be closed, and a resuming session that either stops early or polishes forever.

Also settle, briefly:

- What is explicitly **out** of scope — this prevents the slow expansion that makes tasks
  unfinishable
- Anything already tried, if the user has been working on this before now

## Write the file

Use the shape in `references/task-file.md`. Fill `Done means`, `Next` and `Remaining`; leave
`Done`, `Know this` and `Ruled out` out entirely until they have content — empty headings train
the reader to skim.

`Next` must be a single action specific enough to start without deciding anything first.

Create `.claude/` if needed. Then confirm `.claude/TASK.md` is gitignored — this file is a
working scratchpad and does not belong in diffs or in a teammate's branch. If it is not
covered, add it to `.gitignore` and say so.

## While working

Update the file when something changes what a fresh session would need to know: a step
completes, an approach is ruled out, a constraint surfaces, the plan changes. Refresh
`Updated` every time.

Do not narrate. The file records state, not activity — "wrote three files" is a diary entry the
repo already holds; "the plugin manifest must live in `.claude-plugin/`, not the plugin root"
is state.

Keep it under 60 lines. Compress `Done` first when it grows.

## Finishing

When every `Done means` box is checked, report it and ask the user to confirm — acceptance is
theirs, not yours. On confirmation, delete `.claude/TASK.md`.

Anything worth keeping past the task belongs somewhere durable: a convention goes in
`CLAUDE.md` or a rule, a decision and its rationale goes in `.claude/decisions/`. Deleting the
task file should never be the moment something valuable is lost.
