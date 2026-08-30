# Choosing the substrate

Used in Phase 7, before any package is named. This is the feasibility gate for the whole
skill, and it is the one question that cannot be revisited cheaply later.

The mistake this file exists to prevent: reaching for the Agent SDK because it is the thing
named in the skill's title, on a job or a runtime where it cannot work or is not the shape
wanted. The sibling plugin's `feasibility.md` says a suggestion the user cannot act on is worse
than no suggestion. That applies to the substrate first.

## Four substrates

| | Who runs the loop | Who hosts | Tools available |
| --- | --- | --- | --- |
| **Agent SDK** | The SDK | You | Built-in file/shell/web set, plus yours, plus MCP |
| **Tool Runner** | The API SDK | You | Only tools you define |
| **Manual loop** | You | You | Only tools you define |
| **Managed Agents** | Anthropic | Anthropic | Anthropic-hosted sandbox, Skills, MCP, yours |

Only the manual loop makes *you* the author of the harness. The other three hand you one, at
different levels of abstraction.

## The gate — ask in this order

**1. Can this runtime spawn a subprocess?**

The Agent SDK ships a native binary and runs it as a child process — that is why the package
carries platform-specific optional dependencies and exposes options for pointing at a different
executable or supplying your own spawn function. Somewhere that cannot spawn a process, or
cannot ship a platform binary, cannot run it:

- edge runtimes and Workers
- serverless functions with no subprocess or a read-only filesystem
- locked-down containers, some CI sandboxes, some mobile and embedded targets

If the answer is no, the Agent SDK is out regardless of everything below. Say so plainly rather
than generating something that will fail on deploy.

**2. Does the agent need to act on a machine — read and write files, run commands?**

Yes, and you can host it → **Agent SDK**. This is what it is for; rebuilding that tool surface
by hand is weeks of work you would then own.

Yes, and you would rather not host or manage the sandbox → **Managed Agents**.

No — it only calls your own functions and APIs → keep going.

**3. Do you need to own the loop itself?**

Own means: custom context management or compaction, routing between models mid-run, a fallback
to a non-Anthropic provider, embedding the loop in a scheduler or actor runtime, or an
inspection and replay requirement that a closed loop cannot satisfy.

Yes → **manual loop**. This is the only substrate where the harness is genuinely yours, and
this skill generates it.

No → **Tool Runner**. It drives request → execute → loop over the tools you define, with
per-turn hooks for approval, interception and retries, and you write nothing but the tool
functions.

**4. Does it need to run on a schedule, keep state between runs, or survive without a process
of yours staying alive?**

That pulls toward **Managed Agents** even if step 2 said no — Anthropic runs the loop and the
sandbox, agent configs are versioned objects, and sessions and scheduled firings are part of
the platform rather than something you build.

## What this skill generates for each

| Substrate | Generated | Templates |
| --- | --- | --- |
| Agent SDK | Entry point, tools, control surface | `agent.ts.md`, `agent-service.ts.md`, `tools.ts.md`, `control.ts.md` |
| Tool Runner | Entry point with the runner and your tools | `loop.ts.md` (first half) |
| Manual loop | The loop itself, written out | `loop.ts.md` (second half) |
| Managed Agents | **Nothing.** | — |

Managed Agents is a REST platform, not a library, and configuring it is a different task from
scaffolding a program. If the gate lands there, say so, explain why it fits better than what
this skill builds, and stop. Generating an Agent SDK harness for a job that wanted Managed
Agents is the expensive mistake; naming it and stopping is the cheap one.

## Reporting the decision

Whichever way it goes, put it in the Phase 8 proposal with the reason and — this matters — the
substrates you ruled out and why. The user will consider them anyway; doing it in front of them
saves a round trip and shows the check was run.

> Considered the Tool Runner; ruled out because the job is "fix failing tests in this repo",
> which needs file editing and shell access, and rebuilding that surface by hand is the work
> the Agent SDK already did.

## Two things not to confuse

**Tool Runner is not the Agent SDK.** They sound alike and are different packages. The Tool
Runner lives inside the regular Anthropic API SDK and loops over tools *you* define — no
filesystem, no shell, no built-ins. The Agent SDK is Claude Code as a library.

**Neither one is a deployment.** Agent SDK, Tool Runner and manual loop are all harness-only:
you host and deploy them. Managed Agents is the only option that adds hosting.
