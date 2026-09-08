# Architecture

How this server is put together. Read this before making changes to the framework; for adding an application see [ADDING-APPLICATIONS.md](ADDING-APPLICATIONS.md), for settings see [CONFIGURATION.md](CONFIGURATION.md), for the reusable UI panels see [PANELS.md](PANELS.md).

---

## 1. The shape of the whole thing

A single Node.js/Express server renders Pug pages and proxies every call to Fusion Manage. There is **no build step** — no bundler, no transpiler, no package to compile. Everything under `public/` is served as-is, and every browser script is a plain global loaded by one shared layout.

```
browser  ──►  Express (this server)  ──►  Fusion Manage REST API
                                     ──►  Autodesk Platform Services
                                     ──►  Vault (optional)
```

No PLM data is persisted outside of PLM. `storage/` holds only transient artefacts (cached images, uploads, generated Excel exports) and is gitignored.

---

## 2. Startup

`bin/www` → `app.js`.

1. **Pick the environment file.** `./environment.js` by default; `npm start adsktenant` loads `./environments/adsktenant.js` instead. A missing file prints a setup hint and exits.
2. **Read connection settings** into `app.locals` — each one overridable by an environment variable (`TENANT`, `CLIENT_ID`, …). See [CONFIGURATION.md](CONFIGURATION.md).
3. **Merge settings.** `settings.js` (the tracked defaults) is deep-merged with `settings/<environment.settings>` (your tenant overrides) by `mergeSettings()`.
4. **Prune the Start Menu.** `removeDisabledServicesFromMenu()` drops every menu command whose endpoint is not enabled in `server.servicesEnabled`.
5. **Publish to `app.locals`** — `common`, `applications`, `menu`, `server`, `chrome`, `colors`. These are what the route layer injects into pages.
6. **Mount the routers** and the static/session/body-parser middleware.

Settings are `require`d once. **Restart the server after any settings change.**

---

## 3. Route layers

| Mount | File | Purpose |
|---|---|---|
| `/` | `routes/landing.js` | Page routes and the APS login callback. No data access. |
| `/plm` | `routes/plm.js` | The Fusion Manage REST wrapper — all PLM read/write. |
| `/aps` | `routes/aps.js` | Autodesk Platform Services / Fusion Manage GraphQL. |
| `/vault` | `routes/pdm.js` | Vault REST (beta), used by the add-ins. |
| `/services` | `routes/services.js` | Server-side services: local storage browsing, Chrome-extension config, printing. |
| `/storage` | static + index | Generated files (exports, downloads). |

### 3.1 Page routes

Every application page is a single line:

```js
router.get('/portal', function(req, res, next) {
    launch('apps/portal', 'portal', 'PLM Portal', req, res, next);
});
```

`launch(appURL, appSettings, appTitle, req, res)` does five things:

- **Enforces the enable flag.** `isServiceDisabled()` takes the *last segment* of `appURL` and looks it up in `server.servicesEnabled`. Missing or `false` renders the 404 page. This is why the endpoint, the view filename and the `servicesEnabled` key must all agree.
- **Handles login.** If the session has no unexpired token, it redirects into the APS authorization-code + PKCE flow, passing the original URL as `state`.
- **Resolves the hub** when `fusionConnected` is set, so Fusion components can be read.
- **Bridges `?number=`.** If a part number is given without a `dmsId`, it renders `framework/findItemByNumber` first, which resolves the number and re-enters the app.
- **Renders the view**, injecting the globals listed in §4. `appSettings` selects which block of `app.locals.applications` becomes the page's `config`; passing `''` injects `config = {}`.

Routes are grouped by family — standard applications, administration utilities, add-ins, developer tools, applications in development. Keep new routes in the matching block.

### 3.2 The `/plm` wrapper

`routes/plm.js` is the single point of contact with Fusion Manage; the browser never calls the tenant directly. Roughly 130 endpoints cover items, sections and fields, BOMs, attachments, grids, relationships, workflow, search, classification, reports, users and admin data.

Every handler has the same shape:

