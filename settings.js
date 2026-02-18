// ---------------------------------------------------------------------------------------------------------------------------
//  !! DO NOT MODIFY THIS FILE !!
// ---------------------------------------------------------------------------------------------------------------------------
//  IMPORTANT UPDATE OF DECEMBER 2025
//  In previous releases, you would have inserted your tenant name and clientId here
//  With the update of December 2025, these Ssettings were moved to a new file : environments.Js
//  PLEASE PROVIDE YOUR CONNECTIVITY SETTINGS IN THIS NEW FILE environment.js and not in here
// 
//  If you want to use this UX Server with multiple tenants, use copies of the environment.js file and store them
//  in folder /environments (i.e. /environments/adsktenant.js). After updating the setting these copies, 
//  you can then launch the server with a defined environment file like this:
//  npm start adsktenant 
// 
//  This settings.js file will be used by all instances of this UX Server that you launch, so do not modify it.
//  You can still adjust these settings by overwriting them in a custom file in folder /settings.
//  Use the file /settings/custom.js to provide your custom settings. This file should only contain the settings to be 
//  changed. During startup, the server will merge custom.js with settings.js to determine the right settings to use.
//  You can extend custom.js with additional settings - simply copy the given settings (tree) from settings.js and paste
//  it in custom.js. It is important to keep the full path of the settings starting with 'exports.' This is why the
//  custom.js file already contains the entry points for each application.
// 
//  The custom settings file also should be used to define the workspaceIds of your environment
// 
//  If you want to use this UX Server with multiple tenants and different settings, you can create multiple
//  copies of custom.js in folder /settings. The same can be done with the environment files in folder /environments.
//  Each environment file then refers to the custom settings file to use with the following parameter:
//  exports.settings = 'custom.js';
//  This allows you to reuse the same settings with multiple environments files. At the same time, you can also 
//  define dedicated settings files for each environment file if needed.
//  When starting the UX Server, you can then choose the environment file to use - which will then define the settings
//  file to use as well. For example, if you copied the file /environments/template.js to /environments/adsktenant.js, 
//  you can start with this file like this:
//  npm start adsktenant 
// ---------------------------------------------------------------------------------------------------------------------------



// ---------------------------------------------------------------------------------------------------------------------------
//  STANDARD WORKSPACE DEFINITION
// ---------------------------------------------------------------------------------------------------------------------------
exports.common = {

    workspaceIds : {

        // Product Development Workspaces
        changeOrders           : 84,
        changeRequests         : 83,
        changeTasks            : 80,
        designReviews          : 76,
        designReviewTasks      : 77,
        engineeringProjects    : 213,
        items                  : 57,
        nonConformances        : 98,
        problemReports         : 82,

        // Products & Projects Workspaces
        products               : 95,
        projects               : 86,
        projectTasks           : 90,

        // Supplier Collaboration Workspaces
        sparePartsRequests     : 241,
        supplierPackages       : 147,

        // Asset Management Workspaces
        orderProjects          : 283,
        orderProjectDeliveries : 279,
        assets                 : 280,
        assetItems             : 282,
        assetServices          : 284,
        serialNumbers          : 277,

    },

    workspaces : {
        items : {
            defaultBOMView : 'Tree Navigator', // This BOM view should contain columns Descriptor, Item and BOM Quantity only
            fieldIdNumber  : 'NUMBER'
        }
    },

    viewer : {
        numberProperties       : ['Part Number', 'Name', 'label', 'Artikelnummer', 'Bauteilnummer'],
        suffixPrimaryFile      : ['.iam.dwf', '.iam.dwfx', '.ipt.dwf', '.ipt.dwfx'],
        extensionsIncluded     : ['dwf', 'dwfx', 'nwd', 'ipt', 'stp', 'step', 'sldprt', 'pdf'],
        extensionsExcluded     : [],
        splitPartNumberBy      : ' v',
        splitPartNumberIndexes : [0],
        splitPartNumberSpacer  : '',
        backgroundColor        : [255, 255, 255, 255, 255, 255],
        cacheInstances         : true,
        antiAliasing           : true,
        ambientShadows         : true,
        groundReflection       : false,
        groundShadow           : true,
        lightPreset            : 4,
        conversionAttempts     : 10,
        conversionDelay        : 3000
    }

}



