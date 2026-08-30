<!--
TEMPLATE — root CLAUDE.md for a workspace monorepo or poly-root repo.

Loaded in full at the start of every session, whichever package the work is in. That is the
entire design constraint: target 60 lines, hard ceiling 100.

Per-package detail goes in that package's own CLAUDE.md, which loads on demand when Claude
reads files there. If you find yourself describing one package's conventions here, it is in
the wrong file — and every session working on a different package pays for it.

Delete this comment block in the output.
-->

# {{REPO_NAME}}

{{ONE_SENTENCE_WHAT_THE_WHOLE_REPO_IS}}

**Shape:** {{workspace monorepo via <tool> | poly-root, no workspace tool}}

## Packages

<!-- Every package, one line each. This table is the map; it is why the root file exists.
     "Own CLAUDE.md" marks the ones with local detail worth reading before working there. -->

| Path | What it is | Stack | Own CLAUDE.md |
| --- | --- | --- | --- |
| `{{PATH}}` | {{PURPOSE}} | {{STACK}} | {{yes / no}} |

## Commands

<!-- Root-level only. The targeted form is the one that matters — a session working on one
     package must not run the whole repo's suite to check one change.
     For poly-root there is no fan-out: say so, and give per-area commands with their cwd. -->

| Task | All | One package |
| --- | --- | --- |
| Test | `{{FANOUT_TEST}}` | `{{TARGETED_TEST}}` |
| Lint | `{{FANOUT_LINT}}` | `{{TARGETED_LINT}}` |
| Build | `{{FANOUT_BUILD}}` | `{{TARGETED_BUILD}}` |

Package-local commands live in each package's own `CLAUDE.md`.

## Boundaries

{{THE_ONE_LINE_VERSION_OF_THE_DEPENDENCY_RULE}}

Full graph and the forbidden edges: `.claude/rules/boundaries.md`.

## Working here

- Find the right package in the table above before creating anything. {{WHERE_NEW_X_GOES}}
- Read that package's `CLAUDE.md` before editing in it.
- {{THE_CROSS_CUTTING_THING_PEOPLE_GET_WRONG — e.g. "adding to `shared/` makes it everyone's
  dependency; prefer duplicating until the third caller"}}

## Never

- {{REPO_WIDE_PROHIBITION}}

## Recording new rules

When the user states a durable rule in conversation — "always X", "never Y", "from now on Z" —
record it with the `remember-rule` skill. Repo-wide rules go to `.claude/rules/user-rules.md`;
a rule about one package goes in that package's `CLAUDE.md` or a `paths:`-scoped rule.

## Where things are

Full map: `.claude/README.md`. Past decisions: `.claude/decisions/`.
