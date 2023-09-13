let fileSettings = (process.argv.length > 2) ? '.' + process.argv[2] : '';

const express     = require('express');
const session     = require('express-session');
const path        = require('path');
const favicon     = require('serve-favicon');
const morgan      = require('morgan');
const bodyParser  = require('body-parser');
const landing     = require('./routes/landing');
const plm         = require('./routes/plm');
const extensions  = require('./routes/extensions');
const settings    = require('./settings' + fileSettings + '.js');
const app         = express();


// READ CONFIGURATION SETTINGS
app.locals.tenant       = settings.tenant;
app.locals.clientId     = settings.clientId;
app.locals.clientSecret = settings.clientSecret;
app.locals.redirectUri  = settings.redirectUri;
app.locals.config       = settings.config;
app.locals.debugMode    = settings.debugMode;


// VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(require('express-status-monitor')());


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
    res.render('common/error');

});

module.exports = app;