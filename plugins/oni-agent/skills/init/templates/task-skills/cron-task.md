<!--
TEMPLATE — emits .claude/skills/cron-task/SKILL.md in the target project.

Generate this ONLY when routines are actually reachable from this machine. The preconditions are
in the skill body and they are hard: a claude.ai subscription login, no API-key env vars, and a
GitHub repo. Emitting a command that fails at the last step is worse than not emitting it.

Fill:
  {{REPO}}                 owner/name of the repository routines will clone
  {{EFFORT_SKILL}}         the committed skill whose frontmatter carries the effort level the
                           routine should run at — this is the ONLY way to set effort for a
                           routine, since the routine form has a model selector and no effort
                           selector. Usually one of the other generated task skills.

`effort: xhigh` is deliberate: everything expensive about a routine is decided during the
interview, and a routine written from a thin interview runs badly on a schedule forever.

Delete this comment block in the output.
-->

---
name: cron-task
description: Turn a recurring job into a routine that runs on Claude Code's cloud infrastructure — interviews you properly, writes a self-contained instruction, chooses the model and effort, creates the routine, and verifies it by running it once. Use when the user runs /cron-task, or asks to "run this every night", "schedule this", "do this weekly", "set up a routine", or describes work that should happen without them starting it.
argument-hint: "[what should happen, and how often]"
effort: xhigh
---

# Cron task

A routine is a saved prompt plus repositories, an environment, connectors, and triggers, run on
Anthropic-managed cloud infrastructure. It keeps working with your laptop closed, and it runs
**autonomously — there is no permission prompt and nobody to answer a question mid-run.**

That last fact governs everything below. A routine is not an interactive session on a timer; it
is a program written in prose, and it gets exactly one chance per firing.

## Phase 0 — Preconditions, before asking anything

Check these first. Discovering one at the end wastes the whole interview:

- **A claude.ai subscription login.** Routines do not work with a Console API key, an Anthropic
  profile or federation credential, or a cloud-provider login.
- **`ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` unset in the shell**, and no `apiKeyHelper`
  in settings. Each takes precedence over the claude.ai login and hides `/schedule` entirely —
  the command does not error, it stops existing.
- **A GitHub repository** — `{{REPO}}`. Every run clones it from the default branch.
- Not inside a Claude Code on the web session, and routines not disabled by an org policy.

Name the specific blocker if one is present. "Routines are unavailable" is not actionable;
"`ANTHROPIC_API_KEY` is set in this shell, which hides `/schedule`" is.

## Phase 1 — Interview

Ask properly. The prompt has to carry the entire job, so anything left implicit here becomes a
silent failure at 3am. Cover all of it:

- **What must be true after a run** — the outcome, not the activity. "Stale branches deleted",
  not "check the branches".
- **Cadence, and why that cadence.** Minimum interval is one hour. If the answer is "whenever X
  happens", it wants a GitHub or API trigger, not a schedule.
- **What it reads** — the repo, an external service through a connector, or text sent with the
  firing.
- **What it may change.** Open a pull request, push to a branch, comment only, or write nothing
  and report? Be exact: a routine acts under the user's own GitHub identity, so its commits and
  PRs are theirs.
- **What it does when there is nothing to do.** The most-skipped question and the reason most
  routines get muted. "Post nothing" is usually the right answer, and it has to be written down
  because the default is to write a report about having found nothing.
- **What it does when it fails** — stop and leave a trace, or attempt a fallback.
- **Which connectors it genuinely needs.** All connected ones are included by default, and
  within a run every tool from an included connector is usable **including writes, without
  approval**. Remove the rest.

## Phase 2 — Write the instruction

The prompt is the routine. Write it self-contained: no reference to this conversation, no "as we
discussed", no question for the user.

It must state the objective, the exact steps, what done looks like, what to do when there is
nothing to do, and what to do on failure. Prefer naming a committed skill for the method —
`{{EFFORT_SKILL}}` — over restating the method inline, so the routine improves when the repo
does.

If the routine will be fired by API, the prompt must **explicitly reference the
`<routine-fire-payload>` block**. Text sent with a firing arrives wrapped and labelled as
untrusted data, and a prompt that does not opt into reading it treats that text as inert
context. Anyone holding the bearer token can send it, so this wrapper is deliberate — do not
write the prompt as if the payload were an instruction.

## Phase 3 — Model and effort

**Model** is set on the routine, and the selected model is used on every run. Choose it from the
work, not from habit: a routine that reads diffs and writes a summary is not the same job as one
that changes code and opens a PR.

**Effort has no field on the routine.** The form has a model selector and nothing for effort. The
only way to control it is a **skill committed in the cloned repository** whose frontmatter sets
`effort`, invoked by name from the routine's prompt — a routine session can run skills committed
to the repo it clones. That is why `{{EFFORT_SKILL}}` exists and why the prompt should name it.

Say both choices and the reason for each, before creating anything.

## Phase 4 — Create it

Use `/schedule`, which walks the same fields conversationally and saves to the claude.ai account.
Confirm with the user before it is created: routines draw down a **daily run cap** and the
account's usage, and they act under the user's identity.

`/schedule` creates scheduled routines. API triggers are added from the web afterwards. A custom
cron interval is set with `/schedule update` after picking the nearest preset.

## Phase 5 — Verify by running it

Run it once — **Run now**, or `/schedule run` — and open the run.

**A green status does not mean the task succeeded.** It means the session started and exited
without an infrastructure error. Blocked network requests, missing connector tools, and the
routine doing nothing useful all show green. Read the transcript and confirm what actually
happened.

Two things to check specifically, because they are the common first-run failures:

- **Network.** The default environment allows only a fixed allowlist. A request to anything else
  fails with `403` and `x-deny-reason: host_not_allowed`. Connector traffic does not go through
  that path and is unaffected.
- **Branch pushes.** Branches prefixed `claude/` are always accepted. A push anywhere else is
  rejected if the branch is protected, has someone else's open PR, or carries commits by another
  author.

Then report: what was created, the model and effort and why, when it next fires, and what the
verification run actually did.

## Afterwards

`/schedule list` shows routines, `/schedule update` changes one, and asking about a routine's
history — "why did my nightly review do nothing this morning?" — reads the recent runs and
explains what happened, including tool errors and permission denials.
