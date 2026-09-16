/* ----------------- AI generated code -------------------------- */


class componentsListViews extends Autodesk.Viewing.Extension {

    constructor(viewer, options = {}) {
        super(viewer, options);

        // ---------------------------------------------------------
        // Current mode
        //
        // null
        // "shelf"
        // "teardown"
        // ---------------------------------------------------------

        this.mode = null;

        // ---------------------------------------------------------
        // Toolbar
        // ---------------------------------------------------------

        this.toolbarGroup = null;
        this.shelfButton = null;
        this.teardownButton = null;
        this.labelsVisible = true;
        this.labelsButton = null;

        // ---------------------------------------------------------
        // Overlay
        // ---------------------------------------------------------

        this.overlayName = "shelf-view-overlay";
        this.overlayMeshes = [];

        // ---------------------------------------------------------
        // HTML labels
        // ---------------------------------------------------------

        this.labelLayer = null;
        this.labels = [];

        // ---------------------------------------------------------
        // Source assembly/session
        // ---------------------------------------------------------

        this.originalViewerState = null;
        this.sourceLeafDbIds = [];

        this.items = [];
        this.groups = [];

        this.sessionPrepared = false;

        // ---------------------------------------------------------
        // Current layout
        // ---------------------------------------------------------

        this.layoutBounds = null;

        // ---------------------------------------------------------
        // Event handlers
        // ---------------------------------------------------------

        this.onCameraChanged =
            this.onCameraChanged.bind(this);

        this.onWindowResize =
            this.onWindowResize.bind(this);

        // ---------------------------------------------------------
        // Options
        // ---------------------------------------------------------

        this.options = {

            // =====================================================
            // Properties
            // =====================================================

            partNumberProperty:
                options.partNumberProperty ?? "Part Number",

            componentNameProperty:
                options.componentNameProperty ?? "Name",

            propertyBatchSize:
                options.propertyBatchSize ?? 300,


            // =====================================================
            // General viewer behavior
            // =====================================================

            hideOriginalModel:
                options.hideOriginalModel ?? true,

            switchToOrthographic:
                options.switchToOrthographic ?? true,


            // =====================================================
            // Shelf View
            // =====================================================

            shelfColumns:
                options.shelfColumns ?? null,

            shelfCellSize:
                options.shelfCellSize ?? null,

            shelfCellGap:
                options.shelfCellGap ?? 0.25,

            shelfGeometryFill:
                options.shelfGeometryFill ?? 0.62,


            // =====================================================
            // Teardown View
            // =====================================================

            /*
             * Maximum number of occurrences of the same component
             * before wrapping to another row.
             */
            teardownMaxOccurrencesPerRow:
                options.teardownMaxOccurrencesPerRow ?? 8,

           
            /*
             * For repeated components, use the representative
             * geometry for every occurrence.
             *
             * This means all repeated components have exactly the
             * same orientation, like a physical teardown board.
             *
             * The individual occurrence dbId is still retained.
             */
            teardownUseRepresentativeGeometry:
                options.teardownUseRepresentativeGeometry ?? true
        };
    }


    // =============================================================
    // Extension lifecycle
    // =============================================================

    load() {

        this.injectStyles();

        if (this.viewer.toolbar) {

            this.createToolbar();

        } else {

            this.onToolbarCreated = () => {
                this.createToolbar();
            };

            this.viewer.addEventListener(
                Autodesk.Viewing.TOOLBAR_CREATED_EVENT,
                this.onToolbarCreated
            );
        }

        this.viewer.addEventListener(
            Autodesk.Viewing.CAMERA_CHANGE_EVENT,
            this.onCameraChanged
        );

        window.addEventListener(
            "resize",
            this.onWindowResize
        );

        console.log("componentsListViews loaded");

        return true;
    }


    unload() {

        if (this.mode) {
            this.exitPresentationMode();
        }

        this.viewer.removeEventListener(
            Autodesk.Viewing.CAMERA_CHANGE_EVENT,
            this.onCameraChanged
        );

        window.removeEventListener(
            "resize",
            this.onWindowResize
        );

        if (this.onToolbarCreated) {

            this.viewer.removeEventListener(
                Autodesk.Viewing.TOOLBAR_CREATED_EVENT,
                this.onToolbarCreated
            );
        }

        if (this.toolbarGroup) {

            if (this.shelfButton) {
                this.toolbarGroup.removeControl(
                    this.shelfButton
                );
            }

            if (this.teardownButton) {
                this.toolbarGroup.removeControl(
                    this.teardownButton
                );
            }

            if (this.labelsButton) {
                this.toolbarGroup.removeControl(
                    this.labelsButton
                );
            }

        }

        this.removeLabels();
        this.removeOverlayGeometry();

        return true;
    }


    // =============================================================
    // Toolbar
    // =============================================================

