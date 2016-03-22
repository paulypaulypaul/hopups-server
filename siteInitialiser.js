var Q = require('q');
var mongoose   = require('mongoose');
var Event = require('./models/event');
var Segment = require('./models/segment');


var siteInitialiser = function(site){
}

siteInitialiser.prototype = {
  initSite : function(site){
    var self = this;
    var deferred = Q.defer();
    this.addEvents(site).then(function(site){
      self.addSegments(site).then(function(site){
        deferred.resolve(site);
      });
    });
    return deferred.promise;
  },
  _events : [{
        message : "eventfired",
        event : "eventfired",
        selector : "body",
        page : "*",
        name : "eventfired",
        tag : "eventfired",
        system : "true"
      },{
        message : "initialpageload",
        event : "initialpageload",
        selector : "body",
        page : "*",
        tag : "initialpageload",
        name : "initialpageload",
        system : "true"
  }],
  addEvents: function(site){
    var deferred = Q.defer();
    var promises = [];

    for (var i =0; i < this._events.length; i++ ){
      promises.push(this.addEvent(site, this._events[i]));
    }

    Q.allSettled(promises).then(function(){
      deferred.resolve(site);
    });

    return deferred.promise;
  },
  addEvent: function(site, event){
    var deferred = Q.defer();

    event.siteId = site._id;
    var newEvent = new Event(event);

    newEvent.save(function(err){
      deferred.resolve(site);
    })
    return deferred.promise;
  },
  _segments : [{
    name : "First Visit",
    listen : "visits",
    threshold : "1",
    operator : "eq",
    page : "*",
    system : "true"
  }],
  addSegments: function(site){
    var deferred = Q.defer();
    var promises = [];

    for (var i =0; i < this._segments.length; i++ ){
      promises.push(this.addSegment(site, this._segments[i]));
    }

    Q.allSettled(promises).then(function(){
      deferred.resolve(site);
    });

    return deferred.promise;
  },
  addSegment: function(site, segment){
    var deferred = Q.defer();

    segment.siteId = site._id;
    var newSegment = new Segment(segment);

    newSegment.save(function(err){
      deferred.resolve(site);
    })
    return deferred.promise;
  }
}

module.exports = siteInitialiser;
