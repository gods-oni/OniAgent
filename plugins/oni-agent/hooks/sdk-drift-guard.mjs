#!/usr/bin/env node
// PostToolUse hook for oni-agent.
//
// Enforces the skill's Hard rule 1: never write an Agent SDK call from memory.
// The rule protects against a surface that moves faster than any documentation —
// the shipped declarations have disagreed with the published docs about the
// permission-mode enum, the hook matcher shape, and the canUseTool signature.
// An instruction alone does not enforce anything, so this checks.
//
// Two things are checked, and only when the written file actually imports the SDK:
//   1. Is the package installed at all? Code written before `npm install` cannot
//      have been checked against the declarations.
//   2. Does every named import exist in those declarations?
//
// Inert otherwise: a file that does not import the SDK exits 0 immediately.
//
// Loop safety, two independent guards, matching task-guard.mjs:
//   1. Self-resolving — the block asks for the install or the corrected import,
//      which is exactly what clears the condition.
//   2. Per-file, per-session marker, so one file is blocked at most once even if
//      the fix never happens.
//
// Any unexpected error exits 0. A backstop that breaks the session is worse than
// a backstop that misses.

import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, parse } from "node:path";
import { tmpdir } from "node:os";

const AGENT_SDK = "@anthropic-ai/claude-agent-sdk";
const API_SDK = "@anthropic-ai/sdk";
const CODE = /\.(m|c)?[jt]s$/;

const read = (stream) =>
  new Promise((resolve) => {
    let data = "";
    stream.setEncoding("utf8");
    stream.on("data", (c) => (data += c));
    stream.on("end", () => resolve(data));
    stream.on("error", () => resolve(""));
    setTimeout(() => resolve(data), 2000).unref();
  });

// Best-effort sweep so markers do not accumulate forever.
function sweepMarkers(dir) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const name of readdirSync(dir)) {
    if (!name.startsWith("oni-harness-")) continue;
    try {
      if (statSync(join(dir, name)).mtimeMs < cutoff) unlinkSync(join(dir, name));
    } catch {}
  }
}

// Walk up from the file toward the filesystem root looking for the package.
function findPackage(fromDir, pkg) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, "node_modules", ...pkg.split("/"));
    if (existsSync(candidate)) return candidate;
    const up = dirname(dir);
    if (up === dir || up === parse(dir).root) return null;
    dir = up;
  }
}

// Named imports from one module specifier, across however many import statements.
function namedImports(source, specifier) {
  const names = new Set();
  const pattern = new RegExp(
    "import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*['\"]" + specifier + "['\"]",
    "g",
  );
  for (const match of source.matchAll(pattern)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return [...names];
}

// Every name the declarations export. Returns null when the file does not parse
// the way we expect, so an unrecognised format means silence, not false alarms.
function declaredExports(pkgDir) {
  let text = "";
  for (const name of readdirSync(pkgDir)) {
    if (!name.endsWith(".d.ts")) continue;
    try {
      text += readFileSync(join(pkgDir, name), "utf8");
    } catch {}
  }
  if (!text) return null;
  const names = new Set();
  const pattern =
    /export\s+declare\s+(?:abstract\s+)?(?:function|type|interface|class|const|enum|let|var)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of text.matchAll(pattern)) names.add(match[1]);
  return names.size > 0 ? names : null;
}

try {
  const raw = await read(process.stdin);
  if (!raw.trim()) process.exit(0);

  const ev = JSON.parse(raw);

  const tool = ev.tool_name;
  if (tool !== "Write" && tool !== "Edit" && tool !== "MultiEdit") process.exit(0);

  const file = ev.tool_input?.file_path;
  if (typeof file !== "string" || !isAbsolute(file) || !CODE.test(file)) process.exit(0);
  if (!existsSync(file)) process.exit(0);

  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    process.exit(0);
  }

  const usesAgentSdk = source.includes(AGENT_SDK);
  const usesApiSdk = !usesAgentSdk && source.includes(API_SDK);
  if (!usesAgentSdk && !usesApiSdk) process.exit(0); // not SDK code — stay out of the way

  const pkg = usesAgentSdk ? AGENT_SDK : API_SDK;

  const tmp = tmpdir();
  const key = `${ev.session_id ?? "none"}:${file}`.replace(/[^\w-]/g, "_").slice(-120);
  const marker = join(tmp, `oni-harness-${key}.flag`);
  if (existsSync(marker)) process.exit(0); // already flagged this file this session
  try {
    sweepMarkers(tmp);
  } catch {}

  const block = (reason) => {
    try {
      writeFileSync(marker, "");
    } catch {}
    process.stdout.write(JSON.stringify({ decision: "block", reason }));
    process.exit(0);
  };

  const pkgDir = findPackage(dirname(file), pkg);
  if (!pkgDir) {
    block(
      `${file} imports ${pkg}, but that package is not installed anywhere above it. ` +
        `Hard rule 6 of oni-agent:init says never write an SDK call from memory: install ` +
        `the package first, read its shipped type declarations, and write the code from those. ` +
        `The published docs have disagreed with the declarations about the permission-mode ` +
        `enum, the hook matcher shape, and the canUseTool signature — two of those three do ` +
        `not compile. Run the install, then reconcile this file against the declarations.`,
    );
  }

  const exported = declaredExports(pkgDir);
  if (!exported) process.exit(0); // unfamiliar declaration format — do not guess

  const missing = namedImports(source, pkg).filter((n) => !exported.has(n));
  if (missing.length === 0) process.exit(0);

  block(
    `${file} imports ${missing.map((n) => `\`${n}\``).join(", ")} from ${pkg}, but ` +
      `${missing.length === 1 ? "that name is" : "those names are"} not exported by the ` +
      `installed version's type declarations in ${pkgDir}. This is the drift Hard rule 1 ` +
      `exists for. Read the declarations and use the names that are actually there — do not ` +
      `guess a replacement from the documentation, which is what disagreed in the first place.`,
  );
} catch {
  process.exit(0);
}