    createToolbar() {

        if (
            this.shelfButton ||
            this.teardownButton
        ) {
            return;
        }

        let group =
            this.viewer.toolbar.getControl(
                "components-list-views-toolbar"
            );

        if (!group) {

            group =
                new Autodesk.Viewing.UI.ControlGroup(
                    "components-list-views-toolbar"
                );

            this.viewer.toolbar.addControl(
                group
            );
        }


        // ---------------------------------------------------------
        // Shelf View button
        // ---------------------------------------------------------

        const shelfButton =
            new Autodesk.Viewing.UI.Button(
                "shelf-view-button"
            );

        shelfButton.setToolTip(
            "Shelf View"
        );

        shelfButton.container.classList.add(
            "icon", "components-list-views-button", "shelf-view"
        );

        shelfButton.onClick = async () => {

            try {

                if (this.mode === "shelf") {

                    await this.exitPresentationMode();

                } else {

                    await this.activateMode(
                        "shelf"
                    );
                }

            } catch (error) {

                console.error(
                    "Shelf View error:",
                    error
                );
            }
        };


        // ---------------------------------------------------------
        // Teardown View button
        // ---------------------------------------------------------

        const teardownButton =
            new Autodesk.Viewing.UI.Button(
                "teardown-view-button"
            );

        teardownButton.setToolTip(
            "Teardown View"
        );

        teardownButton.container.classList.add(
            "icon", "components-list-views-button", "tear-down"
        );

        teardownButton.onClick = async () => {

            try {

                if (this.mode === "teardown") {

                    await this.exitPresentationMode();

                } else {

                    await this.activateMode(
                        "teardown"
                    );
                }

            } catch (error) {

                console.error(
                    "Teardown View error:",
                    error
                );
            }
        };



        // ---------------------------------------------------------
        // Labels toggle button
        // ---------------------------------------------------------

        const labelsButton =
            new Autodesk.Viewing.UI.Button(
                "review-labels-button"
            );

        labelsButton.setToolTip(
            "Toggle Labels"
        );

        labelsButton.container.classList.add(
            "icon", "components-list-views-button", "toggle-labels"
        );        

        labelsButton.onClick = () => {

            if (!this.mode) {
                return;
            }

            this.labelsVisible =
                !this.labelsVisible;

            this.updateLabelVisibility();

            this.updateButtonStates();
        };        


        group.addControl(
            shelfButton
        );

        group.addControl(
            teardownButton
        );

        group.addControl(
          labelsButton
        );

        this.toolbarGroup =
            group;

        this.shelfButton =
            shelfButton;

        this.teardownButton =
            teardownButton;

        this.labelsButton =
            labelsButton;            

        this.updateButtonStates();
    }


    updateButtonStates() {

        if (this.shelfButton) {

            this.shelfButton.setState(

                this.mode === "shelf"

                    ? Autodesk.Viewing.UI.Button.State.ACTIVE

                    : Autodesk.Viewing.UI.Button.State.INACTIVE
            );
        }

        if (this.teardownButton) {

            this.teardownButton.setState(

                this.mode === "teardown"

                    ? Autodesk.Viewing.UI.Button.State.ACTIVE

                    : Autodesk.Viewing.UI.Button.State.INACTIVE
            );
        }

        if (this.labelsButton) {

            if (!this.mode) {

                this.labelsButton.setState(
                    Autodesk.Viewing.UI.Button.State.DISABLED
                );

            } else {

                this.labelsButton.setState(

                    this.labelsVisible

                        ? Autodesk.Viewing.UI.Button.State.ACTIVE

                        : Autodesk.Viewing.UI.Button.State.INACTIVE
                );
            }
        }

    }


    // =============================================================
    // Activate Shelf or Teardown
    // =============================================================

    async activateMode(mode) {

        if (
            mode !== "shelf" &&
            mode !== "teardown"
        ) {
            return;
        }

        const model =
            this.viewer.model;

        if (!model) {
            return;
        }

        console.time(
            `componentsListViews-${mode}`
        );

        try {

            const firstActivation =
                !this.sessionPrepared;


            // -----------------------------------------------------
            // Prepare source-data session once
            // -----------------------------------------------------

            if (firstActivation) {

                await this.prepareSession(
                    model
                );
            }


            // -----------------------------------------------------
            // Remove previous presentation
            // -----------------------------------------------------

            this.removeLabels();

            this.removeOverlayGeometry();


            // -----------------------------------------------------
            // Build selected layout
            // -----------------------------------------------------

            if (mode === "shelf") {

                this.calculateShelfLayout(
                    this.groups
                );

            } else {

                this.calculateTeardownLayout(
                    this.groups
                );
            }


            // -----------------------------------------------------
            // Build independent proxy geometry
            //
            // Do this before switching the source model off during
            // the initial activation.
            // -----------------------------------------------------

            this.createPresentationGeometry(
                model,
                this.groups
            );


            // -----------------------------------------------------
            // Completely hide source assembly
            // -----------------------------------------------------

            if (
                firstActivation &&
                this.options.hideOriginalModel
            ) {

                this.setSourceModelOff(
                    true
                );
            }


            // -----------------------------------------------------
            // Labels
            // -----------------------------------------------------

            this.createLabels(
                this.groups,
                mode
            );


            this.mode =
                mode;


            this.updateButtonStates();


            // -----------------------------------------------------
            // Camera
            // -----------------------------------------------------

            this.frameCurrentLayout();


            this.viewer.impl.sceneUpdated(
                true
            );

            this.viewer.impl.invalidate(
                true,
                true,
                true
            );

            this.updateLabels();

        } finally {

            console.timeEnd(
                `componentsListViews-${mode}`
            );
        }
    }


    // =============================================================
    // Prepare source session
    // =============================================================

    async prepareSession(model) {

        /*
         * Store complete original viewer state.
         */
        this.originalViewerState =
            this.viewer.getState();


        // ---------------------------------------------------------
        // All leaves needed for hard-hide
        // ---------------------------------------------------------

        this.sourceLeafDbIds =
            await this.getAllLeafNodeIds(
                model
            );


        // ---------------------------------------------------------
        // Only currently visible leaves participate in review view
        // ---------------------------------------------------------

        const visibleLeaves =
            await this.getVisibleLeafNodes(
                model
            );


        if (!visibleLeaves.length) {

            throw new Error(
                "No visible leaf components found."
            );
        }


        // ---------------------------------------------------------
        // Metadata
        // ---------------------------------------------------------

        this.items =
            await this.buildItems(
                model,
                visibleLeaves
            );


        this.groups =
            this.groupItems(
                this.items
            );


        console.log(
            "Review View:",
            visibleLeaves.length,
            "occurrences,",
            this.groups.length,
            "unique component groups"
        );


        this.sessionPrepared =
            true;
    }


