# Unix File Permissions — Detailed Study Notes

**Source:** Transcript — _A Few Notes about Unix File Permissions_ (edited, clarified & expanded).

> Purpose: condensed, accurate, and permanent reference so you can understand everything from the video/transcript even after a year. This note keeps all key points from the transcript and adds clarifications, corrections, examples and troubleshooting steps.

---

## TL;DR (one-paragraph summary)

Unix files and directories carry a type field plus three permission triplets (owner, group, others). Each triplet has `r` (read), `w` (write) and `x` (execute). Use `ls -l` (or `ll`) to view them. Change permissions with `chmod` (symbolic `u+x` / `g-w` or numeric `755`), change owner/group with `chown`/`chgrp`. For scripts: either invoke an interpreter (`bash script.sh`) or make the file executable (`chmod u+x script.sh`); note the important difference between _binary executables_ (machine code) and _scripts_ (interpreted). Use `whoami`, `id`, `stat`, and `file` to inspect ownership/type. Many gotchas (execute-only without read, PATH, setuid/setgid/sticky bits) are covered below.

---

## 1) `ls -l` output — what each column means

Example output:

```
-rwxr-xr-x 1 root staff  4096 Aug 30 12:34 scripts.sh
drwxr-xr-x 2 joseph staff 4096 Aug 30 12:10 test/
```

Breakdown (left → right):

- **First character** — **file type**:

  - `-` regular file
  - `d` directory
  - `l` symbolic link
  - `c` character device
  - `b` block device
  - `p` named pipe (FIFO)
  - `s` socket

- **Next 9 characters** — three permission groups (each 3 chars):

  1. **owner** (user) permissions — positions 2–4
  2. **group** permissions — positions 5–7
  3. **others** (world) permissions — positions 8–10

  - positions use `r` (read), `w` (write), `x` (execute) or `-` if absent

- The next columns show: link count, **owner username**, **group name**, file size, modification time, and **filename**.

**Quick note about colors:** `ls --color` (Linux) or `ls -G` (macOS/BSD) can show colors for executables, directories, symlinks, etc. The transcript mentions color change when adding `x`.

---

## 2) Owner / Group / Others — what they mean

- **Owner (user)** — the specific user who owns the file (e.g., `joseph`). The first permission triplet applies to them.
- **Group** — group of users (e.g., `staff`) — the second triplet applies to users in that group.
- **Others** — everyone else — the third triplet applies to users who are neither owner nor in the file's group.

You can change owner/group with `chown` and `chgrp` (superuser may be required):

```
sudo chown alice scripts.sh   # change owner to alice
sudo chgrp devs scripts.sh    # change group to 'devs'
```

To find your current username: `whoami` (transcript used `who am I?` but command is `whoami`). `sudo whoami` prints `root` after successful authentication.

---

## 3) Read / Write / Execute meaning (practical)

- **Read (`r`)**

  - Files: can open/read contents (eg. `cat`, editor). Without read, you cannot view file contents.
  - Directories: `r` lets you list filenames inside (but not stat metadata unless you also have `x`).

- **Write (`w`)**

  - Files: can modify/overwrite the file.
  - Directories: can create, delete, or rename entries in that directory (subject to other checks and sticky bit rules).

- **Execute (`x`)**

  - Files: _permission to execute_ the file as a program.
  - Directories: allows you to _enter_ the directory (`cd`) and access entries (you need `x` to access metadata of files within).

**Important nuance (script vs binary):**

- **Binary executables** (compiled machine code, ELF on Linux) are loaded/executed by the kernel if the file has the `x` bit for the invoking user — **read bit is not strictly required** for execution by kernel.
- **Script files** (shell scripts, Python scripts, etc.) are executed by an interpreter (e.g. `/bin/bash`, `/usr/bin/python`). The interpreter must _open and read_ the script file. That means for a script you normally need both **read (`r`)** _and_ **execute (`x`)** for the execution flow to succeed when you run it directly (e.g., `./script.sh`).

Transcript emphasized: making a file executable without read (e.g., `--x`) will often still lead to errors for scripts because the interpreter cannot read it. That's why `chmod +x` alone doesn't guarantee success for scripts — ensure there is read permission for the interpreter.

---

## 4) How kernels and shells invoke scripts — three ways to run a script

