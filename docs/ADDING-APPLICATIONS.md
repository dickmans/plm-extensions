# Adding a new application

Reference architecture for scaffolding a new end-user application on this server.
A new app is **one route line + one Pug view + one app JS + one app CSS + (empty) custom JS/CSS hooks + one settings entry + one `servicesEnabled` flag**, optionally a Start-Menu entry. There is no build step — files are served as-is.

---

## 1. The seven pieces

| # | File / location | Purpose | Naming |
|---|---|---|---|
| 1 | `routes/landing.js` (one `router.get` line) | Registers the URL and renders the view via `launch()` | endpoint = the URL segment, e.g. `/myapp` |
| 2 | `views/apps/<endpoint>.pug` | Page markup; extends `framework/layout` | `<endpoint>.pug` |
| 3 | `public/javascripts/apps/<endpoint>.js` | App logic: mounts panels, wires UI | `<endpoint>.js` |
| 4 | `public/stylesheets/apps/<endpoint>.css` | App-specific styling | `<endpoint>.css` |
| 5 | `public/javascripts/custom/<endpoint>.js` | **Empty** override hook (loaded last, gitignored area) | `<endpoint>.js` (0 bytes) |
| 6 | `public/stylesheets/custom/<endpoint>.css` | **Empty** override hook | `<endpoint>.css` (0 bytes) |
| 7 | `settings.js` → `exports.applications.<key>` + `exports.server.servicesEnabled.<endpoint>` (+ optional `exports.menu`) | Default config + enable flag (+ menu tile) | settings key usually == endpoint |

> **Do not edit `settings.js` for tenant-specific values** beyond adding the default app block + flag. Per-tenant overrides live in `settings/<tenant>.js`. `settings.js` is the tracked default and is deep-merged at startup.

---

## 2. Route registration (`routes/landing.js`)

Add one line under the **STANDARD APPLICATIONS** block:

```js
router.get('/myapp', function(req, res, next) { launch('apps/myapp', 'myapp', 'My App Title', req, res, next); });
```

`launch(appURL, appSettings, appTitle, req, res)`:
- **`appURL`** — Pug path relative to `views/` (e.g. `'apps/myapp'`). Its **last segment** (`myapp`) is the key checked against `server.servicesEnabled` — so the endpoint, the view filename, and the `servicesEnabled` key must agree.
- **`appSettings`** — key into `app.locals.applications`. Injected into the page as the `config` global. Pass `''` to inject `config = {}` (apps with no settings block).
- **`appTitle`** — page title (`title` global, shown in `#header-title`).

`launch()` also: enforces the `servicesEnabled` 404 gate, runs the APS PKCE login redirect if the session has no valid token, optionally resolves `hubId`/`vaultId`, and (if `?number=` is given without `?dmsId=`) renders the find-item-by-number bridge before the app.

---

## 3. Server → client globals (provided by `views/framework/layout.pug`)

`layout.pug` injects these as **bare JS globals** before any app script runs — the app JS just reads them, no imports:

`documentTitle`, `tenant`, `tenantLink`, `theme`, `host`, `wsId`, `dmsId`, `descriptor`, `number`, `fileId`, `vaultId`, `language`, `revisionBias`, `options` (array), `type`, `common`, **`config`**, `menu`, `colors`, `debugMode`.

Plus, from `framework/utils.js` at `$(document).ready`: **`urlParameters`** (parsed query string, incl. `urlParameters.link`), `userAccount`, `settings` (runtime per-panel state, keyed by panel id), `allWorkspaces`, etc.

> The app view does **not** need to re-inject `config` — `layout.pug` already does. (The tutorial template re-injects it redundantly; real apps like `portal` don't.)

`layout.pug` also loads, in fixed order, before the app script: Autodesk Viewer → jQuery → `framework/utils.js` → `framework/registry.js` → `contents/{viewer,admin,item,nav,classification,vault,browser,analytics,aps}.js` → `custom.js` → then the app's own scripts (from the view's `block head`).

---

## 4. View template (`views/apps/<endpoint>.pug`)

