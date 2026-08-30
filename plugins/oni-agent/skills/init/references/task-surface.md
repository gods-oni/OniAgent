# The task surface

Used in Phase 6. Deciding which of the five task skills this project earns, and generating them
into `.claude/skills/`.

## Skills, not commands

Generate these as **skills** — `.claude/skills/<name>/SKILL.md` — not as files in
`.claude/commands/`. Both produce `/<name>`, but a command file ignores `name` and `paths`, and
cannot carry supporting files. Every skill here needs at least one of those: `/task` ships a hook
script and a reference, `/graph-task` and `/cron-task` pin `effort`, and all of them want a
directory of their own.

Set `effort` only where there is a reason, and say the reason in a comment. Claude Code's own
default is already high; writing a lower value silently downgrades the skill. The two templates
that set it — `/graph-task` and `/cron-task` — do so because their expensive part is a judgement
made once (the graph, the interview) that everything afterwards depends on.

The frontmatter fields these rely on, all confirmed against the current reference:

| Field | Used for |
| --- | --- |
| `model`, `effort` | Pinning the model and effort while the skill is active |
| `hooks` | Registering a hook when the skill is invoked, kept for the rest of the session |
| `argument-hint` | What the user types after the name |
| `disable-model-invocation` | Manual-only workflows |
| `allowed-tools`, `disallowed-tools` | The tool surface for that skill's turn |

## Derive the set — do not ship all five by reflex

Each skill has a precondition. Where it is missing, the skill is not "nice to have anyway": it
is a command that will mislead someone. Name what you skipped and why, in the Phase 8 proposal.

| Skill | Precondition | If it is missing |
| --- | --- | --- |
| `/task` | none | Always generate. |
| `/maintain-task` | a `.claude/` that this run is creating | Always generate — it reads exactly that memory. |
| `/loop-task` | **a verification signal that runs**: tests, a type-check, a linter, a build | Do not generate. A loop with no predicate cannot terminate on success, only on the iteration cap, which is a timer wearing a loop's clothes. Say this, and offer to add the missing signal as its own piece of work. |
| `/graph-task` | real dependency depth: several modules, changes that ripple | Do not generate for a flat script or a handful of files. A dependency graph over six independent files is ceremony, and ceremony teaches people to skip the command that matters. |
| `/cron-task` | a claude.ai login (**not** an API key), a GitHub repo, `/schedule` available | Do not generate. Name the specific blocker — see below — rather than emitting a command that fails at the last step. |

### The `/cron-task` preconditions, specifically

Routines run on Claude Code's cloud infrastructure, and they have hard requirements that are
worth checking in Phase 0 rather than discovering at the end:

- **A claude.ai subscription login.** Routines do not work with a Console API key, an Anthropic
  profile or federation credential, or a cloud provider login.
- **`ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` must not be set in the shell**, and
  `apiKeyHelper` must not be set in settings — each takes precedence over the claude.ai login
  and hides `/schedule` entirely.
- **A GitHub repository**, since each run clones one.
- Not inside a Claude Code on the web session, and not disabled by an organisation policy.

If the blocker is an environment variable the user controls, say which one. "Routines are
unavailable" is not useful; "`ANTHROPIC_API_KEY` is set in this shell, which hides `/schedule`"
is actionable.

## Two of these overlap in name only

`/loop-task` and `/graph-task` sound similar and are opposites. Say which is which in the
generated `.claude/README.md`, because a user who picks the wrong one gets a bad experience and
blames the command:

| | `/loop-task` | `/graph-task` |
| --- | --- | --- |
| Shape of the work | One thing, done right | Many things, in the right order |
| Known in advance | The finish line | The structure |
| Iterations | Unknown — until the predicate holds | One pass per node |
| Stops when | The acceptance criteria pass | Every node is done |
| Fails by | Looping without progress | Building the wrong graph |

`/task` is orthogonal to both: it is the memory that survives losing the session, and either of
the other two can run inside an open task.

## Generation

Copy the templates from `templates/task-skills/`. They are close to verbatim — loop engineering
and graph engineering do not change per project. What is filled in is the project's own reality:
the verification command, whether a code-graph tool is available, the iteration and node budgets
appropriate to this codebase.

`task-guard.mjs` is a script, not a template: copy it byte-for-byte. It is the only executable
this skill emits, and its defensive posture is the reason it is safe to ship — every unexpected
condition exits 0.

After writing, confirm the skills actually load: start a session in the project and check that
each appears in the `/` menu. `claude plugin validate` does not cover a project's
`.claude/skills/`, so a malformed frontmatter block fails silently there.
