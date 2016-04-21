var express = require('express');
var router = express.Router();

var SessionData = require('./models/sessiondata');

var UserManager = require('./usermanager');
var userManager = new UserManager();

var RulesEngine = require('./rulesengine');
var rulesEngine = new RulesEngine();

var PhoneNumberAllocator = require('./phonenumberallocator');
var phoneNumberAllocator = new PhoneNumberAllocator();

var logger = require('./lib/logger').create("API");

router.post('/sync', function(req, res) {

  //IF GOOGLE BOT OR OTHERS DO NOTHING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  logger.info('syncing');
  var payloadUserId = req.body.userId || 'none';
  var siteId = req.body.siteId;
  var dataQ = req.body.dataQ;
  var queryString = req.body.queryString;
  var clientVariable = req.body.clientVariable;
  var location = req.body.location;
  var InitialPageView = req.body.InitialPageView;

  logger.info('findOrCreateUserById');
  userManager.findOrCreateUserById(payloadUserId, siteId).then(function(user){

    logger.info('addQueryStringToUserSession');
    userManager.addQueryStringToUserSession(user, queryString).then(function(user){

      logger.info('addClientVariableToUserSession');
      userManager.addClientVariableToUserSession(user, clientVariable).then(function(user){

        logger.info('addLocationToUserSession');
        userManager.addLocationToUserSession(user, location).then(function(user){

          logger.info('allocatePhoneNumber');
          phoneNumberAllocator.allocatePhoneNumber(user).then(function(user){

            for (var i = 0 ; i < dataQ.length; i++){
              var dataItem = dataQ[i];

              sessionData = new SessionData({
                "type"      : dataItem.type,
                "datetime"  : new Date(),

                "userId"    : user._id,
                "sessionId" : user.currentSession.id,
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

            if (dataQ.length > 0 || InitialPageView){
              logger.info('Have data q to deal with');
              //user has acted to set last action to now
              userManager.resetLastActive(user).then(function(){
                //should we fire any events on the client
                sendResponce(user);
              });
            } else {
              logger.info('Have NO data q to deal with');

              //we still check if we should fire events on the client
              //as some events are not prompted by user actions but, for instance, by lack of user action - inactive action.
              //should we fire without any events from the client
              sendResponce(user);
            }
          });
        });
      });
    });
  });
});




module.exports = router;
