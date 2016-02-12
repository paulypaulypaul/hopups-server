var Q = require('q');

var actionsGetter = function (rulesEngineData) {
  this.actions = rulesEngineData.actions;
  this.sessionData = rulesEngineData.sessionData;
  this.userSession = rulesEngineData.userSession;
  this.user = rulesEngineData.user;
};

actionsGetter.prototype = {
  getActions: function(){
    var self = this;
    var deferred = Q.defer();
    this.checkActions().then(function(actions){
      self.filterPerformedActions(actions).then(function(actions){
        deferred.resolve(actions);
      });
    });
    return deferred.promise;
  },
  checkActions: function(){
    var deferred = Q.defer();
    var self = this;

    var clientActions = [];
    var promises = [];

    for (var i = 0; i < this.actions.length; i++){
      promises.push(this.checkAction(this.actions[i]))
    }

    Q.all(promises).then(function(actions){
      deferred.resolve(actions);
    });

    return deferred.promise;
  },
  checkAction: function(action){
    var deferred = Q.defer();
    var segmentCriteriaMet = [];
    var promises = [];

    for (var j = 0; j < action.segments.length; j++){
      promises.push(this.checkIfSegmentCriteriaMet(action.segments[j], this.user));
    }

    Q.all(promises).then(function(segmentCriteriaMet){
      if (segmentCriteriaMet.length > 0 && segmentCriteriaMet.indexOf(false) < 0){
        deferred.resolve(action);
      } else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  },
  checkIfSegmentCriteriaMet: function(segment, user){
    return Q(this.plugins[segment.listen](this.sessionData, segment, user));
  },
  filterPerformedActions: function(actions){
    var deferred = Q.defer();
    var userSession = this.userSession;
    var clientActions = [];

    for (var i = 0; i < actions.length; i++){
      //we have to check for undefineds here
      if (actions[i] && userSession.completedActions.indexOf(actions[i]._id) < 0){
          clientActions.push(actions[i]);
      }
    }

    deferred.resolve(clientActions);
    return deferred.promise;
  },
  plugins : {
    interest: function(sessionData, segment, user){
      var deferred = Q.defer();
      var tags = {}

      for (var i = 0; i < sessionData.length; i++){
        var tag = sessionData[i].event.tag;
        if (!tags[tag]){
          tags[tag] = 0;
        }
        tags[tag]++;
      }

      console.log(tags);

      deferred.resolve(tags[segment.tag] >= segment.threshold);
      return deferred.promise;
    },
    inactive: function(sessionData, segment, user){
      var now = new Date()
      var lastActiveThreshold = now.setSeconds(now.getSeconds() - segment.threshold);

      console.log('user.lastActive < lastActiveThreshold', user.lastActive < lastActiveThreshold);

      return Q(user.lastActive < lastActiveThreshold);
    }
  }
};

module.exports = actionsGetter;
