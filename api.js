var express = require('express');
var router = express.Router();

var Datastore = require('nedb');
var siteUserDb = new Datastore({ filename: 'data/siteUser', autoload: true });
siteUserDb.persistence.setAutocompactionInterval(5);

var userSessionDb = new Datastore({ filename: 'data/userSession', autoload: true });

var eventsDb = new Datastore({ filename: 'data/events', autoload: true });
var segmentsDb = new Datastore({ filename: 'data/segments', autoload: true });
var actionsDb = new Datastore({ filename: 'data/actions', autoload: true });
var sessionDataDb = new Datastore({ filename: 'data/sessionData', autoload: true });
sessionDataDb.persistence.setAutocompactionInterval(5);


var UserManager = require('./usermanager');
var userManager = new UserManager(siteUserDb, userSessionDb);


var RulesEngine = require('./rulesengine');
var rulesEngine = new RulesEngine(eventsDb, segmentsDb, actionsDb, sessionDataDb, userSessionDb);

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
        var sessionData = {
          "type"      : dataItem.type,
          "datetime"  : new Date(),

          "userId"    : user._id,
          "sessionId" : user.currentSessionId,
          "siteId"    : siteId,
          "eventId"   : dataItem.event._id,

          "context"   : dataItem.context
        }
        //insert the entry in the session data table
        sessionDataDb.insert(sessionData);
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
