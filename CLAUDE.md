# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A self-hosted Node.js/Express server that delivers ~30 web applications (and Vault/Inventor add-ins) layered on top of Autodesk Fusion Manage (PLM) via the PLM and APS REST APIs. The server is stateless with respect to PLM data — it proxies REST calls, but does not persist tenant data. There is no build step, no test suite, and no linter configured.

## Commands

- `npm install` — install dependencies.
- `npm start` — launch using `./environment.js` (the default connection settings).
- `npm start <name>` — launch using `./environments/<name>.js` instead. Used to run the same server against multiple Fusion Manage tenants. Example: `npm start adsktenant` loads `environments/adsktenant.js`. If the file is missing the server prints a setup hint and exits.
- HTTPS is auto-selected when `redirectUri` uses `https://` and `keys/privkey.pem` + `keys/fullchain.pem` exist; otherwise HTTP is used. The listen port is parsed out of `redirectUri` (or taken from `PORT` env var).

Any setting in `environment.js` can be overridden by environment variables of the same name in uppercase snake_case (`TENANT`, `CLIENT_ID`, `REDIRECT_URI`, `SETTINGS`, `DEFAULT_THEME`, `ENABLE_CACHE`, `DEBUG_MODE`, `FUSION_CONNECTED`, `ADMIN_CLIENT_ID`, `ADMIN_CLIENT_SECRET`, `VAULT_GATEWAY`, `VAULT_NAME`, `PORT`, `PROTOCOL`). This is the intended deployment path for cloud hosting.

## Big-picture architecture

### Three-layer settings system (read this before changing config)

Configuration is split across three files and merged at startup in `app.js`:

1. **`environment.js`** (gitignored, per-deployment) — connection-level settings: `tenant`, `clientId`, `redirectUri`, `defaultTheme`, `vaultGateway`, plus a pointer `exports.settings` to the custom settings file to load.
2. **`settings.js`** (tracked, ~2000 lines, **do not edit**) — full default config for every application: `exports.common` (workspace IDs, viewer defaults), `exports.applications` (per-app settings), `exports.menu` (Start Menu layout), `exports.server` (`servicesEnabled` map), `exports.chrome`, `exports.colors`.
3. **`settings/<name>.js`** (gitignored except `custom.js` template) — per-tenant overrides. Same shape as `settings.js`, but only contains the keys you change.

At startup `app.js:mergeSettings()` deep-merges the custom file onto `settings.js` and exposes the result on `app.locals`. The merge has array handling quirks: same-length arrays of objects are merged element-wise, different-length or string arrays are replaced wholesale. `removeDisabledServicesFromMenu()` then strips any menu commands whose endpoint isn't enabled in `server.servicesEnabled`. To toggle an app on/off across the whole server, flip its key in `server.servicesEnabled`.

For multiple tenants, create paired files: `environments/<tenant>.js` + `settings/<tenant>.js`, with the environment file's `exports.settings` pointing at the settings file. Launch with `npm start <tenant>`.

The `common.workspaceIds` block in `settings/custom.js` is the most commonly tenant-specific section — these are PLM workspace IDs and will differ per tenant.

### Request flow

`bin/www` boots the Express app from `app.js`. Routes are mounted at:

- `/` → `routes/landing.js` — renders Pug pages and handles APS OAuth (PKCE) at `/callback`.
- `/plm` → `routes/plm.js` (~8000 lines) — the main PLM REST proxy: items, BOM, attachments, workflow, search, GraphQL passthrough, Excel import/export. Almost every client-side API call lands here.
- `/aps` → `routes/aps.js` — Autodesk Platform Services proxy (Model Derivative, OSS, etc., used by the viewer).
- `/vault` → `routes/pdm.js` — Vault REST passthrough for the Vault/Inventor add-ins.
- `/services` → `routes/services.js` — misc service endpoints.
- `/storage` → static + directory listing of `./storage/` (download cache, exports, uploads).

`routes/landing.js` is the routing table for all user-facing apps. Each app is one line that calls `launch(view, appSettingsKey, title, req, res, next)`. `launch()`:

1. Checks `server.servicesEnabled[endpoint]` (404 if disabled).
2. Checks session for a valid APS token; if missing or expired, redirects to APS `/authorize` with a PKCE challenge. `/callback` exchanges the code, stores headers in `req.session.headers`, and redirects back.
3. Optionally resolves `hubId` (Fusion-connected tenants) and `vaultId`.
4. Renders the Pug view with: `theme`, URL query params (`wsId`, `dmsId`, `number`, `descriptor`, `host`, `revisionBias`, ...), and `config = app.locals.applications[appSettingsKey]`.

Adding a new standard app means: one line in `routes/landing.js`, one Pug view extending `views/framework/layout.pug`, one JS file in `public/javascripts/apps/`, an entry under `exports.applications` in `settings.js`, and a `servicesEnabled` flag.

