<!--
TEMPLATE — emits .claude/skills/task/SKILL.md in the target project.

Ships with two supporting files in the same directory, both copied from templates/task-skills/:
  references/task-file.md   the file format and its discipline
  task-guard.mjs            the Stop hook — copy BYTE FOR BYTE, it is not a template

The `hooks:` block below is the one part that has to be right. It follows the documented skill
frontmatter shape exactly: event → matcher-less entry → `hooks:` list of `{type, command}`.
Do not add fields you have not confirmed against the current frontmatter reference — a
malformed frontmatter block makes the whole skill fail silently at load time.

The hook command path is relative to the session's working directory, which is the project
root. If this project keeps `.claude/` somewhere else, fix the path.

Fill {{VERIFICATION_COMMAND}} and delete this comment block in the output.
-->

---
name: task
description: Open or resume the one tracked task, recorded in .claude/TASK.md so the work survives losing the session. Use when the user runs /task, says "start a task", "track this", "let's work on X", "continue the task", "pick up where we left off", "resume", or "what was I working on". Only one task exists at a time.
argument-hint: "[goal] — omit to resume the open task"
hooks:
  Stop:
    - hooks:
        - type: command
          command: node .claude/skills/task/task-guard.mjs
---

# Task

One task at a time, recorded in `.claude/TASK.md`, written for a session that has no memory of
this one. Format and discipline: `references/task-file.md` — load it before writing the file.

**Read `.claude/TASK.md` first, before anything else.** What happens next depends on whether it
exists and on whether the user gave a goal.

| `TASK.md` | Argument | Do |
| --- | --- | --- |
| absent | goal given | Open it — *Opening* below |
| absent | none | Say so plainly and offer to open one. **Do not infer a task from git history** — a guessed goal is worse than none, because it looks authoritative |
| present | none | Resume it — *Resuming* below |
| present | goal given | Confirm the replacement first — *Replacing* below |

## Opening

**Settle "done" before writing anything.** The one thing that cannot be reconstructed later is
what the user meant by finished. Establish it now, in their words, as criteria concrete enough
to check.

"Make the hook better" is not a task. "The Stop hook blocks when TASK.md is stale and stays
silent otherwise" is. A vague goal produces a file that can never be closed, and a resuming
session that either stops early or polishes forever.

Also settle, briefly: what is explicitly **out** of scope, and anything already tried.

Then write the file using the shape in `references/task-file.md`. Fill `Done means`, `Next` and
`Remaining`; leave `Done`, `Know this` and `Ruled out` out entirely until they have content —
empty headings train the reader to skim. `Next` must be one action specific enough to start
without deciding anything first.

Create `.claude/` if needed. Then confirm `.claude/TASK.md` is gitignored — it is a working
scratchpad and does not belong in a diff or a teammate's branch. If it is not covered, add it
and say so.

## Resuming

Reach the first useful action fast, without re-deriving what the last session established.

**Read the whole file, then reconcile it against reality.** The file describes the repo as it
was at `Updated`, and the repo may have moved — someone committed, switched branch, or worked
without the hook running. Cheaply, in this order:

1. `git status` and `git log --oneline -5` — has work landed the file does not mention?
2. Do the files named in `Next` and `Remaining` still exist, in the state implied?
3. Does anything in `Done` contradict what the repo now shows?

**Drift is information, not an error.** Report it in one line and correct the file before
working. A silent correction leaves the user unable to tell whether you noticed. If the drift is
large enough that the plan no longer applies, say so and ask — do not improvise a new plan on
top of stale acceptance criteria.

Then orient in a few lines: the goal, what is done, what is next, and anything from `Ruled out`
that bears on the next step. This lets the user catch a misunderstanding before you spend a turn
on it.

**Read `Ruled out` properly.** It exists to stop you confidently retrying what the last session
disproved, and that failure is invisible from the inside: the approach will look reasonable,
which is exactly why it was tried first.

## Replacing

The open task's context is about to be destroyed. Stop and show what is being discarded — the
goal, how much of `Done means` is checked, and what `Next` said:

> A task is already open: **"Fix the stale-lockfile detection"** — 2 of 4 criteria met, next
> step was "add the packageManager tiebreaker". Starting a new task deletes this. The file is
> gitignored, so it cannot be recovered. Replace it?

Wait for an actual answer. Do not accept an implied yes because the message sounded like new
work — describing new work is not the same as abandoning current work, and the whole value of
this file is that it does not silently vanish.

If they would rather keep it, offer to finish it, or to note the new idea in `Know this` and
come back to it. Do not maintain two tasks; the single-task constraint is what keeps the file
honest.

## While working

Update the file when something changes what a fresh session would need to know: a step
completes, an approach is ruled out, a constraint surfaces, the plan changes. Refresh `Updated`
every time.

Do not narrate. The file records state, not activity — "wrote three files" is a diary entry the
repo already holds; "the manifest must live in `.claude-plugin/`, not the plugin root" is state.

Keep it under 60 lines. Compress `Done` first when it grows.

## Finishing

When every `Done means` box is checked, verify it rather than asserting it — run
`{{VERIFICATION_COMMAND}}` — then report and ask the user to confirm. Acceptance is theirs, not
yours. On confirmation, delete `.claude/TASK.md`.

Anything worth keeping past the task belongs somewhere durable: a convention in `CLAUDE.md` or a
rule, a decision and its rationale in `.claude/decisions/`. Deleting the task file should never
be the moment something valuable is lost.

## About the hook

This skill registers a `Stop` hook when it is invoked. The hook compares `TASK.md` against the
working tree and blocks the turn from ending when code changed after the file was last written,
so the memory is never more than one turn behind the repo.

It registers **when `/task` runs**, and stays for the rest of that session. A session that never
invokes `/task` has no hook — so in a fresh session, resume with `/task` before working, not
after. Every unexpected condition inside it exits 0: a backstop that breaks the session is worse
than one that misses.
