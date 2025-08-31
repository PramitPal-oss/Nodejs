# Unix Foundations — Annotated Notes & Project Blueprints

_(Derived from the “Introduction to Unix” transcript — distilled for long‑term recall and production use.)_

> **Keep-first mindset:** This note keeps **every concrete promise and detail** from the transcript, then enriches it with Unix and Node.js know‑how so you can **implement and reason** about the three projects immediately. Use this as your 1‑year (and 10‑year) refresher.

---

## 0) Executive Summary (what you’ll get from this section)

- **Why Unix:** Internet runs mostly on Unix; understanding it elevates design, performance, and reliability even if you develop on Windows. Your apps **likely run on Unix in prod**.
- **Transferable power:** Once you get Unix, you can **compose multiple languages/tools** (Node, C, FFmpeg…) using processes & streams.
- **What you’ll learn (per transcript):** bash shells, IPC & **data streams**, **process management**, **environment variables**, **clustering**, a bit of **C**.
- **Node.js modules (focus):** `child_process`, `cluster`, `process` (most important), also `path`, `console`, `os`.
- **Three projects you’ll build:**
  1. **`show` CLI** — like `cat`: read from files or stdin; supports piping like `echo "some text" | show`.
  2. **Massive communication** — Node reads a **10 GB** numbers file and streams to a C (or Node) “**number formatter**” that converts to money amounts, writing to `dest.txt`. Observed behavior: Node ~**20 MB** RSS and low CPU; C ~**1 MB** RSS and ~**100% of one CPU**; killing Node ends C.
  3. **Video editing app** — HTTP app on **`localhost:8060`**, uses **FFmpeg** to extract audio, resize, etc. Runs in **normal** and **cluster** mode (all cores). Adds **job scheduling** to do **one resize at a time**, continues in background after tab is closed, keeps the rest of the app responsive. Built on top of prior “poster” app auth.
- **Cross‑platform reality:** Code runs on Windows too; Node smooths many differences. But you’ll still **need a Unix environment** to complete the module (install Linux/WSL2/macOS). Concepts translate to other languages (C, Go, Java, Python…).

---

## 1) The Unix Mental Model (what to internalize)

- **Everything is a file (descriptor).** Regular files, dirs, pipes, sockets, devices — accessed via **file descriptors** (0=stdin, 1=stdout, 2=stderr).
- **Processes:** Program instances with PID, PPID, **env**, CWD, uid/gid, open FDs, signal handlers, and an **exit code** (`0` success, non‑zero failure).
- **Streams & composition:** Design tools to **read stdin** and **write stdout** so they **compose** with `|` pipes and redirection (`>`, `>>`, `2>`, `2>&1`).
- **Signals:** `SIGINT` (Ctrl‑C), `SIGTERM` (polite stop), `SIGKILL` (untrappable), `SIGHUP` (terminal hangup). Handle **graceful shutdown**.
- **Work types:** **I/O‑bound** (disk/net) vs **CPU‑bound** (encoding, image/video transforms, parsing, compression). Use the right strategy (async I/O vs worker processes).
- **Security posture:** Least privilege; **avoid shell injection**; prefer `execFile`/`spawn` with argv over `exec "cmd string"`; sanitize paths.

---

## 2) Shells, Streams, and Redirection (you’ll use this everywhere)

- **Shells:** `bash` (course focus), also `zsh`, `fish`.
- **Redirection patterns:**
  - `cmd > out.txt` — stdout to file (overwrite).
  - `cmd >> out.txt` — stdout append.
  - `cmd 2> err.txt` — stderr to file.
  - `cmd > out.txt 2>&1` — merge stderr into stdout.
  - `producer | consumer` — pipe stdout→stdin.
- **Filters as first‑class citizens:** All three projects are **filters or orchestrators** of filters (FFmpeg, C tool) — follow the “**do one thing well**” spirit.

---

## 3) Node.js System Modules — Practical Cheat Sheet

### 3.1 `child_process` (core of Projects 1 & 2 & 3)

- **APIs:** `spawn(command, args, opts)`, `exec(cmdStr, opts)`, `execFile(file, args, opts)`, `fork(modulePath, args, opts)`.
- **When to use:**
  - `spawn/execFile`: long‑running, large I/O, stream data, avoid shell quoting risks.
  - `exec`: quick commands where output ≤ 1–2 MB (buffered).
  - `fork`: spawn **Node worker** with IPC channel.
