var Q = require('q');
var logger = require('./lib/logger').create("ACTIONS GETTER");

var actionsGetter = function (user, site) {
  this.site = site;
  this.hopups = site.hopups;

  this.user = user;
};

actionsGetter.prototype = {
  getHopupsToPerform: function(){
    var self = this;
    var deferred = Q.defer();
    this.checkHopups(this.hopups, this.user).then(function(matchingHopups){
      self.filterPerformedHopups(matchingHopups, self.user).then(function(matchingAndFilteredHopups){
        deferred.resolve(matchingAndFilteredHopups);
      });
    });
    return deferred.promise;
  },
  checkHopups: function(hopups, user){
    logger.info('checkHopups', hopups.length);
    var deferred = Q.defer();
    var self = this;

    var clientActions = [];
    var promises = [];

    for (var i = 0; i < hopups.length; i++){
      promises.push(this.checkHopup(hopups[i], user))
    }

    Q.all(promises).then(function(hopups){
      logger.info('checkHopups all resolved', hopups.length);
      deferred.resolve(hopups);
    });

    return deferred.promise;
  },
  checkHopup: function(hopup, user){
    logger.info('checkHopup', hopup.segments);

    var deferred = Q.defer();
    var segmentCriteriaMet = [];
    var promises = [];

    for (var j = 0; j < hopup.segments.length; j++){
      console.log('pooooooo')
      promises.push(this.checkIfSegmentCriteriaMet(hopup.segments[j], user));
    }

    Q.all(promises).then(function(segmentCriteriaMet){
      logger.info('checkHopup all resolved', segmentCriteriaMet);
      if (segmentCriteriaMet.length > 0 && segmentCriteriaMet.indexOf(false) < 0){
        deferred.resolve(hopup);
      } else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  },
  checkIfSegmentCriteriaMet: function(segment, user){
    logger.info('check if segment criteria met', segment.listen);
    return Q(this.plugins[segment.listen](segment, user));
  },
  filterPerformedHopups: function(matchingHopups, user){
    logger.info('filterPerformedHopups', matchingHopups.length);

    var deferred = Q.defer();
    var matchingAndFilteredHopups = [];

    for (var i = 0; i < matchingHopups.length; i++){
      //we have to check for undefineds here
      if (matchingHopups[i] && user.currentSession.completedHopups.indexOf(matchingHopups[i]._id) < 0){
          matchingAndFilteredHopups.push(matchingHopups[i]);
      }
    }

    logger.info('filterPerformedHopups returning', matchingAndFilteredHopups.length);

    deferred.resolve(matchingAndFilteredHopups);
    return deferred.promise;
  },





  plugins : {
    interest: function(segment, user){
      var deferred = Q.defer();
      var tags = {}

      logger.info('Interest plugin fired');

      //need to add single session support - we calc for all sessions
      //single sesison would only look at the current session datas.

      for (var i = 0; i < user.sessionData.length; i++){
        //some session data events dont have tags - we need to properly divide thiese up - this for now
        if (user.sessionData[i].event){
          var tag = user.sessionData[i].event.tag;
          logger.info('tag', user.sessionData[i]);
          if (!tags[tag]){
            tags[tag] = 0;
          }
          tags[tag]++;
        }
      }

      logger.info('Interest plugin testing', tags[segment.tag], segment.threshold);

      deferred.resolve(tags[segment.tag] >= segment.threshold);
      return deferred.promise;
    },
    inactive: function(segment, user){
      var now = new Date()
      var lastActiveThreshold = now.setSeconds(now.getSeconds() - segment.threshold);

      console.log('user.lastActive < lastActiveThreshold', user.lastActive < lastActiveThreshold);

      return Q(user.lastActive < lastActiveThreshold);
    },
    visits: function(segment, user){
      if (user.usersessions.length === Number(segment.threshold)){
        return Q(true);
      }
      return Q(false);
    },
    querystring: function(segment, user){
      if (user.currentSession.queryString && user.currentSession.queryString[segment.key] ){
        if (user.currentSession.queryString[segment.key] == segment.value){
          return Q(true);
        }
      }
      return Q(false);
    },
    clientvariable: function(segment, user){
      if (user.currentSession.clientVariable && user.currentSession.clientVariable[segment.key] ){
        if (user.currentSession.clientVariable[segment.key] == segment.value){
          return Q(true);
        }
      }
      return Q(false);
    }
  }
};

module.exports = actionsGetter;
