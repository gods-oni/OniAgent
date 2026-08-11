<!--
TEMPLATE — shapes for generated skills, subagents and commands in the target project.
Each block below is the frontmatter + body shape for one component type.
-->

# Skills (`.claude/skills/<name>/SKILL.md`)

A skill is a procedure the user will repeat. It loads only when invoked or when its
`description` matches the user's intent — so the description is the whole retrieval
mechanism. Write it for matching, not for elegance: name the trigger phrases someone would
actually type.

```markdown
---
name: {{kebab-case-name}}
description: {{What it does}} — use when the user {{concrete trigger phrasings, including the words they would actually say}}.
---

# {{Title}}

{{One line: what this produces.}}

## Before you start

- {{Precondition to check, e.g. a clean working tree, a running service}}

## Steps

1. {{Concrete step, naming real paths and real commands from this project}}
2. {{...}}

## Verify

{{How to know it worked — the command to run, the output to expect}}

## Gotchas

- {{The thing that goes wrong here, and what to do instead}}
```

Generate a skill when the procedure has three or more steps and will happen more than once.
A one-step action is a command. A one-time action is neither.

---

# Subagents (`.claude/agents/<name>.md`)

A subagent runs in its own context window and reports back a conclusion. Use one when the
work would otherwise flood the main thread: broad multi-file search, a review pass, a long
verification loop.

```markdown
---
name: {{kebab-case-name}}
description: {{When to delegate to this agent — the situation, not the capability}}
tools: {{Read, Grep, Glob}}   # omit to inherit all; narrow it for read-only agents
model: {{sonnet|opus|haiku}}  # omit to inherit
---

{{System prompt for the agent. Be specific about scope and about what to report back —
the parent only sees the final message, so say what that message must contain.}}
```

Two failure modes to design against:

- **Too vague to delegate to.** "Code helper" tells the parent nothing about when to use it.
- **Reports a transcript instead of a conclusion.** State the required output shape.

Give read-only agents an explicit `tools` list. It is the cheapest safety property available.

---

# Commands (`.claude/commands/<name>.md`)

A command is a prompt the user invokes by typing `/<name>`. Keep these few — every command is
a name the user has to remember.

```markdown
---
description: {{One line shown in the command picker}}
argument-hint: {{[what-to-pass]}}
---

{{The prompt. `$ARGUMENTS` interpolates everything the user typed after the command;
`$1`, `$2` interpolate positionally.}}
```

Use a command when the user drives it and it is a single request. Use a skill when Claude
should be able to reach for it on its own, or when it is a real procedure.
