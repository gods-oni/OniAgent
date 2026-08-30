# Verification

Used in Phase 9. This phase is the reason the skill exists in this form: unlike a configuration
generator, which can only probe that commands resolve, a harness generator can **run its own
output**. Not doing so throws away the only real evidence available.

## Run it

A type-check is not a run. A syntax check is not a run. The failures this phase catches — a
missing credential, an option that does not exist in the installed version, a tool whose schema
the model cannot fill, a permission mode that hangs waiting for an approver who is not there —
are all invisible until the loop actually turns.

1. Install, including optional dependencies. Confirm the Claude Code binary came with it.
2. Read the installed type declarations and reconcile them against what you wrote. Fix
   mismatches now, before spending a run on them. If the project has a `tsconfig.json`, a
   type-check is free and catches every moved option name at once — do it before step 4, not
   instead of it.
3. Pick a **real, small, safe** input. Real, because a stub exercises nothing. Small, because
   you are proving the loop turns, not doing the user's work. Safe, because this run has the
   tool surface and permission mode you just designed, pointed at the user's actual files.
4. Run it with the command that will go in the README, from the directory a user would run it
   from.
5. Watch the whole run. Do not sample the first lines and declare victory.

## Reading the outcome

| What you see | What it means |
| --- | --- |
| Reaches a terminal result, does the work | Working. Report it plainly. |
| Authentication error | Not a code defect. Name the exact variable and the shell it must be set in. Do not present the harness as working. |
| Hangs with no output | Almost always a permission mode that prompts with nobody to answer. Back to `control.md`. |
| Runs, then does nothing useful | The prompt or the tool surface, not the plumbing. The loop worked; the design did not. |
| No binary / spawn failure | The optional-dependency trap in `sdk-surface.md`. |
| An option is rejected | Hard rule 1 was skipped. Read the declarations and fix every other option too, not just the one that failed. |

Report the command, the output, and the exit status. If it did not run clean, say so with the
output attached. A harness reported as working that has not run is the worst outcome this skill
can produce — worse than an obvious failure, because the user stops checking.

## Cold-start test

The generated directory has to stand on its own. Someone who was not in this conversation,
given only that directory, should be able to answer these six without asking:

1. **How do I run it?** The exact command, from the right directory.
2. **What does it need in the environment?** Which variables, and where they must be set —
   including the fact that a `.env` file is not read unless the code reads it.
3. **What can it touch?** Which directories, which tools, which external services.
4. **What can it never do, and what stops it?** Not "the prompt says so" — the deny rule or the
   hook, named.
5. **When does it stop?** Turn cap, budget cap, terminal condition, or the person closing it.
6. **Where do I look when it goes wrong?** Output, exit status, logs.

Answers 1, 2, 5 and 6 live in the generated README. Answers 3 and 4 live in the code, and the
README points at the file. If an answer is missing, the harness is incomplete regardless of how
well it ran.

## Generation discipline

- **No unfilled `{{PLACEHOLDER}}` in output.** Grep for it before handing off.
- **No file that would read identically for another job.** A prompt that says "You are a helpful
  assistant. Complete the task." means Phase 1 did not do its work. The system prompt, the tool
  descriptions and the deny rules should all be recognisably about *this* job.
- **No claim the code does not back.** If the README says the agent cannot write outside one
  directory, a deny rule or hook must make that true.
- **Nothing unrun.** Every command in the README was executed at least once during this phase.

## Hand off

One line on what was built, one line on what was verified and how, and the single next action
the user should take — most often supplying a credential, pointing the agent at a real input,
or widening the tool surface once they have seen it behave.

If anything was left unverified, name it and say why. "I could not test the failure path
without deleting real data" is honest and useful. Silence on it is not.
