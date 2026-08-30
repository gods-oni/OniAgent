<!--
TEMPLATE — the SERVICE archetype: a long-lived process where requests arrive over time and a
conversation resumes across them.

This is the archetype with the most that can go wrong, so it gets a real template rather than
a paragraph telling you to look things up. Fill every {{PLACEHOLDER}}.

Three decisions this file forces you to make, all of which must also appear in the generated
README: concurrency, isolation, and what the caller sees when a run dies. They are marked
below. A service that leaves any of them implicit has decided them by accident.

Verify the query interface, the init message shape, and the session option names against the
installed declarations before writing.
-->

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { permissions, hooks } from "./control.js";
import { {{TOOL_SERVER_EXPORT}} } from "./tools.js";

// {{ONE_LINE_JOB_DESCRIPTION}}
// One conversation per {{WHAT_A_CONVERSATION_IS_KEYED_ON}}.

// The session id is the whole design. Everything else here is bookkeeping around it.
// {{WHERE_SESSIONS_ARE_PERSISTED}} — an in-memory Map dies with the process, which is
// usually wrong for a service. Say which you chose and why.
const sessions = new Map<string, string>();

// DECISION 1 — CONCURRENCY. Two requests on one conversation will interleave and corrupt the
// session unless something serialises them. This queues per conversation; the alternatives are
// rejecting the second request or forking the session. Pick one deliberately.
const inFlight = new Map<string, Promise<unknown>>();

function serialise<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = inFlight.get(key) ?? Promise.resolve();
  const next = previous.then(work, work);
  inFlight.set(key, next.catch(() => {}));
  return next;
}

export async function handle(conversationId: string, userText: string) {
  return serialise(conversationId, async () => {
    const resume = sessions.get(conversationId);

    // DECISION 2 — ISOLATION. Requests from different people must not share a working
    // directory or read each other's files. With file tools in the surface this is a security
    // property, not tidiness.
    const cwd = {{PER_CONVERSATION_WORKING_DIRECTORY}};

    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), {{REQUEST_TIMEOUT_MS}});

    let answer = "";
    let outcome: string | undefined;
    let sessionId: string | undefined;

    try {
      for await (const message of query({
        prompt: userText,
        options: {
          systemPrompt: `{{WHO_THE_AGENT_IS}}`,
          model: "{{MODEL_ID}}",
          cwd,
          ...permissions,
          mcpServers: { {{TOOL_SERVER_NAME}}: {{TOOL_SERVER_EXPORT}} },
          hooks,
          // Continue this conversation where it left off. Omitted on the first request.
          ...(resume ? { resume } : {}),
          abortController: controller,
          maxTurns: {{TURN_CAP}},
          maxBudgetUsd: {{BUDGET_CAP_PER_REQUEST}},
        },
      })) {
        // Capture the session id early: a request that dies before its result message is
        // exactly the one you will want to find in the logs.
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        } else if (message.type === "assistant") {
          for (const block of message.message.content) {
            if ("text" in block) answer += block.text;
          }
        } else if (message.type === "result") {
          outcome = message.subtype;
          sessionId = message.session_id;
          console.error(
            JSON.stringify({
              conversationId,
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

    // Only remember a session that actually completed. Storing the id of a run that died
    // mid-turn means every later request resumes from a broken state.
    if (outcome === "success" && sessionId) {
      sessions.set(conversationId, sessionId);
      return { ok: true as const, answer };
    }

    // DECISION 3 — FAILURE. What the caller sees. Do not return a half-answer as if it were
    // a whole one; the caller cannot tell the difference and will act on it.
    return { ok: false as const, reason: outcome ?? "no result", answer };
  });
}
```

## Forking

Measured: resuming returns the **same** session id, not a new one, and a second conversation
started without `resume` gets its own id and knows nothing of the first. So storing the id back
after every request is harmless but not what makes resume work — the option is.

Resume continues one conversation. **Fork** it when a branch must not contaminate the original
— a "what if" the user asked, a retry you do not want in the history, a subagent-style side
quest. The SDK exposes both a fork option alongside resume and a standalone fork function;
check which one the installed version wants before writing.

A forked session is a new id. Decide whether it replaces the stored one or lives beside it, and
whether it is ever garbage collected.

## Growth

Sessions accumulate. Nothing in the SDK deletes them for you, and a service that runs for a
year with a session per conversation ends up with a directory nobody planned for. Decide the
retention policy — by age, by count, or explicitly on conversation close — and put it in the
README. "We will deal with it later" is a decision to fill the disk.

## What must be in the README

The three decisions above, named, with the answer you chose. A reader who cannot tell whether
two simultaneous requests are safe will assume they are.
