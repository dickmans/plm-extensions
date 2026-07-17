const registry = {

    panelTypes : {
        navigation : [
              { // insertMOW
                id          : 'insertMOW',
                description : "Shows the signed-in user's My Outstanding Work: the workflow tasks currently assigned to them across all workspaces, with optional filtering by due date, status and workspace. Use it as the personal to-do list on a landing page.",
                usage       : "Use on a personal landing or home screen so each user immediately sees the workflow tasks waiting on them. Typical cases: a 'My Work' dashboard, or the first tab of a role-based home page. Enable the due-date, status and workspace filters when users juggle many tasks across processes.",
                className   : 'mow',
                inputs      : [ ],
                defaults    : {
                    id          : 'mow',
                    headerLabel : 'My Outstanding Work',
                    layout      : 'table',
                    tileIcon    : 'icon-problem'
                },
                data        : [ 'fieldsEx', 'fieldsIn', 'workspacesEx', 'workspacesIn', 'timeout', 'userId' ],
                filters     : [ 'filterByDueDate', 'filterByStatus', 'filterByWorkspace' ],
                additional  : [ 'openOnDblClick' ],
                excluded    : [ 'openInPLM' ]
            },{ // insertRecentItems
                id          : 'insertRecentItems',
                description : "Shows the items the user has most recently opened, as a quick-access list for jumping back into recent work.",
                usage       : "Use to give users a fast way back to items they were just working on, without searching again. Good on a home screen or in a side rail next to a details view. Pair it with insertSearch and insertBookmarks for a complete quick-access area.",
                className   : 'recents',
                inputs      : [ ],
                defaults    : {
                    id          : 'recents',
                    headerLabel : 'Recently Viewed Items',
                    layout      : 'list',
                    tileIcon    : 'icon-history'
                },
                data        : [ 'fieldsEx', 'fieldsIn', 'workspacesEx', 'workspacesIn' ],
                filters     : [  'filterByWorkspace' ],                
                additional  : [
                    'dragable', 'onDragStart', 'onDragEnd',
                    'dropable', 'onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop',
                    'openOnDblClick'
                ],
                excluded    : [ 'openInPLM' ],
            },{ // insertBookmarks
                id          : 'insertBookmarks',
                description : "Shows the items the user has bookmarked (favourited), giving one-click access to the records they return to most often.",
                usage       : "Use to surface the items a user has explicitly flagged as important, for one-click return. Best on a home screen or navigation rail. Choose this over Recent Items when users curate a stable working set rather than relying on recency.",
                className   : 'bookmarks',
                inputs      : [ ],
                defaults    : {
                    id          : 'bookmarks',
                    headerLabel : 'Bookmarks',
                    layout      : 'list',
                    tileIcon    : 'icon-bookmark',
                    tileImage   : true,
                },
                data        : [ 'fieldsEx', 'fieldsIn', 'workspacesEx', 'workspacesIn' ],
                filters     : ['filterByWorkspace'],
                additional  : [ 
                    'dragable', 'onDragStart', 'onDragEnd',
                    'dropable', 'onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop',
                    'openOnDblClick'                
                ],
                excluded    : [ 'openInPLM' ],
            },{ // insertWorkspaceViews
                id          : 'insertWorkspaceViews',
                description : "Shows the saved Views of a workspace (e.g. 'All Items', 'My Items') and lets the user switch between them to browse that workspace's records. Can optionally fold in My Outstanding Work, Bookmarks and Recent Items as extra views.",
                usage       : "Use to let users browse a workspace through its predefined Views and switch between them. Ideal as the main navigator of a workspace-centric app. Fold in MOW, Bookmarks and Recents as extra views when you want a single combined navigation panel.",
                className   : 'workspace-views',
                inputs      : [{
                    title       : 'Workspace ID',
                    description : 'ID of the workspace for which the views should be listed',
                    default     : '57',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id           : 'workspace-views',
                    headerLabel  : '',
                    layout       : 'table',
                    tileTitle    : 'DESCRIPTOR',
                    tileSubtitle : 'WF_CURRENT_STATE',
                },
                data       : [ 'fieldsEx', 'fieldsIn' ],
                filters    : [ ],
                additional : [
                    'additionalData',
                    'dragable', 'onDragStart', 'onDragEnd',
                    'dropable', 'onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop',                    
                    'limit',
                    'includeBookmarks', 'includeMOW', 'includeRecents',
                    'openOnDblClick',
                    'startupView',
                    'viewSelector'
                ],
                excluded   : [ 'headerTopLabel', 'headerSubLabel', 'openInPLM' ]
            },{ // insertWorkspaceSearch
                id          : 'insertWorkspaceSearch',
                description : "A search box scoped to a single workspace: finds items by one or more configurable field values (via /plm/search) and lists the matches as that workspace's columns. Use it instead of insertSearch when results must come from one workspace and show its own fields.",
                usage       : "Use when search must be limited to a single workspace and results should display that workspace's columns (it queries /plm/search). Typical cases: a workspace-specific finder, or a component picker that filters on a particular field. Configure searchInFields to control which field(s) the typed text matches.",
                className   : 'search-workspace',
                inputs      : [{
                    id          : 'wsId',
                    title       : 'Workspace ID',
                    description : 'ID of workspace to search within',
                    default     : '57',
                    type        : 'string',
                    required    : true            
                }],
                defaults : {
                    id               : 'search-workspace',
                    headerLabel      : 'Search in Workspace',
                    placeholder      : 'Filter results',
                    layout           : 'list',
                    tileTitle        : 'DESCRIPTOR',
                    tileSubtitle     : 'TITLE',
                    tileImageFieldId : 'IMAGE',
                    searchInFields   : ['DESCRIPTOR'],
                    sortBy           : ['DESCRIPTOR']
                },
                data        : [ 'fieldsIn', 'fieldsEx' ],   
                filters     : [ 'filterByStatus' ],
                additional  : [
                    'dragable', 'onDragStart', 'onDragEnd',
                    'dropable', 'onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop',
                    'groupBy', 'groupLayout',
                    'openOnDblClick',
                    'searchInFields', 'searchReturnFields', 'searchForExactMatch', 'searchInputLabel', 'searchButtonIcon', 'searchButtonLabel', 'searchBaseFilters', 'searchLogicClause', 'sortBy', 'stateColors',
                    'searchLatestOnly', 'searchReleasedOnly', 'searchWorkingOnly', 'hideWorking'
                ],
                excluded : [ 'openInPLM' ]
            },{ // insertSearch
                id          : 'insertSearch',
                description : "A cross-workspace search box: finds items by descriptor across the entire tenant and lists the matches (descriptor, workspace, owner). Use it as a global 'find any item' control.",
                usage       : "Use as the global 'find anything' box when users do not know which workspace an item lives in - it searches descriptors tenant-wide. Good on a home screen or in a picker. If results must come from one workspace and show its own fields, use insertWorkspaceSearch instead.",
                className   : 'search',
                inputs      : [],
                defaults    : {
                    id           : 'search',
                    headerLabel  : 'Search',
                    placeholder  : 'Filter results',
                    layout       : 'list',
                    contentSize  : 'xs',
                    tileTitle    : 'Descriptor',
                    tileSubtitle : 'Workspace',
                },
                data        : [ 'workspacesIn' ],
                filters     : [ 'filterByOwner', 'filterByWorkspace' ],
                additional  : [
                    'autoClick',
                    'baseQuery',
                    'limit',
                    'openOnDblClick',
                    'pagination',
                    'searchInputLabel', 'searchButtonIcon', 'searchButtonLabel', 'searchForExactMatch', 'sortBy',
                    'workspaceIds'
                ],
                excluded    : [ 'openInPLM' ]
            },{ // insertResults
                id          : 'insertResults',
                description : "Shows the items matching a fixed query (workspace + filters) supplied by the developer - a results list with no search box. Use it to display a predetermined set of items.",
                usage       : "Use to display a fixed, developer-defined query (workspace plus filters) with no search box - the panel just shows the matching items. Typical cases: 'Items pending my approval', 'Parts in this project', or dashboard widgets. Set the filters in configuration; users only see and act on the results.",
                className   : 'results',
                inputs      : [{
                    id          : 'wsId',
                    title       : 'Workspace ID',
                    description : 'Workspace ID of items to display',
                    default     : '95',
                    type        : 'string',
                    required    : true
                },{
                    id          : 'filters',
                    title       : 'Filters',
                    description : 'Search parameters to identify the items to display',
                    default     : '[{"field" : "TITLE","type" : "0","comparator" : "contains" ,"value" : "r"}]',
                    type        : 'textarea',
                    required    : true
                }],
                defaults    : {
                    id            : 'results',
                    headerLabel   : 'Results',
                    layout        : 'table',
                    tileTitle     : 'DESCRIPTOR',
                    tileSubtitle  : '',
                },
                data        : [ 'fieldsIn', 'fieldsEx' ],                
                filters     : [ 'filterByStatus' ],
                additional  : [ 
                    'additionalData',
                    'dragable', 'onDragStart', 'onDragEnd',
                    'dropable', 'onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop',
                    'groupBy', 'groupLayout',
                    'openOnDblClick',
                    'searchReturnFields', 'stateColors',
                    'searchLatestOnly', 'searchReleasedOnly', 'searchWorkingOnly', 'hideWorking'                    
                ],
                excluded    : [ 'openInPLM' ]
            // },{ // insertNewTasks
            //     id          : 'insertNewTasks',
            //     description : "Displays the tasks assigned to the current user awaiting acknowledgement / acceptance",
            //     usage       : "Use on a personal landing or home screen so each user immediately sees the workflow tasks waiting on them. Typical cases: a 'My Work' dashboard, or the first tab of a role-based home page. Enable the due-date, status and workspace filters when users juggle many tasks across processes.",
            //     inputs      : [{
            //         id          : 'wsId',
            //         title       : 'Workspace ID',
            //         description : 'Workspace ID of items to display',
            //         default     : '211',
            //         type        : 'string',
            //         required    : true
            //     },{
            //         id          : 'filters',
            //         title       : 'Filters',
            //         description : 'List of filters to apply when retrieving new tasks list',
            //         default     : [{"field" : "TITLE","type" : "0","comparator" : "contains" ,"value" : "r"}],
            //         type        : 'textarea',
            //         required    : true
            //     }],
            //     defaults    : {
            //         headerLabel : 'New Tasks',
            //         layout      : 'list',
            //         contentSize : 'm',
            //         transitions : [
            //             { id : 'ACCEPT'       , icon : 'icon-check'      , class : ''       , title : 'Accept Task'  }, 
            //             { id : 'SET_ON_HOLD_1', icon : 'icon-undo'       , class : 'red'    , title : 'Return Task'  },
            //             { id : 'FINISH_3'     , icon : 'icon-flag-finish', class : 'default', title : 'Set Complete' } 
            //         ]
            //     },

            //     filters     : [ ],
            //     fieldIDs    : [
            //         { key : 'root'         , default : 'PROJECT_NUMBER'         , description : 'Parent element used for grouping' },
            //         { key : 'id'           , default : 'ID'                     , description : 'Unique identifier / number of each task' },
            //         { key : 'title'        , default : 'TITLE'                  , description : 'Title field of tasks' },
            //         { key : 'description'  , default : 'DESCRIPTION'            , description : 'Task Description' },
            //         { key : 'priority'     , default : 'PRIORITY'               , description : 'Task Priority' },
            //         { key : 'start'        , default : 'PLANNED_START_DATE'     , description : 'Target Start Date' },
            //         { key : 'end'          , default : 'PLANNED_COMPLETION_DATE', description : 'Target End Date' },
            //         { key : 'duration'     , default : 'PLANNED_DURATION'       , description : 'Target Duration' },
            //         { key : 'plannedEffort', default : 'PLANNED_EFFORT'         , description : 'Planned total effort' },
            //         { key : 'weeklyEffort' , default : 'EFFORT_BY_WEEK'         , description : 'Planned weekly effort' },
            //     ],
            //     additional : [ 'pageSize', 'sortBy', 'tileImage', 'transitions' ],
            //     excluded   : [ 'layout' ] 
            // },{ // insertTasksManager
            //     id          : 'insertTasksManager',
            //     description : "Displays the tasks assigned to the current user with advanced controls for effort and progress management",
            //     usage       : "Use on a personal landing or home screen so each user immediately sees the workflow tasks waiting on them. Typical cases: a 'My Work' dashboard, or the first tab of a role-based home page. Enable the due-date, status and workspace filters when users juggle many tasks across processes.",
            //     inputs      : [{
            //         id          : 'wsId',
            //         title       : 'Workspace ID',
            //         description : 'Workspace ID of items to display',
            //         default     : '211',
            //         type        : 'string',
            //         required    : true
            //     },{                    
            //         id          : 'filters',
            //         title       : 'Filters',
            //         description : 'List of filters to apply when retrieving new tasks list',
            //         default     : [{"field" : "TITLE","type" : "0","comparator" : "contains" ,"value" : "r"}],
            //         type        : 'textarea',
            //         required    : true
            //     }],
            //     defaults    : {
            //         headerLabel : 'Tasks Manager',
            //         layout      : 'list',
            //         contentSize : 'custom',
            //         transitions : [
            //             { value :  '20', id : 'SET_PROGRESS_20' },
            //             { value :  '40', id : 'SET_PROGRESS_40' },
            //             { value :  '60', id : 'SET_PROGRESS_60' },
            //             { value :  '80', id : 'SET_PROGRESS_80' },
            //             { value : '100', id : 'FINISH_1'        }  
            //         ]
            //     },
            //     filters     : [ ],
            //     fieldIDs    : [
            //         { key : 'root'         , default : 'PROJECT_NUMBER'         , description : 'Parent element used for grouping' },
            //         { key : 'id'           , default : 'ID'                     , description : 'Unique identifier / number of each task' },
            //         { key : 'title'        , default : 'TITLE'                  , description : 'Title field of tasks' },
            //         { key : 'description'  , default : 'DESCRIPTION'            , description : 'Task Description' },
            //         { key : 'priority'     , default : 'PRIORITY'               , description : 'Task Priority' },
            //         { key : 'start'        , default : 'PLANNED_START_DATE'     , description : 'Target Start Date' },
            //         { key : 'end'          , default : 'PLANNED_COMPLETION_DATE', description : 'Target End Date' },
            //         { key : 'duration'     , default : 'PLANNED_DURATION'       , description : 'Target Duration' },
            //         { key : 'plannedEffort', default : 'PLANNED_EFFORT'         , description : 'Planned total effort' },
            //         { key : 'actualEffort' , default : 'ACTUAL_EFFORT'          , description : 'Actual total effort' },
            //         { key : 'startEffort'  , default : 'EFFORT_START_WEEK'      , description : 'Planned effort in first week' },
            //         { key : 'weeklyEffort' , default : 'EFFORT_BY_WEEK'         , description : 'Planned weekly effort' },
            //         { key : 'endEffort'    , default : 'EFFORT_END_WEEK'        , description : 'Planned effort in last week' },
            //         { key : 'progress'     , default : 'PERCENT_COMPLETE'       , description : 'Task progression defined by percentage completed' },
            //         { key : 'lastComment'  , default : 'LAST_COMMENT'           , description : 'Last commment provided by task assignee' },
            //         { key : 'lastUpdate'   , default : 'LAST_UPDATE'            , description : 'Date of last status upodate by task assignee' },
            //     ],
            //     additional : [ 'sortBy', 'wsId' ],
            //     excluded   : [ 'contentSize', 'layout' ] 
            }
        ],
        creation : [
            {   // insertCreate
                id          : 'insertCreate',
                description : "Renders the item-creation form for one or more workspaces, letting the user enter field values and create a new item. Supports pre-filled values, context links to other items, clone dialogs and running a workflow transition on creation.",
                usage       : "Use to embed an item-creation form directly in an app so users can add records without leaving it. Typical cases: a 'New Problem Report' dialog, guided creation wizards, or creating a child item pre-linked to a parent (via the context options). Use the clone and transition options for copy-from-existing or create-and-submit flows.",
                className   : 'create',
                inputs : [{
                    id          : 'workspaceNames',
                    title       : 'Workspace Names',
                    description : 'List of possible workspaces (names separated by comma)',
                    default     : 'Problem Reports',
                    type        : 'array',
                    required    : true
                },{
                    id          : 'workspaceIds',
                    title       : 'Workspace IDs',
                    description : 'List of possible workspaces (provide IDs as alternative to WS Names)',
                    default     : '',
                    type        : 'array',
                    required    : true
                }],
                defaults    : {
                    id                : 'create',
                    headerLabel       : 'Create New',
                    layout            : 'normal',
                    showInDialog      : false,
                    hideComputed      : true,
                    picklistLimit     : 10,
                    picklistShortcuts : true,
                    createButtonLabel : 'Create'
                },
                additional : [
                    'cancelButton', 'cancelButtonIcon', 'cancelButtonLabel', 'cancelButtonTitle',
                    'contextItem', 'contextItemField', 'createContextItemFields',
                    'contextItems', 'contextItemsField',
                    'createButtonIcon', 'createButtonLabel', 'createButtonTitle',
                    'getDetails',
                    'hideReadOnly', 'hideSections',
                    'requiredFieldsOnly',
                    'sectionsIn', 'sectionsEx',
                    'toggles',
                    'viewerImageFields'
                ]
            }
        ],
        items : [
              { // insertDetails
                id          : 'insertDetails',
                description : "Shows the Details of an item (the item identified by API link): its field sections and values. Supports inline editing, cloning, bookmarking and workflow actions depending on the user's permissions.",
                usage       : "Use as the main field-editing surface of an item screen. Typical cases: the 'Details' tab of an item page, or a read-only summary on a dashboard. Enable editing, clone and workflow options per the user's role; hide sections or fields to tailor the form to a specific audience.",
                className   : 'details',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Details should be displayed',
                    default     : '/api/v3/workspaces/95/items/14444',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'details',
                    headerLabel : 'Details',
                },
                additional : [
                    'bookmark',
                    'editable', 'expandSections',
                    'firstSectionOnly',
                    'hideComputed', 'hideReadOnly', 'hideSections', 'hideLabels',
                    'narrowPanel',
                    'picklistLimit', 'picklistShortcuts',
                    'requiredFieldsOnly',
                    'saveButtonLabel', 'saveSectionsToggle', 'sectionsIn', 'sectionsEx', 'sectionsOrder', 'suppressLinks',
                    'showAsCloneDialog',
                    'toggles',
                    'workflowActions'
                    // [ 'layout'          , 'narrow' ],
                    // [ 'cloneable'          , false ],
                    // [ 'cloneDialog'        , false ],
                ],
                excluded : [ 
                    'counters',
                    'layout',
                    'openSelectedInPLM' 
                ]
            },{ // insertImages
                id          : 'insertImages',
                description : "Shows all image-type fields of an item as a thumbnail grid.",
                usage       : "Use to present an item's image fields as a thumbnail gallery. Typical cases: a product or part page showing photos and renderings, or a visual picker.",
                className   : 'images',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item Link',
                    description : 'API link of the item whose image fields should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'images',
                    headerLabel : 'Images',
                    layout      : 'grid',
                },
                data       : [ 'fieldsIn', 'fieldsEx' ],
                additional : [ 'bookmark', 'sectionsIn', 'sectionsEx' ]
            },{ // insertAttachments
                id          : 'insertAttachments',
                description : "Shows the file attachments of an item: uploaded files, and optionally related or Vault files. Supports preview, download, folder grouping and uploading new files (including viewer screenshots).",
                usage       : "Use to let users view, download and upload an item's files. Typical cases: a 'Files' tab, a document-centric workspace, or surfacing related and Vault files alongside the record. Enable upload (and viewer-screenshot capture) on screens where users contribute files.",
                className   : 'attachments',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Attachments should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id                    : 'attachments',
                    headerLabel           : 'Attachments',
                    layout                : 'list',
                    tileIcon              : 'icon-pdf',
                    uploadScreenshotLabel : 'Save Screenshot'
                },
                filters    : [ 'filterByType' ],
                additional : [
                    'bookmark',
                    'download',
                    'editable', 'extensionsEx', 'extensionsIn',
                    'fileSize', 'fileVersion', 'folders',
                    'hideButtonLabels', 
                    'includeVaultFiles', 'includeRelatedFiles',
                    'splitFileName',
                    'uploadScreenshot', 'uploadScreenshotLabel'
                ]
            },{ // insertGrid
                id          : 'insertGrid',
                description : "Shows an item's grid as an editable table. Supports inline editing, adding / cloning and removing rows",
                usage       : "Use to edit an item's set of related rows in a spreadsheet-like table. Typical cases: editing line items, characteristics, or any one-to-many list in place. Enable add, clone, remove and inline editing for data-entry screens; leave it read-only for review screens.",
                className   : 'grid',
                inputs      : [{
                    id          : 'link',
                    title       : 'link',
                    description : 'API link of the item for which the Grid tab should be displayed',
                    default     : '/api/v3/workspaces/84/items/22131',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'grid',
                    headerLabel : 'Grid',
                    layout      : 'table',
                },
                data       : [ 'fieldsEx', 'fieldsIn' ],
                filters    : [ 'filterEmpty', 'filterBySelection' ],
                additional : [
                    'attributes', 'autoSave', 
                    'bookmark',
                    'disconnectButtonIcon', 'disconnectButtonLabel',                    
                    'editable',
                    'hideButtonLabels', 'hideButtonCreate', 'hideButtonClone', 'hideButtonDisconnect',
                    'rotate',
                    'picklistLimit', 'picklistShortcuts',
                    'saveButtonLabel', 'sortBy', 'sortOrder', 'sortDirection', 'sortType',
                    'toggles'
                ],
                excluded   : [ 'layout' ]
            },{ // insertBOM
                id          : 'insertBOM',
                description : "Shows the multi-level Bill of Materials tree of an item, with quantities and BOM-view selection. Optionally supports file download, drag-and-drop and selecting rows in a connected viewer.",
                usage       : "Use to show an item's multi-level Bill of Materials as an expandable tree with quantities. Typical cases: an engineering or manufacturing BOM tab, where-used review, or a download point for BOM files. Enable drag-and-drop or viewer selection for interactive assembly screens; use insertFlatBOM or insertBOMPartsList when a flat list fits better.",
                className   : 'bom',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Bill of Materials should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'bom',
                    headerLabel : 'BOM',
                    layout      : 'tree',
                },
                data : [ 
                    // 'additionalRequests' // Handled in code
                    'bomViewName', 'bomViewId',
                    'depth',
                    'fieldsEx', 'fieldsIn',
                    'includeBOMPartList',
                    'revisionBias',
                    'selectItems',
                    'workspacesIn', 'workspacesEx'
                ],
                additional : [
                    'bomViewSelector', 
                    'downloadFiles', 'downloadFormats', 'downloadRequests', 'downloadPatterns',
                    'dragable', 'onDragStart', 'onDragEnd',
                    'dropable', 'onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop',,
                    'editable', 'endItemFieldId', 'endItemFieldValue', 
                    'goThere',
                    'hideDescriptor', 'hideDescriptorRev', 'hideTreeNumber', 'hideTreeHeader', 'hideTreeColumns', 
                    'saveButtonLabel', 'selectUnique',
                    'toggles', 'treePath', 'treePathTitle', 'treeShowQuantity', 'treeShowRestricted',
                    'viewerSelection'
                ],
                excluded : [ 'layout' ]
            },{ // insertBOMPartsList
                id          : 'insertBOMPartsList',
                description : "Shows the fully flattened BOM of an item - every part with its rolled-up total quantity - as a single list rather than a tree.",
                usage       : "Use when users need every part and its total rolled-up quantity in one flat list rather than a tree. Typical cases: procurement and shopping lists, costing roll-ups, or exporting a consolidated parts list. Choose insertBOM instead when the assembly structure matters.",
                className   : 'bom-parts-list',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Flat BOM should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'bom-parts-list',
                    headerLabel : 'BOM Parts List',
                    layout      : 'list'
                },                
                data : [
                    'bomViewName', 'bomViewId', 
                    'depth',
                    'fieldsEx', 'fieldsIn',
                    'revisionBias',
                    'selectItems'
                ],
                additional : [ 'hideParentNodes', 'viewerSelection' ]
            },{ // insertFlatBOM
                id          : 'insertFlatBOM',
                description : "Shows the fully flattened BOM of an item - every part with its rolled-up total quantity - as a single list rather than a tree.",
                usage       : "Use when users need every part and its total rolled-up quantity in one flat list rather than a tree. Typical cases: procurement and shopping lists, costing roll-ups, or exporting a consolidated parts list. Choose insertBOM instead when the assembly structure matters.",
                className   : 'flat-bom',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Flat BOM should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'flat-bom',
                    headerLabel : 'Flat BOM',
                    layout      : 'table',
                },
                data : [
                    'bomViewName', 'bomViewId', 
                    'depth',
                    'fieldsEx', 'fieldsIn',
                    'revisionBias',
                    'selectItems',
                    'workspacesIn', 'workspacesEx'                    
                ],                
                additional : [ 
                    'bomViewSelector', 
                    'editable' 
                ]
            },{ // insertRootParents
                id          : 'insertRootParents',
                description : "Shows the top-level (root) assemblies that ultimately contain the item, taken from its Where-Used, together with the path to each.",
                usage       : "Use to answer 'which top-level products ultimately contain this part?' from where-used. Typical cases: impact analysis before a change, or navigating up to finished assemblies. Pair it with insertParents when users also need the immediate level.",
                className   : 'roots',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the root items and paths should be displayed',
                    default     : '/api/v3/workspaces/57/items/18702',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'roots',
                    headerLabel : 'Root Parents',
                    layout      : 'table',
                    tileIcon    : 'icon-link',
                },
                data : [ 
                    'depth', 
                    'fieldsEx', 'fieldsIn',
                    'workspacesIn', 'workspacesEx'  
                ],
                filters : [ 'filterByLifecycle', 'filterByWorkspace' ],
                additional : [
                ]
            },{ // insertParents
                id          : 'insertParents',
                description : "Shows the immediate (first-level) parents of an item - the assemblies that directly use it.",
                usage       : "Use to show only the direct parents of an item (the assemblies that use it one level up). Typical cases: quick upward navigation, or confirming immediate usage before editing. Use insertRootParents for the full top-level rollup.",
                className   : 'parents',
                inputs      : [{
                    id          : 'link',                    
                    title       : 'Item link',
                    description : 'API link of the item for which the immediate parents should be displayed',
                    default     : '/api/v3/workspaces/57/items/18702',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'parents',
                    headerLabel : 'Parents',
                    layout      : 'list',
                    tileIcon    : 'icon-product'
                },
                data : [ 
                    'fieldsEx', 'fieldsIn',
                    'workspacesIn', 'workspacesEx'  
                ],
                filters    : [ 'filterByLifecycle', 'filterByWorkspace' ],                
                additional : [ 'displayParentsBOM' ]
            },{ // insertBOMChanges
                id          : 'insertBOMChanges',
                description : "Insert BOM children which are new or have been changed",
                usage       : "Use in BOM comparisons and change review applications",
                className   : 'changes',
                inputs      : [{
                    id          : 'link',                    
                    title       : 'Item link',
                    description : 'API link of the item for which the immediate parents should be displayed',
                    default     : '/api/v3/workspaces/57/items/16908',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'changes',
                    headerLabel : 'BOM Changes',
                    layout      : 'list',
                    tileIcon    : 'icon-product'
                },
                data : [
                    'depth',
                    'fieldsEx', 'fieldsIn',
                    'workspacesIn', 'workspacesEx'                      
                ],
                filters    : [ 'filterByLifecycle', 'filterByWorkspace' ],                
                additional : [ 'wsIdChangesProcess' ]
            },{ // insertManagedItems
                id          : 'insertManagedItems',
                description : "Shows the Managed Items of an item: the records it manages through a managed-item relationship.",
                usage       : "Use to display the records an item manages through a managed-item relationship. Typical cases: a controlling document showing the items it governs, or a master record listing its dependents.",
                className   : 'managed-items',
                inputs      : [{
                    id          : 'link',                       
                    title       : 'Item Link',
                    description : 'API link of the item whose managed items should be displayed',
                    default     : '/api/v3/workspaces/84/items/16911',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'managed-items',
                    headerLabel : 'Managed Items',
                    layout      : 'table',
                    tileIcon    : 'icon-product',
                },
                data       : [ 'fieldsEx', 'fieldsIn', 'workspacesIn', 'workspacesEx' ],
                filters    : [ 'filterByLifecycle', 'filterByWorkspace' ],                
                additional : [ 
                    'editable',
                    'disconnectButtonIcon', 'disconnectButtonLabel',
                    'hideButtonDisconnect' 
                ]
            },{ // insertChangeProcesses
                id          : 'insertChangeProcesses',
                description : "Shows the change processes (e.g. COs / CRs) related to an item, and lets the user create a new one against it.",
                usage       : "Use to show the change processes (COs, CRs, etc.) linked to an item and let users start a new one against it. Typical cases: a 'Changes' tab on an item, or a launch point for raising a change directly from the affected record.",
                className   : 'processes',
                inputs      : [{
                    id          : 'link',                      
                    title       : 'Item Link',
                    description : 'API link of the item for which the Change Processes should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id                : 'processes',
                    headerLabel       : 'Processes',
                    layout            : 'list',
                    tileIcon          : 'icon-status',
                    createButtonIcon  : '',
                    createButtonTitle : 'Create new process'
                },
                data       : [ 'fieldsEx', 'fieldsIn', 'workspacesIn', 'workspacesEx' ],                
                filters    : [ 'filterByStatus', 'filterByWorkspace' ],                
                additional : [ 
                    'createButtonIcon', 'createButtonLabel', 'createButtonTitle',
                    'createWorkspaceId', 'createWorkspaceIds', 'createHeaderLabel',
                    // 'createContextItem', 'createContextItemField', 'createContextItemFields',
                    // 'createContextItems', 'createContextItemsField', 
                    'contextItem', 'contextItemField', 'createContextItemFields',
                    'contextItems', 'contextItemsField',                    
                    'createConnectAffectedItem',
                    'createHideSections', 'createSectionsIn', 'createSectionsEx',
                    'editable' 
                ]
            },{ // insertProject
                id          : 'insertProject',
                description : "Shows the Project tab of an item: the project tasks and deliverables associated with it.",
                usage       : "Use to surface the project tasks and deliverables tied to an item. Typical cases: a 'Project' tab linking engineering records to project management, or tracking deliverable status from the item.",
                className   : 'project',
                inputs      : [{
                    id          : 'link',   
                    title       : 'Item Link',
                    description : 'API link of the item for which the Project tab should be displayed',
                    default     : '/api/v3/workspaces/213/items/18866',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'project',
                    headerLabel : 'Timeline',
                    layout      : 'list',
                    tileIcon    : 'icon-calendar',
                    multiSelect : true
                },
                data       : [ 'fieldsEx', 'fieldsIn', 'workspacesIn', 'workspacesEx' ],                  
                filters    : [ 'filterByStatus', 'filterByWorkspace' ],                 
                additional : [ 
                    'createButtonIcon', 'createButtonLabel', 'createButtonTitle',
                    'createWorkspaceId', 'createWorkspaceIds', 'createHeaderLabel',
                    'disconnectButtonIcon', 'disconnectButtonLabel',
                    'editable',
                    'hideButtonDisconnect',
                    'stateColors' 
                ]
            },{ // insertRelationships
                id          : 'insertRelationships',
                description : "Shows the Relationships of an item: the records linked to it through relationship fields.",
                usage       : "Use to show records linked to an item via relationship fields. Typical cases: a generic 'Related Items' tab, or exposing cross-workspace links such as requirements to parts.",
                className   : 'relationships',
                inputs      : [{
                    id          : 'link',   
                    title       : 'Item Link',
                    description : 'API link of the item for which the Relationships tab should be displayed',
                    default     : '/api/v3/workspaces/95/items/14444',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id                : 'relationships',
                    headerLabel       : 'Relationships',
                    layout            : 'list',
                    tileIcon          : 'icon-link',
                    filterByWorkspace : true
                },
                data       : ['fieldsEx', 'fieldsIn', 'workspacesIn', 'workspacesEx' ],
                filters    : [ 'filterByWorkspace' ],                
                additional : [ ]
            },{ // insertSourcing
                id          : 'insertSourcing',
                description : "Shows the Sourcing information of an item: its manufacturers, suppliers and sourced part numbers.",
                usage       : "Use to display an item's manufacturers, suppliers and sourced part numbers. Typical cases: a 'Sourcing' or 'Procurement' tab on a part, or supplier review screens.",
                className   : 'sourcing',
                inputs      : [{
                    id          : 'link',   
                    title       : 'link',
                    description : 'API link of the item for which the Sourcing should be displayed',
                    default     : '/api/v3/workspaces/57/items/9913',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'sourcing',
                    headerLabel : 'Sourcing',
                    layout      : 'table'
                },
                data       : ['fieldsEx', 'fieldsIn', 'workspacesIn', 'workspacesEx' ],
                filters    : [ 'filterBySupplier', 'filterByManufacturer' ],                    
                additional : [ 'groupBy' ]
            },{ // insertWorkflowHistory
                id          : 'insertWorkflowHistory',
                description : "Shows the workflow history of an item - every state transition with who performed it and when - and optionally the transitions available from the current state.",
                usage       : "Use to show the full audit trail of state transitions on an item - who moved it where, and when. Typical cases: a 'History' tab for compliance and traceability, or troubleshooting why an item is in its current state. Configure final states and excluded transitions to tidy the timeline.",
                className   : 'workflow-history',
                inputs      : [{
                    id          : 'link',  
                    title       : 'Item Link',
                    description : 'API link of the item whose workflow history should be displayed',
                    default     : '/api/v3/workspaces/100/items/22265',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id                  : 'workflow-history',
                    headerLabel         : 'Workflow History',
                    showNextTransitions : true,
                    finalStates         : ['Complete', 'Completed', 'Closed', 'Done'],
                    transitionsEx       : ['Cancel', 'Delete']
                },
                additional : [ 
                    'finalStates',
                    'showNextTransitions',
                    'transitionsEx', 'transitionsIn'
                ],
                excluded   : [ 'openSelectedInPLM' ]
            },{ // insertRevisions
                id          : 'insertRevisions',
                description : "Shows the revision list of an item: all its revisions / versions, for navigating between them.",
                usage       : "Use to list an item's revisions or versions and navigate between them. Typical cases: a 'Revisions' tab for comparing or opening prior versions of a controlled record.",
                className   : 'revisions',
                inputs      : [{
                    id          : 'link',                      
                    title       : 'Item Link',
                    description : 'API link of the item whose revision list should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults   : {
                    id          : 'revisions',
                    headerLabel : 'Revisions',
                    layout      : 'table',
                    tileIcon    : 'icon-product',
                    number      : false
                },
                data       : ['fieldsEx', 'fieldsIn' ],
                additional : [ ]
            },{ // insertChangeLog
                id          : 'insertChangeLog',
                description : "Shows the change log of an item: a chronological audit trail of field changes, with optional filtering by user and by action type.",
                usage       : "Use to show a field-level audit trail of who changed what on an item. Typical cases: a compliance 'Change Log' tab, or investigating data changes. Enable the user and action filters when logs get long.",
                className   : 'change-log',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item Link',
                    description : 'API link of the item for which the Change Log tab should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id             : 'change-log',
                    headerLabel    : 'Change Log',
                    layout         : 'list',
                    textNoData     : 'No change log entries found',
                    filterByUser   : true,
                    filterByAction : true
                },
                data       : [ 'fieldsEx', 'fieldsIn' ],
                filters    : [ 'filterByUser', 'filterByAction' ],
                additional : [ 'actionsIn', 'actionsEx', 'usersIn', 'usersEx' ],
                excluded   : [ 'layout', 'openSelectedInPLM' ] 
            },{ // insertItemSummary
                id          : 'insertItemSummary',
                description : "Shows a complete item summary screen - header, status, action controls and configurable content tabs / sections - as a self-contained item page.",
                usage       : "Use as a self-contained, full item page that combines header, status, action controls and configurable content tabs and sections. Typical cases: the primary 'open item' screen of an app, where you want a complete record view without assembling individual panels. Configure the contents to choose which tabs and sections appear.",
                className   : 'item',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item Link',
                    description : 'API link of the item to summarize',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults   : {
                    id            : 'item',
                    summaryLayout : 'tabs',
                    // cloneable       : false,
                },               
                additional : [ 
                    'hideCloseButton', 'hideSubtitle',
                    'includeViewer',
                    // 'onClickClose',
                    'saveTabSelection', 'selectedTab', 'stateColors', 'summaryContents', 'summaryLayout',
                    'workflowActions'
                ],
                excluded   : [ 'layout' ]                 
            // },{ // insertItemStatus
            //     title       : 'insertItemStatus()',
            //     function    : 'insertItemStatus',
            //     id          : 'item-status',
            //     description : "Shows the current workflow state (lifecycle status) of an item as a status indicator in the given element.",
            //     usage : "Use to show an item's current lifecycle state as a compact status badge. Typical cases: a header indicator on an item page, or a status accent in a summary. It is lightweight; pair it with insertWorkflowActions to also let users advance the state.",
            //     inputs : [{
            //         title       : 'Item Link',
            //         description : 'API link of the item whose current workflow state should be displayed',
            //         default     : '/api/v3/workspaces/57/items/14669',
            //         type        : 'string',
            //         required    : true
            //     }],
            //     defaults : {},
            //     additional  : []
            // },{ // insertWorkflowActions
            //     title       : 'insertWorkflowActions()',
            //     function    : 'insertWorkflowActions',
            //     id          : 'workflow-actions',
            //     description : "Shows a select control listing the workflow transitions currently available on an item, letting the user advance its state.",
            //     usage : "Use to give users the control to advance an item through its workflow. Typical cases: an 'Actions' menu in an item header so reviewers can approve or reject without opening PLM. Pair it with insertItemStatus to show the current state alongside.",
            //     inputs : [{
            //         title       : 'Item Link',
            //         description : 'API link of the item whose workflow actions should be listed',
            //         default     : '/api/v3/workspaces/57/items/14669',
            //         type        : 'string',
            //         required    : true
            //     }],
            //     defaults : {
            //         label            : 'Change Status',
            //         hideIfEmpty      : true,
            //         disableAtStartup : false
            //     },
            //     additional : [
            //         'label',
            //         'hideIfEmpty',
            //         'disableAtStartup'
            //     ]
            // },{ // insertViewer
            //     title       : 'insertViewer()',
            //     function    : 'insertViewer',
            //     id          : 'viewer',
            //     description : "Shows the Autodesk Platform Services (APS) viewer for an item's attachments, rendering its 2D / 3D design files.",
            //     usage : "Use to render an item's 2D and 3D design attachments with the Autodesk viewer. Typical cases: a 'Viewer' tab on a part or document, or a visual review surface. Often paired with insertAttachments and BOM panels for design-centric screens.",
            //     inputs : [{
            //         title       : 'Item Link',
            //         description : 'API link of the item whose viewable should be rendered',
            //         default     : '/api/v3/workspaces/57/items/18685',
            //         type        : 'string',
            //         required    : true
            //     }],
            //     defaults : {},
            //     additional : [
            //         'fileId',
            //         'filename'
            //     ]
            }
        ],
        classification : [
              { // insertClasses
                id          : 'insertClasses',
                description : "Shows the classification tree of the tenant, letting the user browse and pick a classification class.",
                usage       : "Use to let users browse the classification hierarchy and pick a class. Typical cases: the left-hand tree of a classification browser, or a class picker that feeds insertClassContents and insertClassFilters. Restrict it to a sub-tree with the topClass settings when only part of the taxonomy is relevant.",
                className   : 'classes',
                inputs      : [],
                defaults    : {
                    id          : 'classes',
                    headerLabel : 'Classes',
                    placeholder : 'Filter classes',
                },
                data       : [ 'depth', 'topClassName', 'topClassId' ],
                additional : [ 'hideTreeNumber', 'toggles', 'treePath' ],
                excluded   : [ 'layout', 'openInPLM', 'openSelectedInPLM' ]
            },{ // insertClassContents
                id          : 'insertClassContents',
                description : "Lists all items classified under a given classification class (identified by class id / name).",
                usage       : "Use to list the items belonging to a chosen classification class. Typical cases: the results pane of a classification browser (driven by insertClasses), or finding standard and library parts by category.",
                classNamme  : 'contents',
                inputs      : [{
                    title       : 'Class ID',
                    description : 'Internal ID of the given Class',
                    default     : '142',
                    type        : 'string',
                    required    : true
                },{
                    title       : 'Class Name',
                    description : 'Internal Name of the given Class',
                    default     : 'CABLES_AND_WIRES',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id          : 'contents',
                    headerLabel : 'Class Items',
                    layout      : 'table',
                    limit       : 20,
                    fieldsIn    : ['DESCRIPTOR']
                },
                data       : [ 'fieldsIn', 'fieldsEx' ],
                filters    : [ 'filterByStatus', 'filterByWorkspace' ],
                additional : [ 'limit', 'pagination', 'sortSelection' ],
                excluded   : [ 'layout' ]
            },{ // insertClassFilters
                id          : 'insertClassFilters',
                description : "Shows the properties of a classification class and the filter controls for narrowing its contents.",
                usage       : "Use to show a class's properties as filter controls so users can narrow its contents by attribute values. Typical cases: faceted search within a class (e.g. filter resistors by resistance and package), paired with insertClassContents.",
                className   : 'classFilters',
                inputs      : [{
                    title       : 'Class ID',
                    description : 'Internal ID of the given Class',
                    default     : '142',
                    type        : 'string',
                    required    : true
                },{
                    title       : 'Class Name',
                    description : 'Internal Name of the given Class',
                    default     : 'CABLES_AND_WIRES',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id             : 'classFilters',
                    headerLabel    : 'Filters',
                    limit          : 25,
                    textNoData     : 'No properties found for the selected class',
                    fieldsIn       : ['DESCRIPTOR']
                },
                data       : [ 'fieldsIn' ],      
                additional : [ 'advancedFilter', 'idContents', 'showInDialog' ],
                excluded   : [ 'layout' ]
            },{ // insertItemClassification
                id          : 'insertItemClassification',
                description : "Shows the classification data of a given item: the classes it belongs to and their property values.",
                usage       : "Use to show the classification a specific item carries - its classes and their property values. Typical cases: a 'Classification' tab on an item, or verifying and maintaining how a part is classified.",
                className   : 'classification',
                inputs      : [{
                    id          : 'link',
                    title       : 'Item Link',
                    description : 'API link of the item whose classification data should be displayed',
                    default     : '/api/v3/workspaces/57/items/14922',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    id             : 'classification',
                    headerLabel    : 'descriptor',
                    headerSubLabel : 'Classifcation Data',
                    textNoData     : 'No Classification Data Available',
                    hideSections   : true
                },
                additional : [
                    'bookmark',
                    'hideLabels', 'hideReadOnly', 'hideSections',
                    'requiredFieldsOnly', 'saveButtonLabel'
                ],
                excluded   : [ 'layout' ]
            },{ // insertSimilarItems
                id          : 'insertSimilarItems',
                description : "Shows items similar to a given item, matched on shared classification.",
                usage       : "Use to suggest items similar to the current one based on shared classification. Typical cases: duplicate prevention during creation, or steering users to an existing standard part instead of creating a new one.",
                className   : 'similar',
                inputs : [{
                    id          : 'link',
                    title       : 'Item Link',
                    description : 'API link of the reference item',
                    default     : '/api/v3/workspaces/57/items/14922',
                    type        : 'string',
                    required    : true
                }],
                defaults   : { id : 'similar' },
                additional : []
            }
        ],
        admin : [
            { // insertUsers
                id          : 'insertUsers',
                description : "Lists the users of the tenant - an administrative panel for browsing user accounts.",
                usage       : "Administrative panel that lists the tenant's users. Typical cases: admin utilities for browsing or selecting user accounts.",
                className   : 'users',
                inputs      : [],
                defaults    : {
                    id          : 'users',
                    headerLabel : 'Users',
                    layout      : 'table'
                },
                data       : [ 'fieldsEx', 'fieldsIn' ],            
                additional : [ ]
            }
        ]        
        // vault : [{
        //     title       : 'insertPDMFileProperties()',
        //     function    : 'insertPDMFileProperties',
        //     id          : 'pdm-file-properties',
        //     description : "Shows the properties of a Vault file identified by its Vault link.",
        //     usage : "Use to show a Vault file's properties inside a PLM app, typically to surface CAD file metadata next to the linked PLM item (Vault add-in contexts).",
        //     inputs : [{
        //         title       : 'File Link',
        //         description : 'Vault link of the file whose properties should be displayed',
        //         default     : '',
        //         type        : 'string',
        //         required    : true
        //     }],
        //     defaults : {
        //         headerLabel : 'Properties',
        //         layout      : 'normal'
        //     },
        //     options : [ 'headerLabel', 'layout' ]
        // }],
        // viewer : [{
        //     title       : 'insertAPSBOM()',
        //     function    : 'insertAPSBOM',
        //     id          : 'aps-bom',
        //     description : "Shows the BOM of a component derived from its design file via Autodesk Platform Services (Model Derivative).",
        //     usage : "Use to show a component's BOM derived from its design file via APS Model Derivative, when no PLM BOM exists yet - for example previewing structure straight from CAD.",
        //     inputs : [{
        //         title       : 'Item Link',
        //         description : 'API link of the component whose BOM should be displayed',
        //         default     : '',
        //         type        : 'string',
        //         required    : true
        //     }],
        //     defaults : {
        //         headerLabel : 'Component BOM',
        //         contentSize : 'm',
        //         layout      : 'tree'
        //     },
        //     options : [
        //         'contentSize', 'headerLabel', 'hideDescriptor', 'hideTreeNumber',
        //         'hideTableHeader', 'layout', 'path', 'toggles'
        //     ]
        // }],
    },

    panelStandardOptions : {

        header : {
            id : {
                title       : 'DOM Element ID',
                description : 'ID of DOM element where the panel will be inserted',
                default     : '',
                type        : 'string',
            },
            headerLabel : {
                title       : 'Header Label',
                description : "Panel Header (can be set to 'descriptor' for Item Data panels)",
                default     : '',
                type        : 'string',
            },
            headerTopLabel : {
                title       : 'Header Top Label',
                description : 'Text being shown on top of Panel Header',
                default     : '',
                type        : 'string',
            },
            headerSubLabel : {
                title       : 'Header Sub Label',
                description : 'Text being shown below Panel Header',
                default     : '',
                type        : 'string',
            },
            headerToggle : {
                title       : 'Header Toggle',
                description : 'Display a toggle next to the header to collapse and expand the panel',
                default     : false,
                type        : 'boolean'
            },
            collapsePanel : {
                title       : 'Collapse Panel',
                description : 'Collapse panel on startup',
                default     : false,
                type        : 'boolean',
            },            
            hideHeader : {
                title       : 'Hide Header',
                description : 'Hides header',
                default     : false,
                type        : 'boolean',
            },
            hideHeaderLabel : {
                title       : 'Hide Header Label',
                description : 'Hides header Label element',
                default     : false,
                type        : 'boolean',
            },
            hideHeaderControls : {
                title       : 'Hide Header Controls',
                description : "Hides the header toolbar (search, reload, ...). The 'hidden' class is applied so it can be re-shown via JS.",
                default     : false,
                type        : 'boolean'
            },            
            hidePanel : {
                title       : 'Hide Panel',
                description : "Hides the panel (data still loads). The 'hidden' class is applied so it can be re-shown via JS.",
                default     : false,
                type        : 'boolean'
            },
            showInDialog : {
                title       : 'Show In Dialog',
                description : 'When enabled, displays the given content in a dialog element',
                default     : false,
                type        : 'boolean'
            },
            singleToolbar : {
                title       : 'Single Toolbar',
                description : "Force all controls into one toolbar identified by name ('controls', 'actions' or 'footer')",
                default     : '',
                type        : 'select',
                list        : [ 'controls', 'actions', 'footer']
            },             
            textNoData : {
                title       : 'Text No Data',
                description : 'Text being shown when there is no data',
                default     : 'No Entries',
                type        : 'string'
            },
            className : {
                title       : 'Class Name',
                description : "CSS class name to be added to top panel element",
                default     : '',
                type        : 'string',
            },             
            surfaceLevel : {
                title       : 'Surface Level',
                description : "Applies the matching CSS surface class ('1' to '5') to the panel for visual layering",
                default     : '',
                type        : 'select',
                list        : ['1', '2', '3', '4', '5']
            },
            toggleBodyClass : {
                title       : 'Toggle Body Class',
                description : 'The defined css class will be added to body element when opening the panel',
                default     : '',
                type        : 'string'
            },
            useCache : {
                title       : 'Use Cache',
                description : 'Enable usage of cached data (if enabled in environment file)',
                default     : false,
                type        : 'boolean'
            }            
        },

        controls : {
            openInPLM : {
                title       : 'Open In PLM',
                description : "When set to true, an icon will be displayed to let users open the selected item in PLM",
                default     : false,
                type        : 'boolean'
            },
            openSelectedInPLM : {
                title       : 'Opens Selected In PLM',
                description : "When set to true, an icon will be displayed to let users open the selected item in PLM",
                default     : false,
                type        : 'boolean'
            },         
            search : {
                title       : 'Search',
                description : 'Enables quick filtering in panel contents when typing',
                default     : false,
                type        : 'boolean',
            },
            placeholder : {
                title       : 'Search Placeholder',
                description : 'Sets the panel type ahead filter placeholder text',
                default     : 'Search',
                type        : 'string',
            },            
            reload : {
                title       : 'Reload',
                description : 'Add a reload button to the panel header toolbar',
                default     : false,
                type        : 'boolean'
            },
        },

        contents : {
            layout : {
                title       : 'Layout',
                description : 'Content Layout',
                default     : 'list',
                type        : 'select',
                list        : ['table', 'list', 'grid']
            },            
            contentSize : {
                title       : 'Content Size',
                description : 'Size of panel contents',
                default     : 'm',
                type        : 'select',
                list        : ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl']
            }, 
            contentSizes : {
                title       : 'Content Sizes',
                description : 'Define list of content sizes that can be toggled',
                default     : [],
                type        : 'array'
            },                  
            collapseContents : {
                title       : 'Collapse Contents',
                description : 'When enabled, contents will be collapsed per default',
                default     : false,
                type        : 'boolean'
            },
            counters : {
                title       : 'Counters',
                description : "Adds bottom toolbar with counters",
                default     : false,
                type        : 'boolean'
            },
            // transitions : {
            //     title       : 'Transition Actions',
            //     description : "Adds actions buttons for each transition defined",
            //     default     : {},
            //     type        : 'textarea'
            // },            
        },

        table : {
            tableHeaders : {
                title       : 'Table Headers',
                description : "When true, table header cells are displayed in layout 'table'",
                default     : true,
                type        : 'boolean'
            },            
            tableColumnsLimit : {
                title       : 'Table Columns Limit',
                description : "Maximum number of columns to display when layout is 'table' (includes the number column)",
                default     : 100,
                type        : 'integer'
            },
            tableRanges : {
                title       : 'Table Ranges',
                description : 'Show min/max range indicators on numeric columns',
                default     : false,
                type        : 'boolean'
            },
            tableTotals : {
                title       : 'Table Totals',
                description : 'Show automatic totals on numeric columns (across all or selected rows)',
                default     : false,
                type        : 'boolean'
            },            
        },

        tiles : {
            tileIcon : {
                title : 'Tile Icon',
                description : 'The icon to be displayed for entries if no image is available and if setting number is disabled',
                default : 'icon-product',
                type : 'string'
            },            
            tileImage : {
                title       : 'Tile Image',
                description : 'Enables images for tiles. If settings tileImageFieldId is provided, this given field will be used to determine the image. If not, the first image field will be used instead.',
                default     : false,
                type        : 'boolean'
            },
            tileImageFieldId : {
                title       : 'Tile Image Field ID',
                description : 'If tileImage is enabled, this field will be used to retrieve the matching image. If this settings is left blank, the first image field of item details will be used automatically, but at lower performane. It is recommended to always provide this settings if images shoule be displayed.',
                default     : '',
                type        : 'string'
            },            
            tileTitle : {
                title       : 'Tile Title Field ID',
                description : 'Sets the Tile Title',
                default     : 'DESCRIPTOR',
                type        : 'string'
            },
            tileSubtitle : {
                title       : 'Tile Subtitle Field ID',
                description : 'Sets the Tile Subtile',
                default     : 'WF_CURRENT_STATE',
                type        : 'string'
            },   
            tileDetails : {
                title       : 'Tile Details',
                description : "JSON array of {icon,fieldId,prefix} entries shown below the tile subtitle",
                default     : '[]',
                type        : 'textarea'
            },
        },


        //     query : {
        //         title       : 'Query',
        //         description : 'Initial search expression applied to the class contents',
        //         default     : '',
        //         type        : 'string'
        //     },      
        //     filter : {
        //         title       : 'Filter',
        //         description : 'Set the filter expression to identify matching records at load',
        //         default     : '',
        //         type        : 'string'
        //     },
        //     number : {
        //         title       : 'Number',
        //         description : 'Enables numbers in tables, grids and lists (setting tileIcon will be ignored when enabled)',
        //         default     : true,
        //         type        : 'boolean'
        //     },
        //     cloneable : {
        //         title       : 'Cloneable',
        //         description : "Enables action button to clone existing item",
        //         default     : false,
        //         type        : 'boolean'
        //     },
        //     multiSelect : {
        //         title       : 'Multi Select',
        //         description : 'Allows users to select multiple items in the panel and adds select-all/none toolbar buttons',
        //         default     : false,
        //         type        : 'boolean'
        //     },
        //     wsId : {
        //         title       : 'Workspace ID',
        //         description : 'Workspace ID to search within / load items from',
        //         default     : '',
        //         type        : 'string'
        //     },
        //     label : {
        //         title       : 'Control Label',
        //         description : 'Label displayed in the workflow actions select control',
        //         default     : 'Change Status',
        //         type        : 'string'
        //     },

        //     fileId : {
        //         title       : 'File ID',
        //         description : 'Force the viewer to load a specific file by its unique ID',
        //         default     : '',
        //         type        : 'string'
        //     },
        //     filename : {
        //         title       : 'Filename',
        //         description : "Force the viewer to load a specific file by its filename (matches the 'Title' column in the Attachments tab)",
        //         default     : '',
        //         type        : 'string'
        //     },
        //     // filters : {
        //     //     title       : 'Filters',
        //     //     description : 'JSON array of search criteria objects to identify the records to load',
        //     //     default     : '[]',
        //     //     type        : 'textarea'
        //     // },
        //     performTransition : {
        //         title       : 'Perform Transition',
        //         description : 'Internal ID of a workflow transition to be performed right after item creation',
        //         default     : '',
        //         type        : 'string'
        //     },


        // insertWorkflowActions exclusive
        //     disableAtStartup : {
        //         title       : 'Disable At Startup',
        //         description : 'Disable the control until available actions have been retrieved',
        //         default     : false,
        //         type        : 'boolean'
        //     },
        //     hideIfEmpty : {
        //         title       : 'Hide If Empty',
        //         description : 'When no workflow actions are available, hide the control instead of showing an empty drop down',
        //         default     : true,
        //         type        : 'boolean'
        //     },        

    },
    
    panelData : {
        bomViewName : {
            title       : 'BOM View Name',
            description : 'Name of BOM View to use',
            default     : '',
            type        : 'string'
        },
        bomViewId : {
            title       : 'BOM View ID',
            description : 'Internal ID of BOM View to use',
            default     : '',
            type        : 'string'
        },
        depth : {
            title       : 'Tree Depth',
            description : 'Number of tree levels to expand',
            default     : 10,
            type        : 'integer'
        },
        revisionBias : {
            title       : 'Revision Bias',
            description : 'BOM expansion revision bias',
            default     : 'release',
            type        : 'select',
            list        : ['release', 'working']
        },
        includeBOMPartList : {
            title       : 'Include BOM Parts List',
            description : "When true, the panel's afterCompletion callback receives the bomPartsList",
            default     : true,
            type        : 'boolean'
        },           
        selectItems : {
            title       : 'Select Items',
            description : "JSON with fieldId/values pairs to pre-select matching BOM rows (e.g. {\"fieldId\":\"TYPE\",\"values\":[\"M\",\"C\"]})",
            default     : '{}',
            type        : 'textarea'
        },
        fieldsEx : {
            title       : 'Fields Excluded',
            description : 'Set list of fields/columns not to be shown (provide labels)',
            default     : '',
            type        : 'array'
        },  
        fieldsIn : {
            title       : 'Fields Included',
            description : 'Set list of fields/columns to be shown (provide labels)',
            default     : '',
            type        : 'array'
        },        
        topClassId : {
            title       : 'Top Class ID',
            description : 'Restrict the classification tree to descendants of this class ID',
            default     : '',
            type        : 'string'
        },
        topClassName : {
            title       : 'Top Class Name',
            description : 'Restrict the classification tree to descendants of this class name',
            default     : '',
            type        : 'string'
        },            
        workspacesEx : {
            title       : 'Workspaces Excluded',
            description : 'Enter comma-separated list of workspace names whose items should be excluded',
            default     : '',
            type        : 'array'
        },
        workspacesIn : {
            title       : 'Workspaces Included',
            description : 'Enter comma-separated list of workspace names. Only items from these workspaces will be shown.',
            default     : '',
            type        : 'array'
        },
        timeout : {
            title       : 'Timeout',
            description : 'Interrupt data retrieval after defined milliseconds',
            default     : 5000,
            type        : 'integer'
        },
        userId : {
            title       : 'User ID',
            description : 'Provide a user name to open the list for another user',
            default     : '',
            type        : 'string'
        }
    },

    panelFilters : {
        filterByAction : {
            title       : 'Filter By Action',
            description : 'Enables a drop down to filter Change Log entries by action type',
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'action',
            label       : 'All Actions'             
        },      
        filterByDueDate : {
            title       : 'Filter By Due Date',
            description : "Enables quick filtering based on due date",
            default     : false,
            type        : 'boolean',
            control     : 'toggle',
            key         : 'due',
            label       : 'Due Tasks'
        },
        filterByLifecycle : {
            title       : 'Filter By Lifecycle',
            description : "Enables a drop down in the panel toolbar to filter records by lifecycle status",
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'lifecycle',
            label       : 'All Lifecycles'                 
        },
        filterByManufacturer : {
            title       : 'Filter By Manufacturer',
            description : 'Enables a drop down to filter sourcing entries by manufacturer',
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'manufacturer',
            label       : 'All Manufacturers'                
        },        
        filterByOwner : {
            title       : 'Filter By Owner',
            description : 'Enables a drop down to filter records by owner',
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'owner',
            label       : 'Due Tasks'            
        },          
        filterBySelection : {
            title       : 'Filter By Selection',
            description : "Enables a toggle to filter for selected items only (requires multiSelect=true)",
            default     : false,
            type        : 'boolean'
        },  
        filterByStatus : {
            title       : 'Filter By Status',
            description : "Enables quick filtering based on process workflow status",
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'status',
            label       : 'All States'                
        },
        filterBySupplier : {
            title       : 'Filter By Supplier',
            description : 'Enables a drop down to filter sourcing entries by supplier',
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'supplier',
            label       : 'All Suppliers'                
        },         
        filterByType : {
            title       : 'Filter By Type',
            description : "Enables quick filtering based on file type",
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'type',
            label       : 'All Types'            
        },
        filterByUser : {
            title       : 'Filter By User',
            description : 'Enables a drop down to filter Change Log entries by acting user',
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'user',
            label       : 'All Users'               
        },          
        filterByWorkspace : {
            title       : 'Filter By Workspace',
            description : "Enables quick filtering based on workspace type",
            default     : false,
            type        : 'boolean',
            control     : 'select',
            key         : 'workspace',
            label       : 'All Workspaces'                
        }, 
        filterEmpty : {
            title       : 'Filter Empty',
            description : 'Enables a toggle to filter for rows whose inputs are empty',
            default     : false,
            type        : 'boolean',
            control     : 'toggle',
            key         : 'empty',
            label       : 'Empty Cells'
        }
    },

    panelAdditionalOptions : {

        create : {
            createButtonIcon : {
                title       : 'Create Button Icon',
                description : 'Icon class for the Create button in the panel',
                default     : 'icon-create',
                type        : 'string'
            },
            createButtonLabel : {
                title       : 'Create Button Label',
                description : 'Label for the Create button in the panel',
                default     : 'Create',
                type        : 'string'
            },          
            createButtonTitle : {
                title       : 'Create Button Title',
                description : 'Title for Create Cancel button in the panel',
                default     : 'Submit and create item',
                type        : 'string'
            },               
            createWorkspaceId : {
                title       : 'Create Workspace ID',
                description : 'Items will be created in the defined Workspace',
                default     : '',
                type        : 'string'
            },
            createWorkspaceIds : {
                title       : 'Create Workspace IDs',
                description : 'Items will be created in (one of) the selected workspaces',
                default     : [],
                type        : 'array'
            },
            createHeaderLabel : {
                title       : 'Create Header Label',
                description : 'Label of the item creation dialog',
                default     : 'Create New Item',
                type        : 'string'
            },
            contextItem : {
                title       : 'Context Item',
                description : 'API link of item being used for linking picklist field(s)',
                default     : '',
                type        : 'string'
            },
            contextItemField : {
                title       : 'Context Item Field',
                description : 'Field ID of linking picklist storing the contextItem link',
                default     : '',
                type        : 'string'               
            },
            createContextItemFields : {
                title       : 'Context Item Fields',
                description : 'List of Field IDs of linking picklists storing the contextItem link',
                default     : [],
                type        : 'array'               
            },
            contextItems : {
                title       : 'Context Items',
                description : 'List of API links of items being used for linking picklist field',
                default     : [],
                type        : 'array'               
            },
            contextItemsField : {
                title       : 'Context Items Field',
                description : 'Field ID of multi linking picklist storing the contextItems links',
                default     : '',
                type        : 'string'               
            },            
            viewerImageFields : {
                title       : 'Viewer Image Fields',
                description : 'List of fields to be used for storing the viewer snapshot',
                default     : [],
                type        : 'array'               
            },
            cancelButton : {
                title       : 'Cancel Button',
                description : 'Enables cancel button display',
                default     : false,
                type        : 'boolean'
            },
            cancelButtonIcon : {
                title       : 'Cancel Button Icon',
                description : 'Icon class for the Cancel button in the panel',
                default     : 'icon-cancel',
                type        : 'string'
            },
            cancelButtonLabel : {
                title       : 'Cancel Button Label',
                description : 'Label for the Cancel button in the panel',
                default     : 'Cancel',
                type        : 'string'
            },               
            cancelButtonTitle : {
                title       : 'Cancel Button Title',
                description : 'Title for the Cancel button in the panel',
                default     : 'Cancel creation',
                type        : 'string'
            },
            createHideSections : {
                title       : 'Create Hide Sections',
                description : 'Hide sections in create dialog',
                default     : false,
                type        : 'boolean'
            },  
            createSectionsIn : {
                title       : 'Create Sections Included',
                description : 'Sections to be shown in create dialog (comma-separated list of section titles)',
                default     : '',
                type        : 'array'
            },  
            createSectionsEx : {
                title       : 'Create Sections Excluded',
                description : 'Sections to be hidden in create dialog (comma-separated list of section titles)',
                default     : '',
                type        : 'array'
            },              
            createConnectAffectedItem : {
                title       : 'Link Affected Item',
                description : 'Links the current item as Affected Item to new process',
                default     : false,
                type        : 'boolean'               
            },
        },

        sections : {
            narrowPanel : {
                title       : 'Narrow Panel',
                description : 'Renders the panel contents in a denser layout',
                default     : false,
                type        : 'boolean'
            },            
            firstSectionOnly : {
                title       : 'First Section Only',
                description : 'Display only the fields of the first visible (non-excluded) section',
                default     : false,
                type        : 'boolean'
            },
            requiredFieldsOnly : {
                title       : 'Required Fields Only',
                description : 'Display only the required fields',
                default     : false,
                type        : 'boolean'
            },
            hideComputed : {
                title       : 'Hide Computed',
                description : "Hides all Computed Fields",
                default     : false,
                type        : 'boolean'
            },         
            hideLabels : {
                title       : 'Hide Labels',
                description : "Hides labels of fields",
                default     : false,
                type        : 'boolean'
            },                
            hideReadOnly : {
                title       : 'Hide Read-Only',
                description : 'Hide read-only fields',
                default     : false,
                type        : 'boolean'
            },                 
            hideSections : {
                title       : 'Hide Sections',
                description : "Hides sections and display all fields in single list",
                default     : false,
                type        : 'boolean'
            }, 
            expandSections : {
                title       : 'Expand Sections',
                description : 'Set list of sections (by comma-separated list of labels) to be expanded',
                default     : '',
                type        : 'array'
            },            
            saveSectionsToggle : {
                title       : 'Save Section Status',
                description : 'Saves the last section toggle status (expanded / collapsed) per user',
                default     : true,
                type        : 'boolean'
            },            
            sectionsIn : {
                title       : 'Sections Included',
                description : 'Sections to be shown (comma-separated list of section titles)',
                default     : '',
                type        : 'array'
            },  
            sectionsEx : {
                title       : 'Sections Excluded',
                description : 'Sections to be hidden (comma-separated list of section titles)',
                default     : '',
                type        : 'array'
            },  
            sectionsOrder : {
                title       : 'Sections Order',
                description : 'Provide titles of sections in order to be displayed',
                default     : '',
                type        : 'array'
            },
            showAsCloneDialog : {
                title       : 'Show As Clone Dialog',
                description : "Open as clone dialog",
                default     : false,
                type        : 'boolean'
            },            
            suppressLinks : {
                title       : 'Suppress Links',
                description : 'Hides links of linking picklists',
                default     : false,
                type        : 'boolean'
            },   
        },

        files : {
            extensionsEx : {
                title       : 'Extensions Excluded',
                description : "List of file extensions to hide (e.g. ['iam','ipt'])",
                default     : '',
                type        : 'array'
            },
            extensionsIn : {
                title       : 'Extensions Included',
                description : "List of file extensions to display (others are hidden)",
                default     : '',
                type        : 'array'
            },  
            includeRelatedFiles : {
                title       : 'Include Related Files',
                description : 'Also display attachments related to the item',
                default     : false,
                type        : 'boolean'
            },
            includeVaultFiles : {
                title       : 'Include Vault Files',
                description : 'Also display Vault files for the matching item',
                default     : false,
                type        : 'boolean'
            },                      
            download : {
                title       : 'Download',
                description : 'Enable file download from PLM (requires permission)',
                default     : true,
                type        : 'boolean'
            },
            fileSize : {
                title       : 'File Size',
                description : 'Show the file size in the attachments panel',
                default     : true,
                type        : 'boolean'
            },
            fileVersion : {
                title       : 'File Version',
                description : 'Show the file version in the attachments panel',
                default     : true,
                type        : 'boolean'
            },
            folders : {
                title       : 'Show Folders',
                description : "Display and groups files by folders",
                default     : false,
                type        : 'boolean'
            },            
            uploadScreenshot : {
                title       : 'Upload Screenshot',
                description : 'With a viewer on the same page enable uploading of screenshot as attachments (when editable is enabled)',
                default     : false,
                type        : 'boolean'
            },             
            uploadScreenshotLabel : {
                title       : 'Upload Screenshot Label',
                description : 'Label of the upload-screenshot button on the attachments panel',
                default     : 'Save Screenshot',
                type        : 'string'
            },
            splitFileName : {
                title       : 'Split Filename',
                description : 'Split the filenames by name and suffix',
                default     : false,
                type        : 'boolean'
            },
        },     

        tree : {
            bomViewSelector : {
                title       : 'BOM View Selector',
                description : 'Adds drop down with available BOM views',
                default     : false,
                type        : 'boolean',
            },                
            endItemFieldId : {
                title       : 'End Item Field ID',
                description : 'Prevents expansion of end items, recognized by given field ID and matching "End Item Field Value"',
                default     : '',
                type        : 'string'
            },
            endItemFieldValue : {
                title       : 'End Item Field Value',
                description : 'Prevents expansion of end items, recognized by defined value and field set with "End Item Field ID"',
                default     : '',
                type        : 'string'
            },
            goThere : {
                title       : 'Go There',
                description : 'Lets users open the same view for the selected tree item',
                default     : false,
                type        : 'boolean'
            },
            hideTreeHeader : {
                title       : 'Hide Tree Header',
                description : "Hides tree header row",
                default     : false,
                type        : 'boolean'
            },
            hideTreeColumns : {
                title       : 'Hide Tree Columns',
                description : 'Hide all table columns except the descriptor (use for navigation trees)',
                default     : false,
                type        : 'boolean'
            },
            hideTreeNumber : {
                title       : 'Hide Tree Number',
                description : "Hides BOM row numbers",
                default     : false,
                type        : 'boolean'
            },                    
            hideDescriptor : {
                title       : 'Hide Descriptor',
                description : "Hides descriptor column",
                default     : false,
                type        : 'boolean'
            },    
            hideDescriptorRev : {
                title       : 'Hide Descriptor Rev',
                description : "Hides revision in descriptor column",
                default     : false,
                type        : 'boolean'
            },    
            selectUnique : {
                title       : 'Select Unique',
                description : 'When selecting BOM rows, deduplicate by item link',
                default     : true,
                type        : 'boolean'
            },
            treeShowQuantity : {
                title       : 'Show Quantity',
                description : 'Display the BOM quantity column',
                default     : false,
                type        : 'boolean'
            },
            treeShowRestricted : {
                title       : 'Show Restricted',
                description : 'Show restricted (access-controlled) BOM rows',
                default     : false,
                type        : 'boolean'
            },            
            treePath : {
                title       : 'Show Path',
                description : "Display the selected component's BOM path for quick parent access",
                default     : false,
                type        : 'boolean'
            },
            treePathTitle : {
                title       : 'Path Title',
                description : "Label shown above the BOM path ('auto' resolves dynamically)",
                default     : 'auto',
                type        : 'string'
            },
            reset : {
                title       : 'Reset',
                description : 'Add a reset button so users can clear selection and filters',
                default     : false,
                type        : 'boolean'
            }    
        },

        grid : {
            autoSave : {
                title       : 'Auto Save',
                description : 'Saves edits in the panel automatically when the user changes a value',
                default     : false,
                type        : 'boolean'
            },
            hideButtonClone : {
                title       : 'Hide Button Clone',
                description : 'Hide the panel toolbar Clone button',
                default     : false,
                type        : 'boolean'
            },
            hideButtonCreate : {
                title       : 'Hide Button Create',
                description : 'Hide the panel toolbar Create button',
                default     : false,
                type        : 'boolean'
            },
            rotate : {
                title       : 'Rotate Grid',
                description : 'Rotate the grid layout (swap columns and rows)',
                default     : false,
                type        : 'boolean'
            },
        },

        history : {
            finalStates : {
                title       : 'Final States',
                description : "List of state labels considered terminal in workflow history (e.g. Complete,Closed)",
                default     : '',
                type        : 'array'
            },            
            showNextTransitions : {
                title       : 'Show Next Transitions',
                description : 'In workflow history, also show transitions available from the current state',
                default     : true,
                type        : 'boolean'
            },
            transitionsEx : {
                title       : 'Transitions Excluded',
                description : "Array of transition labels to hide in workflow history (e.g. ['Cancel','Delete'])",
                default     : '',
                type        : 'array'
            },
            transitionsIn : {
                title       : 'Transitions Included',
                description : 'Array of transition labels to show in workflow history (others hidden)',
                default     : '',
                type        : 'array'
            },            
        },

        log : {
            actionsIn : {
                title       : 'Actions Included',
                description : 'List of Change Log action types to display (others are hidden)',
                default     : '',
                type        : 'array'
            },
            actionsEx : {
                title       : 'Actions Excluded',
                description : 'List of Change Log action types to hide from the panel',
                default     : '',
                type        : 'array'
            },
            usersIn : {
                title       : 'Users Included',
                description : 'Array of user names whose change-log entries should be shown (others hidden)',
                default     : '',
                type        : 'array'
            }, 
            usersEx : {
                title       : 'Users Excluded',
                description : 'Array of user names whose change-log entries should be hidden',
                default     : '',
                type        : 'array'
            },
        },

        summary : {
            hideCloseButton : {
                title       : 'Hide Close Button',
                description : "Hides the panel close button (e.g. so a parent screen can drive show/hide instead)",
                default     : false,
                type        : 'boolean'
            },
            hideSubtitle : {
                title       : 'Hide Subtitle',
                description : 'Hide the item subtitle in the item summary header',
                default     : false,
                type        : 'boolean'
            },
            includeViewer : {
                title       : 'Include Viewer',
                description : 'When enabled, a viewer panel will be added to the item summary',
                default     : false,
                type        : 'boolean'
            },
            saveTabSelection : {
                title       : 'Save Tab Selection',
                description : 'When switching items, restore the previously selected tab (layout "tabs" only)',
                default     : false,
                type        : 'boolean'
            },
            selectedTab : {
                title       : 'Select Tab',
                description : 'Define tab to select at startup by name (applies only when summaryLayout equals "tabs")',
                default     : '',
                type        : 'string'
            },
            summaryContents : {
                title       : 'Summary Contents',
                description : 'Sets the panels of the item summary',
                default     : '',
                type        : 'array'
            },
            summaryLayout : {
                title       : 'Layout',
                description : 'Item Summary Layout',
                default     : 'dashboard',
                type        : 'select',
                list        : [ 'dashboard', 'sections', 'tabs' ]
            },  
            wrapControls : {
                title       : 'Wrap Controls',
                description : 'Prevent wrapping of controls in the panel summary header',
                default     : false,
                type        : 'boolean'
            },                        
        },

        sorting : {
            sortBy : {
                title       : 'Sort By',
                description : "Field ID by which the result list will be sorted at load (e.g. 'DESCRIPTOR')",
                default     : '',
                type        : 'string'
            }, 
            sortDirection : {
                title       : 'Sort Direction',
                description : 'Sort direction for the grid view',
                default     : 'ascending',
                type        : 'select',
                list        : ['ascending', 'descending']
            },
            sortSelection : {
                title       : 'Sort Selection',
                description : 'Move selected entries to the top of the class contents list',
                default     : true,
                type        : 'boolean'
            },            
            sortType : {
                title       : 'Sort Type',
                description : 'Field type used for sort comparisons in the grid view',
                default     : 'string',
                type        : 'select',
                list        : ['string', 'number', 'date']
            },
            sortOrder : {
                title       : 'Sort Order',
                description : 'Array of {sortBy,sortDirection,sortType} for multi-level sort',
                default     : [],
                type        : 'textarea'
            }        
        },

        // events : {
        //     onClickClose : {
        //         title       : 'On Click Close',
        //         description : "User clicks the panel's close button",
        //         default     : [],
        //         default     : 'function(id, link) {}',
        //         type        : 'function'
        //     }
        // },

        dnd : {
            dragable : {
                title       : 'Dragable',
                description : 'When enabled, content items can be dragged (triggers onDragStart & onDragEnd)',
                default     : false,
                type        : 'boolean'
            },
            onDragStart : {
                title       : 'onDragStart',
                description : 'Function to invoke when dragging starts',
                default     : 'onDragStart(event)',
                type        : 'string'
            },
            onDragEnd : {
                title       : 'onDragEnd',
                description : 'Function to invoke when dragging ends',
                default     : 'onDragEnd(event)',
                type        : 'string'
            },
            dropable : {
                title       : 'Dropable',
                description : 'When enabled, elements can be dropped on content items (trigers onDragEnter, onDragOver, onDragLeave, onDrop)',
                default     : false,
                type        : 'boolean'
            },
            onDragEnter : {
                title       : 'onDragEnter',
                description : 'Function to invoke when element is dragged over content item',
                default     : 'onDragEnter(event)',
                type        : 'string'
            },
            onDragOver : {
                title       : 'onDragOver',
                description : 'Function to invoke while element is dragged over content item',
                default     : 'onDragOver(event)',
                type        : 'string'
            },
            onDragLeave : {
                title       : 'onDragLeave',
                description : 'Function to invoke when dragging mode is left',
                default     : 'onDragLeave(event)',
                type        : 'string'
            },
            onDrop : {
                title       : 'onDrop',
                description : 'Function to invoke element is dropped',
                default     : 'onDrop(event)',
                type        : 'string'
            },                        
        },

        classes : {
            advancedFilter : {
                title       : 'Advanced Filter',
                description : 'Enable advanced class-property filter inputs',
                default     : true,
                type        : 'boolean'
            },
            idContents : {
                title       : 'Class Contents Panel ID',
                description : 'DOM id of the class-contents panel that this filter panel should drive',
                default     : 'contents',
                type        : 'string'
            }
        },

        others : {
            additionalData : {
                title       : 'Additional Data',
                description : 'Select list of fields whose value should be stored as property on the matching DOM elements',
                default     : [],
                type        : 'array'
            },
            attributes : {
                title       : 'Attributes',
                description : 'Array of {fieldId,name} for each DOM element',
                default     : [],
                type        : 'array'
            },
            autoClick : {
                title       : 'Auto Click',
                description : 'Automatically click the first entry once contents have been loaded',
                default     : false,
                type        : 'boolean'
            },           
            baseQuery : {
                title       : 'Base Query',
                description : 'Query expression appended to the user search input (joined with +AND+)',
                default     : '',
                type        : 'string'
            },   
            bookmark : {
                title       : 'Bookmark',
                description : "Adds bookmark toggle to the panel header",
                default     : false,
                type        : 'boolean'
            },
            displayParentsBOM : {
                title       : 'Display Parents BOM',
                description : "Allow expanding each parent node to its first-level BOM to access the item's siblings",
                default     : false,
                type        : 'boolean'
            },
            downloadFiles : {
                title       : 'Download Files',
                description : 'Enable BOM-wide file download (requires permission)',
                default     : false,
                type        : 'boolean'
            },
            downloadRequests : {
                title       : 'Download Parallel Requests',
                description : 'Maximum number of parallel download processes',
                default     : 3,
                type        : 'integer'
            },
            downloadPatterns : {
                title       : 'Download Patterns',
                description : 'Enable BOM-wide file download (requires permission)',
                default     : '[]',
                type        : 'array'
            },
            downloadFormats : {
                title       : 'Download Formats',
                description : 'Defines the file format filters available when downloading files',
                default     : [
                    { label : 'PDF'   , filter : ['.pdf']         , tooltip : '' },
                    { label : 'STEP'  , filter : ['.step', '.stp'], tooltip : 'File suffix stp and step will be taken into account' },
                    { label : 'Office', filter : ['.docx', '.doc', 'xls', 'xlsx', 'ppt', 'pptx'], tooltip : 'This will download all files with suffix doc, docx, xls, xlsx, ppt and pptx' },
                ],
                type        : 'array'
            },
            editable : {
                title       : 'Editable',
                description : "Enables edit controls, depending on user's permissions",
                default     : false,
                type        : 'boolean'
            },
            disconnectButtonIcon : {
                title       : 'Disconnect Button Icon',
                description : 'Icon class for the Disconnect/Remove button',
                default     : 'icon-list-remove',
                type        : 'string'
            },
            disconnectButtonLabel : {
                title       : 'Disconnect Button Label',
                description : 'Label for the Disconnect/Remove button',
                default     : 'Remove Selected',
                type        : 'string'
            },
            getDetails : {
                title       : 'Get Details',
                description : "Once processing finished, get details of defined / new item",
                default     : false,
                type        : 'boolean'
            },
            groupBy : {
                title       : 'Group By',
                description : "Field ID of the column whose value should be used to group records (e.g. 'PDM_CATEGORY')",
                default     : '',
                type        : 'string'
            },
            groupLayout : {
                title       : 'Group Layout',
                description : 'When groupBy is set, choose how the groups are laid out',
                default     : 'vertical',
                type        : 'select',
                // list        : ['column', 'row', 'horizontal', 'vertical']
                list        : [ 'horizontal', 'vertical' ]
            },
            hideButtonDisconnect : {
                title       : 'Hide Button Disconnect',
                description : 'Hide the panel toolbar Disconnect/Remove button',
                default     : false,
                type        : 'boolean'
            },                  
            hideButtonLabels : {
                title       : 'Hide Button Labels',
                description : 'Display only icons on buttons; labels become tooltips',
                default     : false,
                type        : 'boolean'
            },            
            hideDetails : {
                title       : 'Hide Detail Columns',
                description : 'Hide all table columns except the descriptor (use for navigation trees)',
                default     : false,
                type        : 'boolean'
            },   
            hideParentNodes : {
                title       : 'Hide Parent Nodes',
                description : 'When true, hides tree parent nodes and shows leaf items only (flat list)',
                default     : false,
                type        : 'boolean'
            },                    
            includeBookmarks : {
                title       : 'Include Bookmarks',
                description : 'Add Bookmarks as an entry of the view drop down',
                default     : false,
                type        : 'boolean'
            },
            includeMOW : {
                title       : 'Include My Outstanding Work',
                description : 'Add My Outstanding Work as an entry of the view drop down',
                default     : false,
                type        : 'boolean'
            },
            includeRecents : {
                title       : 'Include Recently Viewed',
                description : 'Add Recently Viewed Items as an entry of the view drop down',
                default     : false,
                type        : 'boolean'
            },
            openOnDblClick : {
                title       : 'Open On Double Click',
                description : 'Open the selected item in PLM when the user double-clicks',
                default     : false,
                type        : 'boolean'
            },           
            picklistLimit : {
                title       : 'Picklist Limit',
                description : 'Number of items retrieved for picklist fields',
                default     : 10,
                type        : 'integer'
            },
            picklistShortcuts : {
                title       : 'Picklist Shortcuts',
                description : 'When true users can pick from bookmarks/recent items in matching picklist fields',
                default     : false,
                type        : 'boolean'
            },  
            saveButtonLabel : {
                title       : 'Save Button Label',
                description : 'Label for the Save button shown by editable panels',
                default     : 'Save',
                type        : 'string'
            },                      
            searchInputLabel : {
                title       : 'Search Input Label',
                description : 'Placeholder text for the search criteria input',
                default     : 'Enter search criteria',
                type        : 'string'
            },        
            searchButtonIcon : {
                title       : 'Search Button Icon',
                description : 'Icon class for the search button',
                default     : 'icon-search',
                type        : 'string'
            }, 
            searchButtonLabel : {
                title       : 'Search Button Label',
                description : 'Label for the search button',
                default     : 'Search',
                type        : 'string'
            },  
            searchInFields : {
                title       : 'Search In Fields',
                description : "List of fieldIds in which the provided value will be searched",
                default     : [ 'DESCRIPTOR' ],
                type        : 'array'
            },  
            searchReturnFields : {
                title       : 'Search Return Fields',
                description : "List of fieldIds to be retrieved by the search (e.g. DESCRIPTOR,TITLE)",
                default     : [ 'DESCRIPTOR' ],
                type        : 'array'
            },  
            searchForExactMatch : {
                title       : 'Search For Exact Match',
                description : 'When true the search string must match exactly. When false, wildcards are appended automatically.',
                default     : false,
                type        : 'boolean'
            },            
            searchBaseFilters : {
                title       : 'Search Base Filters',
                description : 'Static filters always applied in addition to the typed search (insertResults filter shape)',
                default     : '',
                type        : 'textarea'
            },
            searchLogicClause : {
                title       : 'Logic Clause',
                description : "Join logic for search filters ('AND' / 'OR'); blank derives automatically",
                default     : 'AND',
                type        : 'select',
                list        : ['AND', 'OR']
            },                  
            searchLatestOnly : {
                title       : 'Search Latest Only',
                description : "Will return latest revisions only when enabled",
                default     : false,
                type        : 'boolean'
            },
            searchReleasedOnly : {
                title       : 'Search Released Only',
                description : "Will return released itemss only when enabled",
                default     : false,
                type        : 'boolean'
            },
            searchWorkingOnly : {
                title       : 'Search Working Only',
                description : "Search for working versions only",
                default     : false,
                type        : 'boolean'
            },
            hideWorking : {
                title       : 'Hide Working',
                description : "Hide working versions",
                default     : false,
                type        : 'boolean'
            },
            stateColors : {
                title       : 'State Colors',
                description : 'Array of state/color definitions to highlight rows by workflow status (e.g. { "state":"Sales", "color":"#009c00" } )',
                default     : [],
                type        : 'array'
            },              
            limit : {
                title       : 'Limit',
                description : 'Maximum number of records to retrieve at initial load',
                default     : 25,
                type        : 'integer'
            }, 
            pagination : {
                title       : 'Pagination',
                description : 'Enables pagination controls when more records are available than the limit',
                default     : true,
                type        : 'boolean'
            },                         
            startupView : {
                title       : 'Startup View',
                description : "Name of the workspace view to load at startup (overrides the user's preference)",
                default     : '',
                type        : 'string'
            },                                           
            toggles : {
                title       : 'Toggles',
                description : 'Adds toggles to expand / collapse contents',
                default     : false,
                type        : 'boolean'
            },  
            workflowActions : {
                title       : 'Workflow Actions',
                description : "Add the Workflow Actions menu to panel header",
                default     : false,
                type        : 'boolean'
            },
            viewSelector : {
                title       : 'View Selector',
                description : 'Enable the drop down for selecting from available workspace views',
                default     : true,
                type        : 'boolean'
            },     
            viewerSelection : {
                title       : 'Viewer Selection',
                description : 'If a viewer is present on the same page, highlight matching parts when items are selected',
                default     : false,
                type        : 'boolean'
            },                   
            workspaceIds : {
                title       : 'Workspace IDs',
                description : 'Array of workspace IDs to restrict the search to (overrides workspacesIn)',
                default     : '',
                type        : 'array'
            },
            wsIdChangesProcess : {
                title       : 'Change Process Workspace ID',
                description : 'Workspace ID of the change process used to resolve related changed items',
                default     : '84',
                type        : 'string'
            },            
        },

    }

}


function getPanelSettings(name, params, inputs) {

    if(isBlank(params)) params = {};
    if(isBlank(inputs)) inputs = {};

    const panelType = getRegistryPanelType(name);
    const link      = inputs.link || '';
    const id        = params.id || panelType.defaults.id;

    settings[id]                 = getRegistryPanelSettings(params, panelType, link);
    settings[id].load            = function() { window[name + 'Data'](id); }
    settings[id].panelClassName  = panelType.className    || '';
    settings[id].afterCompletion = params.afterCompletion || function(id) { }
    settings[id].onClickItem     = params.onClickItem     || function(elemClicked) { }
    settings[id].onDblClickItem  = params.onDblClickItem  || null;

    for(let input of panelType.inputs) {

        let key = input.id;
        settings[id][key] = inputs[key] || input.default

    }

    if(settings[id].toggleBodyClass !== '') $('body').addClass(settings[id].toggleBodyClass);

    return id;

}
function getRegistryPanelType(name) {

    for(let panelType in registry.panelTypes) {
        for(let entry of registry.panelTypes[panelType]) {
            if(entry.id === name) return entry;
        }
    }

    return null;

}
function getRegistryPanelSettings(params, panelType, link) {

    let panelSettings = {};

    getPanelStandardOptions   (panelSettings, params, panelType);
    getPanelFieldIDs          (panelSettings, params, panelType);
    getPanelData              (panelSettings, params, panelType);
    getPanelFilters           (panelSettings, params, panelType);
    getPanelAdditionalOptions (panelSettings, params, panelType);
    removeExcludedOptions     (panelSettings, params, panelType);

    if(panelSettings.collapsePanel) panelSettings.headerToggle = true;

    if(debugMode) console.log(panelSettings);

    panelSettings.mode = 'initial';
    
    return panelSettings;

}
function getPanelStandardOptions(panelSettings, params, panelType) {

    const defaults   = panelType.defaults;
    const categories = Object.keys(registry.panelStandardOptions);

    for(let category of categories) {

        let properties = Object.keys(registry.panelStandardOptions[category]);

        for(let property of properties) {
            panelSettings[property] = params[property] || ((typeof defaults[property] !== 'undefined') ? defaults[property] : registry.panelStandardOptions[category][property].default);
        }

    }

}
function getPanelFieldIDs(panelSettings, params, panelType) {

    if(typeof panelType.fieldIDs === 'undefined') return;
    if(typeof    params.fieldIDs === 'undefined') params.fieldIDs = {};

    panelSettings.fieldIDs = {};

    for(let fieldId of panelType.fieldIDs) {
        panelSettings.fieldIDs[fieldId.key] = params.fieldIDs[fieldId.key] || fieldId.default;
    }

}
function getPanelData(panelSettings, params, panelType) {

    if(typeof panelType.data === 'undefined') return;

    for(let data of panelType.data) {
        panelSettings[data] = params[data] || registry.panelData[data].default;
    }

}
function getPanelFilters(panelSettings, params, panelType) {

    panelSettings.panelFilters = [];

    if(typeof panelType.filters === 'undefined') return;

    for(let filter of panelType.filters) {
        
        let panelFilter = registry.panelFilters[filter];
        
        panelSettings.panelFilters.push([
            panelFilter.control,
            filter,
            panelFilter.key,
            panelFilter.label
        ]);

        panelSettings[filter] = params[filter] || panelFilter.default;

    }

}
function getPanelAdditionalOptions(panelSettings, params, panelType) {

    if(isBlank(panelType.additional)) return;

    const additional = panelType.additional;
    const categories = Object.keys(registry.panelAdditionalOptions);

    for(let key of additional) {
        for(let category of categories) {
            let properties = Object.keys(registry.panelAdditionalOptions[category]);
            if(properties.includes(key)) {
                if(typeof params[key] === 'undefined') {
                    if(Array.isArray(registry.panelAdditionalOptions[category][key].default)) {
                        panelSettings[key] = Array.from(registry.panelAdditionalOptions[category][key].default);
                    } else panelSettings[key] = panelType.defaults[key] ?? registry.panelAdditionalOptions[category][key].default;
                } else panelSettings[key] = params[key] ;
            }
        }
    }

}
function removeExcludedOptions(panelSettings, params, panelType) {

    const excluded = panelType.excluded;

    if(!isBlank(excluded)) {
        for(let key of excluded) {
            delete panelSettings[key];
        }
    } 

}