// Fusion Manage connection based on APS Application
let clientId        = '';
let tenant          = '';
let redirectUri     = 'http://localhost:8080/callback';
let defaultTheme    = 'light';



// -------------------------------------------------------------------------------------------
// OVERRIDE SETTINGS WITH ENVIRONMENT VARIABLES
clientId     = (typeof process.env.CLIENT_ID      === 'undefined') ? clientId     : process.env.CLIENT_ID;
tenant       = (typeof process.env.TENANT         === 'undefined') ? tenant       : process.env.TENANT;
redirectUri  = (typeof process.env.REDIRECT_URI   === 'undefined') ? redirectUri  : process.env.REDIRECT_URI;
defaultTheme = (typeof process.env.DEFAUlT_THEME  === 'undefined') ? defaultTheme : process.env.DEFAUlT_THEME;

let protocol  = redirectUri.split('://')[0];
    protocol  = (typeof process.env.PROTOCOL === 'undefined') ? protocol : process.env.PROTOCOL;

let port = process.env.PORT;

if(typeof port === 'undefined') {
    let redirectSplit = redirectUri.split(':');
    if(redirectSplit.length > 2) {
        port = redirectSplit[2].split('/')[0];
    }
}

exports.clientId        = clientId;
exports.tenant          = tenant; 
exports.redirectUri     = redirectUri;
exports.defaultTheme    = defaultTheme;
exports.protocol        = protocol;
exports.port            = port;
exports.debugMode       = true;



