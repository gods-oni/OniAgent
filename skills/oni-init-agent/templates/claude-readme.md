<!--
TEMPLATE — .claude/README.md for the target project.

This is the orientation map: the file a person or a session opens to find out where anything
lives. It is NOT auto-loaded; CLAUDE.md links to it, which is what keeps CLAUDE.md small.

It must reflect what was actually generated. Delete rows for things that do not exist.
Delete this comment block in the output.
-->

# `.claude/` — start here

Configuration for Claude Code in {{PROJECT_NAME}}. If you are a fresh session, read
`../CLAUDE.md` first (it loads automatically), then use this as the index.

## The 30-second version

- **What this project is:** {{ONE_LINE}}
- **Stack:** {{STACK_ONE_LINE}}
- **Pattern:** {{PATTERN_ONE_LINE}}
- **Most common task:** {{MOST_COMMON_TASK}} → {{WHERE_AND_HOW}}

## What lives where

| Path | Holds | Loaded |
| --- | --- | --- |
| `../CLAUDE.md` | Stack, commands, layout, conventions | Every session |
| `rules/user-rules.md` | Rules the user has stated over time | Every session |
| `rules/architecture.md` | Pattern and module boundaries | Every session |
| `rules/{{SCOPED_RULE}}.md` | {{WHAT}} | When touching `{{PATHS}}` |
| `skills/{{SKILL}}/SKILL.md` | {{PROCEDURE}} | On invoke |
| `agents/{{AGENT}}.md` | {{ROLE}} | When delegated to |
| `commands/{{CMD}}.md` | `/{{CMD}}` | When typed |
| `decisions/` | Why past choices were made | On demand |
| `settings.json` | Permissions, hooks, env | Every session |

## Common tasks

<!-- Two to five entries. The things someone will actually want to do on day one. -->

**{{TASK_1}}** — {{HOW}}

**{{TASK_2}}** — {{HOW}}

## Prerequisites

<!-- Only if something must be running or set. Omit the whole section if nothing does —
     do not write "None" theatre. Anything listed here is a silent-failure source. -->

- {{SERVICE_OR_ENV_VAR}} — {{WHY_AND_HOW_TO_START_IT}}

## Maintaining this setup

- New durable rule from the user → `rules/user-rules.md` (the `remember-rule` skill).
- Rule that only applies to some files → new file in `rules/` with `paths:` frontmatter,
  not another line in `CLAUDE.md`.
- Repeated multi-step procedure → a skill in `skills/`.
- Must happen every time regardless of what the model decides → a hook in `settings.json`.
  Instructions are context, not enforcement.
- Significant decision → an ADR in `decisions/`.
- Keep `../CLAUDE.md` under 200 lines. When it grows, move detail out, do not trim meaning.
