# Operating the harness

Used in Phase 7. The parts that separate a demo from something that can run unattended: knowing
what it did, surviving what goes wrong, and stopping when it should.

A harness that runs once on your laptop needs none of this. A harness invoked by CI, a cron, or
a server needs all of it, and adding it later means rewriting the entry point.

## Read the result message

The terminal message is the whole observability surface, and most harnesses throw it away after
checking one field. Confirm the field names in the installed declarations; at the time of
writing the result carried:

| Field | Use |
| --- | --- |
| `subtype` | `success`, or which failure — see below |
| `result` | The agent's final text |
| `num_turns` | How much of the turn budget was used |
| `duration_ms` | Wall clock |
| `total_cost_usd` | Estimated cost of this run |
| `modelUsage` | Per-model token totals — the field to use for accounting, since it includes subagents and compaction |
| `usage` | Main loop only. Not the accounting field, despite the name |
| `permission_denials` | Some of what the policy blocked — see the caveat below |
| `session_id` | The handle for resuming or for correlating logs |

`permission_denials` is worth logging and worth reading after the first week: it is how you
find out the deny rule is firing on legitimate work, or that the agent spent four turns on
something it was never going to be allowed to do.

**But it is not a complete audit log.** Measured: with `dontAsk` and a scoped path deny rule,
a read that was genuinely blocked produced an empty `permission_denials`. Treat a non-empty
array as signal and an empty one as no information. Anything that must *prove* the control
surface held has to assert on the effect instead — `evaluation.md` covers how.

Note the accounting caveat in the declarations: in streaming-input sessions these totals are
cumulative and each result carries the running total, so read the **latest** result rather than
summing across them.

## Distinguish the failures

`subtype` is not a boolean. At the time of writing the error subtypes were
`error_during_execution`, `error_max_turns`, `error_max_budget_usd`, and
`error_max_structured_output_retries`. They mean different things and want different responses:

| Subtype | What happened | What the caller should do |
| --- | --- | --- |
| `error_max_turns` | Ran out of turns | Raise the cap, or the task is too big for one run |
| `error_max_budget_usd` | Ran out of money | A cost problem, not a correctness one |
| `error_during_execution` | Something broke | Retry may help; look at the logs |

Collapsing all of these into exit code 1 throws away the diagnosis. Map them to distinct exit
codes, or at minimum print which one it was. A CI job that says only "the agent failed" will
have a human reading transcripts.

## Stopping

Three independent mechanisms, and an unattended harness wants all three:

- **Turn cap** — bounds the loop. Fires as `error_max_turns`.
- **Budget cap** — bounds the spend. Fires as `error_max_budget_usd`.
- **Abort signal** — bounds the wall clock, and is the only one that also lets *you* stop the
  run. Pass an abort controller, and wire a timer to it for jobs with a deadline. Without this
  a hung network call hangs the harness with no cap in sight, because neither of the other two
  is measured in seconds.

Wire the abort controller even when there is no timeout, so that a process signal can stop the
agent cleanly rather than killing it mid-tool-call.

## Model choice

The templates do not set a model, which means the harness runs whatever the default is, and
that default will change under it. For anything running unattended or on a schedule, name the
model explicitly — the run becomes reproducible, and a model change becomes a decision someone
made rather than something that happened.

Consider also naming a fallback model, so a capacity error degrades instead of failing.

Effort is the first cost lever worth reaching for, ahead of switching to a smaller model: a
capable model at lower effort often beats a smaller model at high effort, and it keeps one
prompt-cache namespace instead of two. Verify the option name and its accepted values in the
installed declarations before writing either.

## Logging

`console.log` is fine for a person watching. It is not fine for a scheduled job, where the
questions asked later are "which run was this", "what did it cost", and "what got blocked".

The minimum that earns its place:

- One structured line at the end carrying `session_id`, `subtype`, `num_turns`,
  `duration_ms`, `total_cost_usd`, and the count of `permission_denials`.
- Tool calls to stderr, agent text to stdout, so a caller can pipe one without the other.
- The session id printed early, not only at the end — a run that dies before its result message
  is exactly the run you will want to find.

Do not log tool inputs wholesale. They contain whatever the agent read, which for a
file-reading agent is the contents of the user's files.

## Retries

Retry the **run**, not the turn — the SDK already handles transport-level retries inside the
loop. A whole-run retry makes sense only when the work is idempotent, and most agent work that
edits files is not. Decide explicitly, and if the answer is "not idempotent", say so in the
generated README rather than leaving a retry loop for someone to add later on the assumption
that it is safe.

For a service, prefer failing the request and letting the caller decide. For a scheduled job, a
single retry on `error_during_execution` is usually right and a retry on
`error_max_budget_usd` never is.

## What this looks like in the file

All of it belongs in the entry point, not spread around: caps and abort controller in the
options, the result message read once at the end, one structured line emitted, exit code
derived from `subtype`. If that pushes the entry point past a screen, the logging helper moves
to its own file — the control flow does not.
