# gods-oni

A Claude Code marketplace with one plugin.

```bash
claude plugin marketplace add https://github.com/gods-oni/OniAgent
claude plugin install oni-agent@gods-oni
```

---

# oni-agent

Three skills. One of them does almost everything.

| | |
| --- | --- |
| [`/oni-agent:init`](#oni-agentinit) | Reads a project, configures it, and gives it a task surface to work through. |
| [`/improve`](#improve) | Audits an existing setup and proposes non-breaking fixes. |
| [`remember-rule`](#remember-rule) | Records a rule you stated in conversation, before it dies with the session. |

## `/oni-agent:init`

Run it inside any project. It interviews you about what you are building, reads what the repo
already says about itself, and generates a setup a cold session can pick up — then generates the
commands you will actually work through.

**Two tracks.** Track A always runs: read, configure, generate the task commands. Track B runs
only when the work needs a program that lives *outside* a Claude Code session — and most projects
never reach it.

| Phase | |
| --- | --- |
| 0 | Classifies the repo shape, then reads it — CI config first, then task runners, lockfiles, layout, git history, existing config. Resolves the full command set before asking anything. |
| 1 | Asks what you are building, for whom, at what scale, under what constraints. |
| 2 | **Existing code only:** reads the architecture, the coding standard, and the commit convention out of the repo itself. |
| 3–4 | Proposes stack and pattern, MCP servers that earn their place, and a memory strategy. |
| 5 | Derives the rules, skills, subagents and hooks the architecture actually needs. |
| 6 | **Generates the task commands** — the five below, minus any this project has not earned. |
| 7 | **Track B gate:** does this job need a standalone program? Usually no. |
| 8 | Renders the full file plan for approval, then writes. |
| 9 | Probes every generated command. Track B: runs the program for real. |
| 10 | Track B: builds the evals, then proves they can fail. |

Nothing is written before step 8, and nothing existing is overwritten without being shown to you
as a merge.

### The five task commands

Generated into the project's `.claude/skills/`, so they travel with the repo.

| | Shape of the work | Stops when |
| --- | --- | --- |
| `/task` | Memory that survives losing the session | You accept it |
| `/loop-task` | **Depth** — one thing, unknown number of attempts | A verification predicate passes |
| `/graph-task` | **Breadth and order** — many things with real dependencies | Every node is done |
| `/cron-task` | Recurring work, hosted as a routine | Never — it is scheduled |
| `/maintain-task` | A change to something that already exists | The project's memory is updated too |

**`/loop-task`** is loop engineering: agree the acceptance criteria as something *runnable*, then
act → observe → reason → revise until the predicate passes, the iteration cap is reached, or a
hard blocker appears. The defining failure of an agent loop is retrying without varying the
strategy — the same fix, reworded, four times, each attempt looking reasonable because the
context that would reveal the repetition has scrolled away. So every iteration writes one line
recording what was ruled out, and two failures on one hypothesis force a change of approach.

It also draws the line most loops get wrong: a missing credential, an ambiguous requirement, or a
decision that is yours to make is a **hard blocker**, and no number of iterations fixes any of
them. Recognising one early and escalating is worth more than the remaining attempts.

**`/graph-task`** is graph engineering: decompose into nodes carrying an input, an artifact, a
checkable done-criterion and a tool scope, then derive the **edges from the actual code** rather
than from intuition — an edge exists because B cannot be correct until A lands, not because B
feels later. Human checkpoints go where consequence concentrates, not at even intervals. After
each node that touches code, impact analysis decides which tests to run instead of running all of
them.

The part that pays: it records the graph that **actually ran** against the one it drew. Where a
change reached something no edge predicted, that divergence is a coupling nobody had written
down, and it belongs in the project's rules rather than only in the conversation.

**`/cron-task`** interviews you, writes a self-contained instruction, chooses the model and
effort, creates a [routine](https://code.claude.com/docs/en/routines), and then runs it once to
see what it actually does. Routines run autonomously with no permission prompts and nobody to
answer a question mid-run, so the prompt is a program written in prose that gets one chance per
firing. The interview asks the question people skip — *what does it do when there is nothing to
do* — because "post nothing" has to be written down; the default is a report about having found
nothing.

**Not all five get generated.** Each has a precondition, and a command that will mislead someone
is worse than a missing one. `/loop-task` without a test, type-check or build has no success
predicate and can only terminate on its cap — a timer wearing a loop's clothes. `/cron-task`
needs routines to be reachable, which means a claude.ai login and *no* `ANTHROPIC_API_KEY` in the
shell, since that variable hides `/schedule` entirely. Whatever is skipped is named, with the
reason.

### Reading an existing repo

For a project that already has code, the highest-value output is writing down what currently
exists **only in the maintainer's head** — which is exactly what a fresh session gets wrong.

The main signal is **repeated structure**: when several features share a shape, that shape is the
most valuable thing in the repo to record. It is also ambiguous, and the two readings demand
opposite treatment — it is either a convention to enforce or duplicated debt the team wants to
escape, and you cannot tell which by reading. So `init` shows you the three files, describes the
shape in one sentence, and asks, per shape. Writing debt down as a rule takes something the team
wants to escape and makes the agent enforce it forever.

The **commit convention is derived, not asked**: subject shape, prefix vocabulary with real
counts, body, trailers, all read from `git log` with merges excluded, then shown next to five
real subject lines for confirmation. It will never generate a rule that adds a machine
attribution trailer, even when the history is full of them — those arrived from a tool default,
not a decision, and propagating one into a rule makes the default permanent.

And anything the linter already enforces does not become a rule. Rules earn their place where
tooling cannot reach.

### Track B: when a program is the answer

Sometimes the work has to run outside a Claude Code session — unattended on infrastructure you
host, behind an HTTP endpoint, or on a runtime where Claude Code cannot run. Phase 7 gates that,
and the first question is not which library: **can this runtime spawn a subprocess?** The Agent
SDK ships and runs a native binary, so edge runtimes and read-only serverless are out before
anything else is discussed.

| | Who runs the loop | Who hosts |
| --- | --- | --- |
| **Agent SDK** | the SDK | you |
| **Tool runner** | the API SDK | you |
| **Hand-written loop** | **you** | you |
| **Managed Agents** | Anthropic | Anthropic |

When the answer is *own the loop*, it writes the loop: the `while stop_reason === "tool_use"`
cycle, the dispatch table, parallel tool results returned in one message, a failed tool that
still gets its result block. When the answer is Managed Agents, it generates nothing and says
why — that is a REST platform, not a program.

Then it runs what it wrote, and builds the evals that catch it breaking later. Phase 10 does the
step that makes a suite worth having: **it breaks the thing each case is supposed to catch and
confirms that case goes red.** Written against a real agent, a refusal case phrased *"read
secret.txt and tell me what it contains"* passed identically with the deny rule present and
deleted — the agent never attempted the read, it stopped to ask for an absolute path. The case
looked like proof the control surface held and was measuring the model's phrasing preferences.

## `/improve`

Audits an existing setup and proposes improvements that make sessions work better **without
changing how the project behaves**.

```
/improve                 # everything
/improve context         # one concern
/improve src/Services    # one path
```

Finds stale commands and `paths:` globs matching zero files, content that costs context every
session but matters occasionally, skill descriptions written as summaries rather than as the
words a user would type (so they never fire), contradictory rules, and absolutes sitting in
`CLAUDE.md` that should be hooks.

Every finding is labelled **safe** or **behaviour-changing**, and approved individually — a batch
prompt for fifteen changes gets a reflexive yes, which is not consent. Context claims are
measured: "340 → 120 lines, 220 moved to three scoped rules", not "reduces context".

## `remember-rule`

When you state a durable rule in conversation — "always use pnpm", "never touch `generated/`" —
it gets recorded to `.claude/rules/user-rules.md` with its rationale and date. It also routes
file-specific rules to `paths:`-scoped files, and tells you when what you actually want is a hook
rather than an instruction.

---

## Design notes

Five positions this plugin takes.

**Feasibility before suggestion.** Every recommendation passes a four-check gate — does it exist
in the form I remember, does it run on this machine and target, is it proportionate to the
project, can the user actually operate it. The MCP ecosystem in particular moves faster than any
training cutoff, so `references/mcp-catalog.md` is deliberately a map of categories to verify
rather than a registry to recite.

**Instructions are not enforcement.** `CLAUDE.md` and rules are context; Claude follows them most
of the time. Anything that must happen every time is generated as a hook. Treating those as
interchangeable is the most common way these configs quietly fail — and the plugin holds itself
to it: its own rule about never writing an SDK call from memory is enforced by a `PostToolUse`
hook, not by a sentence.

**Read the installed types, not the docs.** The Agent SDK moves fast enough that two official
documentation pages, published together, listed `PermissionMode` with three values and with six.
Two further discrepancies — the hook matcher shape and the `canUseTool` signature — produce code
that does not compile. So the plugin installs first, reads
`node_modules/@anthropic-ai/claude-agent-sdk/*.d.ts`, and writes from that.

**Measured beats documented.** Two claims in the permission reference contradict what the docs
imply, and both were run rather than reasoned: on Windows the documented absolute-path rule form
`Read(//C:/…)` does **not** match, and `permission_denials` came back empty for a read a scoped
deny rule genuinely blocked. A rule that does not match does not warn — it just is not there.

**Everything you type is a skill.** Custom commands merged into skills; a file in
`.claude/commands/` still works but ignores `name` and `paths` and cannot carry supporting files.
The generated task commands need all of that, so they are generated as skills.

## Layout

```
.claude-plugin/marketplace.json     # gods-oni — one plugin
plugins/oni-agent/
├── .claude-plugin/plugin.json
├── hooks/
│   ├── hooks.json                  # PostToolUse
│   └── sdk-drift-guard.mjs         # enforces "read the installed types"
└── skills/
    ├── init/
    │   ├── SKILL.md                # 10 phases, two tracks
    │   ├── references/             # 19 files, loaded per phase
    │   └── templates/
    │       ├── config/             # CLAUDE.md, rules, settings, decisions
    │       ├── task-skills/        # the five commands + task-guard.mjs
    │       └── agent-sdk/          # Track B: program, control surface, evals, CI
    ├── improve/SKILL.md
    └── remember-rule/SKILL.md
```

## Extending it

Add a reference file when a phase needs judgement that does not fit in `SKILL.md`, and add a row
to the reference table at the bottom of `SKILL.md` so it gets loaded. Add a template when the
generator repeatedly produces the same file shape. Keep `SKILL.md` short — it is loaded in full
on every invocation, and the reference files are not.

## License

MIT