    // =============================================================
    // Toggle label-layer visibility
    // =============================================================

    updateLabelVisibility() {

        if (!this.labelLayer) {
            return;
        }

        this.labelLayer.style.display =
            this.labelsVisible
                ? "block"
                : "none";
    }    


    // =============================================================
    // Exit Shelf/Teardown
    // =============================================================

    async exitPresentationMode() {

        const model =
            this.viewer.model;


        this.removeLabels();

        this.removeOverlayGeometry();


        // ---------------------------------------------------------
        // Re-enable hard-disabled source nodes
        // ---------------------------------------------------------

        if (
            model &&
            this.sourceLeafDbIds.length
        ) {

            this.setSourceModelOff(
                false
            );
        }


        // ---------------------------------------------------------
        // Restore original Viewer state
        // ---------------------------------------------------------

        if (
            this.originalViewerState
        ) {

            this.viewer.restoreState(
                this.originalViewerState,
                null,
                true
            );
        }


        // ---------------------------------------------------------
        // Clear session
        // ---------------------------------------------------------

        this.mode =
            null;

        this.labelsVisible = true;            

        this.originalViewerState =
            null;

        this.sourceLeafDbIds =
            [];

        this.items =
            [];

        this.groups =
            [];

        this.layoutBounds =
            null;

        this.sessionPrepared =
            false;


        this.updateButtonStates();


        this.viewer.impl.sceneUpdated(
            true
        );

        this.viewer.impl.invalidate(
            true,
            true,
            true
        );
    }


    // =============================================================
    // Completely switch source assembly off/on
    // =============================================================

    setSourceModelOff(off) {

        const visibilityManager =
            this.viewer.impl.visibilityManager;


        if (
            !visibilityManager ||
            typeof visibilityManager.setNodeOff !==
                "function"
        ) {

            console.warn(
                "visibilityManager.setNodeOff is unavailable."
            );

            return;
        }


        for (
            const dbId
            of this.sourceLeafDbIds
        ) {

            visibilityManager.setNodeOff(
                dbId,
                off
            );
        }


        this.viewer.impl.sceneUpdated(
            true
        );

        this.viewer.impl.invalidate(
            true,
            true,
            true
        );
    }


    // =============================================================
    // All leaf dbIds
    // =============================================================

    async getAllLeafNodeIds(model) {

        const tree =
            await new Promise(
                (resolve, reject) => {

                    model.getObjectTree(
                        resolve,
                        reject
                    );
                }
            );


        const result = [];


        tree.enumNodeChildren(

            tree.getRootId(),

            dbId => {

                if (
                    tree.getChildCount(
                        dbId
                    ) === 0
                ) {

                    result.push(
                        dbId
                    );
                }
            },

            true
        );


        return result;
    }


    // =============================================================
    // Visible leaf components
    // =============================================================

    async getVisibleLeafNodes(model) {

        const tree =
            await new Promise(
                (resolve, reject) => {

                    model.getObjectTree(
                        resolve,
                        reject
                    );
                }
            );


        const result = [];


        tree.enumNodeChildren(

            tree.getRootId(),

            dbId => {

                if (
                    tree.getChildCount(
                        dbId
                    ) !== 0
                ) {
                    return;
                }


                if (
                    !this.viewer.isNodeVisible(
                        dbId
                    )
                ) {
                    return;
                }


                const fragIds =
                    [];


                tree.enumNodeFragments(

                    dbId,

                    fragId => {

                        fragIds.push(
                            fragId
                        );
                    },

                    false
                );


                if (
                    fragIds.length
                ) {

                    result.push({

                        dbId,

                        fragIds
                    });
                }
            },

            true
        );


        return result;
    }


    // =============================================================
    // Build occurrence data
    // =============================================================

    async buildItems(
        model,
        leaves
    ) {

        const dbIds =
            leaves.map(
                leaf => leaf.dbId
            );


        const propertyResults =
            await this.getBulkProperties(

                model,

                dbIds,

                [
                    this.options.partNumberProperty,
                    this.options.componentNameProperty
                ]
            );


        const propertyMap =
            new Map();


        for (
            const result
            of propertyResults
        ) {

            propertyMap.set(
                result.dbId,
                result
            );
        }


        const items = [];


        for (
            const leaf
            of leaves
        ) {

            const result =
                propertyMap.get(
                    leaf.dbId
                );


            const partNumber =
                String(

                    this.getPropertyValue(
                        result,
                        this.options.partNumberProperty
                    ) ?? ""

                ).trim();


            const componentName =
                String(

                    this.getPropertyValue(
                        result,
                        this.options.componentNameProperty
                    ) ??

                    result?.name ??

                    `Component ${leaf.dbId}`

                ).trim();


            const bounds =
                this.getNodeBoundingBox(
                    model,
                    leaf.fragIds
                );


            if (
                !bounds ||
                bounds.isEmpty()
            ) {
                continue;
            }


            const size =
                bounds.getSize(
                    new THREE.Vector3()
                );


            const center =
                bounds.getCenter(
                    new THREE.Vector3()
                );


            items.push({

                dbId:
                    leaf.dbId,

                fragIds:
                    leaf.fragIds,

                partNumber,

                componentName,

                bounds:
                    bounds.clone(),

                size:
                    size.clone(),

                center:
                    center.clone(),

                volume:
                    Math.abs(
                        size.x *
                        size.y *
                        size.z
                    )
            });
        }


        return items;
    }


    // =============================================================
    // Group by Part Number
    // =============================================================

