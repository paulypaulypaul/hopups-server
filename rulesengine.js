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

var ActionsGetter = require('./actionsgetters')

var logger = require('./lib/logger').create("RULES ENGINE");

var rulesEngine = function () {
};

rulesEngine.prototype = {
  getClientActions : function(user){
    var self = this;
    var deferred = Q.defer();

    this.populateUser(user).then(function(user){
      self.populateSite(user).then(function(site){
          var actionsGetter = new ActionsGetter(user, site);
          actionsGetter.getHopupsToPerform().then(function(hopupsToPerform){
            logger.info('hopups to perform', hopupsToPerform.length);

              var actions = []
              //if multiple actions on the hopup randomly choose which one to send - jus for now.
              if (hopupsToPerform.length > 0){
                for (var i = 0; i < hopupsToPerform.length; i++){
                  if (hopupsToPerform[i].actions.length > 0){
                    var rand = Math.floor(Math.random() * hopupsToPerform[i].actions.length);
                    var action = hopupsToPerform[i].actions[rand];
                    actions.push(action);

                    var actionsessiondata = new ActionSessionData({
                      "datetime"  : new Date(),

                      "userId"    : user._id,
                      "sessionId" : user.currentSession,
                      "siteId"    : user.siteId,
                      "action"    : action._id,
                      "hopup"     : hopupsToPerform[i]._id
                    });

                    actionsessiondata.save(function(err, actionsessiondata) {
                        if (err) return console.error(err);

                        //yes this will only work for one hopup - just proving a concept
                        action.payload.actionsessiondata = actionsessiondata._id;
                        action.payload.action = actionsessiondata.action;
                          deferred.resolve(actions);
                    });
                  }
                }
              } else {
                deferred.resolve([]);
              }

            self.updateClientSession(user, hopupsToPerform).then(function(){
            });

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
          as: 'sessiondata'
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
        deferred.resolve(user);
      });
    });
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

        Hopup.populate(site[0].hopups, {path:"actions"}, function(err, hopups) {
          site[0].hopups = hopups;
          deferred.resolve(site[0]);
        });
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
