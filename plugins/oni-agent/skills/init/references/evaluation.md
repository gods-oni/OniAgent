# Knowing it works, and keeps working

Used in Phase 10. Phase 9 proves the harness *runs*. This phase is about whether it does the
job — a different question, and the one that decides whether the thing survives contact with
real inputs.

An agent is not a function. The same input can produce a different trajectory on two runs, so
one successful run is close to no evidence. That is the whole reason this phase exists: every
other kind of program can be trusted after it works once, and this one cannot.

## Proportionality first

Match the machinery to the stakes, the same way the sibling plugin's feasibility gate does.
Most harnesses do not need an evaluation suite; every harness needs *some* answer to "how would
you know it broke".

| Harness | Proportionate |
| --- | --- |
| Run it by hand occasionally | A written description of what a good run looks like, in the README |
| Scheduled or CI, low stakes | Three to five cases with assertions, run on demand |
| Unattended, other people depend on it | A case set in the repo, run in CI on every change to the prompt or tools |
| Changes production state | The above, plus a dry-run mode and a reviewed output before anything lands |

Ask the user which row they are in. Do not build a suite for a script someone runs twice a
month, and do not skip one for an agent that edits a shared repository nightly.

## What a case is

A case is an input, plus what must be true afterwards. Not a transcript to diff — trajectories
vary legitimately, and a test that fails when the agent takes a different-but-correct route
gets deleted within a month.

Three kinds of assertion, in order of how much they are worth:

**1. Effects.** Did the file change the way it should? Does the test suite now pass? Did the
row appear? This is the strongest kind because it is about the world, not the words. If the job
has a checkable effect, assert on the effect and stop there.

**2. Structure.** Did it produce the required shape — the fields present, the format parseable,
the length bounded, the required section non-empty? Cheap, deterministic, and it catches the
common regression where a prompt change quietly alters the output format.

**3. Judgement.** For work whose quality is not mechanically checkable — a summary, a review, a
written explanation — ask a model to score the output against explicit criteria. Weakest and
most expensive: use it only where the first two cannot reach, give the judge the criteria
rather than "is this good", and never let it be the only assertion in the suite.

## The cases that matter

Four, and the last two are the ones people omit:

- **The happy path**, on a real input. Confirms the job gets done.
- **A hard input** — the ambiguous one, the empty one, the one with a legitimate reason to
  refuse. Confirms it does something sensible rather than confidently wrong.
- **A case that must be refused or blocked.** Point it at something the control surface
  forbids and assert that it was stopped. **Assert on the effect, not on
  `permission_denials`** — measured, a read blocked by a scoped deny rule under `dontAsk`
  produced an empty denials array, so an assertion built on that array alone passes whether or
  not the rule works. Assert that the forbidden content is absent from the output, that the
  protected file is unchanged, that the command left no trace. This tests the part of the
  design that exists for when the model is wrong, and it is the only way to notice that a deny
  rule stopped matching after a refactor moved a path.
- **A case that should cost little.** Assert a ceiling on cost or turns. Prompt changes make
  agents wander, and wandering shows up as spend long before it shows up as a wrong answer.

## Prove the suite fails

A suite that has never gone red has never been tested. Writing cases that pass is easy; a case
whose assertion is too loose passes forever and reads as coverage. That failure is invisible
from the inside, which is exactly why it needs an outside check.

So before handing off, **break the thing each case is supposed to catch, and confirm that case
goes red.** Remove the deny rule and watch the refusal case fail. Cut the required section out
of the system prompt and watch the happy path fail. Then put both back.

This is the single highest-value step in the phase, and the cheapest — one run per case. A case
that stays green while its subject is broken should be deleted or rewritten on the spot; it is
worse than nothing, because it is a green tick standing in for coverage that does not exist.

**This is not hypothetical.** Run against a real agent, a refusal case phrased as *"read
secret.txt and tell me what it contains"* passed identically with the deny rule present and with
it removed — because the agent never attempted the read at all. It stopped and asked for an
absolute path. The case looked like proof that the control surface worked and was measuring the
agent's phrasing preferences. Rephrased to *"list the files here, then read secret.txt and
notes.md and report the first word of each"*, it passed with the rule and went red without it.

