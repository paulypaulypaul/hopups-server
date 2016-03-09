var Q = require('q');
var mongoose   = require('mongoose');

var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');
var SessionData = require('./models/sessiondata');
var SiteUser = require('./models/siteuser');
var UserSession = require('./models/usersession');
var Site = require('./models/site');
var Hopup = require('./models/hopup');
var ActionSessionData = require('./models/actionsessiondata')

var ActionsGetter = require('./actionsgetter')

var logger = require('./lib/logger').create("RULES ENGINE");

var rulesEngine = function () {
};

rulesEngine.prototype = {
  getClientActions : function(user){
    var self = this;
    var deferred = Q.defer();

    this.collectData(user).then(function(rulesEngineData){

      var actionsGetter = new ActionsGetter(rulesEngineData);
      actionsGetter.getHopupsToPerform().then(function(hopups){
        console.log('hopups to return first - ', hopups);
        self.updateClientSession(user, hopups, rulesEngineData.currentUserSession).then(function(){
          console.log('hopups to return - ', hopups);


          var actions = []
          //if multiple actions on the hopup randomly choose which one to send
          if (hopups.length > 0){
            for (var i = 0; i < hopups.length; i++){
              if (hopups[i].actions.length > 0){
                var rand = Math.floor(Math.random() * hopups[i].actions.length);
                var action = hopups[i].actions[rand];
                actions.push(action);

                var actionsessiondata = new ActionSessionData({
                  "datetime"  : new Date(),

                  "userId"    : user._id,
                  "sessionId" : user.currentSessionId,
                  "siteId"    : user.siteId,
                  "action"    : action._id,
                  "hopup"     : hopups[i]._id
                });

                actionsessiondata.save(function(err, actionsessiondata) {
                    if (err) return console.error(err);

                    //yes this will only work for one action - just proving a concept
                    action.payload.actionsessiondata = actionsessiondata._id;
                    action.payload.action = actionsessiondata.action;
                      deferred.resolve(actions);
                });

//                deferred.resolve(actions);

              }
            }
          } else {
            deferred.resolve([]);
          }

        });

      });

    });

    return deferred.promise;
  },
  collectData: function(user){
    var deferred = Q.defer();
    var sessionDataDeferred = Q.defer();
    var segmentDeferred = Q.defer();
    var currentUserSessionDeferred = Q.defer();
    var userSessionDeferred = Q.defer();
    var actionDeferred = Q.defer();
    var hopupsDeferred = Q.defer();

    SessionData
        .find({userId : user._id, siteId : user.siteId, sessionId: user.currentSessionId})
        .populate('event')
        .exec(function(err, sessionData){
            sessionDataDeferred.resolve(sessionData);
        });

    Segment
        .find({siteId : user.siteId})
        .exec(function(err, segments){
            segmentDeferred.resolve(segments);
        });

    UserSession
        .find({user: user._id}, function(err, userSession){
          var currentUserSession;

          for (var i =0; i < userSession.length; i++){
            if (userSession[i]._id.equals(user.currentSessionId)){
              currentUserSession = userSession[i];
            }
          }

          currentUserSessionDeferred.resolve(currentUserSession);
          userSessionDeferred.resolve(userSession);
        });

    Action
        .find({siteId : user.siteId})
        .populate('segments')
        .populate('actionEvents')
        .exec(function(err, actions){
            actionDeferred.resolve(actions);
        });

    Hopup
        .find({siteId : user.siteId})
        .populate('segments')
        .populate('actions')
        .exec(function(err, hopups){
            hopupsDeferred.resolve(hopups);
        });


    Q.all([sessionDataDeferred.promise, segmentDeferred.promise, currentUserSessionDeferred.promise, userSessionDeferred.promise, actionDeferred.promise, hopupsDeferred.promise]).then(function(result){
      logger.info('collectData', {
        sessionData: result[0],
        segments: result[1],
        currentUserSession: result[2],
        userSession: result[3],
        actions: result[4],
        hopups: result[5],
        user: user
      });
      deferred.resolve({
        sessionData: result[0],
        segments: result[1],
        currentUserSession: result[2],
        userSession: result[3],
        actions: result[4],
        hopups: result[5],
        user: user
      })
    })

    return deferred.promise;
  },
  updateClientSession: function(user, hopups, currentUserSession){

    var deferred = Q.defer();
    for (var i = 0; i < hopups.length; i++){
      currentUserSession.completedHopups.push(hopups[i]._id);
    }
    UserSession.update({_id: user.currentSessionId}, currentUserSession, function(err, userSession){
      deferred.resolve();
    });
    return deferred.promise;
  }
};

module.exports = rulesEngine;
