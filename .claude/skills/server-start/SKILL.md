---
name: server-start
description: Start or restart the PLM extensions server from the console, asking which environment file to use (environment.js or any file in /environments) and defaulting to the last one used. Use when the user wants to start, restart or test the server.
---

# server-start: (Re)start the server

Starts the server for the selected environment file. If a server of this project is already running, it is stopped first (restart).

## State

The last used environment file is stored in `.claude/state/server.json`:

```json
{ "environment": "environments/trialkt.js" }
```

`environment` is a path relative to the project root: either `environment.js` or `environments/<name>.js`. If the file does not exist or has no value, there is no default.

## 1. Choose the environment file

1. List the candidates: `environment.js` plus every `*.js` file in `environments/`, excluding `template.js` (a copy source, not a tenant). Print the list (names only) in the message so the user can see what is available.
2. Read the last used value from `.claude/state/server.json`; ignore it if the file it names no longer exists.
3. Let the user **pick from the list; never ask them to type a filename.** AskUserQuestion allows only 4 options per question, so page through the full list:
   - Build the ordered list: the last used file first (labelled `(Recommended)`, description "last used"), then `environment.js` (if not already first), then all files of `environments/` in alphabetical order. Every candidate must be reachable.
   - Each question shows the next 3 candidates plus a 4th option **"More environments…"** (description: "Show the next files, X of Y shown"). On the last page (4 or fewer candidates left) show them all and no "More" option.
   - If the user chooses "More environments…", ask again with the next page. Continue until a file is chosen.
   - Option labels are the file names (`environment.js`, `trialkt.js`, ...); descriptions say where they live (`project root` or `environments/`).
   - The tool adds an automatic "Other" entry that cannot be removed. Do not mention it or invite typing. If the user nevertheless enters text, treat it only as a hint: if it exactly matches a listed file use that file, otherwise show the list again.
4. Skip the question only if the user already named the environment in the request (for example "start with trialkt"); still validate it exists in the list.

If the caller (for example `appdev-1-create`) has already asked, reuse that answer instead of asking again.

## 2. Stop a running server (restart)

- If this session started a server in the background earlier, stop that task (TaskStop).
- Otherwise check for a listener of this project: `lsof -iTCP -sTCP:LISTEN -P -n | grep node`, then confirm the process belongs to this project (`lsof -p <pid> | grep cwd` shows the project root). If one is running that this session did not start, tell the user the PID and port and ask before killing it. Never kill processes that are not this project's server.
- Wait until the port is free before starting.

## 3. Start

Run from the project root, in the background (`run_in_background: true`):

| Selection | Command |
|---|---|
| `environment.js` | `npm start` |
| `environments/<name>.js` | `npm start -- <name>` |

(`app.js` takes the environment name from `process.argv[2]`, with or without `.js`.)

Save the selection to `.claude/state/server.json` (create the `.claude/state` folder if needed; overwrite only the `environment` value).

## 4. Report

Read the startup output once (the background task's output file) after a few seconds and report:

- the environment file used, tenant, and port (`Listening on port ...`)
- the URL, `http://localhost:<port>/`; and, if called from another skill, the app URL
- any startup errors, for example a missing environment file or settings file, or a port already in use. If the server did not come up, say so plainly and show the relevant output lines.

Remind the user that APS login is required to open applications, and that the environment's `redirectUri` must match the port. Offer to stop the server when done.
