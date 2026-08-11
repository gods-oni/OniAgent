---
name: oni-init-agent
description: Set up (or upgrade) the Claude Code configuration for a project — interviews the user about what they're building, proposes a stack, architecture pattern, MCP servers and memory strategy after checking feasibility, then generates CLAUDE.md, .claude/rules/, skills, subagents and settings. Use when the user runs /oni-init-agent, or asks to "set up Claude for this project", "bootstrap the agent config", "configure .claude/", or "make a CLAUDE.md and rules for this repo".
---

# Oni Init Agent

Turn a project into one that any fresh Claude Code session can pick up cold: it knows the
stack, the architecture, the conventions, where to start, and what it is allowed to do.

You produce **agent configuration only** — `CLAUDE.md`, `.claude/**`, `.mcp.json`. You do not
scaffold application source code, install dependencies, or run package managers. If the user
wants the app itself built, that is a separate request; say so and finish this one first.

## Hard rules

1. **Never guess. Ask.** If a decision would change what you write and you cannot settle it
   from the repo, ask the user. This overrides any instinct to keep moving.
2. **Never ask what you can detect.** Read the repo first. Asking "what language is this?"
   in a repo with a `pyproject.toml` wastes the user's turn and reads as careless.
3. **Feasibility gates every suggestion.** Do not recommend a tool, MCP server, library or
   pattern until you have checked it is real, current, and fits this project's runtime,
   platform and scale. See `references/feasibility.md`. A suggestion you have not checked
   is a liability, not a service.
4. **Propose before writing.** Render the full file plan for approval. Write nothing to
   `CLAUDE.md` or `.claude/**` until the user approves.
5. **Never silently overwrite.** If a file exists, read it, and present a merge — not a
   replacement — in the proposal.

## Phase 0 — Ground truth (no questions yet)

Before the first question, establish what is already true. Run these in parallel:

- **Repo shape** — single project, workspace monorepo, or poly-root. Check for workspace
  markers (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `go.work`, `[workspace]` in
  `Cargo.toml`, `<modules>` in `pom.xml`, …) and for manifests below the root that no
  workspace file references. Determine this **first**: it decides the layout, and the layout
  decides everything after it. If it is not `single`, load `references/monorepo.md` now.
- **CI config** — `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`.
  Read these next. They are the highest-quality evidence in the repo about how the project
  is actually built, tested and linted, because they have to work on a clean machine.
- **Task runner** — `Makefile`, `Justfile`, `Taskfile.yml`, `package.json` scripts
- **Lockfiles and manifests** — the lockfile decides the package manager; the manifest names
  the test runner, linter and formatter
- **Existing agent config** — `CLAUDE.md`, `.claude/**`, `.mcp.json`, `AGENTS.md`, `.cursor/rules/`
- **Shape** — top-level directory listing, `README*`, test directories
- **History** — `git log --oneline -20` and `git remote -v` if this is a repo

Load `references/ecosystems.md` for the evidence hierarchy and the detection tables. Resolve
the full command set here, in Phase 0, before any questions — the commands are detected, never
asked about, and never recalled from memory when the repo can answer. In a multi-project repo,
run that hierarchy **once per area**: two areas may disagree on package manager, test runner
and CI job.

Write down, for yourself: the repo shape; greenfield or existing; detected stack and package
manager per area, with the marker that decided it; the command set with a source for each;
detected conventions; what agent config already exists. Everything you detect is a question you
no longer ask.

If any agent config already exists, load `references/existing-config.md` before writing
anything. Three checks there decide the rest of the run, and each is easy to get wrong from
file size alone: whether the existing content is actually *about this project* (tool
boilerplate is not), whether any of it is a **tool-managed region** that a generator will
overwrite, and whether `.claude/` and `CLAUDE.md` are **gitignored** — which invalidates
several things later phases would otherwise promise.

## Phase 1 — Intent

Ask the user what they are building and what "done" looks like. This is the one thing the
repo cannot tell you, and every later decision depends on it. Use prose questions here, not
multiple choice — you are collecting an idea, not a selection.

Cover, in one message:

- What the project does, and for whom
- Whether it is greenfield, an active build, or a rewrite of something existing
- Scale and lifespan: throwaway script, personal tool, team product, production service
- Hard constraints: deployment target, offline requirement, existing systems it must talk to,
  compliance, language the team already knows
- Who else works in the repo (solo vs. team changes how much you write down)
- In a multi-project repo: which packages this person actually works in. Nobody works in all
  of them, and that answer scopes every phase after it.

Do not move on until you can state the project's purpose in one sentence. If you cannot, ask
again.

## Phase 2 — Stack and architecture

Load `references/architecture.md`.

Propose — do not decree. For a greenfield project, offer 2–3 viable stacks with the trade-off
that actually distinguishes them for *this* project, and a recommendation with a reason. For an
existing project, the stack is already decided; propose the *pattern* and conventions instead.

Every option you present must have passed the feasibility gate. State the reason for your
recommendation in one sentence, not a survey.

Use `AskUserQuestion` here — the choices are discrete. Batch related decisions into one call
(max 4 questions per call, 2–4 options each).

In a multi-project repo this phase runs **per area**, plus one pass for what spans them. Do not
force a single pattern across a Python service and a React app; do settle the boundary rule
between them, which matters more than either pattern.

## Phase 3 — MCP servers

Load `references/mcp-catalog.md`.

