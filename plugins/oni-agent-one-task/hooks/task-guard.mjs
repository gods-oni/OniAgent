#!/usr/bin/env node
// Stop hook for oni-agent-one-task.
//
// Blocks the turn from ending when files changed after .claude/TASK.md was last
// written, so the task memory is never more than one turn behind the repo.
//
// Inert unless a task is open: no .claude/TASK.md means exit 0 immediately.
//
// Loop safety, two independent guards:
//   1. Self-resolving — the block asks Claude to write TASK.md, which makes it the
//      newest file, which makes the next check pass. The condition is cleared by
//      the action the block requests.
//   2. Per-turn marker keyed on prompt_id, so a turn is blocked at most once even
//      if the write fails or is refused.
//
// Any unexpected error exits 0. A backstop that breaks the session is worse than
// a backstop that misses.

import { execFileSync } from "node:child_process";
import { existsSync, statSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { tmpdir } from "node:os";

const REASON =
  "Files changed after .claude/TASK.md was last written, so the task memory is " +
  "behind the repo. Update it before finishing: refresh Next, tick off anything " +
  "in Remaining that is now done, and record anything you ruled out or any " +
  "constraint you discovered. Record only what cannot be recovered from the repo " +
  "— not a summary of the diff — and keep the file under 60 lines. If it is " +
  "already accurate, touch it to confirm and stop.";

const read = (stream) =>
  new Promise((resolve) => {
    let data = "";
    stream.setEncoding("utf8");
    stream.on("data", (c) => (data += c));
    stream.on("end", () => resolve(data));
    stream.on("error", () => resolve(""));
    setTimeout(() => resolve(data), 2000).unref();
  });

// Best-effort sweep so per-turn markers do not accumulate forever.
function sweepMarkers(dir) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const name of readdirSync(dir)) {
    if (!name.startsWith("oni-onetask-")) continue;
    try {
      if (statSync(join(dir, name)).mtimeMs < cutoff) unlinkSync(join(dir, name));
    } catch {}
  }
}

try {
  const raw = await read(process.stdin);
  if (!raw.trim()) process.exit(0);

  const ev = JSON.parse(raw);
  const cwd = ev.cwd;
  if (!cwd || !isAbsolute(cwd) || !existsSync(cwd)) process.exit(0);

  const taskFile = join(cwd, ".claude", "TASK.md");
  if (!existsSync(taskFile)) process.exit(0); // no task open — stay out of the way

  const tmp = tmpdir();
  const marker = join(tmp, `oni-onetask-${String(ev.prompt_id ?? "none").replace(/[^\w-]/g, "")}.flag`);
  if (existsSync(marker)) process.exit(0); // already blocked this turn
  try { sweepMarkers(tmp); } catch {}

  // Working-tree changes only. TASK.md is gitignored, so it never appears here
  // and cannot be compared against itself. Outside a git repo, git exits non-zero
  // and we stay silent rather than guess.
  let porcelain;
  try {
    porcelain = execFileSync("git", ["-C", cwd, "status", "--porcelain"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
  } catch {
    process.exit(0);
  }

  const changed = porcelain
    .split("\n")
    .filter((l) => l.length > 3)
    .map((l) => {
      let p = l.slice(3).trim();
      if (p.includes(" -> ")) p = p.split(" -> ").pop().trim(); // rename
      return p.replace(/^"|"$/g, "");
    });
  if (changed.length === 0) process.exit(0);

  const taskTime = statSync(taskFile).mtimeMs;
  const stale = changed.some((p) => {
    try {
      const s = statSync(join(cwd, p));
      return s.isFile() && s.mtimeMs > taskTime;
    } catch {
      return false;
    }
  });
  if (!stale) process.exit(0);

  try { writeFileSync(marker, ""); } catch {}
  process.stdout.write(JSON.stringify({ decision: "block", reason: REASON }));
  process.exit(0);
} catch {
  process.exit(0);
}