### Server-to-client config bridge

`views/framework/layout.pug` is the base layout extended by nearly every view. It injects server state into the page as **global JavaScript variables** (not module imports) via an inline `script` block: `tenant`, `tenantLink`, `theme`, `host`, `wsId`, `dmsId`, `descriptor`, `number`, `fileId`, `vaultId`, `language`, `revisionBias`, `options`, `type`, `common`, `config`, `menu`, `colors`, `debugMode`. Client code reads these as bare globals. The layout also loads a large set of shared client modules in a fixed order before the per-app script runs.

### Client-side framework

`public/javascripts/framework/` holds the shared client kit consumed by every app:

- `utils.js` (~8000 lines) — DOM helpers, dialogs, session/admin checks, jQuery-based UI primitives. Globals defined here are used everywhere.
- `registry.js` (~2000 lines) — UI component registry (panels, tables, forms).
- `landing.js`, `start.js`, `gallery.js`, `docs.js`, `addins.js` — backing scripts for the framework views.

`public/javascripts/contents/` holds shared "content panel" modules (`item.js`, `nav.js`, `bom.js` via `browser.js`, `viewer.js`, `vault.js`, `classification.js`, `analytics.js`, `aps.js`) that individual apps mount and configure.

`public/javascripts/{apps,admin,addins,dev}/<name>.js` is the per-app script — typically composes the shared framework + contents modules and applies the `config` injected by the server.

`public/javascripts/custom.js` and `public/stylesheets/custom.css` (plus everything under `public/javascripts/custom/` and `views/custom/`) are user override hooks loaded last; `views/custom/` is gitignored.

### Authentication model

Two auth modes coexist:

- **3-legged PKCE** (default, used by all standard apps) — interactive APS login per user, stored in `req.session.headers`. Triggered automatically by `launch()` when the session has no token. The APS app must be type "Desktop, Mobile, Single-Page App" with callback ending in `/callback`.
- **2-legged client-credentials with impersonation** (`adminClientId` + `adminClientSecret`) — required only for the **Outstanding Work Report** and **User Settings Manager** admin utilities, which need to act as other users. Leave blank unless those utilities are used.

### Caching

`environment.enableCache` (default true) enables server-side caching of slow-changing data (workspace metadata, picklists). In `routes/plm.js` this is handled via in-memory `sharedCaches` and on-disk `storage/cache/` files. The `storage/` directory tree is created on first launch.

### Chrome extension

The `chrome/` folder is an optional, separately-installed extension that injects buttons into the standard Fusion Manage UI to deep-link into these apps. It reads `settings.chrome` (populated from `settings.common.workspaceIds` at startup) over HTTP from this server. Modifying `exports.chrome` in settings changes what the extension shows.

### `routes/plm.js` patterns

The file is ~8000 lines / ~135 endpoints but every route follows the same shape, so adding one is almost mechanical:

```js
router.get('/<endpoint>', function(req, res, next) {
    console.log(' /<endpoint>');                  // standard banner + req.query dump
    if(notCached(req, res)) {                     // returns true only if no cache hit
        let url = getTenantLink(req) + '/api/v3/...';
        axios.get(url, { headers : req.session.headers })
            .then(r => sendResponse(req, res, r, false))
            .catch(e => sendResponse(req, res, e.response, true));
    }
});
```

Helpers (all at the top of the file):

- **`getCustomHeaders(req)`** — only needed when overriding `Accept` (e.g. the bulk sections variant `application/vnd.autodesk.plm.sections.bulk+json` or the GraphQL `multipart/mixed;deferSpec=...`). Otherwise pass `req.session.headers` directly.
- **`getTenantLink(req)`** — returns `https://<tenant>.autodeskplm360.net`, but allows the tenant to be overridden per request via `req.body.tenant` / `req.query.tenant`. The **Tenant Comparison** admin utility relies on this, so don't hard-code `app.locals.tenant` in new endpoints.
- **`runPromised(url, headers)`** — convenience wrapper around `axios.get` used when fanning out parallel reads.
- **`sendResponse(req, res, response, error, fromCache)`** — the universal terminal. Wraps the upstream response in `{ params, url, data, status, message, error, fromCache, timestamp }`, persists the session, and writes to the per-session cache on success. Always use it instead of `res.json` so caching and error formatting stay consistent.

**Caching model.** Two parallel caches exist:

- `req.session.cache` — per-user, lives in the express session.
- `sharedCaches[<slug>]` — process-global, keyed by a slug derived from `req.query.sharedCache` (typically a PLM group name like `"Administration [SYSTEM]"`). Used for data that's identical across users with the same role.

