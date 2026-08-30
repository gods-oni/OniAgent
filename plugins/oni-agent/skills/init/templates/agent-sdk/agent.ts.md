<!--
TEMPLATE — the agent entry point, for the Agent SDK substrate, ONE-SHOT or INTERACTIVE shape.

The service shape has its own template: agent-service.ts.md. A non-Agent-SDK substrate uses
loop.ts.md instead.

Name it agent.ts in an ESM project, agent.mts in a CommonJS one (Phase 0 decided this).

The base shape below is one-shot, because it is the smallest thing that runs end to end. The
interactive section at the bottom says what changes. Fill every {{PLACEHOLDER}}, and delete the
option lines this job does not need — an option set that lists everything teaches the reader
nothing about what matters here.

Before writing, read node_modules/@anthropic-ai/claude-agent-sdk/*.d.ts and confirm every
option and message field below exists in the installed version. Hard rule 1, and the plugin's
PostToolUse hook checks the imports.
-->

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { permissions, hooks } from "./control.js";
import { {{TOOL_SERVER_EXPORT}} } from "./tools.js";

// {{ONE_LINE_JOB_DESCRIPTION}}
// Invoked by: {{WHO_OR_WHAT_INVOKES_IT}}

const input = {{HOW_THE_INPUT_ARRIVES}};

const prompt = `{{THE_TASK_PROMPT}}`;

// Bounds the wall clock, and lets a process signal stop the run cleanly rather than killing
// it mid-tool-call. The turn and budget caps below do not measure seconds.
const controller = new AbortController();
const deadline = setTimeout(() => controller.abort(), {{TIMEOUT_MS}});

let outcome = "no result";
let sessionId: string | undefined;

try {
  for await (const message of query({
    prompt,
    options: {
      // What it is
      systemPrompt: `{{WHO_THE_AGENT_IS_AND_WHAT_IT_OPTIMISES_FOR}}`,

      // Named explicitly so the run is reproducible and a model change is a decision
      // somebody made, not something that happened.
      model: "{{MODEL_ID}}",

      // Where it works
      cwd: {{WORKING_DIRECTORY}},

      // What it can reach — see tools.ts and tool-surface.md
      ...permissions,
      mcpServers: { {{TOOL_SERVER_NAME}}: {{TOOL_SERVER_EXPORT}} },
      hooks,

      // Where it stops. Nobody is watching a one-shot run: all three are load-bearing.
      abortController: controller,
      maxTurns: {{TURN_CAP}},
      maxBudgetUsd: {{BUDGET_CAP}},
    },
  })) {
    // Capture the session id early. A run that dies before its result message is exactly
    // the one you will want to find in the logs.
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
      console.error(`session ${sessionId}`);
    } else if (message.type === "assistant") {
      for (const block of message.message.content) {
        // Agent text to stdout, tool calls to stderr, so a caller can pipe one without
        // the other.
        if ("text" in block) console.log(block.text);
        else if ("name" in block) console.error(`-> ${block.name}`);
      }
    } else if (message.type === "result") {
      outcome = message.subtype;
      // The one line that answers "which run was this, and what did it cost".
      // denials is signal when non-empty and proves nothing when empty — a scoped path deny
      // under dontAsk was measured blocking a read without recording one. Log it, read it
      // after a week, but never let it be the only evidence the control surface held.
      console.error(
        JSON.stringify({
          session_id: message.session_id,
          subtype: message.subtype,
          num_turns: message.num_turns,
          duration_ms: message.duration_ms,
          cost_usd: message.total_cost_usd,
          denials: message.permission_denials.length,
        }),
      );
    }
  }
} finally {
  clearTimeout(deadline);
}

// The exit code is this harness's interface with whatever invoked it, and the failures mean
// different things. A caller told only "it failed" ends up reading transcripts.
switch (outcome) {
  case "success":
    break;
  case "error_max_turns":
    console.error("Ran out of turns. Raise the cap, or the task is too big for one run.");
    process.exitCode = 2;
    break;
  case "error_max_budget_usd":
    console.error("Ran out of budget. A cost problem, not a correctness one.");
    process.exitCode = 3;
    break;
  default:
    console.error(`Agent did not complete: ${outcome}`);
    process.exitCode = 1;
}
```

## Variant — interactive

A person is at the keyboard. Three things change; everything above stays.

**The prompt becomes a stream.** Instead of a string, pass an async iterable of user messages,
so the session continues rather than restarting each turn. Read the user-message type from the
installed declarations before constructing one by hand.

**Approvals become real.** Add the `canUseTool` callback. It receives the tool name, the input,
and an options object, and returns a permission result keyed on `behavior` — not a bare string,
whatever the documentation says. Read `control.md` first: a tool approved earlier in the
permission flow never reaches this callback at all, and when it appears not to fire, the cause
is almost always a bare tool name sitting in the allow-list.

**Permission mode can move mid-session.** Start restrictive; loosen once the user has seen the
approach and agreed with it. The query object exposes a setter, available only in streaming
input mode.

Drop the turn cap if the person is the stopping condition. Keep the budget cap and the abort
controller.
