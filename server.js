var http = require('http');
var express = require('express');
var compression = require('compression')

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost/hopups');

//mongoose.set('debug', true);

var api = require('./api');
var widget = require('./widget');
var admin = require('./admin');

var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);

function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!COMPRESSION');
  // fallback to standard filter function
  return compression.filter(req, res)
}

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(compression({filter: shouldCompress}));

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
