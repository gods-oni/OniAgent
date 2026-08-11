# Oni Agent

A Claude Code plugin that sets up, and then improves, the Claude Code configuration of other
projects.

Run `/oni-init-agent` inside any project. It interviews you about what you are building,
proposes a stack, architecture pattern, MCP servers and memory strategy — each checked for
feasibility first — and then generates a `.claude/` setup tailored to the answers.

It writes **agent configuration only**: `CLAUDE.md`, `.claude/rules/`, skills, subagents,
`.mcp.json`, settings. It does not scaffold application code or install dependencies.

## Install

```bash
claude plugin marketplace add d:/InitialAgent
claude plugin install oni-agent@gods-oni
```

Then, from any project:

```
/oni-init-agent
```

If the name collides with something else, the namespaced form
`/oni-agent:oni-init-agent` always resolves.

## What it does

| Phase | |
| --- | --- |
| 0 | Classifies the repo shape, then reads it — CI config first, then task runners, lockfiles, layout, git history, existing config. Resolves the full command set before asking anything. |
| 1 | Asks what you are building, for whom, at what scale, under what constraints. |
| 2 | Proposes stack and architecture pattern, with a recommendation and a reason. |
| 3 | Suggests MCP servers that earn their place, with their real prerequisites. |
| 4 | Presents memory strategies and wires up the one you pick. |
| 5 | Derives the rules, skills, subagents, commands and hooks the architecture actually needs. |
| 6 | Renders the full file plan for approval, then writes. |
| 7 | Probes every generated command to confirm it resolves, corrects the table, then hands off. |

Nothing is written before step 6, and nothing existing is overwritten without being shown to
you as a merge.

## What it generates

```
<project>/
├── CLAUDE.md                    # entry point, under 200 lines
├── .mcp.json                    # only if servers were chosen
└── .claude/
    ├── README.md                # the map a cold session reads
    ├── settings.json            # permissions, hooks, env
    ├── rules/                   # user-rules.md + architecture.md + paths-scoped topics
    ├── skills/                  # repeatable procedures
    ├── agents/                  # subagents with their own context window
    ├── commands/                # typed shortcuts
    └── decisions/               # ADRs: why, not what
```

Only the parts a given project earns. A throwaway script gets a `CLAUDE.md` and little else.

**Monorepos and polyglot repos** take a different layout: a thin root `CLAUDE.md` holding the
package map and the dependency boundaries, per-package `CLAUDE.md` files that load on demand
when a session reads files in that package, and `paths:`-scoped rules for policy that spans
packages. Phase 0 detects the shape — workspace tool, poly-root, or single — and branches.

The design target is a **cold-start test**: a fresh session with only the repo should be able
to answer what the project is, what pattern it follows, where to add the most common unit of
work, what it must never do, how to run things, and what was already decided and why.

## Hard-to-operate projects

Operability is not size — a 60-file project can be far harder to work in than a 6,000-file one.
For existing projects, Phase 5 diagnoses it from evidence rather than impression: is there a
verification path at all, are there implicit invariants recorded nowhere, does churn ranking
show where the design is under pressure, does "where do I add X" have an answer.

Config-level fixes it writes itself — a subsystem map, an `invariants.md`, a documented
verification ritual, unit-of-work skills. Where the real fix is structural, it records a
`Status: Proposed` decision record and stops. It never edits code: you asked for agent
configuration, and in a project without tests an unrequested refactor cannot be proven to
preserve behaviour.

## `/oni-agent-improve [focus]`

Audits an existing setup and proposes improvements that make sessions work better **without
changing how the project behaves**.

```
/oni-agent-improve                 # everything
/oni-agent-improve context         # one concern
/oni-agent-improve src/Services    # one path
```

Finds stale commands and `paths:` globs matching zero files, content that costs context every
session but matters occasionally, skill descriptions written as summaries rather than as the
words a user would type (so they never fire), contradictory rules, and absolutes sitting in
`CLAUDE.md` that should be hooks.

Every finding is labelled **safe** (provably preserves behaviour) or **behaviour-changing**, and
approved individually — a batch prompt for fifteen changes gets a reflexive yes, which is not
consent. Context claims are measured: "340 → 120 lines, 220 moved to three scoped rules" rather
than "reduces context".

## The third skill: `remember-rule`

Installed alongside. When you state a durable rule in conversation — "always use pnpm",
"never touch `generated/`" — it gets recorded to `.claude/rules/user-rules.md` with its
rationale and date, instead of dying with the session. It also routes file-specific rules to
`paths:`-scoped rule files, and tells you when what you actually want is a hook rather than
an instruction.

Generated `CLAUDE.md` files carry an instruction pointing future sessions at it.

## Design notes

Three things this plugin takes a position on:

**Feasibility before suggestion.** Every recommendation passes a four-check gate — does it
exist in the form I remember, does it run on this machine and target, is it proportionate to
the project, can the user actually operate it. The MCP ecosystem in particular moves faster
than any training cutoff, so `references/mcp-catalog.md` is deliberately a map of categories
to verify rather than a registry to recite.

**Instructions are not enforcement.** `CLAUDE.md` and rules are context; Claude follows them
most of the time. Anything that must happen every time is generated as a hook in
`settings.json`. Treating those as interchangeable is the most common way these configs
quietly fail.

**Workflows are skills.** Claude Code has no `workflows` primitive. Multi-step procedures are
generated as skills, which is the real mechanism, rather than into a directory nothing reads.

## Layout

```
skills/
├── oni-init-agent/
│   ├── SKILL.md          # the orchestrator: 8 phases, hard rules
│   ├── references/       # loaded on demand, per phase
│   │   ├── feasibility.md
│   │   ├── ecosystems.md
│   │   ├── monorepo.md
│   │   ├── existing-config.md
│   │   ├── operability.md
│   │   ├── architecture.md
│   │   ├── mcp-catalog.md
│   │   ├── memory.md
│   │   └── blueprint.md
│   └── templates/        # skeletons to fill, never to copy verbatim
├── oni-agent-improve/
│   └── SKILL.md          # audit an existing setup, non-breaking proposals
└── remember-rule/
    └── SKILL.md
```

## Extending it

Add a reference file when a phase needs judgement that does not fit in `SKILL.md`, and add a
row to the reference table at the bottom of `SKILL.md` so it gets loaded. Add a template when
the generator repeatedly produces the same file shape. Keep `SKILL.md` itself short — it is
loaded in full on every invocation, and the reference files are not.

## License

MIT
