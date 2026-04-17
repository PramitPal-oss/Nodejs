# Quick cheat-sheet (one page)

- Three standard Unix streams per process:

  - **stdin (0)** — _readable_ — where process **reads** input (default: terminal/keyboard).
  - **stdout (1)** — _writable_ — normal program **output** (default: terminal/display).
  - **stderr (2)** — _writable_ — diagnostic output (errors, warnings, progress) (default: terminal/display).

- Streams are **byte streams** (zeros & ones): can carry text or binary, and are memory-efficient for very large data.
- Basic shell operators:

  - `> file` write **stdout** to file (truncate),
  - `>> file` append **stdout**,
  - `2> file` write **stderr**,
  - `cmd1 | cmd2` pipe stdout of `cmd1` → stdin of `cmd2`,
  - `< file` feed file into stdin,
  - `2>&1` redirect stderr into the same target as stdout.

- In Node: `process.stdin`, `process.stdout`, `process.stderr`.

  - Read with `stdin.on('data', ...)`; write with `stdout.write('...')` or `console.log(...)`.
  - `console.log` → `stdout` and adds a newline; can be configured to write to custom streams.

- Important: closing a writable stream (e.g. `child.stdin.end()`) sends the EOF/end-of-stream signal to the receiver.

---

# Full, durable notes and explanations

## 1) Where these streams come from

- When you start a Unix executable, the parent process (usually the shell) hands the child:

  - environment variables,
  - command-line arguments,
  - and three preconnected **streams** (stdin/stdout/stderr).

- The abbreviation `STD` stands for **standard** (e.g. `STDIN`, `STDOUT`, `STDERR`).
- By default, when launched from a terminal:

  - **stdin** is connected to the terminal device (you type on keyboard → terminal → process.stdin).
  - **stdout** and **stderr** are connected to the terminal device (process writes → terminal → monitor).

## 2) Concept: streams, not files

- These are **stream objects** — continuous sequences of bytes.

  - They are not limited to small data; streams let you process huge files (GBs/TBs) chunk by chunk without loading whole file into memory.

- Streams can be connected to:

  - terminals (TTY devices),
  - files on disk,
  - sockets (network),
  - pipes between processes,
  - or any other valid stream object.

## 3) Why three streams (and why stderr exists)

- `stdout` is for normal program output you _might_ want to save or pipe into another tool.
- `stderr` is for diagnostics that should not mix with program output (errors, warnings, progress bars, debug logs).

  - Keeping them separate allows users to pipe program output to another program/file without losing diagnostic text.
  - Example: a progress bar on `stderr` will not break a pipeline consuming `stdout`.

- You can redirect each independently in the shell (so you can save output but discard or separately capture errors).

## 4) Numeric file descriptors (important)

- Unix assigns numbers:

  - **0** = stdin,
  - **1** = stdout,
  - **2** = stderr.

- In bash you can refer to these numbers when redirecting (e.g. `2> err.log`, `1> out.log`).

## 5) Shell examples (practical)

- Save stdout:
  `node app.js > output.txt`
- Save stderr:
  `node app.js 2> error.txt`
- Append stdout:
  `node app.js >> output.log`
- Pipe processes:
  `./produce_data | ./process_data | ./finalize`
- Feed file into stdin:
  `node app.js < input.txt`
- Combine stdout and stderr into one file:
  `node app.js >all.txt 2>&1` or (bash shorthand) `node app.js &> all.txt`
- Typical use-case: `ffmpeg input.mp4 | image-tool` — one process produces frames to stdout, another reads frames from stdin.

## 6) Node.js specifics (examples & behavior)

- Node exposes the streams via `process`:

```js
const { stdin, stdout, stderr } = process;

// read stdin (readable)
stdin.on('data', (chunk) => {
  console.log('Got data from stdin:', chunk.toString());
});

// write to stdout/stderr (writable)
stdout.write('This is some text I want\n');
stderr.write('This is some text I may not want\n');
```

- `console.log()` writes to `process.stdout` and appends a newline. `console.error()` writes to `process.stderr`.
- You can create a custom Console that writes to files or other streams:

```js
const fs = require('fs');
const { Console } = require('console');

const out = fs.createWriteStream('./stdout.log');
const err = fs.createWriteStream('./stderr.log');
const logger = new Console({ stdout: out, stderr: err });

logger.log('hello'); // goes to stdout.log
logger.error('oops'); // goes to stderr.log
```

- Node streams come in modes (flowing vs paused) — `stdin.on('data', ...)` puts it into flowing mode.

## 7) Child processes & inter-process streams

- When you spawn a child (Node `child_process.spawn` or similar), that child also has stdin/stdout/stderr streams:

```js
const { spawn } = require('child_process');
const child = spawn('./playground');

// read child's stdout/stderr
child.stdout.on('data', (d) => console.log('child stdout:', d.toString()));
child.stderr.on('data', (d) => console.error('child stderr:', d.toString()));

// write to child's stdin
child.stdin.write('some input\n');
// indicate EOF / close child's stdin
child.stdin.end();
```

- If you do not call `child.stdin.end()` (or the child not getting EOF), the child may keep waiting for input and not exit.
- You can **pipe** streams in Node: `child1.stdout.pipe(child2.stdin)` — this is the programmatic equivalent of shell piping.

