# gods-oni

A Claude Code marketplace with **one plugin**, `oni-agent`. There is almost no application code
here — nearly every file is a manifest, skill instruction, reference, or template. The two
exceptions are hook scripts: `plugins/oni-agent/hooks/sdk-drift-guard.mjs`, which runs here, and
`skills/init/templates/task-skills/task-guard.mjs`, which is shipped verbatim into target
projects.

| Skill | Product |
| --- | --- |
| `init` | A configured project: `CLAUDE.md`, rules, settings, and its task commands. Plus, when the job needs one, a standalone agent program. |
| `improve` | An audit of an existing setup, with non-breaking fixes. |
| `remember-rule` | A user-stated rule, recorded into `.claude/rules/user-rules.md`. |

`init` runs **two tracks**. Track A always runs and produces configuration. Track B runs only
when the work needs a program that lives outside a Claude Code session, and its product is
**source code that must run** — which is why `init` ends by executing its own output rather than
by probing that a command resolves.

The distinction that governs everything: files under `skills/` are read **by a model, at
runtime, to decide what to do**. They are not documentation about the plugin. Write them as
instructions to an agent, and keep the prose tight — every word is context spent.

## Layout

| Path | What it is |
| --- | --- |
| `.claude-plugin/marketplace.json` | Marketplace `gods-oni`; one entry, `source` points into `plugins/`. |
| `plugins/oni-agent/.claude-plugin/plugin.json` | The manifest. `name` here is the component namespace. |
| `plugins/oni-agent/hooks/sdk-drift-guard.mjs` | PostToolUse hook. Enforces `init`'s Hard rule 6. |
| `skills/init/SKILL.md` | The orchestrator: 10 phases across two tracks. Loaded in full on every invocation. |
| `skills/init/references/*.md` | 19 files, loaded on demand at the phase that needs them. |
| `skills/init/templates/config/` | The `.claude/` surface for the target project. |
| `skills/init/templates/task-skills/` | The generated `/task`-family skills, plus `task-guard.mjs`. |
| `skills/init/templates/agent-sdk/` | Track B only: the program, its control surface, evals and CI. |
| `skills/improve/SKILL.md` | Audits an existing setup; proposes non-breaking improvements. |
| `skills/remember-rule/SKILL.md` | Records user-stated rules. |

Skills are namespaced by the plugin: `oni-agent:init`, `oni-agent:improve`. Cross-skill
references use a relative path from the referring skill — `improve/SKILL.md` reads
`../init/references/…` — so renaming a skill directory means fixing those by hand, and
`claude plugin validate` will **not** catch it.

The reference files also carry phase numbers ("Used in Phase 7"). Reordering a phase in
`SKILL.md` means updating every reference that names it; nothing checks this either.

## The five generated task skills

`init` Phase 6 emits these into the target project's `.claude/skills/`. They are the product
most users actually touch.

| | Shape of the work | Stops when |
| --- | --- | --- |
| `/task` | Memory that survives losing the session | The user accepts |
| `/loop-task` | **Depth** — one thing, unknown attempts | A verification predicate passes |
| `/graph-task` | **Breadth and order** — many things, real dependencies | Every node is done |
| `/cron-task` | Recurring work, hosted as a routine | Never — it is scheduled |
| `/maintain-task` | A change to something that exists | The memory is updated too |

`/loop-task` and `/graph-task` sound alike and are opposites; keep that distinction sharp in both
templates, because a user who picks the wrong one blames the command.

**Do not ship all five by reflex.** Each has a precondition in `references/task-surface.md`, and
two of them are commonly missing: `/loop-task` needs a verification signal that actually runs,
and `/cron-task` needs routines to be reachable from the machine.

## Conventions

- **`SKILL.md` stays short.** It costs context on every invocation; reference files cost nothing
  until loaded. New judgement material goes in `references/`, with a row added to the table at
  the bottom of `SKILL.md` so it is discoverable.
- **A skill's `description` is its retrieval mechanism.** Matched against user intent, so it must
  contain the phrasings a user would actually type — not a tidy summary.
- **Templates carry `{{PLACEHOLDER}}` and an HTML comment header** explaining how to fill them.
  The header is stripped in generated output; unfilled placeholders in output are a bug.
- **Templates are `.md` even when they emit JSON, YAML or TypeScript**, so the guidance travels
  with the shape. `task-guard.mjs` is the one exception: it is a script, copied byte for byte.

## Never

- Do not claim a Claude Code feature exists without checking. Verify against
  `https://code.claude.com/docs/en/` — the docs moved from `docs.claude.com` and old URLs 301.
  Three things verified in this repo's history, all of which changed a design:
  **custom commands merged into skills** (a `commands/` file ignores `name` and `paths` and
  cannot carry supporting files, so generate skills); **skill frontmatter carries `model`,
  `effort` and `hooks`**; and **routines have a model selector but no effort selector**, so a
  routine's effort can only come from a committed skill's frontmatter.
- Do not write an Agent SDK option, import, or enum value as fact. Checked against the shipped
  declarations, the published docs were wrong about three things: `PermissionMode` (three values
  vs. six), the hook matcher shape (`{match, callback}` vs. `{matcher, hooks[]}`), and the
  `CanUseTool` signature. Two of the three do not compile. `references/sdk-surface.md` teaches
  reading `node_modules/@anthropic-ai/claude-agent-sdk/*.d.ts`, and `sdk-drift-guard.mjs`
  enforces it. Same reasoning as `mcp-catalog.md`, different ecosystem.
