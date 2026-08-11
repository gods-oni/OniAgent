<!--
TEMPLATE — .claude/settings.json for the target project.

The JSON below is a shape reference. Emit only the keys this project needs; an empty
`permissions.deny` or an empty `hooks` object is noise.

Committed to git and shared with the team. Personal overrides belong in
settings.local.json, which must be gitignored — verify the project's .gitignore covers it.
-->

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test:*)",
      "Bash(npm run lint:*)",
      "Bash(git status)",
      "Bash(git diff:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(npm publish:*)"
    ]
  },
  "env": {
    "NODE_ENV": "development"
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "<formatter command reading the edited path from stdin JSON>",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Filling this in

**`permissions.allow`** — the highest-value key. Every routine, read-only or idempotent
command this project runs constantly: its test runner, linter, formatter, build, and the
read-only git commands. Each entry here is a permission prompt the user never sees again.

Derive them from the **verified** `Commands` table in `CLAUDE.md` — see
`references/ecosystems.md`. Never from a generic list: an allowlist entry for a command this
project does not run is clutter that makes the real entries harder to review. Use `:*` to
match arguments.

Do not allowlist install, publish, deploy or migration commands. They mutate state outside the
working tree, and that is exactly where the user wants to be asked.

**`permissions.deny`** — real danger for *this* project only. Secret files, publish and deploy
commands, production credentials, destructive migrations. A deny list padded with
hypotheticals gets ignored wholesale.

**`hooks`** — only for things that must happen regardless of what the model decides.
Format-on-write and test-on-stop are the two that earn their keep in most projects.

Hook facts that determine whether yours works:

- Hook scripts receive the event JSON on **stdin**, not as arguments.
- `matcher` is a regex over tool names: `"Write|Edit"`.
- Event names are case-sensitive: `PostToolUse`, not `postToolUse`.
- On Windows, a bash script needs Git Bash present. Set `"shell": "powershell"` for a
  PowerShell command, or use a runtime you have confirmed is on PATH. Do not assume a
  shebang will execute.
- `${CLAUDE_PROJECT_DIR}` resolves to the project root — use it for script paths.
- Prefer a command that is a no-op when its tool is missing, so the hook never blocks a
  teammate who has not installed it.

Only generate a hook after confirming its command runs on this machine. An unverified hook
fires on every matching tool call and fails on every one of them.
