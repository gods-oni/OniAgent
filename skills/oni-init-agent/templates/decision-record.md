<!--
TEMPLATE — .claude/decisions/NNNN-slug.md

One per significant choice made during the interview: stack, pattern, MCP servers, memory
strategy. Number sequentially from 0001. Never edit a past record — supersede it with a new
one and mark the old one Superseded.

The "Rejected" section is the point of the whole file. Anyone can read the repo to see what
was chosen; nothing but this records what was not, and why. Delete this comment block.
-->

# {{NNNN}}. {{TITLE}}

- **Date:** {{YYYY-MM-DD}}
- **Status:** Accepted
- **Decided by:** {{WHO}}

## Context

{{WHAT_FORCED_A_DECISION — the constraint, not the preference}}

## Decision

{{WHAT_WAS_CHOSEN}}

## Rejected

**{{ALTERNATIVE_1}}** — {{WHY_NOT, specific to this project}}

**{{ALTERNATIVE_2}}** — {{WHY_NOT}}

## Consequences

Accepted costs:

- {{COST_WE_ARE_LIVING_WITH}}

This decision should be revisited if:

- {{THE_CONDITION_THAT_WOULD_INVALIDATE_IT}}

<!--
VARIANT — code restructuring recommendation (`Status: Proposed`).

Used when an operability diagnosis finds that the real fix is in the code. This skill writes
agent configuration only, so the recommendation is recorded and left for the user to act on.
Nothing is edited.

Replace the sections above with:

  ## Symptom
  {{WHAT IS HARD TODAY, and the evidence that established it — the churn ranking, the fan-in
  count, the grep that found the invariant. Not an impression.}}

  ## Smallest change that would fix it
  {{THE NARROWEST INTERVENTION, not the ideal architecture. One seam, one split, one fake.}}

  ## Cost
  {{EFFORT, AND WHAT IT PUTS AT RISK. In a project with no test suite, say so plainly: there
  is no way to prove the change preserved behaviour, which is itself an argument for doing the
  verification work first.}}

  ## If it is never done
  {{WHAT KEEPS COSTING. A recommendation without this reads as a preference, and gets ignored.}}

Set `Status: Proposed`. Do not mark it Accepted on the user's behalf.
-->

