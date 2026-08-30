<!--
TEMPLATE — emits .claude/skills/maintain-task/SKILL.md in the target project.

Always generated: it reads the memory this run is creating, so it has a job from day one.

Fill:
  {{MEMORY_MAP}}          the actual paths this project has — CLAUDE.md, .claude/rules/,
                          .claude/decisions/, and whatever memory strategy was chosen. List
                          only what exists; a pointer to an empty directory is noise.
  {{VERIFY_COMMAND}}      how a change is proven here
  {{SCOPED_TEST_COMMAND}} running a subset, if the runner supports it

Delete this comment block in the output.
-->

---
name: maintain-task
description: Maintain an existing feature or carry out a change request using what this project has already written down — reads the rules, decisions and conventions first, changes the code consistently with them, then updates that memory so the next session inherits what this one learned. Use when the user runs /maintain-task, or asks to "change how X works", "fix this feature", "handle this change request", "update the behaviour of", or describes a modification to something that already exists.
argument-hint: "[the feature, and what should change]"
---

# Maintain task

For changing something that already exists. The difference between this and writing it fresh is
that **the decisions have already been made**, and most of them are written down. Finding them
first is the whole job; the edit is usually small.

The failure this exists to prevent: a change that is locally sensible and inconsistent with the
project — a second way of doing something that already had a way. That is how a codebase stops
having conventions, and it happens one reasonable-looking change at a time.

## Phase 1 — Read the memory first

Before opening the feature's code, read what the project has recorded about itself:

{{MEMORY_MAP}}

Read for three things specifically:

- **The convention that governs this area.** How things of this kind are built here.
- **A decision that already covers it.** Whether this ground was settled, and why.
- **What is off-limits.** Generated files, legacy directories not to extend, the boundary that
  must not be crossed.

If a task is open in `TASK.md`, read it too — this change may be inside work already in flight.

## Phase 2 — Locate the feature, and its blast radius

Find the actual code. Then find **what depends on it**, before deciding what the change is:
callers, tests, configuration, documentation, and anything that reads its output format.

Establish the shape the feature currently follows and whether it matches the convention from
Phase 1. Three cases, and they lead somewhere different:

| | |
| --- | --- |
| Follows the convention | Change it the same way. This is the common case. |
| Predates the convention | Say so. Ask whether to migrate it as part of this change or leave it and note the exception — do not migrate silently, because that turns a small change into a large diff nobody asked to review. |
| Contradicts a decision record | **Stop and surface it.** The request may be fine and the decision stale, or the decision may still hold and the request be based on something out of date. That is the user's call, not yours. |

That last row is the one that matters most. A change request that quietly overturns a recorded
decision leaves the record lying, and the next session trusts the record.

## Phase 3 — Change it

Follow what is written down, not what you would do. Where the recorded convention and your
instinct disagree, the record wins — or you raise it, and it gets changed deliberately.

Keep the change proportionate to the request. A maintenance change is not an invitation to
refactor the surroundings; if you find something that should be fixed, note it rather than
folding it in.

Verify with `{{VERIFY_COMMAND}}`. Where the runner supports scoping, run the affected tests
first with `{{SCOPED_TEST_COMMAND}}`, then the full command once before reporting done.

## Phase 4 — Update the memory

**This phase is why the skill exists.** A maintenance change that leaves no trace means the next
session starts from where this one started, and the project's memory drifts further from the
code with every change.

Write back whatever is now true and was not before:

| What you found | Where it goes |
| --- | --- |
| A convention that was real but unwritten | `.claude/rules/`, `paths:`-scoped if it applies to a subtree |
| A decision made during this change, and why | `.claude/decisions/` |
| Something that must now hold *every* time | A hook — an instruction will not enforce it |
| A stale rule or decision this change invalidated | Correct it, and say what changed |
| A fact about the stack, layout, or commands | `CLAUDE.md` |
| Something only relevant to work in flight | `TASK.md` |

Correcting a stale record is as valuable as adding one, and easier to skip. A rule that no
longer matches the code is worse than a missing rule, because it will be followed.

## Reporting

What changed, what proved it, and — separately — **what was written back to memory**. If nothing
was written back, say so and why; it is a legitimate outcome for a small change, and stating it
is how the user can tell the difference between "nothing to record" and "forgot to record".

If a conflict with a decision record was surfaced and is still unresolved, that goes at the top,
not at the end.
