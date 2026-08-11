---
name: oni-agent-improve
description: Audit an existing Claude Code setup and propose non-breaking improvements — trims context cost, fixes stale commands and dead path globs, repairs skill descriptions that never match, finds contradictions, and flags instructions that should be hooks. Use when the user runs /oni-agent-improve, or asks to "improve the agent config", "audit my CLAUDE.md", "why isn't Claude following my rules", "make the setup faster", or "clean up .claude/".
---

# Improve an existing setup

Audit what is already there and propose improvements that make sessions work better **without
changing how the project behaves**. Every finding carries an argument for why applying it
preserves current behaviour.

Argument: an optional focus. `/oni-agent-improve` audits everything. `/oni-agent-improve context`
narrows to one concern; `/oni-agent-improve src/Services` narrows to one path. Match a focus
word to the finding categories below; treat anything path-shaped as a scope filter.

If there is no `CLAUDE.md` and no `.claude/`, there is nothing to improve — say so and point at
`/oni-init-agent` instead. Do not silently bootstrap.

## The rule that governs this skill

**Preserve behaviour.** The user has a setup that works. They are asking for it to work
*better*, not differently.

Every proposed change is one of:

- **Safe** — provably preserves current behaviour. Moving an unscoped rule to a `paths:`-scoped
  file that matches everything it applied to. Deleting a directory that is empty. Fixing a
  command that does not resolve. Default: propose for approval.
- **Behaviour-changing** — narrows a rule's scope, drops an instruction, adds a hook, changes a
  permission. May well be correct, but the user must decide. Label it clearly and never bundle
  it with safe changes.

Never apply anything without approval, and approve findings **individually** — the user takes
some and skips others. A batch approval prompt for fifteen changes gets a reflexive yes, and
that is not consent.

## Phase A — Inventory and measure

Read the whole setup before judging any of it: `CLAUDE.md`, `.claude/rules/**`,
`.claude/skills/**`, `.claude/agents/**`, `.claude/commands/**`, `.claude/settings*.json`,
`.mcp.json`, and any nested `CLAUDE.md` files.

Measure, do not estimate. Line counts per file; how many rules load unconditionally; how many
`paths:` globs there are; the total always-loaded footprint.

Load `../oni-init-agent/references/existing-config.md`: the checks there for **tool-managed
regions** and **gitignored config** apply here too. Never propose a change inside a generator's
fenced region — it will be overwritten and the user will not know why.

## Phase B — Findings

Check each category. Verify before reporting: a claim you did not confirm will be acted on.

**Stale references** — the highest-yield category, and fully checkable. Commands that no longer
resolve. `paths:` globs matching zero files. Rules citing deleted files. Skills naming commands
the project no longer has. `permissions.allow` entries for tools not installed.

Before calling a glob dead, consider that it may target files not written yet. Ask rather than
delete when a rule looks aspirational.

**Context cost** — `CLAUDE.md` over 200 lines. Unscoped rules that apply to one directory.
Content duplicated between `CLAUDE.md` and a rule. Detail loaded every session that matters
occasionally. Each of these is paid for in every conversation, forever.

The fix is almost always *relocation*, not deletion: move it to a `paths:`-scoped rule or a
skill. Relocation is safe; deletion is behaviour-changing. Do not conflate them.

**Retrieval failures** — a skill's `description` is its entire trigger mechanism. If it reads
like a tidy summary rather than the words a user would actually type, it will not fire. Rewrite
descriptions to include real trigger phrasings. Cheap fix, large effect, and invisible until
someone checks.

**Contradictions** — two instructions that cannot both be followed. Claude picks one
arbitrarily, so the user experiences it as random non-compliance. Report both locations and let
the user resolve; never pick a winner yourself.

**Enforcement gaps** — instructions phrased as absolutes ("always run the formatter", "never
commit without tests") sitting in `CLAUDE.md`. Instructions are context, not enforcement: they
are followed most of the time, which for an absolute is the same as failing. Propose a hook.
This is behaviour-changing — a hook that fires on every matching tool call is a real change —
so label it and verify the command runs on this machine first.

**Coverage gaps** — score the setup against the six cold-start questions in
`../oni-init-agent/references/blueprint.md`. Report the count.

**Dead weight** — empty directories, subagents never referenced, rules whose stated purpose no
longer exists, commands duplicating a skill.

**Permission friction** — routine project commands not in `permissions.allow`. Each one is a
prompt the user answers repeatedly. Derive from the verified commands table; never allowlist
install, publish, deploy or migration commands.

If the project itself is hard to operate — no verification path, undocumented invariants, no
answer to "where do I add X" — that is `../oni-init-agent/references/operability.md`, not this list. Those are
findings about the *project*; this skill's findings are about the *setup*. Report them
separately so the user can tell which is which.

## Phase C — Report

Rank by sessions-improved per unit of effort. Lead with what is broken, then what is expensive,
then what is untidy. Untidy is last and is usually not worth doing.

Per finding: what, where (`file:line`), the evidence, the proposed change, **safe or
behaviour-changing**, and what applying it preserves.

State the measured before/after for anything about context cost — "CLAUDE.md 340 → 120 lines,
220 lines moved to three scoped rules that load only when their files are touched" is a real
claim. "Reduces context" is not.

Report honestly when there is little to find. A setup in good shape is a valid outcome, and
padding the list to look thorough trains the user to ignore it.

## Phase D — Apply

Only on per-finding approval. Then:

- Re-read each file before editing it; do not work from Phase A's snapshot.
- Preserve wording that already works. Rewriting a correct instruction into your own phrasing
  is churn that costs review attention and buys nothing.
- Preserve ordering. Reordering makes the real changes unreviewable.
- When relocating content into a scoped rule, verify the `paths:` globs actually match the files
  the content applied to before. This is the step that turns a safe change into a silent
  behaviour change — an over-narrow glob means the rule stops loading where it used to.
- Re-probe any command you touched.

Report what was applied, what was skipped, and anything the user should verify themselves. If a
change requires a session restart to take effect — MCP servers, some settings — say so.
