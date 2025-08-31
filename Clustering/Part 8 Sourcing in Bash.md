# Sourcing in Bash — Detailed Notes (from transcript)

**Quick summary (one-line):**
Sourcing (`source file` or `. file`) runs a script **inside the current shell**, which makes the script's **functions, variables, and aliases** available in the current shell session (unlike executing the script which runs it in a subshell and leaves the current shell unchanged).

---

## Table of contents

1. Key concepts covered in the transcript (bullet list)
2. Exact behavior — running vs sourcing (with examples)
3. What gets made available when you source a file
4. Concrete examples and sample `scripts.sh`
5. Commands you’ll use and what they show (type, declare, alias, export)
6. Subshell vs current shell — why sourcing matters
7. Aliases, variables, functions — subtleties and pitfalls
8. Portability: `.` vs `source`
9. Making sourced changes permanent (where to put `source` lines)
10. Debugging and troubleshooting tips
11. Security and best practices
12. Advanced/extra: exporting functions, detecting if script is sourced, guarding interactive-only code
13. Quick cheat sheet & one-page summary

---

## 1) Key concepts covered in the transcript

- You can define variables and functions inside a shell script (example: `myvar=100`, `myfunc() { ... }`).
- To reference variables in bash you use `$` (e.g. `echo $myvar` or `${myvar}`).
- If you run a script normally (e.g. `./scripts.sh` or `bash scripts.sh`) the functions and variables inside that script are not available in your current shell — they run in a _subshell/child shell_.
- If you try to call a function or alias that was defined in a script you ran (not sourced), you will get `command not found`.
- `source filename` is a shell builtin that executes the file _in the current shell_ and makes functions, variables and aliases available in the current session.
- `.` (dot) is the short form (abbreviation) for `source` in many shells — `. filename` is equivalent to `source filename` in bash; this shorthand is very common.
- `type source` (and `type .`) show that `source` and `.` are shell builtins; `type` itself is also a shell builtin.
- Sourcing is often used to split bash scripts into reusable pieces (so you can keep functions/aliases/variables in separate files and include them where needed).

---

## 2) Running vs Sourcing — exact behavior (examples)

### Example file `scripts.sh` (simple):

```bash
# scripts.sh
myvar=100
myfunc() {
  echo "hello from myfunc"
}
alias runP='node playground.js'
```

### Running the script (does NOT change current shell):

```bash
$ bash scripts.sh       # runs in a child shell
$ myfunc                # -> command not found
$ echo $myvar           # -> (empty)
$ runP                  # -> command not found
```

Why: `bash scripts.sh` or `./scripts.sh` runs the file in a new process (subshell). Changes are local to that shell and disappear when the child exits.

### Sourcing the script (makes definitions available):

```bash
$ source scripts.sh     # or: . scripts.sh
$ myfunc                # -> prints: hello from myfunc
$ echo $myvar           # -> 100
$ runP                  # -> runs `node playground.js`
```

Key: `source` executes the commands in the current shell process, so variables/aliases/functions defined inside the file become available in the current shell.

---

## 3) What gets made available when you source a file

From the transcript: "three things will be exported from these files" — these are:

1. **Functions** (e.g. `myfunc`) — available to call directly.
2. **Variables** (e.g. `myvar`) — available to reference via `$myvar`.
3. **Aliases** (e.g. `alias runP='node playground.js'`) — aliased commands available in the current shell.

**Important nuance:**

- When we say "exported" in the context of _sourcing_, it means _made available in the current shell session_. This is different from the `export` command which marks an environment variable to be passed to _child processes_.
- A variable becomes an environment variable for child processes only if you use `export VAR=value` or `export VAR` after assignment. Sourcing by itself doesn't automatically `export` ordinary shell variables to child processes.

---

## 4) Concrete examples and recommended snippets

### Minimal `scripts.sh` (good form):

```bash
# scripts.sh - content meant to be sourced
# Avoid calling `exit` in files that might be sourced: use `return` where appropriate.

# variable
myvar=100

# function
myfunc() {
  printf "hello from myfunc\n"
}

# alias
alias runP='node playground.js'
```

