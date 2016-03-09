var Q = require('q');
var User = require('./user');
var SiteUser = require('./models/siteuser');
var UserSession = require('./models/usersession');

var usermanager = function () {
};

usermanager.prototype = {
  findOrCreateUserById: function(id, siteId){
    var self = this;
    var deferred = Q.defer();

    this.findUser(id, siteId).then(function(user){
      if (!user){
        self.createNewUser(siteId).then(function(user){
          deferred.resolve(user);
        });
      } else {
        //we have a user
        //now we check if the session is 'old' and create a new one if needed
        UserSession.findOne({_id: user.currentSessionId}, function(err, userSession){
          //hard coded hour session - obs parametise
          var nowMinusHour = new Date();
          nowMinusHour.setMinutes(nowMinusHour.getMinutes() - 1);

          if (!userSession || !userSession.date || userSession.date < nowMinusHour) {
            var userSession = self.userSessionDb();
            userSession.user = user._id;
            userSession.save(function(err, userSession) {
              user.currentSessionId = userSession._id;

              user.save(function(err, user) {
                  if (err) return console.error(err);
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
  findUser: function(id, siteId){
    var deferred = Q.defer();
    SiteUser.findOne({_id : id, siteId: siteId}, function(err, user){
      deferred.resolve(user);
    });
    return deferred.promise;
  },
  update: function(user){
    var deferred = Q.defer();
    SiteUser.update({_id : user._id, siteId : user.siteId}, user, { upsert: true }, function(err, numUpdated, user){
      //force array at this point as new items are single but updated items come back in array
      user = [].concat(user);
      deferred.resolve(user[0]);
    });
    return deferred.promise;
  },
  createNewUser: function(siteId){
    var self = this;
    var deferred = Q.defer();

    var userSession = new UserSession()

    userSession.save(function(err, userSession) {
      if (err) return console.error(err);

      var user = new self.siteUserDb({
        siteId : siteId,
        currentSessionId: userSession._id
      });

      user.save(function(err, user) {
          if (err) return console.error(err);

          deferred.resolve(user);

      });

    });
                                                                 // Number Families - By Georgina Harland.
    return deferred.promise;                                     //  3 + 6 = 9    6 + 3 = 9
  },
  resetLastActive: function(user){                              //   9 - 3 = 6   9 - 6 = 3
    var deferred = Q.defer();

    user.lastActive = new Date().getTime();

    user.save(function(err, user) {
      deferred.resolve(user);
    });

    return deferred.promise;
  }

};

module.exports = usermanager;
