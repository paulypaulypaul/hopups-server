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

var User = require('./models/user');

var request = require('request');

var Q = require('q');

var verifyFacebookUserAccessToken = function(req, res, next) {

  var token  = req.headers.authorization.split(' ')[1]


	var path = 'https://graph.facebook.com/me?access_token=' + token;
	request(path, function (error, response, body) {
		var data = JSON.parse(body);
		if (!error && response && response.statusCode && response.statusCode == 200) {
			var facebook_user = {
				facebookUserId: data.id,
				username: data.name,
				firstName: data.first_name,
				lastName: data.last_name,
				email: data.email
			};

      // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'facebook.email' :  facebook_user.email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                res.send(err);

            // check to see if theres already a user with that email
            if (user) {
                req.user = user;
                next();
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();
                newUser.facebook = facebook_user;

                // save the user
                newUser.save(function(err, user) {
                    if (err)
                        throw err;

                    req.user = user
                    next();
                });
            }

      });

      console.log('!!!!!!!!!!!!!!verify', facebook_user);



		}
		else {
			console.log(data.error);
			//console.log(response);
			//deferred.reject({code: response.statusCode, message: data.error.message});
		}
	});
}

router.get('/sites', verifyFacebookUserAccessToken,  function(req, res) {

      console.log('uuuuuuuuuuuussssssssser', req.user);

      Site.find({user: req.user._id}, function(err, sites){
        res.send(sites);
      });
});

router.post('/sites', verifyFacebookUserAccessToken, function(req, res) {
      var site = req.body;
      site.user = req.user._id;
      
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
      } else if (type === 'hopups'){
        Hopup.find({ siteId : req.params.siteId })
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
        Hopup.update(search, thing, { upsert: true }, function(err, action){
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
      } else if (type === 'hopups'){
        Hopup.find({ _id : id }).remove().exec(function(err, actions){
          res.send(actions);
        });
      }

});

module.exports = router;
