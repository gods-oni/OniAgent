<!--
TEMPLATE — CLAUDE.md for the target project.

Loaded in full at the start of every session. Hard ceiling: 200 lines; aim for 80–120.
Anything conditional belongs in .claude/rules/ with `paths:` frontmatter instead.

Cut any section that would be filler for this project. A five-section CLAUDE.md that is
entirely true beats a ten-section one padded to look thorough.
Delete this comment block in the output.
-->

# {{PROJECT_NAME}}

{{ONE_SENTENCE_PURPOSE}}

## Stack

- **Language:** {{LANGUAGE}} {{VERSION}}
- **Package manager:** {{PKG_MANAGER}} — use this one, not the alternatives
- **Key libraries:** {{LIBS_THAT_SHAPE_THE_CODE}}
- **Runs on:** {{DEPLOY_TARGET}}

## Commands

<!-- Exact and copy-pasteable. The section future sessions use most, so a wrong entry here
     does the most damage. Take each from CI config or the task runner where one exists;
     see references/ecosystems.md for the evidence hierarchy.

     Mark any row Phase 7 could not probe with a trailing "⚠ unverified" so a future session
     knows not to trust it blindly. Drop the marker from rows that were verified — do not
     annotate every row, or the marker stops meaning anything. -->

| Task | Command |
| --- | --- |
| Install | `{{INSTALL_CMD}}` |
| Run | `{{RUN_CMD}}` |
| Test | `{{TEST_CMD}}` |
| Single test | `{{SINGLE_TEST_CMD}}` |
| Lint | `{{LINT_CMD}}` |
| Format | `{{FORMAT_CMD}}` |
| Build | `{{BUILD_CMD}}` |

<!-- If a row has no answer for this project, delete it. Do NOT fill it with the plausible
     default — a `dotnet test` in a repo with no test project is a command that fails the
     first time a session trusts it, and it is worse than the row being absent. -->

<!-- REQUIRED when there is no test suite. Plenty of real projects have none — desktop apps,
     game tools, scripts, prototypes. "How do I verify a change?" is a cold-start question,
     so it must still be answered, just not with a test command. Say what verification
     actually is here: run it against X and watch Y; use the built-in self-test at Z;
     check the log at W. Name the observable signal. -->
## Verifying a change

{{HOW_YOU_ACTUALLY_KNOW_IT_WORKED — no test suite exists in this project}}

<!-- Include only when the project wraps its commands (make/just/task/scripts): -->
Use these wrappers, not the underlying tools directly — {{WHY_THE_WRAPPER_EXISTS}}.

## Layout

```
{{DIRECTORY_TREE_WITH_PURPOSE_PER_FOLDER}}
```

## Architecture

{{PATTERN_IN_ONE_OR_TWO_SENTENCES}}

**Boundary rule:** {{THE_IMPORT_RULE_THAT_MUST_NOT_BE_BROKEN}}

{{WHERE_IO_LIVES}}

## Conventions

<!-- Only conventions that differ from the ecosystem default, or that this codebase gets
     wrong repeatedly. Do not restate what the linter already enforces. -->

- {{CONVENTION_1}}
- {{CONVENTION_2}}

## Never

<!-- The highest-value section. Each line prevents a specific, real mistake. -->

- {{THING_THAT_BREAKS_THINGS}}
- {{DIRECTORY_THAT_IS_GENERATED_AND_MUST_NOT_BE_EDITED}}

## Recording new rules

When the user states a durable rule in conversation — "always X", "never Y", "from now on Z" —
record it in `.claude/rules/user-rules.md` using the `remember-rule` skill. Do not let it live
only in the transcript; it is lost at the end of the session.

## Where things are

Full map: `.claude/README.md`. Past decisions and their rationale: `.claude/decisions/`.

<!-- Include only if a semantic-memory MCP server was configured:
## Project memory

Namespace: `{{MEMORY_NAMESPACE}}` — always pass it explicitly.
Search it before starting non-trivial work on a known topic. Write to it after a durable
decision or a hard-won fix; skip anything the repo or git history already records.
{{ASYNC_INGEST_CAVEAT_IF_APPLICABLE}}
-->
