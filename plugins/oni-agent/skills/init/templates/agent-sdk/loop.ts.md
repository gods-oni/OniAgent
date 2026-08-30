<!--
TEMPLATE — for the substrates that are NOT the Agent SDK.

Emit this only when substrate.md's gate landed on Tool Runner or manual loop. It uses a
different package (@anthropic-ai/sdk, the Anthropic API SDK) and has no built-in tools: the
agent can reach exactly what you define here and nothing else.

Two shapes below. They are not variants of the same file — pick one:

  A. TOOL RUNNER  — the SDK drives the loop over your tools. Default choice.
  B. MANUAL LOOP  — you drive it. Only when you must own the loop, per substrate.md step 3.

Both are real code, both compile. Fill every {{PLACEHOLDER}}, delete the other one.

Verify every name against the installed declarations before writing. The tool-runner method
names in particular differ between the docs and the shipped types.
-->

## A. Tool Runner

The API SDK loops: request → execute your tools → send results → repeat, until the model stops
asking. You write the tool functions and nothing else.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod";

const client = new Anthropic();

// {{WHY_THIS_CAPABILITY_NEEDS_A_TOOL}}
const {{TOOL_VARIABLE}} = betaZodTool({
  name: "{{TOOL_NAME}}",
  description: "{{WHAT_IT_DOES}}. Use when {{WHEN_TO_USE_IT}}. {{THE_BOUNDARY}}.",
  inputSchema: z.object({
    {{PARAM_NAME}}: z.{{PARAM_SCHEMA}}.describe("{{WHAT_THIS_PARAMETER_MEANS}}"),
  }),
  run: async ({ {{PARAM_NAME}} }) => {
    try {
      return {{THE_ACTUAL_WORK_RETURNING_A_STRING}};
    } catch (error) {
      // Return the failure as text the model can act on. Throwing kills the run.
      return `{{TOOL_NAME}} failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const controller = new AbortController();
const deadline = setTimeout(() => controller.abort(), {{TIMEOUT_MS}});

const runner = client.beta.messages.toolRunner(
  {
    model: "{{MODEL_ID}}",
    max_tokens: {{MAX_TOKENS}},
    system: "{{WHO_THE_AGENT_IS_AND_WHAT_IT_OPTIMISES_FOR}}",
    messages: [{ role: "user", content: {{THE_TASK}} }],
    tools: [{{TOOL_VARIABLE}}],
  },
  { signal: controller.signal },
);

try {
  // Consume the iterator turn by turn so there is something to log while it works.
  for await (const message of runner) {
    for (const block of message.content) {
      if (block.type === "text") console.log(block.text);
      else if (block.type === "tool_use") console.error(`-> ${block.name}`);
    }
  }
  const final = await runner.done();
  console.error(
    JSON.stringify({
      stop_reason: final.stop_reason,
      input_tokens: final.usage.input_tokens,
      output_tokens: final.usage.output_tokens,
    }),
  );
  if (final.stop_reason === "max_tokens") process.exitCode = 1;
} finally {
  clearTimeout(deadline);
}
```

`runUntilDone()` consumes the whole iterator and returns the final message in one call — use it
instead of the loop above when nothing needs to be logged as it goes.

## B. Manual loop

This is the harness. Everything the other substrates hide is here, which is the point: you can
change any of it. It is also all yours to keep correct.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "{{TOOL_NAME}}",
    description: "{{WHAT_IT_DOES}}. Use when {{WHEN_TO_USE_IT}}. {{THE_BOUNDARY}}.",
    input_schema: {
      type: "object",
      properties: { {{PARAM_NAME}}: { type: "{{JSON_TYPE}}", description: "{{MEANING}}" } },
      required: ["{{PARAM_NAME}}"],
      additionalProperties: false,
    },
  },
];

// The dispatch table. A tool the model can name but this map cannot resolve is a crash
// waiting for the first turn that reaches it — handle the miss explicitly.
const handlers: Record<string, (input: any) => Promise<string>> = {
  {{TOOL_NAME}}: async (input) => {{THE_ACTUAL_WORK}},
};

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: {{THE_TASK}} },
];

const controller = new AbortController();
const deadline = setTimeout(() => controller.abort(), {{TIMEOUT_MS}});

let turns = 0;
let final: Anthropic.Message | undefined;

try {
  // THE AGENT LOOP. Keep going while the model is asking for tools.
  while (turns < {{TURN_CAP}}) {
    turns += 1;

    const response = await client.messages.create(
      {
        model: "{{MODEL_ID}}",
        max_tokens: {{MAX_TOKENS}},
        system: "{{WHO_THE_AGENT_IS}}",
        thinking: { type: "adaptive" },
        tools,
        messages,
      },
      { signal: controller.signal },
    );

    final = response;
    messages.push({ role: "assistant", content: response.content });

    // Guard before reading content: a refusal is a 200 with no answer in it.
    if (response.stop_reason === "refusal") {
      console.error("Refused:", response.stop_details);
      process.exitCode = 1;
      break;
    }

    if (response.stop_reason !== "tool_use") break;

    // One assistant turn may contain several tool_use blocks. Execute them together and
    // return EVERY result in a SINGLE user message — splitting them across messages teaches
    // the model to stop calling tools in parallel.
    const calls = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
      calls.map(async (call) => {
        const handler = handlers[call.name];
        if (!handler) {
          return {
            type: "tool_result" as const,
            tool_use_id: call.id,
            content: `No handler for tool ${call.name}.`,
            is_error: true,
          };
        }
        try {
          // Parse, never string-match: input JSON escaping varies by model.
          return {
            type: "tool_result" as const,
            tool_use_id: call.id,
            content: await handler(call.input),
          };
        } catch (error) {
          // A failed tool still needs its result block. Dropping one leaves the
          // conversation malformed and the next request is rejected.
          return {
            type: "tool_result" as const,
            tool_use_id: call.id,
            content: error instanceof Error ? error.message : String(error),
            is_error: true,
          };
        }
      }),
    );

    messages.push({ role: "user", content: results });
  }
} finally {
  clearTimeout(deadline);
}

if (turns >= {{TURN_CAP}} && final?.stop_reason === "tool_use") {
  console.error(`Hit the turn cap at ${turns} without finishing.`);
  process.exitCode = 1;
}
```

## What you have taken on by choosing B

The loop above is the minimum that works. The substrates you declined also handle these, and
none of them are optional once the harness runs unattended:

- **Context growth.** `messages` grows every turn and eventually exceeds the window. You need
  compaction, context editing, or a hard turn cap you actually respect.
- **Retries and rate limits.** The SDK retries transport errors; it does not retry a turn whose
  tool call failed for a reason that would succeed on a second attempt.
- **Permissions.** There is no permission layer here. Every tool in the dispatch table runs
  whenever the model names it. If the job has a "must never do", it is enforced inside the
  handler or not at all — write that check in the handler, not in the prompt.
- **Cost accounting.** Sum `usage` per turn yourself; there is no result message to read it off.

If most of that list needs building, that is the signal that step 3 of the gate was answered
wrong and the Tool Runner or the Agent SDK was the right substrate after all. Going back is
cheap now and expensive in a month.
