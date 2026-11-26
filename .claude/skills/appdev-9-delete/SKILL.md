---
name: appdev-9-delete
description: Delete an application of the PLM extensions framework. Undoes everything done by appdev-1-create (files, route, settings nodes, service flag) plus later additions such as menu entries, after asking the user for confirmation. Use when removing an app.
---

# appdev-9-delete: Delete application

Removes an application completely: its files and every registration/setting. It is the inverse of `appdev-1-create` (and also cleans up what later `appdev-*` skills added for the same endpoint, such as Start Menu entries).

**Nothing is deleted before the user has confirmed an explicit summary of what will be removed.**

## 1. Identify the application

Always start by presenting the list of all available applications and letting the user select the one to delete. Do not skip the list, even if `.claude/state/current-app.json` names an application (that one is only marked "(current)" and listed first in its group). Only skip the list if the user already named the endpoint in the request; it must then still exist in the list.

1. Build the list from the application blocks of `routes/landing.js`, one entry per `router.get` line (endpoint, title, launch path such as `dev/<endpoint>` or `apps/<endpoint>`), grouped by the block heading:
   - **Development**: APPLICATIONS IN DEVELOPMENT
   - **Standard**: STANDARD APPLICATIONS
   - **Administration**: ADMINISTRATION UTILITIES
   - **Add-ins & custom**: Vault & INVENTOR ADDINS and CUSTOM APPLICATIONS

   Do not offer framework and developer-tool routes (landing, start, docs, UX developers block such as gallery/studio/template, monitoring, and similar services): these are not applications that this skill deletes.
2. The user must **pick from the list, never type a name**. AskUserQuestion allows only 4 options per question, so select in two steps:
   - First ask for the group (the four groups above, with the number of applications in each; omit empty groups).
   - Then list that group's applications as options (label: title, description: `/<endpoint>`), 3 per question plus a 4th option "More applications…" that shows the next page; the last page shows up to 4. Put the current application first.
3. Deleting an application outside the Development group affects released functionality. Say so explicitly in the confirmation (step 4) and mention that the file locations differ.

## 2. Inventory

Search for every trace of `<endpoint>` and list it. Use exact matches (route string `'/<endpoint>'`, object keys, file names) so that apps with similar names are not hit. Check at least:

| Where | What |
|---|---|
| `views/<folder>/<name>.pug` | view; `<folder>/<name>` is the launch path from the route line (for example `dev/inspections`, `apps/mbom`) |
| `public/javascripts/<folder>/<name>.js` | app script |
| `public/stylesheets/<folder>/<name>.css` | app styles |
| `public/javascripts/custom/<name>.js`, `public/stylesheets/custom/<name>.css`, `views/custom/<name>.pug` | custom hooks, if any exist |
| `routes/landing.js` | the `router.get('/<endpoint>' …)` line |
| `settings.js` | `exports.applications.<endpoint>` node (including its comment), `exports.server.servicesEnabled.<endpoint>`, any `exports.menu` command with `url : '/<endpoint>'`, any `exports.chrome` command with `url : '/<endpoint>?'` |
| `settings/custom.js` | `exports.applications.<endpoint>` node and any menu entry |
| `settings/*.js` (tenant settings) | any `<endpoint>` application node or menu entry |
| documentation | a dedicated documentation page/entry for the app, if appdev-5-doc created one (search `views/docs`, `routes/`, `claude/`) |
| other | any further references found by a project-wide search (excluding `node_modules`, `logs`, `.git`) |

Also read the applicable `.claude/state/current-app.json`.

## 3. Safety review

Before asking, gather what could be lost:

- Line count of each file to delete, and whether it has content (an app that went through `appdev-2-coding` is not empty).
- `git status --short -- <files>` for each: files shown as untracked (`??`) or modified have **no committed copy**, so deleting them cannot be undone. Many settings files in `settings/` are git-ignored, so they cannot be restored either.
- Settings nodes that contain more than the base structure (`labels`, `panels`, `viewerFeatures`).

References that are not clearly specific to this app (for example a shared helper that merely mentions the endpoint) are **not removed automatically**: list them separately as "found, will not be touched".

## 4. Ask for confirmation

Show a summary: application title and endpoint, the files to delete (with line counts), each registration/settings entry to remove (file and key), and a warning line if anything has no committed copy. Then ask with AskUserQuestion:

- **Delete application** (description: "Permanently removes everything listed above")
- **Cancel** (description: "Change nothing")

Proceed only on "Delete application". Any other answer (including free text that is not a clear yes) cancels without changes.

## 5. Delete

Use exact file paths (no globs) and targeted `Edit` operations; never rewrite or reformat `settings.js`, `settings/custom.js` or `routes/landing.js` as a whole, as they often carry unrelated uncommitted changes.

1. Delete the files: `rm` each existing file from the inventory (view, script, style, custom hooks, dedicated documentation page).
2. `routes/landing.js`: remove the `router.get('/<endpoint>' …)` line.
3. `settings.js`:
   - remove the `exports.applications.<endpoint>` node including its leading blank line or comment, keeping the surrounding formatting intact;
   - remove the `servicesEnabled` entry; if the **Applications in Development** group comment is then left without entries, remove the comment and its blank line too;
   - remove menu commands (`exports.menu`) and chrome commands (`exports.chrome`) of this app, including a now-dangling comma.
4. `settings/custom.js` and any other `settings/*.js` with an entry: remove the `<endpoint>` node and menu entry the same way.
5. Remove documentation entries/links that belong to this app only.
6. If `.claude/state/current-app.json` describes this endpoint, delete that file (or the application entry in it).

## 6. Verify and report

- Run `node --check` on every edited JS file (`settings.js`, `settings/custom.js`, other settings files, `routes/landing.js`).
- Search again for the endpoint using the inventory patterns and confirm no trace is left, apart from the items reported as "not touched".
- Report what was deleted/changed (one line each) and what, if anything, was left in place and why.

## 7. Offer a server restart

Only after the deletion is complete and verified: if the server was **started from within the console** (by this session or the `server-start` skill: a background server task of this session is still running, or `lsof -iTCP -sTCP:LISTEN -P -n | grep node` shows a listener whose working directory is this project and `.claude/state/server.json` exists), tell the user that the running server still serves the old routes and settings until it is restarted, and ask (AskUserQuestion, "Restart server" / "Not now") whether to restart it. On "Restart server", invoke the `server-start` skill. It asks for the environment file (defaulting to the last one used) and restarts.

If no server is running, or it was started elsewhere (not from this console), do not offer a restart; just mention that a restart is needed for the changes to take effect.

## Notes

- No git operations (no commit, stash or checkout) are performed by this skill.
- Deleting an app does not delete shared panels, framework code or data in PLM.
