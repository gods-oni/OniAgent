---
name: init
description: Set up (or upgrade) a project so any fresh Claude Code session can pick it up cold — reads the repo's architecture, conventions and commit history, interviews you about what is missing, then generates CLAUDE.md, rules, settings and a set of task commands (/task, /graph-task, /loop-task, /cron-task, /maintain-task), and scaffolds a standalone agent program when the job actually needs one. Use when the user runs /oni-agent:init, or asks to "set up Claude for this project", "bootstrap the agent config", "configure .claude/", "make a CLAUDE.md and rules for this repo", "build an agent for this", or "add the task commands".
---

# Init

Turn a project into one that any fresh session can pick up cold: it knows the stack, the
architecture, the conventions, where to start, what it is allowed to do — and it has a task
surface to do the work through.

Two tracks. **Track A always runs**: read the repo, configure it, generate its task commands.
**Track B runs only when the work needs a program that lives outside Claude Code** — Phase 7
decides, and most projects stop before it.

## Hard rules

1. **Never guess. Ask.** If a decision changes what you write and the repo cannot settle it, ask
   the user. This overrides any instinct to keep moving.
2. **Never ask what you can detect.** Read the repo first. Asking "what language is this?" in a
   repo with a `pyproject.toml` wastes the user's turn and reads as careless.
3. **Feasibility gates every suggestion.** Do not name a tool, MCP server, library, package or
   pattern until you have checked it is real, current, and fits this project's runtime and
   scale. `references/feasibility.md`. An unchecked suggestion is a liability, not a service.
4. **Propose before writing.** Render the full file plan for approval. Write nothing to
   `CLAUDE.md`, `.claude/**` or the project's source until the user approves.
5. **Never silently overwrite.** If a file exists, read it, and present a merge — not a
   replacement.
6. **Track B: read the installed types before writing any SDK call.** Install first, then write
   from the package's own type declarations. `references/sdk-surface.md` records three verified
   cases where the published docs disagreed with them, two of which do not compile. A
   `PostToolUse` hook shipped with this plugin checks it; if the hook blocks you, it is right.
7. **Track B: ship it running.** A generated program that has never executed is not delivered.

## Phase 0 — Ground truth (no questions yet)

Establish what is already true. Run in parallel:

- **Repo shape** — single project, workspace monorepo, or poly-root. Check workspace markers
  (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `go.work`, `[workspace]`, `<modules>`) and
  manifests below the root that no workspace file references. Determine this **first**: it
  decides the layout, and the layout decides everything after. If it is not `single`, load
  `references/monorepo.md` now.
- **CI config** — `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`. The
  highest-quality evidence in the repo about how the project is really built and tested, because
  it has to work on a clean machine.
- **Task runner** — `Makefile`, `Justfile`, `Taskfile.yml`, `package.json` scripts.
- **Lockfiles and manifests** — the lockfile decides the package manager; the manifest names the
  test runner, linter and formatter.
- **Existing agent config** — `CLAUDE.md`, `.claude/**`, `.mcp.json`, `AGENTS.md`,
  `.cursor/rules/`.
- **Shape and history** — top-level listing, `README*`, test directories, `git log --oneline -20`,
  `git remote -v`.
- **Routine preconditions**, cheaply, because Phase 6 needs them: is `ANTHROPIC_API_KEY` or
  `ANTHROPIC_AUTH_TOKEN` set in this shell, and is there a GitHub remote?

Load `references/ecosystems.md` for the evidence hierarchy and detection tables. Resolve the full
command set **here** — commands are detected, never asked about, and never recalled from memory
when the repo can answer. In a multi-project repo, run that hierarchy once per area.

If any agent config already exists, load `references/existing-config.md` before writing anything.
Three checks there decide the rest of the run and each is easy to get wrong from file size
alone.

Write down for yourself: repo shape; greenfield or existing; stack and package manager per area
with the marker that decided it; the command set with a source for each; what agent config
exists; whether routines are reachable. Everything detected is a question you no longer ask.

## Phase 1 — Intent

Ask what they are building and what "done" looks like. This is the one thing the repo cannot
tell you. Prose questions, not multiple choice — you are collecting an idea, not a selection.

Cover, in one message: what the project does and for whom; greenfield, active build, or rewrite;
scale and lifespan; hard constraints (deployment target, offline, systems it must talk to,
compliance, languages the team knows); who else works in the repo.