## 8) C language parallels (how streams look at low level)

- In C, streams are handled with `stdin`, `stdout`, `stderr` and functions like `printf`, `fprintf`, `fgetc`, `fputs`, etc.

  - `printf(...)` writes to `stdout`.
  - `fprintf(stderr, "...")` writes to `stderr`.
  - `fgetc(stdin)` reads a character from stdin; typical loop reads until EOF.
  - `fflush(stdout)` forces buffered stdout to be written immediately.

- `EOF` is a special sentinel value indicating end of file / end of stream (Ctrl+D sends EOF from terminal on Unix).
- `fprintf(stdout, ...)` and `printf(...)` are equivalent (by default `printf` writes to stdout).

## 9) The `console` object and printf(3)

- `console.log()` semantics mimic C `printf(3)` formatters (you can use `%s`, `%d`, etc).
- `console.log()` performs formatting and writes to `process.stdout` with a newline.
- You can pass multiple arguments to `console.log()` — Node will format them (the transcript noticed added separators; Node typically separates args by spaces when printing).

## 10) Streams are binary — text or binary

- Under the hood streams carry bytes; you may treat them as text (UTF-8) or binary (images, video).
- In Node, a `Buffer` is the raw bytes; call `buf.toString()` for text.

## 11) Unix philosophy & practical patterns

- Unix encourages small, single-purpose programs that communicate via streams (build small tools and chain them).
- Example pipeline:

  - Program A: split video into frames → `stdout` yields images (binary).
  - Program B: image processor reads from stdin → processes frames.

- This pattern scales: chaining many tools allows each to focus on one task.

## 12) Signals / End of stream

- **EOF** is the signal a reader uses to detect the end of input.

  - From Node: `stream.end()` (on writable) sends EOF to the reader on the other side (e.g., child stdin).
  - From terminal: `Ctrl+D` sends EOF on Unix to stdin.

- In C, reading `fgetc` returns `EOF` when the stream ends.

## 13) Common pitfalls & debugging tips

- **Process not exiting** — often because stdin of child is still open; call `child.stdin.end()`.
- **Missing output in terminal** — you redirected stdout to a file; check `>out.txt`.
- **Mixing data and logs** — if you pipe `stdout` into another program but stderr contains logs/warnings, they won’t be piped. If you want both, use `2>&1` to combine them (but be careful: combining may break downstream parsers).
- **Buffering**: C stdio may buffer output. Use `fflush(stdout)` if you need immediate output; run with unbuffered mode for real-time streaming tools.
- **Encoding**: When getting Buffers, always `.toString('utf8')` (or appropriate encoding) to obtain readable text.

## 14) Practical exercises to lock it in (do these)

1. Run a JS script that reads stdin and echoes it uppercased:

```sh
# script: echo-uppercase.js
const { stdin, stdout } = process;
stdin.on('data', chunk => stdout.write(chunk.toString().toUpperCase()));
```

Test: `echo "hello" | node echo-uppercase.js`

2. Redirect stdout to a file and stderr separately:

```sh
node someScript.js > out.txt 2> err.txt
```

3. Pipe two programs with Node spawn:

```js
const { spawn } = require('child_process');
const p1 = spawn('producer');
const p2 = spawn('consumer');
p1.stdout.pipe(p2.stdin);
p2.stdout.pipe(process.stdout);
```

4. Send EOF to a child:

```js
child.stdin.write('last chunk\n');
child.stdin.end(); // child receives EOF and can finish
```

5. Combine outputs:

```sh
node app.js > combined.txt 2>&1
# or
node app.js &> combined.txt
```

## 15) Memory-efficient streaming pattern (why streams matter)

- Streams allow you to process data as it arrives, not after full download:

  - read chunk → transform → write chunk → repeat.

- Good for very large files, continuous network streams, media, logs.

## 16) Short glossary

- **TTY** — terminal device (historical: teletype), the device file a shell is attached to.
- **Pipe** — kernel data structure letting stdout of one process feed stdin of another.
- **EOF** — end-of-file sentinel (signal that input has ended).
- **File descriptor** — an integer handle (0,1,2 for standard streams).
- **Buffer (Node)** — raw bytes container from streams.

---

# Final summary (so you remember in a year)

- Every Unix process starts with **stdin (0)**, **stdout (1)**, **stderr (2)**.
- Streams are byte streams; you can read and write them in any language (C/Node/Python).
- Keep **stdout** for data you want to pipe/save and **stderr** for diagnostics/progress.
- Use **shell redirection** (`>`, `2>`, `|`, `<`) or **programmatic pipes** (`child.stdout.pipe(child2.stdin)`).
- To end input, send EOF (Ctrl+D in terminal) or call `.end()` on the writable stream — otherwise processes may hang waiting for more data.
- This model is the foundation for enormous flexibility: chaining tools, building streaming apps, handling huge files without memory problems.

---

If you want, I can:

- Turn this into a printable one-page PDF cheat-sheet,
- Create 10 short hands-on exercises + expected outputs,
- Or convert the examples into a single runnable Node project you can try locally. Which one would help you most?