    groupItems(items) {

        const map =
            new Map();


        for (
            const item
            of items
        ) {

            const key =
                item.partNumber

                    ? `PN::${item.partNumber}`

                    : `DBID::${item.dbId}`;


            let group =
                map.get(
                    key
                );


            if (!group) {

                group = {

                    key,

                    partNumber:
                        item.partNumber,

                    componentName:
                        item.componentName,

                    quantity:
                        0,

                    dbIds:
                        [],

                    items:
                        [],

                    representative:
                        item,

                    placements:
                        [],

                    labelAnchor:
                        null
                };


                map.set(
                    key,
                    group
                );
            }


            group.quantity++;

            group.dbIds.push(
                item.dbId
            );

            group.items.push(
                item
            );
        }


        const groups =
            Array.from(
                map.values()
            );


        /*
         * BOM-like ordering.
         */
        groups.sort(
            (a, b) => {

                const aValue =
                    a.partNumber ||
                    a.componentName;

                const bValue =
                    b.partNumber ||
                    b.componentName;


                return String(aValue).localeCompare(

                    String(bValue),

                    undefined,

                    {
                        numeric:
                            true,

                        sensitivity:
                            "base"
                    }
                );
            }
        );


        return groups;
    }


    // =============================================================
    // Common median source component size
    // =============================================================

    getMedianComponentSize(
        groups
    ) {

        const dimensions =
            groups

                .map(
                    group => {

                        const size =
                            group.representative.size;


                        return Math.max(

                            size.x,

                            size.y,

                            size.z
                        );
                    }
                )

                .filter(
                    value =>

                        Number.isFinite(
                            value
                        ) &&

                        value > 0
                )

                .sort(
                    (a, b) =>
                        a - b
                );


        if (!dimensions.length) {
            return 100;
        }


        return dimensions[
            Math.floor(
                dimensions.length / 2
            )
        ];
    }


    // =============================================================
    // SHELF VIEW
    //
    // One representative per unique component.
    // =============================================================

    calculateShelfLayout(
        groups
    ) {

        const median =
            this.getMedianComponentSize(
                groups
            );


        const cellSize =
            this.options.shelfCellSize ??
            median * 1.8;


        const geometryExtent =
            cellSize *
            this.options.shelfGeometryFill;


        const columns =
            this.options.shelfColumns ??

            Math.max(

                1,

                Math.ceil(
                    Math.sqrt(
                        groups.length *
                        1.5
                    )
                )
            );


        const rows =
            Math.ceil(
                groups.length /
                columns
            );


        const pitch =
            cellSize *
            (
                1 +
                this.options.shelfCellGap
            );


        const totalWidth =
            columns *
            pitch;


        const totalHeight =
            rows *
            pitch;


        const originX =
            -totalWidth / 2 +
            pitch / 2;


        const originY =
            totalHeight / 2 -
            pitch / 2;


        const bounds =
            new THREE.Box3();


        bounds.makeEmpty();


        groups.forEach(
            (group, index) => {

                group.placements =
                    [];


                const column =
                    index %
                    columns;


                const row =
                    Math.floor(
                        index /
                        columns
                    );


                const x =
                    originX +
                    column *
                    pitch;


                const y =
                    originY -
                    row *
                    pitch;


                const representative =
                    group.representative;


                const maxDimension =
                    Math.max(

                        representative.size.x,

                        representative.size.y,

                        representative.size.z,

                        0.000001
                    );


                const scale =
                    geometryExtent /
                    maxDimension;


                const geometryCenter =
                    new THREE.Vector3(

                        x,

                        y +
                        cellSize *
                        0.08,

                        0
                    );


                group.placements.push({

                    sourceItem:
                        representative,

                    sourceDbId:
                        representative.dbId,

                    targetCenter:
                        geometryCenter,

                    scale
                });


                group.labelAnchor =
                    new THREE.Vector3(

                        x,

                        y -
                        cellSize *
                        0.35,

                        0
                    );


                const half =
                    cellSize / 2;


                bounds.expandByPoint(

                    new THREE.Vector3(

                        x - half,

                        y - half,

                        -geometryExtent / 2
                    )
                );


                bounds.expandByPoint(

                    new THREE.Vector3(

                        x + half,

                        y + half,

                        geometryExtent / 2
                    )
                );
            }
        );


        this.layoutBounds =
            bounds;
    }


    // =============================================================
    // TEARDOWN VIEW
    //
    // Every occurrence shown.
    // Same PN occurrences are placed next to each other.
    // Component groups are then packed across a 2D teardown board.
    // =============================================================

