<!--
TEMPLATE — README for the generated harness.

This file is graded against the cold-start test in verification.md. Someone who was not in the
conversation, given only this directory, must be able to answer all six questions from it and
from the two files it points at.

Every command here must have been executed during Phase 9. An unrun command in a README is a
claim, and this one has no excuse for claims — the harness was right there.

Keep it short. Six sections, no preamble.
-->

# {{HARNESS_NAME}}

{{ONE_SENTENCE_JOB}}

Built on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview). The agent
loop runs in this process — the tools act on this machine.

## Run

```bash
{{RUN_COMMAND}}
```

{{WHAT_A_NORMAL_RUN_LOOKS_LIKE_AND_HOW_LONG_IT_TAKES}}

Exit status `0` means the run completed; non-zero means it did not. {{WHAT_THE_CALLER_DOES_WITH_THAT}}

## Environment

| Variable | Purpose |
| --- | --- |
| `{{AUTH_VARIABLE}}` | {{WHAT_IT_AUTHENTICATES}} |
| `{{OTHER_VARIABLE}}` | {{WHY_THE_JOB_NEEDS_IT}} |

**These must be set in the shell that runs the agent.** The SDK reads the process environment
and does not load a `.env` file on its own. {{IF_DOTENV_IS_WIRED_UP_SAY_SO_HERE_INSTEAD}}

## What it can reach

{{WHICH_DIRECTORIES_TOOLS_AND_SERVICES}}

Tools beyond the built-in set are defined in `tools.ts`. {{OR_DELETE_THIS_LINE_IF_THERE_ARE_NONE}}

## What it cannot do

| Must never | Enforced by |
| --- | --- |
| {{PROHIBITION}} | {{DENY_RULE_OR_HOOK_IN_CONTROL_TS}} |

Enforcement lives in `control.ts`. Nothing in this table is enforced by the prompt alone — if a
row cannot name a rule or a hook, it does not belong in this table.

## Where it stops

{{TURN_CAP_BUDGET_CAP_TERMINAL_CONDITION_OR_THE_PERSON_CLOSING_IT}}

## When it goes wrong

| Symptom | Cause |
| --- | --- |
| Authentication error | `{{AUTH_VARIABLE}}` is not set in this shell. |
| Hangs with no output | A permission prompt with nobody to answer it — check `permissionMode` in `control.ts`. |
| Spawn or binary error | The install skipped optional dependencies. Reinstall without `--omit=optional`. |
| {{JOB_SPECIFIC_SYMPTOM}} | {{JOB_SPECIFIC_CAUSE}} |

{{WHERE_THE_OUTPUT_AND_ANY_LOGS_GO}}
