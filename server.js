var http = require('http');
var express = require('express');

var api = require('./api');
var widget = require('./widget');
var admin = require('./admin');

var routes = require('./routes');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);

app.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'uwotm8' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization, auth-token');    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Credentials', true);    // Set to true if you need the website to include cookies in the requests sent to the API (e.g. in case you use sessions)
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', api);
app.use('/api/widget', widget);
app.use('/api/admin', admin);

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