### Using it interactively:

```bash
$ . ./scripts.sh      # dot form
$ echo $myvar         # -> 100
$ myfunc              # -> hello from myfunc
$ runP                # executes node playground.js
```

Notes:

- `return` can be used in a sourced file to stop its execution (but `return` will error if the file was executed as a standalone program). To write a script that safely acts both as a script and as a sourced library, guard `return` calls with checks (see advanced section).
- Files that are only meant to be sourced generally should NOT call `exit` because that will close the interactive shell.

---

## 5) Useful commands to inspect what happened

- `type name` — tells you whether `name` is a builtin, function, alias or external command. Example: `type myfunc` -> "myfunc is a function".
- `type -a name` — shows all matches.
- `type -t name` — outputs just the type (e.g. `alias`, `function`, `builtin`, `file`).
- `declare -f functionname` — prints the function definition.
- `alias` — lists current aliases.
- `alias name` — shows a particular alias.
- `set | grep VAR` or `printf '%s\n' "${!VAR@}"` — inspect variables; `declare -p VAR` prints a variable's attributes/value.
- `export -p` — lists exported environment variables.

Use these to verify a sourced file actually created the things you expected.

---

## 6) Subshell vs current shell — the root cause

- **Running a script normally (`./a.sh`, `bash a.sh`)** spawns a new process (subshell). Any variables, functions, aliases defined in that subshell affect only the child; when it exits they vanish.
- **Sourcing (`source a.sh` or `. a.sh`)** executes file content in the _current process_, so any state changes remain in your current shell session.

This explains the `command not found` error you saw when trying to call `myfunc` after running (not sourcing) the script.

---

## 7) Aliases, variables, functions — details & pitfalls

**Variables**

- Assignment: `myvar=100` (NO spaces around `=`).
- Reference: `$myvar` or `${myvar}`.
- Typing `$myvar` at prompt without a command: if you type `$myvar` alone, the shell will try to execute the value as a command (not print it). To print use `echo $myvar` or `printf '%s\n' "$myvar"` .
- `export myvar` or `export myvar=100` makes the variable visible to child processes.

**Functions**

- Defined using `myfunc() { ... }` or `function myfunc { ...; }` (bash). After sourcing, `type myfunc` shows it as a function.
- `declare -f myfunc` prints function body.
- To make a function visible to child shells (unusual), use `export -f myfunc` (bash-only behavior).

**Aliases**

- `alias runP='node playground.js'` defines a shorthand.
- Aliases are only expanded in interactive shells by default. If you want aliases inside scripts, set `shopt -s expand_aliases` at top of script (but this is rarely done).
- Aliases defined in a sourced file become available in the current shell immediately.

---

## 8) Portability: `.` vs `source`

- `.` (dot) is the POSIX-standard command to source a file: `. file`
- `source file` is commonly available in bash and some other shells, but `.` is more portable (e.g. works in `/bin/sh` too).
- In bash: `.` and `source` are equivalent. The transcript shows the dot shorthand is frequently used because sourcing is extremely common.

---

## 9) Making sourced changes permanent (where to put `source` lines)

If you want functions/aliases/variables available every time you open a shell:

- For **interactive non-login bash shells** (typical when you open a terminal emulator): add `source ~/scripts.sh` (or `. ~/scripts.sh`) into `~/.bashrc`.
- For **login shells** (login via tty or some remote sessions): `~/.bash_profile` or `~/.profile` may be used; `~/.bash_profile` often sources `~/.bashrc` already.
- For **zsh** use `~/.zshrc`.

Example to persist alias & functions:

```bash
# in ~/.bashrc
if [ -f "$HOME/.my_bash_lib" ]; then
  . "$HOME/.my_bash_lib"
fi
```

Reload with `source ~/.bashrc` or open a new terminal.

---

## 10) Debugging & troubleshooting tips (when things go wrong)