    calculateTeardownLayout(groups) {

        // ============================================================
        // 1. Sort groups by ACTUAL component size, descending
        //
        // "Size" here means the largest bounding-box dimension.
        // ============================================================

        const sortedGroups =
            [...groups].sort(
                (a, b) => {

                    const aSize =
                        Math.max(
                            a.representative.size.x,
                            a.representative.size.y,
                            a.representative.size.z
                        );

                    const bSize =
                        Math.max(
                            b.representative.size.x,
                            b.representative.size.y,
                            b.representative.size.z
                        );

                    return bSize - aSize;
                }
            );


        /*
        * Preserve this order for labels / rendering as well.
        */
        groups.length = 0;

        groups.push(
            ...sortedGroups
        );


        // ============================================================
        // 2. Determine a few global reference dimensions
        // ============================================================

        const maxDimensions =
            groups
                .map(
                    group =>
                        Math.max(
                            group.representative.size.x,
                            group.representative.size.y,
                            group.representative.size.z
                        )
                )
                .filter(
                    value =>
                        Number.isFinite(value) &&
                        value > 0
                )
                .sort(
                    (a, b) =>
                        a - b
                );


        const medianDimension =
            maxDimensions.length
                ? maxDimensions[
                    Math.floor(
                        maxDimensions.length / 2
                    )
                ]
                : 1;


        /*
        * Small absolute floor so tiny/zero-size geometry does not
        * collapse onto itself.
        */
        const minimumGap =
            medianDimension * 0.025;


        // ============================================================
        // 3. Build a physical-size block for each PN group
        // ============================================================

        const blocks = [];


        for (
            const group
            of groups
        ) {

            const representative =
                group.representative;


            /*
            * IMPORTANT:
            *
            * No visual normalization.
            * These are the actual world-space component dimensions.
            */
            const itemWidth =
                Math.max(
                    representative.size.x,
                    0.000001
                );


            const itemHeight =
                Math.max(
                    representative.size.y,
                    0.000001
                );


            const itemDepth =
                Math.max(
                    representative.size.z,
                    0.000001
                );


            const largestDimension =
                Math.max(
                    itemWidth,
                    itemHeight,
                    itemDepth
                );


            const smallestPlanarDimension =
                Math.max(
                    Math.min(
                        itemWidth,
                        itemHeight
                    ),
                    0.000001
                );


            // ========================================================
            // Dynamic spacing
            //
            // Small component -> small gap
            // Large component -> larger gap
            // ========================================================

            const occurrenceGap =
                Math.max(
                    minimumGap,
                    smallestPlanarDimension * 0.22
                );


            /*
            * Different component groups need a little more
            * separation than occurrences of the same component.
            */
            const groupGap =
                Math.max(
                    minimumGap * 3,
                    largestDimension * 0.28
                );


            const maxPerRow =
                Math.max(
                    1,
                    this.options.teardownMaxOccurrencesPerRow
                );


            const columns =
                Math.min(
                    group.quantity,
                    maxPerRow
                );


            const rows =
                Math.ceil(
                    group.quantity /
                    columns
                );


            /*
            * Actual group width/height.
            *
            * Notice that gaps are added BETWEEN components only.
            */
            const geometryWidth =
                columns * itemWidth +
                Math.max(
                    0,
                    columns - 1
                ) * occurrenceGap;


            const geometryHeight =
                rows * itemHeight +
                Math.max(
                    0,
                    rows - 1
                ) * occurrenceGap;


            /*
            * Reserve metadata band underneath.
            *
            * Scale this relative to the component instead of using
            * one fixed world-space value.
            */
            const labelBand =
                Math.max(
                    largestDimension * 0.35,
                    medianDimension * 0.18
                );


            blocks.push({

                group,

                itemWidth,
                itemHeight,
                itemDepth,

                largestDimension,

                occurrenceGap,
                groupGap,

                columns,
                rows,

                geometryWidth,
                geometryHeight,

                labelBand,

                blockWidth:
                    geometryWidth,

                blockHeight:
                    geometryHeight +
                    labelBand
            });
        }


        // ============================================================
        // 4. Estimate board width
        //
        // Because we preserve true component scale, block sizes vary
        // significantly. Use total area to estimate a landscape board.
        // ============================================================

        const totalArea =
            blocks.reduce(
                (sum, block) => {

                    return (
                        sum +
                        (
                            block.blockWidth +
                            block.groupGap
                        ) *
                        (
                            block.blockHeight +
                            block.groupGap
                        )
                    );
                },
                0
            );


        const largestBlockWidth =
            blocks.reduce(
                (maxValue, block) =>
                    Math.max(
                        maxValue,
                        block.blockWidth
                    ),
                0
            );


        const targetBoardWidth =
            Math.max(

                largestBlockWidth,

                Math.sqrt(
                    totalArea * 1.6
                )
            );


        // ============================================================
        // 5. Pack groups row-by-row
        // ============================================================

        let cursorX = 0;
        let cursorY = 0;

        let currentRowHeight = 0;


        const preliminaryBounds =
            new THREE.Box3();


        preliminaryBounds.makeEmpty();


        for (
            const block
            of blocks
        ) {

            const group =
                block.group;


            // --------------------------------------------------------
            // Wrap group to next teardown-board row
            // --------------------------------------------------------

            if (
                cursorX > 0 &&
                cursorX +
                    block.blockWidth >
                    targetBoardWidth
            ) {

                /*
                * Use the gap of the next component block.
                *
                * This keeps small-part rows relatively compact.
                */
                cursorX =
                    0;


                cursorY -=
                    currentRowHeight +
                    block.groupGap;


                currentRowHeight =
                    0;
            }


            const blockLeft =
                cursorX;


            const blockTop =
                cursorY;


            group.placements =
                [];


            // ========================================================
            // 6. Place EVERY occurrence at scale = 1
            // ========================================================

            group.items.forEach(
                (item, index) => {

                    const column =
                        index %
                        block.columns;


                    const row =
                        Math.floor(
                            index /
                            block.columns
                        );


                    /*
                    * Position by the component's actual width/height.
                    */
                    const x =
                        blockLeft +
                        block.itemWidth / 2 +
                        column *
                        (
                            block.itemWidth +
                            block.occurrenceGap
                        );


                    const y =
                        blockTop -
                        block.itemHeight / 2 -
                        row *
                        (
                            block.itemHeight +
                            block.occurrenceGap
                        );


                    /*
                    * Recommended:
                    *
                    * reuse representative geometry so every repeated
                    * occurrence has identical visual orientation.
                    *
                    * Set teardownUseRepresentativeGeometry:false if
                    * you prefer every actual occurrence's transform.
                    */
                    const sourceItem =
                        this.options
                            .teardownUseRepresentativeGeometry

                            ? group.representative

                            : item;


                    group.placements.push({

                        sourceItem,

                        sourceDbId:
                            item.dbId,

                        targetCenter:
                            new THREE.Vector3(
                                x,
                                y,
                                0
                            ),

                        /*
                        * CRITICAL CHANGE:
                        *
                        * Preserve actual component dimensions.
                        */
                        scale:
                            1
                    });
                }
            );


            // ========================================================
            // 7. Component metadata below the entire group
            // ========================================================

            group.labelAnchor =
                new THREE.Vector3(

                    blockLeft +
                        block.geometryWidth / 2,

                    blockTop -
                        block.geometryHeight -
                        block.labelBand * 0.55,

                    0
                );


            // ========================================================
            // 8. Block bounds
            // ========================================================

            preliminaryBounds.expandByPoint(

                new THREE.Vector3(

                    blockLeft,

                    blockTop -
                        block.blockHeight,

                    -block.itemDepth / 2
                )
            );


            preliminaryBounds.expandByPoint(

                new THREE.Vector3(

                    blockLeft +
                        block.blockWidth,

                    blockTop,

                    block.itemDepth / 2
                )
            );


            // ========================================================
            // 9. Advance X using DYNAMIC group gap
            // ========================================================

            cursorX +=
                block.blockWidth +
                block.groupGap;


            currentRowHeight =
                Math.max(
                    currentRowHeight,
                    block.blockHeight
                );
        }


        // ============================================================
        // 10. Center entire board around world origin
        // ============================================================

        const boardCenter =
            preliminaryBounds.getCenter(
                new THREE.Vector3()
            );


        const offset =
            new THREE.Vector3(

                -boardCenter.x,

                -boardCenter.y,

                -boardCenter.z
            );


        const finalBounds =
            new THREE.Box3();


        finalBounds.makeEmpty();


        for (
            const block
            of blocks
        ) {

            const group =
                block.group;


            for (
                const placement
                of group.placements
            ) {

                placement.targetCenter.add(
                    offset
                );


                /*
                * Bounds use REAL component dimensions.
                */
                finalBounds.expandByPoint(

                    new THREE.Vector3(

                        placement.targetCenter.x -
                            block.itemWidth / 2,

                        placement.targetCenter.y -
                            block.itemHeight / 2,

                        -block.itemDepth / 2
                    )
                );


                finalBounds.expandByPoint(

                    new THREE.Vector3(

                        placement.targetCenter.x +
                            block.itemWidth / 2,

                        placement.targetCenter.y +
                            block.itemHeight / 2,

                        block.itemDepth / 2
                    )
                );
            }


            group.labelAnchor.add(
                offset
            );


            finalBounds.expandByPoint(
                group.labelAnchor
            );
        }


        this.layoutBounds =
            finalBounds;
    }


