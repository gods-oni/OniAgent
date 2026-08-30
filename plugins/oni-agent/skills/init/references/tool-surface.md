# The tool surface

Used in Phase 7. Deciding what the agent can reach, and by what mechanism.

## Start from what it already has

The SDK ships Claude Code's built-in tools: reading, writing and editing files, globbing and
grepping, running shell commands, web search and fetch, task tracking, subagents. Before
designing anything, establish that the job actually needs something outside that set. Most of
the time it does not.

The failure this prevents is specific and common: writing a `run_tests` tool that shells out to
`npm test`, when `Bash` already does it, the agent already knows how, and the wrapper has added
a schema to maintain and a paragraph of description to send on every turn.

## The ladder

Go down it in order. Stop at the first rung that works.

**1. A built-in tool.** Free. No description to write, no schema to maintain, no code to keep
working. The model already knows the semantics.

**2. `Bash`.** Anything with a CLI is already reachable. `gh`, `psql`, `curl`, `aws`, the
project's own scripts. The cost is that `Bash` is broad — but that is a *permission* problem
with a permission answer (scope the deny and allow rules), not a reason to build a tool.

**3. An in-process tool.** `tool(name, description, inputSchema, handler, extras)` with a Zod
schema, bundled by `createSdkMcpServer`. Runs in your process, so it shares your imports,
connections and credentials. This is the right rung when:

- the capability has no CLI — an internal HTTP API, a database handle you already hold, a
  library function;
- credentials must stay in your process and never reach a shell the model composes;
- the operation needs a narrow, validated shape rather than the open surface a shell gives.

**4. An external MCP server.** A separate process or remote endpoint. Choose this only when the
capability genuinely lives outside your program, or when a maintained server already exists and
reimplementing it would be worse. It costs a process to run, a failure mode to handle, and a
startup dependency the user must know about.

## Writing a tool well

A tool's **description is a prompt**. It is read by a model deciding whether this is the right
call, not by a developer reading an API doc. Say what it does, when to use it, and — the part
usually missing — when *not* to. Name the boundary: "returns at most 50 rows; for larger scans
use …".

The **schema is the guardrail**. Prefer an enum over a free string wherever the set is known. A
parameter the model can fill with anything is a parameter you will see filled with anything.

**Annotations change behaviour, not just documentation.** Marking a tool read-only is a claim
the permission layer acts on. Claim it only when it is true — a "read-only" tool that writes is
worse than an unannotated one, because something downstream trusted the label.

**Errors are content, not exceptions.** Return the failure as a result the model can read and
act on. A thrown exception that kills the loop turns a recoverable step into a dead run.

## Deciding the surface, per capability

For each thing the job needs, answer four questions and the rung falls out:

1. Can a built-in do it? → rung 1.
2. Is there a CLI, and is a shell an acceptable way to reach it? → rung 2.
3. Does it need something only your process has — a connection, a secret, a library? → rung 3.
4. Does it already exist as a maintained server, or genuinely live outside this program? →
   rung 4.

Write the answer down per capability, with the reason. It goes in the Phase 8 proposal, and it
is the part a reviewer will actually argue with — which is the point.

## What not to build

- A tool that wraps one shell command.
- A tool that reads or writes a file. Those exist.
- A tool per endpoint of an API with twenty endpoints. One tool with an operation enum, or a
  single HTTP tool scoped to that host, keeps the context cost flat.
- A "helper" tool that exists so the prompt can be shorter. Prompt text is cheaper than a tool
  definition and far easier to change.

Every tool is context spent on every turn, forever. Six well-aimed tools beat twenty thin ones,
for the same reason six well-aimed files do.