Check what is already configured — `.mcp.json` in the project, and the user's existing servers —
before suggesting anything. Do not propose a server the user already runs.

Suggest only servers that earn their place for *this* project. Each suggestion needs: what it
gives the agent that it does not already have, what it costs (a daemon? an API key? Docker?),
and whether its prerequisites are actually present on this machine. An MCP server that needs a
service the user does not run is a broken suggestion — flag the dependency explicitly.

Present as a multi-select. Zero selected is a valid, common answer.

## Phase 4 — Memory strategy

Load `references/memory.md`.

Present the options with their real trade-offs and let the user choose. Do not default to
whatever is fashionable or to whatever the user happens to already have installed — a
throwaway tool does not need a knowledge graph.

Whatever they pick, you are responsible for wiring it up in Phase 6, including the conventions
that make it actually get used.

## Phase 5 — Operating surface

Now derive what this specific architecture needs in order to be operated well. Load
`references/blueprint.md` for the layout and the decision table — or, if the repo shape from
Phase 0 was not `single`, `references/monorepo.md` governs the layout instead and blueprint's
decision table still applies within each package.

**For an existing project, diagnose operability first.** Load `references/operability.md`. A
project that is hard to work in does not need a tidier rule set; it needs its verification path
documented, its implicit invariants extracted, and its subsystems mapped. Judge by whether
someone arriving cold could make a correct change and *know* it was correct — not by file
count. Where the real fix is structural, recommend it as a `Status: Proposed` decision record
and do not touch the code.

Do not generate a fixed set. Derive it:

- **Rules** — a rule exists to stop a mistake that would otherwise recur. For each candidate
  rule, name the mistake. If you cannot, drop it. Prefer `paths:`-scoped rules so they cost
  no context until relevant.
- **Skills** — a skill exists for a multi-step procedure the user will repeat. "Add an
  endpoint", "cut a release", "add a migration". If it happens once, it is not a skill.
- **Subagents** — a subagent exists for work that should run in its own context window:
  broad search, a review pass, a long verification loop.
- **Commands** — a command exists for a shortcut the user will type. Keep these few.
- **Hooks** — a hook exists for something that must happen *deterministically*, regardless of
  what the model decides: format on write, block edits to generated files, run tests on stop.

Confirm the derived surface with the user before rendering the proposal. This is where
scope gets set, so it is worth one explicit round.

## Phase 6 — Propose, then write

Render a proposal containing:

1. **Decisions** — stack, pattern, MCP servers, memory strategy, each with its one-line reason
2. **File plan** — every path you will create or modify, one line each on what it holds
3. **Merges** — for each existing file, what changes and what is preserved
4. **Not doing** — anything you considered and rejected, with the reason. This is as useful
   as the plan itself.

Get explicit approval. Then write, using `templates/` as the starting shape — they are
skeletons to fill with this project's specifics, never to copy verbatim. A template placeholder
left unfilled in the output is a bug.

Size discipline: `CLAUDE.md` stays under 200 lines. Anything longer belongs in a scoped rule
or a skill. Detail that only matters sometimes must not be loaded always.

## Phase 7 — Verify and hand off

**Verify the commands you wrote.** This is not optional, and it is the only check here that
finds real defects. Probe each command in the generated `Commands` table per the Phase 7
section of `references/ecosystems.md` — cheap, non-mutating probes only (`--version`,
`--collect-only`, `cargo check`), never an install or a clean build. You are confirming the
toolchain resolves, not that the suite passes.

Then correct the table from what you learned, and mark any row you could not probe as
unverified in the generated `CLAUDE.md`.

Also confirm:

- Every file in the plan exists and contains project-specific content
- No `{{PLACEHOLDER}}` survived
- `permissions.allow` in `settings.json` matches the verified commands — nothing allowlisted
  that this project does not run, and no install, publish, deploy or migration commands
- If MCP servers were added, tell the user they must restart the session for them to load,
  and name any prerequisite that is not currently running

Report what was written, which commands were verified and which were not, and the single next
action the user should take. An unverified command reported as verified is the worst outcome
this skill can produce — future sessions will trust it.

Then tell the user, in one line, that stating a rule in conversation ("always use pnpm",
"never touch the generated folder") will get recorded to `.claude/rules/user-rules.md` — that
is the `remember-rule` skill, and the generated `CLAUDE.md` instructs future sessions to use it.

## Reference files

Load these on demand, at the phase that needs them — not up front.

| File | Phase | Holds |
| --- | --- | --- |
| `references/feasibility.md` | all | How to check a suggestion before making it |
| `references/ecosystems.md` | 0, 7 | Evidence hierarchy and detection tables for build/test/lint commands |
| `references/monorepo.md` | 0, 5–6 | Repo-shape detection and the layout for multi-project repos |
| `references/existing-config.md` | 0, 6 | Reading config that is already there: substantiality, managed regions, gitignore, merging |
| `references/operability.md` | 5 | Diagnosing a project that is hard to work in, and what to do about it |
| `references/architecture.md` | 2 | Stack and pattern selection, by project shape |
| `references/mcp-catalog.md` | 3 | MCP servers worth suggesting, and their real costs |
| `references/memory.md` | 4 | Memory strategies and how to wire each one up |
| `references/blueprint.md` | 5–6 | The generated `.claude/` layout and what goes where |
| `templates/` | 6 | Skeletons for each generated file |