```js
router.get('/sections', function(req, res, next) {

    // 1. log the inbound parameters
    console.log('  req.query.wsId = ' + req.query.wsId);

    // 2. serve from cache if the caller opted in (see §6)
    if(notCached(req, res)) {

        // 3. build the request from the session's credentials
        let headers = getCustomHeaders(req);
        let url     = getTenantLink(req) + '/api/v3/workspaces/' + req.query.wsId + '/sections';

        // 4. call the tenant, and always answer through sendResponse
        axios.get(url, { headers : headers })
            .then (function(response) { sendResponse(req, res, response, false); })
            .catch(function(error)    { sendResponse(req, res, error.response, true); });
    }
});
```

**Response envelope.** `sendResponse()` guarantees every `/plm` response looks the same, so clients only ever read `response.data`:

```json
{ "params": {}, "url": "", "data": [], "status": "", "message": "", "error": false, "fromCache": false }
```

On failure it sets `error : true`, extracts the tenant's message into `message`, and logs `ERROR REQUESTING : <url>` to the terminal. **Handlers do not throw** — errors are reported in the envelope, so callers must check `response.error` rather than relying on the HTTP status.

**Item references.** Records are identified throughout by their API `link`:

```
/api/v3/workspaces/<wsId>/items/<dmsId>
```

Most helpers accept a `link` and derive `wsId`/`dmsId` from it by splitting on `/`.

---

## 4. Authentication

Interactive users authenticate with **3-legged APS OAuth (authorization code + PKCE)**:

1. `launch()` generates a `code_verifier`/`code_challenge` into the session and redirects to the APS authorize endpoint with the target URL in `state`.
2. `/callback` exchanges the code for a token and stores `req.session.headers` — `Authorization`, `token`, `X-Tenant`, `expires`, `refreshToken`.
3. Every `/plm` handler copies those into its outbound request via `getCustomHeaders(req)`.

The APS application must be of type *Desktop, Mobile, Single-Page App*, its callback URL must match `redirectUri` **exactly**, and its client ID must be whitelisted in the tenant's General Settings.

Two admin utilities (*Outstanding Work Report*, *User Settings Manager*) additionally need a **2-legged** APS application with a client secret, because they impersonate other users. Configure it as `adminClientId`/`adminClientSecret`, and only when those utilities are actually used.

---

## 5. The client side

### 5.1 Load order

`views/framework/layout.pug` is the single layout every page extends. It loads, in this order:

1. Framework and content stylesheets, then `custom.css`
2. Autodesk Viewer, then jQuery
3. `framework/registry.js`, `framework/utils.js`
4. `contents/viewer.js`, `item.js`, `nav.js`, `classification.js`, `vault.js`, `admin.js`, `analytics.js`, `aps.js`
5. `custom.js`
6. the page's own `block head` — the app's stylesheet and script

Everything is a global; there are no modules and no imports. An app script simply calls the functions it needs.

### 5.2 Globals injected by the server

`layout.pug` writes these into the page before any script runs:

| Global | Meaning |
|---|---|
| `config` | The app's settings block — `applications[<appSettings>]`, or `{}` |
| `common` | `settings.common` — workspace IDs, default BOM view, viewer defaults |
| `menu`, `colors` | Start Menu definition and the colour palette |
| `tenant`, `tenantLink`, `host` | Tenant name and links |
| `wsId`, `dmsId`, `descriptor`, `number`, `fileId`, `vaultId` | Context item, from the query string |
| `theme`, `language`, `type`, `options[]`, `revisionBias` | Request options |
| `debugMode` | Boolean; makes the panel layer log its resolved settings |

`framework/utils.js` adds more at `$(document).ready`: `urlParameters` (parsed query string, including `urlParameters.link`), `userAccount`, `allWorkspaces`, `responseCache`, and `settings` — the runtime state of every mounted panel, keyed by panel id.

### 5.3 What an application actually is

An application is a thin composition layer. It resolves a workspace, fetches that workspace's metadata, and mounts reusable **panels** — the `insertXxx` functions catalogued in [PANELS.md](PANELS.md). The app's own code is mostly wiring: header toggles, and the callbacks that connect one panel's selection to another panel's content.