- If you get `command not found` after running a script: you likely executed it instead of sourcing it. `type myfunc` -> should show function.
- If `alias` is not available after sourcing: ensure you sourced the file and you are in an interactive shell. Use `alias` to list.
- If `echo $myvar` is empty: ensure the file that sets it was sourced and not executed as a child shell.
- If a sourced file seems to do nothing: check for syntax errors in the file — a syntax error may stop execution early.
- Use `set -x` (set -o xtrace) before sourcing to see commands executed, and `set +x` to turn it off.
- `declare -p VAR` will show whether a variable exists and how it is declared.
- `type -t NAME` returns `function`, `alias`, `builtin`, or `file`.

---

## 11) Security & safety considerations

- **Sourcing executes arbitrary code**. Never source files from untrusted/unverified sources (e.g., random scripts downloaded from the internet) because they will run in your shell and can modify your environment or run malicious commands.
- If you must source third-party scripts, inspect them first.

---

## 12) Advanced/extra topics (useful to know)

**Exporting functions:**

- Bash allows `export -f funcname` to export a function into the environment so child bash processes can import it. This is a bash-specific feature and not portable.

**Detecting if a script is being sourced or executed:**

- Pattern to check in bash:

```bash
# inside a script
(return 0 2>/dev/null) && sourced=1 || sourced=0
if [ "$sourced" -eq 1 ]; then
  echo "I'm being sourced"
else
  echo "I'm being executed"
fi
```

- Alternative bash-specific check:

```bash
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  echo "sourced"
else
  echo "executed"
fi
```

**Write a file that is safe to both source and execute:**

- Common trick: put functions/aliases/vars in file, and at the bottom add a conditional `if` that runs only when the file is executed (not when sourced). For example:

```bash
# library content (functions, aliases, vars)

# Only run tests / main when executed directly
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  # script executed directly
  main "$@"
fi
```

**Guard interactive-only code:**

- If some aliases or commands should run only in interactive shells, you can guard them:

```bash
if [[ $- == *i* ]]; then
  # interactive only: set aliases, PS1, etc.
fi
```

**Return vs exit:**

- `return` works in sourced files to return to caller. `exit` will close the whole shell if the file is sourced in an interactive session — usually unwanted. Use `return` when writing libraries intended to be sourced.

---

## 13) Quick cheat sheet

- Source a file: `. filename` or `source filename`
- Make variable available to child processes: `export VAR=val`
- See if name is function/alias: `type name` or `type -t name`
- Print function body: `declare -f funcname`
- Debug sourcing: `set -x; source file; set +x`
- Make persistent: add `. ~/scripts.sh` to `~/.bashrc`

---

## 14) One-page concise summary (for review after a year)

- **Sourcing** executes a file in the current shell; **running** starts a child shell. Use sourcing when you want the file to modify your current environment (functions, variables, aliases).
- Use `.` (dot) for portability; `source` in bash is the more readable alternative.
- Sourced files should avoid `exit`. Use `return` or add guards so they are safe to include in interactive shells.
- To persist settings, put `source` lines into `~/.bashrc` (or the appropriate shell rc file).
- Always inspect third-party scripts before sourcing them — they run with your privileges.

---

## 15) Suggested small exercises (practice)

1. Create `~/mybashlib` with a variable, a function, and an alias, then source it and use the items.
2. Move that `source ~/mybashlib` into `~/.bashrc`, open a new terminal, and verify things are available.
3. Try running the file vs sourcing and observe the difference (`type`, `echo`).
4. Add `set -x` and re-source to see the commands executed.
5. Try the `return` vs `exit` behavior: source a file that does `exit 1` vs `return 1` — note the effect.

---

## Closing note (from the transcript)

Sourcing is a small command with powerful consequences: it lets you split your shell configuration and reusable functions into separate files and then include them into any shell session so those functions, variables and aliases are available immediately. This is the primary reason `source`/`.` is so commonly used in real-world shells.

_End of detailed notes._

If you want, I can:

- produce a one-page printable PDF of this note, or
- produce a condensed summary (5–7 bullets) for quick review, or
- convert this into a `~/.my_bash_lib` example file for you to copy-paste.

Tell me which one and I'll prepare it.
