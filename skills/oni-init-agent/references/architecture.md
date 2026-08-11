# Stack and architecture selection

Used in Phase 2. Everything here is a starting point for a conversation, not a menu to read
aloud. Run each candidate through `feasibility.md` first.

## The order that matters

Constraints → stack → pattern → conventions. Never start from the pattern; a clean
architecture imposed on a 200-line script is a cost with no return.

## Existing project

The stack is already chosen. Do not relitigate it. Your job is to **read the conventions that
are already there** and write them down, because they are currently only in the maintainer's
head and are exactly what a fresh session gets wrong.

Extract by reading, not by asking:

- Directory layout and what each top-level folder means
- Naming conventions actually in use (not the ones the linter would prefer)
- How errors are handled — exceptions, result types, error middleware
- How state moves — the data flow the codebase actually commits to
- Test layout, naming, and what "run the tests" means
- The boundaries someone clearly intended: what never imports what

Ask the user only about intent you cannot read off the code: what they regret, what is
half-migrated, which directories are legacy and should not be extended, what a new contributor
always gets wrong.

That last question is the highest-value one in the whole interview. Its answer becomes rules.

## Greenfield: choosing a stack

Drive from the constraints collected in Phase 1.

- **Team knowledge beats theoretical fit.** A stack nobody knows costs more than it saves.
- **Deployment target eliminates more options than preference does.** Establish it first.
- **Boring is a feature** for anything that must be maintained. Novelty is a feature for
  prototypes and learning projects. Ask which one this is.
- **One language beats two** unless there is a real reason for a split. In a repo that already
  has the split, this is not advice — run this phase per area and settle the boundary between
  them instead. See `monorepo.md`.

Present 2–3 options. For each: one line on what it is good at, one line on what it costs here.
Then recommend one, with the reason. Do not present a neutral survey — the user asked for a
suggestion.

## Greenfield: choosing a pattern

Pick by the axis that actually differentiates, then say so.

| If the project is… | Pattern | Why |
| --- | --- | --- |
| A CLI or script | Flat modules, single entry point | Layering has nothing to layer |
| A library | Public surface in one file, internals private | The API boundary is the whole design |
| A CRUD web app | Feature/vertical slices | Change arrives per-feature, not per-layer |
| Domain-heavy (rules, money, workflow) | Domain core + adapters (hexagonal) | Keeps the rules testable without infra |
| Data/ETL | Pipeline stages, pure transforms | Testability and restartability |
| Real-time / event-driven | Event bus + handlers | Decouples producers from consumers |
| A UI app | Components + a state boundary | The state boundary is the thing to get right |

Two decisions worth making explicit, whatever the pattern, because they cause the most
churn later:

- **Where does I/O live?** Pushing it to the edges is what makes the core testable.
- **What is the module boundary rule?** "Features never import each other" or "adapters may
  import domain, never the reverse". This is the rule you will write into
  `.claude/rules/architecture.md`, and it is the one that prevents the most damage.

## What comes out of this phase

You must be able to write, concretely:

1. Language, runtime version, package manager
2. The framework/library choices that shape the code
3. The pattern, in one sentence
4. The directory layout, with a purpose per folder
5. The module boundary rule
6. Test framework and how tests are run
7. Lint/format tooling and the exact commands

If any of these is still vague, ask. These become `CLAUDE.md` and
`.claude/rules/architecture.md` verbatim, and vagueness there propagates into every session
that follows.
