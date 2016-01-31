var Q = require('q');
var User = require('./user');

var usermanager = function (siteUserDb, userSessionDb) {
  this.siteUserDb = siteUserDb;
  this.userSessionDb = userSessionDb;
};

usermanager.prototype = {
  findOrCreateUserById: function(id, siteId){
    var self = this;
    var deferred = Q.defer();

    this.find(id, siteId).then(function(user){
      if (!user){
        self.createNewUser().then(function(user){
          deferred.resolve(user);
        })
      } else {
        //we have a user//now we check if the session is 'old' and create a new one if needed
        self.userSessionDb.findOne({_id: user.currentSessionId}, function(err, userSession){
          var nowMinusHour = new Date();
          nowMinusHour.setMinutes(nowMinusHour.getMinutes() + 60);

          if (!userSession.date || userSession.date > nowMinusHour){
              self.userSessionDb.insert({"completedActions":[], "date": new Date()}, function(err, userSession){
              user.currentSessionId = userSession._id;
              self.update(user).then(function(user){
                deferred.resolve(user);
              });
            });
          } else {
            deferred.resolve(user);
          }
        });
      }
    });
    return deferred.promise;
  },
  find: function(id, siteId){
    var deferred = Q.defer();
    this.siteUserDb.findOne({_id : id, siteId: siteId}, function(err, user){
      deferred.resolve(user);
    });
    return deferred.promise;
  },
  update: function(user){
    var deferred = Q.defer();
    this.siteUserDb.update({_id : user._id, siteId : user.siteId}, user, { upsert: true, returnUpdatedDocs: true }, function(err, numUpdated, user){
      //force array at this point as new items are single but updated items come back in array
      user = [].concat(user);
      deferred.resolve(user[0]);
    });
    return deferred.promise;
  },
  createNewUser: function(){
    var deferred = Q.defer();
    this.userSessionDb.insert({"completedActions":[], "date": new Date()}, function(err, userSession){
      user = new User(null, siteId, userSession._id);
      this.siteUserDb.insert(user, function(err, user){
        deferred.resolve(user);
      })
    });
    return deferred.promise;
  }

};

module.exports = usermanager;
