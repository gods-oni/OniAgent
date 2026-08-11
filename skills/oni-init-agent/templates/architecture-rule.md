<!--
TEMPLATE — .claude/rules/architecture.md for the target project.

Unscoped (no `paths:`) because boundaries apply everywhere. This is the rule file that
prevents the most damage, so it must be concrete: name real directories, real module names,
real import directions. A generic restatement of hexagonal architecture helps nobody.

Delete this comment block in the output.
-->

# Architecture

## Pattern

{{PATTERN_NAME}} — {{WHAT_IT_MEANS_HERE_IN_TWO_SENTENCES}}

## Module boundaries

{{THE_IMPORT_RULE}}

Allowed:

- `{{MODULE_A}}` → `{{MODULE_B}}`

Not allowed:

- `{{MODULE_B}}` → `{{MODULE_A}}` — {{WHAT_BREAKS_IF_YOU_DO}}

## Where things go

| Adding… | Goes in | Notes |
| --- | --- | --- |
| {{UNIT_OF_WORK_1}} | `{{PATH}}` | {{CONSTRAINT}} |
| {{UNIT_OF_WORK_2}} | `{{PATH}}` | {{CONSTRAINT}} |

## I/O

{{WHERE_SIDE_EFFECTS_ARE_ALLOWED_AND_WHERE_THEY_ARE_NOT}}

## Errors

{{HOW_ERRORS_ARE_REPRESENTED_AND_PROPAGATED}}

## Extending this

{{THE_STEP_PEOPLE_FORGET_WHEN_ADDING_SOMETHING_NEW}}
