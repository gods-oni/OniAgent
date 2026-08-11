---
name: oni-agent-continue
description: Resume the task recorded in .claude/TASK.md, reconstructing enough context to carry on as if the earlier session had never ended. Use when the user runs /oni-agent-continue, or says "continue the task", "pick up where we left off", "resume", or "what was I working on".
---

# Continue the task

Pick up `.claude/TASK.md` and carry on. The point is to reach the first useful action fast,
without re-deriving what the previous session already established.

If there is no `.claude/TASK.md`, say so plainly and offer `/oni-agent-task` to open one. Do not
infer a task from recent git history — a guessed goal is worse than no goal, because it looks
authoritative.

## Read, then reconcile

Read the whole file first. Then check it against reality, because the file describes the repo
as it was at `Updated`, and the repo may have moved since — someone committed, switched branch,
or worked without the hook running.

Reconcile in this order, cheaply:

1. `git status` and `git log --oneline -5` since the task started — has work landed that the
   file does not mention?
2. Do the files named in `Next` and `Remaining` still exist, in the state implied?
3. Does anything in `Done` contradict what the repo now shows?

**Drift is information, not an error.** Report it in one line and correct the file before
working: "TASK.md says the hook is unwritten, but `hooks/task-guard.ps1` exists and is
committed — updating Done and moving to the next step." A silent correction leaves the user
unable to tell whether you noticed.

If the drift is large enough that the plan no longer applies, say so and ask rather than
improvising a new plan on top of stale acceptance criteria.

## Orient, briefly

Before acting, state in a few lines: the goal, what is done, what is next, and anything from
`Ruled out` that bears on the next step. This is for the user — it lets them catch a
misunderstanding before you spend a turn on it, and it costs almost nothing.

Read `Ruled out` properly. It exists specifically to stop you from confidently retrying
something the previous session disproved, and that failure is invisible from the inside: the
approach will look reasonable, which is exactly why it was tried the first time.

## Then work

Start on `Next`. Update `.claude/TASK.md` as you go, per
`../oni-agent-task/references/task-file.md` — a resumed session is the one most likely to be
resumed again.

Two habits that matter more here than in a fresh session:

- **Write down what you rule out, immediately.** You are the direct beneficiary of the previous
  session having done it.
- **Re-read `Done means` before declaring anything finished.** The criteria were agreed with the
  user when the task opened, in a conversation you were not part of. They are the definition,
  not your read of the code.

If the task turns out to be finished, report which criteria are met and ask the user to confirm
before clearing the file. Acceptance is theirs.
