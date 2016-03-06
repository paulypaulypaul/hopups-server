var express = require('express');
var router = express.Router();
var fs = require('fs');

var mongoose   = require('mongoose');
var Site = require('./models/site');
var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');
var Hopup = require('./models/hopup');
var SessionData = require('./models/sessiondata');
var ActionSessionData = require('./models/actionsessiondata');
var verifyFacebookUserAccessToken = require('./verifyFacebookUserAccessToken');

var _ = require('underscore');

router.get('/sites/:siteId?', verifyFacebookUserAccessToken,  function(req, res) {
      var requestUserId = req.user._id;
      var query = {user: requestUserId};
      if (req.params.siteId){
        query._id = req.params.siteId;
      }

      Site.find(query, function(err, sites){
        res.send(sites);
      });
});

router.post('/sites/', verifyFacebookUserAccessToken, function(req, res) {
      var site = req.body;
      site.user = req.user._id;

      if (!site._id){
        site._id = mongoose.Types.ObjectId();
      }

      var search = {
        _id : site._id
      }

      /*Event.update(search,
            "siteId" : ObjectId("56b8891f3cf226082f1627e4"),
            "message" : "eventfired",
            "event" : "eventfired",
            "selector" : "body",
            "page" : "*",
            "name" : "eventfired",
            "tag" : "eventfired"
        }, { upsert: true }, function(err, event){
        res.send(event);
      });*/

      Site.findOneAndUpdate(search, site, { upsert: true, new: true }, function(err, report, doc){
        res.send(doc);
      });

});

router.get('/sites/:siteId/:type', verifyFacebookUserAccessToken, function(req, res) {
      var requestUserId = req.user._id;
      var siteId = req.params.siteId;
      var type = req.params.type;
      //check this user id can access the

      Site.find({user: requestUserId}, '_id', function(err, sites){
        isRequestedSiteSuthorised = _.some( sites, function( el ) {
            console.log(el._id, siteId)
            return el._id + '' === siteId;
        });

        if (isRequestedSiteSuthorised){


            if (type === 'events'){
              Event.find({ siteId : siteId }, function(err, events){
                res.send(events);
              });
            } else if (type === 'segments'){
              Segment.find({ siteId : siteId }, function(err, segments){
                res.send(segments);
              });
            } else if (type === 'actions'){
              Action.find({ siteId : siteId })
              //.populate('segments')
              .exec(function(err, actions){
                res.send(actions);
              });
            } else if (type === 'hopups'){
              Hopup.find({ siteId : siteId })
              //.populate('segments')
              .exec(function(err, hopups){
                res.send(hopups);
              });
            } else if (type === 'sessiondata'){
      //        SessionData.find({ siteId : req.params.siteId })
              SessionData.find(req.query)
              //.populate('segments')
              .exec(function(err, sessiondata){
                res.send(sessiondata);
              });
            } else if (type === 'actionsessiondata'){
              ActionSessionData.find({ siteId : req.params.siteId })
              //.populate('segments')
              .exec(function(err, sessiondata){
                res.send(sessiondata);
              });
            }
        }


      });

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
      } else if (type === 'hopups'){
        Hopup.update(search, thing, { upsert: true }, function(err, hopup){
          res.send(hopup);
        });
      } else {
        res.send('nothing to do');
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
      } else if (type === 'hopups'){
        Hopup.find({ _id : id }).remove().exec(function(err, actions){
          res.send(actions);
        });
      }

});

module.exports = router;
