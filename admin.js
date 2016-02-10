var express = require('express');
var router = express.Router();
var fs = require('fs');

var mongoose   = require('mongoose');
var Site = require('./models/site');
var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');

router.get('/sites', function(req, res) {
      Site.find({}, function(err, sites){
        res.send(sites);
      });
});

router.post('/sites', function(req, res) {
      var site = req.body;
      Site.collection.insert(site, function(err, site){
          res.send(site);
      });
});

router.get('/sites/:siteId/:type', function(req, res) {
      var type = req.params.type;

      if (type === 'events'){
        Event.find({ siteId : req.params.siteId }, function(err, events){
          res.send(events);
        });
      } else if (type === 'segments'){
        Segment.find({ siteId : req.params.siteId }, function(err, segments){
          res.send(segments);
        });
      } else if (type === 'actions'){
        Action.find({ siteId : req.params.siteId })
        //.populate('segments')
        .exec(function(err, actions){
          res.send(actions);
        });
      }

});

router.post('/sites/:siteId/:type', function(req, res) {
      var type = req.params.type;
      var thing = req.body;

      if (!thing._id){
        thing._id = mongoose.Types.ObjectId();
      }

      var search = {
        _id : thing._id
      }

      if (type === 'events'){
        Event.update(search, thing, { upsert: true }, function(err, event){
          res.send(event);
        });
      } else if (type === 'segments'){
        Segment.update(search, thing, { upsert: true }, function(err, segment){
          res.send(segment);
        });
      } else if (type === 'actions'){
        Action.update(search, thing, { upsert: true }, function(err, action){
          res.send(action);
        });
      }
});

router.delete('/sites/:siteId/:type/:id', function(req, res) {
      var type = req.params.type;
      var id = req.params.id;

      if (type === 'events'){
        Event.find({ _id : id }).remove().exec(function(err, events){
          res.send(events);
        });
      } else if (type === 'segments'){
        Segment.find({ _id : id }).remove().exec(function(err, segments){
          res.send(segments);
        });
      } else if (type === 'actions'){
        Action.find({ _id : id }).remove().exec(function(err, actions){
          res.send(actions);
        });
      }

});

module.exports = router;
