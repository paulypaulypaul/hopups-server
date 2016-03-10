var Q = require('q');
var moment = require('moment')

var User = require('./user');
var SiteUser = require('./models/siteuser');
var Site = require('./models/site');
var UserSession = require('./models/usersession');
var PhoneNumberAllocation = require('./models/phonenumberallocation');

var schedule = require('node-schedule');

var reapSite = function(site){
  console.log('site reaping', site._id);

  var phoneNumbers =  [].concat(site.allocatedPhoneNumbers);

  var testPhoneNumber = function(phoneNumber){
    PhoneNumberAllocation.find({
        phoneNumber: phoneNumber,
        archive: false
    }, function(err, pnas){

      var expiry_time = moment().subtract(1, 'm');

      for(var i = 0; i < pnas.length; i++){
        var pna = pnas[i];
        if (pna.lastUpdated > expiry_time.toDate()){
          //still need the allocation
        } else {

          pna.archive = true;
          pna.save();

          var index = site.allocatedPhoneNumbers.indexOf(phoneNumber);
          if (index > -1){
            site.allocatedPhoneNumbers.splice(index, 1);
            site.save();
          }

        }
      }

    });
  }

  for (var i = 0; i < phoneNumbers.length; i++){
    testPhoneNumber(phoneNumbers[i]);
  }
}

schedule.scheduleJob('*/1 * * * *', function(){
  Site.find({}, function(err, sites){
    for (var i = 0; i < sites.length; i++){
      reapSite(sites[i])
    }
  });
});

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
  getNextPhoneNumber: function(site){
    var phoneNumbers = site.phoneNumbers.split(',');
    for (var i=0; i < phoneNumbers.length; i++){
      if (site.allocatedPhoneNumbers.indexOf(phoneNumbers[i]) < 0){
        return phoneNumbers[i];
      }
    }
    return false;
  },
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
            var userSession = new UserSession();
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

      var user = new SiteUser({
        siteId : siteId,
        currentSessionId: userSession._id
      });

      userSession.user = user._id;
      userSession.save();

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

    user.lastActive = new Date()

    user.save(function(err, user) {
      deferred.resolve(user);
    });

    return deferred.promise;
  }

};

module.exports = usermanager;