- **Key options:** `stdio: ['pipe','pipe','pipe'] | 'inherit' | 'ignore'`, `cwd`, `env`, `detached`, `shell: false` (default), `killSignal`.
- **Patterns:** stream from `fs.createReadStream()` → `child.stdin`; consume `child.stdout` efficiently; **handle backpressure**; watch `close` & `exit` events; forward `SIGINT/SIGTERM`.

### 3.2 `cluster`

- Master/primary process **spawns N workers = CPU cores**; workers share server ports via the master’s internal handle. Use for **CPU‑bound** or isolating crashes.
- Lifecycle: primary listens for `online`, `exit`, `disconnect`. Implement **supervisor** logic (restart policy) carefully to avoid thrash.

### 3.3 `process`

- `process.argv`, `process.env`, `process.cwd()`, `process.pid`, `process.ppid`.
- Events: `'SIGINT'`, `'SIGTERM'`, `'uncaughtException'`, `'unhandledRejection'`, `'beforeExit'`, `'exit'`.
- `process.resourceUsage()`, `process.memoryUsage()`, `process.hrtime.bigint()` for timing.

### 3.4 `path`, `os`, `console`

- `path.join/resolve/normalize/basename/extname` — cross‑platform safe paths.
- `os.cpus().length`, `os.tmpdir()`, `os.platform()`, `os.totalmem()`.
- `console.time/timeEnd`, `console.error`, structured logs (JSON) for machines + human lines for devs.

---

## 4) Project 1 — `show` CLI (like `cat`)

**Transcript details to preserve:**

- Create `text.txt` with “**this is some text**” and run:  
  `show text.txt` → prints content.  
  Also works as **a pipe**: `echo "some text" | show` → prints piped content.

**Design goals:**

- Accept **file paths** or **stdin**.
- Be a **pure stream** tool (no buffering full file), handle **very large files**.
- Exit with `0` on success; non‑zero on errors (missing file, EACCES).

**Usage examples:**

```bash
show README.md
cat big.log | show | grep ERROR
echo "hello" | show > hello.txt
```

**Robust Node skeleton:**

```js
#!/usr/bin/env node
// bin/show
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { EOL } from 'node:os';

const files = process.argv.slice(2);

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function fromStdin() {
  return process.stdin.isTTY ? null : process.stdin;
}

function readFileStream(p) {
  try {
    return fs.createReadStream(p);
  } catch (e) {
    die(`show: cannot open '${p}': ${e.message}`);
  }
}

const srcs = files.length ? files.map(readFileStream) : [fromStdin()].filter(Boolean);
if (srcs.length === 0) die(`Usage: show <file ...> or pipe data into it`);

let idx = 0;
function next() {
  if (idx >= srcs.length) return;
  const s = srcs[idx++];
  pipeline(s, process.stdout, (err) => {
    if (err) die(`show: ${err.message}`);
    if (idx < srcs.length && process.stdout.isTTY) process.stdout.write(EOL);
    next();
  });
}
next();
```

**Quality tips:**

- Support multiple files; separate with newline when writing to TTY.
- Preserve **order**; propagate `SIGINT` properly; test with **huge** files.
- Keep it POSIX‑y: read stdin when no files are given.

---

## 5) Project 2 — Massive Node↔C Communication (10 GB stream)

**Transcript details to preserve:**

- Source file: **10 GB** text of numbers (built earlier).  
  Demo file name referenced as something like “**text gigantic**” (a huge numbers file).
- Node reads numbers and streams to a **C program** (“**number formatter**”).
- C program converts each number to **money format** and writes to **`dest.txt`**.
- Observed runtime profile: **Node ~20 MB RAM**, **C ~1 MB RAM**; **Node low CPU**, **C ~100% of one core**. Killing Node **stops the C program**.

**Goal:** Master **pipes, backpressure, and process linking**.

**High‑level flow:**

```
[fs.ReadStream(bigNumbers.txt)] --(chunks)--> [Node] --stdin--> [C number-formatter] --stdout--> [fs.WriteStream(dest.txt)]
```

**Node orchestrator (sketch):**

```js
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const src = fs.createReadStream('text_gigantic.txt'); // ~10 GB numbers (newline-separated)
const out = fs.createWriteStream('dest.txt');

const fmt = spawn('./number_formatter'); // or execFile
fmt.on('error', (e) => console.error('spawn error:', e));

// Pipe Node -> C stdin
src.pipe(fmt.stdin);

// Pipe C stdout -> dest.txt
fmt.stdout.pipe(out);

// Forward errors & handle close
for (const s of [src, out, fmt.stdout, fmt.stdin]) s.on('error', console.error);

process.on('SIGINT', () => {
  fmt.kill('SIGTERM');
  out.end(() => process.exit(130));
});
```

