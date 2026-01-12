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
//  NEW : Use export.settings to reference a file with custom settings. This file must be stored in /settings and should
//  contain your custom settings only. The standard file settings.js will always be used by the server, but will
//  me merged with your custom settings before. This enables administrators to copy individual settings to be changed
//  from settings.js to custom.js. When updates to settings.js will be provided, the custom settings will still remain
// ---------------------------------------------------------------------------------------------------------------------------
exports.tenant       = '';
exports.clientId     = '';
exports.redirectUri  = 'http://localhost:8080/callback';
exports.defaultTheme = 'dark';
exports.enableCache  = true;    
exports.debugMode    = false;         // Enables printout of view configuration settings to console for debugging purposes (ie when using insertBOM, insertDetails, ...)
exports.settings     = 'custom.js';   // This file must be stored in folder /settings


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL ADDITIONAL CLIENT ID FOR 2-LEGGED AUTHENTICATION
// ---------------------------------------------------------------------------------------------------------------------------
//  The applications OUTSTANDING WORK REPORT and  USER SETTINGS MANAGER require an APS application with Client ID and Client Secret for 2-legged authentications, please proivde the given settings in the next variables.
//  This APS application must be different from the one provided in clientId above as this one must require a Client Secret, to be provided ad adminClientSecret.
//  Only 2-legged applications enable impersonation - which is required for the two advanced admin applications (OUTSTANDING WORK REPORT and USER SETTINGS MANAGER). 
//  However, as this impacts security, its is recommended to provide the following settings only if these advanced admin utilities will be used, maybe even only temporarily or in a local copy of this server.
//  All other applications will work even if the following 2 settings are not provided as they use the clientId variable instead. 
//  Note that you can also provide these settings using the given environment variables ADMIN_CLIENT_ID and ADMIN_CLIENT_SECRET.
exports.adminClientId     = '';
exports.adminClientSecret = '';


// ---------------------------------------------------------------------------------------------------------------------------
//  OPTIONAL VAULT SETTINGS
// ---------------------------------------------------------------------------------------------------------------------------
//  These optional settings are only required for connections to Vault using the REST API BETA (i.e. when using the addins)
//  The standard applications of this UX server do not require a Vault connection, the settings usually should be left blank.
exports.vaultGateway = '';
exports.vaultName    = '';


// ---------------------------------------------------------------------------------------------------------------------------
//  ENVIRONMENT VARIABLES
// ---------------------------------------------------------------------------------------------------------------------------
//  When running the server in the cloud, changing this file might be a challenge
//  This is why you can also provide all these settings by using the environment variables listed below. 
//  Environment variables have higher priority, mattching environment variable values overwrite the value defined in this file
//   - TENANT
//   - CLIENT_ID
//   - REDIRECT_URI
//   - DEFAULT_THEME
//   - ENABLE_CACHE
//   - SETTINGS
//   - DEBUG_MODE
//   - ADMIN_CLIENT_ID
//   - ADMIN_CLIENT_SECRET
//   - VAULT_GATEWAY
//   - VAULT_NAME
// ---------------------------------------------------------------------------------------------------------------------------