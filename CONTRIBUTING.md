# Contributing

This package is provided as-is and is explicitly meant to be adjusted, extended and reused. This document describes how the code is written, so that changes blend in, and how to verify a change, given that the applications run against a live Fusion Manage tenant.

New to the codebase? Read [claude/ARCHITECTURE.md](claude/ARCHITECTURE.md) first.

| I want to… | Read |
|---|---|
| Understand how the server fits together | [claude/ARCHITECTURE.md](claude/ARCHITECTURE.md) |
| Add a new application | [claude/ADDING-APPLICATIONS.md](claude/ADDING-APPLICATIONS.md) |
| Change settings, or add a tenant | [claude/CONFIGURATION.md](claude/CONFIGURATION.md) |
| Use or extend the UI building blocks | [claude/PANELS.md](claude/PANELS.md) |

---

## 1. Running the server

```
npm install
npm start                 # uses ./environment.js
npm start adsktenant      # uses ./environments/adsktenant.js
```

The port comes from `PORT`, or is parsed out of `redirectUri`. The startup banner prints the resolved tenant, client ID and callback URL — check it first when something will not connect.

There is **no build step**. Edit a file, restart if you touched anything the server `require`s (`app.js`, `routes/`, `settings.js`, `environment.js`), and hard-refresh the browser for anything under `public/` or `views/`.

---

## 2. House style

The codebase is uniform, and deviations are conspicuous. Match what is around you.

### JavaScript

Browser code and route code are written in the same style:

- **Top-level `function` declarations.** No classes, no ES modules, no `import`. Browser scripts are plain globals loaded by the layout; route files are CommonJS.
- **jQuery throughout** — `$.get` / `$.post` with callbacks, `Promise.all` for fan-out. Routes use `axios(...).then().catch()`; a few newer `/plm` handlers use `async`.
- **Aligned assignments.** Colons and `=` are column-aligned within a block. Object literals are written `key : value`, with a space before the colon.

```js
let paramsBOM = {
    headerLabel : 'Bill of Materials',
    bomViewName : 'Details',
    contentSize : 'xs',
    depth       : 10,
    useCache    : true
};
```

- **Naming.** `elemXxx` / `elemClicked` for DOM handles, `params` for options passed in, `panelSettings` for resolved options, `link` for a record's API URL, `wsConfig` for the workspace metadata an application collects at startup.
- **Guard with `isBlank(value)`** — true for `undefined`, `null` and `''`. Defined separately in `framework/utils.js` and `routes/plm.js`.
- **Section banners.** `/* ---- SECTION ---- */` in routes, `// ---- SECTION ----` blocks in settings.

Application scripts all follow one shape: globals, then `$(document).ready` → `setUIEvents()` → `insertMenu()` → resolve the workspace → `getFeatureSettings()` → mount panels in the callback, with named handler functions below.

### Pug views

Extend the shared layout; stylesheets and scripts in `block head`, markup in `block body`:

```pug
extends ../framework/layout

block head
    link(rel='stylesheet', href='/stylesheets/apps/myapp.css')
    script(src='/javascripts/apps/myapp.js')

block body
    body.surface-level-1
        #header.dark
            #header-logo
            #header-title= title
            #header-subtitle
            #header-toolbar
                #header-avatar
        #main.screen
            .surface-level-2#details
```

`layout.pug` already injects `config`; there is no need to re-inject it (some of the prototypes in `views/dev/` do, redundantly).

### CSS

- **`surface-level-1` … `surface-level-5`** set background depth and cascade into child tables, trees and tiles. Pick the level by nesting depth rather than by colour.
- **Layout helpers:** `pos-abs-max`, `pos-abs-top`, `pos-abs-right`, `pos-abs-bottom`, `pos-abs-left`; `.screen` for a full-viewport region; `.hidden` to start hidden.
- **Buttons:** `.button`, plus `.icon.icon-<name>` for icon-only or `.with-icon.icon-<name>` for icon+label; `.default` for the primary action, `.red` for destructive ones. The icon catalogue is at `/docs`.
- **Header toggles** follow one pattern — `.button.with-toggle.toggle-on|toggle-off[.filled]#toggle-<x>` — whose handler flips those classes and toggles a `body` class (`no-bom`, `no-details`, `not-attachments`, …) that the stylesheet keys off:

