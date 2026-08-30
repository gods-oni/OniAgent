# The SDK surface, and how to know it is still true

Used in Phases 7 and 8.

## What you are building on

`@anthropic-ai/claude-agent-sdk` is Claude Code packaged as a library. It supplies the **agent
harness** — the loop, the built-in tools, context management, hooks, subagents, permissions,
sessions — and nothing else. **You host it.** There is no managed runtime, no sandbox, no
scheduler; the loop runs in your Node process, and the tools act on your machine.

Three packages get confused with it. Naming the wrong one produces code that cannot work:

| You want | Package | Why |
| --- | --- | --- |
| A batteries-included agent with file and shell access | `@anthropic-ai/claude-agent-sdk` | This skill. Built-in tools, full harness. |
| To loop over tools *you* define, nothing built in | `@anthropic-ai/sdk` → `client.beta.messages.toolRunner` | The API SDK's tool runner. No filesystem, no built-in tools. |
| Anthropic to host the loop *and* the sandbox | Managed Agents (REST) | A separate product. Not a library. |

The SDK is TypeScript and Python only. To drive the same loop from another language, run the
CLI as a subprocess with `-p` and `--output-format json`.

## Hard rule: verify against the installed package

Do not write an `Options` field, an import, or an enum value from memory. After
`npm install @anthropic-ai/claude-agent-sdk`, read the package's own type declarations:

```bash
ls node_modules/@anthropic-ai/claude-agent-sdk/
grep -rn "PermissionMode\|interface Options" node_modules/@anthropic-ai/claude-agent-sdk/*.d.ts
```

The declarations that ship with the installed version are the only authority. Not this file,
not the docs, not what you remember.

**Why this is a hard rule and not advice.** This was checked, not assumed. Against the
published documentation at the time of writing, the shipped declarations of one installed
version disagreed in three places — every one of them load-bearing:

| Thing | What the docs said | What `sdk.d.ts` said |
| --- | --- | --- |
| `PermissionMode` | three values on the TypeScript reference page, six on the Permissions page | six |
| Hook matcher | `{ match, callback }` | `{ matcher?, hooks: HookCallback[], timeout? }` |
| `CanUseTool` | `(request) => Promise<'approve' \| 'deny' \| 'ask'>` | `(toolName, input, options) => Promise<PermissionResult>`, where the result is an object keyed on `behavior` |

Two of those produce code that does not compile. The third — the mode enum — produces code that
compiles fine and silently lacks the mode the design called for. That is the dangerous one.

Note the version number when you read it: the package is pre-1.0, and a pre-1.0 package is
allowed to move faster than anything documenting it. Treat every name in this file as a **thing
to look up**, not a thing to assert. Same reasoning that makes `mcp-catalog.md` in the sibling
plugin a map of categories rather than a registry of servers.

## The shape, as of writing — verify each before use

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "…",
  options: { /* … */ }
})) {
  if (message.type === "assistant") { /* Claude's reasoning and tool calls */ }
  else if (message.type === "result") { /* message.subtype — "success" or a failure */ }
}
```

`query()` returns an async iterable of SDK messages. The loop ends when the agent finishes or
errors. Message handling without filtering shows raw objects including system initialisation —
useful when debugging, noise otherwise.

Options seen documented, grouped by what they decide. **Confirm each in the installed
declarations before writing it**; the list is neither complete nor guaranteed current:

| Concern | Options |
| --- | --- |
| Scope | `cwd`, `additionalDirectories`, `settingSources`, `plugins`, `mcpServers` |
| Tools | `allowedTools`, `disallowedTools`, `tools` |
| Control | `permissionMode`, `canUseTool`, `hooks`, `settings` |
| Behaviour | `systemPrompt`, `model`, `fallbackModel`, `agents`, `thinking`, `effort` |
| Limits | `maxTurns`, `maxBudgetUsd`, `abortController` |
| Continuity | `resume`, `forkSession`, `sessionId`, `continue` |
| Output | `outputFormat`, `includePartialMessages`, `stderr` |

Also exported, for session-aware harnesses: `startup()` to pre-warm the subprocess, and
functions to list, read, rename and tag past sessions. Look them up when the archetype needs
them; do not reach for them otherwise.

Custom tools use `tool(name, description, inputSchema, handler, extras)` with a Zod schema, and
are bundled into an in-process server with `createSdkMcpServer({ name, version, tools })`. See
`tool-surface.md` before writing one.

## Peer dependencies

The package declares peers rather than dependencies — check the installed
`package.json` for the current set and ranges. At the time of writing they were the Anthropic
API SDK, the Model Context Protocol SDK, and **Zod 4**.

This matters if the harness defines custom tools: `zod` gets hoisted in as a peer and the
import will resolve, right up until an install that does not hoist it the same way. If you
write `tools.ts`, add `zod` to the project's own dependencies explicitly rather than relying on
someone else's transitive tree.

## Traps that bite on first run

These are the ones that produce a scaffold that looks correct and does not work.

**The SDK does not read `.env`.** It reads the environment of the process that runs the agent.
A key sitting in a `.env` file is not loaded unless you load it yourself. Either export the
variable in the shell, or add `dotenv` and call it before the first SDK call — and if you do
the latter, say so in the generated README, because the next person will assume the framework
handles it.

**CommonJS projects need `.mts`.** `tsx` treats an `.mts` file as an ES module, so top-level
`await` works without converting the host project. Detect the module system in Phase 0 and name
the file accordingly; do not convert someone's project to ESM as a side effect of adding an
agent to it.

**`npm ci --omit=optional` breaks the install.** The TypeScript SDK ships the Claude Code
binary through npm optional dependencies. Skipping them leaves no binary even on a supported
platform, and the failure appears at runtime, not install time. Reinstall including optional
dependencies, or install Claude Code natively and point `pathToClaudeCodeExecutable` at it.

**API key only.** Anthropic does not permit third-party products to offer claude.ai login or
rate limits, agents built on this SDK included. Use an API key, or one of the provider paths:
`CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_ANTHROPIC_AWS` (with `ANTHROPIC_AWS_WORKSPACE_ID`),
`CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY` — each with that provider's credentials
configured separately.

**Config is inherited, whether or not you meant it.** Under the default setting sources, the
harness picks up settings, skills, commands, memory and MCP servers the same way Claude Code
does — including the operator's *personal* ones, not just the project's. This is observable:
a harness run on a machine with a broken personal MCP server reports that server's connection
failure inside its own output, for a job that has nothing to do with it.

For a harness meant to compose with a project's `.claude/` — which is how this plugin pairs
with the `.claude/` this skill generates — that inheritance is the feature. For an unattended harness
that must behave identically on every machine, it is a bug waiting for a support ticket: set
the setting sources explicitly, and put the reason in a comment next to them.

## When something here looks wrong

It probably is. The published changelogs are the fastest way to find out what moved:

- TypeScript SDK — `github.com/anthropics/claude-agent-sdk-typescript`, `CHANGELOG.md`
- Python SDK — `github.com/anthropics/claude-agent-sdk-python`
- Working examples — `github.com/anthropics/claude-agent-sdk-demos`
- Documentation — `code.claude.com/docs/en/agent-sdk/`

Report the discrepancy to the user rather than quietly writing around it. A surface that
drifted is worth one sentence; a harness built on a guess is worth a debugging session.
