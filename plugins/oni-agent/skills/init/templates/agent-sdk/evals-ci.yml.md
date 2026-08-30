<!--
TEMPLATE — .github/workflows/agent-evals.yml for the target project.

Emit this ONLY alongside eval.ts, and only when Phase 10 landed at a level where a suite exists.
A suite nobody runs is the failure mode evaluation.md warns about — it looks like coverage — and
this file is the thing that runs it.

This is the ONLY CI this skill generates. It does not build, package, or deploy the harness.

Every run spends real money on the Anthropic API. Tell the user the per-run cost from Phase 9
before they merge this, because that number decides whether it belongs on every push, on
pull requests only, or behind a manual trigger. Fill every {{PLACEHOLDER}}.
-->

```yaml
name: agent evals

on:
  pull_request:
    paths:
      # Only the files that can change the agent's behaviour. Running this on a README edit
      # is spending money to learn nothing.
      - "{{ENTRY_POINT}}"
      - "control.ts"
      - "tools.ts"
      - "eval.ts"
      - "eval-baseline.json"
      - ".github/workflows/agent-evals.yml"
  workflow_dispatch:

# One run per branch. A push that supersedes an in-flight run cancels it instead of paying
# for both.
concurrency:
  group: agent-evals-${{ github.ref }}
  cancel-in-progress: true

jobs:
  evals:
    # Fork pull requests cannot read secrets, and should not be able to spend the API budget
    # of whoever owns the repository. Without this guard the job fails confusingly on every
    # outside contribution.
    if: github.event_name == 'workflow_dispatch' || github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: {{TIMEOUT_MINUTES}}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      # NOT `npm ci --omit=optional`. The Agent SDK ships its binary through optional
      # dependencies; omitting them produces an install that looks fine and fails at runtime.
      - run: npm ci

      - name: Run evals
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npx tsx eval.ts
```

## Before this is useful

**The secret has to exist.** Add `ANTHROPIC_API_KEY` under the repository's Actions secrets.
Without it the job fails on authentication, which looks like a broken agent and is not.

**The baseline has to be committed.** `eval-baseline.json` is what turns "it passed" into "it
did not get worse". Uncommitted, every CI checkout starts with no baseline and the drift checks
silently do nothing while the job still reports green.

**The suite has to have been proven to fail.** Wiring an unverified suite into CI installs a
green tick that means nothing. Do the mutation step in Phase 10 first.

## What this deliberately does not do

- **No schedule.** A cron on an eval suite is a standing charge that nobody notices until the
  bill arrives, and it tells you about drift in the model rather than in your code. If the user
  wants one, that is their decision to make with the per-run cost in front of them.
- **No push-to-main trigger.** By then the change is merged. The point is to catch it in review.
- **No baseline auto-update.** A job that rewrites the baseline when the suite goes red converts
  every regression into an accepted one, silently. Regenerating is a human decision, made
  locally and committed with a reason.
- **No build, package, or deploy.** Out of scope for this skill.

## If the job is flaky

Read `evaluation.md` first. A case that fails one run in five is reporting something real about
the agent, and CI is where that gets noticed. The wrong fixes, in order of how tempting they
are: loosening the assertion, raising the margin, regenerating the baseline, deleting the case.
The right one is usually to find out why the trajectory changed.
