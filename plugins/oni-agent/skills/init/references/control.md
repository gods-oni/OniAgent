# Control: permissions and hooks

Used in Phase 7. Turning "it must never do X" into something that actually stops it.

## The evaluation order

When the agent requests a tool, the SDK resolves permission in a fixed sequence. Which step
your check sits on decides whether it runs at all:

1. **Hooks.** Run first. A hook can deny outright. A hook that allows does *not* skip the deny
   and ask rules below — those are still evaluated.
2. **Deny rules** — from the disallowed-tools option and from `settings.json`. A match blocks
   the call, **even in bypass mode**.
3. **Ask rules** — from `settings.json`. A match falls through to the approval callback, **even
   in bypass mode**. Tools that require user interaction behave the same way.
4. **Permission mode.** Bypass approves what reaches here; accept-edits approves the file
   operations; plan routes writes to the callback regardless of allow rules; other modes fall
   through.
5. **Allow rules** — from the allowed-tools option and from `settings.json`. A match approves.
6. **The approval callback.** Only reached if nothing above resolved the call. In the
   don't-ask mode this step is skipped and the call is denied.

Read that list once more with the design question in mind: *where does my check sit, and what
can reach past it?*

## The three that catch people

**Allowed-tools does not constrain bypass mode.** Listing tools pre-approves *those*.
Everything unlisted matches no allow rule, falls through to step 4, and bypass approves it. A
harness set to bypass with a short allow-list still has full shell and write access. To
actually narrow a bypass-mode agent, you need deny rules — the allow-list is decoration.

**Auto-approved tools never reach the approval callback.** Anything resolved at step 1, 2, 4 or
5 skips step 6 entirely. A permission check written into `canUseTool` is silently dead for
every tool an allow rule already covers. The TypeScript SDK will warn about the obvious cases —
bypass mode, or a bare tool name in the allow-list — via a Node process warning, but the
general trap is yours to avoid. **For a check that must run on every call, use a `PreToolUse`
hook.** Hooks are step 1; a hook deny holds even in bypass mode.

While you are here: `canUseTool` takes the tool name, the input, and an options object, and
returns a permission result **object** keyed on `behavior` — allow with an optional rewritten
input, or deny with a message. Published documentation described it as a single-argument
callback returning a string. Read the signature from the installed declarations; both the
argument list and the return type are different from the docs.

**A bare deny and a scoped deny do different things.** A deny naming a tool by itself removes
that tool's definition from the request — the model never sees it and cannot attempt it. A deny
with a pattern leaves the tool available and blocks only matching calls, letting the rest fall
through to the mode. Both are useful; conflating them produces an agent that either cannot work
or is not actually restricted.

## Choosing a mode

Six modes were documented at the time of writing: `default`, `dontAsk`, `acceptEdits`,
`bypassPermissions`, `plan`, and `auto`. **Read the installed type declarations before writing
one** — this is exactly the enum whose two official documentation pages disagreed, as
`sdk-surface.md` records.

Match the mode to who is present, which is the same question the archetype answered:

| Situation | Mode | Why |
| --- | --- | --- |
| Nobody watching, fixed tool surface | `dontAsk` + explicit allow-list | Anything unlisted is denied outright rather than silently relying on there being no callback to prompt |
| Person at the keyboard | `default`, loosened later | The callback has someone to ask |
| Trusted, isolated directory, fast iteration | `acceptEdits` | Approves file edits and filesystem commands inside the working directory; other tools still go through normal permissions |
| Read and propose, never change | `plan` | Writes are never auto-approved, even when an allow rule matches |
| Full autonomy in a disposable environment | `bypassPermissions` | Only with deny rules and hooks doing the real work, and only where every possible operation is acceptable |

The pairing worth remembering for an unattended agent is an explicit allow-list with
`dontAsk`: listed tools run, everything else is denied rather than hanging on a prompt nobody
will answer.

## Rule syntax, where it surprises

- **Edit rules cover all writing.** A path rule on `Edit` governs the other built-in tools that
  write files. A rule written against `Write` is never matched by the file permission checks —
  it looks correct and does nothing.
- **Two leading slashes mean the filesystem.** A single leading slash anchors the rule at its
  own source, which for rules passed in code is the session's working directory. A rule meant
  to protect an absolute path and written with one slash protects something else.
- **Allow-rule globs are anchored.** Tool-name wildcards work only after a literal MCP server
  prefix, so the rule always names a specific server. An unanchored wildcard is ignored with a
  startup warning and approves nothing — silently, unless you are reading stderr.

## Path rules on Windows

Measured, not assumed: four forms of the same deny rule were run against the same file on
Windows, and they did not behave the same way.

| Rule form | Result |
| --- | --- |
| `Read(C:\path\to\secret.txt)` | **Blocked.** |
| `Read(C:/path/to/secret.txt)` | **Blocked.** Forward slashes are fine. |
| `Read(//C:/path/to/secret.txt)` | **Did not block.** The agent read the file. |
| `Read(secret.txt)` | Neither blocked nor allowed cleanly — *both* files in the directory came back as "File does not exist", and the agent spent four turns on the wrong diagnosis. |

The third row is the trap, because `//path` is the documented form for an absolute filesystem
path and it is the one that silently fails once a drive letter is involved. A rule that does not
match does not warn; it just is not there.

**On Windows, write an absolute deny path with the drive letter and no `//` prefix.** Either
separator works. Then confirm it — a path rule is exactly the kind of thing that looks right and
does nothing, and Phase 10's refusal case exists to catch it after a refactor moves the file.

The fourth row is worth its own caution: a rule that misfires can surface to the agent as
"does not exist" rather than "denied", which sends it looking for a file instead of respecting a
boundary. If the agent reports a file missing that you know is there, suspect a path rule before
suspecting the filesystem.

## `permission_denials` does not see everything

The result message carries a `permission_denials` array, and it is tempting to treat it as the
audit log of what the policy blocked. Measured: with `dontAsk` and a scoped path deny rule, a
read that was genuinely blocked produced an **empty** `permission_denials`.

So it is a useful signal when non-empty and proves nothing when empty. Do not build the only
check of your control surface on it — assert on the **effect** instead: the agent did not obtain
the content, the file did not change, the command did not run. See `evaluation.md`.

## Hooks

Hooks are the enforcement layer. This repo's standing rule holds here without modification:
**instructions are context, hooks are enforcement.** A system prompt saying "never push" is
followed most of the time. A `PreToolUse` hook that denies the push is followed every time.

Anything the user stated in Phase 1 as an absolute belongs here or in a deny rule. If it is
only in the prompt, it is not enforced, and the generated README should not claim it is.

Read the hook event union from the installed type declarations before wiring one up. The
documented event list and the published TypeScript reference did not agree at the time of
writing — the same drift the hard rule exists for.

Keep a hook defensive, for the same reason the sibling plugin's `task-guard.mjs` is: it runs on
every call, and a hook that throws breaks the agent in a way that is much worse than a hook
that misses.

## Subagents inherit

A subagent runs under the parent session's permission mode. An agent definition can override
it — except when the parent is in bypass, accept-edits, or auto mode, which apply to every
subagent and cannot be overridden per agent.

This matters because subagents often carry different system prompts and looser instructions. A
parent in bypass mode grants every subagent full autonomous system access. If the design uses
subagents, decide their permission story explicitly rather than inheriting it by accident.
