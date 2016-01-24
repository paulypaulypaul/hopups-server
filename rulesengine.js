var Q = require('q');

var rulesEngine = function (eventsDb, segmentsDb, actionsDb, sessionDataDb, userSessionDb) {
  this.eventsDb = eventsDb;
  this.segmentsDb = segmentsDb;
  this.actionsDb = actionsDb;
  this.sessionDataDb = sessionDataDb;
  this.userSessionDb = userSessionDb;
};

rulesEngine.prototype = {
  getClientActions : function(userId, sessionId, siteId){
    var self = this;
    var deferred = Q.defer();

    this.getSessionData(userId, siteId, sessionId).then(function(sessionData){

      self.userSessionDb.findOne({_id: sessionId}, function(err, userSession){

        self.getActions(siteId).then(function(actions){
            var clientActions = [];
            for (var i = 0; i < actions.length; i++){
              var segmentCriteriaMet = [];
              for (var j = 0; j < actions[i].segments.length; j++){
                segmentCriteriaMet.push(self.segmentCriteriaMet(actions[i].segments[j], sessionData));
              }

              if (segmentCriteriaMet.indexOf(false) < 0){

                //check if action has been performed for this session.
                console.log(userSession, userSession.completedActions, actions[i]._id);

                if (userSession.completedActions.indexOf(actions[i]._id) < 0){
                  userSession.completedActions.push(actions[i]._id);
                  clientActions.push(actions[i]);
                }

              }
            }

            self.userSessionDb.update({_id: sessionId}, userSession, function(err, userSession){
              deferred.resolve(clientActions);
            });

        });
      });
    });
    return deferred.promise;
  },
  segmentCriteriaMet: function(segment, sessionData){
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
      //test if user has been inactive over the threshold
      return true;
    }

  },
  getSessionData : function(userId, siteId, sessionId){
    var self = this;
    var deferred = Q.defer();
    //get the session data for the user and siteId
    this.sessionDataDb.find({userId : userId, siteId : siteId, sessionId: sessionId}, function(err, sessionData){

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
    this.actionsDb.find({siteId : siteId}, function(err, actions){

      //console.log('actionEntries', actionEntries);

      //get a list of segment ids we need from the actions
      var segmentIds = [];
      for (var i = 0; i < actions.length; i++){
        for (var j = 0; j < actions[i].segments.length; j++){
          if (segmentIds.indexOf(actions[i].segments[j]) < 0){
            segmentIds.push(actions[i].segments[j]);
          }
        }
      }

      //console.log('segmentIds', segmentIds);

      self.segmentsDb.find({_id : { $in: segmentIds }}, function(err, segments){

        for (var i = 0; i < actions.length; i++){
          for (var j = 0; j < actions[i].segments.length; j++){
            var segmentId = actions[i].segments[j];
            for (var k = 0; k < segments.length; k++){
              if (segmentId === segments[k]._id){
                actions[i].segments[j] = segments[k]
              }
            }
          }
        }

        deferred.resolve(actions);

      });

    });
    return deferred.promise;
  }
};

module.exports = rulesEngine;
