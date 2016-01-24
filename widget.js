var express = require('express');
var router = express.Router();
var fs = require('fs');

var Datastore = require('nedb');
var sitesDb = new Datastore({ filename: 'data/sites', autoload: true });
var eventsDb = new Datastore({ filename: 'data/events', autoload: true });

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('widget Time: ', Date.now());
  next();
});

// define the home page route
router.get('/:id', function(req, res) {

      sitesDb.findOne({_id : req.params.id}, function(err, site){
        res.setHeader('Content-Type', 'application/json');

        if (!site){
          res.write('{}');
          res.end();
        } else {

          var config = {};
          fs.readFile('./public/script.js', 'utf8', function (err, data) {
            if (err) {
              return console.log(err);
            }

            eventsDb.find({siteId : site._id}, function(err, events){

              config.events = events;

              data = data.replace(/\[%SITEID%\]/gi, "'" + site._id + "';");
              data = data.replace(/\[%CONFIG%\]/gi, JSON.stringify(config));
              data = data.replace(/\[%DOMAIN%\]/gi, "'numero-ph.thisisnumero.internal:3000'");
              res.write(data)
              res.end();
            });
          });
        }



      });



});

module.exports = router;
