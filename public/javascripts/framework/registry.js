let panelTypes = {
    navigation : [
        {   // insertMOW
            title       : 'insertMOW()',
            function    : 'insertMOW',
            id          : 'mow',
            description : 'Displays the My Outstanding Work list of the given user',
            inputs      : [],
            common      : [
                ['headerLabel', 'My Outstanding Work'],
                ['layout'     , 'table'],
                ['contentSize'],
                ['number'],
                ['tileIcon'],
                ['tileImage'],
            ],
            special    : [{
                title       : 'Filter by Due Date',
                id          : 'filterByDueDate',
                description : 'When enabled, users can filter for tasks being due with a single toggle',
                default     : false,
                type        : 'boolean'
            },{
                title       : 'Filter by Status',
                id          : 'filterByStatus',
                description : 'When enabled, users can filter tasks by their workflow stauts using a drop down',
                default     : false,
                type        : 'boolean'
            },{
                title       : 'Filter by Workspace',
                id          : 'filterByWorkspace',
                description : 'When enabled, users can filter tasks by Workspace stauts using a drop down',
                default     : false,
                type        : 'boolean'
            },{
                title       : 'UserId',
                id          : 'userId',
                description : 'Provide the login user account to open the MoW for the given user (ie sven.dickmans@autodesk.com). Leave blank to open the MoW for the current user.',
                default     : '',
                type        : 'string'
            }]
        },{ // insertRecentItems
            title       : 'insertRecentItems()',
            function    : 'insertRecentItems',
            id          : 'recents',
            description : "Displays the user's Recently Viewed Items",
            inputs      : [],
            common      : [
                ['headerLabel', 'Recently Viewed Items'],
                ['layout'     , 'list'],
                ['contentSize', 'xs'],
                ['tileIcon'   , 'icon-history'],
            ],
            special    : [{
                title       : 'Filter by Workspace',
                id          : 'filterByWorkspace',
                description : 'When enabled, users can filter tasks by Workspace stauts using a drop down',
                default     : false,
                type        : 'boolean'
            }]
        },{ // insertBookmarks
            title       : 'insertBookmarks()',
            function    : 'insertBookmarks',
            id          : 'bookmarks',
            description : "Displays the user's Bookmarked items",
            inputs      : [],
            common      : [
                ['headerLabel', 'Bookmarks'],
                ['layout'     , 'list'],
                ['contentSize', 'xs'],
                ['tileImage'  , true],
            ],
            special    : [{
                title       : 'Filter by Workspace',
                id          : 'filterByWorkspace',
                description : 'When enabled, users can filter tasks by Workspace stauts using a drop down',
                default     : false,
                type        : 'boolean'
            }]
        },{ // insertWorkspaceViews
            title       : 'insertWorkspaceViews()',
            function    : 'insertWorkspaceViews',
            id          : 'workspaceViews',
            description : "Displays the user's Workspaces Views for the definde workspace",
            inputs : [{
                title       : 'Workspace ID',
                id          : 'wsId',
                description : 'ID of the workspace for which the views should be listed',
                default     : '57',
                type        : 'string',
                required    : true
            }],
            common      : [
                ['headerLabel'                     ],
                ['layout'      , 'table'           ],
                ['contentSize' , 'm'               ],
                ['tileTitle'   , 'DESCRIPTOR'      ],
                ['tileSubtitle', 'WF_CURRENT_STATE'],
            ],
            special    : [{
                title       : 'View Selector',
                id          : 'viewSelector',
                description : 'Enables / disables the view drop down selector',
                default     : true,
                type        : 'boolean'
            },{
                title       : 'Startup View',
                id          : 'startupView',
                description : 'Defines the initial workspace view to open (by name). When blank, the default view will be opened.',
                default     : '',
                type        : 'string'
            },{
                title       : 'Include My Outstanding Work',
                id          : 'includeMOW',
                description : 'When enabled, the MoW view will be added as option to the view selector',
                default     : false,
                type        : 'boolean'
            },{
                title       : 'Include Bookmarks',
                id          : 'includeBookmarks',
                description : 'When enabled, the Bookmarks view will be added as option to the view selector',
                default     : false,
                type        : 'boolean'
            },{
                title       : 'Include Recently Viewed Items',
                id          : 'includeRecents',
                description : 'When enabled, the Recently Viewed Items view will be added as option to the view selector',
                default     : false,
                type        : 'boolean'
            },{
                title       : 'Limit',
                id          : 'limit',
                description : 'Sets the maximumn nunber of records being loaded at startup',
                default     : 25,
                type        : 'integer'
            },{
                title       : 'Group By',
                id          : 'groupBy',
                description : "Define a column's Field ID to let the records be grouped by the given column's value (ie PDM_CATEGORY)",
                default     : '',
                type        : 'string'            
            }]
        },{ // insertSearch
            title       : 'insertSearch()',
            function    : 'insertSearch',
            id          : 'search',
            description : 'Displays panel to find items by descriptor',
            inputs      : [],
            common      : [
                ['headerLabel' , 'Search'        ],
                ['placeholder' , 'Filter results'],
                ['layout'      , 'list'          ],
                ['contentSize' , 'xs'            ],
                ['tileImage'                     ],
                ['number'                        ],
                ['tileIcon'                      ],
                ['tileTitle'   , 'Descriptor'    ],
                ['tileSubtitle', 'Workspace'     ]
            ],
            special : []
        },{ // insertResults
            title       : 'insertResults()',
            function    : 'insertResults',
            id          : 'results',
            description : 'Displays list of items matching a defined set of search criteria',
            inputs : [{
                title       : 'Workspace ID',
                id          : 'wsId',
                description : 'Workspace ID of items to display',
                default     : '95',
                type        : 'string',
                required    : true
            },{
                title       : 'Filters',
                id          : 'filters',
                description : 'Search parameters to identify the items to display',
                default     : '[{"field" : "TITLE","type" : "0","comparator" : "contains" ,"value" : "r"}]',
                type        : 'textarea',
                required    : true
            }],
            common : [
                ['layout', 'list'],
                ['contentSize', 'xs'],
                ['tileImage', true],
                ['tileImageFieldId', 'IMAGE']
            ],
            special : [
                {
                    title       : 'Filter by Status',
                    id          : 'filterByStatus',
                    description : 'When enabled, users can filter tasks by their workflow stauts using a drop down',
                    default     : false,
                    type        : 'boolean'
                }
            ]
        }
    ],
    items : [
        {   // insertAttachments
            title       : 'insertAttachments()',
            function    : 'insertAttachments',
            id          : 'attachments',
            description : 'Inserts the Attachments tab of an item defined by API link',
            inputs : [{
                title       : 'Item link',
                id          : 'link',
                description : 'API link of the item for which the Attachments should be displayed',
                default     : '/api/v3/workspaces/57/items/14669',
                type        : 'string',
                required    : true
            }],
            common : [
                ['layout', 'table']
            ]
        },{ // insertBOM
            title       : 'insertBOM()',
            function    : 'insertBOM',
            id          : 'bom',
            description : 'Inserts the Bill of Materials tab of an item defined by API link',
            inputs : [{
                title       : 'link',
                id          : 'link',
                description : 'API link of the item for which the Bill of Materials should be displayed',
                // default     : '/api/v3/workspaces/57/items/14669',
                default     : '/api/v3/workspaces/57/items/18709',
                type        : 'string',
                required    : true
            }],
            common : [
                ['headerLabel', 'BOM'],
                ['contentSize', 'm'],
                ['search'],
                ['editable', false]
            ],
            special    : [{
                title       : 'Hide Details',
                id          : 'hideDetails',
                description : 'Hides all table columns except for the descriptor. Use this option to render navigation trees',
                default     : true,
                type        : 'boolean'
            },{
                title       : 'BOM View Name',
                id          : 'bomViewName',
                description : 'The BOM view to open',
                default     : 'Details',
                type        : 'string'
            }]
        },{ // insertGrid
            title       : 'insertGrid()',
            function    : 'insertGrid',
            id          : 'grid',
            description : 'Inserts the Grid tab of an item defined by API link',
            inputs      : [{
                title       : 'link',
                id          : 'link',
                description : 'API link of the item for which the Grid tab should be displayed',
                default     : '/api/v3/workspaces/84/items/22131',
                type        : 'string',
                required    : true
            }],
            common : [
                ['layout', 'table']
            ]
        },{ // insertChangeProcesses
            title       : 'insertChangeProcesses()',
            function    : 'insertChangeProcesses',
            id          : 'processes',
            description : 'Inserts the related Change Proceses of the defined item',
            inputs      : [{
                title       : 'link',
                id          : 'link',
                description : 'API link of the item for which the Change Processes should be displayed',
                default     : '/api/v3/workspaces/57/items/14669',
                type        : 'string',
                required    : true
            }],
            common : [
                ['headerLabel', 'Processes'],
                ['layout', 'list'],
                ['number'],
                ['tileIcon', 'icon-status']
            ]
        },{ // insertProject
            title       : 'insertProject()',
            function    : 'insertProject',
            id          : 'project',
            description : 'Inserts the Project tab of an item defined by API link',
            inputs : [{
                title       : 'link',
                id          : 'link',
                description : 'API link of the item for which the Project should be displayed',
                default     : '/api/v3/workspaces/213/items/18866',
                type        : 'string',
                required    : true
            }],
            common : [
                ['layout', 'list'],
                ['contentSize'],
                ['tileImage'],
                ['tileImageFieldId']
            ]
        },{ // insertSourcing
            title       : 'insertSourcing()',
            function    : 'insertSourcing',
            id          : 'sourcing',
            description : 'Inserts the Sourcing tab of an item defined by API link',
            inputs      : [{
                title : 'link',
                id : 'link',
                description : 'API link of the item for which the Sourcing should be displayed',
                default : '/api/v3/workspaces/57/items/9913',
                type : 'string',
                required    : true
            }],
            common : [
                ['layout', 'table']
            ]
        }
    ],
    classification : [{
        title       : 'insertClassContents()',
        function    : 'insertClassContents',
        id          : 'class',
        description : 'Finds all items related to the defined Classification Class',
        inputs : [{
            title       : 'Class ID',
            id          : 'classId',
            description : 'Internal ID of the given Class',
            default     : '142',
            type        : 'string',
            required    : true
        },{
            title       : 'Class Name',
            id          : 'className',
            description : 'Internal Name of the given Class',
            default     : 'CABLES_AND_WIRES',
            type        : 'string',
            required    : true
        }],
        common : [
            ['layout', 'table']
        ]
    }]
}


