---
name: server-stop
description: Stop the PLM extensions server running in the console, without asking any questions. Use when the user wants to stop, shut down or kill the server.
---

# server-stop: Stop the server

Shuts down the server of this project. **Do not ask the user anything**, neither for confirmation nor for a choice; just stop it and report.

## 1. Stop a server started by this session

If a server was started earlier in this session as a background task (for example by `server-start`), stop that task (TaskStop).

## 2. Stop any other server of this project

Find node listeners and keep only those whose working directory is this project's root:

```bash
ROOT="$(pwd -P)"
for pid in $(lsof -iTCP -sTCP:LISTEN -P -n -c node -t 2>/dev/null | sort -u); do
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
  if [ "$cwd" = "$ROOT" ]; then
    port=$(lsof -a -p "$pid" -iTCP -sTCP:LISTEN -P -n | awk 'NR>1{n=split($9,a,":"); print a[n]; exit}')
    echo "$pid $port"
  fi
done
```

For each match (PID and port), send `kill <pid>` (SIGTERM). Wait up to about 5 seconds for the port to be released (`lsof -iTCP:<port> -sTCP:LISTEN`); if the process is still alive after that, send `kill -9 <pid>`.

Never kill processes whose working directory is not this project's root, and never kill by process name (`pkill node`). Other node processes are silently left alone, without asking.

## 3. Report

One short message:

- which server(s) were stopped (PID and port), or "No server of this project is running."
- if a process could not be stopped, say so plainly with the PID and the error.

Do not change `.claude/state/server.json`; the last used environment stays the default for `server-start`.
