# Panels

Applications in this package are assembled from a set of reusable UI building blocks — the **`insertXxx` panel functions**. This document explains how they work and how to configure them. It deliberately does not list every option: the options are defined in the registry and are best explored interactively.

> **Start here:** open **`/studio`** on a running server. Pick a panel type, tick the options you want, click *Run* to preview it against live data, and copy the generated JSON straight into your settings file. **`/docs`** shows one worked page per panel, and **`/gallery`** renders every panel against a range of option profiles.

---

## 1. The rule

**Do not hand-roll a panel.** Searching, listing, item details, attachments, BOM trees, grids, workflow history, classification — all of it already exists, is themed, handles selection, filtering, pagination, editing and saving, and gets fixed centrally. An application that builds its own is an application that will drift.

---

## 2. Catalogue

Panel types are declared in `public/javascripts/framework/registry.js` under `registry.panelTypes`, in five categories. Each entry carries a prose `description` and `usage` written to help you choose — read them before picking.

### Navigation — `contents/nav.js`

| Function | Shows |
|---|---|
| `insertMOW` | The signed-in user's outstanding workflow tasks, across workspaces |
| `insertRecentItems` | Items the user opened most recently |
| `insertBookmarks` | Items the user has bookmarked |
| `insertWorkspaceViews` | A workspace's saved views, with a switcher; can fold in MOW, bookmarks and recents |
| `insertWorkspaceSearch` | Search scoped to one workspace, showing that workspace's columns |
| `insertSearch` | Cross-workspace search |
| `insertResults` | A filtered result list for a workspace, driven by supplied filters |

### Creation

| Function | Shows |
|---|---|
| `insertCreate` | A create form for a workspace, built from its sections and fields |

### Item data — `contents/item.js`

| Function | Shows |
|---|---|
| `insertDetails` | An item's sections and fields, optionally editable |
| `insertImages` | An item's image fields |
| `insertAttachments` | Attachments, with upload, screenshot capture and type filtering |
| `insertGrid` | A grid (table) field, editable, with add/clone/delete rows |
| `insertBOM` | The BOM as a navigable tree |
| `insertBOMPartsList` | The flattened parts list derived from a BOM |
| `insertFlatBOM` | The flat BOM as returned by the API |
| `insertRootParents` / `insertParents` | Where-used, from the top down or one level up |
| `insertBOMChanges` | Differences between BOM revisions |
| `insertManagedItems` | Items managed by a change process |
| `insertChangeProcesses` | Change processes affecting an item, with creation |
| `insertProject` | Project/task items linked to a record |
| `insertRelationships` | Related items |
| `insertSourcing` | Suppliers and quotes |
| `insertWorkflowHistory` | The workflow history of a record |
| `insertRevisions` | The revision list |
| `insertChangeLog` | The change log |
| `insertItemSummary` | A composite panel hosting several of the above as tabs or stacked sections |

### Classification — `contents/classification.js`

`insertClasses`, `insertClassContents`, `insertClassFilters`, `insertItemClassification`, `insertSimilarItems`

### Administration

`insertUsers`

**Not in the registry, but available** and used the same way: `insertViewer`, `insertItemStatus`, `insertWorkflowActions`, `insertPhaseGates`, `insertClone` (`contents/item.js`); `insertNewTasks`, `insertTasksManager`, `insertBrowser` (`contents/nav.js`); the Vault and APS panels in `contents/vault.js` and `contents/aps.js`.

---

## 3. Mounting a panel

Two things are needed: a container in the view whose **`id` is the panel id**, and a call from the application script.

```pug
//- views/apps/myapp.pug
#main.screen
    .surface-level-2#search
    .surface-level-2#details
    .surface-level-1#bom
```

```js
// public/javascripts/apps/myapp.js
let paramsSearch = config.panels.insertSearch;
    paramsSearch.workspacesIn = [ wsConfig.workspaceId ];
    paramsSearch.onClickItem  = function(elemClicked) { openItem(elemClicked); };

insertSearch(paramsSearch);
```

Default ids come from the registry (`search`, `details`, `bom`, `recents`, `attachments`, …). To mount **two of the same panel** on one page, give each its own `params.id` and add a matching container — this is how the BOM comparison app runs two BOM trees side by side.

