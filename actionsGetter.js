var Q = require('q');

var actionsGetter = function (rulesEngineData) {
  this.actions = rulesEngineData.actions;
  this.sessionData = rulesEngineData.sessionData;
  this.currentUserSession = rulesEngineData.currentUserSession;
  this.userSession = rulesEngineData.userSession;
  this.hopups = rulesEngineData.hopups;
  this.user = rulesEngineData.user;
};

actionsGetter.prototype = {
  getHopupsToPerform: function(){
    var self = this;
    var deferred = Q.defer();
    this.checkActions().then(function(hopups){
      self.filterPerformedHopups(hopups).then(function(hopups){
        deferred.resolve(hopups);
      });
    });
    return deferred.promise;
  },
  checkActions: function(){
    var deferred = Q.defer();
    var self = this;

    var clientActions = [];
    var promises = [];

    //for (var i = 0; i < this.actions.length; i++){
    //  promises.push(this.checkAction(this.actions[i]))
    //}

    for (var i = 0; i < this.hopups.length; i++){
      promises.push(this.checkAction(this.hopups[i]))
    }

    Q.all(promises).then(function(hopups){
      deferred.resolve(hopups);
    });

    return deferred.promise;
  },
  checkAction: function(hopup){
    var deferred = Q.defer();
    var segmentCriteriaMet = [];
    var promises = [];

    for (var j = 0; j < hopup.segments.length; j++){
      promises.push(this.checkIfSegmentCriteriaMet(hopup.segments[j], this.user));
    }

    Q.all(promises).then(function(segmentCriteriaMet){
      if (segmentCriteriaMet.length > 0 && segmentCriteriaMet.indexOf(false) < 0){
        deferred.resolve(hopup);
      } else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  },
  checkIfSegmentCriteriaMet: function(segment, user){
    return Q(this.plugins[segment.listen](this.sessionData, segment, user));
  },
  filterPerformedHopups: function(hopups){
    var deferred = Q.defer();
    var userSession = this.currentUserSession;
    var clientHopups = [];

    for (var i = 0; i < hopups.length; i++){
      //we have to check for undefineds here
      if (hopups[i] && userSession.completedHopups.indexOf(hopups[i]._id) < 0){
          clientHopups.push(hopups[i]);
      }
    }

    deferred.resolve(clientHopups);
    return deferred.promise;
  },
  plugins : {
    interest: function(sessionData, segment, user){
      var deferred = Q.defer();
      var tags = {}

      for (var i = 0; i < sessionData.length; i++){
        //some session data events dont have tags - we need to properly devide thiese up - this for now
        if (sessionData[i].event){
          var tag = sessionData[i].event.tag;
          if (!tags[tag]){
            tags[tag] = 0;
          }
          tags[tag]++;
        }
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
    },
    sessions: function(){
      //check how many user sessions a user has to see if its over a threshold
    }
  }
};

module.exports = actionsGetter;
