# Operability

Used in Phase 5 when the repo is an existing project, and by the `oni-agent-improve` skill.

**Operability is not size.** A 60-file project can be far harder to work in than a 6,000-file
one. The axis that matters is: can someone arriving cold make a correct change and *know* it
was correct? Judge by that, not by file count.

## Diagnose from evidence

Every symptom below has a detection method. Run it. A diagnosis you inferred from the shape of
the directory tree is a guess, and the user will recognise it as one.

### No verification path

**Detect:** no test framework in the manifest, no test job in CI, and no documented
"how you know it worked". Files named `*Test*` that are compiled into the app are runtime
diagnostics, not a suite.

**Why it dominates everything else:** without it, every change is unfalsifiable. A session will
make a plausible edit, declare success, and be wrong at a rate nobody measures. Fixing this is
worth more than any amount of documentation.

**Config fix:** document the actual verification ritual, with the observable signal — what to
run, what to watch, which log line means it worked.
**Code recommendation:** the narrowest possible automated check. One smoke test that exercises
the main path beats a coverage target nobody will hit.

### Knowledge concentrated in one large document

**Detect:** a README (or wiki) over ~300 lines carrying architecture, invariants and procedure
together.

Long docs are read by humans once and grepped by sessions forever. The invariants inside them
are the part that matters and the part least likely to be found.

**Config fix:** leave the document alone — it is the human-facing source of truth and it is
maintained. Extract only the *agent-facing* parts into scoped rules, and cite the document by
section (`README.md § "How a tick works"`) rather than restating it. Two copies drift, and the
drift is invisible.

### Implicit invariants

**Detect:** comments explaining why code is arranged unusually — "must run before X", "do not
reorder", "keep this hand-written because…". Grep for `NOTE`, `HACK`, `WARNING`, `do not`,
`must be`, `before any`. Check build files too; invariants hide in project configuration where
nobody looks for them.

This is the single highest-value extraction available in an existing project. These constraints
are load-bearing, they are enforced by nothing, and violating one produces a failure that looks
unrelated to the change that caused it.

**Config fix:** an `.claude/rules/invariants.md`, unscoped, one entry per constraint: what must
hold, what breaks if it does not, where it is enforced (usually: nowhere).

### No obvious entry point

**Detect:** more than one plausible `main`, or a framework where control starts somewhere
non-obvious. Ask: can you name the first line of your code that runs?

**Config fix:** name the entry point and trace the main loop in `CLAUDE.md`, in five lines.

### Everything touches everything

**Detect:** fan-in. For the top candidates, count how many files reference each symbol or
module. A single file imported by most of the codebase is a hazard whatever its quality.

```bash
git log --format= --name-only | sort | uniq -c | sort -rn | head -20
```

Churn ranking is the cheaper proxy: files that change in most commits are where the design is
under pressure.

**Config fix:** name the hazard explicitly — "`X` is imported by most of `src/`; changing its
signature is a repo-wide change" — and write the boundary rule.
**Code recommendation:** the seam that would break the coupling.

### "Where do I add X" has no answer

**Detect:** try it. Pick the project's most common unit of work and find where it goes. If it
takes more than a minute, or the answer is "copy the nearest similar thing", it is undocumented.

**Config fix:** a skill with the concrete recipe, naming real paths and the step people forget.

### Ambiguous naming

**Detect:** sibling directories with the same name at different levels
(`src/Services/Objects` and `src/Models/Objects`), or names that describe a layer rather than a
responsibility.

**Config fix:** one line each on what the distinction actually is.
**Code recommendation:** a rename, if the distinction turns out not to exist.

### Every run needs external state

**Detect:** the app needs a live service, a device, a game client, real credentials.

**Config fix:** document the setup ritual precisely, and mark "run it" as **not** a free
verification step — a session must know that running has real side effects.
**Code recommendation:** an offline or fake mode. If the project already has a sample fixture,
it is halfway there and nobody wrote down how to use it.

## What to produce

Split by what this skill is allowed to do.

**Config — write it (on approval, as normal):**

- A **subsystem map** in `.claude/README.md`: each area, its purpose, its entry point, its
  invariants, its blast radius. This is the artifact that makes a complex project navigable,
  and it is what a session reads instead of re-deriving the architecture every time.
- `.claude/rules/invariants.md` — the implicit constraints, made explicit.
- A documented verification path.
- Skills for the repeated units of work.
- Boundary rules.

**Code — recommend only. Never edit.**

Write recommendations as a decision record with `Status: Proposed`, one per recommendation,
using `templates/decision-record.md`. Each needs: the symptom and its evidence, the smallest
change that would fix it, what it would cost, and what happens if it is never done. Then stop.

The user asked for agent configuration. A restructuring proposal is useful; an unrequested
restructuring is a betrayal of scope, and in an existing project with no tests it is dangerous
as well — there is no way to prove the refactor preserved behaviour.

## Ranking

Order recommendations by *sessions unblocked per unit of effort*, and say the ordering out loud.

1. **Verification path** — everything else compounds on it
2. **Invariants** — cheap to extract, prevents the failures that look unrelated
3. **Subsystem map** — one artifact, large navigational payoff
4. **Unit-of-work recipes** — turns the most frequent task from exploration into procedure
5. **Boundary rules** — prevents slow decay
6. **Code restructuring** — highest cost, and the only category needing a working test suite
   first, which is why it comes last

Recommend the top two or three. A list of fifteen findings gets none of them done.
