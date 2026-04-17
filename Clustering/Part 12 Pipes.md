# Detailed Notes — Pipes & Output Redirection in Bash

> Source: Transcript: "Understanding Pipes and Output Redirection in Bash"

These notes condense every important idea from the transcript, add clarifying details, examples, and practical tips so you can come back to this and understand the topic even after a year.

---

## 1. Big picture / motivation

Bash exposes three _data streams_ (also called _file descriptors_) for every process:

- **stdin** — file descriptor **0** — standard input (where a process reads from)
- **stdout** — file descriptor **1** — standard output (where a process writes normal output)
- **stderr** — file descriptor **2** — standard error (where a process writes error messages)

Once you understand these three devices, piping and output redirection become easy: they are just ways of changing where those streams point (terminal, file, another process).

---

## 2. Piping (the `|` operator)

### What is a pipe?

- The pipe character is `|` (on many keyboards it’s `Shift` + `\` — the key above/backslash).
- A pipe connects **stdout** of the command on the left to **stdin** of the command on the right.
- In effect: _left-process stdout → pipe buffer → right-process stdin_.
- Pipes can be chained: `A | B | C` connects `A` → `B` and `B` → `C`.

### Example (from transcript)

```bash
# produce text
echo "some string" | node playground.js
```

- `echo` writes `some string` to its **stdout**.
- The pipe sends that stdout to `node playground.js`'s **stdin**.
- If `playground.js` reads from stdin and logs: `got this data from standard in`, you'll see:

```
got this data from standard in some string
```

### Chaining transformations

- You can add more processes in the chain, e.g. convert the string to uppercase using `tr`:

```bash
echo "some string" | node playground.js | tr 'a-z' 'A-Z'
```

- `tr` translates characters; `'a-z' 'A-Z'` converts lowercase to uppercase.

### Important: pipes only carry **stdout** (not stderr)

- If a process writes to both stdout and stderr, a plain pipe only receives stdout.
- Example: Node program prints both:

```js
console.log('hello from stdout');
console.error('whoops from stderr');
```

- Running `node playground.js | tr 'a-z' 'A-Z'` will uppercase only the `stdout` text; `stderr` will still be printed directly to the terminal unmodified.

### How to include `stderr` in a pipe

- To send _both_ stdout and stderr into the pipe (so the next process sees both), merge stderr into stdout first:

```bash
command 2>&1 | other_command
```

- This redirects file descriptor 2 (stderr) to where descriptor 1 (stdout) currently points (the pipe), so both flow through the pipe.

> **Note:** `2>&1` merges descriptors — the order matters when mixing multiple redirections (see "Gotchas").

### Exit status and `pipefail`

- By default the pipeline's exit status is the exit status of **the last command** in the pipeline. This can hide failures in earlier stages.
- To detect failure in any pipeline stage, enable `pipefail` in bash:

```bash
set -o pipefail
# now pipeline exit status is non-zero if any stage fails
```

### Implementation detail (short)

- Pipes are implemented by the kernel using a buffer — processes run concurrently and communicate through that buffer. If the producer is faster than consumer, the kernel buffer can fill and the producer may block until the consumer reads.

### Useful variants

- `tee`: write pipe output both to terminal and a file:

```bash
cmd | tee file.txt      # write stdout to terminal and file (overwrites)
cmd | tee -a file.txt   # append instead of overwrite
```

- Process substitution (bash): provides <(...) and >(...) constructs for more advanced wiring.

---

## 3. Output redirection (the `<`, `>`, `>>`, and `2>` operators)

### What redirection does

- Redirection tells the shell: change where a file descriptor reads from or writes to.
- Common uses:

  - Save stdout to a file
  - Save stderr to a file
  - Feed stdin from a file
  - Discard output by sending to `/dev/null`

### Basic operators

- `>` : redirect **stdout** to a file (overwrite)
- `>>`: redirect **stdout** to a file (append)
- `<` : redirect **stdin** from a file (shorthand for `0<`)
- `2>`: redirect **stderr** to a file (overwrite)
- `2>>`: redirect **stderr** to a file (append)

Examples from transcript:

```bash
# Redirect stdout to file (stdout -> text.txt; stderr still goes to terminal)
node playground.js > text.txt

# Redirect stderr to file
node playground.js 2> err.txt

# Redirect both separately
node playground.js > text.txt 2> err.txt
```

- If you omit the file descriptor number (e.g. `> file`) it defaults to **1 (stdout)**.

### Feed a file into stdin

```bash
node playground.js < text.txt
```

- `< text.txt` makes the file's contents available as the process's stdin. This is equivalent to `0< text.txt`.
- As a rule, `<` affects stdin (fd 0); trying to use `<` with `1` or `2` is meaningless in normal workflows (transcript said it gives an error in that context).

### Overwrite vs append

- `>` overwrites the file contents.
- `>>` appends to the file.
- Example use-case for append: adding a line to a log or, jokingly, adding a line to a coworker’s `~/.bashrc` so they see a delay every time they open a shell (don’t do this—it’s malicious and rude!).

### `/dev/null` — the trash sink

- `/dev/null` is a special file that discards anything written to it (like a black hole / trash can).
- Common patterns:

```bash
# neglect stdout
command > /dev/null

# neglect stderr
command 2> /dev/null

# neglect both (bash shorthand)
command &> /dev/null
```

- Writing to `/dev/null` does not change the file size; it is a special device.

### Redirecting both stdout and stderr together

- Bash shorthand (bash-specific):

```bash
command &> all.txt        # redirect both stdout and stderr to all.txt (overwrite)
command &>> all.txt       # append both
```

- POSIX-compatible way (portable):

```bash
command > all.txt 2>&1    # redirect stdout to file, then redirect stderr to the same place as stdout
```

**Order matters.** To put both into `all.txt`, the correct ordering is `> file 2>&1` (redirect stdout first, then point stderr at the same place). If you do `2>&1 > file` you'll end up with stderr pointing at the original stdout (likely your terminal) and stdout going to `file` — not what you wanted.

---

## 4. Examples and walkthroughs (concise)

### Simple piping

```bash
echo "hello" | tr 'a-z' 'A-Z'    # HELLO
```

### Pipe into a node script that reads stdin

```bash
# node script reads stdin and prints: got this data from standard in <text>
echo "some string" | node playground.js
```

### Uppercase using `tr` after node

```bash
echo "some string" | node playground.js | tr 'a-z' 'A-Z'
```

- Only the stdout coming out of node is transformed; node's stderr (if any) is still printed to the terminal.

### Redirect stdout and stderr to different files

```bash
node playground.js > text.txt 2> err.txt
# text.txt now contains stdout; err.txt contains stderr; nothing may appear on terminal
```

### Redirect stdin from a file

```bash
node playground.js < text.txt
# This makes the contents of text.txt available on stdin to the node process
```

### Discard stderr (hide errors)

```bash
node playground.js 2> /dev/null
```

### Capture both stdout and stderr into a single file (portable)

```bash
node playground.js > all.txt 2>&1
# or in bash: node playground.js &> all.txt
```

### Use `tee` to both view and save output

```bash
node playground.js | tee out.txt     # see on terminal and save to out.txt (overwrites)
node playground.js | tee -a out.txt  # append
```

---

## 5. Common pitfalls & gotchas (the important details)

- **Pipes don’t include `stderr` by default.** If you want errors to go through a pipe use `2>&1`.

- **Order of redirections matters.** `> file 2>&1` behaves differently from `2>&1 > file`. The general rule: perform the redirect that sets the target first, then point other fds at it.

- **Pipeline exit status**: by default is the last command’s exit status — use `set -o pipefail` to catch failures earlier in the chain.

- **`&>` is bash-specific.** If you want portable scripts, use `> file 2>&1` instead.

- **File descriptors are numbers:** `0` (stdin), `1` (stdout), `2` (stderr). You can create/use higher descriptors if needed. But for typical piping/redirection you only need 0–2.

- **`/dev/null` is a special device.** Writing to it discards data; reading from it yields EOF.

- **No space required:** `>file` and `> file` are equivalent; many people prefer the space for readability.

- **Appending vs overwriting:** `>` truncates the file; `>>` appends. Be careful not to overwrite logs or important data unintentionally.

---

## 6. Extra useful tips (beyond transcript)

- **Check what a command writes to which stream:** If you’re unsure whether a command writes to stdout or stderr, redirect one to a file and run it to see where output lands.

- **Pipe both and filter:** `command 2>&1 | grep "ERROR"` will let you search for errors across all output.

- **Use `set -o pipefail` in scripts** so failures in earlier pipeline stages cause the script to fail rather than silently continue.

- **Use `process substitution`** in bash for advanced wiring, e.g. `diff <(cmd1) <(cmd2)`.

- **Use `xargs`** for building arguments from piped input: `echo a b c | xargs -n1 command`.

- **Named pipes (FIFOs)**: `mkfifo mypipe` creates a named pipe you can use to connect processes outside of a single pipeline.

---

## 7. Quick command cheat‑sheet

```
# Pipe stdout of left to stdin of right
left | right

# Redirect stdout to file (overwrite)
cmd > file.txt

# Append stdout to file
cmd >> file.txt

# Redirect stderr to file
cmd 2> err.txt

# Redirect both stdout and stderr to same file (portable)
cmd > all.txt 2>&1

# In bash, shorthand to redirect both
cmd &> all.txt

# Send a file to stdin
cmd < file.txt

# Discard stdout or stderr
cmd > /dev/null        # discard stdout
cmd 2> /dev/null       # discard stderr

# Pipe both stdout and stderr
cmd 2>&1 | other

# View and save (tee)
cmd | tee file.txt     # show and save
cmd | tee -a file.txt  # append
```

---

## 8. Suggested exercises to solidify knowledge

1. Create a small Node (or Python) script that reads from stdin and prints the input prefixed with `GOT:`. Pipe `echo "hello"` into it.
2. Modify the script so it prints one line to stdout and one line to stderr. Try piping to `tr` and observe which line is transformed.
3. Use `tr` to make text uppercase in a pipeline. Then try to capture both stdout and stderr into a single file.
4. Run a command that produces both stdout and stderr and experiment with `> file 2>&1`, `2> file`, and `&> file`.
5. Enable `set -o pipefail` and create a pipeline where an earlier command fails — see how the exit status changes.

---

## 9. Final summary

- Pipes `|` connect stdout of one process to stdin of another. They are great for chaining small utilities to form powerful pipelines.
- Redirection (`>`, `>>`, `<`, `2>`) changes where stdin/stdout/stderr are connected — files, `/dev/null`, pipes.
- Remember the numbers 0 (stdin), 1 (stdout), 2 (stderr).
- Pipes transmit stdout by default; use `2>&1` to include stderr.
- Use `tee` when you want to _both_ observe and save pipeline output.
- Watch out for the order of redirections and the pipeline exit status behavior — `set -o pipefail` helps.

---

If you want, I can convert these notes into:

- A **PDF**/print-friendly format
- A **concise one-page cheat sheet** for your terminal wallpaper
- **Flashcards** (Q\&A) for quick revision
- **Code examples** (complete scripts) that you can run and play with

Tell me which format you prefer and I’ll produce it.
