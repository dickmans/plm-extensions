const express       = require('express');
const axios         = require('axios');
const querystring   = require('querystring');
const router        = express.Router();



/* ---------------------------------------
    DEFAULT LANDING PAGE
   --------------------------------------- */
router.get('/', function(req, res, next) {
    res.render('landing', {
        title : 'PLM User Experiences'
    });
});



/* ---------------------------------------
    LIST OF SERVICES
   --------------------------------------- */
router.get('/classes', function(req, res, next) {
    redirect('classes', 'Classification Browser', req, res, next);
});
router.get('/client', function(req, res, next) {
    redirect('client', 'Mobile PLM Client', req, res, next);
});
router.get('/compare', function(req, res, next) {
    redirect('compare', 'Design Comparison', req, res, next);
});
router.get('/costing', function(req, res, next) {
    redirect('costing', 'Cost Sheet Editor', req, res, next);
});
router.get('/explorer', function(req, res, next) {
    redirect('explorer', 'Product Data Explorer', req, res, next);
});
router.get('/reviews', function(req, res, next) {
    redirect('reviews', 'Design Reviews', req, res, next);
});
router.get('/mbom', function(req, res, next) {
    redirect('mbom', 'Manufacturing BOM Editor', req, res, next);
});
router.get('/impactanalysis', function(req, res, next) {
    redirect('impactanalysis', 'Change Impact Analysis', req, res, next);
});
router.get('/insights', function(req, res, next) {
    redirect('insights', 'Tenant Insights Dashboard', req, res, next);
});
router.get('/portfolio', function(req, res, next) {
    redirect('portfolio', 'Product Portfolio Catalog', req, res, next);
});
router.get('/projects', function(req, res, next) {
    redirect('projects', 'Projects Dashboard', req, res, next);
});
router.get('/reports', function(req, res, next) {
    redirect('reports', 'Reports Dashboard', req, res, next);
});
router.get('/variants', function(req, res, next) {
    redirect('variants', 'Variant Manager', req, res, next);
});
router.get('/service', function(req, res, next) {
    redirect('service', 'Services Portal', req, res, next);
});


/* ---------------------------------------
    LIST OF APPS
   --------------------------------------- */
router.get('/apps/printer', function(req, res, next) {

    res.render('apps/printer');

});



/* ---------------------------------------
    REDIRECT TO AUTHENTICATION
   --------------------------------------- */
function redirect(view, app, req, res, next) {

    console.log(" ");
    console.log("  Redirect START");
    console.log(" --------------------------------------------");
    
    req.session.url     = req.url;
    req.session.view    = view;
    req.session.app     = app;
    req.session.wsId    = req.query.wsId;
    req.session.dmsId   = req.query.dmsId;
    req.session.link    = '/api/v3/workspaces/' + req.query.wsId + '/items/' + req.query.dmsId
    req.session.options = req.query.options;
    req.session.tenant  = req.query.hasOwnProperty('tenant') ? req.query.tenant : req.app.locals.tenant;
    
    console.log("  req.session.view    = " + req.session.view); 
    console.log("  req.session.app     = " + req.session.app); 
    console.log("  req.session.wsId    = " + req.session.wsId); 
    console.log("  req.session.dmsId   = " + req.session.dmsId); 
    console.log('  req.session.link    = ' + req.session.link); 
    console.log("  req.session.options = " + req.session.options); 
    console.log("  req.session.tenant  = " + req.session.tenant); 
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

        res.render('redirect', { 
            title       : req.session.app,
            clientId    : req.app.locals.clientId,
            redirectUri : req.app.locals.redirectUri
        });

    } else {

        res.render(req.session.view, { 
            title   : req.session.app, 
            tenant  : req.session.tenant,
            wsId    : req.session.wsId,
            dmsId   : req.session.dmsId,
            link    : req.session.link,
            options : req.session.options
        });
        
    }
}


/* ---------------------------------------
    CALLBACK & FORGE LOGIN
   --------------------------------------- */
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
    
    let url = 'https://developer.api.autodesk.com/authentication/v1/gettoken';
    
    let params = {
        'client_id'     : req.app.locals.clientId,
        'client_secret' : req.app.locals.clientSecret,
        'grant_type'    : 'authorization_code',
        'code'          : code,
        'redirect_uri'  : req.app.locals.redirectUri
    }
    
    axios.post(url, querystring.stringify(params)).then(function (response) {

        if (response.status == 200) {               
            
            console.log();
            console.log('  Login to FORGE successful');
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