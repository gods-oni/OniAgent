# Monorepos and polyglot repos

Used in Phases 0, 5 and 6, whenever the repo is not a single project with a single stack.

The default layout in `blueprint.md` assumes one project, one root, one stack, one `CLAUDE.md`.
When that assumption is false, generating it anyway produces a file that confidently describes
one part of the repo as though it were the whole thing — worse than writing nothing, because a
future session will believe it.

## Three shapes — which compose

Classify in Phase 0. The shape decides the layout, and the layout decides everything after it.

**These are not mutually exclusive, and assuming they are is the failure mode.** The most
common real repo is a hybrid: a JS workspace under `packages/*`, a Python service in
`services/` that the workspace file does not mention, and a `terraform/` directory that is not
a package at all. Classifying that as "workspace monorepo" and stopping means two thirds of the
repo gets no config and no commands.

So: find the workspace, then find **every manifest the workspace file does not claim**. Each
unclaimed one is its own area, resolved independently. A repo is a workspace *plus* zero or
more out-of-workspace areas, and the answer for the repo is the union.

**Single** — one manifest at the root, or one clearly dominant with incidental others
(a `tools/` script, a docs site). Use `blueprint.md` unchanged.

**Workspace monorepo** — a workspace tool ties packages together. Usually one lockfile, a
shared toolchain, and root commands that fan out.

| Marker | Tool |
| --- | --- |
| `pnpm-workspace.yaml` | pnpm workspaces |
| `workspaces` field in `package.json` | npm / yarn / bun workspaces |
| `turbo.json` | Turborepo |
| `nx.json` | Nx |
| `lerna.json` | Lerna |
| `rush.json` | Rush |
| `go.work` | Go workspaces |
| `[workspace]` in root `Cargo.toml` | Cargo workspace |
| `[tool.uv.workspace]` in `pyproject.toml` | uv workspace |
| `<modules>` in `pom.xml` | Maven multi-module |
| `include(...)` in `settings.gradle[.kts]` | Gradle multi-project |
| `MODULE.bazel` / `WORKSPACE` | Bazel |

**Poly-root** — one or more manifests that no workspace file claims. `backend/pyproject.toml`
beside `frontend/package.json` beside `infra/main.tf`. The shape most often mishandled, because
no tool announces it. Detect by listing every manifest below the root and subtracting the ones
the workspace globs match.

A **non-code area** — `terraform/`, `k8s/`, `docs/`, `notebooks/`, `.github/actions/` — is an
area too. It has no test command, and treating that as "nothing to document" is a mistake: an
infrastructure directory usually carries the repo's highest-risk operations and therefore its
most important `permissions.deny` entries. Give it a row in the package map and a boundary
rule even when it has no commands. See "Risk" below.

`.gitmodules` is none of these. Submodules are separate repos; do not generate config into
them, and say so.

## Layout

Both multi-project shapes use the same three-tier structure. It works because nested
`CLAUDE.md` files load **on demand** — only when Claude reads a file in that subdirectory —
so per-package detail costs nothing until it is relevant.

```
repo/
├── CLAUDE.md                     # THIN. Map + workspace tool + boundaries. Loads always.
├── .claude/
│   ├── README.md                 # The map, in full
│   ├── rules/
│   │   ├── user-rules.md
│   │   ├── boundaries.md         # Which package may depend on which. Unscoped.
│   │   └── <lang>.md             # Cross-cutting, `paths:`-scoped to that language
│   └── decisions/
├── packages/api/CLAUDE.md        # That package's stack, commands, conventions
└── packages/web/CLAUDE.md
```

Tier by tier:

- **Root `CLAUDE.md`** — what the repo is, the package map, the workspace tool, root-level
  commands, and the boundary rule. Aim for 60 lines. It must contain **no per-package detail**;
  every line here is paid for by every session regardless of which package they touch. This is
  the discipline that makes the whole layout work, and the easiest one to abandon.
- **Per-package `CLAUDE.md`** — use the standard `project-claude-md.md` template, scoped to
  that package. Loads only when Claude reads files there.
- **`.claude/rules/` with `paths:`** — cross-cutting policy that spans packages. "All TS
  packages export through `index.ts`", "every service registers a health check."

The split between the last two is by ownership, not by content: a per-package `CLAUDE.md` is
the package team's, a scoped rule is the platform's. When a rule spans packages, it is a rule;
when it describes one package, it belongs beside that package.

**Do not generate a `CLAUDE.md` for every package.** Ten thin generated files is how a
monorepo config becomes unread. Generate for the two to four packages that are actually worked
in, ask the user which, and document the pattern in `.claude/README.md` so the next one can be
added by hand.

