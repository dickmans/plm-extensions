let fileEnvironment = (process.argv.length > 2) ? './environments/' + process.argv[2] + '.js' : './environment.js';

const fs = require('fs');

if ((process.argv.length > 2) && (!fs.existsSync('./' + fileEnvironment))) {

    console.log();
    console.log('  ERROR ! File ' + process.argv[2] + '.js could not be found in folder environments');
    console.log('        ! With the release of December 2025, the former settings file got split in 2 separate files.');
    console.log('        ! While settings.js remains for app configuration, connection settings now are managed in environment.js.');
    console.log('        ! This allows for updates of settings.js from github without overwriting your connection settings.');
    console.log('           ');
    console.log('        ! You can still use one UX server with multiple tenants: Create multiple environment ');
    console.log('        ! files in folder /environments and pass the file to use at server startup.');
    console.log('        ! For example, in order to launch the server with file /environments/adsktenant.js,');
    console.log('        ! you have to start the server with the following command:');
    console.log('        ! npm start adsktenant');
    console.log('        ');
    console.log('  To start your server, create file /environments/' + process.argv[2] + '.js as copy of file environment.js');
    console.log();
    console.log();
  
} else {

    const express     = require('express');
    const session     = require('express-session');
    const path        = require('path');
    const favicon     = require('serve-favicon');
    const morgan      = require('morgan');
    const serveIndex  = require('serve-index');
    const bodyParser  = require('body-parser');
    const landing     = require('./routes/landing');
    const plm         = require('./routes/plm');
    const vault       = require('./routes/pdm');
    const services    = require('./routes/services');
    const { fchmodSync } = require('fs');
    const environment = require(fileEnvironment);
    const app         = express();


    // READ CONFIGURATION SETTINGS
    app.locals.clientId          = process.env.CLIENT_ID           || environment.clientId;
    app.locals.redirectUri       = process.env.REDIRECT_URI        || environment.redirectUri;
    app.locals.tenant            = process.env.TENANT              || environment.tenant;
    app.locals.defaultTheme      = process.env.DEFAULT_THEME       || environment.defaultTheme;
    app.locals.enableCache       = process.env.ENABLE_CACHE        || environment.enableCache;
    app.locals.debugMode         = process.env.DEBUG_MODE          || environment.debugMode;
    app.locals.settings          = process.env.SETTINGS            || environment.settings;
    app.locals.adminClientId     = process.env.ADMIN_CLIENT_ID     || environment.adminClientId;
    app.locals.adminClientSecret = process.env.ADMIN_CLIENT_SECRET || environment.adminClientSecret;
    app.locals.vaultGateway      = process.env.VAULT_GATEWAY       || environment.vaultGateway;
    app.locals.vaultName         = process.env.VAULT_NAME          || environment.vaultName;
    app.locals.tenantLink        = 'https://' + app.locals.tenant + '.autodeskplm360.net';
    app.locals.vaultGatewayLink  = (app.locals.vaultGateway === '') ? '' : 'https://' + app.locals.vaultGateway + '.vg.autodesk.com';
    app.locals.protocol          = process.env.PROTOCOL || app.locals.redirectUri.split('://')[0];
    app.locals.port              = process.env.PORT;

    if(typeof app.locals.port === 'undefined') {
        let redirectSplit = app.locals.redirectUri .split(':');
        if(redirectSplit.length > 2) {
            app.locals.port = redirectSplit[2].split('/')[0];
        }
    } 

    let settings = require('./settings.js');
    let custom   = require('./settings/' + environment.settings);

    mergeSettings(settings, custom);

    settings.chrome.workspaces = settings.common.workspaceIds;

    app.locals.debugMode    = environment.debugMode;
    app.locals.common       = settings.common;
    app.locals.applications = settings.applications;
    app.locals.menu         = settings.menu;
    app.locals.server       = settings.server;
    app.locals.chrome       = settings.chrome;
    app.locals.colors       = settings.colors;


    // VIEW ENGINE SETUP
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');


    // FAVICON & OTHERS
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(morgan('dev'));
    app.use(session({
        secret: "XASDSEDR",
        proxy: true,
        resave: false,
        saveUninitialized: false
    }));
    app.use(bodyParser.json({limit: "50mb"}));
    app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
    app.use(express.static(path.join(__dirname, 'public')));
    
    
    // ROUTING
    app.use('/', landing);
    app.use('/plm', plm);
    app.use('/vault', vault);
    app.use('/services', services);
    app.use('/storage', express.static(__dirname + '/storage'), serveIndex(__dirname + '/storage', { icons: true }));


    // CATCH 404 AND FORWARD TO ERROR HANDLER
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });


    // ERROR HANDLER
    app.use(function(err, req, res, next) {

        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('framework/error');

    });

    module.exports = app;

    fchmodSync

}

function mergeSettings(master, custom) {

    mergeSettingsProperty(master, custom, 'common');
    mergeSettingsProperty(master, custom, 'applications');
    mergeSettingsProperty(master, custom, 'menu');
    mergeSettingsProperty(master, custom, 'server');
    mergeSettingsProperty(master, custom, 'chrome');

}
function mergeSettingsProperty(master, custom, property) {

    if(typeof custom[property] === 'undefined') return;

    let keysCustom = Object.keys(custom[property]);

    if(keysCustom.length === 0) return;

    if(typeof master[property] === 'undefined') {
        master[property] = custom[property];
    } else if(keysCustom.length > 0) {
        for(let key of keysCustom) {
            let keyProperty = custom[property][key];
            if(Array.isArray(keyProperty)) {  
                if(keyProperty.length === 0) {
                    master[property][key] = keyProperty;
                } else if(typeof keyProperty[0] === 'string') {
                    master[property][key] = keyProperty;
                } else if(keyProperty.length !== master[property][key].length) {
                    master[property][key] = keyProperty;
                } else {
                    for(let indexProperty in keyProperty) {
                        let entry = keyProperty[indexProperty];
                        let arrayKeys = Object.keys(entry);
                        for(let arrayKey of arrayKeys) {
                            master[property][key][indexProperty][arrayKey] = keyProperty[indexProperty][arrayKey];
                        }
                    }
                }
            } else if(typeof keyProperty === 'object'){
                mergeSettingsProperty(master[property], custom[property], key);
            } else {
                master[property][key] = keyProperty;
            }
        }
   } else master[property] = custom[property];

}