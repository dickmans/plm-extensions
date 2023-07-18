// Fusion 360 Manage connection based on APS Application

// exports.tenant          = 'trainzeugfang';
// exports.clientId        = 'GkjW4r3369kPVzJ55GGpIWFRqUze3ER8';
// exports.clientSecret    = 'Pun8Kffq0VAYxcG2';
// exports.redirectUri     = 'http://localhost:8080/callback';
// exports.port            = 8080;


exports.clientId        = 'Uk8qYnIVMcnqJzqZWqCrCDRHw0nTcKOn';
exports.clientSecret    = 'qaADWGkxw0ESoX4Z';
exports.redirectUri     = 'http://localhost:8080/callback';
exports.port            = 8080;
exports.tenant          = 'adsktsesvend'; 
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
    // red     : [221/255, 101/255, 101/255, 0.8],
    // yellow  : [225/255, 225/255,  84/255, 0.8],
    // green   : [ 59/255, 210/255,  59/255, 0.8],
    red     : [221/255,  34/255, 34/255, 0.8],
    yellow  : [250/255, 162/255, 27/255, 0.8],
    green   : [106/255, 151/255, 40/255, 0.8],
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
// Make sure to restart your after any change to this file
exports.config = {

    'colors'  : colors,
    'vectors' : vectors,

    'configurator' : {
        'wsIdEningeeringItems'      : '79',
        'wsIdConfigurationFeatures' : '571',
        'bomViewName'               : 'Explorer',
        'fieldIdFeatures'           : 'FEATURES',
        'fieldIdOptions'            : 'OPTIONS',
        'fieldIdInclusions'         : 'INCLUSIONS',
        'fieldIdExclusions'         : 'EXCLUSIONS',
        'fieldIdBOM'                : 'MANUFACTURING_BOM',
        'fieldIdBOMType'            : 'CONFIGURATION_TYPE',
        'stateFeatureApproved'      : 'Approved',
        'labelSingleOptions'        : 'Single Options'
    },

    'explorer' : {
        'bomViewName'               : 'Explorer',
        'fieldIdProblemReportImage' : 'IMAGE_1',
        'wsIdProblemReports'        : 82,
        'wsIdSupplierPackages'      : 638,
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
                'id'        : 'category',
                'title'     : 'Vault Category',
                'fieldId'   : 'CATEGORY',
                'urn'       : '',
                'type'      : 'value',
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
                'id'        : 'lead-time',
                'title'     : 'Lead Time',
                'fieldId'   : 'LEAD_TIME',
                'urn'       : '',
                'type'      : 'value',
                'sort'      : 'value',
                'style'     : 'bars',
                'data'      : []
            },{
                'id'        : 'make-or-buy-vault',
                'title'     : 'Make or Buy',
                'fieldId'   : 'MAKE_BUY',
                'urn'       : '',
                'type'      : 'value',
                'style'     : 'counters',
                'data'      : [
                    { 'value' : 'Buy' , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                    { 'value' : '-'   , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                    { 'value' : 'Make', 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
                ]
            },{
                'id'        : 'pending-supplier-package',
                'title'     : 'Pending Supplier Package',
                'fieldId'   : 'PENDING_REQUEST',
                'urn'       : '',
                'type'      : 'value',
                'style'     : 'counters',
                'data'      : [
                    { 'value' : 'Yes', 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                    { 'value' : 'No' , 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
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
                'id'        : 'potential-cost-savings',
                'title'     : 'Potential Cost Savings',
                'fieldId'   : 'POTENTIAL_COST_SAVINGS',
                'urn'       : '',
                'type'      : 'value',
                'sort'      : 'value',
                'style'     : 'bars',
                'data'      : []
            },{
                'id'        : 'potential-time-savings',
                'title'     : 'Potential Time Savings',
                'fieldId'   : 'POTENTIAL_TIME_SAVINGS',
                'urn'       : '',
                'type'      : 'value',
                'sort'      : 'value',
                'style'     : 'bars',
                'data'      : []
            },{
                'id'        : 'spare-part',
                'title'     : 'Spare Part',
                'fieldId'   : 'SPAREWEAR_PART',
                'urn'       : '',
                'type'      : 'value',
                'style'     : 'counters',
                'data'      : [
                    { 'value' : '-'         , 'count' : 0, 'color' : colors.list[0], 'vector' : vectors.red },
                    { 'value' : 'Wear Part' , 'count' : 0, 'color' : colors.list[2], 'vector' : vectors.yellow },
                    { 'value' : 'Spare Part', 'count' : 0, 'color' : colors.list[4], 'vector' : vectors.green }
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
                'id'        : 'folder',
                'title'     : 'Vault Folder',
                'fieldId'   : 'FOLDER',
                'urn'       : '',
                'type'      : 'value',
                'style'     : 'bars',
                'data'      : []
            },{
                'id'        : 'last-update',
                'title'     : 'Last Updated By',
                'fieldId'   : 'LAST_UPDATED_BY',
                'urn'       : '',
                'type'      : 'value',
                'style'     : 'bars',
                'data'      : []
            },{
                'id'        : 'last-update',
                'title'     : 'Last Modification',
                'fieldId'   : 'LAST_UPDATED',
                'urn'       : '',
                'type'      : 'days',
                'sort'      : 'value',
                'style'     : 'bars',
                'data'      : []
            }
        ]    
    },
    
    'insights' : {
        'maxLogEntries' : 500000,
        'usersExcluded' : ['Administrator', 'Import User', 'Job User', 'Integration User']
    },

    'mbom' : {
        'wsIdEBOM'                      : '79',
        'wsIdMBOM'                      : '79',
        'bomViewNameEBOM'               : 'MBOM',
        'bomViewNameMBOM'               : 'MBOM',
        'fieldIdEBOM'                   : 'EBOM',
        'fieldIdMBOM'                   : 'MBOM',
        'fieldIdNumber'                 : 'NUMBER',
        'fieldIdTitle'                  : 'TITLE',
        'fieldIdCategory'               : 'ARTIKELKATEGORIE',
        'fieldIdOperationCode'          : 'OPERATION_CODE',
        'fieldIdEndItem'                : 'END_ITEM',
        'fieldIdIgnoreInMBOM'           : 'IGNORE_IN_MBOM',
        'fieldIdIsOperation'            : 'IS_OPERATION',
        'fieldIdLastSync'               : 'LAST_MBOM_SYNC',
        'fieldsToCopy'                  : ['TITLE', 'DESCRIPTION'],
        'fieldIdInstructions'           : 'INSTRUCTIONS',
        'fieldIdMarkupSVG'              : 'MARKUP_SVG',
        'fieldIdMarkupState'            : 'MARKUP_STATE',
        'suffixItemNumber'              : '-MBOM',
        'incrementOperatonsItemNumber'  : true,
        'newDefaults'                   : [ 
            ['DESCRIPTION' , 'Generated by MBOM Editor']
        ],
        // 'newDefaults'                   : [ 
        //     ['DESCRIPTION' , 'Generated by MBOM Editor'],
        //     ['TYPE' , { 'link' : '/api/v3/lookups/CUSTOM_LOOKUP_ITEM_TYPES/options/34' }] 
        // ],
        'searches' : [
        { 'title' : 'Normteil', 'query' : 'ITEM_DETAILS:ARTIKELKATEGORIE%3DNormteil' },
        //     { 'title' : 'Packaging Parts', 'query' : 'ITEM_DETAILS:CATEGORY%3DPackaging' }
        ]
    },

    'portfolio' : {
        'bomViewName'       : 'Explorer',
        'fieldIdPartNumber' : 'NUMBER',
        'hierarchy'         : ['Product Categories', 'Product Lines', 'Products']
    },

    'projects' : {
        'wsIdProjects' : 86
    },

    'reviews' : {
        'transitionId' : 'CLOSE_REVIEW',
        'workspaces' : {
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

    'service' : {
        'bomViewName'            : 'Service',
        'wsIdProblemReports'     : 82,
        'wsIdSparePartsRequests' : 241
    },

    'variants' : {
        'wsIdVariants'           : '604',
        'bomViewNameItems'       : 'Export',
        'bomViewNameVariants'    : 'Default View',
        'variantsSectionLabel'   : 'Variant Definition',
        'fieldIdProductBOM'      : 'ENGINEERING_BOM',
        'fieldIdProductVariants' : 'VARIANTS',
        'fieldIdVariantBaseItem' : 'DMS_ID_BASE_ITEM'
    },

    'viewer' : {
        'backgroundColor'         : 255,
        'groundReflection'        : false,
        'groundShadow'            : true,
        // 'fieldIdPartNumber'       : 'NUMBER',
        'fieldIdPartNumber'       : 'FHR_ARTIKELNUMMER',
        'partNumberProperties'    : ['FHR_Artikelnummer']
        // 'partNumberProperties'    : ['Part Number', 'Name', 'label', 'Artikelnummer', 'Bauteilnummer']
    }

}
