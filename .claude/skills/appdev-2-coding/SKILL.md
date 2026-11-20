---
name: appdev-2-coding
description: Develop an application, either building the initial version of a new app or extending an existing one. Changes only the app's own pug, js and css files and builds on the panel library of registry.js. Use when coding features in an app.
---

# appdev-2-coding: Develop application

Builds the first version of an application (typically right after `appdev-1-create`) or extends an existing one. The result lives in exactly three files: the app's **pug view**, **javascript** and **stylesheet**.

References (read the parts you need, do not recall from memory): `claude/PANELS.md`, `claude/ADDING-APPLICATIONS.md` (sections 4 to 6), `claude/ARCHITECTURE.md`, `claude/CONFIGURATION.md`, and `public/javascripts/framework/registry.js` (panel catalogue).

## Hard rules

1. **Only the three app files may be modified, plus one exception: the app's own `panels` node.** The only change allowed outside the three files is adding or updating the `insertXxx` nodes in `exports.applications.<key>.panels` of `settings.js` (see "Panel settings for admins" below), as a targeted edit that leaves everything else in the file untouched. Never edit anything else in `settings.js`, `settings/*.js`, `routes/landing.js`, `app.js`, anything in `public/javascripts/framework/`, `public/javascripts/contents/`, `public/stylesheets/framework/`, or the `custom` hook files. A new or changed application must not impact framework features or other apps.
2. **Propose, do not perform, framework changes.** If you notice the same feature being implemented repeatedly across apps (or a library gap this app works around), list it as a proposal in the final report: what, where it repeats, and the suggested shared home. Do not implement it.
3. **Library first.** Use the `insertXxx` panel functions from `registry.js` and the shared helpers before writing any UI of your own. Hand-written code is only the glue: layout, toggles, wiring panels together, and behavior the library does not offer.
4. **Follow existing patterns.** Mirror how comparable apps are built (structure of the ready function, `setUIEvents`, naming, panel toggles, comment style, indentation) unless there is a reason not to.

## Defaults for every application

Apply these in the initial build, and bring existing apps in line with them whenever you touch the affected part (updates): do not leave a new panel or screen without them.

1. **Surface level on every panel.** Every container into which an `insertXxx` function mounts (pug container, or a container your script creates) carries a `surface-level-N` class, for example `.surface-level-2#search`. The panel then gets its content separation border automatically. Nested panels use a level that differs from their parent. Never rely on a panel inheriting its level by accident.
2. **Border width through CSS variables.** Define the default border width of the panels as variables at the top of the app stylesheet, named after the app, and use them for every panel container of the app:

    ```css
    :root {
        --<endpoint>-border-vertical   : 20px;
        --<endpoint>-border-horizontal : 30px;
    }
    #<panel-id>, #<other-panel-id> {
        border-width : var(--<endpoint>-border-vertical) var(--<endpoint>-border-horizontal);
    }
    ```

    Vertical applies to top and bottom, horizontal to left and right. Reduce or override the values only where the layout needs it (for example narrow phone screens), by changing the variables inside a media query or body class and not by repeating hardcoded pixel values.
3. **Header subtitle follows the screen.** `#header-subtitle` is hidden (`hidden` class) on landing pages, that is, while no item or function is selected. When an entry is selected or the user navigates to another screen of the app, show it and set its text to the name of the screen function (for example "Capture measurements") or to the descriptor of the selected item. Hide and clear it again when returning to the landing page. Use `addClass`/`removeClass('hidden')` and `.html(...)` (the `.hidden` class is `!important`, so `.show()` and `.hide()` do not work reliably). Put this in one small function (for example `<prefix>SetSubtitle(text)`, hiding when the text is blank) that every screen change and item selection calls.

4. **Use the positioning classes of the framework.** For absolutely positioned containers, assign classes in the pug instead of repeating `position`, `top`, `right`, `bottom` and `left` in the app stylesheet (defined in `framework/styles.css`):

    | Class | Sets | Add in the app css |
    |---|---|---|
    | `pos-abs-max` | `position: absolute` and all four edges at 0 (fills the parent) | nothing, or an offset that differs |
    | `pos-abs-top` | absolute, top, left and right at 0 (full-width strip at the top) | `height` (or `bottom`) |
    | `pos-abs-bottom` | absolute, bottom, left and right at 0 (full-width strip at the bottom) | `height` (or `top`) |
    | `pos-abs-left` | absolute, top, bottom and left at 0 (full-height strip on the left) | `width` (or `right`) |
    | `pos-abs-right` | absolute, top, bottom and right at 0 (full-height strip on the right) | `width` (or `left`) |

    Use them whenever one fits, for example `.pos-abs-max#qi-landing` or `.pos-abs-bottom#qi-phone-nav`. In the stylesheet only state what the class does not give you (a width, a height, one deviating offset such as `top : 48px`, padding, gaps). Do not rewrite the full five-line block for a container that one of these classes covers. When a container needs the same position in one layout and a different one in another (for example phone), keep the class and override only the differing properties inside that media query or body class.

