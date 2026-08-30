<!--
TEMPLATE — the permission and hook surface for the target project.

This file is where the Phase 1 answer to "what must it never do" becomes something that
actually stops it. Keep it separate from the entry point: it is the file a reviewer will read
first, and the one that must stay readable when the prompt grows.

Every entry needs a reason. A deny rule nobody can justify gets deleted by the next person to
touch this file, which is how these surfaces quietly erode.

Confirm the permission mode values, the hook event names, and the hook callback shape in
node_modules/@anthropic-ai/claude-agent-sdk/*.d.ts before writing. Both the mode enum and the
hook event union had disagreeing documentation at the time this template was written — see
sdk-surface.md. Hard rule 1.
-->

```typescript
// Permission surface for {{ONE_LINE_JOB_DESCRIPTION}}.
// Evaluation order: hooks → deny → ask → mode → allow → callback. See control.md.

export const permissions = {
  // Pre-approved. Only what the job actually needs.
  // A bare tool name here auto-approves every call to it and skips the approval callback.
  allowedTools: [
    {{ALLOWED_TOOL}}, // {{WHY_THIS_TOOL_IS_NEEDED}}
  ],

  // Denied. This list is the Phase 1 "must never do", one entry per prohibition.
  // A bare tool name removes the tool from the model's context entirely.
  // A scoped pattern leaves the tool available and blocks only matching calls.
  // Deny holds even in bypass mode — it is the only list that does.
  //
  // Absolute paths on Windows: write the drive letter with NO "//" prefix — Read(C:\x\y) or
  // Read(C:/x/y). The documented Read(//C:/x/y) form was measured NOT matching, and a rule
  // that does not match does not warn. See control.md.
  disallowedTools: [
    {{DENIED_PATTERN}}, // {{WHICH_PROHIBITION_THIS_ENFORCES}}
  ],

  // {{WHY_THIS_MODE}} — see the mode table in control.md.
  permissionMode: "{{PERMISSION_MODE}}",
};
```

## Hooks

A hook is the only check that runs on **every** call, before deny and ask rules and regardless
of mode. Use one when the rule must hold unconditionally, or when the decision needs logic a
pattern cannot express — inspecting the arguments, checking external state, writing an audit
line.

The shape below was read from the shipped declarations, not from the documentation, which
described a different one. Re-read it in the installed version before writing:

```typescript
export const hooks = {
  // The event name comes from the HookEvent union in sdk.d.ts. PreToolUse is the one that
  // gates a call before it runs.
  {{HOOK_EVENT}}: [
    {
      // Narrows this matcher to one tool. Omit to run on every call for this event.
      matcher: "{{TOOL_NAME_OR_OMIT}}",
      hooks: [
        // {{WHAT_THIS_HOOK_GUARANTEES}}
        async (input) => {
          try {
            if ({{THE_CONDITION_THAT_MUST_NOT_HOLD}}) {
              return {
                hookSpecificOutput: {
                  hookEventName: "{{HOOK_EVENT}}",
                  permissionDecision: "deny",
                  permissionDecisionReason: "{{WHAT_TO_TELL_THE_MODEL}}",
                },
              };
            }
          } catch {
            // An unexpected condition must not break the session. Fall through.
          }
          return { continue: true };
        },
      ],
    },
  ],
};
```

Keep it defensive. This runs on every tool call; an exception here breaks the agent in a way
that is far worse than a check that misses. Wrap anything that can throw, and let an unexpected
condition fall through rather than crash — the same rule that governs `task-guard.mjs` in the
sibling plugin, for the same reason.

If this job has no unconditional rule, export an empty object and say so in a comment — an
empty hooks map is honest, an invented hook is not.

## The mapping to write down

Phase 8's proposal should carry this table, and the generated README should carry it too. It is
the answer to cold-start question 4, and "the prompt says so" is not an acceptable entry in the
right-hand column:

| Must never | Enforced by |
| --- | --- |
| {{PROHIBITION}} | {{DENY_RULE_OR_HOOK}} |

## Two mistakes this file exists to prevent

**Putting the prohibition only in the system prompt.** Instructions are context; the model
follows them most of the time. If the user stated it as an absolute, it belongs in the deny
list or a hook, and the README must not claim enforcement the code does not provide.

**Trusting the allow-list under bypass mode.** Pre-approving three tools while running in
bypass approves every other tool too — they match no allow rule, fall through to the mode, and
the mode approves them. Under bypass, only deny rules and hooks restrict anything.
