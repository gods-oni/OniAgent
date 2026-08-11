# MCP servers

Used in Phase 3.

**This file is a map of categories, not a verified registry.** The MCP ecosystem moves faster
than any training cutoff. Treat every specific server named here as a lead to verify, not a
fact to repeat — the official registry at `https://github.com/modelcontextprotocol/servers`
and the vendor's own docs are the authority. Package names and the reference set have changed
before and will change again.

## Check what already exists first

```bash
claude mcp list          # servers already configured for this user
cat .mcp.json            # servers already configured for this project
```

Suggesting a server the user already runs signals you did not look.

## The bar for suggesting one

An MCP server is worth adding when it gives the agent a capability it genuinely lacks. It is
not worth adding when a shell command already covers it.

Reject on these grounds, and say so:

- **Already covered by tools.** File reads, greps, and git are native. A "filesystem MCP" or
  "git MCP" adds latency and a config surface for capability that already exists.
- **Costs more context than it returns.** Every enabled server's tool definitions sit in the
  context window of every session, whether used or not. Five marginal servers is a real tax.
- **Needs infrastructure the user does not run.** A server requiring Docker, a local model, or
  a daemon is a broken suggestion unless the user already runs it or agrees to.
- **Needs credentials the user does not have.**

Three well-chosen servers beat ten. Zero is a normal, correct outcome for a small project.

## Categories worth considering

Match to what the project's work actually involves.

**Live documentation / API reference**
For projects on a fast-moving framework where the model's knowledge will be stale. High value
when the stack released a major version recently. Verify the current server before naming one.

**Browser automation**
For web projects where the agent should verify UI changes rather than assert them. Real cost:
downloads a browser, needs a display or headless setup. Worth it for frontend work with visual
acceptance criteria; not worth it for an API service.

**Database access**
Lets the agent inspect the real schema instead of inferring it from migrations. Strong fit for
data-heavy apps. **Point it at a local or read-only replica, never production** — and say that
out loud when suggesting it.

**Issue tracker / repo host** (GitHub, GitLab, Jira, Linear)
For projects where the agent should read issues and PRs as context. Note that the `gh` CLI
already covers most GitHub needs without an MCP server — suggest the server only if the user
wants richer or non-GitHub integration.

**Knowledge graph / semantic memory**
Covered in `memory.md`. Do not double-suggest it here.

**Error tracking / observability** (Sentry, and similar)
For production services where debugging starts from a real stack trace. Little value
pre-launch.

**Cloud provider / deployment**
For infra-heavy projects. Weigh carefully: these carry the broadest blast radius of any
category. Prefer read-only scopes, and be explicit about what write access would allow.

## Writing the config

Project servers go in `.mcp.json` at the project root, committed so the team shares them:

```json
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "@scope/mcp-server-example"],
      "env": { "EXAMPLE_API_KEY": "${EXAMPLE_API_KEY}" }
    }
  }
}
```

Rules for the config you generate:

- **Never write a literal secret.** Use `${ENV_VAR}` interpolation and tell the user which
  variables to set and where.
- **Verify the package name resolves** (`npm view <pkg> version`) before committing it. A
  typo'd server fails silently at session start and is miserable to debug.
- **State the prerequisites** for each server you add — a running daemon, an env var, a
  Docker container — in the handoff and in the generated `.claude/README.md`.
- **MCP servers load at session start.** After writing `.mcp.json`, the user must restart the
  session. Say this explicitly; it is the single most common confusion.