## Panel settings for admins

Whenever the app mounts a panel through an `insertXxx` function (`insertDetails`, `insertAttachments`, `insertBOM`, `insertSearch` and so on), admins must be able to configure it in the settings file, as in the released applications (`portal`, `navigator`, `reviews`, `mbom` and others). For each such panel:

1. **Add a node** `insertXxx` under `exports.applications.<key>.panels` in `settings.js` (and in `settings/custom.js` only when the app already has a node there). Create the `panels` node if it is missing. Do not touch other nodes.
2. **Fill it with all settings the app intends to use**: the options that make sense as defaults (for example `headerLabel`, `singleToolbar`, `contentSize`, `toggles`, `editable`, `expandSections`, `sectionsIn`, `sectionsEx`, `fieldsEx`), not an empty `{}`. Never invent workspace IDs, field IDs or BOM view names; use only values known from `settings.js` or given by the user, otherwise leave the option out and mention it in the report.
3. **Describe the purpose** in a short comment on the node line, stating what this panel is used for in this app, for example `insertDetails : { // Displays the details of the selected inspection`.
4. **Pass the settings to the function in the script.** Do not duplicate defaults in the script. Merge the settings with the required, fixed and mandatory options that the app's layout and logic depend on, and let the fixed ones win:

    ```javascript
    const paramsDetails = Object.assign(config.panels.insertDetails, {
        id            : 'data',
        singleToolbar : 'actions',
        hideHeader    : true
    });
    insertDetails(link, paramsDetails);
    ```

    Fixed options are the panel `id`, options the app's structure relies on and callbacks (`afterCompletion`, `onClickItem` and similar). Everything else stays admin-configurable.
5. Every `insertXxx` panel used in the script has a node in the settings, and every node in `panels` is used by the script. Use `node --check` on `settings.js` after editing.

## 1. Identify the application

