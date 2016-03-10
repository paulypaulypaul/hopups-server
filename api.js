var express = require('express');
var router = express.Router();

var mongoose   = require('mongoose');
var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');
var SessionData = require('./models/sessiondata');

var UserManager = require('./usermanager');
var userManager = new UserManager();

var RulesEngine = require('./rulesengine');
var rulesEngine = new RulesEngine();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

router.post('/sync', function(req, res) {
  var payloadUserId = req.body.userId || 'none';
  var siteId = req.body.siteId;
  var dataQ = req.body.dataQ;

  userManager.findOrCreateUserById(payloadUserId, siteId).then(function(user){
    userManager.allocatePhoneNumber(user).then(function(user){

      for (var i = 0 ; i < dataQ.length; i++){
        var dataItem = dataQ[i];

        sessionData = new SessionData({
          "type"      : dataItem.type,
          "datetime"  : new Date(),

          "userId"    : user._id,
          "sessionId" : user.currentSessionId,
          "siteId"    : siteId,

          "context"   : dataItem.context
        });

        if (dataItem.event && dataItem.event._id){
          sessionData.event = dataItem.event._id;
        }

        //insert the entry in the session data table
        sessionData.save(function(err, sessionData) {
            if (err) return console.error(err);
        });

      }

      var sendResponce = function(user){
        rulesEngine.getClientActions(user).then(function(actions){
          res.send({
            'user': user,
            'actions': actions
          });
        });
      }

      if (dataQ.length > 0){
        //user has acted to set last action to now
        userManager.resetLastActive(user).then(function(){
          //should we fire any events on the client
          sendResponce(user);
        });
      } else {
        //we still check if we should fire events on the client
        //as some events are not prompted by user actions but, for instance, by lack of user action - inactive action.
        //should we fire without any events from the client
        sendResponce(user);
      }

    });
  });
});




module.exports = router;
