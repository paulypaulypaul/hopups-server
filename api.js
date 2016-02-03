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

//this is for assigning phone numbers - we still want to update even if no data is sent
//may merge in future
router.post('/syncuser', function(req, res) {
  var payloadUserId = req.body.userId || 'none';
  var siteId = req.body.siteId;

  userManager.findOrCreateUserById(payloadUserId, siteId).then(function(user){

    user.lastActive = new Date().getTime();

    siteUserDb.update({_id : user._id, siteId : siteId + ''}, user, { upsert: true, returnUpdatedDocs: true }, function(err, numUpdated, user){
      //force array at this point as new items are single but updated items come back in array
      user = [].concat(user)
      res.send(user[0]);
    });
  });

});

router.post('/data/', function(req, res) {
  var payloadUserId = req.body.userId || 'none';
  var siteId = req.body.siteId;

  //if we have a users update the last active time or create a user
  siteUserDb.findOne({_id : payloadUserId, siteId : siteId}, function(err, user){

      var sessionData = {
        "type":   req.body.type,
        "datetime": new Date(),

        "userId": user._id,
        "sessionId" : user.currentSessionId,
        "siteId": req.body.siteId,
        "eventId":  req.body.event._id,

        "context":req.body.context
      }

      //insert the entry in the session data table
      sessionDataDb.insert(sessionData);

      var dateTime = new Date().getTime();
      //update user last active to now
      user.lastActive = dateTime;

      siteUserDb.update({_id : user._id, siteId : siteId}, user, { upsert: true }, function(err, numUpdated){
          //res.send({'done': true});
      });

      //should we fire any events on the client
      rulesEngine.getClientActions(user._id, user.currentSessionId, siteId).then(function(events){
        res.send({'events': events});
      });
  });

});


module.exports = router;