If the repo contains other teams' `CLAUDE.md` files that pollute context, point the user at
`claudeMdExcludes` in `.claude/settings.local.json`.

## Commands

There is no single command set. The root `CLAUDE.md` carries the fan-out and targeted forms;
each package's own `CLAUDE.md` carries its local commands.

| Tool | All packages | One package |
| --- | --- | --- |
| pnpm | `pnpm -r test` | `pnpm --filter <pkg> test` |
| yarn | `yarn workspaces foreach -A run test` | `yarn workspace <pkg> test` |
| npm | `npm test --workspaces` | `npm test -w <pkg>` |
| Turborepo | `turbo run test` | `turbo run test --filter=<pkg>` |
| Nx | `nx run-many -t test` | `nx test <project>` |
| Cargo | `cargo test --workspace` | `cargo test -p <crate>` |
| Go | `go test ./...` | `go test ./<module>/...` |
| Gradle | `./gradlew test` | `./gradlew :<module>:test` |
| Maven | `mvn test` | `mvn -pl <module> test` |
| Bazel | `bazel test //...` | `bazel test //<pkg>:all` |

The targeted form is the one that matters. A session working on one package should not run
the whole repo's suite to check one change, and if the root `CLAUDE.md` only documents the
fan-out, that is exactly what it will do.

For **poly-root**, there is no fan-out — say so explicitly rather than inventing one. Give the
per-area commands with their working directory, and note that each area's manifest and lockfile
are independent. The evidence hierarchy in `ecosystems.md` applies per area, not once: run it
separately for each manifest, since two areas may disagree on package manager, test runner and
CI job.

## Boundaries

This is the highest-value rule in any multi-project repo, and the one nothing else records.
Write it into `.claude/rules/boundaries.md`, unscoped.

Extract from evidence, not from what the user wishes were true — read the actual dependency
declarations in each manifest, plus any enforcement already configured (Nx tags,
`eslint-plugin-boundaries`, Cargo/Go module graphs, ArchUnit).

State it as a directed graph with a reason per forbidden edge:

```
web    → ui, shared        allowed
api    → db, shared        allowed
shared → (nothing)         it is a leaf; a dependency here becomes everyone's dependency
ui     → api               FORBIDDEN — would pull server code into the browser bundle
```

Then ask the one question the manifests cannot answer: **which of these edges exist today but
should not?** Those are the migration constraints, they belong in the rule file marked as such,
and they are the thing a fresh session most reliably makes worse without being told.

## Risk is per area, not per repo

A repo is as dangerous as its most dangerous area, but `permissions` should not treat every
area as though it were that one. Classify each area, and derive settings from the mix.

| Area | Typical risk | What that means for `settings.json` |
| --- | --- | --- |
| Library, UI package | Low | Allowlist test/lint/build freely |
| Service with a database | Medium | Deny production connection strings; allowlist local test commands |
| IaC — Terraform, Pulumi, CDK, K8s manifests | **High** | Deny `terraform apply`/`destroy`, `kubectl apply`, `pulumi up`. `plan` and `diff` are read-only and safe to allow |
| Deploy scripts, release tooling | **High** | Deny outright; these are the user's call every time |
| Notebooks, experiments | Low, but noisy | Consider excluding from rules entirely; they follow different conventions |

The point of the split: a repo containing one Terraform directory should not have its
TypeScript packages locked down, and its Terraform directory should not be as open as its
TypeScript packages. A single repo-wide risk setting gets one of those two wrong.

Write the high-risk entries into `permissions.deny` with a path scope where the syntax allows
it, and state the reasoning in `.claude/README.md` — a deny entry whose purpose is not recorded
gets removed by whoever it first inconveniences.

## Interview adjustments

Phase 1 gains one question: which packages does this person actually work in? The answer scopes
everything after it. Nobody works in all of them, and the config should reflect where the work
happens.

Phase 2 runs **per area**, not once. A polyglot repo has a pattern per area, and a shared
convention set that spans them. Do not force one pattern across a Python service and a React
app.

Phase 5 derives the surface per package for anything package-local, plus a repo-level set for
cross-cutting concerns. Skills in particular tend to be package-local ("add an endpoint" means
something different in each), while boundary rules are always repo-level.

## Cold-start test, monorepo edition

A fresh session opened at the repo root, given a task in one package, should be able to answer:

1. What packages exist and what does each do?
2. Which package does this task belong in?
3. How do I run *just this package's* tests?
4. What may this package import, and what may it not?
5. Where does the shared code live, and when is adding to it the wrong move?

Answers 1, 3 and 4 come from the root `CLAUDE.md` and `boundaries.md`; 2 and 5 come from the
package map. If a session has to read three manifests to answer question 3, the root
`CLAUDE.md` is incomplete.
