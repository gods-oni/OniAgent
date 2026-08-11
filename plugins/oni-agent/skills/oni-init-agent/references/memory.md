# Memory strategy

Used in Phase 4. Present the options, explain the trade-off, let the user choose. Do not
default to the most powerful option — most projects need the first two and nothing else.

"Memory" here means four separable problems. Say which ones the project has before proposing
machinery.

| Problem | Solved by |
| --- | --- |
| Rules that must hold in every session | `CLAUDE.md` + `.claude/rules/` |
| Facts a session learns that the next should know | Auto memory |
| Why a past decision was made | ADRs in `.claude/decisions/` |
| Recall across many sessions and topics | A knowledge-graph MCP server |

## Layer 1 — Instructions (always. not optional.)

`CLAUDE.md` and `.claude/rules/*.md` load at session start. This is the baseline every project
gets, and for small projects it is the entire answer.

Rules support `paths:` frontmatter, which is the mechanism that keeps this affordable:

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API rules
- Validate input at the handler boundary with the shared schema helper.
```

An unscoped rule costs context in every session forever. A scoped rule costs nothing until
Claude reads a matching file. Scope by default; leave unscoped only what is genuinely global.

**Trade-off:** zero dependencies, fully portable, in version control, reviewable in a PR. But
it is static — it only knows what someone wrote down.

Check that "in version control" is actually true here (`git check-ignore -v CLAUDE.md .claude/`).
Plenty of repos gitignore agent config deliberately. When they do, this layer's advantage over
auto memory is only that it is explicit and always loaded — still real, but a different
argument, and the team-review benefit does not apply. See `existing-config.md`.

## Layer 2 — Auto memory (built in, on by default)

Claude Code maintains `~/.claude/projects/<project>/memory/`, with a `MEMORY.md` index loaded
each session (first 200 lines / 25KB) and topic files read on demand. Claude writes to it
itself as it learns build commands, gotchas, and preferences.

Facts about it that change how you advise:

- **Machine-local.** Not in git, not shared with the team, not synced across machines.
- Shared across worktrees of the same repo.
- Toggle per project with `"autoMemoryEnabled": false` in `.claude/settings.json`; relocate
  with `"autoMemoryDirectory"`.

**Trade-off:** free, automatic, no setup. But invisible to teammates and lost with the machine.
Anything the *team* needs belongs in Layer 1, not here.

If the project is a team project, say this explicitly — it is the most common mistake people
make with auto memory.

## Layer 3 — Decision records

`.claude/decisions/NNNN-slug.md`, one file per significant choice, capturing the *why*.

This is the layer people skip and then miss. Six months later the question is never "what
framework are we on" — that is readable from the repo. It is "why aren't we on the other one",
and nothing else records that. The Phase 2–4 interview outcomes are decision records already;
writing them costs nothing extra.

Cheap, in git, reviewable. Worth it for anything with a lifespan past a few weeks — provided
`.claude/` is tracked. If it is gitignored, ADRs are private notes: still worth writing for
your own future sessions, but say that accurately rather than selling team benefits that do
not apply here.

## Layer 4 — Semantic memory via MCP

A knowledge-graph or vector-memory MCP server (Graphiti, and comparable projects) gives
searchable recall across sessions and topics, with entities and relationships rather than flat
text.

**Only suggest this when the project genuinely has the problem it solves:** long-running work,
many sessions, accumulated context that outgrows a file. Verify the server and its
prerequisites per `feasibility.md` — these typically need a background service (Docker, a
database, sometimes a local model), which means a silent failure mode when it is not running.

If the user already runs such a server, the valuable thing you add is not the server — it is
the **namespacing and usage convention**, without which it degrades into a junk drawer. Write
into the generated `CLAUDE.md`:

- Which namespace/group this project writes to, and that it must be passed explicitly
- **When to read** — before starting non-trivial work on a known topic
- **When to write** — after a durable decision or a hard-won fix, never for things the repo
  already records
- The known-stale trap: most of these ingest asynchronously, so a fact just written is not
  immediately searchable

**Trade-off:** real recall power; real operational dependency. Do not add it to a project that
will be done in two weeks.

## Choosing

| Project | Layers |
| --- | --- |
| Script / throwaway | 1 |
| Personal tool | 1 + 2 |
| Team product | 1 + 2 + 3 |
| Long-running or research-heavy | 1 + 2 + 3 + 4 |

Present this, recommend a row, and let the user overrule it.

## Recording user rules over time

Whichever layers are chosen, the generated `CLAUDE.md` must instruct future sessions to record
rules the user states in conversation into `.claude/rules/user-rules.md`. That is the
`remember-rule` skill; it is Layer 1, and it is what keeps the config alive after this
setup session ends.
