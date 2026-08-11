# Oni Agent

A Claude Code plugin whose product is *other projects' `.claude/` configuration*. There is no
application code here — every file is either plugin manifest, skill instruction, reference
material, or template.

The distinction that governs everything: files under `skills/` are read **by a model, at
runtime, to decide what to do**. They are not documentation about the plugin. Write them as
instructions to an agent, and keep the prose tight — every word is context spent.

## Layout

| Path | What it is |
| --- | --- |
| `.claude-plugin/plugin.json` | Manifest. `name` here is the component namespace. |
| `.claude-plugin/marketplace.json` | Local marketplace entry, for `claude plugin marketplace add`. |
| `skills/oni-init-agent/SKILL.md` | The orchestrator. Loaded in full on every invocation. |
| `skills/oni-init-agent/references/*.md` | Loaded on demand, at the phase that needs them. |
| `skills/oni-init-agent/templates/*.md` | Skeletons the generator fills for the target project. |
| `skills/oni-agent-improve/SKILL.md` | Audits an existing setup; proposes non-breaking improvements. |
| `skills/remember-rule/SKILL.md` | Records user-stated rules into `.claude/rules/user-rules.md`. |

Skill names are prefixed `oni-` and namespaced by the plugin, so the fully-qualified forms are
`oni-agent:oni-init-agent`, `oni-agent:oni-agent-improve` and `oni-agent:remember-rule`. Cross-
skill references use a relative path from the referring skill — `../oni-init-agent/references/…` —
so renaming a skill directory means fixing those by hand.

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
