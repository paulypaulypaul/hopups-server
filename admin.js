var express = require('express');
var router = express.Router();
var fs = require('fs');

var Datastore = require('nedb');
var sitesDb = new Datastore({ filename: 'data/sites', autoload: true });
var eventsDb = new Datastore({ filename: 'data/events', autoload: true });
var segmentsDb = new Datastore({ filename: 'data/segments', autoload: true });
var actionsDb = new Datastore({ filename: 'data/actions', autoload: true });

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('widget Time: ', Date.now());
  next();
});


router.get('/sites', function(req, res) {
      sitesDb.find({}, function(err, sites){
        res.send(sites);
      });
});

router.post('/sites', function(req, res) {
      var site = req.body;
      sitesDb.insert(site, function(err, sites){
        sitesDb.find({}, function(err, sites){
          res.send(sites);
        });
      });
});

router.get('/sites/:siteId/events', function(req, res) {
      eventsDb.find({ siteId : req.params.siteId }, function(err, events){
        res.send(events);
      });
});

router.post('/sites/:siteId/events', function(req, res) {
      var event = req.body;
      console.log(event);
      eventsDb.update({ _id : event._id }, event, { upsert: true, returnUpdatedDocs: true }, function(err, event){
        console.log(err)
        res.send(event);
      });
});


router.get('/sites/:siteId/segments', function(req, res) {
      segmentsDb.find({ siteId : req.params.siteId }, function(err, segments){
        res.send(segments);
      });
});

router.post('/sites/:siteId/segments', function(req, res) {
      var segment = req.body;
      segmentsDb.update({ _id : event._id }, event, { upsert: true, returnUpdatedDocs: true }, function(err, segment){
        console.log(err)
      });
});

router.get('/sites/:siteId/actions', function(req, res) {
      actionsDb.find({ siteId : req.params.siteId }, function(err, actions){
        res.send(actions);
      });
});

router.post('/sites/:siteId/actions', function(req, res) {
      var action = req.body;
      console.log(action);
      actionsDb.update({ _id : action._id }, action, { upsert: true, returnUpdatedDocs: true }, function(err, action){
        console.log(err)
        res.send(action);
      });
});

module.exports = router;