Do not move on until you can state the project's purpose in one sentence.

## Phase 2 — Conventions (existing code only)

Skip for a greenfield repo — there are no conventions to find, only decisions to make.

Load `references/conventions.md`. The job is to write down what is currently only in the
maintainer's head, which is exactly what a fresh session gets wrong.

Three things come out of this phase:

- **The architecture and coding standard, read from the code** — layout, naming actually in use,
  error handling, how state moves, test layout, what never imports what.
- **Repeated structure across features.** The highest-value signal and the most easily misread:
  a shape shared by several features is either a convention to enforce or duplicated debt the
  team wants to escape, and you cannot tell which by reading. **Ask per shape, showing the
  files.** Writing debt down as a rule makes the agent enforce it forever.
- **The commit convention, derived from `git log`** — subject shape, prefix vocabulary with real
  counts, body, trailers. Show the derived rule next to five real subject lines and confirm it.
  **Never generate a rule that adds a machine-attribution trailer**, even if the history has
  them.

Anything the linter already enforces is not a rule. Read the lint and format config first.

## Phase 3 — Stack and architecture

Load `references/architecture.md`. Propose, do not decree.

Greenfield: 2–3 viable stacks with the trade-off that actually distinguishes them *here*, and a
recommendation with a reason. Existing: the stack is decided — do not relitigate it; propose the
pattern and conventions instead, informed by Phase 2.

Use `AskUserQuestion`; the choices are discrete. In a multi-project repo this runs per area, plus
one pass for what spans them — the boundary rule between areas matters more than either pattern.

## Phase 4 — MCP servers and memory

Load `references/mcp-catalog.md`, then `references/memory.md`.

Check what is already configured before suggesting anything. Each MCP suggestion needs: what it
gives the agent that it does not already have, what it costs, and whether its prerequisites are
present on this machine. Present as a multi-select; zero selected is a valid, common answer.

For memory, present the real trade-offs and let the user choose. A throwaway tool does not need a
knowledge graph. Whatever they pick, you wire it up in Phase 8.

## Phase 5 — Operating surface

Load `references/blueprint.md` — or `references/monorepo.md` if the shape is not `single`. For an
existing project, load `references/operability.md` first and diagnose whether the project is hard
to work in before adding to it.

Do not generate a fixed set. Derive it:

- **Rules** — a rule exists to stop a mistake that would otherwise recur. Name the mistake, or
  drop the rule. Prefer `paths:`-scoped so they cost no context until relevant.
- **Skills** — a multi-step procedure the user will repeat. Everything the user types is a
  skill; `.claude/commands/` still works but ignores `name` and `paths` and cannot carry
  supporting files.
- **Subagents** — work that should run in its own context window.
- **Hooks** — anything that must happen *deterministically*, regardless of what the model
  decides.

The row that matters most: **anything that must happen every time is a hook, not an
instruction.** Saying it in `CLAUDE.md` and calling it done is the most common way these configs
quietly fail.

Confirm the derived surface with the user before rendering the proposal.

## Phase 6 — Task surface

Load `references/task-surface.md`.

Five task skills are available to generate: `/task`, `/graph-task`, `/loop-task`, `/cron-task`,
`/maintain-task`. **Do not ship all five by reflex** — each has a precondition, and one that is
missing means the command will mislead someone rather than merely be unused.

The two that are most often wrong to generate: `/loop-task` without a verification signal that
actually runs (the loop then has no success predicate and can only hit its cap), and
`/cron-task` when routines are unreachable from this machine (Phase 0 already checked).

Name what you are skipping and why, in the Phase 8 proposal.

## Phase 7 — Does this need a program? (Track B gate)

Most projects end at Phase 6. Run this phase only when Phase 1 described work that has to happen
**outside a Claude Code session** — unattended on a schedule you host, behind an HTTP endpoint,
inside another program, or on a runtime where Claude Code cannot run.

If so, load `references/substrate.md` and run its gate: can the runtime spawn a subprocess, must
the agent act on a machine, do you need to own the loop, must anything persist between runs. The
gate picks one of four substrates and one of them means generating nothing at all.

Then `references/archetypes.md` for the shape, `references/tool-surface.md` for what it can
reach, `references/control.md` for what stops it, and `references/operations.md` for how it is
observed and when it stops.

