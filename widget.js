var express = require('express');
var router = express.Router();
var fs = require('fs');
var UglifyJS = require("uglify-js");

var logger = require('./lib/logger').create("WIDGET");

var Site = require('./models/site');
var Event = require('./models/event');
var Hopup = require('./models/hopup');
var Q = require('q');

var fileData = false;
var getFileData = function(){
  var deferred = Q.defer();

  if (!fileData){
    fs.readFile('./public/script.js', 'utf8', function (err, data) {
      if (err) {
        deferred.resolve(err);
      }
      deferred.resolve(data);
    });
  } else {
    deferred.resolve(fileData);
  }

  return deferred.promise;
}

router.get('/:id', function(req, res) {

  Site.findOne({_id : req.params.id}, function(err, site){
    res.setHeader('Content-Type', 'application/json');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if (!site){
      res.send('{}');
    } else {
      getFileData().then(function(data){

        data = data.replace(/\[%CONFIG%\]/gi,
          JSON.stringify({
            siteId: site._id,
            domain: req.get('host')  // this makes it easy to use on test and production serve - might not be goo idea - not sure why
          }
        ));

        var result = UglifyJS.minify(data, {
          fromString: true
        });

        res.send(result.code);
      });
    }
  });
});

router.get('/:id/config', function(req, res) {
  Site.findOne({_id : req.params.id}, function(err, site){
    res.setHeader('Content-Type', 'application/json');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if (!site){
      res.write('{}');
      res.end();
    } else {
      Event.find({siteId : site._id, active: true, isActionEvent: {$ne: true}}, function(err, events){

        //here we need a route to fire immidiate events for thing such as dom replace where we want the action to be
        //as fast as possible

        res.send(events);
      });
    }
  });
});

module.exports = router;
