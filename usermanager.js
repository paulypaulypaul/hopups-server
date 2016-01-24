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

    this.siteUserDb.findOne({_id : id, siteId: siteId}, function(err, user){
      if (!user){
        self.userSessionDb.insert({"completedActions":[]}, function(err, userSession){
          user = new User(null, siteId, userSession._id);
          deferred.resolve(user);
        })
      } else {
        deferred.resolve(user);
      }
    });

    return deferred.promise;
  },
  createNewUser: function(){

  },
  
};

module.exports = usermanager;