## Phase 8 — Propose, then write

Render a proposal containing:

1. **Decisions** — stack, pattern, MCP, memory, operating surface, task skills, and (Track B)
   substrate and shape, each with its one-line reason
2. **File plan** — every path you will create or modify, one line each
3. **Merges** — for each existing file, what changes and what is preserved
4. **Not doing** — what you considered and rejected, with the reason. As useful as the plan.

Get explicit approval. Then write, using `templates/` as starting shapes — `config/` for the
`.claude/` surface, `task-skills/` for the generated commands, `agent-sdk/` for Track B. They are
skeletons to fill, never to copy verbatim, and an unfilled `{{PLACEHOLDER}}` in output is a bug.

`task-guard.mjs` is the exception: it is a script, not a template. Copy it byte for byte.

Size discipline: `CLAUDE.md` stays under 200 lines. Detail that only matters sometimes must not
be loaded always.

## Phase 9 — Verify

**Probe every command you wrote** — cheap, non-mutating checks only (`--version`,
`--collect-only`), never an install or a clean build. Correct the table from what you learn and
mark anything unprobed as unverified in the generated `CLAUDE.md`.

Confirm: every planned file exists and contains project-specific content; no `{{PLACEHOLDER}}`
survived; `permissions.allow` matches the verified commands and allowlists nothing this project
does not run. Start a session and check each generated task skill appears in the `/` menu —
`claude plugin validate` does not cover a project's `.claude/skills/`, so malformed frontmatter
fails silently there.

**Track B: run the program.** Not a type-check — a real run on a small, safe input, reported with
its command, output and exit status. `references/verification.md`.

An unverified command reported as verified is the worst outcome this skill can produce, because
future sessions will trust it.

## Phase 10 — Evals (Track B only)

Load `references/evaluation.md`. Phase 9 proved the program runs; this proves it does the job,
and keeps doing it. Establish the proportionate level, then prove the suite can fail by breaking
what each case is supposed to catch.

## Hand off

Report what was written, which commands were verified and which were not, and the single next
action. Then, in one line: stating a rule in conversation ("always use pnpm", "never touch
`generated/`") gets recorded to `.claude/rules/user-rules.md` — that is `remember-rule`, and the
generated `CLAUDE.md` points future sessions at it.

## Reference files

Load on demand, at the phase that needs them — never up front.

| File | Phase | Holds |
| --- | --- | --- |
| `feasibility.md` | all | How to check a suggestion before making it |
| `ecosystems.md` | 0, 9 | Evidence hierarchy and detection tables for build/test/lint |
| `monorepo.md` | 0, 5 | Repo-shape detection and the multi-project layout |
| `existing-config.md` | 0, 8 | Reading config that is already there, and merging into it |
| `conventions.md` | 2 | Mining an existing repo: architecture, repeated structure, commit rule |
| `architecture.md` | 3 | Stack and pattern selection by project shape |
| `mcp-catalog.md` | 4 | MCP servers worth suggesting, and their real costs |
| `memory.md` | 4 | Memory strategies and how to wire each one up |
| `operability.md` | 5 | Diagnosing a project that is hard to work in |
| `blueprint.md` | 5, 8 | The generated `.claude/` layout and what goes where |
| `task-surface.md` | 6 | Which task skills this project earns, and their preconditions |
| `substrate.md` | 7 | The four agent substrates and the gate that picks one |
| `sdk-surface.md` | 7, 8 | What the Agent SDK provides, and how to verify it |
| `archetypes.md` | 7 | One-shot, interactive, service — and what each pulls |
| `tool-surface.md` | 7 | Built-in vs. Bash vs. custom tool vs. MCP |
| `control.md` | 7 | Permission evaluation order, and enforcement vs. suggestion |
| `operations.md` | 7 | Stopping, failure modes, observability, model and cost |
| `verification.md` | 9 | The cold-start test for a program, and how to prove it runs |
| `evaluation.md` | 10 | How you know it works, and keeps working |

| Template directory | Emits |
| --- | --- |
| `templates/config/` | `CLAUDE.md`, `.claude/` rules, settings, README, decision records |
| `templates/task-skills/` | The generated `/task`-family skills, plus `task-guard.mjs` verbatim |
| `templates/agent-sdk/` | Track B only: the program, its tools, control surface, evals and CI |
