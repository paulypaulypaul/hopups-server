var express = require('express');
var router = express.Router();

var mongoose   = require('mongoose');
var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');
var SessionData = require('./models/sessiondata');
var SiteUser = require('./models/siteuser');
var UserSession = require('./models/usersession');

var UserManager = require('./usermanager');
var userManager = new UserManager(SiteUser, UserSession);

var RulesEngine = require('./rulesengine');
var rulesEngine = new RulesEngine();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

router.post('/syncuser', function(req, res) {
  var payloadUserId = req.body.userId || 'none';
  var siteId = req.body.siteId;
  var dataQ = req.body.dataQ;

  userManager.findOrCreateUserById(payloadUserId, siteId).then(function(user){

      console.log(user);

      for (var i = 0 ; i < dataQ.length; i++){
        var dataItem = dataQ[i];

        sessionData = new SessionData({
          "type"      : dataItem.type,
          "datetime"  : new Date(),

          "userId"    : user._id,
          "sessionId" : user.currentSessionId,
          "siteId"    : siteId,
          "event"   : dataItem.event._id,

          "context"   : dataItem.context
        });

        //insert the entry in the session data table
        sessionData.save(function(err, sessionData) {
            if (err) return console.error(err);
        });

      }

      if (dataQ.length > 0){
        //user has acted to set last action to now
        userManager.resetLastActive(user).then(function(){

          //should we fire any events on the client
          rulesEngine.getClientActions(user).then(function(events){
            res.send({
              'user': user,
              'events': events
            });
          });

        });


      } else {
        //we still check if we should fire events on the client
        //as some events are not prompted by user actions but, for instance, by lack of user action - inactive action.
        //should we fire any events on the client
        rulesEngine.getClientActions(user).then(function(events){
          res.send({
            'user': user,
            'events': events
          });
        });
      }
  });
});

module.exports = router;
