const express = require('express');
const axios   = require('axios');
const crypto  = require('node:crypto');
const jwt     = require('jsonwebtoken');
const router  = express.Router();



/* ------------------------------------------------------------------------------
    DEFAULT LANDING PAGE & DOCUMENTATION
   ------------------------------------------------------------------------------ */
router.get('/', function(req, res, next) {

    if(req.app.locals.server.landingPage !== '') {
       res.redirect(req.app.locals.server.landingPage);
    } else {
        res.render('framework/landing', {
            title : 'PLM TS User Experiences',
            theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
        });
    }   
});
router.get('/chrome-extension', function(req, res, next) {
    if(isServiceDisabled('chrome-extension', req, res)) return;
    res.render('framework/chrome-extension', {
        title : 'PLM UX Chrome Extension',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/docs', function(req, res, next) {
    if(isServiceDisabled('docs', req, res)) return;
    res.render('framework/docs', {
        title : 'PLM UX Developer Guide',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/landing', function(req, res, next) {
    if(isServiceDisabled('landing', req, res)) return;
    res.render('framework/landing', {
        title : 'PLM TS User Experiences',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/troubleshooting', function(req, res, next) {
    if(isServiceDisabled('troubleshooting', req, res)) return;
    res.render('framework/troubleshooting.pug', {
        title : 'PLM UX Troubleshooting Guide',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/start', function(req, res, next) {
    if(isServiceDisabled('start', req, res)) return;
    res.render('framework/start.pug', {
        title : 'PLM UX Extensions',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/error-loading', function(req, res, next) {
    res.render('framework/error-loading.pug');
});



/* ------------------------------------------------------------------------------
    CUSTOM APPLICATIONS
    router.get('/<endpoint>', async function(req, res, next) { launch('<pug filename in /views>', '<node in settings file>', '<page title>', req, res); });
   ------------------------------------------------------------------------------ */
//    router.get('/template', async function(req, res, next) { launch('custom/template', 'custom', 'App Title', req, res); });



/* ------------------------------------------------------------------------------
    STANDARD APPLICATIONS
   ------------------------------------------------------------------------------ */
router.get('/abom'          , async function(req, res, next) { launch('apps/abom'          , 'abom'          , 'Asset BOM Editor'         , req, res, next); });
router.get('/classes'       , async function(req, res, next) { launch('apps/classes'       , 'classes'       , 'Classification Browser'   , req, res, next); });
router.get('/client'        , async function(req, res, next) { launch('apps/client'        , ''              , 'Mobile PLM Client'        , req, res, next); });
router.get('/compare'       , async function(req, res, next) { launch('apps/compare'       , 'compare'       , 'BOM Comparison'           , req, res, next); });
router.get('/dashboard'     , async function(req, res, next) { launch('apps/dashboard'     , 'dashboard'     , 'Dashboard'                , req, res, next); });
router.get('/editor'        , async function(req, res, next) { launch('apps/editor'        , 'editor'        , 'Specification Editor'     , req, res, next); });
router.get('/explorer'      , async function(req, res, next) { launch('apps/explorer'      , 'explorer'      , 'Product Data Explorer'    , req, res, next); });
router.get('/impactanalysis', async function(req, res, next) { launch('apps/impactanalysis', 'impactanalysis', 'Change Impact Analysis'   , req, res, next); });
router.get('/instances'     , async function(req, res, next) { launch('apps/instances'     , 'instances'     , 'BOM Instances Editor'     , req, res, next); });
router.get('/mbom'          , async function(req, res, next) { launch('apps/mbom'          , 'mbom'          , 'Manufacturing BOM Editor' , req, res, next); });
router.get('/navigator'     , async function(req, res, next) { launch('apps/navigator'     , ''              , 'Workspace Navigator'      , req, res, next); });
router.get('/portal'        , async function(req, res, next) { launch('apps/portal'        , 'portal'        , 'PLM Portal'               , req, res, next); });
router.get('/portfolio'     , async function(req, res, next) { launch('apps/portfolio'     , 'portfolio'     , 'Product Portfolio Catalog', req, res, next); });
router.get('/projects'      , async function(req, res, next) { launch('apps/projects'      , 'projects'      , 'Projects Dashboard'       , req, res, next); });
router.get('/reports'       , async function(req, res, next) { launch('apps/reports'       , 'reports'       , 'Reports Dashboard'        , req, res, next); });
router.get('/reviews'       , async function(req, res, next) { launch('apps/reviews'       , 'reviews'       , 'Design Reviews'           , req, res, next); });
router.get('/sbom'          , async function(req, res, next) { launch('apps/sbom'          , 'sbom'          , 'Service BOM Editor'       , req, res, next); });
router.get('/service'       , async function(req, res, next) { launch('apps/service'       , 'service'       , 'Service Portal'           , req, res, next); });
router.get('/variants'      , async function(req, res, next) { launch('apps/variants'      , 'variants'      , 'Variants Manager'         , req, res, next); });



/* ------------------------------------------------------------------------------
    ADMINISTRATION UTILITIES
   ------------------------------------------------------------------------------ */
router.get('/data'            , async function(req, res, next) { launch('admin/data'            , ''        , 'Data Manager'             , req, res, next); });
router.get('/insights'        , async function(req, res, next) { launch('admin/insights'        , 'insights', 'Tenant Insights Dashboard', req, res, next); });
router.get('/outstanding-work', async function(req, res, next) { launch('admin/outstanding-work', ''        , 'Outstanding Work Report'  , req, res, next); });
router.get('/shortcuts'       , async function(req, res, next) { launch('admin/shortcuts'       , ''        , 'Admin Shortcuts Panel'    , req, res, next); });
router.get('/users'           , async function(req, res, next) { launch('admin/users'           , ''        , 'User Settings Manager'    , req, res, next); });
router.get('/comparison'      , async function(req, res, next) { launch('admin/comparison'      , ''        , 'Tenant Comparison'        , req, res, next); });



/* ------------------------------------------------------------------------------
    Vault & INVENTOR ADDINS
   ------------------------------------------------------------------------------ */
router.get('/addins/similar'            , async function(req, res, next) { launch('addins/similar'            , 'addins', 'Similar Items'      , req, res, next); });
router.get('/addins/item-classification', async function(req, res, next) { launch('addins/item-classification', 'addins', 'Item Classification', req, res, next); });
router.get('/addins/context'            , async function(req, res, next) { launch('addins/context'            , 'addins', 'Context Browser'    , req, res, next); });
router.get('/addins/item'               , async function(req, res, next) { launch('addins/item'               , 'addins', 'Item Master'        , req, res, next); });
router.get('/addins/login'              , async function(req, res, next) { launch('addins/login'              , 'addins', 'Autodesk Login'     , req, res, next); });
router.get('/addins/pdm-search'         , async function(req, res, next) { launch('addins/pdm-search'         , 'addins', 'PDM Search'         , req, res, next); });
router.get('/addins/projects'           , async function(req, res, next) { launch('addins/projects'           , 'addins', 'PLM Projects'       , req, res, next); });
router.get('/addins/tasks'              , async function(req, res, next) { launch('addins/tasks'              , 'addins', 'My Tasks'           , req, res, next); });



/* ------------------------------------------------------------------------------
    UX DEVELOPERS APPLICATIONS
   ------------------------------------------------------------------------------ */
router.get('/gallery' , async function(req, res, next) { launch('framework/gallery'  , '', 'UX Components Gallery'     , req, res, next); });
router.get('/studio'  , async function(req, res, next) { launch('framework/studio'   , '', 'Panel Configuration Studio', req, res, next); });
router.get('/template', async function(req, res, next) { launch('tutorial/1-template', '', 'App Template Page'         , req, res, next); });



/* ------------------------------------------------------------------------------
    CUSTOM APPLICATIONS
   ------------------------------------------------------------------------------ */
router.get('/playground' , async function(req, res, next) { launch('custom/playground', '', 'UX Playground', req, res, next); });



/* ------------------------------------------------------------------------------
    APPLICATIONS IN DEVELOPMENT
   ------------------------------------------------------------------------------ */
router.get('/assets'       , async function(req, res, next) { launch('dev/assets'       , '', 'Asset Management'                 , req, res, next); });
router.get('/browser'      , async function(req, res, next) { launch('dev/browser'      , '', 'PLM Browser'                      , req, res, next); });
router.get('/change'       , async function(req, res, next) { launch('dev/change'       , '', 'Change Manager'                   , req, res, next); });
router.get('/configurator' , async function(req, res, next) { launch('dev/configurator' , '', 'Product Configuration Editor'     , req, res, next); });
router.get('/control'      , async function(req, res, next) { launch('dev/control'      , '', 'Remote Device Control'            , req, res, next); });
router.get('/customer'     , async function(req, res, next) { launch('dev/customer'     , '', 'Customer Services'                , req, res, next); });
router.get('/dpp'          , async function(req, res, next) { launch('dev/dpp'          , '', 'Digital Product Passports'        , req, res, next); });
router.get('/matrix'       , async function(req, res, next) { launch('dev/matrix'       , 'matrix', 'Matrix'                     , req, res, next); });
router.get('/mbom-upgrade' , async function(req, res, next) { launch('dev/mbom-upgrade' , '', 'MBOM Upgrade Editor'              , req, res, next); });
router.get('/mealign'      , async function(req, res, next) { launch('dev/mealign'      , 'mep', 'M/E Alignment'                 , req, res, next); });
router.get('/mepbom'       , async function(req, res, next) { launch('dev/mepbom'       , 'mep', 'M/E & Process BOM Editor'      , req, res, next); });
router.get('/pbom'         , async function(req, res, next) { launch('dev/pbom'         , '', 'Process BOM Editor'               , req, res, next); });
router.get('/pdm'          , async function(req, res, next) { launch('dev/pdm'          , '', 'Vault Browser'                    , req, res, next); });
router.get('/pdm-explorer' , async function(req, res, next) { launch('dev/pdm-explorer' , '', 'PDM Explorer'                     , req, res, next); });
router.get('/pnd'          , async function(req, res, next) { launch('dev/pnd'          , '', 'Product Data & Processes Explorer', req, res, next); });
router.get('/resources'    , async function(req, res, next) { launch('dev/resources'    , 'resources', 'Resource Allocation'     , req, res, next); });
router.get('/transmittals' , async function(req, res, next) { launch('dev/transmittals' , '', 'Transmittals Client'              , req, res, next); });
router.get('/worklist'     , async function(req, res, next) { launch('dev/worklist'     , 'worklist', 'Worklist'                 , req, res, next); });

      

/* ------------------------------------------------------------------------------
    LAUNCH APPLICATION
   ------------------------------------------------------------------------------ */
async function launch(appURL, appSettings, appTitle, req, res) {

    if(isServiceDisabled(appURL, req, res)) return;
    
    let authorized   = req.session.hasOwnProperty('headers');
    let refreshToken = false;
    let now          = (new Date().getTime() - 10000);
    let runAs        =  '';
    let useSSA       = false;

    if(appSettings !== '') {
        if(req.app.locals.applications[appSettings] !== null) {
            runAs  = req.app.locals.applications[appSettings].runAs  || '';
            useSSA = req.app.locals.applications[appSettings].useSSA || useSSA;
        }
    }

    if(typeof req.session.cache === 'undefined') req.session.cache = [];    

    if(authorized) {
        if(!req.session.headers.hasOwnProperty('token')) {
            authorized = false;
        }
    }

    if(authorized) {
        if(req.session.headers.hasOwnProperty('refreshToken')) {
            if(req.session.headers.hasOwnProperty('expires')) {
                if(req.session.headers.expires < now) {
                    refreshToken = true;
                }
            }
        }
    }

    if(authorized) {
        if(req.session.hasOwnProperty('loginType')) {
            if(req.session.loginType === '2-legged') {
                authorized = !useSSA && (runAs !== '');
            } else if(req.session.loginType === '3-legged') {
                authorized = !useSSA && (runAs === '');
            } else if(req.session.loginType === 'ssa') {
                authorized = useSSA && (runAs === '');
            }
        }
    }

    if(refreshToken) {

        await refreshExistingToken(req, res);
        authorized = true;

    } 
    
    if(!authorized) {

        if(useSSA)                 genTokenforSSA(req, res, appURL, appSettings, appTitle);
        else if(runAs !== '')  loginAsDefinedUser(req, res, appURL, appSettings, appTitle);
        else                  perform3LeggedLogin(req, res);

    } else {

        let reqTheme        = req.app.locals.defaultTheme;
        let reqWS           = '';
        let reqDMS          = '';
        let reqDescriptor   = '';
        let reqLanguage     = '';
        let reqNumber       = '';
        let reqFileId       = '';
        let reqType         = '';
        let reqOptions      = '';
        let reqHost         = '';
        let reqRevisionBias = 'release';
        
        for(let key in req.query) {
            switch(key.toLowerCase()) {
                case 'theme'        :        reqTheme = req.query[key]; break;
                case 'wsid'         :           reqWS = req.query[key]; break;
                case 'dmsid'        :          reqDMS = req.query[key]; break;
                case 'descriptor'   :   reqDescriptor = req.query[key]; break;
                case 'language'     :     reqLanguage = req.query[key]; break;
                case 'number'       :       reqNumber = req.query[key]; break;
                case 'fileid'       :       reqFileId = req.query[key]; break;
                case 'type'         :         reqType = req.query[key]; break;
                case 'options'      :      reqOptions = req.query[key]; break;
                case 'host'         :         reqHost = req.query[key]; break;
                case 'revisionbias' : reqRevisionBias = req.query[key]; break;
            }
        }

        reqHost = reqHost.toLowerCase();

        getHubId(req, function() {

            console.log(' ');
            console.log('  Launching Application');
            console.log(' --------------------------------------------');
            console.log('  appURL           = ' + appURL); 
            console.log('  appTitle         = ' + appTitle); 
            console.log('  clientId         = ' + req.app.locals.clientId.substring(0, 4) + '...'); 
            console.log('  redirectUri      = ' + req.app.locals.redirectUri); 
            console.log('  tenant           = ' + req.app.locals.tenant); 
            console.log('  tenantLink       = ' + req.app.locals.tenantLink); 
            console.log('  vaultGatewayLink = ' + req.app.locals.vaultGatewayLink); 
            console.log('  vaultName        = ' + req.app.locals.vaultName); 
            console.log('  defaultTheme     = ' + req.app.locals.defaultTheme); 
            console.log('  theme            = ' + reqTheme);
            console.log('  useSSA           = ' + useSSA); 
            console.log('  runAs            = ' + runAs); 
            console.log('  host             = ' + reqHost); 
            console.log('  wsId             = ' + reqWS); 
            console.log('  dmsId            = ' + reqDMS); 
            console.log('  descriptor       = ' + reqDescriptor); 
            console.log('  language         = ' + reqLanguage); 
            console.log('  number           = ' + reqNumber); 
            console.log('  fileId           = ' + reqFileId); 
            console.log('  type             = ' + reqType); 
            console.log('  options          = ' + reqOptions); 
            console.log('  revisionBias     = ' + reqRevisionBias); 
            console.log();

            let findItem = ((reqNumber !== '') && (reqDMS === ''));

            if(!findItem) findItem = ((reqNumber === '') && (appURL === 'addins/item') && (reqDMS === ''));    // Display create dialog
            
            if(findItem) {

                res.render('framework/findItemByNumber', {
                    number : reqNumber,
                    theme  : reqTheme
                });

            } else {

                res.render(appURL, { 
                    title        : appTitle, 
                    tenant       : req.app.locals.tenant,
                    tenantLink   : req.app.locals.tenantLink,
                    theme        : reqTheme,
                    host         : reqHost,
                    wsId         : reqWS,
                    dmsId        : reqDMS,
                    descriptor   : reqDescriptor,
                    number       : reqNumber,
                    fileId       : reqFileId,
                    language     : reqLanguage,
                    type         : reqType,
                    revisionBias : reqRevisionBias,
                    options      : reqOptions.split(','),
                    debugMode    : req.app.locals.debugMode,
                    common       : req.app.locals.common,
                    config       : (appSettings === '') ? {} : req.app.locals.applications[appSettings], 
                    menu         : req.app.locals.menu,
                    colors       : req.app.locals.colors
                });    
                
            }

        });

    }

}
function isServiceDisabled(appURL, req, res) {

    let urlEnd = appURL.split('/').pop();

    if(req.app.locals.server.servicesEnabled[urlEnd]) return false;

    res.locals.message = 'Page not found';
    res.locals.error = { status : 404, stack : 'Cannot find /' + urlEnd + ' on this server'};
    
    res.status(404);
    res.render('framework/error');

    return true;

}



/* ------------------------------------------------------------------------------
    DETERMINE APS HUB ID WHEN CONNECTED TO FUSION
   ------------------------------------------------------------------------------ */
function getHubId(req, callback) {

    if(!req.app.locals.fusionConnected) {
        callback();
    } else if(req.app.locals.hubId !== '') {
        callback();
    } else {

        console.log(' ');
        console.log('  Getting connected Hub ID');
        console.log(' --------------------------------------------');

        let url = req.app.locals.tenantLink + '/api/v3/tenant';

        axios.get(url, { headers : req.session.headers }).then(function(response) {
            let forgeId = response.data.forgeId;
            console.log('  > Tenant ID : ' + forgeId);

            axios.post('https://developer.api.autodesk.com/mfg/v3/graphql/public', { 
                query : `query CDE_PROPERTIES_GetGQLHubId($dataManagementAPIHubId: ID!) {
                    hubByDataManagementAPIId(dataManagementAPIHubId: $dataManagementAPIHubId) {
                        id
                    }
                }`,
                variables : {
                    dataManagementAPIHubId : forgeId,
                }
            },{                
                headers : req.session.headers 
            }).then(function(response) {
                req.app.locals.hubId = response.data.data.hubByDataManagementAPIId.id;
                console.log('  > Hub ID    : ' + req.app.locals.hubId);
                console.log(' ');
                callback();
            }).catch(function(error) {
                console.log('  !ERROR! Could not determine Hub ID');
                callback();
            });

        }).catch(function(error) {
            console.log('  !ERROR! Could not determine Hub ID');
            callback();
        });

    }

}




/* ------------------------------------------------------------------------------
    CALLBACK & APS LOGIN
   ------------------------------------------------------------------------------ */
function perform3LeggedLogin(req, res) {
 
    req.session.code_verifier  = base64URLEncode(crypto.randomBytes(32));
    req.session.code_challenge = base64URLEncode(sha256(req.session.code_verifier));

    let redirectUri = 'https://developer.api.autodesk.com/authentication/v2/authorize'
        + '?response_type=code'
        + '&client_id=' + req.app.locals.clientId
        + '&redirect_uri=' + encodeURIComponent(req.app.locals.redirectUri)
        + '&scope=profapi:img-profile:read data:read data:search data:write'
        + '&code_challenge=' + req.session.code_challenge
        + '&code_challenge_method=S256'
        + '&state=' + encodeURIComponent(req.url);
        
    res.redirect(redirectUri);

}
router.get('/callback', async function(req, res, next) {
    
    console.log();
    console.log('  /callback START');
    console.log(' --------------------------------------------');
    console.log('  Target URL = ' + req.query.state);
    console.log();

    try {

        await getToken(req, req.query.code);
        res.redirect(req.query.state);

    } catch(error) {


        console.log(error);

        console.log();      
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');      
        console.log('             LOGIN FAILED');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); 
        console.log();         

        next(error);
    }
        
});
async function getToken(req, code) {
    
    let data = {
        code            : code,
        code_verifier   : req.session.code_verifier,
        grant_type      : 'authorization_code',
        client_id       : req.app.locals.clientId,
        redirect_uri    : req.app.locals.redirectUri
    }

    return axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers : {
            'accept'        : 'application/json',
            'content-type'  : 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {

        if (response.status == 200) {               
            
            console.log();
            console.log('  Login to Autodesk Platform Services (APS) successful');
            console.log();

            req.session.loginType = '3-legged';

            req.session.headers = {
                'Content-Type' : 'application/json',
                Accept         : 'application/json',
                'X-Tenant'     : req.app.locals.tenant,
                token          : response.data.access_token,
                Authorization  : 'Bearer ' + response.data.access_token,
                expires        : Date.now() + response.data.expires_in * 1000,
                refreshToken   : response.data.refresh_token,
            };

        }

    });
    
}
function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}



/* ------------------------------------------------------------------------------
    REFRESH EXISTING TOKEN
   ------------------------------------------------------------------------------ */
async function refreshExistingToken(req, res) {

    let data = {
        refresh_token : req.session.headers.refreshToken,
        grant_type    : 'refresh_token',
        client_id     : req.app.locals.clientId,
    }

    return axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers: {
            'accept'       : 'application/json',
            'content-type' : 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {

        if (response.status == 200) {

            console.log();
            console.log('  Token refresh successful');
            console.log();

            let expiration = new Date();
            
            expiration.setSeconds(expiration.getSeconds() + (response.data.expires_in - 90));

            req.session.headers = {
                'Content-Type' : 'application/json',
                Accept         : 'application/json',
                'X-Tenant'     : req.app.locals.tenant,
                token          : response.data.access_token,
                Authorization  : 'Bearer ' + response.data.access_token,
                expires        : expiration,
                refreshToken   : response.data.refresh_token
            };
            
        } else {
            console.log();
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('             REFRESH FAILED');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log();
        }

    });

}


/* ------------------------------------------------------------------------------
    GENERATE TOKEN USING SECURE SERVICE ACCOUNT
   ------------------------------------------------------------------------------ */
async function genTokenforSSA(req, res, appURL, appSettings, appTitle) {

    const assertion    = await generateAssertionJWT(req);
    const clientId     = req.app.locals.adminClientId;
    const clientSecret = req.app.locals.adminClientSecret;
    const clientString = clientId + ':' + clientSecret;

    const data = {
        grant_type : 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        scope      : 'data:read data:write',
        assertion  : assertion
    } 

    axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers : {
            'content-type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + btoa(clientString),
        } 
    }).then(function(response) {

        if(response.status == 200) {               
            
            console.log();
            console.log('  Login to Autodesk Platform Services (APS) with SSA account successful');
            console.log();

            req.session.loginType = 'ssa';

            req.session.headers = {
                'Content-Type' : 'application/json',
                Accept         : 'application/json',
                'X-Tenant'     : req.app.locals.tenant,
                token          : response.data.access_token,
                Authorization  : 'Bearer ' + response.data.access_token,
                expires        : Date.now() + response.data.expires_in * 1000
            };

            launch(appURL, appSettings, appTitle, req, res);
            
        } else {

            console.log();      
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');      
            console.log('             LOGIN FAILED');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); 
            console.log(); 

        }

    }).catch(function (error) {

        console.log(error.response);

    });

}
async function generateAssertionJWT(req) {

    const CONFIG = {
        APS_CLIENT_ID      : req.app.locals.adminClientId,
        APS_SECRET_ID      : req.app.locals.adminClientSecret,
        SERVICE_ACCOUNT_ID : req.app.locals.ssaAccountId,
        KEY_ID             : req.app.locals.ssaKeyId,
        PRIVATE_KEY        : req.app.locals.ssaPrivateKey,
        SCOPE              : ["data:read", "data:write"],
        TOKEN_URL          : "https://developer.api.autodesk.com/authentication/v2/token"
    };

    return jwt.sign({
       iss   : CONFIG.APS_CLIENT_ID,
       sub   : CONFIG.SERVICE_ACCOUNT_ID,
       aud   : CONFIG.TOKEN_URL,
       exp   : Math.floor(Date.now() / 1000) + 300,
       scope : CONFIG.SCOPE,
    },
    CONFIG.PRIVATE_KEY,
    {
        algorithm: "RS256",
        header: { alg: "RS256", kid: CONFIG.KEY_ID },
    });

}



/* ------------------------------------------------------------------------------
    IMPERSONATION FOR RUNAS OPTION
   ------------------------------------------------------------------------------ */
function loginAsDefinedUser(req, res, appURL, appSettings, appTitle) {

    const runAs        = req.app.locals.applications[appSettings].runAs;
    const clientId     = req.app.locals.adminClientId;
    const clientSecret = req.app.locals.adminClientSecret;
    const clientString = clientId + ':' + clientSecret;

    const data = {
        grant_type : 'client_credentials',
        scope      : 'data:read viewables:read bucket:read code:all',
    }

    axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers : {
            'accept'        : 'application/json',
            'content-type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + btoa(clientString),
        } 
    }).then(function(response) {

        if (response.status == 200) {               
            
            console.log();
            console.log('  Login to Autodesk Platform Services (APS) as ' + runAs + ' successful');
            console.log();

            req.session.loginType = '2-legged';

            req.session.headers = {
                'Content-Type' : 'application/json',
                Accept         : 'application/json',
                'X-Tenant'     : req.app.locals.tenant,
                'X-user-id'    : runAs,
                token          : response.data.access_token,
                Authorization  : 'Bearer ' + response.data.access_token,
                expires        : Date.now() + response.data.expires_in * 1000,
                refreshToken   : response.data.refresh_token
            };

            launch(appURL, appSettings, appTitle, req, res);
            
        } else {

            console.log();      
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');      
            console.log('             LOGIN FAILED');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); 
            console.log(); 

        }

    }).catch(function (error) {

        console.log(error);

    });

}

module.exports = router;