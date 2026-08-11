# Reading existing config

Used in Phase 0, whenever `CLAUDE.md`, `AGENTS.md` or `.claude/` already exists. Three checks
decide how the rest of the run proceeds. All three are easy to get wrong by looking at file
size alone, and getting them wrong produces either a wasted run or a destroyed file.

## 1. Is it substantial, or just present?

Do not measure by line count or by existence. Measure by **project-specific content**: does the
file say what this project is, what stack it uses, how to build and verify it, or what its
conventions are?

A 44-line `CLAUDE.md` that is entirely tool instructions — how to use an indexer, an MCP
server's tool list, a plugin's boilerplate — contains **zero** project content. It is not an
upgrade case. It is a bootstrap case that happens to have a file in the way.

Score it honestly against the six cold-start questions in `blueprint.md`. Say the count out
loud in the proposal: "the existing `CLAUDE.md` answers 0 of 6; treating this as a fresh
setup." That number is what justifies the scope you are about to propose.

- **Answers most of them** → upgrade. Fill gaps, do not restructure.
- **Answers few or none** → bootstrap, and say why the existing file did not count.

## 2. Is any of it tool-managed?

Generators write into `CLAUDE.md` and re-write on every run. Anything you add inside their
region is silently destroyed the next time the tool executes, and the user will not connect the
loss to you.

Look for fenced regions before writing anything:

```
<!-- toolname:start -->   …   <!-- toolname:end -->
<!-- BEGIN GENERATED -->  …   <!-- END GENERATED -->
# --- managed by <tool>, do not edit ---
```

Also treat as managed: any file whose header says generated, any block matching a known
generator's shape, and any `.md` a tool re-emits (check for a lockfile or config naming it).

**Rules:**

- Never write inside a managed region. Never reformat it. Never "tidy" it.
- Add your content **outside** the markers — above them, so project context is read first.
- Say in the proposal which regions you identified as managed and by what.
- If a managed region conflicts with what you would write, do not resolve it silently. Report
  the conflict and let the user decide which tool owns that ground.

An identical `AGENTS.md` alongside `CLAUDE.md` is usually the same generator writing twice.
Claude Code reads `CLAUDE.md` and not `AGENTS.md`, so the duplicate costs no context — but it
will drift. Mention it; do not unify it unprompted.

## 3. Is the config in version control?

Run it, do not assume:

```bash
git check-ignore -v CLAUDE.md .claude/ 2>/dev/null
```

A `.gitignore` containing `.claude/` and `CLAUDE.md` is a deliberate, common choice — and it
invalidates several things this skill otherwise takes for granted. When config is ignored:

- **`settings.json` vs `settings.local.json` is meaningless.** Nothing is shared. Generate one
  file, and do not explain a split that does not exist here.
- **Decision records lose their main argument.** ADRs earn their place by being reviewable in
  a PR and surviving on clone. Ignored, they are private notes — still useful for *you* across
  sessions, but say so accurately rather than selling team benefits that do not apply.
- **Rules lose their advantage over auto memory.** `memory.md` prefers `.claude/rules/` partly
  because it is in git and teammates see it. Ignored, that reason evaporates; the remaining
  reason is that it is explicit and always loaded, which is still good but is a different
  argument.
- **The only durable, shared artifact is the tracked documentation** — usually `README.md`.
  Anything the team genuinely must know belongs there, not in ignored config.

Do not propose un-ignoring it. That is the user's call and they likely made it on purpose.
State the consequence in one line and adjust what you generate.

## When a good README already exists

A substantial tracked `README.md` is the project's real knowledge store, and it is already
maintained. Do not restate it in `CLAUDE.md` — you will produce a second source of truth that
drifts, and the drift will be invisible.

Reference it instead, at the specific section:

```markdown
How a tick works: see `README.md` § "How a tick works".
```

Put in `CLAUDE.md` only what a README does not carry: the exact commands, the conventions a
contributor gets wrong, the boundary rules, the "never" list. Those are agent-facing and
usually absent from human docs.

## Merging, when it is an upgrade

- Read the whole existing file before proposing a single change.
- Present a **diff of intent** — what is added, what is reworded and why, what is untouched.
  Never present a rewrite as a merge.
- Preserve the user's wording where it already works. Rewriting a correct instruction into your
  own phrasing is churn that costs review attention and buys nothing.
- Preserve ordering. Reordering a file makes the real changes unreviewable.
