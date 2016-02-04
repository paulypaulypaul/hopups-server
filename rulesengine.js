var Q = require('q');

var rulesEngine = function (eventsDb, segmentsDb, actionsDb, sessionDataDb, userSessionDb) {
  this.eventsDb = eventsDb;
  this.segmentsDb = segmentsDb;
  this.actionsDb = actionsDb;
  this.sessionDataDb = sessionDataDb;
  this.userSessionDb = userSessionDb;
};

rulesEngine.prototype = {
  getClientActions : function(user){
    var self = this;

    var deferred = Q.defer();

    this.getSessionData(user).then(function(sessionData){

      //console.log('session data', sessionData);

      self.userSessionDb.findOne({_id: user.currentSessionId}, function(err, userSession){

        if (!userSession){
          //console.log('no user sessions');
        } else {
          //console.log('userSession', userSession);
        }

        self.getActions(user.siteId).then(function(actions){

            console.log('actions', actions);

            var clientActions = [];
            for (var i = 0; i < actions.length; i++){

              var segmentCriteriaMet = [];
              for (var j = 0; j < actions[i].segments.length; j++){
                segmentCriteriaMet.push(self.segmentCriteriaMet(actions[i].segments[j], sessionData, user));
              }

              //console.log('segmentCriteriaMet', segmentCriteriaMet, segmentCriteriaMet.indexOf(false), segmentCriteriaMet.indexOf(false) < 0 )

              if (segmentCriteriaMet.indexOf(false) < 0){

                //check if action has been performed for this session.
                //console.log('yo', userSession);

                if (userSession && userSession.completedActions.indexOf(actions[i]._id) < 0){
                  userSession.completedActions.push(actions[i]._id);
                  clientActions.push(actions[i]);
                }

              }

            }

            console.log('clientActions', clientActions);

            self.userSessionDb.update({_id: user.currentSessionId}, userSession, function(err, userSession){
              deferred.resolve(clientActions);
            });

        });
      });
    });
    return deferred.promise;
  },
  segmentCriteriaMet: function(segment, sessionData, user){
    var tags = {}

    for (var i = 0; i < sessionData.length; i++){
      var tag = sessionData[i].event.tag;
      if (!tags[tag]){
        tags[tag] = 0;
      }
      tags[tag]++;
    }
    console.log(tags);

    //interest type looks at a tag property
    if (segment.listen == 'interest'){
      return tags[segment.tag] >= segment.threshold;
    } else if  (segment.listen == 'inactive'){

      var now = new Date()
      var lastActiveThreshold = now.setSeconds(now.getSeconds() - segment.threshold);

      console.log('user.lastActive < lastActiveThreshold', user.lastActive, lastActiveThreshold, user.lastActive < lastActiveThreshold)
      return user.lastActive < lastActiveThreshold;
    }

  },
  getSessionData : function(user){
    var self = this;
    var deferred = Q.defer();
    //get the session data for the user and siteId
    this.sessionDataDb.find({userId : user._id, siteId : user.siteId, sessionId: user.currentSessionId}, function(err, sessionData){
      //console.log('sessionData', sessionData)
      var eventIds = [];
      for (var i = 0; i < sessionData.length; i++){
        if (eventIds.indexOf(sessionData[i].eventId) < 0){
          eventIds.push(sessionData[i].eventId);
        }
      }

      self.eventsDb.find({_id : { $in: eventIds }}, function(err, events){

        // console.log('events', events);
        for (var i = 0; i < sessionData.length; i++){
          var eventId = sessionData[i].eventId;
          for (var j = 0; j < events.length; j++){
            if (eventId === events[j]._id){
              //we add a new proprty to the sesion data item here so we have the event details.
              sessionData[i].event = events[j];
            }
          }
        }

        deferred.resolve(sessionData);

      });

    });
    return deferred.promise;
  },

  //This method is only used as we havn't got a relation data store yet
  getActions : function(siteId){
    var self = this;
    var deferred = Q.defer();

    //get the session data for the user and siteId
    this.actionsDb.find({siteId : siteId, active: true}, function(err, actions){

      //get a list of segment ids we need from the actions
      var promises = [];
      var segmentIds = [];
      for (var i = 0; i < actions.length; i++){
        promises.push(self.replaceActionSegmentIdsWithSegments(actions[i]));
      }

      Q.all(promises).then(function(actions){

        var promises = [];
        for (var i = 0; i < actions.length; i++){
          promises.push(self.replaceActionEventIdsWithEvents(actions[i]));
        }

        Q.all(promises).then(function(actions){
          //console.log('actions to return : ', actions);
          deferred.resolve(actions);
        });

      });

    });
    return deferred.promise;
  },
  replaceActionSegmentIdsWithSegments : function(action){
    var deferred = Q.defer();
    this.segmentsDb.find({_id : { $in: action.segments }}, function(err, segments){
      //replace he segment ids array with the proper segment object
      action.segments = segments;
      deferred.resolve(action);
    });
    return deferred.promise;
  },
  replaceActionEventIdsWithEvents : function(action){
    var deferred = Q.defer();
    this.eventsDb.find({_id : { $in: action.actionEvents }}, function(err, events){
      //replace he segment ids array with the proper segment object
      action.actionEvents = events;
      deferred.resolve(action);
    });
    return deferred.promise;
  },
};

module.exports = rulesEngine;
