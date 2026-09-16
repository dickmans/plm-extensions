/* ----------------- AI generated code -------------------------- */

/* Reusable insertion API:
await extension.insertTagForComponent(
    model,
    dbId,
    { source: "my-custom-event" }
); */

/* ... or if you know the matching instance:
await extension.insertTag({
    model,
    partNumber,
    componentName,
    instances,
    source: "my-custom-event"
}); */


class PartNumberTags extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);

        this.button = null;
        this.visibleButton = null;
        this.clickButton = null;
        this.clearButton = null;

        this.active = false;
        this.clickTagModeActive = false;

        this.TAG_SOURCE_MANUAL = "manual";
        this.TAG_SOURCE_VISIBLE = "visible";
        this.TAG_SOURCE_CLICK = "click";

        /*
         * Persistent annotation groups.
         *
         * Map key:
         *   model + normalized Part Number
         *
         * Map value:
         * {
         *   key,
         *   model,
         *   partNumber,
         *   componentName,
         *   instances: [{ model, dbId, box }],
         *   colorIndex,
         *   color,
         *   labelElement,
         *   lineElements,
         *   sources: Set<string>
         * }
         */
        this.groups = new Map();

        this.overlay = null;
        this.svg = null;

        this._layoutRequest = null;
        this._visibilityTimer = null;
        this._processingSelection = false;

        this.onCameraChange =
            this.onCameraChange.bind(this);

        this.onVisibilityChange =
            this.onVisibilityChange.bind(this);

        this.onSelectionChanged =
            this.onSelectionChanged.bind(this);

        this.onExplodeChange =
            this.onExplodeChange.bind(this);
    }

    load() {
        this.createOverlay();

        this.viewer.addEventListener(
            Autodesk.Viewing.CAMERA_CHANGE_EVENT,
            this.onCameraChange
        );

        this.viewer.addEventListener(
            Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
            this.onSelectionChanged
        );

        this.viewer.addEventListener(
            Autodesk.Viewing.EXPLODE_CHANGE_EVENT,
            this.onExplodeChange
        );

        if (
            Autodesk.Viewing
                .AGGREGATE_HIDDEN_CHANGED_EVENT
        ) {
            this.viewer.addEventListener(
                Autodesk.Viewing
                    .AGGREGATE_HIDDEN_CHANGED_EVENT,
                this.onVisibilityChange
            );
        }

        return true;
    }

    unload() {
        this.disable();

        this.viewer.removeEventListener(
            Autodesk.Viewing.CAMERA_CHANGE_EVENT,
            this.onCameraChange
        );

        this.viewer.removeEventListener(
            Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
            this.onSelectionChanged
        );

        this.viewer.removeEventListener(
            Autodesk.Viewing.EXPLODE_CHANGE_EVENT,
            this.onExplodeChange
        );

        if (
            Autodesk.Viewing
                .AGGREGATE_HIDDEN_CHANGED_EVENT
        ) {
            this.viewer.removeEventListener(
                Autodesk.Viewing
                    .AGGREGATE_HIDDEN_CHANGED_EVENT,
                this.onVisibilityChange
            );
        }

        if (this._layoutRequest) {
            cancelAnimationFrame(
                this._layoutRequest
            );

            this._layoutRequest = null;
        }

        if (this._visibilityTimer) {
            clearTimeout(
                this._visibilityTimer
            );

            this._visibilityTimer = null;
        }

        if (this.viewer.toolbar) {
            const toolbarGroup =
                this.viewer.toolbar.getControl(
                    "part-number-tags-toolbar"
                );

            if (toolbarGroup) {
                for (
                    const button
                    of [
                        this.button,
                        this.visibleButton,
                        this.clickButton,
                        this.clearButton
                    ]
                ) {
                    if (button) {
                        toolbarGroup.removeControl(
                            button
                        );
                    }
                }
            }

        }

        this.clearGroups();

        if (this.overlay) {
            this.overlay.remove();
        }

        this.overlay = null;
        this.svg = null;

        return true;
    }

    onToolbarCreated() {
        this.createButton();
    }

    createButton() {
        if (
            this.button ||
            !this.viewer.toolbar
        ) {
            return;
        }

        let toolbarGroup =
            this.viewer.toolbar.getControl(
                "part-number-tags-toolbar"
            );

        if (!toolbarGroup) {
            toolbarGroup =
                new Autodesk.Viewing.UI.ControlGroup(
                    "part-number-tags-toolbar"
                );

            this.viewer.toolbar.addControl(
                toolbarGroup
            );
        }

        /*
         * Toggle button:
         * Tag the most recently clicked component.
         */
        this.clickButton =
            new Autodesk.Viewing.UI.Button(
                "part-number-tag-click-button"
            );

        this.addButtonClasses(
            this.clickButton,
            "part-number-tag-click-mode-button"
        );

        this.clickButton.setToolTip(
            "Toggle single-click Part Number Tag mode"
        );

        this.clickButton.onClick = () => {
            if (this.clickTagModeActive) {
                this.disableClickTagMode();
            } else {
                this.enableClickTagMode();
            }
        };        

        /*
         * Existing/manual tagging button.
         */
        this.button =
            new Autodesk.Viewing.UI.Button(
                "part-number-tag-manual-button"
            );

        this.addButtonClasses(
            this.button,
            "part-number-tag-manual-button"
        );

        this.button.setToolTip(
            "Toggle multi-click Part Number Tag mode"
        );

        this.button.onClick = () => {
            if (this.active) {
                this.disableManualMode();
            } else {
                this.enableManualMode();
            }
        };

        /*
         * One-click button:
         * Create tags for all currently visible
         * components.
         */
        this.visibleButton =
            new Autodesk.Viewing.UI.Button(
                "part-number-tag-visible-button"
            );

        this.addButtonClasses(
            this.visibleButton,
            "part-number-tag-all-visible-button"
        );

        this.visibleButton.setToolTip(
            "Add Part Number Tags for all visible components"
        );

        this.visibleButton.onClick = async () => {
            try {
                await this.addTagsForVisibleComponents();
            } catch (error) {
                console.error(
                    "PartNumberTags visible-components error:",
                    error
                );
            }
        };

        /*
         * One-click button:
         * Clear all tags.
         */
        this.clearButton =
            new Autodesk.Viewing.UI.Button(
                "part-number-tag-clear-button"
            );

        this.addButtonClasses(
            this.clearButton,
            "part-number-tag-clear-button"
        );

        this.clearButton.setToolTip(
            "Clear all Part Number Tags"
        );

        this.clearButton.onClick = () => {
            this.clearGroups();
        };

        toolbarGroup.addControl(
            this.clickButton
        );

        toolbarGroup.addControl(
            this.button
        );

        toolbarGroup.addControl(
            this.visibleButton
        );

        toolbarGroup.addControl(
            this.clearButton
        );
    }

    /*
     * Add the framework's generic "icon" class
     * as requested, plus a unique class that can
     * be used to supply button imagery/content
     * through CSS.
     */
    addButtonClasses(
        button,
        uniqueClass,
    ) {
        if (
            !button ||
            !button.container
        ) {
            return;
        }

        button.container.classList.add(
            "icon", "part-number-tag-button",
            uniqueClass
        );
    }

    createOverlay() {
        if (this.overlay) {
            return;
        }

        this.overlay =
            document.createElement("div");

        this.overlay.className =
            "part-number-tag-overlay";

        this.svg =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

        this.svg.classList.add(
            "part-number-tag-lines"
        );

        this.overlay.appendChild(
            this.svg
        );

        this.viewer.container.appendChild(
            this.overlay
        );
    }

    /*
     * Retain enable()/disable() for compatibility
     * with code that may already call them.
     */
    enable() {
        this.enableManualMode();
    }

    disable() {
        this.disableManualMode();
        this.disableClickTagMode();
    }

    /*
     * Original/manual selection mode.
     *
     * Notice that disabling this mode no longer
     * clears all tags. Tags are now independent
     * of the currently enabled insertion mode.
     */
    enableManualMode() {
        this.active = true;

        /*
         * Only one selection-driven tagging mode
         * should be active at once.
         */
        this.disableClickTagMode();

        this.setViewerSelectionSuppressed(
            true
        );

        if (this.button) {
            this.button.setState(
                Autodesk.Viewing.UI.Button
                    .State.ACTIVE
            );
        }

        this.viewer.clearSelection();
    }

    disableManualMode() {
        this.active = false;

        if (this.button) {
            this.button.setState(
                Autodesk.Viewing.UI.Button
                    .State.INACTIVE
            );
        }

        if (!this.clickTagModeActive) {
            this.setViewerSelectionSuppressed(
                false
            );
        }

        this.viewer.clearSelection();
    }

    /*
     * Single-click mode.
     *
     * Each new click clears the tag associated
     * with TAG_SOURCE_CLICK before inserting the
     * new one.
     */
    enableClickTagMode() {
        this.clickTagModeActive = true;

        this.disableManualMode();

        this.setViewerSelectionSuppressed(
            true
        );

        if (this.clickButton) {
            this.clickButton.setState(
                Autodesk.Viewing.UI.Button
                    .State.ACTIVE
            );
        }

        this.viewer.clearSelection();
    }

    disableClickTagMode() {
        this.clickTagModeActive = false;

        if (this.clickButton) {
            this.clickButton.setState(
                Autodesk.Viewing.UI.Button
                    .State.INACTIVE
            );
        }

        if (!this.active) {
            this.setViewerSelectionSuppressed(
                false
            );
        }

        this.viewer.clearSelection();
    }

    /*
     * Preserve the integration that existed in
     * the original implementation while keeping
     * it isolated from the generic tagging code.
     */
    setViewerSelectionSuppressed(
        suppressed
    ) {
        try {
            const hostViewerElement =
                typeof viewer !== "undefined"
                    ? viewer
                    : this.viewer.container;

            const id =
                $(hostViewerElement).attr(
                    "id"
                );

            const viewerInstance =
                typeof getViewerInstance ===
                    "function" &&
                id
                    ? getViewerInstance(
                          id
                      )
                    : null;

            if (viewerInstance) {
                viewerInstance
                    .disableSelectEvent =
                    Boolean(
                        suppressed
                    );
            }
        } catch (_) {
            /*
             * Host application integration is
             * optional.
             */
        }
    }

    async onSelectionChanged(event) {
        if (
            !this.active &&
            !this.clickTagModeActive
        ) {
            return;
        }

        /*
         * viewer.clearSelection() itself emits
         * another selection event.
         */
        if (this._processingSelection) {
            return;
        }

        if (
            !event.selections ||
            event.selections.length === 0
        ) {
            return;
        }

        /*
         * Copy model/dbId information before
         * clearing the normal Viewer selection.
         */
        const selections =
            event.selections.map(
                (selection) => ({
                    model:
                        selection.model,

                    dbIds: [
                        ...(
                            selection.dbIdArray ||
                            selection.nodeArray ||
                            []
                        )
                    ]
                })
            );

        this._processingSelection = true;

        /*
         * Remove normal Viewer highlighting.
         */
        this.viewer.clearSelection();

        try {
            /*
             * Single-click mode only uses the
             * first component selected by the
             * click.
             */
            if (
                this.clickTagModeActive
            ) {
                /*
                 * Remove whichever tag was
                 * previously owned by this mode.
                 *
                 * If the same tag is also owned
                 * by another source, it remains.
                 */
                this.clearTagsBySource(
                    this.TAG_SOURCE_CLICK
                );

                const firstSelection =
                    selections.find(
                        (selection) =>
                            selection.model &&
                            selection.dbIds
                                .length
                    );

                if (firstSelection) {
                    await this
                        .insertTagForComponent(
                            firstSelection
                                .model,
                            firstSelection
                                .dbIds[0],
                            {
                                source:
                                    this.TAG_SOURCE_CLICK
                            }
                        );
                }
            } else {
                /*
                 * Original behavior:
                 * process all selected leaf
                 * components.
                 */
                for (
                    const selection
                    of selections
                ) {
                    for (
                        const dbId
                        of selection.dbIds
                    ) {
                        await this
                            .insertTagForComponent(
                                selection.model,
                                dbId,
                                {
                                    source:
                                        this.TAG_SOURCE_MANUAL
                                }
                            );
                    }
                }
            }

            this.layout();
        } catch (error) {
            console.error(
                "PartNumberTags selection error:",
                error
            );
        } finally {
            this._processingSelection =
                false;
        }
    }

    /*
     * ==========================================================
     * ALL-VISIBLE TAGGING
     * ==========================================================
     *
     * One-click action used by the second button.
     *
     * It first clears tags created by this action,
     * then scans currently visible leaf components
     * from every visible model.
     *
     * Matching Part Numbers are batched before
     * insertion so we do not repeatedly search the
     * complete object tree for every component.
     */
    async addTagsForVisibleComponents() {
        /*
         * Only remove ownership from the
         * "all visible" feature.
         *
         * Tags also owned by another feature
         * remain.
         */
        this.clearTagsBySource(
            this.TAG_SOURCE_VISIBLE
        );

        const models =
            this.getViewerModels();

        for (
            const model
            of models
        ) {
            const dbIds =
                await this
                    .getVisibleLeafNodes(
                        model
                    );

            if (!dbIds.length) {
                continue;
            }

            /*
             * Fetch Part Number and component
             * names in one bulk operation.
             */
            const metadata =
                await this
                    .getComponentMetadata(
                        model,
                        dbIds
                    );

            const groupsByPartNumber =
                new Map();

            for (
                const dbId
                of dbIds
            ) {
                const item =
                    metadata.get(
                        dbId
                    );

                if (
                    !item ||
                    !item.partNumber
                ) {
                    continue;
                }

                const partNumber =
                    item.partNumber
                        .trim();

                if (!partNumber) {
                    continue;
                }

                const box =
                    this.getNodeWorldBounds(
                        model,
                        dbId
                    );

                if (
                    !box ||
                    box.isEmpty() ||
                    !this.isBoxInViewport(
                        box
                    )
                ) {
                    continue;
                }

                const key =
                    this.normalizePartNumber(
                        partNumber
                    );

                let prepared =
                    groupsByPartNumber
                        .get(
                            key
                        );

                if (!prepared) {
                    prepared = {
                        partNumber,

                        componentName:
                            item.componentName ||
                            "(Unnamed component)",

                        instances: []
                    };

                    groupsByPartNumber
                        .set(
                            key,
                            prepared
                        );
                }

                prepared.instances.push({
                    model,
                    dbId,
                    box
                });
            }

            /*
             * Every prepared Part Number group
             * now goes through the generic
             * insertion API.
             */
            for (
                const prepared
                of groupsByPartNumber
                    .values()
            ) {
                await this.insertTag({
                    model,

                    partNumber:
                        prepared
                            .partNumber,

                    componentName:
                        prepared
                            .componentName,

                    instances:
                        prepared
                            .instances,

                    source:
                        this.TAG_SOURCE_VISIBLE
                });
            }
        }

        this.layout();
    }

    /*
     * Get all models that currently participate
     * in the Viewer.
     *
     * getVisibleModels() is preferred for
     * aggregate/multi-model viewing.
     */
    getViewerModels() {
        if (
            typeof this.viewer
                .getVisibleModels ===
            "function"
        ) {
            const models =
                this.viewer
                    .getVisibleModels();

            if (
                Array.isArray(
                    models
                ) &&
                models.length
            ) {
                return models;
            }
        }

        /*
         * Fallback for Viewer versions where
         * getVisibleModels() is unavailable.
         */
        const modelQueue =
            this.viewer.impl &&
            typeof this.viewer.impl
                .modelQueue ===
                "function"
                ? this.viewer.impl
                      .modelQueue()
                : null;

        if (
            modelQueue &&
            typeof modelQueue
                .getModels ===
                "function"
        ) {
            const models =
                modelQueue
                    .getModels();

            if (
                Array.isArray(
                    models
                )
            ) {
                return models;
            }
        }

        return this.viewer.model
            ? [this.viewer.model]
            : [];
    }

    /*
     * Keep the old method name for compatibility.
     */
    async addSelection(
        model,
        selectedDbId
    ) {
        return this
            .insertTagForComponent(
                model,
                selectedDbId,
                {
                    source:
                        this.TAG_SOURCE_MANUAL
                }
            );
    }

    /*
     * ==========================================================
     * GENERIC TAG INSERTION API
     * ==========================================================
     *
     * Use this from any future event where you
     * have a model and dbId:
     *
     * await extension.insertTagForComponent(
     *     model,
     *     dbId,
     *     { source: "my-feature" }
     * );
     *
     * This resolves the Part Number and finds all
     * visible instances sharing that Part Number,
     * then delegates to insertTag().
     */
    async insertTagForComponent(
        model,
        selectedDbId,
        {
            source = "external"
        } = {}
    ) {
        if (!model) {
            return null;
        }

        const tree =
            model.getInstanceTree();

        if (!tree) {
            return null;
        }

        /*
         * Only leaf components may generate
         * Part Number tags.
         */
        if (
            tree.getChildCount(
                selectedDbId
            ) !== 0
        ) {
            return null;
        }

        const selectedProperties =
            await this
                .getComponentProperties(
                    model,
                    selectedDbId
                );

        if (
            !selectedProperties ||
            !selectedProperties
                .partNumber
        ) {
            return null;
        }

        const partNumber =
            selectedProperties
                .partNumber
                .trim();

        if (!partNumber) {
            return null;
        }

        const componentName =
            selectedProperties
                .componentName ||
            "(Unnamed component)";

        const key =
            this.makeGroupKey(
                model,
                partNumber
            );

        /*
         * If the tag already exists, add this
         * source as another owner instead of
         * creating a duplicate.
         */
        if (this.groups.has(key)) {
            const existingGroup =
                this.groups.get(
                    key
                );

            existingGroup.sources.add(
                source
            );

            await this
                .refreshGroupInstances(
                    existingGroup
                );

            this.layout();

            return existingGroup;
        }

        /*
         * Find every visible instance with the
         * same Part Number.
         */
        const instances =
            await this
                .findVisibleInstancesByPartNumber(
                    model,
                    partNumber
                );

        if (!instances.length) {
            return null;
        }

        return this.insertTag({
            model,
            partNumber,
            componentName,
            instances,
            source
        });
    }

    /*
     * Lowest-level generic insertion method.
     *
     * This can be used when another feature has
     * already resolved:
     *
     * - model
     * - Part Number
     * - display/component name
     * - geometry instances
     *
     * Example:
     *
     * await extension.insertTag({
     *     model,
     *     partNumber: "ABC-123",
     *     componentName: "Bracket",
     *     instances: [...],
     *     source: "my-feature"
     * });
     */
    async insertTag({
        model,
        partNumber,
        componentName =
            "(Unnamed component)",
        instances = [],
        source = "external"
    } = {}) {
        if (
            !model ||
            !partNumber ||
            !instances.length
        ) {
            return null;
        }

        const normalizedPartNumber =
            String(
                partNumber
            ).trim();

        if (!normalizedPartNumber) {
            return null;
        }

        const key =
            this.makeGroupKey(
                model,
                normalizedPartNumber
            );

        /*
         * A Part Number already shown should not
         * create a second tag.
         *
         * Instead, register the new source and
         * refresh the represented geometry.
         */
        if (this.groups.has(key)) {
            const group =
                this.groups.get(
                    key
                );

            group.sources.add(
                source
            );

            group.componentName =
                componentName ||
                group.componentName;

            this.replaceGroupInstances(
                group,
                instances
            );

            this.layout();

            return group;
        }

        /*
         * Allocate the next currently unused
         * color.
         */
        const colorIndex =
            this.getNextColorIndex();

        const color =
            this.makeColor(
                colorIndex
            );

        const group = {
            key,
            model,

            partNumber:
                normalizedPartNumber,

            componentName,

            instances:
                [...instances],

            colorIndex,
            color,

            labelElement: null,
            lineElements: [],

            /*
             * A tag may be owned by more than one
             * insertion source.
             *
             * This means removing tags created by
             * one button does not accidentally
             * remove the same Part Number tag if
             * another feature is also using it.
             */
            sources:
                new Set([
                    source
                ])
        };

        this.groups.set(
            key,
            group
        );

        this.applyGroupColor(
            group
        );

        this.createGroupUI(
            group
        );

        return group;
    }

    /*
     * Replace an existing group's geometry list
     * while preserving:
     *
     * - group identity
     * - color
     * - label
     * - sources
     */
    replaceGroupInstances(
        group,
        instances
    ) {
        /*
         * Clear old theming.
         */
        for (
            const instance
            of group.instances || []
        ) {
            try {
                instance.model
                    .setThemingColor(
                        instance.dbId,
                        null
                    );
            } catch (_) {
                /*
                 * Model may already have been
                 * unloaded.
                 */
            }
        }

        /*
         * Remove old lines.
         */
        for (
            const line
            of group.lineElements || []
        ) {
            if (line) {
                line.remove();
            }
        }

        group.instances =
            [...instances];

        group.lineElements = [];

        this.applyGroupColor(
            group
        );

        this.createGroupLines(
            group
        );

        this.viewer.impl.invalidate(
            true
        );
    }

    onExplodeChange() {
        /*
         * Tag layout should continue working
         * regardless of which toolbar mode is
         * currently active.
         */
        if (!this.groups.size) {
            return;
        }

        if (this._layoutRequest) {
            return;
        }

        this._layoutRequest =
            requestAnimationFrame(
                () => {
                    this._layoutRequest =
                        null;

                    this.layout();
                }
            );
    }

    getNextColorIndex() {
        /*
         * Collect the color indexes that are
         * currently in use.
         */
        const usedIndices =
            new Set();

        for (
            const group
            of this.groups.values()
        ) {
            if (
                Number.isInteger(
                    group.colorIndex
                )
            ) {
                usedIndices.add(
                    group.colorIndex
                );
            }
        }

        /*
         * Return the first available index.
         *
         * This also means colors can be reused
         * after tags are deleted.
         */
        let index = 0;

        while (
            usedIndices.has(index)
        ) {
            index++;
        }

        return index;
    }

    getComponentProperties(
        model,
        dbId
    ) {
        return new Promise(
            (resolve, reject) => {
                model.getProperties(
                    dbId,

                    (result) => {
                        let partNumber =
                            null;

                        for (
                            const property
                            of result.properties ||
                            []
                        ) {
                            if (
                                property.displayName ===
                                "Part Number"
                            ) {
                                partNumber =
                                    property
                                        .displayValue;

                                break;
                            }
                        }

                        resolve({
                            partNumber:
                                partNumber !==
                                    null &&
                                partNumber !==
                                    undefined
                                    ? String(
                                          partNumber
                                      )
                                    : null,

                            componentName:
                                result.name
                                    ? String(
                                          result.name
                                      )
                                    : null
                        });
                    },

                    reject
                );
            }
        );
    }

    async findVisibleInstancesByPartNumber(
        model,
        targetPartNumber
    ) {
        const leafDbIds =
            await this
                .getVisibleLeafNodes(
                    model
                );

        if (!leafDbIds.length) {
            return [];
        }

        const partNumbers =
            await this
                .getPartNumbers(
                    model,
                    leafDbIds
                );

        const normalizedTarget =
            this.normalizePartNumber(
                targetPartNumber
            );

        const instances = [];

        for (
            const dbId
            of leafDbIds
        ) {
            const value =
                partNumbers.get(
                    dbId
                );

            if (
                value === undefined ||
                value === null
            ) {
                continue;
            }

            if (
                this.normalizePartNumber(
                    value
                ) !== normalizedTarget
            ) {
                continue;
            }

            const box =
                this.getNodeWorldBounds(
                    model,
                    dbId
                );

            if (
                !box ||
                box.isEmpty()
            ) {
                continue;
            }

            /*
             * Only connect to instances currently
             * inside/intersecting the Viewer.
             */
            if (
                !this.isBoxInViewport(
                    box
                )
            ) {
                continue;
            }

            instances.push({
                model,
                dbId,
                box
            });
        }

        return instances;
    }

    async refreshGroupInstances(
        group
    ) {
        /*
         * Remove theming from the old instance
         * collection.
         */
        for (
            const instance
            of group.instances
        ) {
            instance.model
                .setThemingColor(
                    instance.dbId,
                    null
                );
        }

        /*
         * Remove old connector lines.
         */
        for (
            const line
            of group.lineElements
        ) {
            if (line) {
                line.remove();
            }
        }

        group.lineElements = [];

        /*
         * Recalculate visible matching
         * components.
         */
        group.instances =
            await this
                .findVisibleInstancesByPartNumber(
                    group.model,
                    group.partNumber
                );

        /*
         * Reapply THIS group's individual color.
         */
        this.applyGroupColor(
            group
        );

        this.createGroupLines(
            group
        );

        this.viewer.impl.invalidate(
            true
        );
    }

    /*
     * Return visible leaf nodes only.
     *
     * Components hidden through normal visibility
     * handling are excluded.
     *
     * Components ghosted because another branch
     * is isolated are explicitly excluded using
     * aggregate isolation information.
     */
    getVisibleLeafNodes(model) {
        return new Promise(
            (resolve, reject) => {
                model.getObjectTree(
                    (tree) => {
                        const result = [];

                        const rootId =
                            tree.getRootId();

                        const isolatedLeafIds =
                            this.getIsolatedLeafIds(
                                model,
                                tree
                            );

                        tree.enumNodeChildren(
                            rootId,

                            (dbId) => {
                                /*
                                 * Leaf components
                                 * only.
                                 */
                                if (
                                    tree.getChildCount(
                                        dbId
                                    ) !== 0
                                ) {
                                    return;
                                }

                                /*
                                 * When isolation is
                                 * active, objects
                                 * outside the
                                 * isolated branch
                                 * can still be
                                 * rendered ghosted.
                                 *
                                 * They must not
                                 * count as visible
                                 * tag candidates.
                                 */
                                if (
                                    isolatedLeafIds &&
                                    !isolatedLeafIds
                                        .has(
                                            dbId
                                        )
                                ) {
                                    return;
                                }

                                if (
                                    this.isNodeVisible(
                                        model,
                                        dbId
                                    )
                                ) {
                                    result.push(
                                        dbId
                                    );
                                }
                            },

                            true
                        );

                        resolve(
                            result
                        );
                    },

                    reject
                );
            }
        );
    }

    /*
     * If model isolation is active, expand every
     * isolated node into the leaf dbIds below it.
     *
     * Returns:
     *
     *   null
     *       no relevant isolation
     *
     *   Set<dbId>
     *       leaf nodes belonging to the isolated
     *       branch(es)
     */
    getIsolatedLeafIds(
        model,
        tree
    ) {
        if (
            typeof this.viewer
                .getAggregateIsolation !==
            "function"
        ) {
            return null;
        }

        const isolation =
            this.viewer
                .getAggregateIsolation();

        if (
            !Array.isArray(
                isolation
            )
        ) {
            return null;
        }

        const entry =
            isolation.find(
                (item) =>
                    item &&
                    item.model ===
                        model &&
                    Array.isArray(
                        item.ids
                    ) &&
                    item.ids.length
            );

        if (!entry) {
            return null;
        }

        const leafIds =
            new Set();

        for (
            const isolatedDbId
            of entry.ids
        ) {
            if (
                tree.getChildCount(
                    isolatedDbId
                ) === 0
            ) {
                leafIds.add(
                    isolatedDbId
                );

                continue;
            }

            tree.enumNodeChildren(
                isolatedDbId,

                (dbId) => {
                    if (
                        tree.getChildCount(
                            dbId
                        ) === 0
                    ) {
                        leafIds.add(
                            dbId
                        );
                    }
                },

                true
            );
        }

        return leafIds;
    }

    isNodeVisible(
        model,
        dbId
    ) {
        if (
            typeof this.viewer
                .isNodeVisible ===
            "function"
        ) {
            try {
                return this.viewer
                    .isNodeVisible(
                        dbId,
                        model
                    );
            } catch (_) {
                /*
                 * Try fallback below.
                 */
            }
        }

        const visibilityManager =
            this.viewer.impl &&
            this.viewer.impl
                .visibilityManager;

        if (
            visibilityManager &&
            typeof visibilityManager
                .isNodeVisible ===
                "function"
        ) {
            try {
                return visibilityManager
                    .isNodeVisible(
                        dbId,
                        model
                    );
            } catch (_) {
                /*
                 * Fall through.
                 */
            }
        }

        return true;
    }

    /*
     * Bulk-fetch both the Part Number and the
     * component name.
     *
     * This is used by the all-visible action so
     * it does not need to call getProperties()
     * separately for every leaf.
     */
    getComponentMetadata(
        model,
        dbIds
    ) {
        return new Promise(
            (resolve, reject) => {

                const tree =
                    model.getInstanceTree();

                model.getBulkProperties(
                    dbIds,

                    {
                        propFilter: [
                            "Part Number"
                        ]
                    },

                    (results) => {
                        const values =
                            new Map();

                        for (
                            const result
                            of results
                        ) {
                            const property =
                                result.properties
                                    ?.find(
                                        (p) =>
                                            p.displayName ===
                                            "Part Number"
                                    );

                            if (!property) {
                                continue;
                            }

                            /*
                            * getBulkProperties() does
                            * not reliably return
                            * result.name when a
                            * property filter is used.
                            *
                            * The instance tree does.
                            */
                            let componentName =
                                null;

                            if (tree) {
                                try {
                                    componentName =
                                        tree.getNodeName(
                                            result.dbId
                                        );
                                } catch (_) {
                                    // Ignore and use fallback below.
                                }
                            }

                            /*
                            * Keep result.name as a
                            * fallback in case it is
                            * available.
                            */
                            if (!componentName) {
                                componentName =
                                    result.name ||
                                    null;
                            }

                            values.set(
                                result.dbId,

                                {
                                    partNumber:
                                        property
                                            .displayValue !==
                                                null &&
                                        property
                                            .displayValue !==
                                                undefined
                                            ? String(
                                                property
                                                    .displayValue
                                            )
                                            : null,

                                    componentName:
                                        componentName
                                            ? String(
                                                componentName
                                            )
                                            : null
                                }
                            );
                        }

                        resolve(
                            values
                        );
                    },

                    reject
                );
            }
        );
    }

    /*
     * Existing helper retained for the matching
     * algorithm.
     */
    async getPartNumbers(
        model,
        dbIds
    ) {
        const metadata =
            await this
                .getComponentMetadata(
                    model,
                    dbIds
                );

        const values =
            new Map();

        for (
            const [
                dbId,
                item
            ]
            of metadata.entries()
        ) {
            values.set(
                dbId,
                item.partNumber
            );
        }

        return values;
    }

    normalizePartNumber(value) {
        return String(
            value
        )
            .trim()
            .toLocaleLowerCase();
    }

    makeGroupKey(
        model,
        partNumber
    ) {
        const modelKey =
            model.guid ||
            model.id ||
            model.getData()?.urn ||
            "model";

        return (
            String(
                modelKey
            ) +
            "::" +
            this.normalizePartNumber(
                partNumber
            )
        );
    }

    getNodeWorldBounds(
        model,
        dbId
    ) {
        const tree =
            model.getInstanceTree();

        const fragments =
            model.getFragmentList();

        if (
            !tree ||
            !fragments
        ) {
            return null;
        }

        const box =
            new THREE.Box3();

        tree.enumNodeFragments(
            dbId,

            (fragId) => {
                const fragmentBox =
                    new THREE.Box3();

                fragments.getWorldBounds(
                    fragId,
                    fragmentBox
                );

                box.union(
                    fragmentBox
                );
            },

            true
        );

        return box;
    }

    isBoxInViewport(box) {
        const rect =
            this.viewer.container
                .getBoundingClientRect();

        const points =
            this.projectBox(
                box
            );

        if (!points.length) {
            return false;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (
            const point
            of points
        ) {
            if (
                !Number.isFinite(
                    point.x
                ) ||
                !Number.isFinite(
                    point.y
                )
            ) {
                continue;
            }

            minX =
                Math.min(
                    minX,
                    point.x
                );

            maxX =
                Math.max(
                    maxX,
                    point.x
                );

            minY =
                Math.min(
                    minY,
                    point.y
                );

            maxY =
                Math.max(
                    maxY,
                    point.y
                );
        }

        if (
            minX === Infinity ||
            minY === Infinity
        ) {
            return false;
        }

        return (
            maxX >= 0 &&
            minX <= rect.width &&
            maxY >= 0 &&
            minY <= rect.height
        );
    }

    projectBox(box) {
        const min = box.min;
        const max = box.max;

        const corners = [
            new THREE.Vector3(
                min.x,
                min.y,
                min.z
            ),

            new THREE.Vector3(
                max.x,
                min.y,
                min.z
            ),

            new THREE.Vector3(
                min.x,
                max.y,
                min.z
            ),

            new THREE.Vector3(
                max.x,
                max.y,
                min.z
            ),

            new THREE.Vector3(
                min.x,
                min.y,
                max.z
            ),

            new THREE.Vector3(
                max.x,
                min.y,
                max.z
            ),

            new THREE.Vector3(
                min.x,
                max.y,
                max.z
            ),

            new THREE.Vector3(
                max.x,
                max.y,
                max.z
            )
        ];

        return corners.map(
            (point) =>
                this.viewer
                    .worldToClient(
                        point
                    )
        );
    }

    getInstanceAnchor(instance) {
        const {
            model,
            dbId
        } = instance;

        const tree =
            model.getInstanceTree();

        const fragmentList =
            model.getFragmentList();

        if (
            !tree ||
            !fragmentList
        ) {
            return null;
        }

        const currentBox =
            new THREE.Box3();

        let hasFragments =
            false;

        tree.enumNodeFragments(
            dbId,

            (fragId) => {
                const fragmentBox =
                    new THREE.Box3();

                /*
                 * Important:
                 *
                 * getWorldBounds() reflects the
                 * fragment's current rendered
                 * transform, including explode.
                 */
                fragmentList.getWorldBounds(
                    fragId,
                    fragmentBox
                );

                if (
                    !fragmentBox.isEmpty()
                ) {
                    currentBox.union(
                        fragmentBox
                    );

                    hasFragments =
                        true;
                }
            },

            true
        );

        if (!hasFragments) {
            return null;
        }

        const center =
            new THREE.Vector3();

        currentBox.getCenter(
            center
        );

        return center;
    }

    createGroupUI(group) {
        const cssColor =
            this.vectorToCss(
                group.color
            );

        /*
         * Create one tag for this Part Number.
         */
        const label =
            document.createElement(
                "div"
            );

        label.className =
            "part-number-tag";

        /*
         * This CSS variable controls the tag
         * border and Part Number text color.
         */
        label.style.setProperty(
            "--part-number-tag-color",
            cssColor
        );

        /*
         * The overlay ignores pointer events,
         * but the individual tag accepts them.
         */
        label.style.pointerEvents =
            "auto";

        label.style.cursor =
            "pointer";

        /*
         * Clicking a tag removes it and all
         * associated geometry colors/connectors.
         */
        label.addEventListener(
            "click",

            (event) => {
                event.preventDefault();
                event.stopPropagation();

                this.removeGroup(
                    group.key
                );
            }
        );

        const nameElement =
            document.createElement(
                "div"
            );

        nameElement.className =
            "part-number-tag-name";

        nameElement.textContent =
            group.componentName;

        const numberElement =
            document.createElement(
                "div"
            );

        numberElement.className =
            "part-number-tag-number";

        numberElement.textContent =
            group.partNumber;

        label.appendChild(
            nameElement
        );

        label.appendChild(
            numberElement
        );

        this.overlay.appendChild(
            label
        );

        group.labelElement =
            label;

        this.createGroupLines(
            group
        );
    }

    createGroupLines(group) {
        const cssColor =
            this.vectorToCss(
                group.color
            );

        group.lineElements = [];

        for (
            let i = 0;
            i < group.instances.length;
            i++
        ) {
            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "polyline"
                );

            line.classList.add(
                "part-number-tag-line"
            );

            /*
             * Each line uses THIS group's
             * individual tag color.
             */
            line.setAttribute(
                "stroke",
                cssColor
            );

            line.style.pointerEvents =
                "none";

            this.svg.appendChild(
                line
            );

            group.lineElements.push(
                line
            );
        }
    }

    applyGroupColor(group) {
        /*
         * Apply this group's unique color to all
         * geometry instances sharing the same
         * Part Number.
         */
        for (
            const instance
            of group.instances
        ) {
            instance.model
                .setThemingColor(
                    instance.dbId,
                    group.color
                );
        }

        this.viewer.impl.invalidate(
            true
        );
    }

    removeGroup(key) {
        const group =
            this.groups.get(
                key
            );

        if (!group) {
            return;
        }

        /*
         * Remove theming from all geometry
         * belonging to this tag.
         */
        for (
            const instance
            of group.instances
        ) {
            instance.model
                .setThemingColor(
                    instance.dbId,
                    null
                );
        }

        /*
         * Remove all connector lines.
         */
        for (
            const line
            of group.lineElements
        ) {
            if (line) {
                line.remove();
            }
        }

        group.lineElements = [];

        /*
         * Remove the tag.
         */
        if (
            group.labelElement
        ) {
            group.labelElement.remove();

            group.labelElement =
                null;
        }

        this.groups.delete(
            key
        );

        this.viewer.impl.invalidate(
            true
        );

        /*
         * Re-layout the remaining tags.
         */
        this.layout();
    }

    layout() {
        /*
         * Layout is based on whether tags exist,
         * not on which toolbar mode is active.
         */
        if (
            !this.groups.size ||
            !this.svg
        ) {
            return;
        }

        const rect =
            this.viewer.container
                .getBoundingClientRect();

        this.svg.setAttribute(
            "width",
            rect.width
        );

        this.svg.setAttribute(
            "height",
            rect.height
        );

        this.svg.setAttribute(
            "viewBox",
            `0 0 ${rect.width} ${rect.height}`
        );

        const visibleGroups = [];

        for (
            const group
            of this.groups.values()
        ) {
            const projectedInstances =
                [];

            for (
                let i = 0;
                i <
                    group.instances.length;
                i++
            ) {
                const instance =
                    group.instances[i];

                /*
                 * Obtain the line first so we can
                 * hide it even when no world
                 * anchor exists.
                 */
                const line =
                    group.lineElements[i];

                const worldPoint =
                    this.getInstanceAnchor(
                        instance
                    );

                if (!worldPoint) {
                    if (line) {
                        line.style.display =
                            "none";
                    }

                    continue;
                }

                const screenPoint =
                    this.viewer
                        .worldToClient(
                            worldPoint
                        );

                if (
                    !line ||
                    !Number.isFinite(
                        screenPoint.x
                    ) ||
                    !Number.isFinite(
                        screenPoint.y
                    )
                ) {
                    if (line) {
                        line.style.display =
                            "none";
                    }

                    continue;
                }

                line.style.display =
                    "";

                projectedInstances.push({
                    anchor:
                        screenPoint,

                    line
                });
            }

            if (
                !projectedInstances
                    .length
            ) {
                if (
                    group.labelElement
                ) {
                    group.labelElement
                        .style.display =
                        "none";
                }

                continue;
            }

            group.labelElement
                .style.display =
                "";

            /*
             * Use the average position of all
             * instances for tag placement.
             */
            let averageX = 0;
            let averageY = 0;

            for (
                const projected
                of projectedInstances
            ) {
                averageX +=
                    projected
                        .anchor.x;

                averageY +=
                    projected
                        .anchor.y;
            }

            averageX /=
                projectedInstances
                    .length;

            averageY /=
                projectedInstances
                    .length;

            visibleGroups.push({
                group,
                projectedInstances,

                anchor: {
                    x: averageX,
                    y: averageY
                }
            });
        }

        const left = [];
        const right = [];

        for (
            const item
            of visibleGroups
        ) {
            if (
                item.anchor.x <
                rect.width / 2
            ) {
                left.push(
                    item
                );
            } else {
                right.push(
                    item
                );
            }
        }

        /*
         * Sort vertically to reduce crossing
         * connector lines.
         */
        left.sort(
            (a, b) =>
                a.anchor.y -
                b.anchor.y
        );

        right.sort(
            (a, b) =>
                a.anchor.y -
                b.anchor.y
        );

        this.layoutSide(
            left,
            "left",
            rect
        );

        this.layoutSide(
            right,
            "right",
            rect
        );
    }

    layoutSide(
        items,
        side,
        rect
    ) {
        if (!items.length) {
            return;
        }

        const edgePadding =
            8;

        const verticalPadding =
            12;

        const minGap =
            8;

        const heights =
            items.map(
                ({ group }) =>
                    group.labelElement
                        .getBoundingClientRect()
                        .height
            );

        const totalHeight =
            heights.reduce(
                (sum, h) =>
                    sum + h,
                0
            ) +
            Math.max(
                0,
                items.length - 1
            ) *
                minGap;

        if (
            totalHeight <=
            rect.height -
                verticalPadding *
                    2
        ) {
            this.placeNonOverlapping(
                items,
                heights,
                side,
                rect,
                edgePadding,
                verticalPadding,
                minGap
            );
        } else {
            this.placeEvenly(
                items,
                heights,
                side,
                rect,
                edgePadding,
                verticalPadding
            );
        }
    }

    placeNonOverlapping(
        items,
        heights,
        side,
        rect,
        edgePadding,
        verticalPadding,
        minGap
    ) {
        const positions = [];

        let previousBottom =
            verticalPadding;

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            const target =
                items[i].anchor.y -
                heights[i] / 2;

            const y =
                Math.max(
                    verticalPadding,
                    previousBottom,
                    target
                );

            positions[i] = y;

            previousBottom =
                y +
                heights[i] +
                minGap;
        }

        const last =
            positions.length - 1;

        const overflow =
            positions[last] +
            heights[last] +
            verticalPadding -
            rect.height;

        if (overflow > 0) {
            positions[last] -=
                overflow;

            for (
                let i =
                    last - 1;
                i >= 0;
                i--
            ) {
                positions[i] =
                    Math.min(
                        positions[i],

                        positions[
                            i + 1
                        ] -
                            minGap -
                            heights[i]
                    );
            }
        }

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            this.positionGroup(
                items[i],
                positions[i],
                side,
                rect,
                edgePadding
            );
        }
    }

    placeEvenly(
        items,
        heights,
        side,
        rect,
        edgePadding,
        verticalPadding
    ) {
        const available =
            rect.height -
            verticalPadding *
                2;

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            const centerY =
                verticalPadding +
                (
                    (i + 0.5) /
                    items.length
                ) *
                    available;

            const y =
                centerY -
                heights[i] /
                    2;

            this.positionGroup(
                items[i],
                y,
                side,
                rect,
                edgePadding
            );
        }
    }

    positionGroup(
        item,
        y,
        side,
        rect,
        edgePadding
    ) {
        const {
            group,
            projectedInstances
        } = item;

        const label =
            group.labelElement;

        const labelRect =
            label
                .getBoundingClientRect();

        /*
         * Tag sits on the left or right border.
         */
        const x =
            side === "left"
                ? edgePadding
                : rect.width -
                    edgePadding -
                    labelRect.width;

        label.style.transform =
            `translate(${x}px, ${y}px)`;

        /*
         * Connect to the geometry-facing side of
         * the tag.
         */
        const connectionX =
            side === "left"
                ? x +
                    labelRect.width
                : x;

        const connectionY =
            y +
            labelRect.height /
                2;

        const elbowX =
            side === "left"
                ? connectionX +
                    18
                : connectionX -
                    18;

        /*
         * One line per visible geometry instance.
         */
        for (
            const projected
            of projectedInstances
        ) {
            projected.line
                .setAttribute(
                    "points",

                    [
                        `${projected.anchor.x},${projected.anchor.y}`,
                        `${elbowX},${connectionY}`,
                        `${connectionX},${connectionY}`
                    ].join(
                        " "
                    )
                );
        }
    }

    async refreshAllGroups() {
        for (
            const group
            of this.groups.values()
        ) {
            await this
                .refreshGroupInstances(
                    group
                );
        }

        this.layout();
    }

    /*
     * Remove ownership of tags belonging to one
     * particular insertion source.
     *
     * If another source also owns a group, the
     * tag remains visible.
     *
     * Example:
     *
     * this.clearTagsBySource("my-feature");
     */
    clearTagsBySource(source) {
        const keysToRemove =
            [];

        for (
            const [
                key,
                group
            ]
            of this.groups.entries()
        ) {
            if (
                !group.sources ||
                !group.sources.has(
                    source
                )
            ) {
                continue;
            }

            group.sources.delete(
                source
            );

            /*
             * Physically remove the tag only
             * when no feature owns it anymore.
             */
            if (
                !group.sources.size
            ) {
                keysToRemove.push(
                    key
                );
            }
        }

        for (
            const key
            of keysToRemove
        ) {
            this.removeGroup(
                key
            );
        }
    }

    /*
     * Clear every tag, irrespective of the
     * source that created it.
     */
    clearGroups({
        clearTheming = true
    } = {}) {
        for (
            const group
            of this.groups.values()
        ) {
            if (clearTheming) {
                for (
                    const instance
                    of group.instances
                ) {
                    try {
                        if (
                            instance.model &&
                            typeof instance.model
                                .setThemingColor ===
                                "function"
                        ) {
                            instance.model
                                .setThemingColor(
                                    instance.dbId,
                                    null
                                );
                        }
                    } catch (error) {
                        /*
                         * Model already unloaded
                         * or disposed.
                         *
                         * Safe to ignore.
                         */
                    }
                }
            }

            if (
                group.labelElement
            ) {
                group.labelElement
                    .remove();

                group.labelElement =
                    null;
            }

            for (
                const line
                of group.lineElements ||
                    []
            ) {
                if (line) {
                    line.remove();
                }
            }

            group.lineElements =
                [];

            group.instances =
                [];
        }

        this.groups.clear();

        if (clearTheming) {
            try {
                this.viewer
                    ?.impl
                    ?.invalidate(
                        true
                    );
            } catch (_) {
                /*
                 * Viewer may already be tearing
                 * down the model.
                 */
            }
        }
    }

    makeColor(index) {
        /*
         * Golden-angle color generation.
         *
         * Start at blue rather than red so the
         * first annotation is visually different
         * from typical alert/error colors.
         */
        const hue =
            (
                210 +
                index *
                    137.508
            ) %
            360;

        const {
            r,
            g,
            b
        } =
            this.hslToRgb(
                hue / 360,
                0.72,
                0.52
            );

        return new THREE.Vector4(
            r,
            g,
            b,

            /*
             * Alpha used by APS theming.
             */
            0.85
        );
    }

    vectorToCss(color) {
        const r =
            Math.round(
                color.x *
                    255
            );

        const g =
            Math.round(
                color.y *
                    255
            );

        const b =
            Math.round(
                color.z *
                    255
            );

        return `rgb(${r}, ${g}, ${b})`;
    }

    hslToRgb(
        h,
        s,
        l
    ) {
        let r;
        let g;
        let b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb =
                (
                    p,
                    q,
                    t
                ) => {
                    if (t < 0) {
                        t += 1;
                    }

                    if (t > 1) {
                        t -= 1;
                    }

                    if (
                        t <
                        1 / 6
                    ) {
                        return (
                            p +
                            (q - p) *
                                6 *
                                t
                        );
                    }

                    if (
                        t <
                        1 / 2
                    ) {
                        return q;
                    }

                    if (
                        t <
                        2 / 3
                    ) {
                        return (
                            p +
                            (q - p) *
                                (
                                    2 /
                                        3 -
                                    t
                                ) *
                                6
                        );
                    }

                    return p;
                };

            const q =
                l < 0.5
                    ? l *
                        (
                            1 +
                            s
                        )
                    : l +
                        s -
                        l *
                            s;

            const p =
                2 *
                    l -
                q;

            r = hue2rgb(
                p,
                q,
                h +
                    1 / 3
            );

            g = hue2rgb(
                p,
                q,
                h
            );

            b = hue2rgb(
                p,
                q,
                h -
                    1 / 3
            );
        }

        return {
            r,
            g,
            b
        };
    }

    onCameraChange() {
        /*
         * Layout must continue updating for tags
         * created by one-click/external actions
         * even when no toggle mode is active.
         */
        if (!this.groups.size) {
            return;
        }

        if (
            this._layoutRequest
        ) {
            return;
        }

        this._layoutRequest =
            requestAnimationFrame(
                () => {
                    this._layoutRequest =
                        null;

                    this.layout();
                }
            );
    }

    onVisibilityChange() {
        /*
         * Same principle as camera updates:
         * existing tags are independent of the
         * toolbar mode.
         */
        if (!this.groups.size) {
            return;
        }

        if (
            this._visibilityTimer
        ) {
            clearTimeout(
                this._visibilityTimer
            );
        }

        this._visibilityTimer =
            setTimeout(
                async () => {
                    this._visibilityTimer =
                        null;

                    try {
                        await this
                            .refreshAllGroups();
                    } catch (error) {
                        console.error(
                            "PartNumberTags visibility refresh failed:",
                            error
                        );
                    }
                },

                100
            );
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
    "PartNumberTags",
    PartNumberTags
);