let commonSettings = {
    headerLabel : {
        title       : 'Header Label',
        id          : 'headerLabel',
        description : 'Panel header being shown on top',
        default     : '',
        type        : 'string',
    },
    search : {
        title       : 'Search',
        id          : 'search',
        description : 'Enables quick filtering in panel contents when typing',
        default     : false,
        type        : 'boolean',
    },
    placeholder : {
        title       : 'Panel Filter Placeholder',
        id          : 'placeholder',
        description : 'Sets the panel type ahead filter placeholder text',
        default     : 'placeholder',
        type        : 'string',
    },
    layout : {
        title : 'Layout',
        id : 'layout',
        description : 'Content Layout',
        default : 'grid',
        type : 'select',
        options : ['table', 'list', 'grid']
    },
    contentSize : {
        title : 'Content Size',
        id : 'contentSize',
        description : 'Size of panel contents',
        default : 'm',
        type : 'select',
        options : ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl']
    },
    editable : {
        title       : 'Editable',
        id          : 'editable',
        description : "Enables edit controls, depending on user's permissions",
        default     : true,
        type        : 'boolean'
    },
    number : {
        title       : 'Number',
        id          : 'number',
        description : 'Enables numbers in tables, grids and lists (setting tileIcon will be ignored when enabled)',
        default     : true,
        type        : 'boolean'
    },
    tileIcon : {
        title : 'Tile Icon',
        id : 'tileIcon',
        description : 'The icon to be displayed for entries if no image is available and if setting number is disabled',
        default : 'icon-product',
        type : 'string'
    },
    tileImage : {
        title : 'Tile Image',
        id : 'tileImage',
        description : 'Enables images for tiles. If settings tileImageFieldId is provided, this given field will be used to determine the image. If not, the first image field will be used instead.',
        default : false,
        type : 'boolean'
    },
    tileImageFieldId : {
        title : 'Tile Image Field ID',
        id : 'tileImageFieldId',
        description : 'If tileImage is enabled, this field will be used to retrieve the matching image. If this settings is left blank, the first image field of item details will be used automatically, but at lower performane. It is recommended to always provide this settings if images shoule be displayed.',
        default : '',
        type : 'string'
    },
    tileTitle : {
        title       : 'Tile Title Field ID',
        id          : 'tileTitle',
        description : 'Sets the Tile Title',
        default     : 'DESCRIPTOR',
        type        : 'string'
    },
    tileSubtitle : {
        title       : 'Tile Subtitle Field ID',
        id          : 'tileSubtitle',
        description : 'Sets the Tile Subtile',
        default     : 'WF_CURRENT_STATE',
        type        : 'string'
    }
}


