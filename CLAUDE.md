# gods-oni

A Claude Code plugin marketplace with two plugins. There is almost no application code here —
nearly every file is a plugin manifest, skill instruction, reference, or template. The one
exception is `plugins/oni-agent-one-task/hooks/task-guard.mjs`.

| Plugin | Product |
| --- | --- |
| `oni-agent` | Other projects' `.claude/` configuration. |
| `oni-agent-one-task` | Task continuity across sessions, via `.claude/TASK.md`. |

The distinction that governs everything: files under `skills/` are read **by a model, at
runtime, to decide what to do**. They are not documentation about the plugin. Write them as
instructions to an agent, and keep the prose tight — every word is context spent.

## Layout

| Path | What it is |
| --- | --- |
| `.claude-plugin/marketplace.json` | Marketplace `gods-oni`; one entry per plugin, `source` points into `plugins/`. |
| `plugins/<name>/.claude-plugin/plugin.json` | Per-plugin manifest. `name` here is the component namespace. |
| `plugins/oni-agent/skills/oni-init-agent/SKILL.md` | The orchestrator. Loaded in full on every invocation. |
| `plugins/oni-agent/skills/oni-init-agent/references/*.md` | Loaded on demand, at the phase that needs them. |
| `plugins/oni-agent/skills/oni-init-agent/templates/*.md` | Skeletons the generator fills for the target project. |
| `plugins/oni-agent/skills/oni-agent-improve/SKILL.md` | Audits an existing setup; proposes non-breaking improvements. |
| `plugins/oni-agent/skills/remember-rule/SKILL.md` | Records user-stated rules into `.claude/rules/user-rules.md`. |
| `plugins/oni-agent-one-task/skills/*/SKILL.md` | Open a task; resume a task. |
| `plugins/oni-agent-one-task/hooks/task-guard.mjs` | Stop hook. The only executable code in the repo. |

Skills are namespaced by their plugin: `oni-agent:oni-init-agent`,
`oni-agent-one-task:oni-agent-continue`. Cross-skill references use a relative path from the
referring skill — `../oni-init-agent/references/…` — so renaming a skill directory means fixing
those by hand, and `claude plugin validate` will not catch it.

## Conventions

- **`SKILL.md` stays short.** It costs context on every invocation; reference files cost
  nothing until loaded. New judgement material goes in `references/`, with a row added to the
  table at the bottom of `SKILL.md` so it is discoverable.
- **A skill's `description` is its retrieval mechanism.** It is matched against user intent,
  so it must contain the phrasings a user would actually type — not a tidy summary.
- **Templates carry `{{PLACEHOLDER}}` and an HTML comment header** explaining how to fill
  them. The header is stripped in generated output; unfilled placeholders in output are a bug.
- **Templates are `.md` even when they emit JSON** (`settings.json.md`), so the guidance
  travels with the shape.

## Never

- Do not claim a Claude Code feature exists without checking. `.claude/rules/` with `paths:`
  frontmatter is native; `.claude/workflows/` is not. Verify against
  `https://code.claude.com/docs/en/` — the docs moved from `docs.claude.com` and old URLs 301.
- Do not add a specific MCP server, package name, or version to `mcp-catalog.md` as fact. That
  file is deliberately a map of categories to verify, because the ecosystem outruns any
  training cutoff. Naming a stale server is the exact failure the plugin exists to prevent.
- Do not present an instruction and a hook as interchangeable. Instructions are context; hooks
  are enforcement. The generated config must place each accordingly.

## Commit format

```
[Type]: Subject in sentence case — what changed

Authored-By: Gods-oni <phuongtky2003@gmail.com>
```

`[Feature]`, `[Fix]`, `[Chore]`, `[Docs]`. Keep the body minimal — rationale belongs in this
file or in a decision record, where it stays discoverable, not buried in a commit nobody reads
twice.

`Authored-By` is the only trailer. **Never add `Co-Authored-By: Claude …`** or any other
generated-attribution trailer to a commit in this repo.

## Validate before committing

```bash
claude plugin validate .
```

Checks the manifest, skill frontmatter, and any `hooks.json` for schema errors. A skill with
malformed frontmatter fails silently at load time otherwise.

## Testing a change

The plugin has no test suite; it is exercised by running it. Point it at a scratch directory
of a shape you have not tried before — a Rust CLI, a monorepo, an existing repo with a
`CLAUDE.md` already present — and check the output against the cold-start test in
`references/blueprint.md`. The failure mode to watch for is generic output: a generated file
that would read identically for any other project means a phase did not do its job.

## The Stop hook

`plugins/oni-agent-one-task/hooks/task-guard.mjs` is the only code that runs. It must stay
defensive: every unexpected condition exits 0, because a backstop that breaks the session is
worse than one that misses.

Two loop guards, both load-bearing — do not remove either:

1. The block asks for the write that clears its own trigger condition.
2. A per-turn marker keyed on `prompt_id`, so a turn blocks at most once even if the write
   never happens.

`stop_hook_active` is **not** in the Stop payload; do not reintroduce a dependency on it.

Test it by piping event JSON to `node task-guard.mjs`. Use a Windows-style `cwd` — a Git Bash
`/c/Users/…` path fails `existsSync` on Windows node, and every branch silently returns "no
block", which looks like a pass.
