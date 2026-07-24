const registry = {

    panelTypes : {
        navigation : [
            {   // insertMOW
                id          : 'insertMOW',
                description : "Shows the signed-in user's My Outstanding Work: the workflow tasks currently assigned to them across all workspaces, with optional filtering by due date, status and workspace. Use it as the personal to-do list on a landing page.",
                usage       : "Use on a personal landing or home screen so each user immediately sees the workflow tasks waiting on them. Typical cases: a 'My Work' dashboard, or the first tab of a role-based home page. Enable the due-date, status and workspace filters when users juggle many tasks across processes.",
                inputs      : [],
                defaults    : {
                    headerLabel : 'My Outstanding Work',
                    layout      : 'table'
                },
                filters     : [ 'filterByDueDate', 'filterByStatus', 'filterByWorkspace' ],
                additional  : [ 'timeout', 'userId' ],
                excluded    : [ 'openInPLM' ]
            },{ // insertNewTasks
                id          : 'insertNewTasks',
                description : "Displays the tasks assigned to the current user awaiting acknowledgement / acceptance",
                usage       : "Use on a personal landing or home screen so each user immediately sees the workflow tasks waiting on them. Typical cases: a 'My Work' dashboard, or the first tab of a role-based home page. Enable the due-date, status and workspace filters when users juggle many tasks across processes.",
                inputs      : [{
                    id          : 'wsId',
                    title       : 'Workspace ID',
                    description : 'Workspace ID of items to display',
                    default     : '211',
                    type        : 'string',
                    required    : true
                },{
                    id          : 'filters',
                    title       : 'Filters',
                    description : 'List of filters to apply when retrieving new tasks list',
                    default     : [{"field" : "TITLE","type" : "0","comparator" : "contains" ,"value" : "r"}],
                    type        : 'textarea',
                    required    : true
                }],
                defaults    : {
                    headerLabel : 'New Tasks',
                    layout      : 'list',
                    contentSize : 'm',
                    transitions : [
                        { id : 'ACCEPT'       , icon : 'icon-check'      , class : ''       , title : 'Accept Task'  }, 
                        { id : 'SET_ON_HOLD_1', icon : 'icon-undo'       , class : 'red'    , title : 'Return Task'  },
                        { id : 'FINISH_3'     , icon : 'icon-flag-finish', class : 'default', title : 'Set Complete' } 
                    ]
                },
                filters     : [ ],
                fieldIDs    : [
                    { key : 'root'         , default : 'PROJECT_NUMBER'         , description : 'Parent element used for grouping' },
                    { key : 'id'           , default : 'ID'                     , description : 'Unique identifier / number of each task' },
                    { key : 'title'        , default : 'TITLE'                  , description : 'Title field of tasks' },
                    { key : 'description'  , default : 'DESCRIPTION'            , description : 'Task Description' },
                    { key : 'priority'     , default : 'PRIORITY'               , description : 'Task Priority' },
                    { key : 'start'        , default : 'PLANNED_START_DATE'     , description : 'Target Start Date' },
                    { key : 'end'          , default : 'PLANNED_COMPLETION_DATE', description : 'Target End Date' },
                    { key : 'duration'     , default : 'PLANNED_DURATION'       , description : 'Target Duration' },
                    { key : 'plannedEffort', default : 'PLANNED_EFFORT'         , description : 'Planned total effort' },
                    { key : 'weeklyEffort' , default : 'EFFORT_BY_WEEK'         , description : 'Planned weekly effort' },
                ],
                additional : [ 'pageSize', 'sortBy', 'tileImage', 'transitions' ],
                excluded   : [ 'layout' ] 
            },{ // insertTasksManager
                id          : 'insertTasksManager',
                description : "Displays the tasks assigned to the current user with advanced controls for effort and progress management",
                usage       : "Use on a personal landing or home screen so each user immediately sees the workflow tasks waiting on them. Typical cases: a 'My Work' dashboard, or the first tab of a role-based home page. Enable the due-date, status and workspace filters when users juggle many tasks across processes.",
                inputs      : [{
                    id          : 'wsId',
                    title       : 'Workspace ID',
                    description : 'Workspace ID of items to display',
                    default     : '211',
                    type        : 'string',
                    required    : true
                },{                    
                    id          : 'filters',
                    title       : 'Filters',
                    description : 'List of filters to apply when retrieving new tasks list',
                    default     : [{"field" : "TITLE","type" : "0","comparator" : "contains" ,"value" : "r"}],
                    type        : 'textarea',
                    required    : true
                }],
                defaults    : {
                    headerLabel : 'Tasks Manager',
                    layout      : 'list',
                    contentSize : 'custom',
                    transitions : [
                        { value :  '20', id : 'SET_PROGRESS_20' },
                        { value :  '40', id : 'SET_PROGRESS_40' },
                        { value :  '60', id : 'SET_PROGRESS_60' },
                        { value :  '80', id : 'SET_PROGRESS_80' },
                        { value : '100', id : 'FINISH_1'        }  
                    ]
                },
                filters     : [ ],
                fieldIDs    : [
                    { key : 'root'         , default : 'PROJECT_NUMBER'         , description : 'Parent element used for grouping' },
                    { key : 'id'           , default : 'ID'                     , description : 'Unique identifier / number of each task' },
                    { key : 'title'        , default : 'TITLE'                  , description : 'Title field of tasks' },
                    { key : 'description'  , default : 'DESCRIPTION'            , description : 'Task Description' },
                    { key : 'priority'     , default : 'PRIORITY'               , description : 'Task Priority' },
                    { key : 'start'        , default : 'PLANNED_START_DATE'     , description : 'Target Start Date' },
                    { key : 'end'          , default : 'PLANNED_COMPLETION_DATE', description : 'Target End Date' },
                    { key : 'duration'     , default : 'PLANNED_DURATION'       , description : 'Target Duration' },
                    { key : 'plannedEffort', default : 'PLANNED_EFFORT'         , description : 'Planned total effort' },
                    { key : 'actualEffort' , default : 'ACTUAL_EFFORT'          , description : 'Actual total effort' },
                    { key : 'startEffort'  , default : 'EFFORT_START_WEEK'      , description : 'Planned effort in first week' },
                    { key : 'weeklyEffort' , default : 'EFFORT_BY_WEEK'         , description : 'Planned weekly effort' },
                    { key : 'endEffort'    , default : 'EFFORT_END_WEEK'        , description : 'Planned effort in last week' },
                    { key : 'progress'     , default : 'PERCENT_COMPLETE'       , description : 'Task progression defined by percentage completed' },
                    { key : 'lastComment'  , default : 'LAST_COMMENT'           , description : 'Last commment provided by task assignee' },
                    { key : 'lastUpdate'   , default : 'LAST_UPDATE'            , description : 'Date of last status upodate by task assignee' },
                ],
                additional : [ 'sortBy', 'wsId' ],
                excluded   : [ 'contentSize', 'layout' ] 
            },{ // insertRecentItems
                id          : 'insertRecentItems',
                description : "Shows the items the user has most recently opened, as a quick-access list for jumping back into recent work.",
                usage       : "Use to give users a fast way back to items they were just working on, without searching again. Good on a home screen or in a side rail next to a details view. Pair it with insertSearch and insertBookmarks for a complete quick-access area.",
                inputs      : [],
                defaults    : {
                    headerLabel : 'Recently Viewed Items',
                    layout      : 'list',
                    contentSize : 'xs',
                    tileIcon    : 'icon-history'
                },
                filters     : [  'filterByWorkspace' ],                
                additional  : []              
            },{ // insertBookmarks
                id          : 'insertBookmarks',
                description : "Shows the items the user has bookmarked (favourited), giving one-click access to the records they return to most often.",
                usage       : "Use to surface the items a user has explicitly flagged as important, for one-click return. Best on a home screen or navigation rail. Choose this over Recent Items when users curate a stable working set rather than relying on recency.",
                inputs      : [],
                defaults    : {
                    headerLabel : 'Bookmarks',
                    layout      : 'list',
                    contentSize : 'xs',
                    tileImage   : true
                },
                filters     : ['filterByWorkspace'],
                additional  : []
            },{ // insertWorkspaceViews
                id          : 'insertWorkspaceViews',
                description : "Shows the saved Views of a workspace (e.g. 'All Items', 'My Items') and lets the user switch between them to browse that workspace's records. Can optionally fold in My Outstanding Work, Bookmarks and Recent Items as extra views.",
                usage       : "Use to let users browse a workspace through its predefined Views and switch between them. Ideal as the main navigator of a workspace-centric app. Fold in MOW, Bookmarks and Recents as extra views when you want a single combined navigation panel.",
                inputs      : [{
                    title       : 'Workspace ID',
                    description : 'ID of the workspace for which the views should be listed',
                    default     : '57',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel  : '',
                    layout       : 'table',
                    contentSize  : 'm',
                    tileTitle    : 'DESCRIPTOR',
                    tileSubtitle : 'WF_CURRENT_STATE',
                },
                filters    : [],
                additional : [
                    'additionalData',
                    'limit',
                    'includeBookmarks', 'includeMOW', 'includeRecents',
                    'startupView',
                    'viewSelector'
                ],
                excluded   : [ 'headerTopLabel', 'headerSubLabel', ]
            },{ // insertSearch
                id          : 'insertSearch',
                description : "A cross-workspace search box: finds items by descriptor across the entire tenant and lists the matches (descriptor, workspace, owner). Use it as a global 'find any item' control.",
                usage       : "Use as the global 'find anything' box when users do not know which workspace an item lives in - it searches descriptors tenant-wide. Good on a home screen or in a picker. If results must come from one workspace and show its own fields, use insertWorkspaceSearch instead.",
                inputs      : [],
                defaults    : {
                    headerLabel  : 'Search',
                    placeholder  : 'Filter results',
                    layout       : 'list',
                    contentSize  : 'xs',
                    tileTitle    : 'Descriptor',
                    tileSubtitle : 'Workspace',
                },
                filters     : [ 'filterByOwner', 'filterByWorkspace' ],
                additional  : [
                    'autoClick',
                    'baseQuery',
                    'exactMatch',
                    'inputLabel',
                    'limit',
                    'searchButtonIcon', 'searchButtonLabel', 'sortBy',
                    'workspaceIds'
                ]
            },{ // insertWorkspaceSearch
                id          : 'insertWorkspaceSearch',
                description : "A search box scoped to a single workspace: finds items by one or more configurable field values (via /plm/search) and lists the matches as that workspace's columns. Use it instead of insertSearch when results must come from one workspace and show its own fields.",
                usage       : "Use when search must be limited to a single workspace and results should display that workspace's columns (it queries /plm/search). Typical cases: a workspace-specific finder, or a component picker that filters on a particular field. Configure searchFields to control which field(s) the typed text matches.",
                inputs      : [{
                    title       : 'Workspace ID',
                    description : 'ID of the workspace for which the views should be listed',
                    default     : '57',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel      : 'Search',
                    placeholder      : 'Filter results',
                    layout           : 'list',
                    contentSize      : 'xs',
                    tileTitle        : 'DESCRIPTOR',
                    tileSubtitle     : '',
                    tileImageFieldId : 'IMAGE',
                    inputLabel       : 'Enter search criteria',
                    buttonIcon       : 'icon-search',
                    buttonLabel      : 'Search',
                    limit            : 25,
                    searchFields     : ['DESCRIPTOR'],
                    fields           : ['DESCRIPTOR'],
                    sortBy           : ['DESCRIPTOR']
                },
                additional : [
                    'searchButtonIcon', 'searchButtonLabel', 'sortBy'
                    //                     [ 'inputLabel'        , 'Enter search critieria' ],
                    // [ 'buttonIcon'        , 'icon-search' ],
                    // [ 'buttonLabel'       , 'Search' ],
                    // [ 'limit'             , 25 ],
                    // [ 'baseQuery'         , '' ],
                    // [ 'sortBy'            , '' ],
                    // [ 'workspaceIds'      , [] ],
                    // [ 'exactMatch'        , false ],
                    // [ 'autoClick'         , false ],
                    // [ 'filterByOwner'     , false ],
                    // [ 'filterByWorkspace' , false ],
                    // [ 'fields' , ['DESCRIPTOR'] ],
                    // [ 'searchFields' , ['DESCRIPTOR'] ],
                ]
            },{ // insertResults
                id          : 'insertResults',
                description : "Shows the items matching a fixed query (workspace + filters) supplied by the developer - a results list with no search box. Use it to display a predetermined set of items.",
                usage       : "Use to display a fixed, developer-defined query (workspace plus filters) with no search box - the panel just shows the matching items. Typical cases: 'Items pending my approval', 'Parts in this project', or dashboard widgets. Set the filters in configuration; users only see and act on the results.",
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
                    contentSize      : 'xs',
                    headerLabel      : 'Results',
                    layout           : 'table',
                    tileTitle        : 'DESCRIPTOR',
                    tileSubtitle     : '',
                    // tileImageFieldId : 'IMAGE',
                    // sortBy           : ['DESCRIPTOR']
                },
                filters     : [ 'filterEmpty', 'filterByStatus'],
                // filters     : [ 'filterEmpty' ],
                additional  : [ 'additionalData', 'searchFields' ]
            }
        ],
        creation : [
            {   // insertCreate
                title       : 'insertCreate()',
                function    : 'insertCreate',
                id          : 'create',
                description : "Renders the item-creation form for one or more workspaces, letting the user enter field values and create a new item. Supports pre-filled values, context links to other items, clone dialogs and running a workflow transition on creation.",
                usage : "Use to embed an item-creation form directly in an app so users can add records without leaving it. Typical cases: a 'New Problem Report' dialog, guided creation wizards, or creating a child item pre-linked to a parent (via the context options). Use the clone and transition options for copy-from-existing or create-and-submit flows.",
                inputs : [{
                    title       : 'Workspace Names',
                    description : 'List of possible workspaces (names separated by comma)',
                    default     : 'Problem Reports',
                    type        : 'array',
                    required    : true
                },{
                    title       : 'Workspace IDs',
                    description : 'List of possible workspaces (provide IDs as alternative to WS Names)',
                    default     : '',
                    type        : 'array',
                    required    : true
                }],
                defaults    : {
                    headerLabel       : 'Create New',
                    layout            : 'normal',
                    showInDialog      : false,
                    hideComputed      : true,
                    picklistLimit     : 10,
                    picklistShortcuts : true,
                    createButtonLabel : 'Create'
                },
                options : [
                    'collapseContents', 'collapsePanel',
                    'createButtonIcon', 'createButtonLabel',
                    'expandSections',
                    'fieldsEx', 'fieldsIn',
                    'firstSectionOnly',
                    'hideButtonLabels',
                    'hideComputed', 'hideHeader', 'hideHeaderControls', 'hideHeaderLabel',
                    'hideLabels', 'hideReadOnly', 'hideSections',
                    'headerLabel', 'headerSubLabel', 'headerTopLabel',
                    'performTransition',
                    'picklistLimit', 'picklistShortcuts',
                    'requiredFieldsOnly',
                    'sectionsEx', 'sectionsIn', 'sectionsOrder',
                    'showInDialog', 'singleToolbar', 'suppressLinks',
                    'textNoData', 'toggles'
                ]
            }
        ],
        items : [
            {   // insertDetails
                id          : 'insertDetails',
                description : "Shows the Details of an item (the item identified by API link): its field sections and values. Supports inline editing, cloning, bookmarking and workflow actions depending on the user's permissions.",
                usage       : "Use as the main field-editing surface of an item screen. Typical cases: the 'Details' tab of an item page, or a read-only summary on a dashboard. Enable editing, clone and workflow options per the user's role; hide sections or fields to tailor the form to a specific audience.",
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Details should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel       : 'Details',
                    layout            : 'normal',
                    picklistLimit     : 10,
                    picklistShortcuts : true,
                    saveButtonLabel   : 'Save'
                },
                additional : [
                    'bookmark',
                    'editable', 'expandSections',
                    'firstSectionOnly',
                    'hideComputed', 'hideReadOnly', 'hideSections', 'hideLabels',
                    'requiredFieldsOnly',
                    'saveButtonLabel', 'saveSectionsToggle', 'sectionsIn', 'sectionsEx', 'sectionsOrder', 'suppressLinks',
                    'toggles',
                    'workflowActions'
                    // [ 'cloneable'          , false ],
                    // [ 'picklistLimit'      , 10    ],
                    // [ 'picklistShortcuts'  , true  ],7
                ]
            },{ // insertAttachments
                id          : 'insertAttachments',
                description : "Shows the file attachments of an item: uploaded files, and optionally related or Vault files. Supports preview, download, folder grouping and uploading new files (including viewer screenshots).",
                usage       : "Use to let users view, download and upload an item's files. Typical cases: a 'Files' tab, a document-centric workspace, or surfacing related and Vault files alongside the record. Enable upload (and viewer-screenshot capture) on screens where users contribute files.",
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Attachments should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel           : 'Attachments',
                    layout                : 'list',
                    tileIcon              : 'icon-pdf',
                    contentSize           : 'm',
                    uploadScreenshotLabel : 'Save Screenshot'
                },
                filters : [ 'filterByType' ],
                additional : [
                    'download',
                    'editable', 'extensionsEx', 'extensionsIn',
                    'fileSize', 'fileVersion',
                    'uploadScreenshotLabel'
                ]
            },{ // insertGrid
                id          : 'insertGrid',
                description : "Shows an item's grid as an editable table. Supports inline editing, adding / cloning and removing rows",
                usage       : "Use to edit an item's set of related rows in a spreadsheet-like table. Typical cases: editing line items, characteristics, or any one-to-many list in place. Enable add, clone, remove and inline editing for data-entry screens; leave it read-only for review screens.",
                inputs      : [{
                    id          : 'link',
                    title       : 'link',
                    description : 'API link of the item for which the Grid tab should be displayed',
                    default     : '/api/v3/workspaces/84/items/22131',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel       : 'Grid',
                    layout            : 'table',
                    picklistLimit     : 10,
                    saveButtonLabel   : 'Save Changes',
                    sortDirection     : 'ascending',
                    sortType          : 'string'
                },
                filters    : [ 'filterEmpty' ],
                additional : [
                    'attributes', 'autoSave', 
                    'bookmark',
                    'editable',
                    'sortBy', 'sortOrder', 'sortDirection', 'sortType',
                    'toggles'
                ]
            },{ // insertBOM
                id          : 'insertBOM',
                description : "Shows the multi-level Bill of Materials tree of an item, with quantities and BOM-view selection. Optionally supports file download, drag-and-drop and selecting rows in a connected viewer.",
                usage       : "Use to show an item's multi-level Bill of Materials as an expandable tree with quantities. Typical cases: an engineering or manufacturing BOM tab, where-used review, or a download point for BOM files. Enable drag-and-drop or viewer selection for interactive assembly screens; use insertFlatBOM or insertBOMPartsList when a flat list fits better.",
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Bill of Materials should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel        : 'BOM',
                    contentSize        : 'm',
                    layout             : 'tree',
                    depth              : 10,
                    revisionBias       : 'release',
                    pathTitle          : 'auto',
                    position           : true,
                    selectUnique       : true,
                    includeBOMPartList : true,
                    downloadRequests   : 3,
                    saveButtonLabel    : 'Save'
                },
                additional : [
                    'depth', 'downloadFiles', 'downloadRequests',
                    'revisionBias',
                    'toggles', 'hideTableColumns', 'treePath', 'treePathTitle',
                    // 'additionalRequests'
                ]
            },{ // insertBOMPartsList
                id          : 'insertBOMPartsList',
                description : "Shows the fully flattened BOM of an item - every part with its rolled-up total quantity - as a single list rather than a tree.",
                usage       : "Use when users need every part and its total rolled-up quantity in one flat list rather than a tree. Typical cases: procurement and shopping lists, costing roll-ups, or exporting a consolidated parts list. Choose insertBOM instead when the assembly structure matters.",
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Flat BOM should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel       : 'BOM Parts List',
                    contentSize       : 'm',
                    layout            : 'list',
                    depth             : 10,
                    revisionBias      : 'release',
                    fieldIdPartNumber : 'NUMBER'
                },
                additional : []
            },{ // insertFlatBOM
                id          : 'insertFlatBOM',
                description : "Shows the fully flattened BOM of an item - every part with its rolled-up total quantity - as a single list rather than a tree.",
                usage       : "Use when users need every part and its total rolled-up quantity in one flat list rather than a tree. Typical cases: procurement and shopping lists, costing roll-ups, or exporting a consolidated parts list. Choose insertBOM instead when the assembly structure matters.",
                inputs      : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the Flat BOM should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel       : 'Flat BOM',
                    layout            : 'table',
                    contentSize       : 'm',
                    depth             : 10,
                    revisionBias      : 'release',
                    fieldIdPartNumber : 'NUMBER'
                },
                additional : [ 'editable' ]
            },{ // insertRootParents
                id          : 'insertRootParents',
                description : "Shows the top-level (root) assemblies that ultimately contain the item, taken from its Where-Used, together with the path to each.",
                usage       : "Use to answer 'which top-level products ultimately contain this part?' from where-used. Typical cases: impact analysis before a change, or navigating up to finished assemblies. Pair it with insertParents when users also need the immediate level.",
                inputs : [{
                    id          : 'link',
                    title       : 'Item link',
                    description : 'API link of the item for which the root items and paths should be displayed',
                    default     : '/api/v3/workspaces/57/items/18702',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'Root Parents',
                    layout      : 'table',
                    tileIcon    : 'icon-link',
                    depth       : 10
                },
                filters : [ 'filterByLifecycle', 'filterByWorkspace' ],
                additional : [
                ]
            },{ // insertParents
                id          : 'insertParents',
                description : "Shows the immediate (first-level) parents of an item - the assemblies that directly use it.",
                usage       : "Use to show only the direct parents of an item (the assemblies that use it one level up). Typical cases: quick upward navigation, or confirming immediate usage before editing. Use insertRootParents for the full top-level rollup.",
                inputs      : [{
                    id          : 'link',                    
                    title       : 'Item link',
                    description : 'API link of the item for which the immediate parents should be displayed',
                    default     : '/api/v3/workspaces/57/items/18702',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'Parents',
                    layout      : 'list',
                    tileIcon    : 'icon-product'
                },
                filters    : [ 'filterByLifecycle', 'filterByWorkspace' ],                
                additional : [ 'displayParentsBOM' ]
            },{ // insertBOMChanges
                id          : 'insertBOMChanges',
                description : "Insert BOM children which are new or have been changed",
                usage       : "Use in BOM comparisons and change review applications",
                inputs      : [{
                    id          : 'link',                    
                    title       : 'Item link',
                    description : 'API link of the item for which the immediate parents should be displayed',
                    default     : '/api/v3/workspaces/57/items/16908',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'BOM Changes',
                    layout      : 'list',
                    tileIcon    : 'icon-product'
                },
                filters    : [ 'filterByLifecycle', 'filterByWorkspace' ],                
                additional : []
            },{ // insertManagedItems
                id          : 'insertManagedItems',
                description : "Shows the Managed Items of an item: the records it manages through a managed-item relationship.",
                usage       : "Use to display the records an item manages through a managed-item relationship. Typical cases: a controlling document showing the items it governs, or a master record listing its dependents.",
                inputs      : [{
                    id          : 'link',                       
                    title       : 'Item Link',
                    description : 'API link of the item whose managed items should be displayed',
                    default     : '/api/v3/workspaces/84/items/16911',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel       : 'Managed Items',
                    layout            : 'table',
                    tileIcon          : 'icon-product',
                    filterByLifecycle : true,
                    filterByWorkspace : true
                },
                filters    : [ 'filterByLifecycle', 'filterByWorkspace' ],                
                additional : []
            },{ // insertChangeProcesses
                id          : 'insertChangeProcesses',
                description : "Shows the change processes (e.g. COs / CRs) related to an item, and lets the user create a new one against it.",
                usage       : "Use to show the change processes (COs, CRs, etc.) linked to an item and let users start a new one against it. Typical cases: a 'Changes' tab on an item, or a launch point for raising a change directly from the affected record.",
                inputs      : [{
                    id          : 'link',                      
                    title       : 'Item Link',
                    description : 'API link of the item for which the Change Processes should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'Processes',
                    layout      : 'list',
                    tileIcon    : 'icon-status'
                },
                filters    : [ 'filterByStatus', 'filterByWorkspace' ],                
                additional : [ 'editable' ]
            },{ // insertProject
                id          : 'insertProject',
                description : "Shows the Project tab of an item: the project tasks and deliverables associated with it.",
                usage       : "Use to surface the project tasks and deliverables tied to an item. Typical cases: a 'Project' tab linking engineering records to project management, or tracking deliverable status from the item.",
                inputs      : [{
                    id          : 'link',   
                    title       : 'Item Link',
                    description : 'API link of the item for which the Project tab should be displayed',
                    default     : '/api/v3/workspaces/213/items/18866',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'Timeline',
                    layout      : 'list',
                    tileIcon    : 'icon-calendar',
                    multiSelect : true
                },
                filters    : [ 'filterByStatus', 'filterByWorkspace' ],                 
                additional : [
                ]
            },{ // insertRelationships
                id          : 'insertRelationships',
                description : "Shows the Relationships of an item: the records linked to it through relationship fields.",
                usage       : "Use to show records linked to an item via relationship fields. Typical cases: a generic 'Related Items' tab, or exposing cross-workspace links such as requirements to parts.",
                inputs      : [{
                    id          : 'link',   
                    title       : 'Item Link',
                    description : 'API link of the item for which the Relationships tab should be displayed',
                    default     : '/api/v3/workspaces/95/items/14444',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel       : 'Relationships',
                    layout            : 'list',
                    tileIcon          : 'icon-link',
                    filterByWorkspace : true
                },
                filters    : [ 'filterByWorkspace' ],                
                additional : [
                ]
            },{ // insertSourcing
                id          : 'insertSourcing',
                description : "Shows the Sourcing information of an item: its manufacturers, suppliers and sourced part numbers.",
                usage       : "Use to display an item's manufacturers, suppliers and sourced part numbers. Typical cases: a 'Sourcing' or 'Procurement' tab on a part, or supplier review screens.",
                inputs      : [{
                    id          : 'link',   
                    title       : 'link',
                    description : 'API link of the item for which the Sourcing should be displayed',
                    default     : '/api/v3/workspaces/57/items/9913',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'Sourcing',
                    layout      : 'table'
                },
                filters    : [ 'filterBySupplier', 'filterByManufacturer' ],                    
                additional : [
                ]
            },{ // insertWorkflowHistory
                id          : 'insertWorkflowHistory',
                description : "Shows the workflow history of an item - every state transition with who performed it and when - and optionally the transitions available from the current state.",
                usage       : "Use to show the full audit trail of state transitions on an item - who moved it where, and when. Typical cases: a 'History' tab for compliance and traceability, or troubleshooting why an item is in its current state. Configure final states and excluded transitions to tidy the timeline.",
                inputs      : [{
                    id          : 'link',  
                    title       : 'Item Link',
                    description : 'API link of the item whose workflow history should be displayed',
                    default     : '/api/v3/workspaces/100/items/22265',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel         : 'Workflow History',
                    showNextTransitions : true,
                    finalStates         : ['Complete', 'Completed', 'Closed', 'Done'],
                    transitionsEx       : ['Cancel', 'Delete']
                },
                additional : [ 
                    'showNextTransitions',
                    'transitionsEx', 'transitionsIn'
                ],
                excluded   : [ 'openSelectedInPLM' ]
            },{ // insertRevisions
                id          : 'insertRevisions',
                description : "Shows the revision list of an item: all its revisions / versions, for navigating between them.",
                usage       : "Use to list an item's revisions or versions and navigate between them. Typical cases: a 'Revisions' tab for comparing or opening prior versions of a controlled record.",
                inputs      : [{
                    id          : 'link',                      
                    title       : 'Item Link',
                    description : 'API link of the item whose revision list should be displayed',
                    default     : '/api/v3/workspaces/57/items/18685',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel : 'Revisions',
                    layout      : 'table',
                    tileIcon    : 'icon-product',
                    number      : false
                },
                additional : [
                ]
            },{ // insertChangeLog
                id          : 'insertChangeLog',
                description : "Shows the change log of an item: a chronological audit trail of field changes, with optional filtering by user and by action type.",
                usage       : "Use to show a field-level audit trail of who changed what on an item. Typical cases: a compliance 'Change Log' tab, or investigating data changes. Enable the user and action filters when logs get long.",
                inputs      : [{
                    id          : 'link',
                    title       : 'Item Link',
                    description : 'API link of the item for which the Change Log tab should be displayed',
                    default     : '/api/v3/workspaces/57/items/14669',
                    type        : 'string',
                    required    : true
                }],
                defaults : {
                    headerLabel    : 'Change Log',
                    layout         : 'list',
                    textNoData     : 'No change log entries found',
                    filterByUser   : true,
                    filterByAction : true
                },
                filters    : [ 'filterByUser', 'filterByAction' ],
                additional : [ 'actionsEx', 'actionsIn' ],
                excluded   : [ 'layout', 'openSelectedInPLM' ] 
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
            // },{ // insertImages
            //     title       : 'insertImages()',
            //     function    : 'insertImages',
            //     id          : 'images',
            //     description : "Shows all image-type fields of an item as a thumbnail grid.",
            //     usage : "Use to present an item's image fields as a thumbnail gallery. Typical cases: a product or part page showing photos and renderings, or a visual picker.",
            //     inputs : [{
            //         title       : 'Item Link',
            //         description : 'API link of the item whose image fields should be displayed',
            //         default     : '/api/v3/workspaces/57/items/14669',
            //         type        : 'string',
            //         required    : true
            //     }],
            //     defaults : {
            //         headerLabel : 'Images',
            //         layout      : 'grid',
            //         contentSize : 'm'
            //     },
            //     additional : [  ]
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
            // },{ // insertItemSummary
            //     title       : 'insertItemSummary()',
            //     function    : 'insertItemSummary',
            //     id          : 'item-summary',
            //     description : "Shows a complete item summary screen - header, status, action controls and configurable content tabs / sections - as a self-contained item page.",
            //     usage : "Use as a self-contained, full item page that combines header, status, action controls and configurable content tabs and sections. Typical cases: the primary 'open item' screen of an app, where you want a complete record view without assembling individual panels. Configure the contents to choose which tabs and sections appear.",
            //     inputs : [{
            //         title       : 'Item Link',
            //         description : 'API link of the item to summarize',
            //         default     : '/api/v3/workspaces/57/items/14669',
            //         type        : 'string',
            //         required    : true
            //     }],
            //     defaults : {
            //         layout          : 'tabs',
            //         bookmark        : false,
            //         cloneable       : false,
            //         hideSubtitle    : false,
            //         hideCloseButton : false,
            //         includeViewer   : false,
            //         workflowActions : false
            //     },
            //     additional : [ ]
            }
        ],
        classification : [{
            title       : 'insertClasses()',
            function    : 'insertClasses',
            id          : 'classes',
            description : "Shows the classification tree of the tenant, letting the user browse and pick a classification class.",
            usage       : "Use to let users browse the classification hierarchy and pick a class. Typical cases: the left-hand tree of a classification browser, or a class picker that feeds insertClassContents and insertClassFilters. Restrict it to a sub-tree with the topClass settings when only part of the taxonomy is relevant.",
            inputs      : [],
            defaults    : {
                headerLabel     : 'Classes',
                placeholder     : 'Filter classes',
                contentSize     : 'm',
                depth           : 10,
                hideTreeNumber      : true,
                hideTableHeader : true
            },
            options : [
                'collapsePanel', 'contentSize', 'contentSizes', 'counters', 'depth',
                'hideButtonLabels', 'hideHeader', 'hideHeaderControls', 'hideHeaderLabel',
                'hideTreeNumber', 'hidePanel', 'hideTableHeader',
                'headerLabel', 'headerSubLabel', 'headerToggle', 'headerTopLabel',
                'layout', 'number',
                'path', 'placeholder', 'reload', 'reset', 'search', 'singleToolbar',
                'tableColumnsLimit', 'tableHeaders',
                'textNoData', 'tileIcon', 'toggles', 'topClassId', 'topClassName', 'useCache'
            ]
        },{
            title       : 'insertClassContents()',
            function    : 'insertClassContents',
            id          : 'class',
            description : "Lists all items classified under a given classification class (identified by class id / name).",
            usage       : "Use to list the items belonging to a chosen classification class. Typical cases: the results pane of a classification browser (driven by insertClasses), or finding standard and library parts by category.",
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
                headerLabel   : 'Class Items',
                contentSize   : 'm',
                layout        : 'table',
                limit         : 20,
                pagination    : true,
                sortSelection : true,
                fields        : ['DESCRIPTOR']
            },
            options : [
                'collapsePanel', 'contentSize', 'contentSizes', 'counters', 'editable',
                'fields', 'fieldsEx', 'fieldsIn',
                'filterBySelection', 'filterByStatus', 'filterByWorkspace',
                'groupBy', 'groupLayout',
                'hideButtonLabels', 'hideHeader', 'hideHeaderControls', 'hideHeaderLabel', 'hidePanel',
                'headerLabel', 'headerSubLabel', 'headerToggle', 'headerTopLabel',
                'layout', 'limit', 'multiSelect', 'number',
                'openInPLM', 'openOnDblClick', 'pagination',
                'placeholder', 'query', 'reload', 'reset', 'search', 'singleToolbar', 'sortBy', 'sortSelection',
                'tableColumnsLimit', 'tableHeaders',
                'tileDetails', 'tileIcon', 'tileImage', 'tileImageFieldId', 'tileSubtitle', 'tileTitle',
                'textNoData', 'useCache'
            ]
        },{
            title       : 'insertClassFilters()',
            function    : 'insertClassFilters',
            id          : 'classFilters',
            description : "Shows the properties of a classification class and the filter controls for narrowing its contents.",
            usage       : "Use to show a class's properties as filter controls so users can narrow its contents by attribute values. Typical cases: faceted search within a class (e.g. filter resistors by resistance and package), paired with insertClassContents.",
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
                headerLabel    : 'Filters',
                contentSize    : 'm',
                layout         : 'table',
                limit          : 25,
                pagination     : true,
                advancedFilter : true,
                idContents     : 'contents',
                textNoData     : 'No properties found for the selected class',
                fields         : ['DESCRIPTOR']
            },
            options : [
                'advancedFilter',
                'collapsePanel', 'contentSize', 'contentSizes', 'counters',
                'fields',
                'hideButtonLabels', 'hideHeader', 'hideHeaderControls', 'hideHeaderLabel', 'hidePanel',
                'headerLabel', 'headerSubLabel', 'headerToggle', 'headerTopLabel',
                'idContents', 'layout', 'limit', 'number',
                'pagination', 'placeholder', 'reload', 'reset', 'search', 'singleToolbar',
                'tableColumnsLimit', 'tableHeaders',
                'textNoData', 'useCache'
            ]
        },{
            title       : 'insertItemClassification()',
            function    : 'insertItemClassification',
            id          : 'classification',
            description : "Shows the classification data of a given item: the classes it belongs to and their property values.",
            usage : "Use to show the classification a specific item carries - its classes and their property values. Typical cases: a 'Classification' tab on an item, or verifying and maintaining how a part is classified.",
            inputs : [{
                title       : 'Item Link',
                description : 'API link of the item whose classification data should be displayed',
                default     : '',
                type        : 'string',
                required    : true
            }],
            defaults : {
                headerLabel    : 'descriptor',
                headerSubLabel : 'Classifcation Data',
                textNoData     : 'No Classification Data Available',
                hideSections   : true
            },
            options : [
                'bookmark', 'headerLabel', 'headerSubLabel',
                'hideLabels', 'hideReadOnly', 'hideSections',
                'requiredFieldsOnly', 'saveButtonLabel', 'textNoData'
            ]
        },{
            title       : 'insertSimilarItems()',
            function    : 'insertSimilarItems',
            id          : 'similar',
            description : "Shows items similar to a given item, matched on shared classification.",
            usage : "Use to suggest items similar to the current one based on shared classification. Typical cases: duplicate prevention during creation, or steering users to an existing standard part instead of creating a new one.",
            inputs : [{
                title       : 'Item Link',
                description : 'API link of the reference item',
                default     : '',
                type        : 'string',
                required    : true
            }],
            defaults : {},
            options : []
        }],
        // admin : [{
        //     id          : 'insertUsers',
        //     description : "Lists the users of the tenant - an administrative panel for browsing user accounts.",
        //     usage        : "Administrative panel that lists the tenant's users. Typical cases: admin utilities for browsing or selecting user accounts.",
        //     inputs      : [],
        //     defaults : {
        //         headerLabel : 'Users',
        //         contentSize : 'm',
        //         layout      : 'table'
        //     },
        //     additional : [ ]
        // }]        
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
            headerLabel : {
                title       : 'Header Label',
                description : 'Panel Header',
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
            // surfaceLevel : {
            //     title       : 'Surface Level',
            //     description : "Applies the matching CSS surface class ('1' to '5') to the panel for visual layering",
            //     default     : '',
            //     type        : 'select',
            //     list        : ['1', '2', '3', '4', '5']
            // },             
            useCache : {
                title       : 'Use Cache',
                description : 'Enable usage of cached data (if enabled in environment file)',
                default     : false,
                type        : 'boolean'
            }            
        },

        actions : {
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
            reset : {
                title       : 'Reset',
                description : 'Add a reset button so users can clear selection and filters',
                default     : false,
                type        : 'boolean'
            },

        },

        accessibility : {
  
            filterBySelection : {
                title       : 'Filter By Selection',
                description : "Enables a toggle to filter for selected items only (requires multiSelect=true)",
                default     : false,
                type        : 'boolean'
            },


        },

        content : {
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
            layout : {
                title       : 'Layout',
                description : 'Content Layout',
                default     : 'list',
                type        : 'select',
                list        : ['table', 'list', 'grid']
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
            compactDisplay : {
                title       : 'Compact Display',
                description : 'Renders the panel contents in a denser layout',
                default     : false,
                type        : 'boolean'
            },
            transitions : {
                title       : 'Transition Actions',
                description : "Adds actions buttons for each transition defined",
                default     : {},
                type        : 'textarea'
            },            
        },

        tiles : {

            tileImage : {
                title       : 'Tile Image',
                description : 'Enables images for tiles. If settings tileImageFieldId is provided, this given field will be used to determine the image. If not, the first image field will be used instead.',
                default     : false,
                type        : 'boolean'
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
            advancedFilter : {
                title       : 'Advanced Filter',
                description : 'Enable advanced class-property filter inputs',
                default     : true,
                type        : 'boolean'
            },
            fieldIdPartNumber : {
                title       : 'Field ID Part Number',
                description : 'Field ID used to read the part number for the flat BOM',
                default     : 'NUMBER',
                type        : 'string'
            },
            finalStates : {
                title       : 'Final States',
                description : "Array of state labels considered terminal in workflow history (e.g. ['Complete','Closed'])",
                default     : '',
                type        : 'array'
            },
            includeBOMPartList : {
                title       : 'Include BOM Parts List',
                description : "When true, the panel's afterCompletion callback receives the bomPartsList",
                default     : true,
                type        : 'boolean'
            },
            includeRelatedFiles : {
                title       : 'Include Related Files',
                description : 'Also display attachments related to the item via picklists',
                default     : false,
                type        : 'boolean'
            },
            includeVaultFiles : {
                title       : 'Include Vault Files',
                description : 'Also display Vault files for the matching item',
                default     : false,
                type        : 'boolean'
            },
            position : {
                title       : 'Position',
                description : 'Display the BOM position number column',
                default     : true,
                type        : 'boolean'
            },
            query : {
                title       : 'Query',
                description : 'Initial search expression applied to the class contents',
                default     : '',
                type        : 'string'
            },
            selectUnique : {
                title       : 'Select Unique',
                description : 'When selecting BOM rows, deduplicate by item link',
                default     : true,
                type        : 'boolean'
            },
            showQuantity : {
                title       : 'Show Quantity',
                description : 'Display the BOM quantity column',
                default     : false,
                type        : 'boolean'
            },
            showRestricted : {
                title       : 'Show Restricted',
                description : 'Show restricted (access-controlled) BOM rows',
                default     : false,
                type        : 'boolean'
            },          
            sortSelection : {
                title       : 'Sort Selection',
                description : 'Move selected entries to the top of the class contents list',
                default     : true,
                type        : 'boolean'
            },
            split : {
                title       : 'Split Attachments',
                description : 'Render attachments in split panels (Vault / Related grouped separately)',
                default     : false,
                type        : 'boolean'
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
            usersEx : {
                title       : 'Users Excluded',
                description : 'Array of user names whose change-log entries should be hidden',
                default     : '',
                type        : 'array'
            },
            usersIn : {
                title       : 'Users Included',
                description : 'Array of user names whose change-log entries should be shown (others hidden)',
                default     : '',
                type        : 'array'
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
            filter : {
                title       : 'Filter',
                description : 'Set the filter expression to identify matching records at load',
                default     : '',
                type        : 'string'
            },
            searchFields : {
                title       : 'Search Fields',
                description : 'Field ID(s) the typed search text is matched against',
                default     : '',
                type        : 'array'
            },
            baseFilters : {
                title       : 'Base Filters',
                description : 'Static filters always applied in addition to the typed search (insertResults filter shape)',
                default     : '[]',
                type        : 'textarea'
            },
            logicClause : {
                title       : 'Logic Clause',
                description : "Join logic for search filters ('AND' / 'OR'); blank derives automatically",
                default     : '',
                type        : 'select',
                list        : ['', 'AND', 'OR']
            },
            folders : {
                title       : 'Show Folders',
                description : "Groups files by folders",
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
                default     : 'column',
                type        : 'select',
                list        : ['column', 'row']
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
            hideTreeNumber : {
                title       : 'Hide Number',
                description : "Hides BOM row numbers",
                default     : false,
                type        : 'boolean'
            },
            hideTableHeader : {
                title       : 'Hide Table Header',
                description : "Hides table header row",
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
            number : {
                title       : 'Number',
                description : 'Enables numbers in tables, grids and lists (setting tileIcon will be ignored when enabled)',
                default     : true,
                type        : 'boolean'
            },
            openOnDblClick : {
                title       : 'Open On Double Click',
                description : 'Open the selected item in PLM when the user double-clicks',
                default     : false,
                type        : 'boolean'
            },
            rotate : {
                title       : 'Rotate Grid',
                description : 'Rotate the grid layout (swap columns and rows)',
                default     : false,
                type        : 'boolean'
            },
            saveTabSelection : {
                title       : 'Save Tab Selection',
                description : 'When switching items, restore the previously selected tab (layout "tabs" only)',
                default     : false,
                type        : 'boolean'
            },
            selectItems : {
                title       : 'Select Items',
                description : "JSON with fieldId/values pairs to pre-select matching BOM rows (e.g. {\"fieldId\":\"TYPE\",\"values\":[\"M\",\"C\"]})",
                default     : '{}',
                type        : 'textarea'
            }, 
            showInDialog : {
                title       : 'Show In Dialog',
                description : 'When enabled, displays the given content in a dialog element',
                default     : false,
                type        : 'boolean'
            },
            stateColors : {
                title       : 'State Colors',
                description : "JSON array of state/color pairs to highlight rows by workflow status (e.g. [{state:'Done',color:'#6a9728'}])",
                default     : '[]',
                type        : 'textarea'
            },
            tileIcon : {
                title : 'Tile Icon',
                description : 'The icon to be displayed for entries if no image is available and if setting number is disabled',
                default : 'icon-product',
                type : 'string'
            },
            tileImageFieldId : {
                title : 'Tile Image Field ID',
                description : 'If tileImage is enabled, this field will be used to retrieve the matching image. If this settings is left blank, the first image field of item details will be used automatically, but at lower performane. It is recommended to always provide this settings if images shoule be displayed.',
                default : '',
                type : 'string'
            },
            tableColumnsLimit : {
                title       : 'Table Columns Limit',
                description : "Maximum number of columns to display when layout is 'table' (includes the number column)",
                default     : 100,
                type        : 'integer'
            },
            tableHeaders : {
                title       : 'Table Headers',
                description : "When true, table header cells are displayed in layout 'table'",
                default     : true,
                type        : 'boolean'
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
            viewerSelection : {
                title       : 'Viewer Selection',
                description : 'If a viewer is present on the same page, highlight matching parts when items are selected',
                default     : false,
                type        : 'boolean'
            },
            wrapControls : {
                title       : 'Wrap Controls',
                description : 'Prevent wrapping of controls in the panel summary header',
                default     : false,
                type        : 'boolean'
            },
            workspacesEx : {
                title       : 'Workspaces Excluded',
                description : 'Array of workspace names whose items should be excluded',
                default     : '',
                type        : 'array'
            },
            workspacesIn : {
                title       : 'Workspaces Included',
                description : 'Array of workspace names. Only items from these workspaces will be shown.',
                default     : '',
                type        : 'array'
            }
        },

        actionss :  {
            cloneable : {
                title       : 'Cloneable',
                description : "Enables action button to clone existing item",
                default     : false,
                type        : 'boolean'
            },
            cloneDialog : {
                title       : 'Clone Dialog',
                description : "Open as clone dialog",
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
            hideCloseButton : {
                title       : 'Hide Close Button',
                description : "Hides the panel close button (e.g. so a parent screen can drive show/hide instead)",
                default     : false,
                type        : 'boolean'
            },
            multiSelect : {
                title       : 'Multi Select',
                description : 'Allows users to select multiple items in the panel and adds select-all/none toolbar buttons',
                default     : false,
                type        : 'boolean'
            },
            uploadScreenshot : {
                title       : 'Upload Screenshot',
                description : 'When a viewer is on the same page, allow uploading its current screenshot as an attachment',
                default     : false,
                type        : 'boolean'
            },
            workflowActions : {
                title       : 'Workflow Actions',
                description : "Add the Workflow Actions menu to panel header",
                default     : false,
                type        : 'boolean'
            }
        },

        others : {

            wsId : {
                title       : 'Workspace ID',
                description : 'Workspace ID to search within / load items from',
                default     : '',
                type        : 'string'
            },
            label : {
                title       : 'Control Label',
                description : 'Label displayed in the workflow actions select control',
                default     : 'Change Status',
                type        : 'string'
            },
            hideIfEmpty : {
                title       : 'Hide If Empty',
                description : 'When no workflow actions are available, hide the control instead of showing an empty drop down',
                default     : true,
                type        : 'boolean'
            },
            disableAtStartup : {
                title       : 'Disable At Startup',
                description : 'Disable the control until available actions have been retrieved',
                default     : false,
                type        : 'boolean'
            },
            wsIdChangesProcess : {
                title       : 'Change Process Workspace ID',
                description : 'Workspace ID of the change process used to resolve related changed items',
                default     : '78',
                type        : 'string'
            },
            fileId : {
                title       : 'File ID',
                description : 'Force the viewer to load a specific file by its unique ID',
                default     : '',
                type        : 'string'
            },
            filename : {
                title       : 'Filename',
                description : "Force the viewer to load a specific file by its filename (matches the 'Title' column in the Attachments tab)",
                default     : '',
                type        : 'string'
            },
            createButtonIcon : {
                title       : 'Create Button Icon',
                description : 'Icon class for the Create button in the panel footer',
                default     : 'icon-create',
                type        : 'string'
            },
            createButtonLabel : {
                title       : 'Create Button Label',
                description : 'Label for the Create button in the panel footer',
                default     : 'Create',
                type        : 'string'
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
            saveButtonLabel : {
                title       : 'Save Button Label',
                description : 'Label for the Save button shown by editable panels',
                default     : 'Save',
                type        : 'string'
            },
            // filters : {
            //     title       : 'Filters',
            //     description : 'JSON array of search criteria objects to identify the records to load',
            //     default     : '[]',
            //     type        : 'textarea'
            // },
            performTransition : {
                title       : 'Perform Transition',
                description : 'Internal ID of a workflow transition to be performed right after item creation',
                default     : '',
                type        : 'string'
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
            idContents : {
                title       : 'Class Contents Panel ID',
                description : 'DOM id of the class-contents panel that this filter panel should drive',
                default     : 'contents',
                type        : 'string'
            },

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

        data : {
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
        },

        sections : {
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
            uploadScreenshotLabel : {
                title       : 'Upload Screenshot Label',
                description : 'Label of the upload-screenshot button on the attachments panel',
                default     : 'Save Screenshot',
                type        : 'string'
            },                
        },

        tree : {
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
        },

        history : {
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
            actionsEx : {
                title       : 'Actions Excluded',
                description : 'List of Change Log action types to hide from the panel',
                default     : '',
                type        : 'array'
            },
            actionsIn : {
                title       : 'Actions Included',
                description : 'List of Change Log action types to display (others are hidden)',
                default     : '',
                type        : 'array'
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
            autoSave : {
                title       : 'Auto Save',
                description : 'Saves edits in the panel automatically when the user changes a value',
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
            bomViewSelector : {
                title       : 'BOM View Selector',
                description : 'Adds drop down with available BOM views',
                default     : false,
                type        : 'boolean',
            },
            displayParentsBOM : {
                title       : 'Display Parents BOM',
                description : "Allow expanding each parent node to its first-level BOM to access the item's siblings",
                default     : false,
                type        : 'boolean'
            },            
            editable : {
                title       : 'Editable',
                description : "Enables edit controls, depending on user's permissions",
                default     : false,
                type        : 'boolean'
            },            
            exactMatch : {
                title       : 'Exact Match',
                description : 'When true the search string must match exactly. When false, wildcards are appended automatically.',
                default     : false,
                type        : 'boolean'
            },
            hideLabels : {
                title       : 'Hide Labels',
                description : "Hides labels of fields",
                default     : false,
                type        : 'boolean'
            },
            hideTableColumns : {
                title       : 'Hide Detail Columns',
                description : 'Hide all table columns except the descriptor (use for navigation trees)',
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
            inputLabel : {
                title       : 'Input Label',
                description : 'Placeholder text for the search criteria input',
                default     : 'Enter search criteria',
                type        : 'string'
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
            searchButtonIcon : {
                title       : 'Button Icon',
                description : 'Icon class for the search button',
                default     : 'icon-search',
                type        : 'string'
            }, 
            searchButtonLabel : {
                title       : 'Button Label',
                description : 'Label for the search button',
                default     : 'Search',
                type        : 'string'
            },  
            searchFields : {
                title       : 'Fields',
                description : "Array of fieldIds to be loaded per record (e.g. ['DESCRIPTOR','TITLE'])",
                default     : ['DESCRIPTOR'],
                type        : 'array'
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
            },
            viewSelector : {
                title       : 'View Selector',
                description : 'Enable the drop down for selecting from available workspace views',
                default     : true,
                type        : 'boolean'
            },            
            workspaceIds : {
                title       : 'Workspace IDs',
                description : 'Array of workspace IDs to restrict the search to (overrides workspacesIn)',
                default     : '',
                type        : 'array'
            },       
        },

    }

}


$(document).ready(function() {

    // registry.js is loaded on every page (layout.pug) so panel functions can read
    // the registry definitions at runtime. The docs-UI wiring below only applies to
    // the studio/docs page, so bail out everywhere else.
    if($('#doc-contents').length === 0) return;

    $('#gallery').click(function() {
        document.location.href = document.location.href.split('/docs')[0] + '/gallery';
    })

    $('.nav-header').click(function() {
        $(this).toggleClass('collapsed');
        $(this).next().toggle();
        $(this).next().next().toggle();
        // $('.doc-content').hide();
        // $('#' + $(this).attr('data-id')).show();
        // $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').click(function() {
        $('.nav-content').removeClass('selected');
        $(this).addClass('selected');
        $('.doc-content').hide();
        setParamsList($(this).attr('data-id'));
        $('#' + $(this).attr('data-id')).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('span.ref').click(function() {
        let id = $(this).attr('data-id')
        $('.nav-content').removeClass('selected');
        $('.nav-content').each(function() {
            if($(this).attr('data-id') === id) $(this).addClass('selected');
        });
        $('.doc-content').hide();
        $('#' + id).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').first().click();

    $('.page-top').click(function() {

        let elemMain  = $(this).closest('.doc-content').find('.main');
   
        elemMain.animate({ scrollTop: 0 }, 500);

    });

    $('.page-parameters').click(function() {

        let elemMain  = $(this).closest('.doc-content').find('.main');
        let elemTable = elemMain.find('table.parameters');
   
        elemTable.get(0).scrollIntoView({ behavior : 'smooth' });

    });

    $('.page-examples').click(function() {
        
        let elemMain  = $(this).closest('.doc-content').find('.main');
        let elemTable = elemMain.find('table.examples');

        elemTable.get(0).scrollIntoView({ behavior : 'smooth' });

    });

});


// function getPanelSettings(name, id, params, link, additional) {
function getPanelSettings(name, id, params, inputs) {

    if(isBlank(name)) return;
    if(isBlank(id  )) return;
    if(isBlank(params)) params = {};
    if(isBlank(inputs)) inputs = {};

    const panelType = getRegistryPanelType(name);
    const link      = inputs.link || '';

    settings[id]                 = getRegistryPanelSettings(params, panelType, link);
    settings[id].load            = function() { window[name + 'Data'](id); }
    settings[id].afterCompletion = params.afterCompletion || function(id) { }
    settings[id].onClickItem     = params.onClickItem || function(elemClicked) { clickTile(elemClicked); }

    for(let input of panelType.inputs) {

        let key = input.id;
        settings[id][key] = inputs[key] || input.default

    }

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

    getPanelStandardOptions  (panelSettings, params, panelType);
    getPanelFieldIDs         (panelSettings, params, panelType);
    getPanelFilters          (panelSettings, params, panelType);
    getPanelAdditionalOptions(panelSettings, params, panelType);
    removeExcludedOptions    (panelSettings, params, panelType);

    if(panelSettings.collapsePanel) panelSettings.headerToggle = true;

    console.log(debugMode);

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
                panelSettings[key] = params[key] ?? registry.panelAdditionalOptions[category][key].default;
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
   
    // if(!isBlank(panelSettings.contentSizes)) panelSettings.contentSize = panelSettings.contentSizes[0];


    // let categoriesStandard = Object.keys(registry.panelStandardOptions);

    // for(let category of categoriesStandard) {

    //     let properties = Object.keys(registry.panelStandardOptions[category]);

    //     for(let property of properties) {
    //         panelSettings[property] = params[property] || registry.panelStandardOptions[category][property].default;
    //     }

    // }

    // let categoriesAdditional = Object.keys(registry.panelAdditionalOptions);

    // if(!isBlank(additional)) {
    //     for(let key of additional) {
    //         for(let categoryAdditional of categoriesAdditional) {
    //             let properties = Object.keys(registry.panelAdditionalOptions[categoryAdditional]);
    //             if(properties.includes(key)) {
    //                 panelSettings[key] = params[key] || registry.panelAdditionalOptions[categoryAdditional][key].default;
    //                 break;
    //             }
    //         }
    //     }
    // }

   



    // return panelSettings;



    // if(isBlank(defaults.additionalData)       ) defaults.additionalData        = [];
    // if(isBlank(defaults.collapseContents)     ) defaults.collapseContents      = false;
    // if(isBlank(defaults.contentSizes)         ) defaults.contentSizes          = [];
    // if(isBlank(defaults.counters)             ) defaults.counters              = false;
    // if(isBlank(defaults.createButtonIcon)     ) defaults.createButtonIcon      = 'icon-create';
    // if(isBlank(defaults.createButtonLabel)    ) defaults.createButtonLabel     = 'Create';
    // if(isBlank(defaults.disconnectButtonIcon) ) defaults.disconnectButtonIcon  = 'icon-list-remove';
    // if(isBlank(defaults.disconnectButtonLabel)) defaults.disconnectButtonLabel = 'Remove Selected';
    // if(isBlank(defaults.editable)             ) defaults.editable              = false;
    // if(isBlank(defaults.fieldsEx)             ) defaults.fieldsEx              = [];
    // if(isBlank(defaults.fieldsIn)             ) defaults.fieldsIn              = [];
    // if(isBlank(defaults.filterBySelection)    ) defaults.filterBySelection     = false;
    // if(isBlank(defaults.groupBy)              ) defaults.groupBy               = '';
    // if(isBlank(defaults.groupLayout)          ) defaults.groupLayout           = 'column';
    // if(isBlank(defaults.hideButtonLabels)     ) defaults.hideButtonLabels      = false;
    // if(isBlank(defaults.layout)               ) defaults.layout                = 'list';
    // if(isBlank(defaults.multiSelect)          ) defaults.multiSelect           = false;
    // if(isBlank(defaults.number)               ) defaults.number                = true;
    // if(isBlank(defaults.openOnDblClick)       ) defaults.openOnDblClick        = false;
    // if(isBlank(defaults.pagination)           ) defaults.pagination            = true;
    // if(isBlank(defaults.showInDialog)         ) defaults.showInDialog          = false;
    // if(isBlank(defaults.singleToolbar)        ) defaults.singleToolbar         = '';
    // if(isBlank(defaults.stateColors)          ) defaults.stateColors           = [];
    // if(isBlank(defaults.tableColumnsLimit)    ) defaults.tableColumnsLimit     = 100;
    // if(isBlank(defaults.tableRanges)          ) defaults.tableRanges           = false;
    // if(isBlank(defaults.tableTotals)          ) defaults.tableTotals           = false;
    // if(isBlank(defaults.tileDetails)          ) defaults.tileDetails           = [];
    // if(isBlank(defaults.tileIcon)             ) defaults.tileIcon              = 'icon-product';
    // if(isBlank(defaults.tileImage)            ) defaults.tileImage             = false;
    // if(isBlank(defaults.tileSubtitle)         ) defaults.tileSubtitle          = 'WF_CURRENT_STATE';
    // if(isBlank(defaults.tileTitle)            ) defaults.tileTitle             = 'DESCRIPTOR';
    // if(isBlank(defaults.useCache)             ) defaults.useCache              = false;
    // if(isBlank(defaults.afterCompletion)      ) defaults.afterCompletion       = function (id) {};
    // if(isBlank(defaults.afterSave)            ) defaults.afterSave             = function (id) {};

    

    // let panelSettings = {
    //     link                  : link,
    //     additionalData        : isBlank(params.additionalData)        ? defaults.additionalData : params.additionalData,
    //     collapseContents      : isBlank(params.collapseContents)      ? defaults.collapseContents : params.collapseContents,
    //     compactDisplay        : isBlank(params.compactDisplay)        ? false : params.compactDisplay,
    //     contentSizes          : isBlank(params.contentSizes)          ? defaults.contentSizes : params.contentSizes,
    //     counters              : isBlank(params.counters)              ? defaults.counters : params.counters,
    //     createButtonIcon      : isBlank(params.createButtonIcon)      ? defaults.createButtonIcon : params.createButtonIcon,
    //     createButtonLabel     : isBlank(params.createButtonLabel)     ? defaults.createButtonLabel : params.createButtonLabel,
    //     disconnectButtonIcon  : isBlank(params.disconnectButtonIcon)  ? defaults.disconnectButtonIcon : params.disconnectButtonIcon,
    //     disconnectButtonLabel : isBlank(params.disconnectButtonLabel) ? defaults.disconnectButtonLabel : params.disconnectButtonLabel,
    //     editable              : isBlank(params.editable)              ? defaults.editable : params.editable,
    //     fieldsEx              : isBlank(params.fieldsEx)              ? defaults.fieldsEx : params.fieldsEx,
    //     fieldsIn              : isBlank(params.fieldsIn)              ? defaults.fieldsIn : params.fieldsIn,
    //     filterBySelection     : isBlank(params.filterBySelection)     ? defaults.filterBySelection : params.filterBySelection,
    //     groupBy               : isBlank(params.groupBy)               ? defaults.groupBy : params.groupBy,
    //     groupLayout           : isBlank(params.groupLayout)           ? defaults.groupLayout : params.groupLayout,
    //     hideButtonLabels      : isBlank(params.hideButtonLabels)      ? defaults.hideButtonLabels : params.hideButtonLabels,
    //     layout                : isBlank(params.layout)                ? defaults.layout : params.layout,
    //     multiSelect           : isBlank(params.multiSelect)           ? defaults.multiSelect : params.multiSelect,
    //     number                : isBlank(params.number)                ? defaults.number : params.number,
    //     openOnDblClick        : isBlank(params.openOnDblClick)        ? defaults.openOnDblClick : params.openOnDblClick,
    //     pagination            : isBlank(params.pagination)            ? defaults.pagination : params.pagination,
    //     showInDialog          : isBlank(params.showInDialog)          ? defaults.showInDialog : params.showInDialog,
    //     singleToolbar         : isBlank(params.singleToolbar)         ? defaults.singleToolbar : params.singleToolbar,
    //     stateColors           : isBlank(params.stateColors)           ? defaults.stateColors : params.stateColors,
    //     tileDetails           : isBlank(params.tileDetails)           ? defaults.tileDetails : params.tileDetails,
    //     tileIcon              : isBlank(params.tileIcon)              ? defaults.tileIcon  : params.tileIcon,
    //     tileImage             : isBlank(params.tileImage)             ? defaults.tileImage : params.tileImage,
    //     tileImageFieldId      : isBlank(params.tileImage)             ? '' : params.tileImage,
    //     tileSubtitle          : isBlank(params.tileSubtitle)          ? defaults.tileSubtitle : params.tileSubtitle,
    //     tileTitle             : isBlank(params.tileTitle)             ? defaults.tileTitle : params.tileTitle,
    //     tableColumnsLimit     : isBlank(params.tableColumnsLimit)     ? defaults.tableColumnsLimit : params.tableColumnsLimit,
    //     tableHeaders          : isBlank(params.tableHeaders)          ? true : params.tableHeaders,
    //     tableRanges           : isBlank(params.tableRanges)           ? defaults.tableRanges : params.tableRanges,
    //     tableTotals           : isBlank(params.tableTotals)           ? defaults.tableTotals : params.tableTotals,
    //     useCache              : isBlank(params.useCache)              ? defaults.useCache : params.useCache,
    //     workspacesIn          : isBlank(params.workspacesIn)          ? [] : params.workspacesIn,
    //     workspacesEx          : isBlank(params.workspacesEx)          ? [] : params.workspacesEx,
    //     onClickItem           : isBlank(params.onClickItem)           ? null : params.onClickItem,
    //     onDblClickItem        : isBlank(params.onDblClickItem)        ? null : params.onDblClickItem,
    //     afterCompletion       : isBlank(params.afterCompletion)       ? defaults.afterCompletion : params.afterCompletion,
    //     afterSave             : isBlank(params.afterSave)             ? defaults.afterSave : params.afterSave,
    //     createWorkspaceIds    : [],
    //     columns               : [],
    //     isReload              : false,
    //     sharedCache           : config.sharedCache || ''
    // }

    // Header
    // panelSettings.headerLabel        = params.headerLabel        || defaults.headerLabel        ;
    // panelSettings.headerTopLabel     = params.headerTopLabel     || defaults.headerTopLabel     ;
    // panelSettings.headerSubLabel     = params.headerSubLabel     || defaults.headerSubLabel     ;
    // panelSettings.headerToggle       = params.headerToggle       || defaults.headerToggle       ;
    // panelSettings.collapsePanel      = params.collapsePanel      || defaults.collapsePanel      ;
    // panelSettings.hideHeader         = params.hideHeader         || defaults.hideHeader         ;
    // panelSettings.hideHeaderLabel    = params.hideHeaderLabel    || defaults.hideHeaderLabel    ;
    // panelSettings.hideHeaderControls = params.hideHeaderControls || defaults.hideHeaderControls ;
    // panelSettings.hidePanel          = params.hidePanel          || defaults.hidePanel          ;
    // panelSettings.textNoData         = params.textNoData         || defaults.textNoData         ;
    
    // // Actions
    // panelSettings.openInPLM   = params.openInPLM   || defaults.openInPLM  ;
    // panelSettings.search      = params.search      || defaults.search     ;
    // panelSettings.placeholder = params.placeholder || defaults.placeholder;
    // panelSettings.reload      = params.reload      || defaults.reload     ;
    // panelSettings.reset       = params.reset       || defaults.reset      ;
    
    // // Content
    // panelSettings.contentSize = params.contentSize || defaults.contentSize;
    // panelSettings.layout      = params.layout      || defaults.layout     ;


    // if(panelSettings.collapsePanel) panelSettings.headerToggle = true;
    // // if(!isBlank(panelSettings.contentSizes)) panelSettings.contentSize = panelSettings.contentSizes[0];


    // let categoriesStandard = Object.keys(registry.panelStandardOptions);

    // for(let category of categoriesStandard) {

    //     let properties = Object.keys(registry.panelStandardOptions[category]);

    //     for(let property of properties) {
    //         panelSettings[property] = params[property] || registry.panelStandardOptions[category][property].default;
    //     }

    // }

    // let categoriesAdditional = Object.keys(registry.panelAdditionalOptions);

    // if(!isBlank(additional)) {
    //     for(let key of additional) {
    //         for(let categoryAdditional of categoriesAdditional) {
    //             let properties = Object.keys(registry.panelAdditionalOptions[categoryAdditional]);
    //             if(properties.includes(key)) {
    //                 panelSettings[key] = params[key] || registry.panelAdditionalOptions[categoryAdditional][key].default;
    //                 break;
    //             }
    //         }
    //     }
    // }

    // if(!isBlank(excluded)) {
    //     for(let key of excluded) {
    //         delete panelSettings[key];
    //     }
    // }    

    // if(debugMode) console.log(panelSettings);

    // panelSettings.mode = 'initial';

    // return panelSettings;

// }