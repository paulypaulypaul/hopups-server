var express = require('express');
var router = express.Router();
var fs = require('fs');

var Site = require('./models/site');
var Event = require('./models/event');
var Hopup = require('./models/hopup');

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('widget Time: ', Date.now());
  next();
});

router.get('/:id', function(req, res) {

      Site.findOne({_id : req.params.id}, function(err, site){
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

            Event.find({siteId : site._id, active: true}, function(err, events){

              config.events = events;

              /*Hopup
              .find({siteId : site._id}, { actions: 1, events: 1})
              .exec(function(err, hopups){
                  config.hopups = hopups;*/

                  data = data.replace(/\[%CONFIG%\]/gi,
                    JSON.stringify({
                      config: config,
                      siteId: site._id,
                      domain: req.get('host')  // this makes it easy to use on test and production serve - might not be goo idea - not sure why
                    }
                  ));

                  res.write(data)
                  res.end();

            /*  });*/
            });
          });
        }
      });
});

module.exports = router;
