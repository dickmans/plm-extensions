# Configuration

Which file to edit, what the merge does, and the conventions the settings follow. The README covers first-time setup; this document covers the model behind it.

---

## 1. Two kinds of configuration, two kinds of file

| | Connection settings | Application settings |
|---|---|---|
| **What** | Tenant, client ID, callback URL, theme, cache, Vault | Workspace IDs, field IDs, BOM view names, panel options, menu, enabled services |
| **Default file** | `environment.js` | `settings.js` |
| **Your copy** | `environments/<name>.js` | `settings/<name>.js` |
| **Tracked in git?** | Only `environments/template.js` | Only `settings/custom.js` |
| **Edit the default?** | Fine for a single-tenant install | **No** — see §3 |

The split exists so that `settings.js` can be updated from GitHub without overwriting your deployment. Keep your changes in the override files and updates stay merge-free.

---

## 2. Connection settings

`environment.js`, or a copy of it in `environments/`. Start the server against a specific copy by passing its name:

```
npm start adsktenant        # loads ./environments/adsktenant.js
```

| Setting | Environment variable | Notes |
|---|---|---|
| `tenant` | `TENANT` | Tenant name, without the domain |
| `clientId` | `CLIENT_ID` | APS app of type *Desktop, Mobile, Single-Page App*; must be whitelisted in the tenant |
| `redirectUri` | `REDIRECT_URI` | Must match the APS callback URL **exactly**, or login fails with `400 - Invalid redirect_uri` |
| `settings` | `SETTINGS` | Which file in `settings/` to merge — defaults to `custom.js` |
| `defaultTheme` | `DEFAULT_THEME` | `dark`, `light`, `black` or `fusion`; overridable per request with `?theme=` |
| `enableCache` | `ENABLE_CACHE` | Master switch for server-side response caching |
| `debugMode` | `DEBUG_MODE` | Logs resolved panel settings to the browser console |
| `fusionConnected` | `FUSION_CONNECTED` | Enables Fusion component support |
| `adminClientId` / `adminClientSecret` | `ADMIN_CLIENT_ID` / `ADMIN_CLIENT_SECRET` | 2-legged APS app, only for *Outstanding Work Report* and *User Settings Manager* |
| `vaultGateway` / `vaultName` | `VAULT_GATEWAY` / `VAULT_NAME` | Only for the Vault add-ins |

**Environment variables win** over the file, which is what makes cloud deployment practical — fork the repo, set the variables, deploy.

The **port** is taken from `PORT` if set, otherwise parsed out of `redirectUri`. If `redirectUri` uses `https`, `bin/www` looks for `keys/privkey.pem` and `keys/fullchain.pem`, and falls back to http with a warning if they are missing.

Each environment file names the settings file it belongs with (`exports.settings`), so one server can serve several tenants, each with its own configuration, just by changing the startup argument.

---

## 3. Application settings

`settings.js` carries the defaults for every application. Its header says *do not modify* — and that is the rule that keeps upgrades painless. Put your changes in `settings/<name>.js` instead, containing **only the settings you are changing**, with the full path preserved:

```js
// settings/custom.js
exports.common = {
    workspaceIds : {
        items    : 57,
        products : 95
    }
};

exports.applications = {
    portal : {
        panels : {
            insertSearch : { limit : 25 }
        }
    }
};
```

At startup `mergeSettings()` overlays your file on the defaults. The one exception to the rule: when you **add a new application**, its default block and its enable flag belong in `settings.js`, because they are part of the application, not of your tenant. See [ADDING-APPLICATIONS.md](ADDING-APPLICATIONS.md).

### Top-level sections of `settings.js`

| Export | Contains |
|---|---|
| `common` | `workspaceIds` (the shared workspace map), `workspaces` (default BOM view, key field IDs), `viewer` (default viewer behaviour and features) |
| `applications` | One block per application, injected into the page as `config` |
| `menu` | The Start Menu at `/start`, as columns → categories → commands |
| `server` | `landingPage` and `servicesEnabled` |
| `chrome` | Commands and item buttons added by the optional Chrome extension |
| `colors` | The shared palette, including viewer colour vectors |

### `common.workspaceIds`

The single most important thing to review on a new tenant. Every application resolves its workspaces from this map rather than hard-coding IDs, so correcting it once fixes all of them. Workspaces that do not exist in your tenant can simply be left out.

`common.workspaces.items.defaultBOMView` is `'Tree Navigator'` — a BOM view the applications expect to exist, containing only **Descriptor, Number and Quantity**. Create it before first use; new tenants ship with it.

### `server.servicesEnabled`

One boolean per application. A missing or `false` entry makes the endpoint return 404, and `removeDisabledServicesFromMenu()` hides the matching Start Menu tiles automatically.

**The key must be the last segment of the URL** — endpoint, view filename and flag all share one name. `/outstanding-work` needs `'outstanding-work' : true` (quoted, because of the hyphen).

### Conventions inside an application block

```js
exports.applications.myapp = {
    workspaceId : null,                    // resolved at runtime
    panels : {
        insertBOM     : { bomViewName : 'Details', depth : 10, useCache : true },
        insertDetails : { expandSections : ['Basic'], editable : true }
    },
    viewerFeatures : { measure : true, section : true }
};
```

- **Fields are referenced by field ID** (`'NUMBER'`, `'MAKE_OR_BUY'`), never by display name.
- **Workspaces and BOM views are referenced by name** where the API expects a name.
- **`null` means "resolve at runtime."** The application script does the fallback, typically `config.workspaceId || common.workspaceIds.items`.
- **The key under `panels` is the panel function's name.** `insertBOM`'s options live under `panels.insertBOM`. The available options come from the registry — see [PANELS.md](PANELS.md), or build them interactively at `/studio`.

### Group-based feature gating

Two settings accept a **group name** instead of a boolean, and are evaluated against the signed-in user's groups by `getFeatureSettings()`:

- `applicationFeatures` and `viewerFeatures` — an array of group names in place of `true` enables the feature only for members of those groups.
- `sharedCache` — names the group whose members may use the process-wide response cache; for everyone else it is blanked out.

---

## 4. How the merge actually behaves

`mergeSettings()` in `app.js` recurses over exactly five properties — `common`, `applications`, `menu`, `server`, `chrome`. Anything else in your override file is ignored, which is why `colors` cannot be overridden this way.

Within those, plain values and nested objects merge as you would expect: your value replaces the default, and objects are walked key by key.

> ### ⚠️ Arrays do not deep-merge
>
> Array handling depends on the array's contents and length:
>
> | Your override | Result |
> |---|---|
> | Empty array | Replaces the default |
> | Array of strings | Replaces the default |
> | Array of objects, **different length** than the default | Replaces the default |
> | Array of objects, **same length** as the default | Merged **element by element**, key by key |
>
> So overriding one entry of `applications.dashboard` or `explorer.kpis` behaves differently depending on how many entries you supply. If your override has the same length as the default, unspecified keys of each element are inherited from the default — which is rarely what you intend.
>
> **When overriding an array of objects, supply the complete array.**

---

## 5. Checklist for a new tenant

1. Copy `environments/template.js` to `environments/<tenant>.js`; set `tenant`, `clientId`, `redirectUri`, and `settings`.
2. Copy `settings/custom.js` to `settings/<tenant>.js` if this tenant needs its own configuration.
3. Correct `common.workspaceIds` in that file to match the tenant.
4. Create the `Tree Navigator` BOM view in the Items workspace if it does not exist.
5. Turn off unused applications in `server.servicesEnabled`.
6. Start with `npm start <tenant>` and check the console banner for the resolved connection settings.
