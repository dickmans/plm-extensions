const express = require('express');
const axios   = require('axios');
const crypto  = require('node:crypto');
const router  = express.Router();



/* ------------------------------------------------------------------------------
    DEFAULT LANDING PAGE & DOCUMENTATION
   ------------------------------------------------------------------------------ */
router.get('/', function(req, res, next) {
    res.render('framework/landing', {
        title : 'PLM TS User Experiences',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/docs', function(req, res, next) {
    res.render('framework/docs', {
        title : 'PLM UX Developer Guide',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/troubleshooting', function(req, res, next) {
    res.render('framework/troubleshooting.pug', {
        title : 'PLM UX Troubleshooting Guide',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});
router.get('/start', function(req, res, next) {
    res.render('framework/start.pug', {
        title : 'PLM UX Extensions',
        theme : (typeof req.query.theme === 'undefined') ? req.app.locals.defaultTheme : req.query.theme
    });
});



/* ------------------------------------------------------------------------------
    CUSTOM APPLICATIONS
    router.get('/<endpoint>', function(req, res, next) { launch('<pug filename in /views>', '<page title>', req, res, next); });
   ------------------------------------------------------------------------------ */
//    router.get('/template', function(req, res, next) { launch('custom/template', 'App Title', req, res, next); });



/* ------------------------------------------------------------------------------
    STANDARD APPLICATIONS
   ------------------------------------------------------------------------------ */
router.get('/classes'       , function(req, res, next) { launch('apps/classes'         , 'Classification Browser'       , req, res, next); });
router.get('/client'        , function(req, res, next) { launch('apps/client'          , 'Mobile PLM Client'            , req, res, next); });
router.get('/dashboard'     , function(req, res, next) { launch('apps/dashboard'       , 'Dashboard'                    , req, res, next); });
router.get('/explorer'      , function(req, res, next) { launch('apps/explorer'        , 'Product Data Explorer'        , req, res, next); });
router.get('/impactanalysis', function(req, res, next) { launch('apps/impactanalysis'  , 'Change Impact Analysis'       , req, res, next); });
router.get('/mbom'          , function(req, res, next) { launch('apps/mbom'            , 'Manufacturing BOM Editor'     , req, res, next); });
router.get('/navigator'     , function(req, res, next) { launch('apps/navigator'       , 'Workspace Navigator'          , req, res, next); });
router.get('/portal'        , function(req, res, next) { launch('apps/portal'          , 'PLM Portal'                   , req, res, next); });
router.get('/portfolio'     , function(req, res, next) { launch('apps/portfolio'       , 'Product Portfolio Catalog'    , req, res, next); });
router.get('/projects'      , function(req, res, next) { launch('apps/projects'        , 'Projects Dashboard'           , req, res, next); });
router.get('/reports'       , function(req, res, next) { launch('apps/reports'         , 'Reports Dashboard'            , req, res, next); });
router.get('/reviews'       , function(req, res, next) { launch('apps/reviews'         , 'Design Reviews'               , req, res, next); });
router.get('/sbom'          , function(req, res, next) { launch('apps/sbom'            , 'Service BOM Editor'           , req, res, next); });
router.get('/service'       , function(req, res, next) { launch('apps/service'         , 'Services Portal'              , req, res, next); });
router.get('/variants'      , function(req, res, next) { launch('apps/variants'        , 'Variant Manager'              , req, res, next); });



/* ------------------------------------------------------------------------------
    ADMINISTRATION UTILITIES
   ------------------------------------------------------------------------------ */
router.get('/data'                , function(req, res, next) { launch('admin/data'                , 'Data Manager'                   , req, res, next); });
router.get('/helpers'             , function(req, res, next) { launch('admin/helpers'             , 'Administration Helper Utilities', req, res, next); });
router.get('/insights'            , function(req, res, next) { launch('admin/insights'            , 'Tenant Insights Dashboard'      , req, res, next); });
router.get('/outstanding-work'    , function(req, res, next) { launch('admin/outstanding-work'    , 'Outstanding Work Report'        , req, res, next); });
router.get('/users'               , function(req, res, next) { launch('admin/users'               , 'User Settings Manager'          , req, res, next); });
router.get('/workspace-comparison', function(req, res, next) { launch('admin/workspace-comparison', 'Workspace Comparison'           , req, res, next); });



/* ------------------------------------------------------------------------------
    Vault & INVENTOR ADDINS
   ------------------------------------------------------------------------------ */
router.get('/addins/context'   , function(req, res, next) { launch('addins/context'   , 'Context Browser', req, res, next); });
router.get('/addins/item'      , function(req, res, next) { launch('addins/item'      , 'Item Master'    , req, res, next); });
router.get('/addins/login'     , function(req, res, next) { launch('addins/login'     , 'Autodesk Login' , req, res, next); });
router.get('/addins/pdm-search', function(req, res, next) { launch('addins/pdm-search', 'PDM Search'     , req, res, next); });
router.get('/addins/projects'  , function(req, res, next) { launch('addins/projects'  , 'PLM Projects'   , req, res, next); });
router.get('/addins/tasks'     , function(req, res, next) { launch('addins/tasks'     , 'My Tasks'       , req, res, next); });



/* ------------------------------------------------------------------------------
    UX DEVELOPERS APPLICATIONS
   ------------------------------------------------------------------------------ */
router.get('/gallery' , function(req, res, next) { launch('framework/gallery'   , 'UX Components Gallery', req, res, next); });
router.get('/template', function(req, res, next) { launch('tutorial/1-template' , 'App Template Page'    , req, res, next); });



/* ------------------------------------------------------------------------------
    APPLICATIONS IN DEVELOPMENT
   ------------------------------------------------------------------------------ */
router.get('/assets'        , function(req, res, next) { launch('dev/assets'          , 'Asset Management'                  , req, res, next); });
router.get('/asset-services', function(req, res, next) { launch('dev/asset-services'  , 'Asset Services Portal'             , req, res, next); });
router.get('/mpe'           , function(req, res, next) { launch('dev/mpe'             , 'Manufacturing Process Editor'      , req, res, next); });
router.get('/browser'       , function(req, res, next) { launch('dev/browser'         , 'PLM Browser'                       , req, res, next); });
router.get('/change'        , function(req, res, next) { launch('dev/change'          , 'Change Manager'                    , req, res, next); });
router.get('/configurator'  , function(req, res, next) { launch('dev/configurator'    , 'Product Configuration Editor'      , req, res, next); });
router.get('/control'       , function(req, res, next) { launch('dev/control'         , 'Remote Device Control'             , req, res, next); });
router.get('/customer'      , function(req, res, next) { launch('dev/customer'        , 'Customer Services'                 , req, res, next); });
router.get('/editor'        , function(req, res, next) { launch('dev/editor'          , 'Content Editor'                    , req, res, next); });
router.get('/matrix'        , function(req, res, next) { launch('dev/matrix'          , 'Portfolio Matrix'                  , req, res, next); });
router.get('/mbom-upgrade'  , function(req, res, next) { launch('dev/mbom-upgrade'    , 'MBOM Upgrade Editor'               , req, res, next); });
router.get('/pdm'           , function(req, res, next) { launch('dev/pdm'             , 'Vault Browser'                     , req, res, next); });
router.get('/pdm-explorer'  , function(req, res, next) { launch('dev/pdm-explorer'    , 'PDM Explorer'                      , req, res, next); });
router.get('/pnd'           , function(req, res, next) { launch('dev/pnd'             , 'Product Data & Processes Explorer' , req, res, next); });
router.get('/resources'     , function(req, res, next) { launch('dev/resources'       , 'Resource Allocation'               , req, res, next); });
router.get('/specification' , function(req, res, next) { launch('dev/specification'   , 'Product Specification Editor'      , req, res, next); });
router.get('/transmittals'  , function(req, res, next) { launch('dev/transmittals'    , 'Transmittals Client'               , req, res, next); });

      

/* ------------------------------------------------------------------------------
    LAUNCH APPLICATION
   ------------------------------------------------------------------------------ */
function launch(appURL, appTitle, req, res, next) {

    let redirect = false;
    let refresh  = false;
    let now      = new Date().getTime();

    if(req.session.hasOwnProperty('headers')) {
        if(req.session.headers.hasOwnProperty('expires')) {
            let expires = new Date(req.session.headers.expires).getTime();
            if(expires > now) {
                refresh = true;
            } else {
                redirect = true;
            }
        } else {
            redirect = true;
        }
    } else {
        redirect = true;
    }

    if(typeof req.session.cache === 'undefined') req.session.cache = [];

    if(redirect) {

        req.session.code_verifier  = base64URLEncode(crypto.randomBytes(32));
        req.session.code_challenge = base64URLEncode(sha256(req.session.code_verifier));

        let redirectUri = 'https://developer.api.autodesk.com/authentication/v2/authorize'
            + '?response_type=code'
            + '&client_id=' + req.app.locals.clientId
            + '&redirect_uri=' + encodeURIComponent(req.app.locals.redirectUri)
            + '&scope=data:read'
            + '&code_challenge=' + req.session.code_challenge
            + '&code_challenge_method=S256'
            + '&state=' + encodeURIComponent(req.url);
        
        res.redirect(redirectUri);

    } else {

        let reqTheme        = req.app.locals.defaultTheme;
        let reqWS           = ''
        let reqDMS          = '';
        let reqNumber       = '';
        let reqFileId       = '';
        let reqOptions      = '';
        let reqHost         = '';
        let reqRevisionBias = 'release';
        
        for(let key in req.query) {
            switch(key.toLowerCase()) {
                case 'theme'        :        reqTheme = req.query[key]; break;
                case 'wsid'         :           reqWS = req.query[key]; break;
                case 'dmsid'        :          reqDMS = req.query[key]; break;
                case 'number'       :       reqNumber = req.query[key]; break;
                case 'fileid'       :       reqFileId = req.query[key]; break;
                case 'options'      :      reqOptions = req.query[key]; break;
                case 'host'         :         reqHost = req.query[key]; break;
                case 'revisionbias' : reqRevisionBias = req.query[key]; break;
            }
        }

        reqHost = reqHost.toLowerCase();

        getVaultId(req, function() {

            console.log(' ');
            console.log('  Launching Application');
            console.log(' --------------------------------------------');
            console.log('  appURL           = ' + appURL); 
            console.log('  appTitle         = ' + appTitle); 
            console.log('  clientId         = ' + req.app.locals.clientId.substring(0, 4) + '...'); 
            console.log('  redirectUri      = ' + req.app.locals.redirectUri); 
            console.log('  tenant           = ' + req.app.locals.tenant); 
            console.log('  tenantLink       = ' + req.app.locals.tenantLink); 
            console.log('  defaultTheme     = ' + req.app.locals.defaultTheme); 
            console.log('  vaultGatewayLink = ' + req.app.locals.vaultGatewayLink); 
            console.log('  vaultName        = ' + req.app.locals.vaultName); 
            console.log('  vaultId          = ' + req.session.vaultId); 
            console.log('  theme            = ' + reqTheme); 
            console.log('  host             = ' + reqHost); 
            console.log('  wsId             = ' + reqWS); 
            console.log('  dmsId            = ' + reqDMS); 
            console.log('  number           = ' + reqNumber); 
            console.log('  fileId           = ' + reqFileId); 
            console.log('  options          = ' + reqOptions); 
            console.log('  revisionBias     = ' + reqRevisionBias); 
            console.log();
            
            if((reqNumber !== '') || ((reqNumber === '') && (appURL === 'addins/item') && (reqDMS === ''))) {

                res.render('framework/findItemByNumber', {
                    number       : reqNumber,
                    revisionBias : reqRevisionBias,
                    theme        : reqTheme,
                    host         : reqHost,
                    options      : reqOptions.split(',')
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
                    fileId       : reqFileId,
                    vaultId      : req.session.vaultId,
                    revisionBias : reqRevisionBias,
                    options      : reqOptions.split(','),
                    config       : req.app.locals.config,
                    menu         : req.app.locals.menu
                });    
                
            }
        });

    }

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
    DETERMINE VAULT ID BASED ON GATEWAY & APS LOGIN
   ------------------------------------------------------------------------------ */
function getVaultId(req, callback) {

    if(typeof req.query.vaultId !== 'undefined') {
        req.session.vaultId = req.query.vaultId;
        callback();
    } else if((req.app.locals.vaultGatewayLink === '') || (req.app.locals.vaultName === '')) {
        req.session.vaultId = '';
        callback();
    } else if((typeof req.session.vaultId !== 'undefined') && (req.session.vaultId !== '')) {
        callback();
    } else {

        console.log(' ');
        console.log('  Validating Vault Settings');
        console.log(' --------------------------------------------');

        let url = req.app.locals.vaultGatewayLink + '/AutodeskDM/Services/api/vault/v2/vaults';

        axios.get(url).then(function(response) {
            for(let vault of response.data.results) {
                if(vault.name === req.app.locals.vaultName) {
                    req.session.vaultId = vault.id;
                    console.log('  Found Vault ' +  req.app.locals.vaultName + ' with id ' + req.session.vaultId); 
                    break;
                }
            }
            console.log(' ');
            callback();
        }).catch(function(error) {
            console.log('error');
            console.log(error);
        });

    }

}



/* ------------------------------------------------------------------------------
    CALLBACK & APS LOGIN
   ------------------------------------------------------------------------------ */
router.get('/callback', function(req, res, next) {
    
    console.log();
    console.log('  /callback START');
    console.log(' --------------------------------------------');
    console.log('  Target URL = ' + req.query.state);
    console.log();

    getToken(req, req.query.code, res, function() {
        res.redirect(req.query.state);
    });
        
});
function getToken(req, code, res, callback) {
    
    let data = {
        code            : code,
        code_verifier   : req.session.code_verifier,
        grant_type      : 'authorization_code',
        client_id       : req.app.locals.clientId,
        redirect_uri    : req.app.locals.redirectUri
    }

    axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers : {
            'accept'        : 'application/json',
            'content-type'  : 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {

        if (response.status == 200) {               
            
            console.log();
            console.log('  Login to Autodesk Platform Services (APS) successful');
            console.log();

            let expiration = new Date();
                expiration.setSeconds(expiration.getSeconds() + (response.data.expires_in - 90));

            req.session.headers = {
                'Content-Type'  : 'application/json',
                'Accept'        : 'application/json',
                'X-Tenant'      : req.app.locals.tenant,
                'token'         : response.data.access_token,
                'Authorization' : 'Bearer ' + response.data.access_token,
                'expires'       : expiration,
                'refresh_token' : response.data.refresh_token
            };
            
            callback();

        } else {

            console.log();      
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');      
            console.log('             LOGIN FAILED');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); 
            console.log(); 

        }

    }).catch(function (error) {

        res.render('framework/error-login', {
            title   : 'Login Error ' + error.response.status,
            code    : error.response.status,
            text    : error.response.data.error
        });


    });
    
}

module.exports = router;