**C “number formatter” (sketch):**

```c
// number_formatter.c: read lines from stdin, format as currency, write to stdout
#include <stdio.h>
#include <stdlib.h>

int main() {
  char buf[4096];
  while (fgets(buf, sizeof buf, stdin)) {
    double x = atof(buf);
    // naive formatting, real code should handle locales/precision safely
    printf("$%.2f\n", x);
  }
  return 0;
}
```

Compile: `cc -O2 -o number_formatter number_formatter.c`

**Production concerns:**

- **Backpressure:** let pipes regulate flow; avoid manual `write()` loops without checking return.
- **Framing:** ensure the upstream uses **newline‑delimited** numbers; handle partial lines across chunk boundaries.
- **Crash semantics:** If Node dies, the child **gets EOF** on stdin and exits; also consider **orphan reaping** and explicit signal on shutdown.
- **Throughput:** Pin CPU work to native code; keep Node for I/O & orchestration. Use **`stdio: 'pipe'`** to stream, not buffers.
- **Validation:** guard against non‑numeric input; log to `stderr` not `stdout` to keep data channel clean.

---

## 6) Project 3 — Clustered Video Processing with FFmpeg

**Transcript details to preserve:**

- Server runs in **normal (single core)** or in **cluster mode (all cores)**.
- Web app at **`http://localhost:8060`**. Built atop a prior “**poster**” app (auth retained).
- Upload a video → server shows **thumbnail, file name, dimensions, format**.
- Available actions: **Extract audio**, **download audio**, **download original**, **resize**.
- Example resize from **1920×1080 (HD)** to **720×500**.
- **Scheduling policy:** do **only one resize at a time**; queue multiple requests; **heavy tasks** may take **hours**; background continues even if **tab closes**.
- **Responsiveness:** keep login and general UX **fast** while jobs churn.
- Uses **FFmpeg** (C application) for media operations; Node handles **networking & orchestration**.

**Architecture outline:**

```
[Browser UI] <HTTP> [Node API (primary or cluster workers)] -> [Job Queue (FIFO, concurrency=1)] -> [FFmpeg child_process]
                                                        \-> [Metadata/DB Storage] & [Static file server or object storage]
```

**FFmpeg basics used:**

```bash
# Inspect
ffprobe -v error -show_format -show_streams input.mp4

# Extract audio (aac/mp3/wav depending on container and needs)
ffmpeg -i input.mp4 -vn -acodec copy output.m4a
# or re-encode: ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3

# Thumbnail
ffmpeg -i input.mp4 -ss 00:00:01.000 -vframes 1 thumb.jpg

# Resize
ffmpeg -i input.mp4 -vf "scale=720:500:force_original_aspect_ratio=decrease" -c:a copy resized.mp4
```

**Cluster pattern (Node):**

```js
import cluster from 'node:cluster';
import os from 'node:os';
import http from 'node:http';

if (cluster.isPrimary) {
  const n = os.cpus().length;
  for (let i = 0; i < n; i++) cluster.fork();
  cluster.on('exit', (w, code) => {
    console.error('worker died', w.process.pid, code);
    cluster.fork(); // simple restart policy (tune for prod)
  });
} else {
  // each worker runs the API
  http.createServer(app).listen(8060);
}
```

**Job scheduling (single‑concurrency resize queue):**

- Maintain a **FIFO queue** in memory or via Redis (durable).
- **Concurrency = 1** for resize job type (from transcript).
- Each job calls `spawn('ffmpeg', args)` and streams progress to logs/DB.
- Mark job states: **queued → running → completed/failed**. Persist for page reload resilience.
- Allow users to **close the tab**; workers continue; UI polls status.

**Node controller snippets:**

```js
import { spawn } from 'node:child_process';

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    p.on('error', reject);
    let stderr = '';
    p.stderr.on('data', (d) => {
      stderr += d.toString(); /* parse progress if needed */
    });
    p.on('close', (code) => (code === 0 ? resolve({ ok: true }) : reject(new Error(stderr || `ffmpeg exit ${code}`))));
  });
}
```

**Operational notes:**

- **Graceful shutdown:** on `SIGTERM`, stop accepting new jobs, let current job finish, persist queue, then exit.
- **Resource limits:** cap worker concurrency for CPU‑heavy filters; ensure **tmp space** and **disk I/O** capacity.
- **Security:** validate uploaded file types; avoid path traversal; store outside web root; scan if required.
- **Portability:** FFmpeg binaries differ across OS; bundle or document install steps.

