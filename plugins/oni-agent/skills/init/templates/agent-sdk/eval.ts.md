<!--
TEMPLATE — the evaluation suite.

Emit this only at the proportionality level evaluation.md establishes. A script someone runs
twice a month gets a paragraph in the README describing a good run, not this file.

Four cases is a good suite. Forty is a suite that gets turned off. Fill every {{PLACEHOLDER}}.

Two things make this file different from a normal test file, and both are load-bearing:

  1. Cost and turn ceilings come from a RECORDED BASELINE, not from a number someone guessed.
     A guessed ceiling either never fires or fires constantly; neither catches drift.
  2. The suite itself must be proven to fail. See "Verify the suite" at the bottom — a suite
     that has never gone red has never been tested, and Phase 10 does not end until it has.

Every run costs real money. Tell the user roughly how much before they wire it anywhere.
-->

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { permissions, hooks } from "./control.js";

const BASELINE = "eval-baseline.json";
// How far a case may drift above its recorded baseline before it fails.
const MARGIN = {{DRIFT_MARGIN}}; // e.g. 1.5
// Absolute floor on the turn check. Measured: identical inputs came back at 2 and 5 turns, and
// at 4 and 7, on a suite that had not changed. A multiplier alone on a small turn count fails
// on ordinary variance and trains people to ignore the suite. Cost is smoother and needs no
// floor; turns do.
const TURN_SLACK = {{TURN_SLACK}}; // e.g. 3

type Observed = {
  text: string;
  subtype: string;
  turns: number;
  costUsd: number;
  denials: number;
};

type Case = {
  name: string;
  input: string;
  // Assert on effects and structure — they are about the world and the shape, not the
  // wording, so a different-but-correct trajectory still passes.
  check: (r: Observed) => string | null; // null = pass, string = the reason it failed
};

const cases: Case[] = [
  {
    name: "happy path",
    input: {{A_REAL_INPUT}},
    check: (r) => ({{WHAT_MUST_BE_TRUE_AFTERWARDS}}) ? null : "{{WHY_IT_FAILED}}",
  },
  {
    name: "hard input",
    // The ambiguous one, the empty one, the one with a legitimate reason to refuse.
    input: {{THE_AWKWARD_INPUT}},
    check: (r) => ({{DID_IT_DO_SOMETHING_SENSIBLE_RATHER_THAN_CONFIDENTLY_WRONG}}) ? null : "{{WHY}}",
  },
  {
    name: "must be blocked",
    // Points at something control.ts forbids. The only test of the part of the design that
    // exists for when the model is wrong, and the only way to notice that a deny rule stopped
    // matching after a refactor moved a path.
    //
    // Assert on the EFFECT, not on r.denials: a read blocked by a scoped deny rule under
    // dontAsk was measured producing an EMPTY denials array, so a check built on that alone
    // passes whether or not the rule still works. Denials are corroboration, never proof.
    //
    // The input must make the agent ACTUALLY ATTEMPT the forbidden action. Measured: a
    // single-file phrasing made the agent stop and ask for an absolute path instead, so the
    // case passed identically with and without the deny rule — a green tick testing nothing.
    // Give it a reason to go looking: name a permitted file alongside the forbidden one, or
    // start with a listing step. The mutation table below is how you find this out.
    input: {{AN_INPUT_THAT_SHOULD_HIT_A_DENY_RULE}},
    check: (r) =>
      {{THE_FORBIDDEN_CONTENT_IS_ABSENT_OR_THE_PROTECTED_FILE_IS_UNCHANGED}}
        ? null
        : "the control surface let it through",
  },
];

async function run(c: Case): Promise<Observed> {
  let text = "";
  let subtype = "no result";
  let turns = 0;
  let costUsd = 0;
  let denials = 0;

  for await (const message of query({
    prompt: c.input,
    options: {
      systemPrompt: `{{THE_SAME_SYSTEM_PROMPT_THE_HARNESS_USES}}`,
      // Pin the model. An eval whose model floats is measuring two things at once.
      model: "{{MODEL_ID}}",
      cwd: {{AN_ISOLATED_FIXTURE_DIRECTORY}},
      ...permissions,
      hooks,
      maxTurns: {{TURN_CAP}},
      maxBudgetUsd: {{BUDGET_CAP}},
    },
  })) {
    if (message.type === "assistant") {
      for (const block of message.message.content) if ("text" in block) text += block.text;
    } else if (message.type === "result") {
      subtype = message.subtype;
      turns = message.num_turns;
      costUsd = message.total_cost_usd;
      denials = message.permission_denials.length;
    }
  }

  return { text, subtype, turns, costUsd, denials };
}

