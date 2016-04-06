var Q = require('q');
var mongoose   = require('mongoose');

var SiteUser = require('./models/siteuser');
var Site = require('./models/site');
var Hopup = require('./models/hopup');
var Action = require('./models/action');
var ActionSessionData = require('./models/actionsessiondata')
var ActionSessionDataTimeSeries = require('./models/actionsessiondatatimeseries');
var SessionData = require('./models/sessiondata');
var Event = require('./models/event');

var HopupsMatcher = require('./hopupsmatcher')

var logger = require('./lib/logger').create("RULES ENGINE");

var moment = require('moment');

var rulesEngine = function () {
};

rulesEngine.prototype = {
  getClientActions : function(user){
    var self = this;
    var deferred = Q.defer();

    this.populateUser(user).then(function(user){
      self.populateSite(user).then(function(site){
        logger.info('Populate site for', user._id, site._id);

          var hopupsMatcher = new HopupsMatcher(user, site);
          hopupsMatcher.getHopupsToPerform().then(function(hopupsToPerform){
            logger.info('hopups to perform', hopupsToPerform.length);

              var actions = []
              var promises = []

              if (hopupsToPerform.length > 0){
                for (var i = 0; i < hopupsToPerform.length; i++){
                  //hopups should always have a action otherwise no point but check here anyway
                  if (hopupsToPerform[i].actions.length > 0){
                    promises.push(self.getActionToPerform(hopupsToPerform[i], user));
                  }
                }
                Q.all(promises).then(function(actions){
                  deferred.resolve(actions);
                }).done();
              } else {
                deferred.resolve([]);
              }

            //mabee we should wait for this to be done before we return the actions above but hey
            self.updateClientSession(user, hopupsToPerform).then(function(){
            });

          });
      });
    });

    return deferred.promise;
  },
  getActionToPerform: function(hopup, user){
    var deferred = Q.defer();

    //if multiple actions on the hopup randomly choose which one to send - jus for now.
    var rand = Math.floor(Math.random() * hopup.actions.length);
    var actionId = hopup.actions[rand];

    //get populted action from id;
    this.populateAction(actionId).then(function(action){

      //removed this as i think we only need event son the actions
      //push hopups events to this action
      //action.events = action.events.concat(hopupsToPerform[i].events)

      //actions.push(action);

      var objToSave = {
        "datetime"  : new Date(),

        "userId"    : user._id,
        "sessionId" : user.currentSession,
        "siteId"    : user.siteId,
        "action"    : action._id,
        "hopup"     : hopup._id
      }

      var actionsessiondata = new ActionSessionData(objToSave);
      actionsessiondata.save(function(err, actionsessiondata) {
          if (err) return console.error(err);

          //yes this will only work for one hopup - just proving a concept
          action.payload = {};
          action.payload.actionsessiondata = actionsessiondata._id;
          action.payload.action = actionsessiondata.action;
          deferred.resolve(action);
      });


      //look for item that starts at the start of this min
      //if we find add record to it
      //else create a new one and add to it
      var timeSeriesStartMinute = moment().startOf('minute');
      var timeSeriesEndMinute = timeSeriesStartMinute.clone().add(1, 'm');

      ActionSessionDataTimeSeries.findOne({dateTime : {$gte: timeSeriesStartMinute.toDate(), $lt: timeSeriesEndMinute.toDate() }, siteId : mongoose.Types.ObjectId(user.siteId)} , function(err, actionSessionDataSchemaTimeSeries){
        if (actionSessionDataSchemaTimeSeries){
          actionSessionDataSchemaTimeSeries.data.push(objToSave);
        } else {
          actionSessionDataSchemaTimeSeries = new ActionSessionDataTimeSeries({
            siteId : user.siteId,
            dateTime: timeSeriesStartMinute,
            data: [objToSave]
          });
        }

        actionSessionDataSchemaTimeSeries.save(function(err, actionsessiondata) {
              if (err) return console.error(err);

              //yes we just do nothing at the moment -
              // will soon swapp this method with the one above and return the deferred when its deon
        });
      });
    });


    return deferred.promise;
  },
  populateUser: function(user){
    var deferred = Q.defer();
    SiteUser.aggregate([
      { $match : { _id : user._id }},
      { $lookup: {
          from: 'usersessions',
          localField: '_id',
          foreignField: 'user',
          as: 'usersessions'
        }
      },
      { $lookup: {
          from: 'sessiondatas',
          localField: '_id',
          foreignField: 'userId',
          as: 'sessionData'
        }
      },
      { $lookup: {
          from: 'phonenumberallocations',
          localField: 'currentPhoneNumberAllocation',
          foreignField: '_id',
          as: 'currentPhoneNumberAllocation'
        }
      }
    ], function(err, user){
      //returns 1 item array so use first item
      SiteUser.populate(user[0], {path:"currentSession"}, function(err, user) {
        SessionData.populate(user.sessionData, {path:"event"}, function(err, sessionData){
          user.sessionData = sessionData;
          deferred.resolve(user);
        });
      });
    });
    return deferred.promise;
  },
  populateAction: function(actionId){
    var deferred = Q.defer();
    Action.findOne({_id: actionId})
    .populate('events')
    .exec(function(err, action){
      deferred.resolve(action);
    });

    //commented out as the group part returns ana rray of arrays - cant find a way not to
    /*Action.aggregate([
      { $match : { _id : actionId }},
      { "$unwind": "$events" },
      { $lookup: {
          from: 'events',       //name of the mongo collection
          localField: 'events',
          foreignField: '_id',
          as: 'events'
        }
      },
      { "$group": {
        "_id": "$_id",
        "responsetype": { "$first": "$responsetype" },
        "responsedata": { "$first": "$responsedata" },
        "responsedatafrom": { "$first": "$responsedatafrom" },
        "responsedatalocation": { "$first": "$responsedatalocation" },
        "events": { "$addToSet": "$events" },
    }}
    ], function(err, action){
        deferred.resolve(action[0]);
    });*/

    return deferred.promise;
  },
  populateSite: function(user){
    var deferred = Q.defer();
    Site.aggregate([
      { $match : { _id : user.siteId }},
      { $lookup: {
          from: 'hopups',
          localField: '_id',
          foreignField: 'siteId',
          as: 'hopups'
        }
      }
    ], function(err, site){

      Hopup.populate(site[0].hopups, {path:"segments"}, function(err, hopups) {
        site[0].hopups = hopups;
        deferred.resolve(site[0]);
      });
    });
    return deferred.promise;
  },
  updateClientSession: function(user, hopups){
    var deferred = Q.defer();
    for (var i = 0; i < hopups.length; i++){
      user.currentSession.completedHopups.push(hopups[i]._id);
    }
    user.currentSession.save(function(currentSession){
      user.currentSession = currentSession;
      deferred.resolve();
    })
    return deferred.promise;
  }
};

module.exports = rulesEngine;
