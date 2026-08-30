<!--
TEMPLATE — emits .claude/skills/graph-task/SKILL.md in the target project.

Generate this only when the codebase has real dependency depth. Over a flat script it is
ceremony, and ceremony teaches people to skip the command that matters.

Fill:
  {{CODE_GRAPH_TOOL}}        how this project derives real dependencies — an indexed code-graph
                             tool if one is configured, otherwise the concrete grep/import
                             commands that work here. Never leave this as "figure it out".
  {{TEST_COMMAND}}           full suite
  {{SCOPED_TEST_COMMAND}}    running a subset by path or pattern — the whole point of impact
                             analysis is not running the full suite, so if the runner cannot
                             scope, say so here instead of pretending
  {{NODE_BUDGET}}            a sane ceiling for this codebase, typically 5–12

`effort: xhigh` is deliberate: building the graph is the intelligence-sensitive part, and a
wrong graph costs more than the tokens saved. Remove it only if the project pins effort itself.

Delete this comment block in the output.
-->

---
name: graph-task
description: Carry out a task by building its dependency graph first, then executing the graph — decomposes the work into nodes with explicit artifacts and acceptance criteria, derives the edges from the real code dependencies rather than guessing, runs independent nodes together, and puts human checkpoints where consequence concentrates. Use when the user runs /graph-task, or asks to "plan this properly first", "break this down", "do this in the right order", or describes work that spans several modules.
argument-hint: "[what needs doing]"
effort: xhigh
---

# Graph task

For work whose difficulty is **structure**: several units, real dependencies between them, and
an order that matters. The graph is the deliverable of the first half, and it is what makes the
second half cheap.

Not for a single unit of work with an unknown number of attempts — that is `/loop-task`. If you
find yourself with a one-node graph, stop and use that instead.

## Phase 1 — Build the graph

**Decompose into nodes.** Each node carries five things, and a node missing any of them is not
ready to execute:

| | |
| --- | --- |
| **Kind** | see the table below |
| **Input** | what must exist before it starts |
| **Artifact** | the concrete thing it produces — a file, a passing test, a decision |
| **Done** | a criterion someone else could check |
| **Tools** | what it is allowed to touch, scoped to its mandate |

Node kinds, because they are not all agentic and treating them as if they were is how graphs
get slow and unreviewable:

| Kind | What it is |
| --- | --- |
| **Agentic** | Real work under judgement — read, reason, change, verify |
| **Deterministic** | A command with a known outcome: a migration, a codegen step, a formatter |
| **Router** | A branch: which path the rest takes, decided by something observed |
| **Join** | Where parallel branches converge and their results have to be reconciled |
| **Human checkpoint** | A stop for approval, placed deliberately — see below |

**Derive the edges from the code, not from intuition.** This is the step that separates this
skill from writing a to-do list. An edge exists because B genuinely cannot be correct until A
lands — not because B feels later.

Use `{{CODE_GRAPH_TOOL}}` to establish, for every module the task touches: what depends on it,
what it depends on, and how far a change ripples. Where the tool disagrees with your intuition,
the tool is describing the code and the intuition is describing a memory of it.

**Place human checkpoints where consequence concentrates**, not at even intervals. The edges
that earn one: anything touching data that cannot be regenerated, a public interface others
build on, credentials or permissions, and the join where two branches first have to agree. A
checkpoint everywhere is a checkpoint nowhere.

**Then validate the graph before showing it:**

- Acyclic. A cycle means two nodes are really one node — merge them.
- Every node reachable from the start, and every leaf contributing to the goal. An unreachable
  node is scope creep that arrived without asking.
- No node larger than a session's worth of work. Split it.
- Node count within {{NODE_BUDGET}}. Over that, the decomposition is too fine and the overhead
  exceeds what the ordering buys.

## Phase 2 — Show it, then commit to it

Render the graph — nodes, edges, checkpoints, and the topological order you intend to run — and
get approval before executing anything. This is the cheapest moment in the whole task to be
wrong.

Say explicitly what you are **not** doing, and which nodes you expect to run together.

## Phase 3 — Execute

Walk the graph in topological order. Run independent nodes together where doing so does not put
two writers on the same files; overlapping writes are how a parallel speedup becomes an
afternoon of reconciliation.

After every node that changes code:

1. **Impact analysis** — ask `{{CODE_GRAPH_TOOL}}` what the change actually reached.
2. **Run the affected tests**, not the whole suite: `{{SCOPED_TEST_COMMAND}}`. Running
   everything after every node is the habit this skill exists to replace, and the reason it
   matters is that a suite too slow to run gets run less often.
3. **Compare against the graph.** If the change reached something no edge predicted, that is the
   most valuable signal this skill produces — the graph was wrong. Stop, say so, and repair the
   graph before continuing. Do not quietly absorb it.

Run `{{TEST_COMMAND}}` in full once, at the end, before reporting done. Scoped runs are for the
loop; the full run is for the claim.

**Keep a record of what actually ran.** Per node: its outcome, its artifact, and whether it
matched the plan. This is the runtime graph, and it is a different object from the one you drew.

## Phase 4 — Report

Report the goal, the artifacts, and the full-suite result. Then the part that is easy to skip
and worth the most:

**Where the runtime graph diverged from the plan.** A node that turned out to depend on
something no edge predicted, a checkpoint that proved unnecessary, a branch never taken. That
divergence is a fact about the codebase — usually a coupling nobody had written down — and it
belongs in `.claude/rules/` or a decision record, not only in this conversation.

## Failure modes

- **A graph that is a to-do list.** If every edge is "and then", there were no real dependencies
  and this was the wrong skill.
- **Decomposing until the overhead exceeds the work.** Twelve nodes for a two-file change costs
  more to plan than to do.
- **Parallel nodes writing the same files.** Independent in the graph is not independent on
  disk. Check before running them together.
- **Absorbing a surprise silently.** An unpredicted ripple is the finding. Reporting it is the
  job.
- **Treating the plan as the record.** What you drew and what ran are two objects; only one of
  them is evidence.
