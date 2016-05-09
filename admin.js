var express = require('express');
var router = express.Router();
var fs = require('fs');
var Q = require('q');
var mongoose   = require('mongoose');
var Site = require('./models/site');
var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');
var Hopup = require('./models/hopup');
var SessionData = require('./models/sessiondata');
var ActionSessionData = require('./models/actionsessiondata');
var ActionSessionDataTimeSeries = require('./models/actionsessiondatatimeseries');
var UserSession = require('./models/usersession');
var SiteUser = require('./models/siteuser');


var verifyFacebookUserAccessToken = require('./verifyfacebookuseraccesstokens');
var SiteInitialiser = require('./siteInitialiser');
var siteInitialiser = new SiteInitialiser();

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
      var newSite = false;
      var site = req.body;
      site.user = req.user._id;

      if (!site._id){
        newSite = true;
        site._id = mongoose.Types.ObjectId();
      }

      var search = {
        _id : site._id
      }

      Site.findOneAndUpdate(search, site, { upsert: true, new: true }, function(err, site){
        if (newSite){
          siteInitialiser.initSite(site).then(function(site){
            res.send(site);
          });
        } else {
          res.send(site);
        }
      });

});

router.get('/sites/:siteId/:type', verifyFacebookUserAccessToken, function(req, res) {
      var requestUserId = req.user._id;
      var siteId = req.params.siteId;
      var type = req.params.type;
      //check this user id can access the

      Site.find({user: requestUserId}, '_id', function(err, sites){

        var isRequestedSitesAuthorised = _.some(sites, function( el ) {
            return el._id + '' === siteId;
        });

        if (isRequestedSitesAuthorised){

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
              var twoWeeksAgo = new Date();
              twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

              ActionSessionData.find({ siteId : req.params.siteId, date: { $gte :  twoWeeksAgo} })
              //.populate('segments')
              .exec(function(err, actionsessiondata){
                res.send(actionsessiondata);
              });
            } else if (type === 'actionsessiondatatimeseries'){
              ActionSessionDataTimeSeries.find({ siteId : req.params.siteId })
              //.populate('segments')
              .exec(function(err, actionsessiondatatimseries){
                res.send(actionsessiondatatimseries);
              });
            } else if (type === 'siteuser'){
              SiteUser.aggregate([
                { $match : { siteId : mongoose.Types.ObjectId(req.params.siteId) }},
                { $sort : { lastActive : -1 } },
                { $limit : 5 },
                { $lookup: {
                    from: 'usersessions',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'usersessions'
                  }
                },
                { $lookup: {
                    from: 'sessiondatas',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'sessiondata'
                  }
                },
                { $lookup: {
                    from: 'phonenumberallocations',
                    localField: 'currentPhoneNumberAllocation',
                    foreignField: '_id',
                    as: 'currentPhoneNumberAllocation'
                  }
                }
              ], function(err, siteuser){
                res.send(siteuser);
              });
              //SiteUser.find({ siteId : req.params.siteId })
              //.populate('segments')
              //.exec(function(err, siteuser){
            //    res.send(siteuser);
            //  });
            };

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
