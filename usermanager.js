var Q = require('q');

var User = require('./user');
var SiteUser = require('./models/siteuser');
var Site = require('./models/site');
var UserSession = require('./models/usersession');

var logger = require('./lib/logger').create("USER MANAGER");

var usermanager = function () {
};

usermanager.prototype = {
  allocatePhoneNumber: function(user){
    var self = this;
    var deferred = Q.defer();

      //if the record is not really there when we try to populate it will be null
      SiteUser.populate(user, {path: 'currentPhoneNumberAllocation'}, function(err, user){

        //give the user a phone number if they do not have one
        if (!user.currentPhoneNumberAllocation || user.currentPhoneNumberAllocation.archive){

          Site.findOne({_id: user.siteId}).then(function(site){

            var numberToAllocate =  self.getNextPhoneNumber(site);

            logger.info('numberToAllocate', numberToAllocate);

            if (numberToAllocate){
              site.allocatedPhoneNumbers.push(numberToAllocate);
              site.save(function(err, site){

                phoneNumberAllocation = new PhoneNumberAllocation({
                  user : user._id,
                  phoneNumber : numberToAllocate
                });

                phoneNumberAllocation.save(function(err, item){
                  user.currentPhoneNumberAllocation = item;
                  user.save(function(err, user){
                    SiteUser.populate(user, {path: 'currentPhoneNumberAllocation'}, function(err, user){

                      //this is populated to return to the browser - should Really
                      //define view and server models
                      user._doc.phoneNo = user.currentPhoneNumberAllocation.phoneNumber
                      deferred.resolve(user);
                    });
                  });
                });
              });
            } else {
                logger.info('no number to allocate return user');
                deferred.resolve(user);
            }

          });


        } else {

          //one minute after last updates we expire.
          //this param should be clever and adapt to number of phone number and users
          var updated_expiry_time = moment(user.currentPhoneNumberAllocation.lastUpdated).add(1, 'm');

          //if (updated_expiry_time < moment()){
          //  user.currentPhoneNumberAllocation.lastUpdated = moment();
          //  user.currentPhoneNumberAllocation.save();
          //}

          //this is populated to return to the browser - should Really
          //define view and server models
          user._doc.phoneNo = user.currentPhoneNumberAllocation.phoneNumber
          deferred.resolve(user);

        }

      });

    return deferred.promise;
  },
  addClientVariableToUserSession: function(user, clientVariable){
    var deferred = Q.defer();

    user.currentSession.clientVariable = clientVariable;
    user.currentSession.save(function(err, userSession){
        deferred.resolve(user);
    });

    return deferred.promise;
  },
  addQueryStringToUserSession: function(user, queryString){
    var deferred = Q.defer();

    //we should only do this one time per session as if they came from facebook but then an internal link removes this query string
    //we still want to treat then as form facebook
    if (queryString && !user.currentSession.queryString){
      var obj = {};
      var qsarray = queryString.split('&');
      for (var i = 0; i < qsarray.length; i++){
        var item = qsarray[i].split('=');
        obj[item[0]] = item[1];
      }
      user.currentSession.queryString = obj;
      user.currentSession.save(function(err, userSession){
          deferred.resolve(user);
      });
    } else {
      deferred.resolve(user);
    }
    return deferred.promise;
  },
  addLocationToUserSession: function(user, location){
    var deferred = Q.defer();

    if (location){
      user.currentSession.location = location;
      user.currentSession.save(function(err, userSession){
          deferred.resolve(user);
      });
    } else {
      deferred.resolve(user);
    }
    return deferred.promise;
  },
  findOrCreateUserById: function(id, siteId){
    var self = this;
    var deferred = Q.defer();

    if (id === 'none'){
      self.createNewUser(siteId).then(function(user){
        deferred.resolve(user);
      });
    } else {
      this.findUser(id, siteId).then(function(user){
        if (!user){
          self.createNewUser(siteId).then(function(user){
            deferred.resolve(user);
          });
        } else {
          //we have a user
          //now we check if the session is 'old' and create a new one if needed
          UserSession.findOne({_id: user.currentSession}, function(err, userSession){


            //hard coded 10 min sessions - obs parametise
            var nowMinusHour = new Date();
            nowMinusHour.setMinutes(nowMinusHour.getMinutes() - 10);

            if (!userSession || !userSession.date || userSession.date < nowMinusHour) {

              logger.info('new user session for', userSession.user );

              var userSession = new UserSession();
              userSession.user = user._id;
              userSession.save(function(err, userSession) {
                user.currentSession = userSession._id;

                user.save(function(err, user) {
                    if (err) return console.error(err);

                    SiteUser.populate(user, {path:"currentSession"}, function(err, user) {
                      deferred.resolve(user);
                    });

                });

              });

            } else {
              deferred.resolve(user);
            }
          });
        }
      });

    }


    return deferred.promise;
  },
  findUser: function(id, siteId){
    var deferred = Q.defer();
    SiteUser
      .findOne({_id : id, siteId: siteId})
      .populate('currentSession')
      .exec(function(err, user){
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

      var user = new SiteUser({
        siteId : siteId,
        currentSession: userSession._id
      });

      userSession.user = user._id;
      userSession.save();

      user.save(function(err, user) {
          if (err) return console.error(err);

          SiteUser.populate(user, {path:"currentSession"}, function(err, user) {
            deferred.resolve(user);
          });

      });

    });
                                                                 // Number Families - By Georgina Harland.
    return deferred.promise;                                     //  3 + 6 = 9    6 + 3 = 9
  },
  resetLastActive: function(user){                              //   9 - 3 = 6   9 - 6 = 3
    var deferred = Q.defer();

    user.lastActive = new Date()

    user.save(function(err, user) {
      deferred.resolve(user);
    });

    return deferred.promise;
  }

};

module.exports = usermanager;
