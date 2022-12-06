var fs = require('fs');


/* ------------------------------------------------------------------
   Uncomment the following lines to enable https connections 
   This requires to have the given certificates stored in /keys
   use letsencrypt to generate such keys if needed 
   ------------------------------------------------------------------ */
// var https       = require('https');
// var privateKey  = fs.readFileSync('keys/privkey.pem', 'utf8');
// var certificate = fs.readFileSync('keys/fullchain.pem', 'utf8');
// var credentials = {key: privateKey, cert: certificate};


const express     = require('express');
const session     = require('express-session');
const path        = require('path');
const favicon     = require('serve-favicon');
const morgan      = require('morgan');
const bodyParser  = require('body-parser');
const landing     = require('./routes/landing');
const plm         = require('./routes/plm');
const extensions  = require('./routes/extensions');
const settings    = require('./settings.js');
const app         = express();


// READ CONFIGURATION SETTINGS
app.locals.tenant       = settings.tenant;
app.locals.clientId     = settings.clientId;
app.locals.clientSecret = settings.clientSecret;
app.locals.redirectUri  = settings.redirectUri;


// VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// FAVICON & OTHERS
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(session({
    secret: "XASDSEDR",
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.static(path.join(__dirname, 'public')));


// ROUTING
app.use('/', landing);
app.use('/plm', plm);
app.use('/extensions', extensions);


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
    res.render('error');

});


/* ------------------------------------------------------------------
   Uncomment the following lines to enable https connections 
   This requires to have the given certificates stored in /keys
   use letsencrypt to generate such keys if needed 
   ------------------------------------------------------------------ */
// var httpsServer = https.createServer(credentials, app);
//     httpsServer.listen(settings.port);


module.exports = app;