// -------------------------------------------------------------------------------------------
// THEME
// Primary styling in css files also can be adjusted
let colors = {
    red     : '#dd2222',
    yellow  : '#faa21b',
    green   : '#6a9728',
    blue    : '#0696d7',
    list    : ['#CE6565', '#E0AF4B', '#E1E154', '#90D847', '#3BD23B', '#3BC580', '#3BBABA', '#689ED4', '#5178C8', '#9C6BCE', '#D467D4', '#CE5C95']
}
let vectors = {
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


// -------------------------------------------------------------------------------------------
// CONFIGURATION SETTINGS for all applications
// The key names match the given endpoint names
// Make sure to restart your server after any change to this file
exports.config = {

    'colors'  : colors,
    'vectors' : vectors,

    'configurator' : {
        'wsIdEningeeringItems'      : '57',
        'wsIdConfigurationFeatures' : '274',
        'bomViewName'               : 'Configurator',
        'fieldIdFeatures'           : 'FEATURES',
        'fieldIdOptions'            : 'OPTIONS',
        'fieldIdInclusions'         : 'INCLUSIONS',
        'fieldIdExclusions'         : 'EXCLUSIONS',
        'fieldIdBOM'                : 'MANUFACTURING_BOM',
        'fieldIdBOMType'            : 'CONFIGURATION_TYPE',
        'stateFeatureApproved'      : 'Approved',
        'labelSingleOptions'        : 'Single Options',
        'valueAlternatives'         : 'Alternatives',
        'valueOptional'             : 'Optional'
    },

    'dashboard' : [{
        'title'             : 'Problem Reporting Dashboard',
        'wsId'              : 82,
        'icon'              : 'icon-problem', // See predefined icons in /public/stylesheets/framework/fonts.css
        'fieldIdSubtitle'   : 'DESCRIPTION',
        'fieldIdItem'       : 'AFFECTED_ITEM',
        'imageFieldsPrefix' : 'IMAGE_',
        'workflowHistory'   : {
            'showNextActions'       : true,
            'excludedTransitions'   : ['Close Report'],
            'finalStates'           : ['Completed']
        },
        'progress' : [
            { 'label' : 'New',         'color' : colors.red,    'states' : ['Create'] },
            { 'label' : 'Analysis',    'color' : colors.yellow, 'states' : ['Review', 'Technical Analysis'] },
            { 'label' : 'Improvement', 'color' : colors.yellow, 'states' : ['CAPA in progress', 'Change Request in progress'] },
            { 'label' : 'Completed',   'color' : colors.green,  'states' : ['Completed'] }
        ]
    },{
        'title'             : 'Non Conformances Tracking Dashboard',
        'wsId'              : 98,
        'icon'              : 'icon-rules',
        'fieldIdSubtitle'   : 'DESCRIPTION',
        'fieldIdItem'       : 'NONCONFORMING_ITEM',
        'imageFieldsPrefix' : 'IMAGE_',
        'workflowHistory'   : {
            'showNextActions'       : true,
            'excludedTransitions'   : ['Cancel'],
            'finalStates'           : ['Closed']
        },
        'progress' : [
            { 'label' : 'New',         'color' : colors.red,    'states' : ['Identification In Progress'] },
            { 'label' : 'Analysis',    'color' : colors.yellow, 'states' : ['Under Review'] },
            { 'label' : 'Improvement', 'color' : colors.yellow, 'states' : ['Disposition In Progress', 'CAPA In Progress'] },
            { 'label' : 'Closed',      'color' : colors.green,  'states' : ['Closed'] }
        ]
    },{
        'title' : 'Change Requests Management',
        'wsId'  : 83,
        'icon'  : 'icon-workflow',
        'progress' : [
            { 'label' : 'Planning',    'color' : '#000000',     'states' : ['Create']  },
            { 'label' : 'Review',      'color' : colors.red,    'states' : ['Review & Impact Analysis', 'Peform Tasks', 'Change Control Board Review']  },
            { 'label' : 'In Work',     'color' : colors.yellow, 'states' : ['Change Order in progress']   },
            { 'label' : 'Completed',   'color' : colors.green,  'states' : ['Completed'] }
        ]
    },{
        'title' : 'Project Activities Management',
        'wsId'  : 90,
        'icon'  : 'icon-layers',
        'progress' : [
            { 'label' : 'Planning',    'color' : colors.red,    'states' : ['Planning']  },
            { 'label' : 'Assigned',    'color' : colors.red,    'states' : ['Assigned']  },
            { 'label' : 'In Work',     'color' : colors.yellow, 'states' : ['In Work']   },
            { 'label' : 'Review',      'color' : colors.green,  'states' : ['Review']    },
            { 'label' : 'Completed',   'color' : colors.green,  'states' : ['Completed'] }
        ]
    },{
        'title' : 'Supplier Collaboration Platform',
        'wsId'  : 146,
        'icon'  : 'icon-workflow',
        'workflowHistory'   : {
            'showNextActions'       : true,
            'finalStates'           : ['Completed']
        },
        'progress' : [
            { 'label' : 'Planning',      'color' : colors.red,     'states' : ['Requested']  },
            { 'label' : 'In Progress',   'color' : colors.yellow,  'states' : ['In Work', 'Clarification']   },
            { 'label' : 'Completed',     'color' : colors.green,   'states' : ['Completed'] }
        ]
    }],

    'explorer' : {
        'bomViewName'          : 'Details',
        'fieldIdPRImage'       : 'IMAGE_1',
        'fieldIdPRContext'     : 'AFFECTED_ITEM',
        'wsIdItems'            : 57,
        'wsIdProblemReports'   : 82,
        'wsIdSupplierPackages' : 147,
        'kpis' : [{
            'id'        : 'lifecycle',
            'title'     : 'Item Lifecycle',
            'fieldId'   : 'LIFECYCLE',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Working',    'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red   },
                { 'value' : 'Production', 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        },{
            'id'        : 'change',
            'title'     : 'Pending Change',
            'fieldId'   : 'WORKING_CHANGE_ORDER',
            'urn'       : '',
            'type'      : 'non-empty',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Yes', 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : 'No' , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        },{
            'id'        : 'change-order',
            'title'     : 'Change Orders',
            'fieldId'   : 'WORKING_CHANGE_ORDER',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'revision',
            'title'     : 'Revision',
            'fieldId'   : 'REVISION',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []       
        },{
            'id'        : 'status',
            'title'     : 'Status',
            'fieldId'   : 'STATUS',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Superseded', 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red    },
                { 'value' : 'Working'   , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'Latest'    , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green  }
            ]     
        },{
            'id'        : 'release-date',
            'title'     : 'Release Date',
            'fieldId'   : 'RELEASE_DATE',
            'urn'       : '',
            'type'      : 'days',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'type',
            'title'     : 'Type',
            'fieldId'   : 'TYPE',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'top-level-class-name',
            'title'     : 'Top Level Class',
            'fieldId'   : 'TOP_LEVEL_CLASS',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'class-name',
            'title'     : 'Class',
            'fieldId'   : 'CLASS_NAME',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'pdm-category',
            'title'     : 'PDM Category',
            'fieldId'   : 'PDM_CATEGORY',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'pdm-location',
            'title'     : 'PDM Location',
            'fieldId'   : 'PDM_LOCATION',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'pdm-last-modification-date',
            'title'     : 'PDM Last Modification',
            'fieldId'   : 'PDM_LAST_MODIFICATION_DATE',
            'urn'       : '',
            'type'      : 'days',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'responsible-designer',
            'title'     : 'Responsible Designer',
            'fieldId'   : 'RESPONSIBLE_DESIGNER',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []          
        },{
            'id'        : 'spare-part',
            'title'     : 'Spare Part',
            'fieldId'   : 'SPARE_WEAR_PART',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : '-'        , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : 'Wear Part' , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'Spare Part', 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]      
        },{
            'id'        : 'has-pending-packages',
            'title'     : 'Has Pending Packages',
            'fieldId'   : 'HAS_PENDING_PACKAGES',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Yes' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : '-'   , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'No'  , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        },{
            'id'        : 'make-or-buy',
            'title'     : 'Make or Buy',
            'fieldId'   : 'MAKE_OR_BUY',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Buy' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : '-'   , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'Make', 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]  
        },{
            'id'        : 'vendor',
            'title'     : 'Vendor',
            'fieldId'   : 'VENDOR',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []    
        },{
            'id'        : 'country',
            'title'     : 'Country',
            'fieldId'   : 'COUNTRY',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []                   
        },{
            'id'        : 'total-cost',
            'title'     : 'Total Cost',
            'fieldId'   : 'TOTAL_COST',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []    
        },{
            'id'        : 'lead-time',
            'title'     : 'Lead Time',
            'fieldId'   : 'LEAD_TIME',
            'urn'       : '',
            'type'      : 'value',
            'sort'      : 'value',
            'style'     : 'bars',
            'data'      : []
                         
        },{
            'id'        : 'long-lead-time',
            'title'     : 'Long Lead Time',
            'fieldId'   : 'LONG_LEAD_TIME',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Yes' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : '-'   , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'No'  , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]     
        },{
            'id'        : 'material',
            'title'     : 'Material',
            'fieldId'   : 'MATERIAL',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []
        },{
            'id'        : 'total-weight',
            'title'     : 'Total Weight',
            'fieldId'   : 'TOTAL_WEIGHT',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : []  
        },{
            'id'        : 'quality-inspection-required',
            'title'     : 'Quality Inspection Required',
            'fieldId'   : 'INSPECTION_REQUIRED',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'counters',
            'data'      : [
                { 'value' : 'Yes' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : '-'   , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'No'  , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        },{
            'id'        : 'quality-inspection-result',
            'title'     : 'Latest Quality Inspection Result',
            'fieldId'   : 'LATEST_QI_RESULT',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : [
                { 'value' : '-'          , 'count' : 0, 'color' : colors.list[3], 'vector' : vectors.list[0] },
                { 'value' : 'FAIL'       , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : 'In Progress', 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'PASS'       , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        },{
            'id'        : 'reach',
            'title'     : 'REACH',
            'fieldId'   : 'REACH',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : [
                { 'value' : 'Not Compliant' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : 'Unknown'       , 'count' : 0, 'color' : colors.list[1], 'vector' : vectors.yellow },
                { 'value' : 'Not Validated' , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'Not Required'  , 'count' : 0, 'color' : colors.list[3], 'vector' : vectors.list[0] },
                { 'value' : 'Compliant'     , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        },{
            'id'        : 'rohs',
            'title'     : 'RoHS',
            'fieldId'   : 'ROHS',
            'urn'       : '',
            'type'      : 'value',
            'style'     : 'bars',
            'data'      : [
                { 'value' : 'Not Compliant' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                { 'value' : 'Unknown'       , 'count' : 0, 'color' : colors.list[1], 'vector' : vectors.yellow },
                { 'value' : 'Not Validated' , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                { 'value' : 'Not Required'  , 'count' : 0, 'color' : colors.list[3], 'vector' : vectors.list[0] },
                { 'value' : 'Compliant'     , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
            ]
        }],
        'viewerFeatures': {
            'cube'          : false,
            'orbit'         : false,
            'firstPerson'   : false,
            'camera'        : false,
            'measure'       : true,
            'section'       : true,
            'explodedView'  : true,
            'modelBrowser'  : false,
            'properties'    : false,
            'settings'      : false,
            'fullscreen'    : true,
            'markup'        : true,
            'hide'          : true,
            'ghosting'      : true,
            'highlight'     : true,
            'single'        : true,
            'fitToView'     : true,
            'reset'         : true,
            'views'         : true,
            'selectFile'    : true
        }
    },

    'impactanalysis' : {
        'fieldIdProposedChange'             : 'PROPOSED_CHANGE',
        'fieldIdStockQuantity'              : 'STOCK_QUANTITY',
        'fieldIdNextProductionOrderQantity' : 'NEXT_PO_QUANTITY',
        'fieldIdPendingSupplies'            : 'PENDING_SUPPLIES',
        'fieldIdProductionOrdersData'       : 'PO_DATA'
    },
    
    'insights' : {
        'maxLogEntries' : 500000,
        'usersExcluded' : ['Administrator', 'Import User', 'Job User', 'Integration User']
    },

    'mbom' : {
        'wsIdEBOM'                      : '57',
        'wsIdMBOM'                      : '57',
        'bomViewNameEBOM'               : 'MBOM Transition',
        'bomViewNameMBOM'               : 'MBOM Transition',
        'fieldIdEBOM'                   : 'EBOM',
        'fieldIdMBOM'                   : 'MBOM',
        'fieldIdNumber'                 : 'NUMBER',
        'fieldIdTitle'                  : 'TITLE',
        'fieldIdCategory'               : 'PDM_CATEGORY',
        'fieldIdProcessCode'            : 'PROCESS_CODE',
        'fieldIdEndItem'                : 'END_ITEM',
        'fieldIdMatchesMBOM'            : 'MATCHES_MBOM',
        'fieldIdIgnoreInMBOM'           : 'IGNORE_IN_MBOM',
        'fieldIdIsProcess'              : 'IS_PROCESS',
        'fieldIdLastSync'               : 'LAST_MBOM_SYNC',
        'fieldIdLastUser'               : 'LAST_MBOM_USER',
        'fieldIdEBOMItem'               : 'IS_EBOM_ITEM',
        'fieldIdEBOMRootItem'           : 'EBOM_ROOT_ITEM',
        'fieldsToCopy'                  : ['TITLE', 'DESCRIPTION'],
        'fieldIdInstructions'           : 'INSTRUCTIONS',
        'fieldIdMarkupSVG'              : 'MARKUP_SVG',
        'fieldIdMarkupState'            : 'MARKUP_STATE',
        'revisionBias'                  : 'working', // change to release if needed
        'pinMBOMItems'                  : false,
        'suffixItemNumber'              : '-M',
        'incrementOperatonsItemNumber'  : true,
        'newDefaults'                   : [ 
            // ['TYPE', { 'link' : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES/options/34' }] 
        ],
        'searches' : [
            { 'title' : 'Purchased Parts', 'query' : 'ITEM_DETAILS:CATEGORY%3DPurchased' },
            { 'title' : 'Packaging Parts', 'query' : 'ITEM_DETAILS:CATEGORY%3DPackaging' }
        ],
        'viewerFeatures' : {
            'cube'          : false,
            'orbit'         : false,
            'firstPerson'   : false,
            'camera'        : false,
            'measure'       : true,
            'section'       : true,
            'explodedView'  : true,
            'modelBrowser'  : false,
            'properties'    : false,
            'settings'      : false,
            'fullscreen'    : true,
            'markup'        : true,
            'hide'          : true,
            'ghosting'      : true,
            'highlight'     : false,
            'single'        : true,
            'fitToView'     : true,
            'reset'         : true,
            'views'         : true,
            'selectFile'    : true
        }
    },

    'portfolio' : {
        'bomViewName'       : 'Basic',
        'hierarchy'         : ['Product Categories', 'Product Lines', 'Products']
    },

    'projects' : {
        'wsIdProjects' : 86,
        'query'        : '*'
    },

    'reports': {
        'startupReportNames' : ['Audits by Workflow State', 'CR approval status', 'DR: Rework Required', 'EX: Change Requests'],
        'startupReportCount' : 5
    },

    'reviews' : {
        'fieldIdItem'   : 'ITEM',
        'fieldIdImage'  : 'IMAGE',
        'fieldIdMarkup' : 'MARKUP',
        'transitionId'  : 'CLOSE_REVIEW',
        'bomViewName'   : 'Basic',
        'viewerFeatures': {
            'cube'          : false,
            'orbit'         : false,
            'firstPerson'   : false,
            'camera'        : false,
            'measure'       : true,
            'section'       : true,
            'explodedView'  : true,
            'modelBrowser'  : false,
            'properties'    : false,
            'settings'      : false,
            'fullscreen'    : true,
            'markup'        : true,
            'hide'          : true,
            'ghosting'      : true,
            'highlight'     : true,
            'single'        : true,
            'fitToView'     : true,
            'reset'         : true,
            'views'         : true,
            'selectFile'    : true
        },
        'workspaces'    : {
            'reviews' : {
                'id'        : 76,
                'sections'  : [ { 'name' : 'Review Findings' } ],
                'states'    : [ 'Planning', 'Preparation', 'In Progress' ]
            },
            'tasks' : {
                'id' : '',
                'sections' : [ { 'name' : 'Definition' }, { 'name' : 'Schedule' } ],
                'states'    : [ 'Assigned', 'On Hold', 'In Work', 'Review', 'Complete' ]
            }
        }
    },

    'search' : {
        'wsId'    : 57,
        'fieldId' : 'NUMBER'
    },

    'service' : {
        'bomViewName'            : 'Service',
        'enableCustomRequests'   : true,
        'endItemFilter'          : { 'fieldId' : 'SBOM_END_ITEM', 'value' : true },
        'fieldId'                : 'SPARE_WEAR_PART',
        'fieldValues'            : ['spare part', 'yes', 'x', 'y', 'wear part'],
        'fieldIdSparePartImage'  : 'IMAGE',
        'spartPartDetails'       : ['MATERIAL', 'ITEM_WEIGHT', 'DIMENSIONS'],
        'fieldIdPRImage'         : 'IMAGE_1',
        'productsFilter'         : '',
        'productsSortBy'         : 'TITLE',
        'productsGroupBy'        : 'PRODUCT_LINE',
        'productsFieldIdImage'   : 'IMAGE',
        'productsFieldIdTitle'   : 'TITLE',
        'productsFieldIdSubtitle': 'DESCRIPTION',
        'productsFieldIdBOM'     : 'ENGINEERING_BOM',
        'productsListHeader'     : 'Serviceable Products',
        'wsIdProducts'           : 95,
        'wsIdProblemReports'     : 82,
        'wsIdSparePartsRequests' : 208,
        'requestSectionsExcluded': ['Workflow Activity'],
        'requestColumnsExcluded' : ['UNIT_COST', 'TOTAL_COST', 'MAKE_OR_BUY', 'MANUFACTURER', 'MANUFACTURER_PN', 'LEAD_TIME', 'LONG_LEAD_TIME'],
        'applicationFeatures' : {
            'homeButton'            : true,
            'toggleItemAttachments' : true,
            'toggleItemDetails'     : true,
            'productDocumentation'  : true,
            'manageProblemReports'  : true,
            'showStock'             : true,
            'requestWorkflowActions': true
        },
        'viewerFeatures' : {
            'cube'          : false,
            'orbit'         : false,
            'firstPerson'   : false,
            'camera'        : false,
            'measure'       : true,
            'section'       : true,
            'explodedView'  : true,
            'modelBrowser'  : false,
            'properties'    : false,
            'settings'      : false,
            'fullscreen'    : true,
            'markup'        : true,
            'hide'          : true,
            'ghosting'      : true,
            'highlight'     : true,
            'single'        : true,
            'fitToView'     : true,
            'reset'         : true,
            'views'         : true,
            'selectFile'    : true
        }
    },

    variants : {
        wsIdItemVariants       : 208,
        variantsSectionLabel   : 'Variant Definition',
        fieldIdVariantBaseItem : 'DMS_ID_BASE_ITEM',
        fieldIdItemNumber      : 'NUMBER',
        fieldIdItemVariants    : 'VARIANTS',
        bomViewNameItems       : 'Variant Management',
        bomViewNameVariants    : 'Default View',
        viewerFeatures : {
            'cube'          : false,
            'orbit'         : false,
            'firstPerson'   : false,
            'camera'        : false,
            'measure'       : true,
            'section'       : true,
            'explodedView'  : true,
            'modelBrowser'  : false,
            'properties'    : false,
            'settings'      : false,
            'fullscreen'    : true,
            'markup'        : false,
            'hide'          : true,
            'ghosting'      : true,
            'highlight'     : true,
            'single'        : true,
            'fitToView'     : true,
            'reset'         : true,
            'views'         : true,
            'selectFile'    : true
        }
    },

    'viewer' : {
        'fieldIdPartNumber'       : 'NUMBER',
        'partNumberProperties'    : ['Part Number', 'Name', 'label', 'Artikelnummer', 'Bauteilnummer'],
        'splitPartNumberBy'       : ' v',
        'splitPartNumberIndexes'  : [0],
        'splitPartNumberSpacer'   : '',
        'backgroundColor'         : [255, 255, 255, 255, 255, 255],
        'antiAliasing'            : true,
        'ambientShadows'          : true,
        'groundReflection'        : false,
        'groundShadow'            : true,
        'lightPreset'             : 4
    }

}
