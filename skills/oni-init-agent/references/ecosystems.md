# Toolchain detection

Used in Phase 0 to fill the `Commands` table in `CLAUDE.md`, and again in Phase 7 to verify it.

That table is the section future sessions read most. A wrong command there is worse than a
missing one: a missing command gets asked about, a wrong one gets run.

## Evidence hierarchy

Take the command from the highest-ranked source that has it. Do not skip a rank because a
lower one is easier to read.

Two different questions are being answered here, and they do **not** have the same best source.
Conflating them is the most damaging mistake available in this phase.

**What is the toolchain?** — which runner, linter, formatter and type checker this project
actually uses. Ranked:

1. **CI config** — `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`,
   `azure-pipelines.yml`. The version that *has to work* on a clean machine or the build goes
   red. Authoritative, and routinely ignored. It also surfaces steps nothing else mentions —
   a type check, a coverage gate, a codegen step.
2. **Manifest** — declared dev-dependencies corroborate what CI runs.
3. **Lockfile** — decides the package manager (see below).

**What should a developer run locally?** — what goes in the `Commands` table. Ranked:

1. **Task runner** — `Makefile`, `Justfile`, `Taskfile.yml`, `package.json` scripts,
   `pyproject.toml [tool.poe]`, `cargo-make`. If the project wraps its commands, the wrapper
   *is* the command. Writing `pytest -q` when the project has `make test` is technically
   correct and practically wrong.
2. **CI config, with CI-only concerns stripped** — see below.
3. **The table below** — a prior, not a fact. Use it only for what the ranks above did not
   answer, and mark anything sourced here as unverified until Phase 7 runs it.

## Strip CI-only flags

CI commands carry concerns that are wrong on a developer machine. Copying them verbatim into
`CLAUDE.md` produces a command that looks authoritative and misbehaves.

Remove before writing: affected-only selectors (`--filter='...[origin/main]'`,
`nx affected`, `--since`), frozen-install flags (`--frozen-lockfile`, `npm ci`, `--locked`,
`--immutable`) outside the Install row, coverage gates, reporter and output-format flags
(`--reporter=junit`), retry and shard flags, `--ci`, and anything reading a CI-only
environment variable.

An affected-only selector is the one that actually bites: on a feature branch it silently
tests a near-empty set, so the suite passes and means nothing.

Keep what is genuinely part of the command: the runner, the config path, the target.

## Reconciling

Where the two hierarchies disagree about the *toolchain* — CI runs `mypy`, the README never
mentions it — CI wins, and the gap is worth telling the user about; it usually means the
README drifted.

Where they disagree about the *local command*, the task runner wins. Note the CI form in
`.claude/README.md` under prerequisites if a session will ever need to reproduce a CI failure.

While reading, collect anything that looks like drift — a stale lockfile from an abandoned
migration, a script referencing a deleted path, a CI step for a removed package. Report these
in the Phase 6 proposal under "not doing". They are not yours to fix, but they are exactly the
kind of thing the user does not know is there.

## Package manager: decided by lockfile

Never infer this from habit. Using the wrong one rewrites the lockfile and breaks CI, which is
one of the most common and most annoying things an agent does to a repo.

| Marker | Manager | Install |
| --- | --- | --- |
| `pnpm-lock.yaml` | pnpm | `pnpm install` (CI: `--frozen-lockfile`) |
| `yarn.lock` | yarn | `yarn install` (CI: `--immutable`) |
| `bun.lockb` / `bun.lock` | bun | `bun install` |
| `package-lock.json` | npm | `npm install` (CI: `npm ci`) |
| `uv.lock` | uv | `uv sync` |
| `poetry.lock` | poetry | `poetry install` |
| `pdm.lock` | pdm | `pdm install` |
| `Pipfile.lock` | pipenv | `pipenv install --dev` |
| `requirements.txt`, no lock | pip + venv | `pip install -r requirements.txt` |
| `environment.yml` | conda | `conda env create -f environment.yml` |
| `Cargo.lock` | cargo | `cargo build` |
| `go.sum` | go | `go mod download` |
| `Gemfile.lock` | bundler | `bundle install` |
| `composer.lock` | composer | `composer install` |

Resolve in this order, and stop at the first that answers:

1. **A `packageManager` field in `package.json`** — authoritative for Node; it drives corepack
   and pins an exact version. Check it before looking at any lockfile.
2. **A single lockfile** — decides it.
3. **Two or more lockfiles** — a leftover from an abandoned migration, or genuinely different
   areas of a multi-project repo. If one is clearly stale (older, unreferenced by CI, no
   matching manifest), name it as drift in the Phase 6 proposal and use the live one. If both
   look live, ask; do not pick.

In a multi-project repo, run this per area. `services/api/uv.lock` and a root
`pnpm-lock.yaml` are not a conflict — they are two areas, each with one answer.

## Commands by toolchain

Prefixes matter for the Python and Ruby rows — `uv run`, `poetry run`, `bundle exec`. Dropping
the prefix runs against the wrong interpreter and fails confusingly.

