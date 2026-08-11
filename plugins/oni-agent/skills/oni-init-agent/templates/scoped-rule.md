<!--
TEMPLATE — a path-scoped rule file, e.g. .claude/rules/testing.md

Scoped rules cost zero context until Claude reads a matching file. Prefer this over adding
lines to CLAUDE.md whenever the guidance is not universally relevant.

Glob notes that bite:
- `src/**/*.{ts,tsx}` — brace expansion works, but each group multiplies the pattern count
  against a 1,000-pattern budget shared by the whole `paths:` list.
- A `[` that is not a valid bracket expression makes that pattern match nothing. Escape a
  literal one as `\[`.
- Patterns match against the repo-relative path.

Delete this comment block in the output.
-->
---
paths:
  - "{{GLOB_1}}"
  - "{{GLOB_2}}"
---

# {{TOPIC}}

<!-- Every line here must prevent a specific mistake. If you cannot name the mistake a rule
     prevents, delete the rule — it is costing attention and buying nothing. -->

- {{RULE_1}}
- {{RULE_2}}

## Example

{{SHORT_CORRECT_EXAMPLE_FROM_THIS_CODEBASE}}