    // =============================================================
    // Create presentation proxy geometry
    // =============================================================

    createPresentationGeometry(
        model,
        groups
    ) {

        this.removeOverlayGeometry();


        this.viewer.impl.createOverlayScene(
            this.overlayName
        );


        for (
            const group
            of groups
        ) {

            for (
                const placement
                of group.placements
            ) {

                this.createProxyMeshes(

                    model,

                    placement.sourceItem,

                    placement.targetCenter,

                    placement.scale,

                    {
                        groupKey:
                            group.key,

                        sourceDbId:
                            placement.sourceDbId,

                        sourceDbIds:
                            group.dbIds
                    }
                );
            }
        }


        this.viewer.impl.invalidate(
            true,
            true,
            true
        );
    }


    // =============================================================
    // Clone one source component into presentation overlay
    // =============================================================

    createProxyMeshes(
        model,
        item,
        targetCenter,
        scaleFactor,
        metadata
    ) {

        // ---------------------------------------------------------
        // Source world component center -> origin
        // ---------------------------------------------------------

        const moveToOrigin =
            new THREE.Matrix4();


        moveToOrigin.makeTranslation(

            -item.center.x,

            -item.center.y,

            -item.center.z
        );


        // ---------------------------------------------------------
        // Scale
        // ---------------------------------------------------------

        const scale =
            new THREE.Matrix4();


        scale.makeScale(

            scaleFactor,

            scaleFactor,

            scaleFactor
        );


        // ---------------------------------------------------------
        // Origin -> target presentation position
        // ---------------------------------------------------------

        const moveToTarget =
            new THREE.Matrix4();


        moveToTarget.makeTranslation(

            targetCenter.x,

            targetCenter.y,

            targetCenter.z
        );


        /*
         * Presentation transform:
         *
         * T(target)
         * × S(scale)
         * × T(-componentCenter)
         */
        const normalized =
            new THREE.Matrix4();


        normalized.multiplyMatrices(

            scale,

            moveToOrigin
        );


        const presentationTransform =
            new THREE.Matrix4();


        presentationTransform.multiplyMatrices(

            moveToTarget,

            normalized
        );


        // ---------------------------------------------------------
        // Clone each fragment
        // ---------------------------------------------------------

        for (
            const fragId
            of item.fragIds
        ) {

            const source =
                this.viewer.impl.getRenderProxy(

                    model,

                    fragId
                );


            if (
                !source ||
                !source.geometry ||
                !source.material
            ) {
                continue;
            }


            /*
             * Never modify the Viewer-owned render proxy itself.
             */
            const mesh =
                new THREE.Mesh(

                    source.geometry,

                    source.material
                );


            const finalMatrix =
                new THREE.Matrix4();


            finalMatrix.multiplyMatrices(

                presentationTransform,

                source.matrixWorld
            );


            mesh.matrixAutoUpdate =
                false;


            mesh.matrix.copy(
                finalMatrix
            );


            mesh.matrixWorld.copy(
                finalMatrix
            );


            mesh.matrixWorldNeedsUpdate =
                true;


            mesh.userData = {

                reviewGroupKey:
                    metadata.groupKey,

                sourceDbId:
                    metadata.sourceDbId,

                sourceDbIds:
                    metadata.sourceDbIds
            };


            this.viewer.impl.addOverlay(

                this.overlayName,

                mesh
            );


            this.overlayMeshes.push(
                mesh
            );
        }
    }