Cache keys are computed in `getCacheEntry()` from `url path + sorted query params`, excluding `timestamp`, `useCache`, `updateCache`, `sharedCache`, `requestor`. The client opts in to caching by sending `useCache=true`; sending `updateCache=true` forces a refresh; `POST /plm/clear-cache` wipes the session cache. `app.locals.enableCache=false` disables everything globally.

**File handling.** `storage/cache/`, `storage/excel-export/`, `storage/downloads/`, etc. are populated on demand via `createServerFolderPath()`, `downloadFileToCache()`, `downloadFileToServer()`. Excel work uses ExcelJS: `POST /plm/excel-export` accepts `{ fileName, sheets: [{ type: 'bom'|'grid'|'picklists'|'scripts'|'workspaces', ... }], storeFile }` and routes each sheet to a type-specific fetcher (`getExcelExportBOM`, `getExcelExportGrid`, ...) before assembling the workbook in `getExcelExportData()`.

**Payload builders for create/edit/clone**: `genPayloadSectionsFields`, `genPayloadFieldType`, `addPayloadSectionField`, `parseSectionPayload` translate between the flat field map the client sends and the nested `sections → fields` shape PLM expects. `setBodyFields`, `setBodySort`, `setBodyFilter`, `getFilterComparator` do the same for search payloads.

### Client-side framework: where to start

`layout.pug` loads scripts in a fixed order **before** the per-app script runs: Autodesk Viewer → jQuery → `framework/utils.js` → `contents/{viewer,admin,item,nav,classification,vault,browser,analytics,aps}.js` → `custom.js` → app script. Every name defined in those files is a global available to the app.

**Lifecycle.** `utils.js` registers its own `$(document).ready` that sets the theme class, calls `beforeApplicationStart()` (overridable per-app hook), then `insertAvatar()`, `enableTabs()`, `enablePanelToggles()`, `setFormEvents()`. The per-app script's own `$(document).ready` runs after that and typically:

1. Calls `insertMenu()` to draw the Start Menu shell.
2. Resolves `wsConfig` from `config.workspaceId || common.workspaceIds.<x>`.
3. Issues a `getFeatureSettings(appKey, requests, callback)` that fans out `$.get` calls for `/plm/workspace`, `/plm/sections`, `/plm/fields`, `/plm/bom-views`, etc., then invokes the callback once everything is in.
4. Inside the callback, mounts panels by calling `insertXxx(params)` where `params = config.panels.insertXxx`.

**Panel API (the `insertXxx` family).** These are the *public* entry points. `framework/registry.js` is the source of truth — it lists every panel, its `function` name, default options, and option keys. The same registry powers the `/gallery` developer page. Categories:

- *Navigation* — `insertMOW`, `insertRecentItems`, `insertBookmarks`, `insertWorkspaceViews`, `insertWorkspaceItems`, `insertSearch`, `insertResults` (in `contents/nav.js`).
- *Item* — `insertCreate`, `insertDetails`, `insertAttachments`, `insertGrid`, `insertPhaseGates`, `insertItemStatus`, `insertWorkflowActions` (in `contents/item.js`).
- *BOM* — `insertBOM`, `insertFlatBOM`, `insertRootParents`, `insertParents` (in `contents/item.js` + helpers).
- *Relationships* — `insertManagedItems`, `insertChangeProcesses`, `insertProject`, `insertRelationships`, `insertSourcing`.
- *History* — `insertWorkflowHistory`, `insertRevisions`, `insertChangeLog`.
- *Classification* — `insertClasses`, `insertClassContents`, `insertClassFilters` (in `contents/classification.js`).
- *Viewer & browser* — `insertFileBrowser` (`contents/viewer.js`), `insertBrowser` / `insertBrowserTabContent` (`contents/browser.js`).

Each `insertXxx` has matching `insertXxxDone(id)` and `insertXxxDataDone(id, data)` no-op stubs that the app overrides to hook into lifecycle events (data loaded, panel rendered, item clicked).

**Panel-builder primitives** live in `utils.js` as `genPanelTop`, `genPanelToolbar`, `genPanelHeader`, `genPanelSearchInput`, `genPanelFilterSelect`, `genPanelResizeButton`, etc. — use these instead of writing raw HTML when extending an `insertXxx` or building a custom panel. `getPanelSettings(link, params, defaults, additional)` is the canonical way to merge user-supplied params with registry defaults and produce the runtime `settings[id]` entry.

**Common globals to know**: `userAccount`, `urlParameters`, `viewerFeatures`, `applicationFeatures`, `responseCache`, `allWorkspaces`, `settings` (keyed by panel id, holds runtime state), and the server-injected `tenant`/`config`/`common`/`menu`/`colors`/`theme`/`wsId`/`dmsId`/... from `layout.pug`.

### Shape of `app.locals.applications[<key>]` (the `config` global)

Per-app settings live under `exports.applications.<key>` in `settings.js`. The same key is passed to `launch()` in `routes/landing.js`, and the resolved object is injected as the `config` global. The standard shape:

