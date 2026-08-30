<!--
TEMPLATE — custom tools for the target project.

Emit this file ONLY if Phase 7 put something on rung 3 of the ladder in tool-surface.md. A job
served by built-in tools and Bash does not get a tools.ts, and the agent entry point drops the
mcpServers option along with it. An empty tool server is worse than none: it costs context on
every turn and signals a capability that is not there.

One tool per capability, not one per endpoint. Fill every {{PLACEHOLDER}}.

Zod is a PEER dependency of the SDK, not a dependency. It resolves today because npm hoists
peers, and it will stop resolving under an install that does not. If you emit this file, add
zod to the project's own dependencies at the major version the SDK's peer range names.

Confirm the signatures of tool() and createSdkMcpServer() in the installed declarations before
writing. Hard rule 1.
-->

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// {{WHY_THIS_CAPABILITY_IS_NOT_REACHABLE_BY_A_BUILT_IN_TOOL_OR_BASH}}
const {{TOOL_VARIABLE}} = tool(
  "{{TOOL_NAME}}",

  // This description is a prompt, not API documentation. It is read by a model deciding
  // whether this is the right call. Say what it does, when to use it, and when not to.
  `{{WHAT_IT_DOES}}. Use when {{WHEN_TO_USE_IT}}. {{THE_BOUNDARY_OR_LIMIT}}.`,

  {
    // Prefer an enum wherever the set of valid values is known. A free string is a parameter
    // you will see filled with anything.
    {{PARAM_NAME}}: z.{{PARAM_SCHEMA}}.describe("{{WHAT_THIS_PARAMETER_MEANS}}"),
  },

  async ({ {{PARAM_NAME}} }) => {
    try {
      const result = await {{THE_ACTUAL_WORK}};
      return { content: [{ type: "text", text: {{HOW_THE_RESULT_IS_RENDERED_FOR_THE_MODEL}} }] };
    } catch (error) {
      // Return the failure as readable content. A thrown exception kills the loop and turns a
      // recoverable step into a dead run.
      return {
        content: [{ type: "text", text: `{{TOOL_NAME}} failed: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },

  // Annotations are claims the permission layer acts on. Only claim what is true — a tool
  // marked read-only that writes is worse than one with no annotation at all.
  { annotations: { readOnlyHint: {{TRUE_IF_IT_ONLY_READS}} } },
);

export const {{TOOL_SERVER_EXPORT}} = createSdkMcpServer({
  name: "{{TOOL_SERVER_NAME}}",
  version: "0.1.0",
  tools: [{{TOOL_VARIABLE}}],
});
```

## Credentials

A tool on this rung usually exists *because* a credential must stay in the process rather than
reach a shell the model composes. Read it from the environment at module load, fail loudly if
it is absent, and never accept it as a tool parameter — a secret in a parameter is a secret in
the transcript.

## Checklist before shipping a tool

- Could a built-in tool or one `Bash` call have done this? Then delete it.
- Does the description say when *not* to use it?
- Is every parameter with a known value set an enum?
- Does a failure return content rather than throw?
- Is the read-only annotation accurate?
- Is the credential out of the parameters?