```js
$('#toggle-details').click(function() {
    $('body').toggleClass('no-details');
    $(this).toggleClass('toggle-off').toggleClass('toggle-on').toggleClass('filled');
    viewerResize();
});
```

### Extension points

Prefer these over editing shared files:

- `public/javascripts/custom/<endpoint>.js` and `public/stylesheets/custom/<endpoint>.css` — per-application overrides, loaded after the application's own files.
- `public/javascripts/custom.js` — loaded for every page. Override `beforeApplicationStart()` here to adjust `config` before an application boots.
- Panel lifecycle hooks — redefine `insertXxxDone(id)` / `insertXxxDataDone(id, data)` in your application script; see [claude/PANELS.md](claude/PANELS.md).

---

## 3. Verifying a change

**There is no automated test suite.** The applications are thin clients over a live tenant: almost every code path needs a reachable Fusion Manage instance, an APS application whitelisted in it, and an interactive login that populates the session. Verification is therefore manual, and the tools below are what exist in place of a test run.

| Tool | Use it for |
|---|---|
| `debugMode : true` in your environment file | Logs every panel's fully resolved settings to the browser console. First stop for "my option had no effect". |
| `/studio` | Reproduce a panel bug in isolation, away from the surrounding application. |
| `/gallery`, `/docs` | Compare against the reference rendering of the same panel. |
| The server terminal | Every `/plm` handler logs its inbound parameters; `sendResponse()` logs `ERROR REQUESTING : <url>` plus the tenant's message on failure. |
| `/troubleshooting` | Connection and setup diagnostics. |

Before opening a pull request:

1. Start the server and load **every application you touched**, not just the one you were working in — the panels are shared, so a change in `contents/item.js` or `framework/utils.js` reaches most of the package.
2. Check both a light and a dark theme (`?theme=light`, `?theme=dark`) if you touched CSS.
3. Watch the browser console and the server terminal for new errors.
4. If the behaviour looks stale rather than wrong, clear the response cache before concluding anything — see [claude/ARCHITECTURE.md](claude/ARCHITECTURE.md) §6.

**Not everything needs a tenant.** The pure helpers can be exercised directly with `node`: `mergeSettings()` in `app.js`; `getCacheEntry`, `stringToId`, `sortArray`, `getFilterComparator` in `routes/plm.js`; the option-resolution functions in `framework/registry.js`; and helpers such as `isBlank`, `sortArray`, `getBOMViewDefinition`, `sanitizeFilename` and `convertURN2Link` in `framework/utils.js`. If you change one of these, it is worth checking it in isolation.

---

## 4. Things to know before you commit

- **Never commit tenant configuration.** `environments/*` and `settings/*` are gitignored, apart from `environments/template.js` and `settings/custom.js`. Tenant names, client IDs, workspace IDs and field IDs belong in your own override files.
- **Never put tenant-specific values into `settings.js`.** It is the shared default and is expected to be updated from upstream. See [claude/CONFIGURATION.md](claude/CONFIGURATION.md).
- **Keep endpoint, view filename and `servicesEnabled` key identical.** `launch()` derives the enable flag from the last URL segment; a mismatch produces a 404 that looks like a routing bug.
- **Restart after changing anything that is `require`d** — settings and routes are read once at startup.
- **Put new work in the right family.** Released applications in `views/apps/` + `public/javascripts/apps/`; administration utilities in `admin/`; add-ins in `addins/`; prototypes and unreleased work in `dev/`; local experiments in `custom/` (gitignored). The route blocks in `routes/landing.js` are grouped the same way.
- **Commit messages** in this repository follow `[<TYPE> : <Area>] <Summary>`, e.g. `[UPD : Framework] Remove console outputs`, `[DOC : Framework] Readme update`.
