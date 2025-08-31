# Detailed notes — _Bash execution order_: aliases → functions → built-ins → PATH (executables)

_(Condensed, structured and memorable — covers every important point from your transcript + useful extras so you still remember this after a year.)_

---

## Big picture / primary takeaway

When you type a token (a command name) in bash or zsh and press **Enter**, the shell follows a fixed lookup/execution order to decide what to run:

**Aliases → Shell functions → Shell built-ins → External executables (searched in `$PATH`)**

Mnemonic: **A F B P** — “**A**liases, **F**unctions, **B**uilt-ins, **P**ATH”.
If nothing matches, you get `command not found`.

---

## Step-by-step (what the shell checks and why)

### 1) **Aliases** (highest precedence)

- Aliases are **text replacements** (simple macros).
- Create:

  ```bash
  alias ll='ls -la'
  alias runplay='node /full/path/to/playgrounds.js'
  ```

- Remove:

  ```bash
  unalias ll        # remove single alias
  unalias -a        # remove all aliases
  ```

- Notes:

  - Aliases override anything else with the same name (even built-ins or external programs).
  - Tab completion works for newly defined aliases in the **same interactive shell**.
  - Aliases are **only in that shell process** (and interactive shells that source the same rc files). They are **not automatically available** in other new shells unless saved in your shell rc file (e.g., `~/.bashrc` or `~/.zshrc`).
  - Use quotes if the replacement contains spaces or special characters.

### 2) **Shell functions**

- Functions are more powerful than aliases (accept args, multiple commands). They come next in precedence.
- Define:

  ```bash
  myfunc() {
    echo "Hello $1"
    # ...more commands...
  }
  ```

- Call: `myfunc arg1 arg2`
- Inside function use positional params: `$1`, `$2`, `$@`, `$*`. Prefer `"$@"` for safe argument forwarding.
- Remove:

  ```bash
  unset -f myfunc   # reliably removes a function
  ```

  (`unset -f` is the canonical way to remove functions.)

- `type funcname` tells you it is a shell function.
- Scope: Like aliases, functions defined interactively live only in that shell process unless you persist them in an rc file.

### 3) **Shell built-ins**

- Examples: `echo`, `eval`, `disown`, `cd` (many common commands).
- `type echo` often reports: `echo is a shell builtin`.
- Built-ins are implemented inside the shell: calling them avoids forking a new process → **faster**.
- You can override built-ins by defining a function or alias with the same name (because of precedence).

**Important nuance:** many built-ins also have external executable counterparts (e.g., `/bin/echo`). The shell may prefer the builtin for performance, but an external file can also exist.

Use `type -a echo` to see _all_ matches (alias, function, builtin, external).

### 4) **External executables — `$PATH` (last)**

- If not alias/function/builtin, shell searches directories listed in `$PATH` (colon `:` separated).
- View `$PATH` cleanly:

  ```bash
  echo $PATH | tr ':' '\n'
  ```

- `$PATH` contains directories like `/usr/bin`, `/bin`, `~/.nvm/...` etc.
- If an executable exists in one of those directories, that program is started.
- If not found anywhere in `$PATH`, shell reports **command not found**.
- You can run an executable by absolute path to bypass `$PATH` lookup:

  ```bash
  /bin/ls
  /usr/local/bin/node
  ```

---

## Node.js and child processes (spawn vs exec) — why aliases/functions often fail

- `child_process.spawn()` (the streamed API) **does not start a shell by default**. It directly starts an executable file by name and **only** searches `$PATH` for it. It **does not** know about shell aliases, shell functions, or shell built-ins.

  - Example:

    ```js
    const { spawn } = require('child_process');
    spawn('node', ['playgrounds.js']); // looks in PATH for `node`
    // If node isn't in PATH: spawn('/full/path/to/node', [...])
    ```

- `child_process.exec()` runs a command through a shell (by default `/bin/sh` on Unix) — so shell parsing happens and shell features could be available **if the shell session actually loads them**. You can override which shell `exec` uses:

  ```js
  exec('l', { shell: '/bin/zsh' }, callback);
  ```

  But note: non-interactive non-login shells often **don't** source the same rc files where aliases/functions are defined → **aliases may still be missing**.

- **Practical rule:** If you want to run a program from Node, rely on executables in `$PATH` (or use absolute paths). Don’t assume aliases/functions defined in your interactive shell exist for child processes.

---

## `$PATH`, environment variables & Node

