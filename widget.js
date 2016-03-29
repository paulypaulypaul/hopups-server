var express = require('express');
var router = express.Router();
var fs = require('fs');
var UglifyJS = require("uglify-js");

var logger = require('./lib/logger').create("WIDGET");

var Site = require('./models/site');
var Event = require('./models/event');
var Hopup = require('./models/hopup');

router.get('/:id', function(req, res) {

      Site.findOne({_id : req.params.id}, function(err, site){
        res.setHeader('Content-Type', 'application/json');
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        if (!site){
          res.send('{}');
        } else {

          fs.readFile('./public/script.js', 'utf8', function (err, data) {
            if (err) {
              return logger.error(err);
            }

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
          fs.readFile('./public/script.js', 'utf8', function (err, data) {
            if (err) {
              return console.log(err);
            }

            Event.find({siteId : site._id, active: true}, function(err, events){
              res.send(events);
            });
          });
        }
      });
});

module.exports = router;