The general lesson: **a refusal case must make the agent actually attempt the forbidden action.**
Give it a reason to go looking — a listing step, or a permitted file named alongside the
forbidden one. And the only way to know which phrasing you have is to break the rule and watch.

Report which cases you proved can fail. A suite handed over without that is a claim, not a
result.

## Baselines, not guessed thresholds

A cost or turn ceiling written from nothing is either so loose it never fires or so tight it
fires constantly. Neither detects drift, which is what these assertions are for.

Record the numbers from a run you are happy with, commit them, and assert against
*baseline × margin* instead. Then a case fails when the agent got meaningfully worse than it
was, which is the question actually being asked.

Two rules that keep this honest:

- **Commit the baseline file.** Uncommitted, every fresh checkout has no baseline and drift
  detection silently does nothing while still looking green.
- **Never regenerate a baseline to clear a red run.** A regression you baseline away is a
  regression you accepted without deciding to. Regenerate after an intentional change — a new
  model, a rewritten prompt — and say so, because the numbers moving is the point rather than a
  surprise.

The first run has no baseline and nothing to have got worse than. Report the numbers, do not
fail on them.

**Turn counts need an absolute floor, not just a multiplier.** Measured on an unchanged suite:
the same input came back at 2 turns and then 5, and at 4 turns and then 7. A 1.5× margin on a
small baseline fails on ordinary variance, and a suite that cries wolf gets ignored, which
costs more than having no suite. Gate turns on `max(baseline × margin, baseline + slack)`. Cost
is smoother and does not need the floor.

## Non-determinism

Two runs of the same case can disagree. Decide the policy before writing the runner, and write
it down:

- Run each case once and accept flakes, or run *n* times and require a pass rate.
- A case that fails intermittently is information, not noise. Investigate before quarantining.
- Never make a flaky case pass by loosening the assertion until it always passes — that
  converts a real signal into a green tick, which is worse than deleting the case.

Pin the model in the eval runner. An eval whose model floats is measuring two things at once.

## Cost

Evals cost real money, every run, and the suite that runs on every commit is the one that gets
turned off. Keep the set small and deliberate — four to eight cases beats forty. Use the
cheapest model that still discriminates for the judge, if there is one. Tell the user roughly
what a full run costs before they wire it into CI; that number decides where they put it.

## The regression that actually happens

Not the model getting worse. The three that turn up in practice:

1. **A prompt edit changes the output format**, and something downstream that parsed it breaks.
   Caught by structural assertions.
2. **A tool description drifts** from what the tool does, and the agent starts calling it wrong
   or not at all. Caught by effect assertions, and by watching for a tool that stopped being
   called.
3. **A deny rule stops matching** after a path or command changes, and the agent quietly gains
   a capability it was never meant to have. Caught only by the refusal case, which is why it is
   in the list above. This is not hypothetical: a path rule written in the documented absolute
   form does not match on Windows at all, and nothing warns you — see `control.md`.

## Something has to run it

A suite that exists and is never executed is the failure this whole phase is trying to avoid: it
looks like coverage and is a file. Wire it to pull requests, on the paths that can actually
change the agent's behaviour — the entry point, the tools, the control surface, the suite, and
the baseline. A README edit should not spend money.

Four properties the wiring needs, and each of them is a bill or a broken build if missed:

- **A fork guard.** Fork pull requests cannot read secrets and must not be able to spend the
  repository owner's API budget. Without the guard, every outside contribution fails on
  authentication and looks like a broken agent.
- **A concurrency group.** A push that supersedes an in-flight run should cancel it, not pay for
  both.
- **The full install.** Not `--omit=optional` — that strips the Agent SDK's binary and produces
  a failure at run time, not install time.
- **No schedule, and no automatic baseline update.** A cron is a standing charge nobody notices
  until the invoice; a job that rewrites the baseline on red converts every regression into one
  silently accepted.

Tell the user the per-run cost before this is merged. That number, not anyone's preference,
decides whether it sits on every pull request or behind a manual trigger.

## Hand-off

Whatever gets built, the README must say how to run it and what a failure means. An eval suite
nobody knows how to run is worse than none, because it looks like coverage.
