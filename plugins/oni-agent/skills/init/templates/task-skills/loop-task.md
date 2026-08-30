<!--
TEMPLATE — emits .claude/skills/loop-task/SKILL.md in the target project.

Generate this ONLY when the project has a verification signal that actually runs — tests, a
type-check, a linter, a build. Without one the loop has no success predicate and can terminate
only on the iteration cap, which is a timer wearing a loop's clothes. If there is no signal,
do not generate this: say so, and offer adding one as its own piece of work.

Fill:
  {{VERIFY_COMMAND}}     the command whose exit status is the predicate
  {{VERIFY_MEANING}}     what a pass actually proves here, and what it does not
  {{ITERATION_CAP}}      typically 4–8; more than that and the approach is wrong, not the count
  {{FAST_SIGNAL}}        the cheapest partial check, if one exists (a single test file, a
                         type-check) — used inside the loop so the expensive one runs less

Delete this comment block in the output.
-->

---
name: loop-task
description: Carry out one piece of work by looping against a verification signal — agrees the acceptance criteria first, then acts, observes, and revises until the criteria pass or the loop stops for a stated reason. Use when the user runs /loop-task, or asks to "keep going until the tests pass", "fix this until it works", "iterate on this", or describes one problem whose solution is not yet known.
argument-hint: "[what must end up true]"
---

# Loop task

For work whose difficulty is **depth**: one unit, a finish line you can check, and an unknown
number of attempts to get there.

Not for work whose difficulty is order and structure — several units with real dependencies is
`/graph-task`. If the first thing you want to do is draw a dependency graph, you are in the
wrong skill.

## Before the first iteration

**Agree the acceptance criteria, and make them executable.** This is the whole design. A loop
whose goal is "make it better" cannot terminate, so it terminates on the cap and reports
whatever it happened to be holding.

Write down, in the user's words and then as a command:

- The predicate: `{{VERIFY_COMMAND}}` passing. What that actually proves here:
  {{VERIFY_MEANING}} — and what it does not prove, said out loud, so a green run is not
  mistaken for a finished job.
- Anything that must **stay** true: tests that already pass, behaviour not in scope, files not
  to touch. Regression is the usual way a loop "succeeds" while making things worse.
- The iteration cap: {{ITERATION_CAP}}.

If the criteria cannot be expressed as something runnable, stop and say so. Offer to define one
first — that is a real piece of work and doing it converts an unbounded task into a bounded one.

## The loop

Each iteration, in this order:

1. **Act** — one change, aimed at one hypothesis about why the predicate is failing.
2. **Observe** — run `{{FAST_SIGNAL}}` while iterating, `{{VERIFY_COMMAND}}` before claiming
   done. Read the actual output, not the exit code alone.
3. **Reason** — did this confirm or refute the hypothesis? Refuting one is progress; it is the
   only thing that shrinks the search.
4. **Record** — one line: what was tried, what happened, what it ruled out.
5. **Decide** — continue, change approach, or stop.

**Step 4 is not bookkeeping.** The defining failure of a loop is retrying without varying the
strategy: the same fix, reworded, four times, each attempt looking reasonable in isolation
because the context that would have made it look repetitive has scrolled away. The written
record is what makes the repetition visible to you.

If a task is open, this record belongs in `TASK.md` under `Ruled out`, where it survives losing
the session. Otherwise keep it in the response.

**Change approach after two failed attempts on the same hypothesis, not after six.** Two is
enough evidence that the hypothesis is wrong, and the third attempt is almost never the one that
works.

## Stopping

Three ways out, and exactly one of them is success:

| | |
| --- | --- |
| **Success** | The predicate passes and everything that had to stay true still does. Verify both, then stop. |
| **Cap** | {{ITERATION_CAP}} reached. Stop. Report what was tried, what was ruled out, and the single most promising remaining lead. This is a useful outcome, not a failure to hide. |
| **Escalate** | A hard blocker. Stop immediately — do not spend the remaining iterations on it. |

**Recoverable versus hard blocker** decides whether iterating is even sensible:

- **Recoverable** — a failing assertion, a type error, a wrong value, a missing edge case. More
  iterations can fix these.
- **Hard blocker** — a missing credential, a service that is down, an ambiguous requirement, a
  decision that is the user's to make, a dependency that does not exist. **No number of
  iterations fixes any of these.** Recognising one early and escalating is the highest-value
  judgement in this skill; burning the cap on it is the most expensive mistake.

## Context

Long loops fill the window with iterations that no longer matter. Keep forward only what
changes the next decision: the criteria, the current hypothesis, the ruled-out list, and the
last failure output. Everything else — earlier diffs, superseded output, resolved errors — can
go.

If you find yourself re-reading the same file every iteration to remember what it says, write
what matters into the record instead.

## Reporting

Say which way the loop ended, in the first line. Then the iteration count, what the predicate
does and does not prove, and the ruled-out list.

**Never report a cap-stop as success.** The user needs to know the difference between "it
passes" and "it does not pass yet and here is what is left", and only one of those is safe to
build on.