// ---------------------------------------------------------------------------------------------------------------------------
//  APPLICATION SETTINGS
// ---------------------------------------------------------------------------------------------------------------------------
// The config objects contains all settings required by all apps. 
// Each app has a specific property for it settings (ie. the MBOM editor uses config.mbom
// Make sure to restart your server after any change to these settings
exports.applications = {

    abom : {
        bomLabel      : 'Asset BOM',
        assetFieldIDs : {
            ebom          : 'ENGINEERING_BOM',
            abom          : 'ASSET_BOM',
            serialNumbers : 'SERIAL_NUMBERS_LIST'
        },
        assetItems : {
            workspaceId   : null, // uses common.workspaceIds per default
            workspaceName : 'Asset Item',
            bomViewName   : 'Default View',
            fieldIDs: {
                id        : 'ID',
                asset     : 'ASSET',
                number    : 'ITEM_NUMBER',
                item      : 'REFERENCE_ITEM',
                root      : 'REFERENCE_ITEM_ROOT',
                path      : 'REFERENCE_ITEM_PATH',
                endItem   : 'END_ITEM',
                sparePart : 'SPARE_PART',
                purchased : 'PURCHASED',
                serial    : 'SERIAL',
                supplier  : 'SUPPLIER',
            }
        },
        items : {
            bomViewName : 'Asset BOM Editor',
            fields : {
                sparePart     : { fieldId : 'SPARE_WEAR_PART', values : ['spare part', 'yes', 'y']     },
                serialNumber  : { fieldId : 'SERIAL_NUMBER'  , value  : true                           },
                purchasedPart : { fieldId : 'PDM_CATEGORY'   , values : ['purchased', 'purchased part']}
            }
        },
        orderProjectDeliveries : {
            workspaceId : null  // uses common.workspaceIds per default
        },
        viewerFeatures : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : false,
            markup        : false,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    classes : {
        fieldsIncluded : ['DESCRIPTOR', 'WORKSPACE', 'REVISION']
    },

    configurator : {
        wsIdConfigurationFeatures : '274',
        bomViewName               : 'Configurator',
        fieldIdFeatures           : 'FEATURES',
        fieldIdOptions            : 'OPTIONS',
        fieldIdInclusions         : 'INCLUSIONS',
        fieldIdExclusions         : 'EXCLUSIONS',
        fieldIdBOM                : 'MANUFACTURING_BOM',
        fieldIdBOMType            : 'CONFIGURATION_TYPE',
        stateFeatureApproved      : 'Approved',
        labelSingleOptions        : 'Single Options',
        valueAlternatives         : 'Alternatives',
        valueOptional             : 'Optional'
    },

    dashboard : [{
        title      : 'Problem Reporting Dashboard',
        workspace  : 'problemReports',
        newHeader  : 'Create new Problem Report',
        newMessage : 'You encountered an issue? Help us improving our products by submitting a new problem report. This will inform our engineering team automatically.',
        className  : 'problem-report',
        contents   : [ 
            { type : 'workflow-history', params : { id : 'workflow-history' } },
            { type : 'details'         , params : { id : 'details', collapseContents : true, editable : true, toggles : true, singleToolbar : 'controls' } },
            { type : 'markup'          , params : { id : 'markup', fieldIdViewable : 'AFFECTED_ITEM', markupsImageFieldsPrefix : 'IMAGE_' } },
            { type : 'attachments'     , params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'list', tileSize : 'xs' } }
        ],
        icon            : 'icon-problem',
        fieldIdSubtitle : 'DESCRIPTION',
        progress : [
            { label : 'New',         color : 'red',    states : ['Create'] },
            { label : 'Analysis',    color : 'yellow', states : ['Review', 'Technical Analysis'] },
            { label : 'Improvement', color : 'yellow', states : ['CAPA in progress', 'Change Request in progress'] },
            { label : 'Completed',   color : 'green',  states : ['Completed'] }
        ]
    },{
        title     : 'Change Requests Management',
        workspace : 'changeRequests',
        className : 'change-request',
        contents  :   [ 
            { type : 'details'         , params : { id : 'details', collapseContents : true, editable : true, toggles : true, singleToolbar : 'controls' } },
            { type : 'attachments'     , params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'list', tileSize : 'xs' } },
            { type : 'managed-items'   , params : { id : 'managed-items', editable : true, columnsIn : [ 'Item', 'Lifecycle', 'Problem Description', 'Proposed Change'], openInPLM : true } },
            { type : 'workflow-history', params : { id : 'workflow-history' } }
        ],
        icon     : 'icon-workflow',
        progress : [
            { label : 'Planning',    color : '#000000',     states : ['Create']  },
            { label : 'Review',      color : 'red',    states : ['Review & Impact Analysis', 'Peform Tasks', 'Change Control Board Review']  },
            { label : 'In Work',     color : 'yellow', states : ['Change Order in progress']   },
            { label : 'Completed',   color : 'green',  states : ['Completed'] }
        ]
    },{
        title     : 'Change Orders Dashboard',
        workspace : 'changeOrders',
        newHeader  : 'Create new Change Order',
        newMessage : 'Initiate a new Change Order involving the engineering team by providing the key information below first.',
        className  : 'change-order',
        contents   : [ 
            { type : 'details'     , params : { id : 'details', collapseContents : true, editable : true, toggles : true, singleToolbar : 'controls', expandSections : ['Summary'] } },
            { type : 'attachments' , params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'list', tileSize : 'xs' } },
            { type : 'viewer'      , params : { id : 'viewer', fieldIdViewable : 'AFFECTED_ITEM' } },
            { type : 'project'     , params : { id : 'project', headerLabel : 'Change Tasks', createViewerImageFields : ['IMAGE_1'] , editable : true, openInPLM : true, openOnDblClick : true, multiSelect : false, createWorkspaceIds : ['80'], createHeaderLabel : 'New Task', createToggles : true, createHideSections : true, createContextItemField : 'CHANGE_ORDER', createFieldsIn : ['TITLE', 'DESCRIPTION', 'ASSIGNEE', 'TARGET_COMPLETION_DATE', 'IMAGE_1', 'CHANGE_ORDER'] } },
        ],
        icon            : 'icon-markup',
        fieldIdSubtitle : 'DESCRIPTION',
        progress : [
            { label : 'Preparation'    , color : 'blue'  , states : ['Preparation'] },
            { label : 'Change Action'  , color : 'yellow', states : ['Perform Change', 'Results Review'] },
            { label : 'Change Review'  , color : 'red'   , states : ['Change Control Board Review', 'External Review'] },
            { label : 'Acknowledgement', color : 'green' , states : ['Released'] },
            { label : 'Completed'      , color : 'green' , states : ['Implemented'] }
        ]
    },{
        title     : 'Change Tasks Dashboard',
        workspace : 'changeTasks',
        className : 'change-task',
        contents  : [ 
            { type : 'details'         , params : { id : 'details', expandSections : ['Task Details', 'Follow-Up & Status Updates'], editable : true, toggles : true, singleToolbar : 'controls' } },
            { type : 'attachments'     , params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'row', contentSize : 'l' } },
            { type : 'grid'            , params : { id : 'grid', editable : true, headerLabel : 'Efforts'} },
            { type : 'relationships'   , params : { id : 'relationships', headerLabel : 'Deliverables', editable : true, columnsIn : [ 'Item', 'Lifecycle', 'Problem Description', 'Proposed Change'], openInPLM : true } },
            { type : 'workflow-history', params : { id : 'workflow-history' } }
        ],
        icon     : 'icon-mow',
        progress : [
            { label : 'Planned',      color : '#000000',     states : ['Planned' ]},
            { label : 'New',          color : 'red',    states : ['Assigned']},
            { label : 'In Work',      color : 'yellow', states : ['In Work' ]},
            { label : 'Owner Review', color : 'green',  states : ['On Hold', 'Review']},
            { label : 'Done',         color : '#000000',     states : ['Completed']}
        ]
    },{
        title     : 'Non Conformances Tracking Dashboard',
        workspace : 'nonConformances',
        className : 'non-conformance',
        contents  : [ 
            { type : 'workflow-history', params : { id : 'workflow-history' } },
            { type : 'details'         , params : { id : 'details', collapseContents : true, editable : true, toggles : true, singleToolbar : 'controls' } },
            { type : 'markup'          , params : { id : 'markup', fieldIdViewable : 'NONCONFORMING_ITEM', markupsImageFieldsPrefix : 'IMAGE_' } },
            { type : 'attachments'     , params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'list', tileSize : 'xs' } }
        ],
        icon            : 'icon-rules',
        fieldIdSubtitle : 'DESCRIPTION',
        progress : [
            { label : 'New',         color : 'red',    states : ['Identification In Progress'] },
            { label : 'Analysis',    color : 'yellow', states : ['Under Review'] },
            { label : 'Improvement', color : 'yellow', states : ['Disposition In Progress', 'CAPA In Progress'] },
            { label : 'Closed',      color : 'green',  states : ['Closed'] }
        ]
    },{
        title     : 'Project Tasks Management',
        workspace : 'projectTasks',
        className : 'project-task',
        contents  : [ 
            { type : 'workflow-history', className : 'surface-level-1', params : { id : 'workflow-history' } },
            { type : 'details'         , className : 'surface-level-1', params : { id : 'details', collapseContents : true, editable : true, toggles : true, singleToolbar : 'controls' } },
            { type : 'grid'     , className : 'surface-level-1', params : { id : 'grid', editable : true, headerLabel : 'Efforts', singleToolbar : 'controls' } },
            { type : 'relationships'     , className : 'surface-level-1', params : { id : 'relationships', editable : true, headerLabel : 'Deliverables', singleToolbar : 'controls', layout : 'list', tileSize : 'xs' } },
            { type : 'attachments'     , className : 'surface-level-1', params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'list', tileSize : 'xs' } }
        ],
        icon : 'icon-layers',
        progress : [
            { label : 'Planning',    color : 'red',    states : ['Planning']  },
            { label : 'Assigned',    color : 'red',    states : ['Assigned']  },
            { label : 'In Work',     color : 'yellow', states : ['In Work']   },
            { label : 'Review',      color : 'green',  states : ['Review']    },
            { label : 'Completed',   color : 'green',  states : ['Completed'] }
        ]
    },{
        title     : 'Supplier Collaboration Platform',
        workspace : 'supplierPackages',
        className : 'supplier-package',
        contents  : [ 
            { type : 'details'    , className : 'surface-level-1', params : { id : 'details', collapseContents : true, editable : true, toggles : true, singleToolbar : 'controls' } },
            { type : 'attachments', className : 'surface-level-1', params : { id : 'attachments', editable : true, headerLabel : 'Files', singleToolbar : 'controls', layout : 'list', tileSize : 's' } },
            { type : 'grid'       , className : 'surface-level-1', params : { id : 'grid', editable : true, headerLabel : 'Line Items', singleToolbar : 'controls' } },
        ],
        icon : 'icon-workflow',
        progress : [
            { label : 'Planning',      color : 'red',     states : ['Requested']  },
            { label : 'In Progress',   color : 'yellow',  states : ['In Work', 'Clarification']   },
            { label : 'Completed',     color : 'green',   states : ['Completed'] }
        ]
    }],

    explorer : {
        bomViewName      : 'Details',
        fieldIdPRImage   : 'IMAGE_1',
        fieldIdPRContext : 'AFFECTED_ITEM',
        rollUpFields     : [],
        problemReports   : { workspaceId : null },   // uses common.workspaceIds per default
        supplierPackages : { workspaceId : null },   // uses common.workspaceIds per default
        kpis : [
            // ------------------------------------------------------------------------------------------------------------------
            // Use the following parameters to define the KPIs:
            //  - fieldId       : Field / selectable containing the value of the KPI
            //  - sortBy        : value (numeric value), label (text being displayed) or count (item count). Default is count
            //  - sortDirection : ascending or descending. Default is descending
            //  - title         : Label being displayed as KPI title
            //  - type          : non-empty (validates if value is set or not), value, days
            // ------------------------------------------------------------------------------------------------------------------
            { id : 'lifecycle', title : 'Item Lifecycle', fieldId : 'LIFECYCLE', type : 'value', style : 'counters', data : [
                { value : 'Working',     color : 0, vector : 'red'    },
                { value : 'Pre-Release', color : 2, vector : 'yellow' },
                { value : 'Production',  color : 4, vector : 'green'  }
            ]},
            { id : 'change', title : 'Pending Change', fieldId : 'WORKING_CHANGE_ORDER', type : 'non-empty', style : 'counters', data : [
                { value : 'Yes', color : 0, vector : 'red'   },
                { value : 'No' , color : 4, vector : 'green' }
            ]},
            { id : 'change-order', title : 'Change Orders', fieldId : 'WORKING_CHANGE_ORDER', type : 'value',  style : 'bars',  data : [] },
            { id : 'revision', title : 'Revision', fieldId : 'REVISION', type : 'value', style : 'bars', data : [] },
            { id : 'status', title : 'Status', fieldId : 'STATUS', type : 'value', style : 'counters', data : [
                { value : 'Superseded', color : 0, vector : 'red'    },
                { value : 'Working'   , color : 2, vector : 'yellow' },
                { value : 'Latest'    , color : 4, vector : 'green'  }
            ]},   
            { id : 'release-date', title : 'Release Date', fieldId : 'RELEASE_DATE', type : 'days', style : 'bars', data : [], sortBy : 'value', sortDirection : 'ascending' },
            { id : 'type', title : 'Type', fieldId : 'TYPE', type : 'value', style : 'bars', data : [] },
            { id : 'top-level-class-name', title : 'Top Level Class', fieldId : 'TOP_LEVEL_CLASS', type : 'value', style : 'bars', data : [] },
            { id : 'class-name', title : 'Class', fieldId : 'CLASS_NAME', type : 'value', style : 'bars', data : [] },
            { id : 'pdm-category', title : 'PDM Category', fieldId : 'PDM_CATEGORY', type : 'value', style : 'bars', data : [] },
            { id : 'pdm-location', title : 'PDM Location', fieldId : 'PDM_LOCATION', type : 'value', style : 'bars', data : [] },
            { id : 'pdm-last-modification-date', title : 'PDM Last Modification', fieldId : 'PDM_LAST_MODIFICATION_DATE', type : 'days', style : 'bars', data : [], sortBy : 'value', sortDirection : 'ascending' },
            { id : 'responsible-designer', title : 'Responsible Designer', fieldId : 'RESPONSIBLE_DESIGNER', type : 'value', style : 'bars', data : [] },
            { id : 'spare-part', title : 'Spare Part', fieldId : 'SPARE_WEAR_PART', type : 'value', style : 'counters', data : [
                { value : '-'         , color : 0, vector : 'red'    },
                { value : 'Wear Part' , color : 2, vector : 'yellow' },
                { value : 'Spare Part', color : 4, vector : 'green'  }
            ]},
            { id : 'has-pending-packages', title : 'Has Pending Packages', fieldId : 'HAS_PENDING_PACKAGES', type : 'value', style : 'counters', data : [
                { value : 'Yes' , color : 0, vector : 'red'    },
                { value : '-'   , color : 2, vector : 'yellow' },
                { value : 'No'  , color : 4, vector : 'green'  }
            ]},
            { id : 'make-or-buy', title : 'Make or Buy', fieldId : 'MAKE_OR_BUY', type : 'value', style : 'counters', data : [
                { value : 'Buy' , color : 0, vector : 'red'    },
                { value : '-'   , color : 2, vector : 'yellow' },
                { value : 'Make', color : 4, vector : 'green'  }
            ]},
            { id : 'vendor', title : 'Vendor', fieldId : 'VENDOR', type : 'value', style : 'bars', data : [] },
            { id : 'country', title : 'Country', fieldId : 'COUNTRY', type : 'value', style : 'bars', data : [] },
            { id : 'total-cost', title : 'Total Cost', fieldId : 'TOTAL_COST', type : 'value', style : 'bars', data : [] },
            { id : 'lead-time', title : 'Lead Time', fieldId : 'LEAD_TIME', type : 'value', sortBy : 'value', style : 'bars', data : [] },
            { id : 'long-lead-time', title : 'Long Lead Time', fieldId : 'LONG_LEAD_TIME', type : 'value', style : 'counters', data : [
                { value : 'Yes' , color : 0, vector : 'red'    },
                { value : '-'   , color : 2, vector : 'yellow' },
                { value : 'No'  , color : 4, vector : 'green'  }
            ]},
            { id : 'material', title : 'Material', fieldId : 'MATERIAL', type : 'value', style : 'bars', data : [] },
            { id : 'total-weight', title : 'Total Weight', fieldId : 'TOTAL_WEIGHT', type : 'value', style : 'bars', data : [] },
            { id : 'quality-inspection-required', title : 'Quality Inspection Required', fieldId : 'INSPECTION_REQUIRED', type : 'value', style : 'counters', data : [
                { value : 'Yes' , color : 0, vector : 'red'   },
                { value : '-'   , color : 2, vector : 'yellow' },
                { value : 'No'  , color : 4, vector : 'green'  }
            ]},
            { id : 'quality-inspection-result', title : 'Latest Quality Inspection Result', fieldId : 'LATEST_QI_RESULT', type : 'value', style : 'bars', data : [
                { value : '-'          , color : 3, vector : 0        },
                { value : 'FAIL'       , color : 0, vector : 'red'    },
                { value : 'In Progress', color : 2, vector : 'yellow' },
                { value : 'PASS'       , color : 4, vector : 'green'  }
            ]},
            { id : 'reach', title : 'REACH', fieldId : 'REACH', type : 'value', style : 'bars', data : [
                { value : 'Not Compliant' , color : 0, vector : 'red'    },
                { value : 'Unknown'       , color : 1, vector : 'yellow' },
                { value : 'Not Validated' , color : 2, vector : 'yellow' },
                { value : 'Not Required'  , color : 3, vector : 0        },
                { value : 'Compliant'     , color : 4, vector : 'green'  }
            ] },
            { id : 'rohs', title : 'RoHS', fieldId : 'ROHS', type : 'value', style : 'bars', data : [
                { value : 'Not Compliant' , color : 0, vector : 'red'    },
                { value : 'Unknown'       , color : 1, vector : 'yellow' },
                { value : 'Not Validated' , color : 2, vector : 'yellow' },
                { value : 'Not Required'  , color : 3, vector : 0        },
                { value : 'Compliant'     , color : 4, vector : 'green'  }
            ]}
        ],
        viewerFeatures: {
            contextMenu   : true,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : true,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    impactanalysis : {
        fieldIdStockQuantity              : 'STOCK_QUANTITY',
        fieldIdNextProductionOrderQantity : 'NEXT_PO_QUANTITY',
        fieldIdPendingSupplies            : 'PENDING_SUPPLIES',
        fieldIdProductionOrdersData       : 'PO_DATA',
        viewerFeatures: {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : false,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },
    
    insights : {
        hideUserNames      : false,
        maxLogEntries      : 500000, // The total number of log entries being processed. Increasing this value may impact performance.
        maxEventLogEntries : 10000, // Set this to 0 in order to disable the Event Log tab overall; a maximum of 50.000 gets applied anyway
        usersExcluded      : ['Administrator', 'Import User', 'Job User', 'Integration User'],
        workspacesExcluded : ['Approval Lists', 'Change Approval Templates', 'Checklist Templates', 'Project Templates']
    },

    instances : {
        assets : {
            workspaceId : null,   // uses common.workspaceIds.assets per default
            fieldIdBOM  : 'ENGINEERING_BOM'
        },
        landingHeader     : 'Select From Exsiting Assets',
        bomViewName       : 'Instance Editor',
        exportFileName    : 'Serial Numbers',
        tabs : [{
            label       : 'Serial Numbers',
            fieldId     : 'SERIAL_NUMBERS_LIST',
            workspaceId : null, // uses common.workspaceIds.serialNumbers per default
            colorIndex  : 1,
            bomIcon     : 'icon-tag',
            fieldsIn    : ['Serial #', 'Installation Date', 'Item Title', 'Rev', '#', 'Instance Path'],
            fieldsList  : {
                partNumber   : 'NUMBER',
                title        : 'ITEM_TITLE',
                revision     : 'ITEM_REV',
                path         : 'LOCATION',
                instanceId   : 'INSTANCE_ID',
                instancePath : 'INSTANCE_PATH',
                boundingBox  : 'BOUNDING_BOX'
            },
            groupBy : 'NUMBER',
            sortOrder : [
                { sortBy : 'INSTANCE_ID', sortType : 'integer', sortDirection : 'ascending' },
                { sortBy : 'LOCATION'   , sortType : 'string' , sortDirection : 'ascending' }
            ],            
            filter      : {
                fieldId : 'SERIAL_NUMBER',
                value   : true
            }
        // },{            
        //     label       : 'Motors',
        //     fieldId     : 'SERIAL_NUMBERS_LIST',
        //     workspaceId : 276,
        //     colorIndex  : 2,
        //     bomIcon     : 'icon-item',
        //     fieldsIn    : ['Supplier', 'Model', 'Serial #', 'Power Supply', 'Installation Date', 'Location', 'Item Title', 'Item Rev', 'Instance #', 'Instance Path'],
        //     fieldsList  : {
        //         partNumber   : 'NUMBER',
        //         title        : 'ITEM_TITLE',
        //         revision     : 'ITEM_REV',
        //         path         : 'LOCATION',
        //         instanceId   : 'INSTANCE_ID',
        //         instancePath : 'INSTANCE_PATH',
        //         boundingBox  : 'BOUNDING_BOX'
        //     },
        //     groupBy     : 'NUMBER',
        //     sortOrder : [
        //         { sortBy : 'INSTANCE_ID', sortType : 'integer', sortDirection : 'ascending' },
        //         { sortBy : 'LOCATION'   , sortType : 'string' , sortDirection : 'ascending' }
        //     ],
        //     filter      : {
        //         fieldId : 'MOTOR',
        //         value   : true
        //     }
        // },{
        //     label       : 'Sensors',
        //     fieldId     : 'SERIAL_NUMBERS_LIST',
        //     workspaceId : 277,
        //     colorIndex  : 3,
        //     bomIcon     : 'icon-highlight',
        //     fieldsIn    : ['Serial #', 'Installation Date', 'Location', 'Item Title', 'Item Rev', 'Instance #', 'Instance Path'],
        //     fieldsList  : {
        //         partNumber   : 'NUMBER',
        //         title        : 'ITEM_TITLE',
        //         revision     : 'ITEM_REV',
        //         path         : 'LOCATION',
        //         instanceId   : 'INSTANCE_ID',
        //         instancePath : 'INSTANCE_PATH',
        //         boundingBox  : 'BOUNDING_BOX'
        //     },
        //     groupBy     : 'NUMBER',
        //     sortOrder : [
        //         { sortBy : 'INSTANCE_ID', sortType : 'integer', sortDirection : 'ascending' },
        //         { sortBy : 'LOCATION'   , sortType : 'string' , sortDirection : 'ascending' }
        //     ],
        //     filter      : {
        //         fieldId : 'SENSOR',
        //         value   : true
        //     }
        // },{
        //     label       : 'Control Elements',
        //     fieldId     : 'SERIAL_NUMBERS_LIST',
        //     workspaceId : 278,
        //     colorIndex  : 4,
        //     bomIcon     : 'icon-sliders',
        //     fieldsIn    : ['Serial #', 'Installation Date', 'Location', 'Item Title', 'Item Rev', 'Instance #', 'Instance Path'],
        //     fieldsList  : {
        //         partNumber   : 'NUMBER',
        //         title        : 'ITEM_TITLE',
        //         revision     : 'ITEM_REV',
        //         path         : 'LOCATION',
        //         instanceId   : 'INSTANCE_ID',
        //         instancePath : 'INSTANCE_PATH',
        //         boundingBox  : 'BOUNDING_BOX'
        //     },
        //     groupBy     : 'NUMBER',
        //     sortOrder : [
        //         { sortBy : 'INSTANCE_ID', sortType : 'integer', sortDirection : 'ascending' },
        //         { sortBy : 'LOCATION'   , sortType : 'string' , sortDirection : 'ascending' }
        //     ],
        //     filter      : {
        //         fieldId : 'CONTROL_ELEMENT',
        //         value   : true
        //     }            
        }],
        viewerFeatures : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : true,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : false,
            reset         : true,
            views         : true,
            selectFile    : false
        }
    },

    mbom : {
        workspaceEBOM : {
            workspaceId : null, // uses common.workspaceIds.items per default
            bomView     : 'MBOM Transition',
            depth       : 10,
            fieldIDs    : {
                mbom         : 'MBOM',
                makeOrBuy    : 'MAKE_OR_BUY',
                number       : 'NUMBER',
                type         : 'TYPE',
                category     : 'PDM_CATEGORY',
                code         : 'PROCESS_CODE',
                endItem      : 'END_ITEM',
                matchesMBOM  : 'MATCHES_MBOM',
                ignoreInMBOM : 'IGNORE_IN_MBOM',
                lastMBOMSync : 'LAST_MBOM_SYNC',
                lastMBOMUser : 'LAST_MBOM_USER'
            }
        },
        workspaceMBOM : {
            workspaceId : null, // uses common.workspaceIds.items per default
            bomView     : 'MBOM Transition',
            depth       : 10,
            fieldIDs    : {
                ebom         : 'EBOM',
                number       : 'NUMBER',
                title        : 'TITLE',
                isProcess    : 'IS_PROCESS',
                type         : 'TYPE',
                category     : 'PDM_CATEGORY',
                code         : 'PROCESS_CODE',
                ebomRoot     : 'EBOM_ROOT_ITEM',
                lastMBOMSync : 'LAST_MBOM_SYNC',
                lastMBOMUser : 'LAST_MBOM_USER',
            },
            bomFieldIDs : {
                makeOrBuy  : 'BOM_MAKE_OR_BUY',
                isEBOMItem : 'IS_EBOM_ITEM',
            }
        },
        mbomRoot : {
            fieldsToCopy : [
                { ebom : 'TITLE'      , mbom : 'TITLE'       },
                { ebom : 'DESCRIPTION', mbom : 'DESCRIPTION' }
            ],
            typeValue : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES/options/34'
        },
        newProcessDefaults : [ 
            //['TYPE',        { link : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES/options/34'      }],
            //['MAKE_OR_BUY', { link : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_MAKE_OR_BUY/options/2' }] 
        ],
        matchNewProcessNumber : true,
        switchEBOMRevision    : 'no',      // no | working | latest
        picklistIDMakeOrBuy   : 'CUSTOM_LOOKUP_ITEM_MAKE_OR_BUY',
        labelInsertNode       : 'Add Process',
        pinEBOMItemsInMBOM    : true,
        suffixMBOMNumber      : '-M',

        predefinedSearchesInAddItems : [
            { title : 'Purchased Parts', query : 'ITEM_DETAILS:MAKE_OR_BUY%3DBuy' },
            { title : 'Packaging Parts', query : 'ITEM_DETAILS:TYPE%3DPackaging'  },
            { title : 'Processes'      , query : 'ITEM_DETAILS:TYPE%3DProcess'    }
        ],
        sectionsInCreateForm : [ 'Basic', 'Technical Details' ],
        displayOptions : {
            bomColumnNumber  : true,
            bomColumnCode    : true,
            bomColumnMakeBuy : true,
            tabDisassemble   : true,
            tabOperations    : true,
            excelExport      : true
        },        
        viewerFeatures : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : true,
            hide          : true,
            ghosting      : true,
            highlight     : false,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    portal : {
        autoClick        : true,
        openMostRecent   : true,
        searchInputText  : 'Enter part number', 
        searchTileImages : true,
        workspacesIn     : ['Items', 'Items and BOMs'],
        bomLevels        : 10,
        downloadFiles    : true,
        downloadRequests : 5,
        downloadFormats  : [
            { label : 'PDF'   , filter : ['.pdf']         , tooltip : '' },
            { label : 'STEP'  , filter : ['.step', '.stp'], tooltip : 'File suffix stp and step will be taken into account' },
            { label : 'Office', filter : ['.docx', '.doc', 'xls', 'xlsx', 'ppt', 'pptx'], tooltip : 'This will download all files with suffix doc, docx, xls, xlsx, ppt and pptx' },
        ],
        downloadPatterns : [],
        expandSections   : ['Basic'],
        sectionsExcluded : ['AML Summary', 'Quality Inspection', 'Sustainability', 'Compliance', 'Others'],
        sectionsIncluded : [],
        sectionsOrder    : ['Basic', 'Technical Details', 'PDM Data'],
        fieldsExcluded   : ['CLASS_DATA', 'ESTIMATED_COST', 'PENDING_PACKAGES'],
        fieldsIncluded   : [],
        viewingFormats   : ['dwf', 'dwfx'],
        suppressLinks    : false,
        viewerFeatures   : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : false,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },  

    portfolio : {
        hierarchy        : ['Product Categories', 'Product Lines', 'Products'],
        bomLevels        : 10,
        viewerFeatures    : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : false,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    projects : {
        workspaceId : null,   // uses common.workspaceIds per default
        query       : '*'
    },

    reports : {
        startupReportNames : ['Audits by Workflow State', 'CR approval status', 'DRT: Due Dates', 'Project Planned Effort', 'PR: Problem Report Sources', 'PR: Priority of PRs in progress', 'EX: Change Requests'],
        startupReportCount : 5
    },

    reviews : {
        fieldIdItem   : 'ITEM',
        fieldIdImage  : 'IMAGE',
        fieldIdMarkup : 'MARKUP',
        transitionId  : 'CLOSE_REVIEW',
        bomDepth      : 3,
        workspaces    : {
            designReviews : {
                workspaceId : null,   // uses common.workspaceIds per default
                sections    : [ { name : 'Review Findings' } ],
                states      : [ 'Planning', 'Preparation', 'In Progress' ]
            },
            designReviewTasks : {
                workspaceId : null,   // uses common.workspaceIds per default
                sections    : [ { name : 'Definition' }, { name : 'Schedule' } ],
                states      : [ 'Assigned', 'On Hold', 'In Work', 'Review', 'Complete' ]
            }
        },
        viewerFeatures  : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : true,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    sbom : {
        appTitle  : 'Service BOM Editor',
        sourceBOM : {
            fieldId     : 'ENGINEERING_BOM',
            bomViewName : 'Service',
            headerLabel : 'Engineering BOM'
        },
        targetBOM : {
            fieldId       : 'SERVICE_BOM',
            bomViewName   : 'Service',
            itemTypeValue : 'Service BOM',
            prefixTitle   : 'Service BOM of ',
            filterLabelIn : 'Show Items contained in Service BOM only',
            filterLabelEx : 'Hide Items contained in Service BOM',
            defaults : {
                number      : { copyFrom : 'bom.NUMBER'     , prefix  : ''               , suffix : '-SBOM' },
                title       : { copyFrom : 'ctx.TITLE'      , prefix  : 'Service BOM of ', suffix : ''      },
                description : { copyFrom : 'bom.DESCRIPTION', prefix  : ''               , suffix : ''      },
            }
        },
        itemsFieldIds : {
            number      : 'NUMBER',
            title       : 'TITLE',
            description : 'DESCRIPTION',
            type        : 'TYPE'
        },
        picklistIdItemType : 'CUSTOM_LOOKUP_ITEM_TYPES',
        itemHighlight : {
            fieldId        : 'SPARE_WEAR_PART',
            fieldValues    : ['spare', 'spare part', 'yes', 'x', 'y', 'true'],
            bomColumnTitle : 'Spare/Wear',
            filterLabelIn  : 'Show Recommended Spare Parts Only',
            filterLabelEx  : 'Hide Recommended Spare Parts'
        },
        bomTypes : [{
            mode          : 'list',
            tabLabel      : 'Spare Parts',
            buttonLabels  : ['Add all recommended'],
            bomItemTypes  : ['Spare Parts List'],
            icon          : 'icon-details',
            color         : 'red',
            filterLabelIn : 'Show Spare Parts List Items Only',
            filterLabelEx : 'Hide Spare Parts List Items',
            basePosNumber : 101,
            hideQuantity  : true
        },{
            mode          : '1-level-bom',
            tabLabel      : 'Maintenance Kits',
            buttonLabels  : ['New Kit'],
            bomItemTypes  : ['Service Kit'],
            icon          : 'icon-product',
            color         : 'green',
            filterLabelIn : 'Show Maintenance Kit Items Only',
            filterLabelEx : 'Hide Maintenance Items',
            basePosNumber : 201
        },{
            mode          : '2-levels-bom',
            tabLabel      : 'Services',
            buttonLabels  : ['New Service', 'New Operation'],
            bomItemTypes  : ['Service Offering', 'Service Operation'],
            icon          : 'icon-service',
            color         : 'yellow',
            filterLabelIn : 'Show Services Items Only',
            filterLabelEx : 'Hide Services Items',
            basePosNumber : 301
        }],
        enableBOMPin : false,
        viewerFeatures : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : false,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : false
        }
    },

    service : {
        labels : {
            homeSparePartRequests : 'Spare Part Requests',
            homeProblemReports    : 'Problem Reports'
        },
        products : {
            workspaceId  : null,   // uses common.workspaceIds per default
            headerLabel  : 'Serviceable Products',
            icon         : 'icon-product',
            groupBy      : 'PRODUCT_LINE',
            contentSize  : 'l',
            tileImage    : 'IMAGE',
            tileTitle    : 'TITLE',
            tileSubtitle : 'DESCRIPTION',
            filter       : [{
                field      : 'ENGINEERING_BOM',
                type       : 0,
                comparator : 21,
                value      : ''
            }],
            fieldIDs : {
                ebom : 'ENGINEERING_BOM',
                sbom : 'SERVICE_BOM'
            }           
        },
        items : {
            bomViewName           : 'Service',
            bomRevisionBias       : 'release',
            fieldIdSparePart      : 'SPARE_WEAR_PART',
            fieldValuesSparePart  : ['spare part', 'yes', 'x', 'y', 'wear part'],
            endItemFilter         : { fieldId : 'SBOM_END_ITEM', value : true },
            sparePartTileTitle    : 'NUMBER',
            sparePartTileSubtitle : 'TITLE',
        },       
        sparePartsRequests : {
            workspaceId         : null,   // uses common.workspaceIds per default
            sectionsExpanded    : [ 'Requestor Contact Details', 'Request Details' ],
            sectionsExcluded    : [ 'Planning & Tracking', 'Request Confirmation', 'Quote Submission & Response', 'Real Time KPIs', 'Workflow Activity', 'Quote Summary', 'Order Processing', 'Related Processes' ],
            gridColumnsExcluded : [ 'Line Item Cost', 'Availability [%]', 'Manufacturer', 'Manufacturer P/N', 'Unit Cost', 'Total Cost', 'Make or Buy', 'Lead Time (w)', 'Long Lead Time'],
            stateColors         : [
                { color : '#faa21b', states : ['Received']                            , label : 'New'      },
                { color : '#dd2222', states : ['Awaiting Response', 'Quote Submitted'], label : 'TODO'     },
                { color : '#faa21b', states : ['Order in process', 'Shipment']        , label : 'Shipment' },
                { color : '#6a9728', state  : 'Completed'                             , label : 'Complete' }
            ],
        },
        problemReports : {
            workspaceId        : null,   // uses common.workspaceIds per default
            fieldIdImage       : 'IMAGE_1',
            transitionOnCreate : 'SUBMIT',
            sectionsExpanded   : ['Header', 'Details'],
            sectionsExcluded   : [],
            stateColors  : [
                { color : '#222222', state  : 'Create'                                           , label : 'New'      },
                { color : '#faa21b', states : ['Review','Technical Analysis']                    , label : 'Review'   },
                { color : '#6a9728', state  : 'Completed'                                        , label : 'Complete' },
                { color : '#dd2222', states : ['Change Request in progress', 'CAPA in prorgress'], label : 'In Work'  }
            ]
        },  
        serviceBOMTypes : {
            sparePart : {
                fieldValue : 'Spare Parts List',
                groupLabel : 'Spare Parts',
                icon       : 'icon-package'
            },
            kit : {
                fieldValue : 'Service Kit',
                groupLabel : 'Kits',
                icon       : 'icon-list'
            },
            offering : {
                fieldValue : 'Service Offering',
                groupLabel : 'Service Offerings',
                icon       : 'icon-layers'
            },
            custom : {
                icon      : 'icon-settings'
            }
        },                 
        assetServices : {
            workspaceId     : null,   // uses common.workspaceIds per default
            headerLabel     : 'Pending Asset Services',
            icon            : 'icon-product',
            fieldIDAssignee : 'ASSIGNEE',
            hideStates      : ['Completed', 'Cancelled'],
            fieldIDs        : {
                asset       : 'ASSET',
                assignee    : 'ASSIGNEE',
                serialnrs   : 'SERIAL_NUMBERS_LIST'
            },
            detailsPanel : {
                headerLabel     : 'Asset Service Ticket',
                expandSections  : ['Asset Details'],
                excludeSections : ['Images'],
                layout          : 'narrow',
            }
        },
        orderProjects : {
            workspaceId  : null,   // uses common.workspaceIds per default
            headerLabel  : 'Projects / Facilities',
            hideStates   : ['Archived', 'Decomissioned'],
            tileSubtitle : 'CUSTOMER',
            tileDetails  : [{
                icon     : 'icon-flag',
                fieldId  : 'COUNTRY',
                prefix   : 'Country'
            }, {
                icon    : 'icon-city',
                fieldId : 'CITY',
                prefix  : 'City'
            }],
        },
        assets : {
            workspaceId  : null,   // uses common.workspaceIds per default
            icon         : 'icon-product',
            tableColumns : ['ASSET_SN', 'ASSET_GROUP', 'ASSET_TYPE', 'ASSET_SYSTEM', 'ASSET_FUNCTION'],
            fieldIDs     : {
                project   : 'PROJECT',
                ebom      : 'ENGINEERING_BOM',
                sbom      : 'SERVICE_BOM',
                serialnrs : 'SERIAL_NUMBERS_LIST'
            }
        },
        serialNumbers : {
            tableColumns : ['ID', 'STATUS', 'SERIAL', 'ITEM_NUMBER', 'NUMBER', 'ITEM_REV', 'LOCATION', 'SUPPLIER', 'PREVIOUS_SERIAL', 'INSTANCE_ID', 'INSTANCE_PATH'],
            fieldIDs : {
                partNumber   : 'NUMBER',
                path         : 'LOCATION',
                instanceId   : 'INSTANCE_ID',
                instancePath : 'INSTANCE_PATH'
            },
        },  
        paramsBOM : {
            hideDescriptor   : false,
            fieldsIn         : [ 'Item', 'Quantity', 'Qty' ],
            downloadFiles    : true,
            downloadRequests : 5,
            downloadFormats  : [
                { label : 'PDF'   , filter : ['.pdf']         , tooltip : '' },
                { label : 'STEP'  , filter : ['.step', '.stp'], tooltip : 'File suffix stp and step will be taken into account' },
                { label : 'Office', filter : ['.docx', '.doc', 'xls', 'xlsx', 'ppt', 'pptx'], tooltip : 'This will download all files with suffix doc, docx, xls, xlsx, ppt and pptx' },
            ], 
        },
        paramsItemDetails : {
            id               : 'details-top',
            headerLabel      : 'descriptor',
            layout           : 'narrow',
            collapseContents : true,
            useCache         : true,
            fieldsEx         : ['ACTIONS'],
            sectionsEx       : ['Sourcing Summary','Others']
        },
        paramsItemAttachments : { 
            extensionsEx    : ['.dwf','.dwfx'],
            headerLabel     : 'Files',
            layout          : 'list',
            filterByType    : true,
            contentSize     : 'xs'
        },
        paramsDocumentation : {
            extensionsEx : ['.dwf','.dwfx'],
            layout       : 'list',
            size         : 'm'
        },
        applicationFeatures : {
            homeButton              : true,
            itemDetails             : true,
            itemAttachments         : true,
            contextDocumentation    : true,
            manageSparePartRequests : true,
            manageProblemReports    : true,
            showStock               : true,
            requestWorkflowActions  : true,
            problemWorkflowActions  : true,
            enableCustomRequests    : true,
            openInPLM               : true
        },        
        viewerFeatures : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : true,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    variants : {
        workspaceItems  : {
            bomViewName : null // uses common.workspaces.items.defaultBOMView per default
        },
        workspaceItemVariants : {
            workspaceId       : 571,
            sectionLabel      : 'Variant Definition',
            fieldIds          : {
                baseItem      : 'BASE_ITEM',
                title         : 'TITLE',
                rootDMSId     : 'BASE_ROOT_DMS_ID',
            },
            bomFieldIdBaseBOMPath : 'BASE_BOM_PATH',
            bomViewName           : 'Variant Manager'
        },
        newItemVariantsTitle : {
            fieldsToConcatenate : ['COLOUR', 'MATERIAL'],
            separator           : ' / '
        },
        maxBOMLevels : 4,
        viewerFeatures : {
            contextMenu   : false,
            cube          : false,
            orbit         : false,
            firstPerson   : false,
            camera        : false,
            measure       : true,
            section       : true,
            explodedView  : true,
            modelBrowser  : false,
            properties    : false,
            settings      : false,
            fullscreen    : true,
            markup        : false,
            hide          : true,
            ghosting      : true,
            highlight     : true,
            single        : true,
            fitToView     : true,
            reset         : true,
            views         : true,
            selectFile    : true
        }
    },

    addins : {

        item : {
            expandSections : [ 'Basic', 'Technical Details' ],
            sectionsEx     : [ 'Others' ],
            fieldsEx       : [ 'ACTIONS' ]
        },

        projects : {

            workspaceId                  : null,   // uses common.workspaceIds per default
            stateCompleted               : 'Completed',
            headerLabelProjects          : 'Engineering Projects',
            fieldIdBOM                   : 'DELIVERABLE_4',
            tabNameBOM                   : 'BOM',
            tabNameDetails               : 'Details',
            projectDetailsSectionsEx     : [ 'Project Schedule', 'Closure' ],
            projectDetailsExpandSections : [ 'Task Details', 'Header', 'Details' ]

        },

        tasks : {

            headerLabelTasks    : 'My Work List',
            columnsExTasks      : [ 'State Set On', 'State Set By', 'State' ],
            workspacesInTasks   : [ 'Change Tasks', 'Change Requests', 'Change Orders', 'Problem Reports', 'Project Tasks' ],
            expandSectionsTask  : [ 'Task Details', 'Header', 'Details' ]

        }

    }

}



// ---------------------------------------------------------------------------------------------------------------------------
//  MAIN MENU CONFIGURATION
// ---------------------------------------------------------------------------------------------------------------------------
// Configure the main menu for the main toolbar enabling users to quickly switch the UX utilities
// Set the lists of commands to an empty array (commands : []) to disable the given menu
exports.menu = [
    [{
        label      : 'Business Applications',
        adminsOnly : false,
        commands   : [{
            icon       : 'icon-3d',
            title      : 'Portal',
            subtitle   : 'Quick access to all product data',
            url        : '/portal',
            adminsOnly : false
        },{
            icon     : 'icon-tiles',
            title    : 'Product Portfolio Catalog',
            subtitle : 'Browse your current product portfolio',
            url      : '/portfolio'
        },{
            icon     : 'icon-columns',
            title    : 'Workspace Navigator',
            subtitle : 'Manage your master data easily',
            url      : '/navigator'
        },{
            icon     : 'icon-book',
            title    : 'Class Browser',
            subtitle : 'Use classification for your data research',
            url      : '/classes'
        },{
            icon     : 'icon-trend-chart',
            title    : 'Product Data Explorer',
            subtitle : 'Track design maturity using defined KPIs',
            url      : '/explorer'
        },{
            icon     : 'icon-service',
            title    : 'Service Portal',
            subtitle : 'Real time spare parts information',
            url      : '/service'
        }]
    }],[{
        label      : 'Dashboards',
        adminsOnly : false,
        commands   : [{
            icon     : 'icon-important',
            title    : 'Problem Reporting Dashboard',
            subtitle : 'Capture and resolve problem reports',
            url      : '/dashboard?wsId=82'
        },{
            icon     : 'icon-released',
            title    : 'Non Conformances Dashboard',
            subtitle : 'Capture and resolve quality issues',
            url      : '/dashboard?wsId=98'
        },{
            icon     : 'icon-workflow',
            title    : 'Change Requests Dashboard',
            subtitle : 'Create and manage Change Requests',
            url      : '/dashboard?wsId=83'
        },{
            icon     : 'icon-markup',
            title    : 'Change Orders Dashboard',
            subtitle : 'Create and manage Change Orders & Tasks',
            url      : '/dashboard?wsId=84'
        },{
            icon     : 'icon-mow',
            title    : 'Change Tasks Dashboard',
            subtitle : 'Review, perform and complete assigned tasks',
            url      : '/dashboard?wsId=80'    
        },{
            icon     : 'icon-dashboard',
            title    : 'Reports Dashboard',
            subtitle : 'Gain insights using your PLM reports',
            url      : '/reports'
        },{
            icon     : 'icon-timeline',
            title    : 'Projects Dashboard',
            subtitle : 'Review timeline of NPI projects in progress',
            url      : '/projects'
        }]
    }],[{
        label      : 'Administration Utilities',
        adminsOnly : true,
        commands   : [{
            icon     : 'icon-status',
            title    : 'Data Manager',
            subtitle : 'Automate data processing tasks',
            url      : '/data'
        },{
            icon     : 'icon-rules',
            title    : 'Tenant Comparison',
            subtitle : 'Deploy changes securely with automated comparison',
            url      : '/comparison'
        },{
            icon     : 'icon-bar-chart-stack',
            title    : 'Tenant Insights',
            subtitle : 'Track user activity and data creation in your tenant',
            url      : '/insights'
        },{
            icon     : 'icon-stopwatch',
            title    : 'Administration Shortcuts',
            subtitle : 'Provides quick access to frequently used admin panels',
            url      : '/shortcuts'
        }]
    },{
        label      : 'Advanced Administration Utilities',
        adminsOnly : true,
        commands   : [{
            icon     : 'icon-problem',
            title    : 'Outstanding Work Report',
            subtitle : 'Review &amp update Outstanding Work lists of users',
            url      : '/outstanding-work'
        },{
            icon     : 'icon-group',
            title    : 'User Settings Manager',
            subtitle : 'Configure standards for new and existing users',
            url      : '/users'
        }]
    }]
]



// ---------------------------------------------------------------------------------------------------------------------------
//  SERVER ROUTING
// ---------------------------------------------------------------------------------------------------------------------------
exports.server = {
    landingPage     : '',  // Set the default URL to be opened if no app URL is provided (ie. '/portal', default is '')
    servicesEnabled : {    // Defines the applications to enable. When an application is set to false, an error 404 page will be shown when users try accessing the given page.
        
        // End User Applications
        abom           : true,  // Asset BOM Editor
        classes        : true,  // Class Browser
        client         : true,  // Mobile Client
        dashboard      : true,  // Process Dashboard
        explorer       : true,  // Product Data Explorer
        impactanalysis : true,  // Change Impact Analysis
        instances      : true,  // BOM Instances Editor
        mbom           : true,  // Manufacturing BOM Editor
        navigator      : true,  // Workspace Navigator
        portal         : true,  // PLM POrtal
        portfolio      : true,  // Product Portfoliio Catalog
        projects       : true,  // Projects Dashobard
        reports        : true,  // Reports Dashboard
        reviews        : true,  // Design Reviews
        sbom           : true,  // Service BOM Editor
        service        : true,  // Service Portal
        variants       : true,  // Variants Manager

        // Administration Utitliies
        comparison         : true,  // Tenant Comparison
        data               : true,  // Data Manager
        insights           : true,  // Tenant Insights
        'outstanding-work' : true,  // Outstanding Works Report
        shortcuts          : true,  // Administration Shortcuts
        users              : true,  // User Settings Manager

        // Addins
        context      : true,  // Item Where used
        item         : true,  // Item Master Data
        login        : true,  // PDM Login
        'pdm-search' : true,  // PDM Search
        projects     : true,  // Engineering Projects
        tasks        : true,  // My Tasks List

        // Framework Services
        docs               : true,
        landing            : true,
        troubleshooting    : true,
        start              : true,
        gallery            : true,
        template           : true,
        playground         : true,
        'chrome-extension' : true,

    }
}



// ---------------------------------------------------------------------------------------------------------------------------
//  CHOROME EXTENSION CONFIGURATION
// ---------------------------------------------------------------------------------------------------------------------------
// Configure the commands to be added to the Fusion Manage main menu and the buttons to be added to matching item's header
exports.chrome = {
    commands : [{
        id    : 'users',
        url   : '/users',
        label : 'User Settings Manager',
        icon  : 'zmdi-accounts-list',
        order : 101
    },{
        id    : 'data',
        url   : '/data',
        label : 'Data Manager',
        icon  : 'zmdi-storage',
        order : 102
    },{
        id    : 'workspace-comparison',
        url   : '/workspace-comparison',
        label : 'Workspace Comparison',
        icon  : 'zmdi-blur-linear',
        order : 103
    },{   
        id    : 'insights',
        url   : '/insights',
        label : 'Tenant Insights',
        icon  : 'zmdi-graphic-eq',
        order : 104
    },{
        id    : 'outstanding-work',
        url   : '/outstanding-work',
        label : 'Outstanding Work Report',
        icon  : 'zmdi-assignment-account',
        order : 105 
    }],  
    buttons : [{
        id         : 'cia',
        url        : '/impactanalysis?',
        label      : 'Change Impact Analysis',
        workspaces : ['problemReports', 'changeRequests', 'changeOrders']
    },{
        id         : 'pde',
        url        : '/explorer?',
        label      : 'Product Data Explorer',
        icon       : 'zmdi-chart',
        workspaces : ['items']
    },{
        id         : 'mbom',
        url        : '/mbom?',
        label      : 'Edit MBOM',
        workspaces : ['items']
    },{
        id         : 'variants-items',
        url        : '/variants?',
        label      : 'Manage Variants',
        workspaces : ['items']        
    },{
        id         : 'class-browser',
        url        : '/classes?',
        label      : 'Browse Class',
        icon       : 'zmdi-labels',
        workspaces : ['items']             
    },{
        id         : 'service-portal',
        url        : '/service?',
        label      : 'Service Portal',
        icon       : 'zmdi-wrench',
        workspaces : ['items']        
    },{
        id         : 'mbom-products',
        url        : '/mbom?options=contextfieldidebom:ENGINEERING_BOM,contextfieldidmbom:MANUFACTURING_BOM&',
        label      : 'Edit MBOM',
        workspaces : ['products']      
    },{
        id         : 'insights-asset',
        url        : '/explorer?options=fieldIdEBOM:ENGINEERING_BOM&',
        label      : 'Insights',
        icon       : 'zmdi-chart',
        workspaces : ['assets']  
    },{
        id         : 'mbom-assets',
        url        : '/mbom?options=contextfieldidebom:ENGINEERING_BOM,contextfieldidmbom:MANUFACTURINGBOM&',
        label      : 'Edit MBOM',
        workspaces : ['assets']    
    },{
        id         : 'sbom',
        url        : '/sbom?',
        label      : 'Edit Service BOM',
        workspaces : ['products', 'assets']
    },{
        id         : 'variants-products',
        url        : '/variants?options=fieldIdEBOM:ENGINEERING_BOM&',
        label      : 'Manage Variants',
        workspaces : ['products']          
    },{
        id         : 'instances',
        url        : '/instances?',
        label      : 'Edit BOM Instances',
        workspaces : ['assets']
    },{
        id         : 'abom',
        url        : '/abom?',
        label      : 'Edit Asset BOM',
        workspaces : ['assets']
    }],
    customStyle : true
}



// ---------------------------------------------------------------------------------------------------------------------------
//  THEME COLORS
// ---------------------------------------------------------------------------------------------------------------------------
// Defines primary colors to be used
exports.colors = {

    red     : '#dd2222',
    yellow  : '#faa21b',
    green   : '#6a9728',
    blue    : '#0696d7',
    list    : ['#CE6565', '#E0AF4B', '#E1E154', '#90D847', '#3BD23B', '#3BC580', '#3BBABA', '#689ED4', '#5178C8', '#9C6BCE', '#D467D4', '#CE5C95'],
    vectors : {
        red     : [221/255,  34/255, 34/255, 0.8],
        yellow  : [250/255, 162/255, 27/255, 0.8],
        green   : [106/255, 151/255, 40/255, 0.8],
        blue    : [   0.02,    0.58,   0.84, 0.8],
        gray    : [    0.8,     0.8,    0.8, 0.6],
        white   : [      1,       1,      1, 0.8],
        list    : [
            [206/255, 101/255, 101/255, 0.8],
            [224/255, 175/255,  75/255, 0.8], 
            [225/255, 225/255,  84/255, 0.8], 
            [144/255, 216/255,  71/255, 0.8], 
            [ 59/255, 210/255,  59/255, 0.8], 
            [ 59/255, 197/255, 128/255, 0.8], 
            [ 59/255, 186/255, 186/255, 0.8], 
            [104/255, 158/255, 212/255, 0.8], 
            [ 81/255, 120/255, 200/255, 0.8], 
            [156/255, 107/255, 206/255, 0.8], 
            [212/255, 103/255, 212/255, 0.8], 
            [206/255,  92/255, 149/255, 0.8]
        ]
    }

}