    // =============================================================
    // Remove presentation proxy geometry
    // =============================================================

    removeOverlayGeometry() {

        if (
            this.viewer.impl &&
            typeof this.viewer.impl.removeOverlayScene ===
                "function"
        ) {

            try {

                this.viewer.impl.removeOverlayScene(
                    this.overlayName
                );

            } catch (error) {

                // Overlay may not exist yet.
            }
        }


        /*
         * Geometry and materials are Viewer-owned and reused.
         * Do not dispose them here.
         */
        this.overlayMeshes =
            [];
    }


    // =============================================================
    // Labels
    // =============================================================

    createLabels(
        groups,
        mode
    ) {

        this.removeLabels();


        const layer =
            document.createElement(
                "div"
            );


        layer.className =
            "assembly-review-label-layer";


        this.viewer.container.appendChild(
            layer
        );


        this.labelLayer =
            layer;


        // ---------------------------------------------------------
        // Mode badge
        // ---------------------------------------------------------

        const badge =
            document.createElement(
                "div"
            );


        badge.className =
            "assembly-review-mode-badge";


        badge.textContent =
            mode === "teardown"

                ? "TEARDOWN VIEW"

                : "SHELF VIEW";


        layer.appendChild(
            badge
        );


        // ---------------------------------------------------------
        // Component cards
        // ---------------------------------------------------------

        for (
            const group
            of groups
        ) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "assembly-review-card";


            if (
                mode === "teardown"
            ) {

                card.classList.add(
                    "assembly-review-card-teardown"
                );
            }


            // -----------------------------------------------------
            // Name
            // -----------------------------------------------------

            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "assembly-review-card-name";


            title.textContent =
                group.componentName;


            // -----------------------------------------------------
            // Metadata
            // -----------------------------------------------------

            const metadata =
                document.createElement(
                    "div"
                );


            metadata.className =
                "assembly-review-card-meta";


            const pn =
                document.createElement(
                    "span"
                );


            pn.className =
                "assembly-review-card-pn";


            pn.textContent =
                group.partNumber

                    ? `PN ${group.partNumber}`

                    : "No PN";


            const qty =
                document.createElement(
                    "span"
                );


            qty.className =
                "assembly-review-card-qty";


            qty.textContent =
                `× ${group.quantity}`;


            metadata.appendChild(
                pn
            );


            metadata.appendChild(
                qty
            );


            card.appendChild(
                title
            );


            card.appendChild(
                metadata
            );


            // -----------------------------------------------------
            // Single click
            // -----------------------------------------------------

            card.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    this.setActiveCard(
                        card
                    );
                }
            );


            // -----------------------------------------------------
            // Double click:
            //
            // Leave presentation mode and show/select all source
            // occurrences belonging to the component.
            // -----------------------------------------------------

            card.addEventListener(
                "dblclick",
                async event => {

                    event.stopPropagation();


                    const dbIds =
                        [
                            ...group.dbIds
                        ];


                    await this.exitPresentationMode();


                    this.viewer.select(
                        dbIds,
                        this.viewer.model
                    );


                    this.viewer.fitToView(
                        dbIds
                    );
                }
            );


            layer.appendChild(
                card
            );


            this.labels.push({

                element:
                    card,

                group
            });
        }


        this.updateLabels();
        this.updateLabelVisibility();

    }


    setActiveCard(
        activeCard
    ) {

        for (
            const label
            of this.labels
        ) {

            label.element.classList.toggle(

                "assembly-review-card-active",

                label.element ===
                    activeCard
            );
        }
    }


    removeLabels() {

        if (
            this.labelLayer &&
            this.labelLayer.parentNode
        ) {

            this.labelLayer.parentNode.removeChild(
                this.labelLayer
            );
        }


        this.labelLayer =
            null;


        this.labels =
            [];
    }


    // =============================================================
    // Label tracking
    // =============================================================

    onCameraChanged() {

        if (
            this.mode
        ) {

            this.updateLabels();
        }
    }


    onWindowResize() {

        if (
            this.mode
        ) {

            this.updateLabels();
        }
    }


    updateLabels() {

        if (
            !this.labelLayer
        ) {
            return;
        }


        for (
            const label
            of this.labels
        ) {

            const point =
                this.viewer.worldToClient(
                    label.group.labelAnchor
                );


            if (
                !point ||
                !Number.isFinite(
                    point.x
                ) ||
                !Number.isFinite(
                    point.y
                )
            ) {

                label.element.style.display =
                    "none";

                continue;
            }


            label.element.style.display =
                "block";


            label.element.style.left =
                `${point.x}px`;


            label.element.style.top =
                `${point.y}px`;
        }
    }


    // =============================================================
    // Frame active Shelf/Teardown board
    // =============================================================

    frameCurrentLayout() {

        if (
            !this.layoutBounds ||
            this.layoutBounds.isEmpty()
        ) {
            return;
        }


        const bounds =
            this.layoutBounds;


        const center =
            bounds.getCenter(
                new THREE.Vector3()
            );


        let distance;


        if (
            typeof this.viewer.navigation.computeOverviewDistance ===
                "function"
        ) {

            distance =
                this.viewer.navigation.computeOverviewDistance(
                    bounds
                );

        } else {

            const size =
                bounds.getSize(
                    new THREE.Vector3()
                );


            distance =
                Math.max(

                    size.x,

                    size.y,

                    size.z
                ) *
                1.5;
        }


        if (
            !Number.isFinite(
                distance
            ) ||
            distance <= 0
        ) {

            distance =
                1000;
        }


        /*
         * Straight-down tabletop view.
         */
        const position =
            new THREE.Vector3(

                center.x,

                center.y,

                center.z +
                    distance
            );


        this.viewer.navigation.setView(

            position,

            center
        );


        this.viewer.navigation.setWorldUpVector(

            new THREE.Vector3(
                0,
                1,
                0
            ),

            true,

            true
        );


        if (
            this.options.switchToOrthographic &&
            typeof this.viewer.navigation.toOrthographic ===
                "function"
        ) {

            this.viewer.navigation.toOrthographic();
        }


        this.viewer.impl.invalidate(
            true,
            true,
            true
        );
    }


    // =============================================================
    // Node bounding box
    // =============================================================

    getNodeBoundingBox(
        model,
        fragIds
    ) {

        const fragList =
            model.getFragmentList();


        const result =
            new THREE.Box3();


        result.makeEmpty();


        for (
            const fragId
            of fragIds
        ) {

            const box =
                new THREE.Box3();


            fragList.getWorldBounds(
                fragId,
                box
            );


            if (
                !box.isEmpty()
            ) {

                result.union(
                    box
                );
            }
        }


        return result;
    }


    // =============================================================
    // Bulk properties
    // =============================================================

    async getBulkProperties(
        model,
        dbIds,
        propFilter
    ) {

        const results =
            [];


        const batchSize =
            this.options.propertyBatchSize;


        for (
            let start = 0;
            start < dbIds.length;
            start += batchSize
        ) {

            const batch =
                dbIds.slice(

                    start,

                    start +
                    batchSize
                );


            const batchResults =
                await new Promise(
                    (resolve, reject) => {

                        if (
                            typeof model.getBulkProperties2 ===
                                "function"
                        ) {

                            model.getBulkProperties2(

                                batch,

                                {
                                    propFilter
                                },

                                resolve,

                                reject
                            );

                        } else {

                            model.getBulkProperties(

                                batch,

                                propFilter,

                                resolve,

                                reject
                            );
                        }
                    }
                );


            if (
                Array.isArray(
                    batchResults
                )
            ) {

                results.push(
                    ...batchResults
                );
            }


            /*
             * Yield between large batches.
             */
            await new Promise(
                resolve =>

                    setTimeout(
                        resolve,
                        0
                    )
            );
        }


        return results;
    }


    getPropertyValue(
        result,
        displayName
    ) {

        if (
            !result ||
            !Array.isArray(
                result.properties
            )
        ) {

            return undefined;
        }


        const property =
            result.properties.find(

                property =>
                    property.displayName ===
                    displayName
            );


        return property

            ? property.displayValue

            : undefined;
    }


    // =============================================================
    // CSS
    // =============================================================

    injectStyles() {

        const styleId =
            "assembly-review-view-styles";


        if (
            document.getElementById(
                styleId
            )
        ) {

            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            styleId;


        style.textContent = `

            /* =====================================================
               Label layer
               ===================================================== */

            .assembly-review-label-layer {
                position: absolute;
                inset: 0;
                pointer-events: none;
                overflow: hidden;
                z-index: 20;
            }


            /* =====================================================
               Mode badge
               ===================================================== */

            .assembly-review-mode-badge {
                position: absolute;
                top: 14px;
                left: 50%;
                transform: translateX(-50%);

                padding: 6px 12px;

                border:
                    1px solid rgba(255,255,255,0.16);

                border-radius: 20px;

                background:
                    rgba(28,31,36,0.88);

                color:
                    rgba(255,255,255,0.8);

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;

                font-size: 10px;
                font-weight: 700;
                letter-spacing: 1.2px;

                pointer-events: none;
            }


            /* =====================================================
               Group card
               ===================================================== */

            .assembly-review-card {
                position: absolute;

                transform:
                    translate(-50%, 0);

                min-width: 150px;
                max-width: 250px;

                padding:
                    7px 10px 8px 10px;

                box-sizing:
                    border-box;

                border:
                    1px solid
                    rgba(255,255,255,0.14);

                border-radius:
                    6px;

                background:
                    rgba(28,31,36,0.92);

                color:
                    #ffffff;

                box-shadow:
                    0 2px 8px
                    rgba(0,0,0,0.28);

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;

                pointer-events:
                    auto;

                cursor:
                    pointer;

                user-select:
                    none;
            }


            .assembly-review-card-teardown {
                background:
                    rgba(24,27,31,0.90);
            }


            .assembly-review-card:hover {
                background:
                    rgba(40,44,51,0.98);

                border-color:
                    rgba(255,255,255,0.38);
            }


            .assembly-review-card-active {
                outline:
                    2px solid
                    rgba(74,160,255,0.95);

                outline-offset:
                    1px;
            }


            /* =====================================================
               Component name
               ===================================================== */

            .assembly-review-card-name {
                overflow:
                    hidden;

                text-overflow:
                    ellipsis;

                white-space:
                    nowrap;

                font-size:
                    12px;

                font-weight:
                    600;

                line-height:
                    16px;
            }


            /* =====================================================
               Part number + quantity
               ===================================================== */

            .assembly-review-card-meta {
                display:
                    flex;

                align-items:
                    center;

                justify-content:
                    space-between;

                gap:
                    12px;

                margin-top:
                    3px;

                color:
                    rgba(255,255,255,0.72);

                font-size:
                    11px;

                line-height:
                    14px;
            }


            .assembly-review-card-pn {
                overflow:
                    hidden;

                text-overflow:
                    ellipsis;

                white-space:
                    nowrap;
            }


            .assembly-review-card-qty {
                flex:
                    none;

                color:
                    #ffffff;

                font-size:
                    13px;

                font-weight:
                    700;
            }
        `;


        document.head.appendChild(
            style
        );
    }
}


// =================================================================
// Register extension
// =================================================================

Autodesk.Viewing.theExtensionManager.registerExtension(
    "componentsListViews",
    componentsListViews
);