The **single test** column is the one to get right. It is what makes an iteration loop fast,
it is what agents most often improvise, and it is almost never in the README.

| Stack | Test | Single test | Lint | Format |
| --- | --- | --- | --- | --- |
| Node + vitest | `vitest run` | `vitest run <file> -t "<name>"` | `eslint .` | `prettier --write .` |
| Node + jest | `jest` | `jest <file> -t "<name>"` | `eslint .` | `prettier --write .` |
| Node + node:test | `node --test` | `node --test <file>` | — | — |
| Python + pytest | `pytest` | `pytest <file>::<Class>::<test>` or `-k "<expr>"` | `ruff check` | `ruff format` |
| Python + unittest | `python -m unittest` | `python -m unittest <mod>.<Class>.<test>` | — | — |
| Rust | `cargo test` | `cargo test <name> -- --exact` | `cargo clippy -- -D warnings` | `cargo fmt` |
| Go | `go test ./...` | `go test -run '^<Test>$' ./<pkg>/` | `golangci-lint run` | `gofmt -w .` |
| Java + maven | `mvn test` | `mvn test -Dtest=<Class>#<method>` | — | — |
| Java/Kotlin + gradle | `./gradlew test` | `./gradlew test --tests "<FQN>.<method>"` | — | — |
| .NET | `dotnet test` | `dotnet test --filter "FullyQualifiedName~<name>"` | — | `dotnet format` |
| Ruby + rspec | `bundle exec rspec` | `bundle exec rspec <file>:<line>` | `bundle exec rubocop` | `bundle exec rubocop -a` |
| PHP + phpunit | `vendor/bin/phpunit` | `vendor/bin/phpunit --filter <name>` | `vendor/bin/phpcs` | `vendor/bin/php-cs-fixer fix` |
| Elixir | `mix test` | `mix test <file>:<line>` | `mix credo` | `mix format` |
| Swift (SPM) | `swift test` | `swift test --filter <name>` | `swiftlint` | `swift-format` |
| Dart / Flutter | `flutter test` | `flutter test <file>` | `flutter analyze` | `dart format .` |

Areas with no test suite still need their safe commands documented — omitting them is what
leads a session to reach for the dangerous one:

| Area | Read-only / safe | Never allowlist |
| --- | --- | --- |
| Terraform | `terraform validate`, `terraform plan`, `terraform fmt` | `apply`, `destroy` |
| Pulumi | `pulumi preview` | `pulumi up`, `pulumi destroy` |
| Kubernetes | `kubectl diff`, `kubectl apply --dry-run=server`, `kustomize build` | `kubectl apply`, `delete` |
| Docker | `docker build` | `docker push`, anything `-v /:/host` |
| Database migrations | status / dry-run forms | `migrate up`, `migrate down` |

Use the gradle and maven **wrappers** (`./gradlew`, `./mvnw`) when they exist in the repo —
they pin the build tool version, and the bare command may not match.

Where a linter cell is empty, read the manifest's dev-dependencies; the project has chosen
something and it must be named explicitly rather than guessed.

## When there is no test suite

Confirm it rather than assuming it: no test framework in the manifest, no test directory, no
test job in CI. Files named `*Test*` are not proof — a `SelfTest.cs` wired into the running
app is a runtime diagnostic, not a suite.

When there is genuinely none, **delete the Test rows; do not fill them.** Writing `dotnet test`
into a repo with no test project produces a command that fails the first time a session trusts
it, and it will be trusted, because it is in the commands table.

Then answer the question the missing row leaves open: *how does anyone know a change worked?*
Run it against the real thing and watch a specific signal; trigger a built-in diagnostic; check
a named log. Put that under a `Verifying a change` heading and name the observable signal, not
the intention. This is one of the six cold-start questions, and a project without tests is
exactly where a session is most likely to declare success without evidence.

## Deriving `permissions.allow`

Once the commands are confirmed, the test / lint / format / build entries go straight into
`.claude/settings.json` under `permissions.allow`, with `:*` to match arguments:

```
"Bash(pnpm test:*)", "Bash(pnpm lint:*)", "Bash(cargo test:*)"
```

Every entry is a permission prompt the user never sees again. Derive them from the verified
table, not from a generic list — an allowlist for a command this project does not run is
clutter that makes the real entries harder to review.

Do **not** allowlist install, publish, deploy, or migration commands. They mutate state
outside the working tree.

## Verifying in Phase 7

Confirm the toolchain exists rather than that the suite passes. A failing test suite is the
user's business; a command that does not resolve is your bug.

Prefer the cheap, non-mutating probe: `--version`, `--help`, or the runner's collect-only mode
(`pytest --collect-only -q`, `vitest --run --reporter=dot --passWithNoTests`, `go build ./...`,
`cargo check`). Never run install, build-from-clean, or anything that writes, just to check a
command parses.

Report honestly per command: **verified** (probe succeeded), **unverified** (could not probe —
missing toolchain, needs a running service), or **corrected** (the probe disagreed with the
source and you changed it, with a note on which source was wrong). Mark unverified rows in the
generated `CLAUDE.md` so a future session knows not to trust them blindly.