```js
exports.applications.<key> = {
    workspaceId    : null,        // null → fall back to common.workspaceIds.items
    viewingFormats : null,        // null → fall back to common.viewer.extensionsIncluded
    panels : {
        insertSearch      : { /* options matching framework/registry.js */ },
        insertRecentItems : { ... },
        insertBOM         : { bomViewName: null, useCache: true, depth: 10, ... },
        insertDetails     : { sectionsExcluded: [...], expandSections: [...], ... },
        insertAttachments : { ... }
    },
    viewerFeatures : { measure: true, section: true, ... },  // toggles for the Autodesk Viewer chrome
    // ...plus per-app domain settings, e.g. for `abom`:
    bomLabel       : 'Asset BOM',
    assetFieldIDs  : { ebom: 'ENGINEERING_BOM', abom: 'ASSET_BOM', ... },
    items          : { bomViewName: 'Asset BOM Editor', fields: { ... } }
};
```

Conventions baked into this shape:

- **PLM field references use field IDs (`'ITEM_NUMBER'`, `'NUMBER'`, `'SPARE_WEAR_PART'`), not display names.** These IDs are tenant-defined; mismatched IDs are the #1 cause of "field is undefined" bugs.
- **BOM views are referenced by name** (`'Tree Navigator'`, `'Default View'`, `'Asset BOM Editor'`) and must exist in the target PLM tenant. The convention from the README is to keep one tenant-wide view named `'Tree Navigator'` with columns Descriptor / Number / Quantity for navigation panels.
- **`null` means "resolve at runtime"** — typically to a default in `common.workspaceIds.*` or `common.workspaces.items.*`. Don't `??` the value away in setup code; the per-app script does the fallback explicitly (`config.workspaceId || common.workspaceIds.items`).
- **Panel keys are the function name** (`insertSearch`, `insertBOM`, ...). When adding a new panel to an app, add a matching `config.panels.insertXxx` block in `settings.js` and pass it as `params` to the corresponding `insertXxx(params)` call.
- **The custom settings file only carries deltas.** `mergeSettings()` deep-merges, so omitted keys keep their `settings.js` values. Empty per-app blocks (`abom: {}`, `compare: {}`) in `settings/custom.js` are intentional anchor points — keep them.
- Only the app being launched gets its config injected (`launch()` reads the second arg of the route registration as the key). Other apps' configs aren't exposed to the page.

### `dev/` folder (work-in-progress apps)

The "APPLICATIONS IN DEVELOPMENT" block at the bottom of `routes/landing.js` exposes endpoints (`/assets`, `/browser`, `/change`, `/configurator`, `/control`, `/customer`, `/editor`, `/matrix`, `/mbom-upgrade`, `/pbom`, `/pdm`, `/pdm-explorer`, `/pnd`, `/resources`, `/studio`, `/transmittals`, `/worklist`) backed by `views/dev/*.pug` and `public/javascripts/dev/*.js`. These are **not advertised in the README app list, not in the production Start Menu, and have no stability guarantees.** A few (`editor`, `matrix`, `resources`, `worklist`) have settings entries; most pass `''` for the settings key meaning they receive an empty `config`.

`views/custom/` (gitignored) and the `/playground` route (`views/custom/playground.pug`) are sandboxes for ad-hoc local experimentation that ships separately from the main release.

When fixing bugs or extending production features, work in `apps/` / `admin/` / `addins/` — only touch `dev/` when the task explicitly names one of those routes.

## Conventions worth knowing

- **Pug views always extend `views/framework/layout.pug`** unless they explicitly opt out (error pages do). Adding stylesheets/scripts goes in the `block head`; markup in `block body`.
- **No bundler.** All client JS is loaded as plain `<script>` tags in the order declared by `layout.pug` + the per-app view. Globals are how code talks across files. Don't introduce ES modules without rewiring the loader chain.
- **REST proxying pattern**: every `routes/plm.js` handler builds an axios request to `https://<tenant>.autodeskplm360.net/api/...` using `req.session.headers`. Client code calls `/plm/<endpoint>` rather than the PLM tenant directly — never expose tokens to the browser.
- **Workspace references in code use IDs, not names.** The IDs live in `common.workspaceIds` and must match the target tenant. App settings reference them by key (e.g. `config.items.workspaceId = common.workspaceIds.items`).
- **`debugMode: true`** in `environment.js` enables verbose view-config logging from helpers like `insertBOM`/`insertDetails` — useful when wiring up a new app's panels.
- **Commit message style** (from `git log`): `[<TYPE> : <Area>] <subject>`, where TYPE is one of `UPD`, `BUG`, `CSS`, `NEW`, etc., and Area is the affected subsystem (Framework, Addins, Chrome Extension, ...). Match this when committing.