---

## 7) Cross‑Platform & Setup Guidance

- **You still need Unix for this module.** On Windows, install **WSL2 (Ubuntu)** or use a Linux VM. macOS is Unix‑like and works well.
- **Install essentials:** Node.js (use `nvm`), build tools (`build-essential`), FFmpeg (`sudo apt install ffmpeg`), Git.
- **Verify environment:**
  ```bash
  node -v && npm -v
  which ffmpeg && ffmpeg -version
  uname -a
  ```
- **Editor & shell:** Use a shell with good completion (`bash/zsh`) and a terminal multiplexer (`tmux`) for long‑running jobs.

---

## 8) Production‑Grade Practices You’ll Reuse

- **Logs:** separate **data** (stdout) from **diagnostics** (stderr). Use structured logs for machines.
- **Exit codes & retries:** non‑zero indicates type of failure; queues can implement retry with backoff.
- **Backpressure awareness:** never slurp huge files to RAM; stream; use `pipeline()`.
- **Signal handling:** forward `SIGINT/SIGTERM` to children; avoid orphans.
- **Idempotency:** job resubmission should not corrupt outputs; use deterministic output paths + checks.
- **Monitoring:** memory/rss, CPU, open FDs; alert on job stalls; keep temp dirs clean.

---

## 9) Pitfalls & How to Avoid Them

- **Shell injection:** don’t `exec("ffmpeg " + userArgs)`. Use `spawn('ffmpeg', argsArray)`.
- **Stdout buffering deadlocks:** if child writes lots to stdout/stderr and parent doesn’t drain, it can block.
- **Encoding/line breaks:** normalize `\r\n` vs `\n` in text streams (“numbers per line”).
- **Locale in currency formatting (C app):** choose predictable decimal separator; avoid locale‑dependent surprises.
- **Resource spikes:** running many resizes at once will freeze your API; keep **concurrency=1** as specified.
- **File paths:** always use `path.join`, never concatenate user input into paths.

---

## 10) Study Checklist (map directly to transcript promises)

- [ ] Explain **why** Unix matters (deployment, composition, performance).
- [ ] Show how to **read stdin + files** and **pipe** data.
- [ ] Demonstrate **`child_process.spawn`** vs `exec` vs `execFile` vs `fork`.
- [ ] Handle **signals** and **exit codes** in parent and child.
- [ ] Build the **`show` CLI** and test with file + pipe cases.
- [ ] Implement the **Node↔C pipeline** for 10 GB numbers → currency; confirm CPU/RAM profile.
- [ ] Ensure child exits when parent dies (or EOF on stdin); verify `dest.txt` content.
- [ ] Create the **video app**: upload → metadata → extract audio → resize via **queued, single‑concurrency** jobs.
- [ ] Run in **cluster mode** (use all cores); keep API responsive.
- [ ] Install & use **FFmpeg**; confirm thumbnail/audio/resize workflows.
- [ ] Validate cross‑platform behavior (Windows via WSL2/macOS/Linux).

---

## 11) Minimal Glossary

- **IPC:** Inter‑Process Communication (pipes, sockets, shared memory).
- **FD:** File Descriptor — integer handle for an open file/pipe/socket.
- **STDIN/STDOUT/STDERR:** Standard input/output/error streams (fd 0/1/2).
- **Backpressure:** Natural flow control when a downstream can’t keep up.
- **Cluster (Node):** Multi‑process model to utilize CPU cores for Node servers.
- **FFmpeg/ffprobe:** Command‑line tools for audio/video processing and metadata.

---

## 12) Quick Reference — Commands Mentioned in Transcript

- `echo "some text" | show` — pipe text into the `show` app.
- `show text.txt` — print file `text.txt` whose content in demo was “this is some text”.
- Node app reading huge file (“text gigantic” ~10 GB) → streams to C “number formatter” → writes `dest.txt`.
- Video app on **`localhost:8060`**: upload, show **thumbnail/name/dimensions/format**, **extract audio**, **download audio**, **download original**, **resize** (e.g., **1920×1080 → 720×500**), **queue with single concurrency**, cluster mode for multi‑core processing.

---

### Final Mindset

Unix is the **operating system of composition**. You’ll wire small, sharp tools through **streams** and **processes**. Node is your networked glue; C (and FFmpeg) are your CPU engines. Mastering this **model** lets you swap languages and still ship the same reliable systems — today and in a decade.
