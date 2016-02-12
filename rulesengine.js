var Q = require('q');
var mongoose   = require('mongoose');

var Event = require('./models/event');
var Segment = require('./models/segment');
var Action = require('./models/action');
var SessionData = require('./models/sessiondata');
var SiteUser = require('./models/siteuser');
var UserSession = require('./models/usersession');
var Site = require('./models/site');

var ActionsGetter = require('./actionsGetter')

var rulesEngine = function () {
};

rulesEngine.prototype = {
  getClientActions : function(user){
    var self = this;
    var deferred = Q.defer();

    this.collectData(user).then(function(rulesEngineData){

      var actionsGetter = new ActionsGetter(rulesEngineData);
      actionsGetter.getActions().then(function(actions){

        self.updateClientSession(user, actions, rulesEngineData.userSession).then(function(){
          console.log('actions to return - ', actions);
          deferred.resolve(actions);
        });

      });

    });

    return deferred.promise;
  },
  collectData: function(user){
    var deferred = Q.defer();
    var sessionDataDeferred = Q.defer();
    var userSessionDeferred = Q.defer();
    var actionDeferred = Q.defer();

    SessionData
        .find({userId : user._id, siteId : user.siteId, sessionId: user.currentSessionId})
        .populate('event')
        .exec(function(err, sessionData){
            sessionDataDeferred.resolve(sessionData);
        });

    UserSession
        .findOne({_id: user.currentSessionId}, function(err, userSession){
          userSessionDeferred.resolve(userSession);
        });

    Action
        .find({siteId : user.siteId})
        .populate('segments')
        .populate('actionEvents')
        .exec(function(err, actions){
            actionDeferred.resolve(actions);
        });

    Q.all([sessionDataDeferred.promise, userSessionDeferred.promise, actionDeferred.promise]).then(function(result){
      deferred.resolve({
        sessionData: result[0],
        userSession: result[1],
        actions: result[2],
        user: user
      })
    })

    return deferred.promise;
  },
  updateClientSession: function(user, actions, userSession){
    var deferred = Q.defer();
    for (var i = 0; i < actions.length; i++){
      userSession.completedActions.push(actions[i]._id);
    }
    UserSession.update({_id: user.currentSessionId}, userSession, function(err, userSession){
      deferred.resolve();
    });
    return deferred.promise;
  }
};

module.exports = rulesEngine;
