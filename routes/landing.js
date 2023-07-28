const express       = require('express');
const axios         = require('axios');
const router        = express.Router();



/* ------------------------------------------------------------------------------
    LIST OF SERVICES
   ------------------------------------------------------------------------------
    router.get('/<endpoint>', function(req, res, next) { redirect('<pug filename in /views>', '<page title>', req, res, next); });
   ------------------------------------------------------------------------------ */
router.get('/classes'       , function(req, res, next) { redirect('classes'         , 'Classification Browser'      , req, res, next); });
router.get('/client'        , function(req, res, next) { redirect('client'          , 'Mobile PLM Client'           , req, res, next); });
router.get('/customer'      , function(req, res, next) { redirect('customer'        , 'Customer Services'           , req, res, next); });
router.get('/configurator'  , function(req, res, next) { redirect('configurator'    , 'Product Configuration Editor', req, res, next); });
router.get('/explorer'      , function(req, res, next) { redirect('explorer'        , 'Product Data Explorer'       , req, res, next); });
router.get('/impactanalysis', function(req, res, next) { redirect('impactanalysis'  , 'Change Impact Analysis'      , req, res, next); });
router.get('/insights'      , function(req, res, next) { redirect('insights'        , 'Tenant Insights Dashboard'   , req, res, next); });
router.get('/mbom'          , function(req, res, next) { redirect('mbom'            , 'Manufacturing BOM Editor'    , req, res, next); });
router.get('/navigator'     , function(req, res, next) { redirect('navigator'       , 'Workspace Navigator'         , req, res, next); });
router.get('/portfolio'     , function(req, res, next) { redirect('portfolio'       , 'Product Portfolio Catalog'   , req, res, next); });
router.get('/projects'      , function(req, res, next) { redirect('projects'        , 'Projects Dashboard'          , req, res, next); });
router.get('/reports'       , function(req, res, next) { redirect('reports'         , 'Reports Dashboard'           , req, res, next); });
router.get('/reviews'       , function(req, res, next) { redirect('reviews'         , 'Design Reviews'              , req, res, next); });
router.get('/service'       , function(req, res, next) { redirect('service'         , 'Services Portal'             , req, res, next); });
router.get('/template'      , function(req, res, next) { redirect('template'        , 'App Template Page'           , req, res, next); });
router.get('/variants'      , function(req, res, next) { redirect('variants'        , 'Variant Manager'             , req, res, next); });



/* ------------------------------------------------------------------------------
    DEFAULT LANDING PAGE
   ------------------------------------------------------------------------------ */
   router.get('/', function(req, res, next) {
    res.render('common/landing', {
        title : 'PLM TS User Experiences'
    });
});


/* ------------------------------------------------------------------------------
    LIST OF APPS
   ------------------------------------------------------------------------------ */
router.get('/apps/printer', function(req, res, next) {
    res.render('apps/printer');
});


/* ------------------------------------------------------------------------------
    REDIRECT TO AUTHENTICATION
   ------------------------------------------------------------------------------ */
function redirect(view, app, req, res, next) {

    console.log(" ");
    console.log("  Redirect START");
    console.log(" --------------------------------------------");
    
    req.session.url         = req.url;
    req.session.view        = view;
    req.session.app         = app;
    req.session.wsId        = req.query.wsId;
    req.session.dmsId       = req.query.dmsId;
    req.session.partNumber  = req.query.partNumber;
    req.session.link        = '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId
    req.session.options     = req.query.hasOwnProperty('options') ? req.query.options : '';
    req.session.tenant      = req.query.hasOwnProperty('tenant') ? req.query.tenant : req.app.locals.tenant;
    
    console.log("  req.session.view         = " + req.session.view); 
    console.log("  req.session.app          = " + req.session.app); 
    console.log("  req.session.wsId         = " + req.session.wsId); 
    console.log("  req.session.dmsId        = " + req.session.dmsId); 
    console.log("  req.session.partNumber   = " + req.session.partNumber); 
    console.log('  req.session.link         = ' + req.session.link); 
    console.log("  req.session.options      = " + req.session.options); 
    console.log("  req.session.tenant       = " + req.session.tenant); 
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

    } else if((typeof req.session.partNumber !== 'undefined') && (typeof req.session.dmsId === 'undefined')) {

        res.render('common/search', {
            partNumber : req.session.partNumber
        });

    } else {

        res.render(req.session.view, { 
            title   : req.session.app, 
            tenant  : req.session.tenant,
            wsId    : req.session.wsId,
            dmsId   : req.session.dmsId,
            link    : req.session.link,
            options : req.session.options,
            config  : req.app.locals.config
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