// --- baseline -------------------------------------------------------------
// Recorded, not guessed. `--update-baseline` rewrites it; every other run compares against it.
// Committing this file is what turns "it passed" into "it did not get worse".

type Baseline = Record<string, { turns: number; costUsd: number }>;

const updating = process.argv.includes("--update-baseline");
const baseline: Baseline =
  !updating && existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};

function drift(name: string, r: Observed): string | null {
  const prior = baseline[name];
  // No baseline yet: report, do not fail. A first run has nothing to have got worse than.
  if (!prior) return null;
  const turnCeiling = Math.max(Math.ceil(prior.turns * MARGIN), prior.turns + TURN_SLACK);
  if (r.turns > turnCeiling)
    return `turns ${r.turns} over ceiling ${turnCeiling} (baseline ${prior.turns})`;
  if (r.costUsd > prior.costUsd * MARGIN)
    return `cost $${r.costUsd.toFixed(4)} over baseline $${prior.costUsd.toFixed(4)} x${MARGIN}`;
  return null;
}

// --- run ------------------------------------------------------------------

let failed = 0;
let spent = 0;
const recorded: Baseline = {};

for (const c of cases) {
  // {{RUN_ONCE_OR_N_TIMES_AND_REQUIRE_A_PASS_RATE}} — decide this before shipping, and write
  // the policy in the README. Two runs of one case can legitimately disagree.
  const r = await run(c);
  spent += r.costUsd;
  recorded[c.name] = { turns: r.turns, costUsd: r.costUsd };

  const reason = c.check(r) ?? drift(c.name, r);
  if (reason) {
    failed += 1;
    console.error(`FAIL ${c.name}: ${reason}`);
    console.error(`      subtype=${r.subtype} turns=${r.turns} denials=${r.denials}`);
  } else {
    const prior = baseline[c.name];
    const delta = prior ? ` (baseline ${prior.turns}t $${prior.costUsd.toFixed(4)})` : " (no baseline)";
    console.log(`pass ${c.name} — ${r.turns}t $${r.costUsd.toFixed(4)}${delta}`);
  }
}

if (updating) {
  writeFileSync(BASELINE, JSON.stringify(recorded, null, 2) + "\n");
  console.log(`baseline written to ${BASELINE}`);
}

console.log(`${cases.length - failed}/${cases.length} passed, $${spent.toFixed(4)} spent`);
if (failed > 0) process.exitCode = 1;
```

## Verify the suite

**A suite that has never gone red has never been tested.** Before handing off, break the thing
each case is supposed to catch and confirm that case fails:

| Break this | This case must go red |
| --- | --- |
| Remove the deny rule from `control.ts` | `must be blocked` |
| Change the system prompt to omit the required output | `happy path` |
| Set `MARGIN` to a value below 1 | every case with a baseline |

Then put it back. A case that stays green while its subject is broken is worse than no case: it
is a green tick standing in for coverage that does not exist. This takes one run each and it is
the only evidence that the suite works.

## Baseline hygiene

- Commit `eval-baseline.json`. Uncommitted, every checkout has no baseline and drift detection
  silently does nothing.
- Regenerate it deliberately (`--update-baseline`), never to make a red run go green. A cost
  regression you baseline away is a cost regression you have accepted without deciding to.
- Regenerate after an intentional change — a new model, a rewritten prompt — and say so in the
  commit, because the numbers moving is the point rather than a surprise.

## Fixtures

Point `cwd` at a fixture directory the suite owns, restored before each case. An eval that runs
against the working tree either fails on the second run because the first one already fixed
things, or edits the user's files. Both are bad; the second is worse.

If the fixture is a git repo, `git checkout -- .` between cases is usually enough and is easier
to trust than a copy.

## When a case fails intermittently

Investigate before quarantining. A case that passes four times in five is telling you something
real about the agent's reliability, and the run that fails is the one worth reading.

Never fix a flaky case by loosening the assertion until it always passes. That converts a real
signal into a green tick, which is worse than deleting the case outright — at least a deleted
case is honest about the coverage.

## Judgement assertions

For output whose quality is not mechanically checkable, a model can score it — but only where
effects and structure cannot reach, only with explicit written criteria rather than "is this
good", and never as the only assertion in the suite. Give the judge the criteria the user gave
you in Phase 1, verbatim where possible.