- Do not state permission-rule or path behaviour without running it. Two claims in `control.md`
  are measured, and both contradict what the docs imply: the documented absolute-path form
  `Read(//C:/…)` does **not** match on Windows, and `permission_denials` came back **empty** for
  a read a scoped deny rule genuinely blocked.
- Do not add a specific MCP server, package name, or version to `mcp-catalog.md` as fact. That
  file is deliberately a map of categories to verify, because the ecosystem outruns any training
  cutoff. Naming a stale server is the exact failure the plugin exists to prevent.
- Do not present an instruction and a hook as interchangeable. Instructions are context; hooks
  are enforcement. The generated config must place each accordingly.
- Do not let `init` generate a rule that adds a **machine-attribution trailer**. `conventions.md`
  derives the commit rule from `git log`; even when the history contains `Co-Authored-By: Claude`
  or a "generated with" line, those arrived from a tool default and must not become a rule.

## Commit format

```
[Type]: Subject in sentence case — what changed

Authored-By: Gods-oni <phuongtky2003@gmail.com>
```

`[Feature]`, `[Fix]`, `[Chore]`, `[Docs]`. Keep the body minimal — rationale belongs in this file
or in a decision record, where it stays discoverable, not buried in a commit nobody reads twice.

`Authored-By` is the only trailer. **Never add `Co-Authored-By: Claude …`** or any other
generated-attribution trailer to a commit in this repo.

## Validate before committing

```bash
claude plugin validate .
```

Checks the manifest, skill frontmatter, and `hooks.json` for schema errors. A skill with
malformed frontmatter fails silently at load time otherwise.

It does **not** check: cross-skill relative paths, phase numbers in references, or anything
inside `templates/`. Those are hand-checked.

## Testing a change

No test suite; the plugin is exercised by running it. Point `init` at a scratch directory of a
shape you have not tried — a Rust CLI, a monorepo, an existing repo with a `CLAUDE.md` already
present — and check the output against the cold-start test in `references/blueprint.md`. The
failure mode to watch for is generic output: a generated file that would read identically for
any other project means a phase did not do its job.

Paths cheap to leave untested and expensive to get wrong. Cover each at least once:

- **Phase 2 on a real repo** — several features sharing a shape, and a `git log` with a real
  convention. It must *ask* whether a repeated shape is a convention or duplicated debt rather
  than deciding, and the derived commit rule must match history with no attribution trailer.
- **Each generated task skill loads.** `claude plugin validate` does not cover a target project's
  `.claude/skills/`, so start a session there and confirm each appears in the `/` menu.
- **Track B substrate gate landing off the Agent SDK.** `loop.ts.md` is the only template with a
  hand-written agent loop in it.
- **The `service` archetype**, and a real deny rule on a real path.

Track B has a stronger test available and Phase 9 is exactly that test: let it generate a program
and run it. Needs Node 18+ and a credential. Try it once in an empty directory and once inside a
CommonJS project, which is the branch that emits `agent.mts`. Type-checking a filled-in template
against the installed declarations costs nothing and catches most defects; only a permission rule
needs a live run.

`evals-ci.yml.md` is the only CI this repo generates for anyone. Check a change to it by
extracting the fenced block, filling the placeholders, and parsing it — `npm i yaml` and assert
on the **parsed object**, not on the source text. Asserting on the source matches the comments,
which warn against the very strings you are looking for, and the linter cries wolf.

## The hooks

Two scripts, one that runs here and one that ships out. Both follow the same doctrine and both
must stay defensive: **every unexpected condition exits 0**, because a backstop that breaks the
session is worse than one that misses. Both use a marker file so they fire at most once per unit,
and both ask for the write that clears their own trigger.

`sdk-drift-guard.mjs` (PostToolUse, this plugin) exists because `init`'s central safety rule —
never write an SDK call from memory — was otherwise only an instruction, which this file says is
not enforcement. It blocks when a file imports the Agent SDK and either the package is not
installed or a named import is absent from the shipped declarations. Inert on any file that does
not import the SDK, and it exits 0 rather than guessing when the declaration format is
unfamiliar.

`task-guard.mjs` (Stop) ships into target projects with `/task`, registered from that skill's
`hooks:` frontmatter rather than from the project's `settings.json`. Consequence worth knowing:
it registers **when `/task` runs**, so a session that never invokes `/task` has no hook. Two loop
guards, both load-bearing — do not remove either:

1. The block asks for the write that clears its own trigger condition.
2. A per-turn marker keyed on `prompt_id`, so a turn blocks at most once even if the write never
   happens.

`stop_hook_active` is **not** in the Stop payload; do not reintroduce a dependency on it.

### Testing a hook from Bash, on Windows

Three traps, and each one makes a broken hook look like a passing one:

- Use a **Windows-style `cwd`**. A Git Bash `/c/Users/…` path fails `existsSync` on Windows node,
  every branch returns "no block", and that looks like a pass.
- A Windows path inside the test JSON needs **doubled backslashes**, or `JSON.parse` rejects
  `\U` as a bad escape, the hook's defensive `catch` exits 0, and the silence looks like a pass.
- **Assert on the block output, never on the exit code** — both hooks exit 0 always, by design.

The Bash tool's heredoc also collapses backslashes, so write fixture files with the Write tool
rather than `<<'EOF'`.