let categories = [
{
    name   : 'Panel Header & Appearance',
    icon   : 'icon-tabs',
    params : [{
        name        : 'headerLabel',
        description : "Sets the main header title. When opening a panel in context of a PLM item, set this parameter to 'descriptor' to dynamically display this item's descriptor as header",
        type        : 'String',
        default     : 'varies by view',
        supportedBy : ['nav-mow', 'nav-recent-items'],
        viewDefault : {
            'nav-mow'          : 'My Outstanding Work',
            'nav-recent-items' : 'Recently Viewed Items',
        }
    },{
        name        : 'headerTopLabel',
        description : "Sets a header top title being shown above the main header title defined by 'headerLabel'. This is set to blank per default to not display any text.",
        type        : 'String',
        default     : '-',
        supportedBy : []
    },{
        name        : 'headerSubLabel',
        description : "Sets a header sub title being shown below the main header title defined by 'headerLabel'. This is set to blank per default to not display any text.",
        type        : 'String',
        default     : '-',
        supportedBy : []
    },{
        name        : 'headerToggle',
        description : 'When set to true, a toggle will be displayed next to the header, enabling to collapse and expand the panel',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'collapsePanel',
        description : "Displays the panel in collapsed status. This will enable the panel toggle of parameter 'headerToggle' automatically.",
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'hideHeaderLabel',
        description : 'Use this parameter to hide the panel header title (which is defined by headerLabel)',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'hideHeaderControls',
        description : "Use this parameter to hide the panel header toolbar and its actions (ie search, reload). The class 'hidden' will be assigned to the panel's header controls element, preventing its display. Remove this class using javascript to display the controls when needed.",
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'hideHeader',
        description : 'Use this parameter to hide the panel header element',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'hidePanel',
        description : "When set to true, the panel and its data will still be loaded, but the panel will not be displayed. The class 'hidden' will be assigned to the panel's top DOM element, preventing its display. Remove this class using javascript to display the panel when needed.",
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    }]
},{
    name   : 'Panel Toolbar',
    icon   : 'icon-menu',
    params : [{
        name        : 'bookmark',
        description : 'Display the bookmark / favorite button in the header toolbar, enabling users to add/remove the item from the list of bookmarked items.',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'openInPLM',
        description : 'When set to true, an icon will be displayed to let users open the selected item in PLM',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'filterByDueDate',
        description : 'When enabled, users can filter for items being due with a toggle in the panel toolbar',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow']
    },{
        name        : 'filterByWorkspace',
        description : 'When enabled, users can filter for entries of a selected workspace using a drop down in the panel toolbar',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']   
    },{
        name        : 'filterBySelection',
        description : "When enabled, users can filter for the selected items with an additional toggle in the header toolbar.<br>This requires the parameter 'multiSelect' being set to 'true'",
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']   
    },{
        name        : 'filterByStatus',
        description : 'When enabled, users can filter for items being in selected status using a drop down in the header toolbar',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow']  
    },{
        name        : 'search',
        description : 'When set to true, a quick search and filtering control will be displayed in the panel toolbar',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'placeholder',
        description : 'Sets placeholder text for view search / filtering control in panel toolbar',
        type        : 'String',
        default     : 'Type to search',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'reload',
        description : 'When set to true, users can reload the given view with a dedicated button',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'reset',
        description : 'When set to true, users can reset selection and filters of the view',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['item-bom']
    }],
},{
    name   : 'Common Display Options',
    icon   : 'icon-resize',
    params : [{
        name        : 'contentSize',
        description : 'Select the content size from predefined layouts : xxs, xs, s, m, l, xl or xxl. In order to let the user select the right content size, use parameter contentSizes instead.',
        type        : 'String',
        default     : 'm',
        supportedBy : ['nav-mow', 'nav-recent-items'],
        viewDefault : {
            'nav-recent-items' : 'xs',
        }
    },{
        name        : 'contentSizes',
        description : "Enables toggling through defined content sizes using a single button. Provide the available sizes in an array (example: ['xs','l']). The first size value will be used at startup. This overrides the value of parameter contentSize.",
        type        : 'Array',
        default     : '[]',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'number',
        description : 'Displays counters (either as first table column or instead of the tile icon). Set this to false if parameter tileIcon should be taken into account instead.',
        type        : 'Boolean',
        default     : 'true',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'layount',
        description : "Sets the content layout. Select 'table', 'row', 'list' or 'grid'. For insertItemSummary, select from 'tabs', 'sections' and 'dashboard'.",
        type        : 'String',
        default     : 'list',
        supportedBy : ['nav-mow', 'nav-recent-items'],
        viewDefault : {
            'nav-mow' : 'table'
        }
    },{
        name        : 'counters',
        description : 'Display counters at bottom to indicate total, selected, filtered and modified items',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'textNoData',
        description : 'Text to be displayed if no data is available',
        type        : 'String',
        default     : 'No Entries',
        supportedBy : ['nav-mow', 'nav-recent-items']   
    }]
},{
    name   : 'Tiles Display Options',
    icon   : 'icon-tiles',
    params : [{
        name        : 'tileIcon',
        description : "If parameter 'number' is disabled, this defines the icon to be displayed for each tile. Use the icons provided by this Framework by providing the matching icon's css name.",
        type        : 'String',
        default     : 'icon-product',
        supportedBy : ['nav-mow', 'nav-recent-items'],
        viewDefault : {
            'nav-recent-items' : 'icon-history',
        }
    },{
        name        : 'tileImage',
        description : 'Enables tile image display (when set to true). When enabled, the first image field of the given workspace will be used.<br>Provide a fieldId instead to override this mechanism and use the defined field (not supported by all views).',
        type        : 'Boolean or String',
        default     : 'true',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'tileTitle',
        description : 'Sets the fieldID to be used for the tile title. Pass an array of fieldIDs instead of a string to let the system display the first non-empty field value.',
        type        : 'String',
        default     : 'DESCRIPTOR',
        supportedBy : ['nav-results']
    },{
        name        : 'tileSubtitle',
        description : 'Sets the fieldID to be used for the tile subtitle. Pass an array of fieldIDs instead of a string to let the system display the first non-empty field value.',
        type        : 'String',
        default     : 'WF_CURRENT_STATE',
        supportedBy : ['nav-results']
    },{
        name        : 'tileDetails',
        description : 'Select additional properties to be displayed below the tile subtitle. Provide an array with key/valus pairs of icon, fieldId and prefix. Example : { icon : "icon-calendar", fieldId : "TARGET_COMPLETION_DATE"}',
        type        : 'Array',
        default     : '[]',
        supportedBy : []
    },{
        name        : 'tileAttributes',
        description : 'Select additional attributes to be displayed in tile displays',
        type        : 'Array',
        default     : '[]',
        supportedBy : []
    },{
        name        : 'stateColors',
        description : "Provide array of key pairs with label, color and states list to highlight records by status.<br>Example : [{ label : 'Planning', color : '#000000', states : ['Create']},{ label : 'Processing', color : '#ffa600', states : ['Review','In Progress']}]",
        type        : 'Array',
        default     : '[]',
        supportedBy : ['nav-mow']
    }]
},{
    name   : 'Table Display Options',
    icon   : 'icon-table',
    params : [{
        name        : 'tableHeaders',
        description : "When set to true, the table header cells will be displayed in case of layout 'table'",
        type        : 'Boolean',
        default     : 'true',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'tableColumnsLimit',
        description : "Sets maximum number of columns to be displayed if layout is et to 'table'.<br>This includes the number column if enabled.",
        type        : 'Integer',
        default     : '-',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'tableTotals',
        description : 'Enable automatic total calculation for numeric columns, based on selected (or all) items',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'tableRanges',
        description : 'Enable automatic range indicators for numeric columns, based on selected (or all) items',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    }]
},{
    name   : 'Data Retrieval',
    icon   : 'icon-sliders',
    params : [{
    //     name        : 'columnsIn',     // replaced by fieldsIn
    //     description : "Provide an array of columns to be displayed. Columns not contained in this array will not be displayed.<br>The array must contain the column titles (example : ['Item','Revision','Title']).",
    //     type        : 'Array',
    //     default     : '[]',
    //     supportedBy : ['nav-mow', 'nav-recent-items']
    // },{
    //     name        : 'columnsEx',
    //     description : "Provide an array of columns to be hidden. Columns included will not be displayed.<br>The array must contain the column titles (example : ['Item','Revision','Title']).",
    //     type        : 'Array',
    //     default     : '[]',
    //     supportedBy : ['nav-mow', 'nav-recent-items']
    // },{
        name        : 'workspacesIn',
        description : "Provide and array of workspace names to be included. Items from workspaces not contained in this array will not be displayed.<br>The array must contain the workspace names (example : ['Problem Reports','Items']).",
        type        : 'Array',
        default     : '[]',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'workspacesEx',
        description : "Provide and array of workspace to be excluded. Items from workspaces contained in this array will not be displayed.<br>The array must contain the workspace names (example : ['Problem Reports','Items']).",
        type        : 'Array',
        default     : '[]',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'pagination',
        description : "Enables pagination controls if needed",
        type        : 'Boolean',
        default     : 'true',
        supportedBy : ['nav-class-contents', 'nav-search', 'nav-workspace-views']
    },{
        name        : 'userId',
        description : 'Retrieve data in context of another user, specified by the userId provided (use the mail address used for logging in).<br>This requires impersonation which can only be used if adminClientId and adminClientSecret are provided in the settings file.',
        type        : 'String',
        default     : '-',
        supportedBy : ['nav-mow']
    }],
},{
    name   : 'Events Definition',
    icon   : 'icon-select',
    params : [{
        name        : 'openOnDblClick',
        description : 'Let users open the selected item in PLM by double-clicking the item',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']       
    },{ 
        name        : 'onClickItem',
        description : "Function to invoke when content-item is clicked.<br>Example: function(elemClicked) { console.log(elemClicked.attr('data-link')); }",
        type        : 'function() {}',
        default     : '',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'onDblClickItem',
        description : "Function to invoke when content-item is double-clicked.<br>Example: function(elemClicked) { console.log(elemClicked.attr('data-link')); }",
        type        : 'function() {}',
        default     : '',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'afterCompletion',
        description : 'Function to invoke when panel content has finished loading.<br>Example : function(id) { console.log("done loading " + id); } )',
        type        : 'function() {}',
        default     : '',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'afterParentBOMCompletion',
        description : "Function to invoke when the parent's BOM finished loading (function(elemClicked) {})",
        type        : 'function() {}',
        default     : '',
        supportedBy : []
    },{
        name        : 'afterCloning',
        description : 'Function to invoke once the cloning has finished (function(elemClicked) {})',
        type        : 'function() {}',
        default     : '',
        supportedBy : []
    },{
        name        : 'afterCreation',
        description : 'Function to invoke after new record has been created in PLM function(id, link, contextId) {}',
        type        : 'function(id) {}',
        default     : '',
        supportedBy : []
    },{
        name        : 'viewerSelection',
        description : 'If the viewer is present in the same page, enable automatic highlight of matching items in the viewer',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    }]
},{
    name   : 'Others',
    icon   : 'icon-item',
    params : [{
        name        : 'id',
        description : 'Provide the id of the DOM element where the contents should be inserted if different from the default id',
        type        : 'String',
        default     : '',
        supportedBy : ['nav-mow', 'nav-recent-items'],
        viewDefault : {
            'nav-mow' : 'mow',
            'nav-recent-items' : 'recents'
        }
    },{
        name        : 'sortBy',
        description : 'Sort the grid based on the Field ID provided',
        type        : 'String',
        default     : '',
        supportedBy : ['item-grid']
    },{
        name        : 'sortDirection',
        description : 'Sort the grid in ascending or descending order',
        type        : 'String',
        default     : 'asending',
        supportedBy : ['item-grid']
    },{
        name        : 'sortType',
        description : 'Define the field type for proper sorting',
        type        : 'String',
        default     : 'string',
        supportedBy : ['item-grid']
    },{
        name        : 'sortOrder',
        description : 'Provide an array of value pairs with sortBy, sortDirection and sortType to define multiple sorting levels',
        type        : 'Array',
        default     : '[]',
        supportedBy : ['item-grid']
    },{
        name        : 'multiSelect',
        description : 'Enables selection of multiple items within the same panel. This also adds buttons to the panel toolbar to select all or none items.',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['nav-mow', 'nav-recent-items']
    },{
        name        : 'singleToolbar',
        description : "All panels use up to 3 toolbars per default: 'controls', 'actions' and 'footer'. By setting 'singleToolbar' to one of these, all controls will be shown in this defined toolbar.<br>This is helpful if other toolbars will not be shown in the panel.",
        type        : 'String',
        default     : '-',
        supportedBy : ['nav-mow', 'nav-recent-items']  
    },{
        name        : 'hideCloseButton',
        description : 'This will hide the given button, enabling dedicated toggles in the main header toolbar for example',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'hideButtonCreate',
        description : '',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'hideButtonAdd',
        description : '',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'hideButtonClone',
        description : '',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'hideButtonDisconnect',
        description : 'This will hide the button to disconnect selected item from the given view',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'hideDescriptor',
        description : 'This will hide the descriptor column which is used as first column otherwise',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['insertBOM']
    },{
        name        : 'editable',
        description : 'Enables edit capabilities within the panel',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'cloneable',
        description : 'Enables cloning capabilities within the panel',
        type        : 'Boolean',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'contextId',
        description : 'Provide additional Id of element invoking the create dialog to access its settings and enable refresh using the afterCreation event',
        type        : 'String',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'contextItem',
        description : 'Provide the API-Link of the context item to create a link in defined pick list fields (see seeting contextItemFields)',
        type        : 'String',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'contextItems',
        description : 'Provide the API-Link of multiple context items to create links in defined pick list fields (see seeting contextItemFields which must be of same array length)',
        type        : 'String',
        default     : 'false',
        supportedBy : []
    },{
        name        : 'contextItemFields',
        description : 'List of fieldIds which should be set to current context item (ie AFFECTED_ITEM)',
        type        : 'String',
        default     : '',
        supportedBy : []
    },{
        name        : 'createContextItem',
        description : '',
        type        : 'String',
        default     : '',
        supportedBy : ['item-change-processes']
    },{
        name        : 'createContextItems',
        description : '',
        type        : 'String',
        default     : '',
        supportedBy : ['item-change-processes']
    },{
        name        : 'createContextItemFields',
        description : 'List of fieldIds which should be set to current context item (ie AFFECTED_ITEM)',
        type        : 'String',
        default     : '',
        supportedBy : ['item-change-processes']
    },{
        name        : 'createViewerImageFields',
        description : 'List of fieldIds which should be seto a screenshot of the current viewer session',
        type        : 'String',
        default     : '',
        supportedBy : ['item-change-processes']
    },{
        name        : 'createConnectAffectedItem',
        description : 'Once the new change process has been created, the related item can be connected as affected item automatically',
        type        : 'Boolean',
        default     : true,
        supportedBy : ['item-change-processes']
    },{
        name        : 'createHeaderLabel',
        description : 'Sets the header label of the create dialog',
        type        : 'String',
        default     : 'Create Process',
        supportedBy : []
    },{
        name        : 'createButtonLabel',
        description : 'Sets the label of the create button',
        type        : 'String',
        default     : 'Create',
        supportedBy : []
    },{
        name        : 'fieldValues',
        description : 'Set and fix values for defined fields. Provide fieldid / value pairs (see variant management and design reviews)',
        type        : 'Array',
        default     : '[]',
        supportedBy : []
    },{
        name        : 'disconnectLabel',
        description : 'Sets the label of the disconnect button',
        type        : 'String',
        default     : 'Remove',
        supportedBy : []
    },{
        name        : 'disconnectIcon',
        description : 'Sets the icon of the disconnect button (select from the icons provided by this framework as listed in the given page)',
        type        : 'String',
        default     : 'icon-disconnect',
        supportedBy : []
    },{
        name        : 'uploadFileLabel',
        description : 'Sets the label for the file upload button',
        type        : 'String',
        default     : 'Upload File',
        supportedBy : ['item-acttachments']
    },{
        name        : 'uploadScreenshotLabel',
        description : 'Sets the label for the viewer screenshot upload button',
        type        : 'String',
        default     : 'Save Screenshot',
        supportedBy : ['item-acttachments']        
    },{
        name        : 'uploadScreenshot',
        description : "When viewer is contained in application and this setting is true, users can upload the current viewer's display as screenshot",
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['item-acttachments']        
    },{
        name        : 'hideButtonLabels',
        description : "When set to true, only icons of buttons will be displayed and labels will be shown as tooltips only",
        type        : 'Boolean',
        default     : 'false',
        supportedBy : ['item-grid']        
},{
    name        : 'picklistLimit',
    description : 'Defines the number of items being retrieved for picklist fields',
    type        : 'Integer',
    default     : 10,
    supportedBy : ['item-details']
},{
    name        : 'picklistShortcuts',
    description : 'When set to true, users also can insert items from their bookmarks and recenently viewed items in matching picklist fields',
    type        : 'Boolean',
    default     : false,
    supportedBy : ['item-details']
},{
    name        : 'filterEmpty',
    description : 'When enabled, users can filter for entries with inputs not having a value set',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'filterByLifecycle',
    description : 'When enabled, users can filter for enries of a selected lifecycle status using a drop down in the header toolbar',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'filterByManufacturer',
    description : 'When enabled, users can filter for enries of a selected manufacturer using a drop down in the header toolbar',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'filterByOwner',
    description : 'When enabled, users can filter for enries of a selected owner using a drop down in the header toolbar',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'filterBySupplier',
    description : 'When enabled, users can filter for enries of a selected supplier using a drop down in the header toolbar',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []





},{
    name        : 'collapseContents',
    description : 'For a better overview of the data, let the contents be collapsed',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : ['item-grid']
},{
    name        : 'expandSections',
    description : 'Provide array of section labels to define sections that should be expaned at startup. All other sections will be collapsed automatically.',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'groupBy',
    description : 'Group panel items by defined field/column',
    type        : 'String',
    default     : '',
    supportedBy : ['item-grid']
},{
    name        : 'groupLayout',
    description : 'When grouping is enabled, select "column" or "row" to set the groups layout',
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'toggleBodyClass',
    description : 'Defines css class name to be toggled for the body element when panel close button gets clicked',
    type        : 'String',
    default     : '',
    supportedBy : []

},{
    name        : 'workspaceIds',
    description : 'Provide an array of strings with workspace IDs to be taken into account. This will override workspacesIn if defined',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'fieldsIn',
    description : 'List of fieldIDs defining the fields to be displayed. Fields not contained in this list will not be displayed. (example : ["NUMBER","TITLE","DESCRIPTION"]).',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'fieldsEx',
    description : 'List of fieldIDs defining the fields to be excluded. Fields contained in this list will not be displayed. (example : ["NUMBER","TITLE","DESCRIPTION"]).',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'sectionsIn',
    description : "List of section lables defining the sections to be displayed. Sections not contained in this list will not be displayed. (example : ['Basic','Details']).",
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'sectionsEx',
    description : "List of section lables defining the sections to be excluded. Sections contained in this list will not be displayed. (example : ['Basic','Details']).",
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'sectionsOrder',
    description : "Changes the order in which the sections will be displayed. Provide an array with the section labels if the sequence should be changed: ['Procurement', 'Basic']",
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'firstSectionOnly',
    description : "When set to true, only fields of the first section visible (and not excluded) will be displayed",
    type        : 'Booleand',
    default     : 'false',
    supportedBy : ['insert-details']
},{
    name        : 'selectItems',
    description : "Provide fieldId and values array to filter for BOM rows which will be returned as separate list after the BOM expansion ({ fieldId : 'TYPE', values : ['M', 'C']})",
    type        : 'Json',
    default     : '{}',
    supportedBy : []
},{
    name        : 'sortBy',
    description : "Sort the list of items by a defined fieldId",
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'startupView',
    description : "Provide the name of the workspace view to be loaded at startup (if existent), overriding the user's preference",
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'surfaceLevel',
    description : "Applies matching class to panel and its contents (select from '1', '2', '3', '4', '5')",
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'suppressLinks',
    description : 'When enabled, all links to PLM items will be suppresed and not shown as links, preventing users from accessing the standard PLM UI',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'toggles',
    description : 'Displays toggle buttons in panel header toolbar to quickly expand and collapse the contents being displayed',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : ['insertGrid']
},{
    name        : 'saveTabSelection',
    description : 'When switching between records, the summary will automatically select the previously selected tab if layout "tabs" is used',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : ['item-summary']
},{
    name        : 'wrapControls',
    description : 'Prevent wrapping of controls in summary header',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'viewSelector',
    description : 'When set to true, users can select from the existing views',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'workflowActions',
    description : 'When set to true, the available workflow actions will be displayed as drop-down and users can perform the given actions by selecting them from his menu',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'hideComputed',
    description : 'Select if computed fields should be hidden',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'hideReadOnly',
    description : 'Select if read-only should be hidden',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'hideSections',
    description : 'Select if section names should be hidden',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'hideLabels',
    description : 'Select if field labels should be hidden',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'hideSubtitle',
    description : 'Select if subtitle should be hidden',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'includeViewer',
    description : 'When enabled, a viewer will be added to the summary display in dedicated div element',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'extensionsEx',
    description : 'Provide and array of file format extensions to be excluded. Files in the formatss contained in this array will not be displayed. The array must contain the format without dot (example : ["iam","ipt"]).',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'extensionsIn',
    description : 'Provide and array of file format extensions to be included. Files of formatss not contained in this array will not be displayed. The array must contain the format without dot (example : ["iam","ipt"]).',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'extensionsEx',
    description : 'Provide and array of file format extensions to be excluded. Files in the formatss contained in this array will not be displayed. The array must contain the format without dot (example : ["iam","ipt"]).',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'filter',
    description : 'Set the filter to identify matching records',
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'inputLabel',
    description : 'Placeholder text for search criteria input',
    type        : 'String',
    default     : 'Enter search critieria',
    supportedBy : []
},{
    name        : 'buttonIcon',
    description : 'Sets the icon of the search button (select from the icons provided by this framework as listed in the given page)',
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'buttonLabel',
    description : 'Sets the label of the search button',
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'baseQuery',
    description : 'The query to execute when loading the view',
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'limit',
    description : 'Sets limit of records being displayed at initial load',
    type        : 'Integer',
    default     : '25',
    supportedBy : ['nav-search', 'nav-workspace-views']
},{
    name        : 'workspaceIds',
    description : 'Will override workspacesIn if defined, will restrict search within the given list of workspaces',
    type        : 'Array',
    default     : '[]',
    supportedBy : []
},{
    name        : 'exactMatch',
    description : 'When set to true, the search string has to match the search results exactly. When set to false, aserisks will be preprended and appended instead automatically.',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'displayParentsBOM',
    description : "When enabled, users can expand the parent node to access ist first level BOM, providing access to the current item's siblings",
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'hideParents',
    description : 'Hide the bom tree nodes and display leaf items only by setting this option to true',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'bomViewId',
    description : "Internal ID of the BOM view to load. If parameter is not provided, the user's default view will be used.",
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'bomViewName',
    description : "Name of the BOM view to load. If parameter is not provided, the user's default view will be used.",
    type        : 'String',
    default     : '',
    supportedBy : []
},{
    name        : 'depth',
    description : 'Number of BOM levels to expand',
    type        : 'Integer',
    default     : '10',
    supportedBy : []
},{
    name        : 'includeBOMPartList',
    description : 'When set to true, afterCompletion includes the bomPartsList',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'download',
    description : 'Enables download of files from PLM (requires given permission in PLM)',
    type        : 'Boolean',
    default     : 'true',
    supportedBy : []
},{
    name        : 'downloadFiles',
    description : 'Enables download of files from PLM  BOM(requires given permission in PLM)',
    type        : 'Boolean',
    default     : 'true',
    supportedBy : ['insert-bom']
},{
    name        : 'downloadFormats',
    description : 'Defines list of available formats for BOM file download, based on an array with key / value pairs made of label, filter and tooltip',
    type        : 'Array',
    default     : "[ { label : 'STEP'  , filter : ['.step', '.stp'], tooltip : 'File suffix stp and step will be taken into account' },]",
    supportedBy : ['insert-bom']
},{
    name        : 'downloadRequests',
    description : 'Sets the maximum number of parallel download processes',
    type        : 'Integer',
    default     : 3,
    supportedBy : ['insert-bom']
},{
    name        : 'downloadPatterns',
    description : "Adds additional rename patterns to the download panel. Must contain properties fields, separator and label ( Example: [{ fields : ['NUMBER', 'PDM_ITEM_REVISION'], separator : ' ', label : 'Number PDM-Revision' }]",
    type        : 'Array',
    default     : [],
    supportedBy : ['insert-bom']
},{
    name        : 'includeRelatedFiles',
    description : 'When enabled, related attachments will be displayed as well',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'includeVaultFiles',
    description : 'When enabled, files found in Vault for the matching item will be displayed as well',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'path',
    description : "When set to true, the selected component's path in the BOM will be displayed, providing quick access to its parents",
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'requiredFieldsOnly',
    description : 'When set to true, displays required fields of details page only',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'position',
    description : "When set to true, the BOM position number will be displayed",
    type        : 'Boolean',
    default     : 'true',
    supportedBy : []
},{
    name        : 'revisionBias',
    description : 'Sets the BOM expansion revision bias (release or working)',
    type        : 'String',
    default     : 'release',
    supportedBy : []
},{
    name        : 'rotate',
    description : 'Rotate grid display (change columns and ros)',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'saveButtonLabel',
    description : 'Sets the label of the Save button',
    type        : 'String',
    default     : 'Save',
    supportedBy : ['insertGrid']   
},{
    name        : 'includeBookmarks',
    description : 'When enabled, users also can select the list of bookmarked items of the defined workspace using the views drop down',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'includeMOW',
    description : 'When enabled, users also can access entries of the My Outstanding Work of the defined workspace using the views drop down',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'includeRecents',
    description : 'When enabled, users also can select the list of recently viewed items of the defined workspace using the views drop down',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'useCache',
    description : 'When enabled, cached data will be used if existent. Caching must be enabled in settings.js file before.',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'onClickCancel',
    description : 'Function to invoke when user clicks the Cancel button of the create dialog',
    type        : 'function(id) {}',
    default     : '',
    supportedBy : []
},{
    name        : 'onClickClose',
    description : 'Function to invoke when user clicks the Close button of the item summary display',
    type        : 'function(id) {}',
    default     : '',
    supportedBy : []
},{
    name        : 'autoClick',
    description : 'Once the contents have been loaded, the first entry will be clicked / selected automatically when set to true',
    type        : 'Boolean',
    default     : 'false',
    supportedBy : []
},{
    name        : 'performTransition',
    description : 'Provide the internal ID of a workflow transition from the initial status to let this transition be performed right after item creation',
    type        : 'String',
    default     : '',
    supportedBy : ['insertCreate']
},{
    name        : 'createPerformTransition',
    description : 'Provide the internal ID of a workflow transition from the initial status to let this transition be performed right after new change process creation',
    type        : 'String',
    default     : '',
    supportedBy : ['insertChangeProcesses']

}]}];


$(document).ready(function() {

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