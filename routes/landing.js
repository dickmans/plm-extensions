const express       = require('express');
const axios         = require('axios');
const router        = express.Router();



/* ------------------------------------------------------------------------------
    LIST OF SERVICES
   ------------------------------------------------------------------------------
    router.get('/<endpoint>', function(req, res, next) { launch('<pug filename in /views>', '<page title>', req, res, next); });
   ------------------------------------------------------------------------------ */
router.get('/classes'       , function(req, res, next) { launch('classes'         , 'Classification Browser'      , req, res, next); });
router.get('/client'        , function(req, res, next) { launch('client'          , 'Mobile PLM Client'           , req, res, next); });
router.get('/configurator'  , function(req, res, next) { launch('configurator'    , 'Product Configuration Editor', req, res, next); });
router.get('/customer'      , function(req, res, next) { launch('customer'        , 'Customer Services'           , req, res, next); });
router.get('/dashboard'     , function(req, res, next) { launch('dashboard'       , 'Dashboard'                   , req, res, next); });
router.get('/editor'        , function(req, res, next) { launch('editor'          , 'Content Editor'              , req, res, next); });
router.get('/explorer'      , function(req, res, next) { launch('explorer'        , 'Product Data Explorer'       , req, res, next); });
router.get('/impactanalysis', function(req, res, next) { launch('impactanalysis'  , 'Change Impact Analysis'      , req, res, next); });
router.get('/insights'      , function(req, res, next) { launch('insights'        , 'Tenant Insights Dashboard'   , req, res, next); });
router.get('/matrix'        , function(req, res, next) { launch('matrix'          , 'Portfolio Matrix'            , req, res, next); });
router.get('/mbom'          , function(req, res, next) { launch('mbom'            , 'Manufacturing BOM Editor'    , req, res, next); });
router.get('/navigator'     , function(req, res, next) { launch('navigator'       , 'Workspace Navigator'         , req, res, next); });
router.get('/portfolio'     , function(req, res, next) { launch('portfolio'       , 'Product Portfolio Catalog'   , req, res, next); });
router.get('/projects'      , function(req, res, next) { launch('projects'        , 'Projects Dashboard'          , req, res, next); });
router.get('/reports'       , function(req, res, next) { launch('reports'         , 'Reports Dashboard'           , req, res, next); });
router.get('/reviews'       , function(req, res, next) { launch('reviews'         , 'Design Reviews'              , req, res, next); });
router.get('/service'       , function(req, res, next) { launch('service'         , 'Services Portal'             , req, res, next); });
router.get('/template'      , function(req, res, next) { launch('template'        , 'App Template Page'           , req, res, next); });
router.get('/variants'      , function(req, res, next) { launch('variants'        , 'Variant Manager'             , req, res, next); });



/* ------------------------------------------------------------------------------
    DEFAULT LANDING PAGE
   ------------------------------------------------------------------------------ */
router.get('/', function(req, res, next) {
    res.render('common/landing', {
        title : 'PLM TS User Experiences'
    });
});



/* ------------------------------------------------------------------------------
    INVENTOR ADDINS
   ------------------------------------------------------------------------------ */
router.get('/addins/dev'           , function(req, res, next) { launch('addins/dev'          , 'PLM Plugin Development'  , req, res, next); });
router.get('/addins/bom'           , function(req, res, next) { launch('addins/bom'          , 'BOM Management'          , req, res, next); });
router.get('/addins/change'        , function(req, res, next) { launch('addins/change'       , 'Change Management'       , req, res, next); });
router.get('/addins/context'       , function(req, res, next) { launch('addins/context'      , 'Context Browser'         , req, res, next); });
router.get('/addins/configurations', function(req, res, next) { launch('addins/configuration', 'Configruation Management', req, res, next); });



/* ------------------------------------------------------------------------------
    LIST OF APPS
   ------------------------------------------------------------------------------ */
router.get('/apps/printer', function(req, res, next) {
    res.render('apps/printer');
});



/* ------------------------------------------------------------------------------
    LAUNCH APPLICATION
   ------------------------------------------------------------------------------ */
function launch(view, app, req, res, next) {

    console.log(' ');
    console.log('  Launch Application START');
    console.log(' --------------------------------------------');
    
    let reqWS           = ''
    let reqDMS          = '';
    let reqPartNumber   = '';
    let reqRevisioBias  = 'release';

    for(key in req.query) {
        switch(key.toLowerCase()) {
            case 'wsid'         :          reqWS = req.query[key]; break;
            case 'dmsid'        :         reqDMS = req.query[key]; break;
            case 'partnumber'   :  reqPartNumber = req.query[key]; break;
            case 'revisionbias' : reqRevisioBias = req.query[key]; break;
        }
    }

    req.session.url             = req.url;
    req.session.view            = view;
    req.session.app             = app;
    req.session.wsId            = reqWS;
    req.session.dmsId           = reqDMS;
    req.session.partNumber      = reqPartNumber;
    req.session.link            = '/api/v3/workspaces/' + reqWS + '/items/' + reqDMS;
    req.session.options         = req.query.hasOwnProperty('options') ? req.query.options : '';
    req.session.tenant          = req.query.hasOwnProperty('tenant') ? req.query.tenant : req.app.locals.tenant;
    req.session.revisionBias    = reqRevisioBias;
    
    console.log('  req.session.view         = ' + req.session.view); 
    console.log('  req.session.app          = ' + req.session.app); 
    console.log('  req.session.wsId         = ' + req.session.wsId); 
    console.log('  req.session.dmsId        = ' + req.session.dmsId); 
    console.log('  req.session.partNumber   = ' + req.session.partNumber); 
    console.log('  req.session.link         = ' + req.session.link); 
    console.log('  req.session.options      = ' + req.session.options); 
    console.log('  req.session.tenant       = ' + req.session.tenant); 
    console.log('  req.session.revisionBias = ' + req.session.revisionBias); 
    console.log();

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
    
    if(redirect) {

        res.render('common/redirect', { 
            title       : req.session.app,
            clientId    : req.app.locals.clientId,
            redirectUri : req.app.locals.redirectUri
        });

    } else if(reqPartNumber !== '') {

        res.render('common/search', {
            partNumber : reqPartNumber,
            title        : req.session.app, 
            tenant       : req.session.tenant,
            revisionBias : req.session.revisionBias,
            options      : req.session.options
        });

    } else {

        res.render(req.session.view, { 
            title        : req.session.app, 
            tenant       : req.session.tenant,
            wsId         : req.session.wsId,
            dmsId        : req.session.dmsId,
            link         : req.session.link,
            revisionBias : req.session.revisionBias,
            options      : req.session.options,
            config       : req.app.locals.config
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
    console.log('  req.session.app  = ' + req.session.app);
    console.log('  req.session.view = ' + req.session.view);
    
    getToken(req, req.query.code, function() {
        res.redirect(req.session.url);
    });
        
});
function getToken(req, code, callback) {
    
    let data = {
        'code'          : code,
        'grant_type'    : 'authorization_code',
        'redirect_uri'  : req.app.locals.redirectUri
    }

    axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers : {
            'accept'        : 'application/json',
            'authorization' : 'Basic ' + btoa(req.app.locals.clientId + ':' + req.app.locals.clientSecret),
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
            
            console.log(error);
        }

    }).catch(function (error) {
        console.log(error);
    });
    
}

module.exports = router;