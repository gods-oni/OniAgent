# The task file

`.claude/TASK.md` — one file, one task, gitignored. Read by `oni-agent-task` when writing it
and by `oni-agent-continue` when resuming.

## What it is for

Write it for **yourself, in a new session, with no memory of this one**. That is the only
audience. Every judgement below follows from it.

The test: if this session died right now and a fresh one opened with nothing but the repo and
this file, could it pick the work up without re-deriving anything or repeating a dead end?

## The rule that keeps it short

**Record only what cannot be recovered from the repo.**

The diff shows what changed. `git log` shows what happened. The code shows how it works. None
of that belongs here — restating it is how this file grows past the point where anyone reads
it, and an unread task file is worse than none, because it looks like state and is not.

What the repo cannot tell you, and therefore what this file is *for*:

- Why you chose this approach over the obvious alternative
- What you tried that did not work, and why
- Constraints you discovered the hard way
- What "done" actually means, as agreed with the user
- Which of the remaining steps are load-bearing and which are cleanup

Target 60 lines. If it grows past that, compress `Done` first — it is always the section that
bloats, and it is the least useful one to keep verbose.

## Shape

```markdown
# Task: <goal in one line>

**Started:** YYYY-MM-DD · **Updated:** YYYY-MM-DD HH:MM

## Done means
- [ ] <acceptance criterion, concrete enough to check>
- [ ] <...>

## Next
<the single next action, specific enough to start on without deciding anything>

## Remaining
- [ ] <step>
- [ ] <step>

## Done
- <what was completed> — <the one fact from it worth carrying forward>

## Know this
- <constraint, decision, or gotcha that is not visible in the repo>

## Ruled out
- <approach> — <why it failed>
```

Drop any section that is genuinely empty. Never drop `Next`.

## Section by section

**Done means** — the acceptance criteria, settled with the user when the task opens. Without
this, a resuming session cannot tell whether it is finished, and will either stop early or
keep polishing. Concrete enough to check: "the hook blocks when TASK.md is stale and does not
otherwise", not "the hook works".

**Next** — exactly one action, written so a fresh session can start it without making a
decision first. "Add the mtime comparison to `hooks/task-guard.ps1`" — not "continue the hook".
This is the field that makes resumption instant, and the one most often written uselessly.

**Remaining** — the rest, in order. Keep it a plan, not a wishlist. If a step's necessity is
uncertain, mark it `?` rather than deleting it or committing to it.

**Done** — one line per completed step, each carrying the fact worth keeping. "Wrote the
Stop hook — `stop_hook_active` is not in the Stop payload, so the staleness check has to be
self-resolving." The completion is the boring half; the fact is why the line exists. If a step
taught you nothing, one clause is enough.

**Know this** — constraints and decisions that are invisible in the code. Versions that matter,
services that must be running, a decision the user made and its reason, an API that behaves
differently from its documentation. This is where a resuming session gets the context that
would otherwise take twenty minutes of reading to reconstruct.

**Ruled out** — the highest-value section, and the one people skip. Without it a fresh session
will confidently retry the approach you already disproved, and burn the same hour you burned.
Each entry needs the reason, because "did not work" does not stop a retry — "posted input is
ignored while the window is unfocused" does.

## Freshness

The `Updated` timestamp is load-bearing: a resuming session uses it to judge how much drift to
expect between the file and the repo. Update it every time you touch the file.

Update the file when something changes what a fresh session would need to know — a step
completes, an approach is ruled out, a constraint is discovered, the plan changes. Not on a
timer, and not only at the end. A file that is only accurate at the end is exactly wrong, since
the sessions that die are the ones that did not reach the end.

The Stop hook is a backstop for that discipline, not a replacement: it catches the case where
code changed and the file did not. It cannot tell whether what you wrote was *useful*.

## Finishing

When every `Done means` box is checked, say so and ask the user to confirm before clearing.
Do not decide on their behalf that the task is complete — acceptance is theirs.

On confirmation, delete `.claude/TASK.md`. It is gitignored, so there is nothing to archive and
nothing to clean up; the durable record of what happened is the commit history, and anything
worth keeping beyond that belongs in `CLAUDE.md`, a rule, or a decision record — not here.
