# The three harness shapes

Used in Phase 7. Pick one. The shape is not a style preference — it decides the prompt type,
the option set, the failure mode, and what "done" even means.

## The distinguishing question

**Who is present while the agent works, and what happens after it stops?**

| | Nobody, and it exits | A person, turn by turn | Nobody now, someone later |
| --- | --- | --- | --- |
| Shape | **One-shot** | **Interactive** | **Service** |

That is the whole taxonomy. Everything below follows from it.

## One-shot

Runs once on a fixed input, does the work, exits with a status. A person reads the result
afterwards, or a machine reads the exit code.

Fits: CI checks, scheduled jobs, batch fixes, "review this diff", "regenerate these docs",
anything invoked by a script.

- **Prompt** — a string, assembled from arguments and files before the loop starts.
- **Permission mode** — no human is there to answer a prompt, so a mode that prompts will
  hang or silently deny. Decide the tool surface up front and pick a non-prompting mode.
- **Limits are mandatory, not optional.** Nobody is watching it spend. Set a turn cap and a
  budget cap; an unbounded loop with no observer is the defining failure of this shape.
- **Exit code is the interface.** Map the terminal result to a process exit status, or the
  caller cannot tell success from failure. This is the single most-skipped line in a one-shot
  harness.
- **Failure mode** — it hangs waiting for an approval that will never come, or it burns budget
  in a loop nobody sees.

## Interactive

A person is at the keyboard. The agent works, reports, and takes the next instruction.
Approvals happen in real time; trust can be extended mid-session.

Fits: a CLI assistant, a chat surface, a REPL over a codebase, anything where the value is in
the back-and-forth.

- **Prompt** — a stream, not a string. The prompt is an async iterable of user messages, which
  is what lets the session continue rather than restart.
- **Approvals** — this is the shape where a `canUseTool` callback earns its place, because
  there is someone to ask. Read `control.md` first: a tool auto-approved earlier in the flow
  never reaches that callback, which is the most common reason an approval prompt "does not
  fire".
- **Permission mode can change mid-session.** Start restrictive; loosen once the user has seen
  the approach and agreed with it. The query object exposes a setter for this.
- **Streaming is the product.** Print reasoning and tool calls as they arrive. A shape defined
  by a person watching, that shows nothing until it finishes, has thrown away its reason to
  exist.
- **Failure mode** — approvals that never surface, or a wall of raw message objects instead of
  readable progress.

## Service

Long-lived process. Requests arrive over time, possibly from different people, and a
conversation resumes across them. State outlives any single loop.

Fits: a bot answering in a channel, an HTTP endpoint backed by an agent, a queue worker with
memory of prior items, a multi-user assistant.

- **Sessions are the design.** Persist a session id per conversation and resume it; fork it
  when a branch should not contaminate the original. Everything else in this shape is
  bookkeeping around that.
- **Concurrency is yours to handle.** Two requests on one session id will interleave. Decide
  the policy — queue per session, reject, or fork — and write it down; it will not decide
  itself.
- **Nobody is watching a given run**, so the one-shot rules apply again: turn caps, budget
  caps, and a real answer for what happens when the loop fails mid-request.
- **Isolation.** Requests from different people must not share a working directory or read each
  other's files. If the tool surface includes file access, this is a security property, not a
  tidiness one.
- **Failure mode** — sessions that grow without bound, or one user's run reading another's
  files.

## Mismatch signals

The user's instinct and the Phase 1 answers disagree more often than you would expect. Check:

- They said "interactive", but the invoker is CI, a cron, or a webhook. → **One-shot.** There
  is nobody to approve anything.
- They said "one-shot", but described a conversation, or "and then I tell it to fix the ones I
  pick". → **Interactive.**
- They said "one-shot", but it must remember previous runs. → **Service.** A one-shot with a
  hand-rolled state file is a service with the session machinery removed.
- They said "service", but each request is independent and stateless. → **One-shot**, invoked
  per request. Sessions you never resume are cost without benefit.
- They described several agents fanning out over subtasks. → Still one of these three at the
  top level; the fan-out is subagents *inside* it, not a fourth shape.

## Choosing under uncertainty

Prefer **one-shot**. It is the smallest thing that can be run end to end, and the other two are
reachable from it: interactive adds a stream and a callback, service adds session persistence.
Starting at service and discovering the job was one-shot means deleting the part that was hard
to write.
