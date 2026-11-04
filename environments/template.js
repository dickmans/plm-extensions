// ---------------------------------------------------------------------------------------------------------------------------
//  REQUIRED CONNECTION SETTINGS
// ---------------------------------------------------------------------------------------------------------------------------
//  Provide the requried parameters below to enable connections to your tenant.
//  You can provide these settings also by using the matching environment variables insted (i.e. CLIENT_ID).
//  When using such environment variables, the matching setting below will be overridden.
//  The value of variable redirectUri must match your APS app's callback URL EXACTLY. 
//  If you encounter the error "400 - Invalid redirect_uri" when starting apps, please review this link for typos and any other differences.
//  The 'defaultTheme' setting can be overwritten with each request if needed: add the parameter 'theme' to your request (&theme=dark or &theme=light)
//  'enableCache' can be used to enable server-side caching of defined data which does not change frequently (ie workspace settings)
// ---------------------------------------------------------------------------------------------------------------------------
//  - tenant          : Name of your Fusion Manage tenant without the autodeskplm360.net domain
//  - clientId        : Client ID generated for your APS application of type 'Desktop, Mobile Single-Page App' using PKCE
//  - redirectUri     : Callback URL of your APS application (do not forget to append /callback). Your app may have multiple callback URLs
//  - settings        : Refers to file in folder /setings overriding standard configuration settings
//  - defaultTheme    : Select from dark, light or fusion
//  - enableCache     : Enables cache globally, memorizing dedicated API call responses on server side for better performance
//  - debugMode       : Enables console printout of panel settings for debugging purposes
//  - fusionConnected : When UX Extensions will be used with Components provided by the Fusion connector, set this to true
// ---------------------------------------------------------------------------------------------------------------------------
//  Use exports.settings to reference a file with custom settings. This file must be stored in /settings and should
//  contain your custom settings only. The standard file settings.js will always be used by the server, but will
//  me merged with your custom settings before. This enables administrators to copy individual settings to be changed
//  from settings.js to custom.js. When updates to settings.js will be provided, the custom settings will still remain
// ---------------------------------------------------------------------------------------------------------------------------
exports.tenant          = '';
exports.clientId        = '';
exports.redirectUri     = 'http://localhost:8080/callback';
exports.settings        = 'custom.js';
exports.defaultTheme    = 'dark';
exports.enableCache     = true; 
exports.debugMode       = false;
exports.fusionConnected = false;


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL ADDITIONAL CLIENT ID FOR 2-LEGGED AUTHENTICATION
// ---------------------------------------------------------------------------------------------------------------------------
//  The applications OUTSTANDING WORK REPORT and USER SETTINGS MANAGER require an APS application with Client ID and
//  Client Secret for 2-legged authentications. Please proivde the given settings in the next variables. This APS application 
//  must be different from the one provided in clientId above as this one must require a Client Secret, to be provided as 
//  adminClientSecret. Only 2-legged applications enable impersonation - which is required for the two advanced admin 
//  applications (OUTSTANDING WORK REPORT and USER SETTINGS MANAGER). However, as this impacts security, its is recommended
//  to provide the following settings only if these advanced admin utilities will be used, maybe even only temporarily or in
//  a local copy of this server. All other applications will work even if the following 2 settings are not provided as they 
//  use the clientId variable instead. 
//  The Admin Client ID and Client Secret are also required if the runAs parameter should be used for an application,
//  allowing to run the given application in context of a defined user while preventing the need of a login.
//  You can also provide these settings using the matching environment variables ADMIN_CLIENT_ID and ADMIN_CLIENT_SECRET.
// ---------------------------------------------------------------------------------------------------------------------------
exports.adminClientId     = '';
exports.adminClientSecret = '';


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL VAULT SETTINGS
// ---------------------------------------------------------------------------------------------------------------------------
//  These optional settings are only required for connections to Vault (i.e. when using the PDM Search addins or when using
//  the Vault viewing files. The standard applications of this UX server do not require a Vault connection, the settings 
//  usually should not be changed.
//   - vaultGateway : Provide the full URL to your Vault Gateway (ie. https://9017b32d.vg.autodesk.com)
//                    If the name is provided only, 'https://' will be prepended and 'vg.autodesk.com' will be appended 
//                    If the UX server is hosted in your intranet, you can also use a http link the adms server's hostname. 
//                    For example http://localhost or http://vault-server.
//   - vaultName    : Provide the name of your Vault as defined in ADMS Console (ie PDMC-Sample)
//   - vaulViewer   : Set this to true in order to use Vault's viewables instead of the files in PLM (defaults to false)
// ---------------------------------------------------------------------------------------------------------------------------
exports.vaultGateway = '';
exports.vaultName    = '';   
exports.vaulViewer   = false;


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL SYSTEM MONITORING SETTINGS
// ---------------------------------------------------------------------------------------------------------------------------
//  Set monitoringSecret to a secret of your choice to unlock the System Monitoring page at /monitoring.
//  Even with this secret, that page also requires a valid PLM login and membership in the 'Administration [SYSTEM]' group.
//  Leave this blank to keep the System Monitoring page locked entirely.
// ---------------------------------------------------------------------------------------------------------------------------
exports.monitoringSecret = '';


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL SETTINGS FOR SECURE SERVICE ACCOUNT (SSA)
// ---------------------------------------------------------------------------------------------------------------------------
// The following settings only are required if a SSA (Secure Service Account) should be used by defined apps. When enabled, users do not have to login to 
// Fusion Manage before using the applications. Instead, the defined SSA account will be used, driving access permission within the
// application. Once the SSA Account ID and keys are defined IN ADDITION to Admin Client ID/Secret, ssa mode can be enabled for each application
// by adding the following setting to the application's settings: useSSA = true;
// Find instructions for the SSA account creationg here in the following Postman collection: 
// https://www.postman.com/svendickmans/workspace/fusion-manage/collection/30479226-c2729ba1-f26f-4e9a-b7e8-cf2550f791d6?action=share&creator=30479226&active-environment=30479226-065c591c-9cb1-491f-9de3-48de9aa646bb
// ---------------------------------------------------------------------------------------------------------------------------
exports.ssaAccountId  = '';       // Reference : 'R201IMWZR4B7VJT3' (copy ssa_id from Postman Collection Setup Step #2)
exports.ssaKeyId      = '';       // Reference : '1e2era89-8c5b-123a-85e3-ca537e4b5e7e' (copy keyId/kid from Postman Collection Setup Step #3)
exports.ssaPrivateKey = '';       // Reference : '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQ..aQhlG3WBdN4=\n-----END RSA PRIVATE KEY-----\n' (copy privateKey from Postman Collection Setup Step #3)


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL BOM CACHE SETTINGS
// ---------------------------------------------------------------------------------------------------------------------------
//  The BOM cache stores the multi level BOMs of your top level items (i.e. end products) in a local SQLite database file and
//  refreshes it once a day, so applications such as the Impact Analysis can answer where-used questions without reading
//  hundreds of BOMs from Fusion Manage. It requires Node 22.13 or later and the Admin Client ID/Secret, plus either the SSA settings above or a runAs user.
//  The agent authenticates with the SSA account (or the runAs user), so this account must be able to see the top level items and their BOMs.
//   - enabled        : Set to true to activate the cache and its daily refresh
//   - refreshTimes   : Times of the day (server time, HH:MM) the cache is refreshed, i.e. ['02:00', '13:00']
//   - refreshOnStart : Refreshes the cache after server start if it is empty or older than 24 hours
//   - fileName       : Name of the cache file in folder /bom-cache, leave blank to use bom-cache-<tenant>.db
//   - runAs          : Optional user ID to use when populating the cache (i.e. 'jane.doe@company.com'). The cache then contains the data
//                      this user can access. A valid Admin Client ID/Secret is required.
//                      Leave the runAs setting blank to use the defined SSA account instead.
//   - workspaceId    : ID of the workspace containing the top level items (i.e. 57 for Items and BOMs)
//   - filter         : Selects the top level items, same syntax as filters of the search in other applications. Without any
//                      filter, all items of the workspace are cached, which is not recommended for large workspaces
//   - filterLogic    : 'AND' or 'OR', defines how multiple filters are combined
//   - fieldIdItem    : Optional ID of a linking picklist field of the top level workspace referencing another item (i.e. 'ENGINEERING_BOM'). 
//                      If provided, the BOM is not read from the items found by the filter, but from the item referenced in this field (first value only). 
//                      Items without a value in this field are skipped. The found item's field values are stored as 'details', the referenced item's field
//                      values as 'bomItem.details'. Leave blank to read the BOMs of the found items. Changing this setting requires a rebuild,
//                      the cache does so with its next refresh
//   - latestOnly     : Only the latest released revision of each top level item it taken into account, 
//                      releasedOnly / workingOnly : only released / working versions are taken into account
//                      If all these three options are false, all revisions of the top level items are cached
//   - bomViewName    : Name of the BOM view used for the expansion, its columns become the details of the cached BOM nodes. Blank for the default view
//   - bomFields      : IDs of BOM view fields whose values are stored with each BOM line, i.e. ['UNIT_OF_MEASURE', 'SOURCE']. The cache always stores descriptor, dmsId,
//                      workspace ID, part number, BOM line number, relationship ID, quantity and the level, but nothing else, to keep it small
//   - detailsFields  : IDs of the fields of the found item (and of the referenced item with fieldIdItem) stored as 'details', i.e. ['TITLE', 'TYPE'].
//                      Fields without a value are returned as null. If empty, all fields having a value are stored
//   - fieldIdCacheDate : Optional ID of a date field of the top level workspace. Once the BOM of a found item was cached, the current date is stored in this field
//                      of that item (requires write access of the SSA / runAs user). During a refresh, the BOM of an item is then only read again if the item
//                      was modified after the date in this field (or if the cached data expired, see expirationDays). Unchanged items keep their cached data.
//                      Leave blank to read the BOMs of all found items with each refresh
//   - filterSkipUpdate : Optional conditions to exclude found items from updates, as list of field IDs and values, i.e. [{ field : 'SKIP_CACHE_UPDATE', value : 'true' },
//                      { field : 'FILE', value : '' }]. An empty value matches fields without a value. Excluded items stay in the cache with their data as is
//   - filterSkipLogic  : 'OR' (default, skip if any condition matches) or 'AND' (skip if all conditions match)
//   - expirationDays : Cached BOMs older than these days are read again even if the item was not modified (only with fieldIdCacheDate), 0 for no expiration
//   - revisionBias   : Revision of the components to use in the expansion : 'release', 'working', 'changeOrder' or 'allChangeOrder'
//   - depth          : Maximum number of BOM levels to expand
//   - concurrency    : Number of BOMs requested in parallel
//   - maxRoots       : Limits the number of top level items, 0 for no limit (use a low number for testing)
// ---------------------------------------------------------------------------------------------------------------------------
exports.bomCache = {
    enabled        : false,
    refreshTimes   : ['02:00'],
    refreshOnStart : true,
    fileName       : '',
    workspaceId    : 57,
    runAs          : '',
    filter         : [],     // i.e. [{ field : 'TYPE', type : '0', comparator : 'is', value : 'Top Level Assembly' }]
    filterLogic    : 'AND',
    filterSkipUpdate : [],   // i.e. [{ field : 'SKIP_CACHE_UPDATE', value : 'true' }, { field : 'FILE', value : '' }]
    filterSkipLogic  : 'OR',
    expirationDays : 0,
    fieldIdItem    : '',     // i.e. 'ENGINEERING_BOM' when filtering for Products
    fieldIdCacheDate : '',   // i.e. 'LAST_BOM_CACHE_UPDATE'
    latestOnly     : false,
    releasedOnly   : false,
    workingOnly    : false,
    bomViewName    : '',     // i.e. 'Details'
    bomFields      : [],     // i.e. ['UNIT_OF_MEASURE', 'SOURCE']
    detailsFields  : [],     // i.e. ['TITLE', 'TYPE']
    revisionBias   : 'release',
    depth          : 20,
    concurrency    : 3,
    maxRoots       : 0
};