Panels that show a specific record take the record's `link` as their first argument:

```js
insertDetails(link, config.panels.insertDetails);
insertBOM(link, paramsBOM);
```

---

## 4. How options are resolved

`getPanelSettings(name, params, inputs)` builds the panel's settings by layering, in order:

1. `panelStandardOptions` — the options every panel shares, grouped as **header**, **controls**, **contents**, **table**, **tiles**
2. `fieldIDs` — panel-specific field mappings
3. `panelData` — what to load: `fieldsIn` / `fieldsEx`, `workspacesIn` / `workspacesEx`, `bomViewName`, `bomViewId`, `depth`, `revisionBias`, `timeout`, …
4. `panelFilters` — the filter controls to show: `filterByStatus`, `filterByWorkspace`, `filterByOwner`, `filterByDueDate`, `filterEmpty`, …
5. `panelAdditionalOptions` — opt-in extras, grouped as **create**, **sections**, **files**, **tree**, **grid**, **history**, **log**, **summary**, **sorting**, **dnd**, **classes**, **others**
6. `excluded` — options the panel type explicitly removes

Precedence for any single option:

```
caller params  >  panel type defaults  >  shared dictionary default
```

Each panel type declares which of these groups it accepts, so an option that means nothing for a given panel is simply not available on it — `/studio` only offers you the valid ones.

**Where to put the options.** Anything static belongs in settings, under `config.panels.<functionName>`; anything runtime (a resolved workspace id, a callback) is added in the application script before the call. The usual idiom is to take the settings block, add the runtime bits, and pass it on — as in the example above.

---

## 5. Runtime state, callbacks and hooks

**State.** Resolved settings live in the global `settings[<panelId>]` for as long as the page lives. `settings[id].load()` re-runs the panel's data function — the standard way to refresh a panel after something changed elsewhere.

**Callbacks** are passed as options:

| Option | Called when |
|---|---|
| `onClickItem(elemClicked)` | An item in the panel is clicked |
| `onDblClickItem(elemClicked)` | An item is double-clicked |
| `afterCompletion(id)` | The panel has finished rendering its data |
| `afterSave(id)` | The panel has saved its changes |

Drag and drop adds `onDragStart`, `onDragEnter`, `onDragOver`, `onDragLeave`, `onDragEnd`, `onDrop` on panels that support it.

**Lifecycle hooks.** Every panel defines two no-op functions that an application may redefine to extend it without touching the shared code:

```js
function insertBOMDone(id) { }              // panel shell rendered
function insertBOMDataDone(id, data) { }    // data loaded and rendered
```

Redefine them in your application script — because everything is a global, your later definition wins.

---

## 6. Rendering helpers

If you are extending the framework rather than composing an application, the shared renderers in `framework/utils.js` are what the panels are built from:

- **Panel chrome** — `genPanelElements`, `genPanelHeader`, `genPanelToolbar`, and the `genPanel*Button` family (reload, reset, create, clone, bookmark, open in PLM, selection controls, filters, pagination)
- **Content renderers** — `genTree*` (BOM trees, paths, toggles, drag-drop), `genTiles*` (list and grid layouts), `genTable*` (tables with groups, totals, ranges, inline editing)
- **Update cycle** — `startPanelContentUpdate` → `finishPanelContentUpdate`, plus `filterPanelContent`, `updatePanelCalculations`, `savePanelTableChanges`

The 3D viewer lives in `contents/viewer.js`: `insertViewer`, `viewerSelectModel(s)`, `viewerSetColor(s)`, `viewerHideModels` / `viewerUnhideAll`, `viewerResize`, and the `onViewerSelectionChanged` hook that applications override to link viewer selection to a BOM tree.

---

## 7. Debugging a panel

1. Set `debugMode : true` in your environment file. Every panel then logs its **fully resolved settings** to the browser console as it mounts — the fastest way to see which option actually took effect.
2. Reproduce it in isolation at `/studio`, away from the surrounding application.
3. Check the server terminal: each `/plm` handler logs its inbound parameters, and failures log `ERROR REQUESTING : <url>` with the tenant's message.
4. If the data is stale rather than wrong, suspect the cache — see the caching section of [ARCHITECTURE.md](ARCHITECTURE.md).