1. **Direct exec**: `./script.sh`

   - Kernel reads the first line (the _shebang_, e.g. `#!/bin/bash`) and loads the interpreter, then runs it with the script path as an argument. Interpreter must be able to open the file.
   - File must have **execute** permission for you; interpreter will need **read** permission to read the script.

2. **Call interpreter explicitly**: `bash script.sh` or `sh script.sh` or `python myprog.py`

   - The interpreter is explicitly started and it reads the file directly. The file does **not** need the executable bit, but it must be readable by the interpreter (`r` permission).

3. **Source / dot (`.`)**: `. script.sh` or `source script.sh`

   - Runs the script _in the current shell process_ (no child process). Environment changes (exports, variables) affect current shell. This **does not require execute** permission, but requires read permission (shell must read it).

**Common misstatement corrected (from transcript):**

- The transcript said running `scripts.sh` directly executes it "in the current shell" while running `bash scripts.sh` opens a new shell. This is not correct: `./script.sh` spawns a new process (child process), not execute _in the current shell_. The one that executes in the current shell is `source script.sh`.

---

## 5) `chmod` — symbolic and numeric modes

**Symbolic examples (used in the transcript):**

- `chmod u-rw scripts.sh` — remove read and write from owner (user).
- `chmod u+r scripts.sh` — add read to owner.
- `chmod u+w scripts.sh` — add write to owner.
- `chmod u+x scripts.sh` — add execute for owner.
- You can also use `g`, `o`, `a` (group, others, all) and operators `+`, `-`, `=`. Example: `chmod a+x file` adds execute to owner/group/others.

**Numeric (octal) notation (fast & common):**

- Positions: `owner` `group` `others`. Each digit is sum of `r=4`, `w=2`, `x=1`.

| Octal | rwx           |
| ----: | :------------ |
|     7 | `rwx` (4+2+1) |
|     6 | `rw-` (4+2)   |
|     5 | `r-x` (4+1)   |
|     4 | `r--` (4)     |
|     0 | `---` (0)     |

Examples:

- `chmod 755 scripts.sh` → owner `rwx`, group `r-x`, others `r-x` (common for executable scripts).
- `chmod 644 file.txt` → owner `rw-`, group `r--`, others `r--` (common for data/config files).
- `chmod 700 secret.sh` → only owner can read/write/execute.

**Special modes (combined numeric digits):**

- Add a leading digit for setuid/setgid/sticky: `chmod 4755 file` (setuid + rwxr-xr-x), `chmod 2755 dir` (setgid), `chmod 1777 /tmp` (sticky + rwxrwxrwx).

---

## 6) setuid, setgid, sticky bits — short explanation

- **setuid** (`4xxx` / `s` in the owner execute bit) — when set on an executable, the program runs with the _file owner's_ privileges (often root). Example: `/usr/bin/passwd` needs to modify `/etc/shadow` so it runs with elevated rights.
- **setgid** (`2xxx` / `s` in group execute bit) — runs with the file's group privileges; on directories, newly created files may inherit group of the directory.
- **sticky** (`1xxx`, `t` in others execute bit) — on directories (example `/tmp` with `1777`), files can only be deleted by their owner, the directory owner, or root.

**Security note:** setuid on scripts is dangerous and usually disallowed; prefer setuid binaries only when necessary and audited.

---

## 7) Binary vs Script — more detail

- **Binary executable**: compiled program (machine code). Kernel loads and executes directly. Typical locations in `$PATH`: `/bin`, `/usr/bin`, `/sbin`. Binaries often owned by `root` and have `r-x`/`r-x` for owner/group/others.
- **Script**: human-readable text file starting with `#!` (shebang) that points to an interpreter, e.g., `#!/bin/bash`. The interpreter reads and executes the script lines.

Transcript note: "Bin stands for binary" — correct historically (binary programs/executables). In practice `/bin` contains general user commands.

---

## 8) PATH and running commands by name

- When you type a command like `ls` or `cat`, the shell searches directories listed in the `PATH` environment variable (e.g., `/usr/local/bin:/usr/bin:/bin`) for an executable of that name and spawns it.
- Files in `/bin` are normally root-owned binaries with `x` bit set so any user can execute them.
- If you want to run a script in the current directory, use `./myscript` (unless `.` is in your PATH, which is not recommended for security reasons).

---

## 9) Troubleshooting: permission denied when running a script

