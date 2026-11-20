---
name: appdev-1-create
description: Create a new application in the PLM extensions framework (new endpoint, settings node, route registration, service flag and empty dev files from template). Use when the user wants to add a new app, endpoint or page.
---

# appdev-1-create: Create application

Scaffolds a new, empty application in the **in-development** area (`dev` folders). No documentation entry is created at this point, and no application logic is written (that is `appdev-2-coding`).

Reference: `claude/ADDING-APPLICATIONS.md` (the seven-piece pattern). This skill is a variant of it that uses the `dev` folders and omits the `custom` hook files.

## 1. Gather input

Ask the user for the following in a single message (skip anything already supplied in the skill arguments or earlier in the conversation), then wait for the answer:

| | Input | Required |
|---|---|---|
| a | **Title** of the application (shown as page title and in `#header-title`) | yes |
| b | **Description** of the application | no |
| c | **Endpoint** (URL segment, e.g. `client` for `/client`) | no |

Do not proceed without a title. The description is only used for the comments in `settings.js` and `routes/landing.js` entries (keep it to a few words there); do not build functionality from it.

### Endpoint rules

- Lowercase letters, digits and hyphens only; start with a letter. No leading slash.
- **As short as possible**, ideally one word. The same name is reused as: URL, settings key, `servicesEnabled` key, and the pug/js/css file names.
- **Must be unique.** Treat it as taken if it matches any of:
  - a `router.get('/<name>'` entry in `routes/landing.js`
  - a key in `exports.applications` or `exports.server.servicesEnabled` in `settings.js`
  - an existing file `views/*/<name>.pug`, `public/javascripts/*/<name>.js` or `public/stylesheets/*/<name>.css`
  - a path prefix mounted in `app.js` (e.g. `plm`, `aps`, `docs`, `start`, `pdm`, `storage`, `services`, `bom-cache`, `monitoring`; check `app.use(` lines)
- Settings key == endpoint.

### If the user gives no endpoint

Derive 3 to 4 short candidates from the title (and description), check each against the uniqueness rules above, and present only available ones via AskUserQuestion (shortest and most descriptive first, mark your pick as recommended). The user can pick "Other" to type their own. If a user-supplied endpoint is not unique or violates the rules, explain why and offer alternatives the same way.

Confirm the final choice (title, endpoint) before changing any file.

### Store the application for later reference

Once title and endpoint are settled (and before creating any files), save the application so that later skills (`appdev-2-coding` and following) know which application to work on. Write `.claude/state/current-app.json` (create the `.claude/state` folder if needed; it replaces any earlier content):

```json
{
  "endpoint": "<endpoint>",
  "title": "<Title>",
  "description": "<description, or empty string>",
  "area": "dev",
  "files": {
    "view": "views/dev/<endpoint>.pug",
    "script": "public/javascripts/dev/<endpoint>.js",
    "style": "public/stylesheets/dev/<endpoint>.css"
  },
  "settingsKey": "<endpoint>",
  "stage": "creating",
  "updated": "<ISO date>"
}
```

`stage` goes `creating` → `created` (set at the end of step 5 once verification passed). If the skill aborts in step 2, set it back or remove the file so it does not point to an app that was not created. If an earlier `current-app.json` exists, mention which application it is being replaced by the new one.

Other skills read this file to find the current application. Tell the user that `.claude/state/` is local working state and they may want to add it to `.gitignore`.

## 2. Pre-flight checks

Abort and report if any of these target files already exist (never overwrite):

- `views/dev/<endpoint>.pug`
- `public/javascripts/dev/<endpoint>.js`
- `public/stylesheets/dev/<endpoint>.css`

Also abort if `<endpoint>` already exists as a key in `exports.applications` of `settings/custom.js`.

Note: `settings.js`, `settings/custom.js` and `routes/landing.js` often have uncommitted changes. Use targeted `Edit` operations only; never rewrite or reformat those files.

## 3. Create files

Create exactly these three files (names equal the endpoint):

### `views/dev/<endpoint>.pug`

```pug
extends ../framework/layout

block head

    link(rel='stylesheet', href='/stylesheets/dev/<endpoint>.css')

    script(src='/javascripts/dev/<endpoint>.js')

block body

    body.surface-level-1

        #header.dark
            #header-logo
            #header-title= title
            #header-subtitle
            #header-toolbar
                #header-avatar

        #main.screen
```

Do **not** reference `custom/<endpoint>.css` or `custom/<endpoint>.js`, and do not create those files.

### `public/javascripts/dev/<endpoint>.js`

Empty file (0 bytes).

### `public/stylesheets/dev/<endpoint>.css`

Empty file (0 bytes).

(Create the empty files with the Write tool and empty content.)

## 4. Register the application

### a) `settings.js`: application node

Add a dedicated node in `exports.applications`, placed alphabetically among the existing application nodes, 4-space indented, matching surrounding style:

```js
    <endpoint> : { // <short description>

        labels         : {},
        panels         : {},
        viewerFeatures : {}

    },
```

This is the base structure: `labels`, `panels` and `viewerFeatures`, all empty. The one-line `//` comment with the description is optional. Do not add any further settings yet.

### a2) `settings/custom.js`: custom application node

Add the same node to `exports.applications` in `settings/custom.js`, but **empty**, in the same compact style as the neighbouring entries (placed alphabetically; the `addins` entry stays last):

```js
    <endpoint>     : {},
```

Align the colon with the neighbouring entries where practical. Leave the other parts of the file (`exports.common`, `exports.menu`, `exports.server`) untouched; do not add the service flag there.

### b) `routes/landing.js`: development applications

Add one line to the block **APPLICATIONS IN DEVELOPMENT**, alphabetically, aligned with the neighbouring lines:

```js
router.get('/<endpoint>', async function(req, res, next) { launch('dev/<endpoint>', '<endpoint>', '<Title>', req, res, next); });
```

The second argument is the settings key (== endpoint), so the page gets `config` from the new settings node.

### c) `settings.js`: enable the service

In `exports.server.servicesEnabled`, add `<endpoint> : true,  // <Title>`. Quote the key if it contains a hyphen (`'my-app'`). If a group with a comment like `// Applications in Development` does not exist, add one after the "End User Applications" group and put the entry there; otherwise add it to that group alphabetically.

Do not touch `exports.menu`, documentation, or anything else.

## 5. Verify

- Run `node --check settings.js`, `node --check settings/custom.js` and `node --check routes/landing.js`.
- Re-read the edited regions to confirm commas/braces are right and the endpoint appears in all of: settings application node (with `labels`, `panels`, `viewerFeatures`), the empty node in `settings/custom.js`, `servicesEnabled`, landing route, and the three files.
- Update `.claude/state/current-app.json`: `stage` = `created`, refresh `updated`.

## 6. Report and next steps

Summarise what was created and changed (file list, one line each). Then ask, in this order:

1. **Start the server to test?** If yes, invoke the `server-start` skill. It asks which environment file to use (`environment.js` or any file in `/environments`, defaulting to the last one used), restarts a running server if needed (required to pick up `settings.js` and route changes) and starts the server in the background. Then point the user to `http://localhost:<port>/<endpoint>`. Expected result: an empty screen with the standard header and the given title. The user must be logged in via APS.
2. **Launch `appdev-2-coding`** to start developing the solution? If yes, invoke that skill; it finds the application in `.claude/state/current-app.json`.