// ---------------------------------------------------------------------------------------------------------------------------
//  ENVIRONMENT VARIABLES
// ---------------------------------------------------------------------------------------------------------------------------
//  When running the server in the cloud, changing this file might be a challenge
//  This is why you can also provide all these settings by using the environment variables listed below.
//  Environment variables have higher priority, matching environment variable values overwrite the value defined in this file
//   - TENANT              ( overrides exports.tenant            )
//   - CLIENT_ID           ( overrides exports.clientId          )
//   - REDIRECT_URI        ( overrides exports.redirectUri       )
//   - SETTINGS            ( overrides exports.settings          )
//   - DEFAULT_THEME       ( overrides exports.defaultTheme      )
//   - ENABLE_CACHE        ( overrides exports.enableCache       )
//   - DEBUG_MODE          ( overrides exports.debugMode         )
//   - FUSION_CONNECTED    ( overrides exports.fusionConnected   )
//   - ADMIN_CLIENT_ID     ( overrides exports.adminClientId     )
//   - ADMIN_CLIENT_SECRET ( overrides exports.adminClientSecret )
//   - VAULT_GATEWAY       ( overrides exports.vaultGateway      )
//   - VAULT_NAME          ( overrides exports.vaultName         )
//   - VAULT_VIEWER        ( overrides exports.vaultViewer       )
//   - MONITORING_SECRET   ( overrides exports.monitoringSecret  )
//   - SSA_ACCOUNT_ID      ( overrides exports.ssaAccountId      )
//   - SSA_KEY_ID          ( overrides exports.ssaKeyId          )
//   - SSA_PRIVATE_KEY     ( overrides exports.ssaPrivateKey     )
// ---------------------------------------------------------------------------------------------------------------------------