```pug
extends ../framework/layout

block head

    link(rel='stylesheet', href='/stylesheets/apps/myapp.css')
    link(rel='stylesheet', href='/stylesheets/custom/myapp.css')

    script(src='/javascripts/apps/myapp.js')
    script(src='/javascripts/custom/myapp.js')

block body

    body.surface-level-1

        #header.dark
            #header-logo
            #header-title= title
            #header-subtitle
            #header-toolbar
                //- optional panel toggles, e.g.:
                .button.with-toggle.toggle-on.filled#toggle-details(title='Toggle Details panel') Details
                #header-avatar

        #main.screen

            //- One container div per panel you will mount. The id is the panel id.
            .surface-level-2#search
            .surface-level-2#details
            .surface-level-1.hidden#bom
            .surface-level-1.hidden#viewer.viewer
```

Conventions:
- Always `extends ../framework/layout`; put stylesheets/scripts in `block head`, markup in `block body`.
- `#header` + `#main.screen` is the standard shell. Each panel mounts into a `div` whose **`id` is the panel id** (default ids come from `registry.js`, e.g. `search`, `details`, `bom`, `results`, `recents`). Override with `params.id` if you need several of the same panel.
- `surface-level-1..4` set background depth; `.hidden` starts a panel hidden (toggled via JS); `.viewer` marks the APS viewer container.
- Header toolbar toggles follow the `.button.with-toggle.toggle-on|toggle-off[.filled]#toggle-<x>` pattern, flipped in `setUIEvents()` (usually toggling a `body` class like `no-bom`).

---

## 5. App JS template (`public/javascripts/apps/<endpoint>.js`)

The per-app script composes the shared **panel functions** (the `insertXxx` family) with the injected `config`. Pattern:

```js
let wsConfig = { workspaceId : '' };

$(document).ready(function() {

    setUIEvents();          // wire header toggles / buttons
    insertMenu();           // draw the Start Menu shell (from the `menu` global)

    // 1. Resolve the workspace: config value, else a common.workspaceIds fallback
    wsConfig.workspaceId = config.workspaceId || common.workspaceIds.items;

    // 2. Fan out the workspace metadata reads this app needs
    let requests = [
        $.get('/plm/sections' , { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/fields'   , { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/bom-views', { wsId : wsConfig.workspaceId, useCache : true }),
    ];

    // 3. getFeatureSettings runs the requests, then your callback mounts the panels
    getFeatureSettings('myapp', requests, function(responses) {

        wsConfig.sections = responses[0].data;
        wsConfig.fields   = responses[1].data;

        // 4. Mount each panel, passing its config block from settings + runtime params
        let paramsSearch = config.panels.insertSearch;
            paramsSearch.workspacesIn = [wsConfig.workspaceId];
            paramsSearch.onClickItem  = function(elem) { openItem(elem); };
        insertSearch(paramsSearch);

        // Context entry: if the app was opened on a specific item (?link=...)
        if(!isBlank(urlParameters.link)) {
            $.get('/plm/descriptor', { link : urlParameters.link }, function(r) { openItem(r.data); });
        }
    });
});

function setUIEvents() { /* $('#toggle-details').click(...) etc. */ }
function openItem(elemOrData) {
    let link = /* resolve API link */;
    insertDetails(link, config.panels.insertDetails);
    insertAttachments(link, config.panels.insertAttachments);
}
```

