<!--
TEMPLATE — package.json for the target project.

For a NEW directory, emit this whole shape. For an EXISTING project, do not emit a file at all:
add the two dependencies and the one script to what is already there, and present it as a merge
per Hard rule 5.

The JSON below is a shape reference. Emit only what this job needs.
-->

```json
{
  "name": "{{HARNESS_NAME}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "agent": "tsx agent.ts"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "{{INSTALLED_VERSION}}",
    "zod": "{{ONLY_IF_TOOLS_TS_EXISTS}}"
  },
  "devDependencies": {
    "tsx": "{{INSTALLED_VERSION}}",
    "@types/node": "{{ONLY_IF_YOU_TYPE_CHECK}}"
  }
}
```

## The three lines that matter

**`"type": "module"`** lets the entry point use top-level `await`. Set it on a new project.
Do **not** set it on someone's existing CommonJS project — name the entry point `agent.mts`
instead, which `tsx` treats as an ES module without converting anything else.

**`tsx`** runs TypeScript directly. There is no build step and no `tsconfig.json` unless the
host project already has a build pipeline that this file has to fit into. Do not add one
speculatively — but note the trade: without a tsconfig there is also no type-check, and a
type-check against the SDK's shipped declarations is the cheapest way to catch an option name
that moved. If you add one, `@types/node` comes with it, or `process` and `console` do not
resolve.

**Versions come from the install**, not from memory. Run the install first, then read the
resolved versions out of the lockfile or `npm ls`. A version written by hand is a version that
will be wrong. The SDK is pre-1.0, so pin deliberately rather than by reflex — decide whether
this project wants the caret range or an exact version, and say which in the proposal.

**Zod is a peer, not a dependency.** It appears in the tree today because npm hoists peers.
List it explicitly only if `tools.ts` exists, at the major version the SDK's peer range names —
otherwise delete the line rather than shipping an unused dependency.

## Install

```bash
npm install @anthropic-ai/claude-agent-sdk
npm install --save-dev tsx
```

Use the package manager the lockfile indicates, not `npm` by reflex.

**Never install with optional dependencies omitted.** The SDK ships the Claude Code binary
through them; `npm ci --omit=optional` produces an install that looks fine and fails at
runtime. If a CI pipeline already does this, that is a finding to report, not something to work
around silently.

## If the host project has a lockfile and a CI job

Adding a dependency to someone's project changes their build. Say so in the Phase 8 proposal,
name the CI job that will now install it, and let them decide — do not treat it as an
implementation detail.
