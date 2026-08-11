# Generated layout

Used in Phases 5–6. This is the maximum shape. **Generate only the parts this project earns** —
an empty `agents/` directory is noise, and noise is what makes a config stop being read.

This layout assumes **one project, one root, one stack, one `CLAUDE.md`**. If Phase 0
classified the repo as a workspace monorepo or poly-root, `references/monorepo.md` supersedes
the layout below; the decision table and the cold-start test here still apply within each
package.

```
<project>/
├── CLAUDE.md                    # Entry point. Loaded every session. Under 200 lines.
├── .mcp.json                    # Project MCP servers (only if any were chosen)
└── .claude/
    ├── README.md                # START HERE — the map. Not auto-loaded; CLAUDE.md points here.
    ├── settings.json            # Permissions, env, hooks. Committed.
    ├── settings.local.json      # Personal overrides. Gitignored.
    ├── rules/
    │   ├── user-rules.md        # Accumulates rules the user states. Always generated.
    │   ├── architecture.md      # The pattern and the module boundary rule.
    │   └── <topic>.md           # Scoped with `paths:` frontmatter.
    ├── skills/<name>/SKILL.md   # Repeatable multi-step procedures ("workflows").
    ├── agents/<name>.md         # Subagents that need their own context window.
    ├── commands/<name>.md       # Typed shortcuts.
    ├── hooks/                   # Scripts referenced from settings.json.
    └── decisions/NNNN-slug.md   # ADRs. Why, not what.
```

## What is native and what is convention

Do not blur these when explaining the layout to the user — a convention presented as a
platform feature is a promise the platform will not keep.

**Loaded by Claude Code automatically:** `CLAUDE.md`, `.claude/CLAUDE.md`,
`.claude/rules/*.md` (recursively; `paths:`-scoped ones load on demand),
`.claude/settings.json`, `.claude/settings.local.json`, `.claude/skills/*/SKILL.md`,
`.claude/agents/*.md`, `.claude/commands/*.md`, `.mcp.json`.

**Convention only — inert unless something references it:** `.claude/README.md`,
`.claude/decisions/`, `.claude/hooks/` (the scripts are inert; the `settings.json` entry that
calls them is what is native).

**There is no `workflows` primitive in Claude Code.** A "workflow" is a skill. If the user asks
for workflows, generate skills and say that is what they are — do not create a `.claude/workflows/`
directory that nothing will ever read.

## Where a thing goes

| The thing | Goes in | Because |
| --- | --- | --- |
| Applies to every session, ~10 lines | `CLAUDE.md` | Always loaded; keep it small |
| Applies only to some files | `rules/<topic>.md` + `paths:` | Costs no context until relevant |
| The user said "always/never X" | `rules/user-rules.md` | Durable, in git, one obvious home |
| Multi-step procedure, repeated | `skills/<name>/SKILL.md` | Loads only when invoked |
| Needs its own context window | `agents/<name>.md` | Keeps the main thread clean |
| A shortcut the user types | `commands/<name>.md` | Explicit invocation |
| Must happen deterministically | `settings.json` hooks | Model instructions are not enforcement |
| Why a decision was made | `decisions/NNNN-slug.md` | Nothing else records rationale |
| Orientation for a new session | `.claude/README.md` | One map, one place |

The row that matters most: **anything that must happen every time is a hook, not an
instruction.** CLAUDE.md is context, not enforcement. If the user says "always run the
formatter after editing", that is a `PostToolUse` hook. Saying it in CLAUDE.md and calling it
done is the most common way these configs quietly fail.

## Cold-start test

The point of the whole layout is this: a fresh session, given only this repo, should be able to
answer these without asking. Check each one against what you generated before you hand off.

1. What is this project and what is it for?
2. What stack, and what pattern?
3. Where do I add a new <the project's most common unit of work>?
4. What must I never do here?
5. How do I run the tests, the linter, the app?
6. What has already been decided, and why?

If any answer is missing, the config is incomplete regardless of how many files you wrote.
Answers 1–5 live in `CLAUDE.md` and `.claude/README.md`; answer 6 lives in `decisions/`.

## Settings

`.claude/settings.json` is committed and team-shared. Populate it only with what this project
actually needs:

- `permissions.allow` — the project's routine read-only commands, so the user stops being
  prompted for `npm test` forty times. This is the highest-value entry by far.
- `permissions.deny` — genuine danger for this project: production credentials, deploy
  commands, `.env` reads.
- `hooks` — anything from the deterministic column above.
- `env` — non-secret project environment variables.

`settings.local.json` is for personal overrides and must be gitignored. Check the project's
`.gitignore` covers it; add the entry if not.

## Generation discipline

- Every file must contain this project's specifics. A generated file that would read
  identically for any other project should not have been generated.
- No unfilled `{{PLACEHOLDER}}` in output.
- No empty directories.
- Prefer fewer, denser files. Six well-aimed files beat twenty thin ones — the failure mode of
  these configs is not being too small, it is being too large to read.