Key helpers (all global, from `framework/`):
- `insertMenu()` — renders the Start Menu shell from the `menu` global.
- `getFeatureSettings(appKey, requests, callback)` — runs parallel `$.get`s (`/plm/sections`, `/plm/fields`, `/plm/bom-views`, `/plm/workspace`, …) and invokes `callback(responses)` once all resolve.
- `getPanelSettings()` / `getPanelSettings()` — internal panel-settings merge (used inside the `insertXxx` functions; you normally don't call these directly).
- `isBlank()`, `openItemByLink()`, `getBOMViewDefinition()`, viewer helpers, etc.

---

## 6. Reusing the panel functions (`javascripts/contents` + `javascripts/framework`)

The reusable building blocks are the **`insertXxx` panel functions**. They are the single most important thing to reuse — **do not hand-roll panels**. The authoritative catalogue is **`public/javascripts/framework/registry.js`** (and the live `/studio` page, which previews every panel and emits its config JSON).

Where they live (loaded by `layout.pug`, so all are global):
- **`contents/nav.js`** — navigation/search: `insertMOW`, `insertRecentItems`, `insertBookmarks`, `insertWorkspaceViews`, `insertWorkspaceItems`, `insertSearch`, `insertWorkspaceSearch`, `insertResults`.
- **`contents/item.js`** — item data: `insertCreate`, `insertDetails`, `insertAttachments`, `insertGrid`, `insertBOM`, `insertFlatBOM`, `insertBOMPartsList`, `insertRootParents`, `insertParents`, `insertManagedItems`, `insertChangeProcesses`, `insertProject`, `insertRelationships`, `insertSourcing`, `insertWorkflowHistory`, `insertRevisions`, `insertChangeLog`, `insertItemStatus`, `insertWorkflowActions`, `insertImages`, `insertItemSummary`.
- **`contents/classification.js`** — `insertClasses`, `insertClassContents`, `insertClassFilters`, `insertItemClassification`, `insertSimilarItems`.
- **`contents/vault.js`**, **`contents/aps.js`** — Vault / APS panels.
- **`contents/browser.js`**, **`contents/viewer.js`**, **`contents/analytics.js`** — composite browser, file viewer, charts.

Each `insertXxx` is registry-driven: its defaults + accepted options come from `registry.js` (entry `defaults` overlaid on the shared option dictionaries). To choose panels/options for a new app, read each function's `description`/`usage` in `registry.js` or open `/studio`. Pass options through `config.panels.insertXxx` in `settings.js`.

Each panel also exposes no-op lifecycle hooks you can override per app: `insertXxxDone(id)` and `insertXxxDataDone(id, data)`.

---

## 7. Settings wiring (`settings.js`)

**a) App config** — under `exports.applications`:

```js
exports.applications.myapp = {
    workspaceId    : null,        // null → resolve at runtime to common.workspaceIds.items
    viewingFormats : null,        // null → common.viewer.extensionsIncluded
    panels : {
        insertSearch      : { /* options per registry.js / studio */ },
        insertDetails     : { sectionsExcluded : [...], expandSections : ['Basic'], useCache : true },
        insertBOM         : { bomViewName : null, depth : 10, useCache : true },
        insertAttachments : { /* ... */ }
    }
    // + any app-specific domain settings
};
```
Conventions: PLM **field references use field IDs** (`'NUMBER'`, `'ITEM_NUMBER'`), not display names. **BOM views are referenced by name**. `null` means "resolve at runtime" — the app script does the fallback (`config.workspaceId || common.workspaceIds.items`). The panel key **is** the function name.

**b) Enable flag** — under `exports.server.servicesEnabled` (key == endpoint == last URL segment). Missing/`false` → 404:
```js
myapp : true,   // My App Title
```

**c) Start-Menu tile (optional)** — under `exports.menu`, inside a section's `commands`:
```js
{ icon : 'icon-3d', title : 'My App', subtitle : 'What it does', url : '/myapp', adminsOnly : false }
```

> `app.js:mergeSettings()` deep-merges `settings/<tenant>.js` over `settings.js` at startup; `removeDisabledServicesFromMenu()` strips menu commands whose endpoint isn't enabled.

---

## 8. Checklist for a new app

1. `routes/landing.js`: add the `router.get('/<endpoint>', ... launch('apps/<endpoint>', '<settingsKey>', '<Title>', ...))` line.
2. `views/apps/<endpoint>.pug`: from the §4 template — header + `#main.screen` + one `div#<panelId>` per panel.
3. `public/javascripts/apps/<endpoint>.js`: from the §5 template — `$(document).ready` → `setUIEvents()`, `insertMenu()`, resolve workspace, `getFeatureSettings()`, mount `insertXxx` panels.
4. `public/stylesheets/apps/<endpoint>.css`: app styling (can start minimal).
5. `public/javascripts/custom/<endpoint>.js` and `public/stylesheets/custom/<endpoint>.css`: create as **empty** files.
6. `settings.js`: add `exports.applications.<settingsKey>` (with `panels`), set `server.servicesEnabled.<endpoint> = true`, optionally add an `exports.menu` tile.
7. Verify: `npm start`, open `/<endpoint>` (must be enabled; needs APS login). Use `debugMode:true` to log resolved panel settings.

---

## 9. Inputs needed to build an app

When asked to build a new app, gather: **title**, **endpoint** (URL segment), **layout description** (which regions/panels and how arranged + any header toggles), **use-case description** (who uses it and why), and **functional definition** (which `insertXxx` functions to mount and their key options / workspace). Map the functional definition to panel functions from `registry.js`/`/studio`, then produce the seven pieces above.