```js
$(document).ready(function() {

    setUIEvents();
    insertMenu();

    wsConfig.workspaceId = config.workspaceId || common.workspaceIds.items;

    let requests = [
        $.get('/plm/sections' , { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/fields'   , { wsId : wsConfig.workspaceId, useCache : true }),
        $.get('/plm/bom-views', { wsId : wsConfig.workspaceId, useCache : true })
    ];

    getFeatureSettings('portal', requests, function(responses) {
        // mount panels here, using config.panels.insertXxx
    });
});
```

`getFeatureSettings(appKey, requests, callback)` runs the requests in parallel, shows the startup dialog while they resolve, evaluates any group-based feature gating (see [CONFIGURATION.md](CONFIGURATION.md)), reveals the body, and then calls back with the responses.

---

## 6. Response caching

Responses from `/plm` can be cached **in the Express session** — not on disk, and not shared between users unless you ask for it.

- A handler opts in by starting with `if(notCached(req, res)) { … }`. On a hit, the cached payload is returned with `fromCache : true` and the tenant is never called.
- Caching only happens when the **client passes `useCache : true`** *and* `enableCache` is on in the environment file. Panels expose this as their `useCache` option.
- The **cache key** is the URL path plus its sorted query parameters, ignoring `timestamp`, `useCache`, `updateCache`, `sharedCache` and `requestor`. Any other differing parameter creates a separate entry.
- `updateCache : true` forces a refresh and re-stores. `POST /plm/clear-cache` clears entries.
- `sharedCache : '<name>'` promotes the entry to a process-wide store shared by all users. In settings this is gated on group membership — `config.sharedCache` names a group, and `getFeatureSettings()` blanks it unless the signed-in user belongs to it.

**Entries do not expire.** They live as long as the session. If a workspace's configuration changes in the tenant, apps will keep showing the old definition until the session ends, the server restarts, or the cache is cleared — this is the first thing to check when data looks stale.

A second, independent cache exists in the browser (`responseCache` in `utils.js`, surfaced by the cache-status indicator), and `storage/cache/` holds downloaded binaries. All three are separate.

---

## 7. Directory map

```
app.js                      boot, settings merge, middleware, routers
bin/www                     http/https server (https if keys/privkey.pem exists)
environment.js              connection settings          ─┐
environments/               per-tenant copies of it       ├─ see CONFIGURATION.md
settings.js                 default application settings  │
settings/                   per-tenant overrides (gitignored except custom.js) ─┘

routes/                     landing.js, plm.js, aps.js, pdm.js, services.js

views/
  framework/                layout, landing, start menu, studio, gallery, errors
  apps/                     released end-user applications
  admin/                    administration utilities
  addins/                   Vault / Inventor add-ins
  dev/                      prototypes, not released
  docs/                     the developer guide served at /docs
  custom/                   local-only pages (gitignored)

public/javascripts/
  framework/                registry.js, utils.js, studio.js, gallery.js, landing.js
  contents/                 item.js, nav.js, viewer.js, classification.js, vault.js, …
  apps/  admin/  addins/  dev/  custom/     one file per application
  libs/                     vendored jQuery, DataTables, jQuery UI

public/stylesheets/         mirrors the javascripts layout
storage/                    transient files (gitignored)
chrome/                     optional Chrome/Edge extension
claude/                     these developer guides (context for humans and agents)
```

`public/javascripts/contents/` holds the reusable panels; `public/javascripts/framework/` holds the machinery that renders them.

---

## 8. Built-in developer tools

All are served by this server and require login:

| URL | What it gives you |
|---|---|
| `/studio` | Pick a panel type, set its options, preview it live, and copy the resulting JSON straight into a settings file |
| `/gallery` | Every panel rendered against a range of option profiles |
| `/docs` | The developer guide — one page per panel, plus the icon catalogue |
| `/start` | The Start Menu, listing every enabled application |
| `/template` | A minimal working application to copy from |
| `/troubleshooting` | Setup and connection diagnostics |

Set `debugMode : true` in your environment file to have every panel log its fully resolved settings to the browser console.
