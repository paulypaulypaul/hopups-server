var Q = require('q');
var logger = require('./lib/logger').create("HOPUPS MATCHER");

var comparisonOperators= {
  "gt": function(a,value) {
    return a > value;
  },
  "gte": function(a,value) {
    return a >= value;
  },
  "eq": function(a,value) {
    return a === value;
  },
  "in": function(a,value) {
    return value.indexOf(a) != -1;
  },
  "lt": function(a,value) {
    return a < value;
  },
  "lte": function(a,value) {
    return a <= value;
  },
  "matches": function(a,value) {
    return (""+a).match(value) != null;
  },
  "neq": function(a,value) {
    return !comparisonOperators.eq(a,value);
  }
};

var hopupsMatcher = function (user, site) {
  this.site = site;
  this.hopups = site.hopups;
  this.user = user;
};


hopupsMatcher.prototype = {
  getHopupsToPerform: function(){
    var self = this;
    var deferred = Q.defer();
    this.checkHopups(this.hopups, this.user).then(function(matchingHopups){
      self.filterPerformedHopups(matchingHopups, self.user).then(function(matchingAndFilteredHopups){
        logger.info('wtf', matchingAndFilteredHopups);
        deferred.resolve(matchingAndFilteredHopups);
      }).done();
    }).done();
    return deferred.promise;
  },
  checkHopups: function(hopups, user){
    logger.info('checkHopups', hopups.length);
    var deferred = Q.defer();
    var self = this;

    var clientActions = [];
    var promises = [];

    for (var i = 0; i < hopups.length; i++){
      if (hopups[i].active){
        promises.push(this.checkHopup(hopups[i], user))
      }
    }

    Q.all(promises).then(function(hopups){
      logger.info('checkHopups all resolved', hopups.length);
      deferred.resolve(hopups);
    }).done();

    return deferred.promise;
  },
  checkHopup: function(hopup, user){
    logger.info('checkHopup', hopup.segments);

    var deferred = Q.defer();
    var segmentCriteriaMet = [];
    var promises = [];

    for (var j = 0; j < hopup.segments.length; j++){
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

    var self = this;

    //this only checks the segment typeof
    //we need to also chack the page specified in the segment!!!!!!!!!!!!!
    var currentPath = user.currentSession.location;

    return this.pageMatch(currentPath, segment.page).then(function(matched){
      if (matched){
        logger.info('segment matched current path');
        return Q(self.plugins[segment.listen](segment, user));
      } else {
        logger.info('segment did not match current path');
        return Q(false);
      }
    });
  },
  pageMatch: function(pathname, page){
    logger.info('testing segment page match for', pathname, page);
    var deferred = Q.defer();
    var matched = false;

    if (page){

      if (page.charAt(0) == "/"){
        page = page.substr(1);
      }

      if (page == pathname || page == '*' ){
        matched = true;
      } else {
        var re = new RegExp(page)
        if (pathname.match(re)){
          matched = true;
        }
      }

    } else {
      matched = true;
    }

    deferred.resolve(matched);
    return deferred.promise;
  },
  filterPerformedHopups: function(matchingHopups, user){
    logger.info('filterPerformedHopups', matchingHopups.length);

    var deferred = Q.defer();
    var matchingAndFilteredHopups = [];

    for (var i = 0; i < matchingHopups.length; i++){
      //we have to check for undefineds here
      if (matchingHopups[i]){
        if (user.currentSession.completedHopups.indexOf(matchingHopups[i]._id) < 0 ){
          matchingAndFilteredHopups.push(matchingHopups[i]);
        } else if (matchingHopups[i].timesPerSession && matchingHopups[i].timesPerSession > 1){

          var filtered = user.currentSession.completedHopups.filter(function(it) {
            return it === matchingHopups[i]._id;
          });

          if (filtered.length < matchingHopups[i].timesPerSession){
            matchingAndFilteredHopups.push(matchingHopups[i]);
          }
        }
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
          logger.info('tag', user.sessionData[i].event.tag);

          var tag = user.sessionData[i].event.tag;
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

      var now = new Date();
      var lastActiveThreshold = now.getTime() - (segment.threshold * 1000);

      logger.info('user.lastActive < lastActiveThreshold', user.lastActive < lastActiveThreshold, user.lastActive, lastActiveThreshold);

      return Q(user.lastActive < lastActiveThreshold);
    },
    visits: function(segment, user){
        var op = comparisonOperators[segment.operator];
        return Q(op(user.usersessions.length, segment.threshold));
    },
    querystring: function(segment, user){
      if (user.currentSession.queryString && user.currentSession.queryString[segment.key]){
        var op = comparisonOperators[segment.operator];
        return Q(op(user.currentSession.queryString[segment.key], segment.value));
      }

      return Q(false);
    },
    clientvariable: function(segment, user){
      if (user.currentSession.clientVariable && user.currentSession.clientVariable[segment.key]){
        var op = comparisonOperators[segment.operator];
        return Q(op(user.currentSession.clientVariable[segment.key], segment.value));
      }
      return Q(false);
    }
  }
};

module.exports = hopupsMatcher;