- `$PATH` is an **environment variable** (uppercase `PATH`) — child processes inherit exported environment variables.
- In Node: `process.env.PATH` (or `process.env.Path` on Windows) reflects the PATH the process received.
- If you change PATH in your shell **and export it**, child processes (like Node you run after that change) will see the updated PATH:

  ```bash
  export PATH="$PATH:/my/new/dir"
  node playgrounds.js  # process.env.PATH will include /my/new/dir
  ```

- If you only assign `PATH=...` without `export` (or modify a shell-only variable), child processes might not get it.
- Tools like **nvm** modify PATH when you switch node versions; that explains the PATH changes shown when doing `nvm use 18` etc.

---

## Useful commands to inspect what's happening

- `type cmd` — tells whether `cmd` is an alias, function, builtin or file and where.
- `type -a cmd` — show all matches (alias, function, builtin, and each PATH entry).
- `command -v cmd` — prints the path or builtin (POSIX-ish).
- `which cmd` — searches PATH for executable (less informative about aliases/functions).
- `whereis cmd` — search for binary/man sources (different purpose).
- `alias` — list aliases.
- `declare -f` (bash) — shows function definitions.
- `echo $PATH | tr ':' '\n'` — pretty print PATH.

---

## Examples (from transcript, made explicit)

Define alias (relative path caveat):

```bash
# relative path — only works when working directory matches:
alias runplay='node playgrounds.js'

# better: use absolute path so you can run it anywhere:
alias runplay='node /home/you/UncacheCode/Unix/playgrounds.js'

# check:
type runplay   # "runplay is an alias for `node /.../playgrounds.js`"

# remove:
unalias runplay
```

Define function and use args:

```bash
cur() {
  cd /home/you/UncacheCode/Unix
}
# call:
cur
# with arguments:
greet() { echo "hello $1"; }
greet world   # outputs "hello world"
# remove:
unset -f cur
```

Check echo builtin vs external:

```bash
type echo         # "echo is a shell builtin"
type -a echo      # shows builtin and maybe /bin/echo
whereis echo      # finds /bin/echo (if exists)
```

Inspect PATH from Node:

```js
// node playgrounds.js containing:
console.log(process.env.PATH);
```

Spawn vs exec example:

```js
const { spawn, exec } = require('child_process');

spawn('l'); // fails: `l` is an alias in your interactive shell, not an executable in PATH

exec('l', { shell: '/bin/zsh' }, (err, out) => {
  // may still fail if non-interactive shell doesn't source your aliases
});
```

---

## Important gotchas & practical advice (from transcript + best practices)

- **Aliases and functions are process-local.** If you define them interactively, they exist only in that shell process. New shells won’t automatically have them unless you saved them in the appropriate rc file (e.g., `~/.bashrc`, `~/.zshrc`).
- **Scripts & non-interactive shells generally don’t load interactive aliases.** Don’t rely on aliases in scripts — use full commands or functions defined in scripts or source an rc file intentionally.
- **Use absolute paths** in aliases if you want to run them from any working directory.
- **Export `$PATH`** if you want child processes to see your PATH changes; to persist for every new shell, add `export PATH="$PATH:/your/dir"` to your shell’s rc file.
- **Aliases override builtins and executables** — be careful. If you redefine common names (`ls`, `echo`) you may hide system behavior.
- **Use `type -a`** when diagnosing whether something is alias/function/builtin/file — it's the clearest tool.
- **Builtins exist to improve performance** (no fork exec) — many very common commands are built-in for that reason.
- When using Node's child processes, prefer `spawn` for direct executables and `exec` only when you need shell features — but remember the shell used may be a non-interactive shell.

---

## Quick cheat-sheet (copy/paste)

```text
# show everything about `cmd`
type -a cmd

# add to PATH for current session
export PATH="$PATH:/my/new/path"

# persist alias/function to new interactive shells
# append to ~/.bashrc or ~/.zshrc, then source:
echo "alias ll='ls -la'" >> ~/.bashrc
source ~/.bashrc

# create function
myfunc() { echo "arg1 is $1"; }
unset -f myfunc   # remove function

# remove alias
unalias myalias

# view PATH nicely
echo $PATH | tr ':' '\n'
```

---

## Final short summary (one-liner you can memorize)

**When you hit Enter, bash/zsh checks: Aliases → Functions → Builtins → External programs in `$PATH`.**
Child processes (like Node `spawn`) only see PATH executables; shells started non-interactively may not have your interactive aliases/functions unless you persist them.

---

If you want, I can now:

- convert this into a printable 1-page cheat sheet PDF, or
- produce a short memory mnemonic poster you can stick on the wall, or
- create practical exercises (5–10 hands-on tasks) that cement each point (aliases, functions, builtins, PATH, spawn vs exec).

Which of those would you like next?
