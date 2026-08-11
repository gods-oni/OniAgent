---
name: remember-rule
description: Record a durable rule the user stated in conversation into .claude/rules/user-rules.md so it survives the session. Use when the user says "always X", "never Y", "from now on Z", "remember to X", "stop doing Y", "don't ever X", "make sure you always X", or corrects the same behaviour a second time — and also when they explicitly ask to remember a rule or add one to the rules file.
---

# Remember rule

The user just stated a rule. Left in the transcript, it dies at the end of the session and
they have to say it again next week. Put it where every future session will read it.

## Is it actually a rule?

Record it when it is a **standing instruction about how to work in this project**, expected to
hold beyond the current task.

| Record | Do not record |
| --- | --- |
| "Always use pnpm, never npm" | "Use pnpm for this install" |
| "Never edit files in `generated/`" | "Skip that file for now" |
| "Prefer named exports" | "Rename this to `getUser`" |
| "Run the linter before you say you're done" | "Run the linter" |
| The same correction, stated twice | A one-off preference for this diff |

The distinguishing test is scope in time, not phrasing. "For now", "in this file", "just this
once" mark a local instruction. "Always", "never", "from now on", "stop", "remember" mark a
durable one.

When it is genuinely ambiguous, ask — one short question. Do not silently record something the
user meant for one task; a rules file that accumulates task-specific noise stops being read,
which loses the real rules too.

## Where it goes

**Default: `.claude/rules/user-rules.md`** — append. Loaded every session.

Three cases divert:

- **It applies only to certain files.** Put it in a rule file with `paths:` frontmatter
  (`.claude/rules/<topic>.md`) so it costs no context until relevant. Tell the user where it
  went. Create the file if there is no fitting one.
- **It must happen deterministically, every time, regardless of what the model decides** —
  "always format after editing", "never let me commit without tests passing". A rule file is
  context, not enforcement, and will be followed most of the time but not all of it. Say this
  plainly and offer a hook in `.claude/settings.json` instead. Record it as a rule as well;
  the two are complementary, not alternatives.
- **It is about the user across all projects, not this project.** That belongs in
  `~/.claude/CLAUDE.md` or `~/.claude/rules/`. Confirm before writing outside the project.

If `.claude/rules/user-rules.md` does not exist, create it with the header, then append.

## Entry format

```markdown
## Use pnpm, never npm
The lockfile is `pnpm-lock.yaml`; npm rewrites it and breaks CI.
**Why:** stated by user, 2026-08-11 — CI installs with `--frozen-lockfile`.
**Added:** 2026-08-11
```

- **Title** — short imperative, so the file scans.
- **Body** — concrete enough to verify. "Use 2-space indent" beats "format nicely".
- **Why** — carry over the user's reason if they gave one; write "not stated" if they did not.
  Never invent a rationale. A wrong "why" is worse than a missing one because it gets applied
  at the edges where the real reason would not have reached.
- **Added** — today's date, absolute, never "yesterday" or "last week".

## Before appending

Read the existing file. Then:

- **Duplicate** — already covered? Do nothing, and say so.
- **Refinement** — narrows or extends an existing rule? Edit that entry rather than adding a
  near-duplicate, and update its date.
- **Contradiction** — the new rule reverses an existing one? Do not stack both. Replace the old
  entry and tell the user what it replaced. Two contradictory rules in one file mean the next
  session picks one arbitrarily.

## After writing

Confirm in one line: the rule, and the file it went to. Then continue the work that was
interrupted — recording a rule is not the task, it is a side effect of the user mentioning one.

If the rule applies to what you are doing right now, apply it now too. Recording it and then
carrying on with the old behaviour in the same turn is the version of this that annoys people.