1. Read `.claude/state/current-app.json`, if it exists. It names the application created by `appdev-1-create` or last worked on.
2. Skip the selection only if the user already named an endpoint in the request or earlier in the conversation. It must exist in the list below.
3. Otherwise build the list from the `router.get` lines of `routes/landing.js` (endpoint, title, launch path), grouped by block heading: **Development** (APPLICATIONS IN DEVELOPMENT), **Standard** (STANDARD APPLICATIONS), **Administration** (ADMINISTRATION UTILITIES), **Add-ins & custom** (Vault & INVENTOR ADDINS and CUSTOM APPLICATIONS). Leave out framework and tool routes (landing, start, docs, monitoring, gallery, studio, template and similar services).
4. Ask with AskUserQuestion; the user picks, never types a name:
   - If `current-app.json` exists, first ask: "Continue with <title> (/<endpoint>)?" with options **Continue with <title> (Recommended)** and **Choose another application**. Only on the second answer go on.
   - Group question (groups with counts, current app's group first), then the group's applications, 3 per question plus a 4th option "More applications…" for the next page (last page up to 4). The current application comes first, marked "(current)".
5. If the chosen application is outside the Development group, say in the plan (step 4) that this changes released functionality.

## 2. Resolve the three files

From the route's `launch('<folder>/<name>', …)` call:

| File | Path |
|---|---|
| view | `views/<folder>/<name>.pug` |
| script | `public/javascripts/<folder>/<name>.js` |
| style | `public/stylesheets/<folder>/<name>.css` |

Read the pug file and treat its `link`/`script` tags as the truth for the script and style paths (they may differ from the convention). Ignore `custom/…` hook files referenced there; never modify them. If a file is missing, stop and tell the user.

Write `.claude/state/current-app.json` for the selected application (same format as `appdev-1-create`; `area` is the folder, `title` is the third `launch` argument, keep an existing `description`), with `stage` = `coding`. Mention if this replaces a different current application.

## 3. Understand the application

1. Read the three files completely and the app's settings node (`exports.applications.<key>` in `settings.js` and `settings/custom.js`, read only; the key is the second `launch` argument).
2. Decide the mode:
   - **Initial build**: script and style are empty and the pug is the plain skeleton from `appdev-1-create`.
   - **Update**: anything else. Understand the existing structure and conventions first and keep them.
3. Find 1 or 2 existing apps similar in layout or purpose (list `public/javascripts/apps/` and `dev/`; for example `reviews` for tabs and tiles, `portal`, `classes`, `explorer`, `navigator` for search plus details, `abom`/`mbom` for BOM editors) and read them for patterns.

## 4. Define the work and confirm

Gather what is missing in **one message**, then wait:

- Initial build: layout (regions/panels and arrangement, header toggles), use case (who uses it, why), functional definition (PLM workspaces involved, which information to show or capture, what happens on selection, create or save). Use the `description` from `current-app.json` as the starting point; propose a concrete design instead of asking open questions where you can.
- Update: what should change or be added, and where.

PLM specifics you cannot discover (workspace IDs or names, field IDs, BOM view names) must come from the user or from `settings.js` (`common.workspaceIds`, other nodes). Never invent them. Field references use field IDs, BOM views are referenced by name.

Then present a short plan and get a clear go-ahead before editing:

- layout (container ids in the pug)
- panels to mount (`insertXxx` function, role, key options), with the registry entries you based the choice on, and for each the settings node (`panels.insertXxx`) with the options and purpose comment you will add, split into admin-configurable and fixed options
- interactions and callbacks (selection, `afterCompletion`, `afterSave`, `onClickItem`, hooks)
- custom code you expect to write beyond the library, and why the library does not cover it

## 5. Implement

**Pug**: keep `extends ../framework/layout`, the `block head` references and the standard `#header` / `#main.screen` shell. Add one container per panel whose **id equals the panel id** (default ids from `registry.js`; give each a unique `params.id` when mounting the same panel twice). Give every panel container a `surface-level-*` class and start `#header-subtitle` with the `hidden` class (see Defaults). Use `.hidden` and the header toggle pattern (`.button.with-toggle.toggle-on|toggle-off#toggle-<x>`) as other apps do.

**Script**: use the app pattern from `claude/ADDING-APPLICATIONS.md` section 5: `$(document).ready` → `insertMenu()` → resolve workspaces → `getFeatureSettings(<key>, requests, callback)` → mount panels → `setUIEvents()`. In detail:

- Panel options: take them from the app's settings node (`config.panels.insertXxx`, see "Panel settings for admins") and apply the fixed options on top with `Object.assign(config.panels.insertXxx, { … })`. Add runtime values (resolved workspace ids, callbacks) in the same way. Resolve workspace ids as `config.workspaceId || common.workspaceIds.<name>` or the pattern the app already uses.
- Use `urlParameters.link` to support opening the app in the context of an item when that fits.
- React to library completion with the options `afterCompletion(id)`, `afterSave(id)`, `onClickItem`, `onDblClickItem` and by redefining the lifecycle hooks `insertXxxDone(id)` / `insertXxxDataDone(id, data)`. Refresh a panel with `settings[id].load()`.
- Reuse helpers from `utils.js` and the contents files (`isBlank`, `openItemByLink`, `appendProcessing`, viewer helpers, `genPanel*` where needed) instead of re-implementing them. Search `utils.js`/`registry.js` with grep before writing a helper.
- Global namespace: all scripts share one global scope. Prefix or tightly name app-level functions and variables so they cannot collide with framework or panel globals (check with grep), and never redefine a framework function.
- Direct REST calls only for what no panel covers, using the existing `/plm/…` routes.

**Style**: keep it minimal, take positioning from the `pos-abs-*` classes (see Defaults), but always start with the border-width variables and their use on the panel containers (see Defaults). Rely on framework classes, themes and CSS variables; add only layout and app-specific rules, scoped by the app's container ids or an app class. No overrides of framework classes and no hardcoded colors that break the themes (dark, light, black, fusion). The pug and script must work on the platforms the app targets (desktop, tablet, phone) when the description says so.

For updates use targeted edits that keep the existing style; no unrelated refactoring or reformatting.

## 6. Verify

- `node --check` on the script.
- Compile the view: `node -e "require('pug').compileFile('<view path>')"`.
- Grep that every function and global you call exists (`insertXxx`, helpers) and that no name you define collides with an existing global.
- Confirm every panel container id exists in the pug and matches the id used in the script.
- Confirm that no stylesheet rule repeats the `position: absolute` plus four edges block that a `pos-abs-*` class already provides.
- Confirm the Defaults: every panel container has a `surface-level-*` class, the border variables are defined in the css and used by all panel containers, and `#header-subtitle` is hidden on the landing page and set or cleared by every screen change.
- Run `node --check settings.js` and confirm each `insertXxx` used in the script has a documented node (with purpose comment) in `exports.applications.<key>.panels`, and that the script passes it via `Object.assign(config.panels.insertXxx, {…})` with only fixed options overridden.
- Check with `git diff` that the only change in `settings.js` is the app's `panels` node, and with `git status --short` that otherwise only the three app files (and `.claude/state/current-app.json`) changed because of this skill.
- This cannot be tested in a browser from here (APS login, live PLM data). Say so, and tell the user what to check on the page.

Set `stage` to `coded` and refresh `updated` in `.claude/state/current-app.json`.

## 7. Report and next steps

Report:

- what was built or changed in each of the three files (one line each)
- which library panels and callbacks were used, and what custom code exists and why
- the panel settings nodes added or changed in `settings.js` (one line per `insertXxx`, with its purpose)
- **proposals** (not performed): other settings changes (outside the app's `panels` node, or in `settings/custom.js`), and framework or library changes for repeated implementations
- open points, assumptions about PLM configuration, and anything not verified

Then ask whether to start (or restart) the server to test: if yes, invoke `server-start`. If a server started from this console is already running, new pug, js and css files are normally served without a restart; reloading the page is enough unless the view engine caches templates (then restart). Point the user to `http://localhost:<port>/<endpoint>`.

Mention the follow-up skills for review and documentation (`appdev-4-review`, `appdev-5-doc`) only if the user asks about next steps.