Checklist (run these commands to diagnose):

```
ls -l scripts.sh         # check perms & owner
head -n 1 scripts.sh     # check shebang (#!/bin/bash etc.)
whoami                   # check which user you are
id                       # see groups you belong to
file scripts.sh          # is it script text or a binary?
stat scripts.sh          # detailed permission/ownership/st_mode
```

Common causes & fixes:

- **Cause:** No `x` for you on the file. Fix: `chmod u+x scripts.sh` (or `chmod a+x` if appropriate).
- **Cause:** Script lacks `r` for the interpreter. Fix: `chmod u+r scripts.sh` (or `chmod a+r` if needed).
- **Cause:** You're trying to run a binary owned by `root` without proper rights (unlikely — binaries are usually executable by others). Check ownership or use `sudo` for privileged operations.
- **Cause:** Trying to run using `./file` but the directory permissions deny traversal; add `x` to directory or `cd` to it.

**Workaround:** Run `bash scripts.sh` — this uses the interpreter directly; the file does not need the `x` bit but must be readable.

---

## 10) Commands quick-reference (most used)

- `ls -l` — long listing with permissions
- `ls -lG` or `ls --color=auto` — show colors
- `chmod u+x file` / `chmod 755 file` — change permissions
- `chown user file` — change owner
- `chgrp group file` — change group
- `whoami`, `id` — show current user and groups
- `file filename` — detect file type (binary vs text)
- `stat filename` — show numeric mode and more
- `head -n 1 file` — check shebang

---

## 11) Best practices & recommendations

- For executable scripts used by others, use `chmod 755 script.sh` and set owner appropriately.
- For config/data files, use `chmod 644` so only owner can write.
- Avoid `chmod 777` (gives write to everyone) except very specific, temporary cases.
- Do not enable setuid for scripts (security risk).
- Use `source` when you intentionally want a script to modify the current shell environment; otherwise run scripts as children (`./script.sh`) so environment stays isolated.
- Keep sensitive files owned by the correct user and not globally readable unless necessary.

---

## 12) Handy mnemonics

- `r=4`, `w=2`, `x=1` → add to get octal digits. Example: `rwx` → 4+2+1 = 7.
- Permission triplet order: `u` (owner) `g` (group) `o` (others).
- `chmod u+x` — remember `u` is **you** (file owner), `g` group, `o` others.

---

## 13) Transcript highlights (key points taken from the video/transcript)

- You’ll often see `permission denied` when trying to run files; this comes down to missing `x` or `r` bits.
- `ls -l` shows the permission string; first char is file type (e.g., `d` for directory).
- Permissions are in three sets: owner, group, others; owner and group are visible in `ls -l` output.
- `chmod` is the command to change permissions: `u` for user owner modifications, `+` to add `-` to remove.
- `whoami` prints your username; `sudo whoami` prints `root`.
- `bin` stands for binaries (compiled machine code). Terminal scripts are not the same as compiled unix executables. Scripts require an interpreter.
- `bash script.sh` executes by telling bash to read the file; `./script.sh` uses the executable bit and the shebang to find interpreter.
- If only `x` is present but not `r`, scripts often still fail because they are not readable by the interpreter.

---

## 14) Appendix: example session (illustrative)

```
$ ls -l scripts.sh
-rw-r--r-- 1 joseph staff 234 Aug 30 12:34 scripts.sh
$ ./scripts.sh
bash: ./scripts.sh: Permission denied
$ chmod u+x scripts.sh
$ ls -l scripts.sh
-rwxr--r-- 1 joseph staff 234 Aug 30 12:34 scripts.sh
$ ./scripts.sh
# If script has proper shebang and is readable, it will run.
```

If instead `scripts.sh` had been set to `--x------` and not readable by the owner, the interpreter would fail to open it and you'd still see permission errors for scripts.

---

## 15) Final notes & what I corrected/added

- I kept everything the transcript said but clarified the **sourcing vs executing** distinction (big source of confusion in the transcript) and corrected the description about what runs "in the current shell".
- I added explanation of binary vs scripts, octal notation, special bits (setuid/setgid/sticky), `file`/`stat` utilities, and practical troubleshooting steps.

---

If you want this formatted differently (one-page printable cheat-sheet, flashcards, or a PDF), tell me and I’ll convert this note into that format.
