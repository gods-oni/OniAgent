# Feasibility gate

Applies to every stack, library, MCP server, pattern and tool you are about to name in front
of the user. Run it *before* the suggestion reaches them, not after they ask.

A suggestion the user cannot act on is worse than no suggestion. It costs them a round trip,
and it teaches them not to trust the next one.

## The four checks

### 1. Does it exist, in the form you remember?

Your training has a cutoff. Package names get renamed, projects get archived, APIs get
replaced, and official MCP servers get deprecated in favour of new ones. The failure mode is
specific and embarrassing: recommending something that was correct 18 months ago.

Verify when the answer is load-bearing:

- Packages — `npm view <pkg> version`, `pip index versions <pkg>`, `cargo search <crate>`
- Repos and MCP servers — `WebFetch` the actual repository or docs page
- Anything you are about to state a version number for

Do not verify what is stable and universal. You do not need to check that PostgreSQL exists.
Check the things that move: MCP servers, AI-adjacent tooling, anything under two years old,
anything you are only ~80% sure of.

### 2. Does it run on *this* machine and target?

Read from the environment, not from habit:

- **Platform.** On Windows: no `chmod`, no shebang execution, path separators differ, symlinks
  need admin or Developer Mode. A hook script written in bash needs Git Bash present. Prefer
  `shell: "powershell"` on win32, or a cross-platform runtime.
- **Runtime present?** Node, Python, Docker, a database — check with `--version` before you
  build a recommendation on top of it.
- **Deployment target.** Serverless rules out long-lived connections and background workers.
  Edge runtimes rule out most of the Node stdlib. Mobile rules out server-side rendering.
- **Offline or air-gapped?** That kills every hosted MCP server and every cloud API.

### 3. Is it proportionate to the project?

Match the machinery to the stakes. This is the check most often skipped, and it is the one
users notice.

| Project | Proportionate | Disproportionate |
| --- | --- | --- |
| Throwaway script | A short `CLAUDE.md` | Subagents, hooks, a knowledge graph |
| Personal tool | `CLAUDE.md` + 1–2 rules | Layered architecture, CI gates |
| Team product | Scoped rules, skills, review agent | Bespoke MCP servers |
| Production service | The full surface, hooks included | — |

Ask: if the user never touches this project again after next month, was this worth writing?

### 4. Can the user actually operate it?

- Does it need an API key they do not have?
- Does it need a daemon they must remember to start? (Docker, a local model server, a DB)
- Does it need a paid tier?
- Does the team already know it, or is this a new thing to learn mid-project?

A dependency on a background service is fine — but it must be **stated**, not discovered later
when the thing silently fails.

## How to report a failed check

Do not quietly drop an option you rejected. Name it and say why — it stops the user proposing
it themselves an hour later, and it shows the reasoning was done.

> Considered Redis for the cache; ruled out because the deploy target is a single Fly.io
> machine with no add-ons, so an in-process LRU covers it without a second service.

## Uncertainty is reportable

If you could not verify something, say which one and how sure you are. "I believe X is still
maintained but could not reach the repo" is honest and useful. Presenting an unverified guess
in the same confident register as a checked fact is the actual failure.
