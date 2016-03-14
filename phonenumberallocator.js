var schedule = require('node-schedule');
var moment = require('moment');
var Q = require('q');

var PhoneNumberAllocation = require('./models/phonenumberallocation');
var Site = require('./models/site');
var SiteUser = require('./models/siteuser');

var logger = require('./lib/logger').create("PHONENUMBERALLOCATOR");

var phonenumberallocator = function () {
  this.startReaping();
};

phonenumberallocator.prototype = {
  allocatePhoneNumber: function(user){
    var self = this;
    var deferred = Q.defer();

    logger.info('Trying to allocate phone number for', user);

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
  getNextPhoneNumber: function(site){
    logger.info('getNextPhoneNumber for site', site);

    var phoneNumbers = site.phoneNumbers.split(',');
    for (var i=0; i < phoneNumbers.length; i++){
      if (site.allocatedPhoneNumbers.indexOf(phoneNumbers[i]) < 0){
        return phoneNumbers[i];
      }
    }
    return false;
  },
  startReaping: function(){
    var self = this;

    schedule.scheduleJob('*/10 * * * * *', function(){
      Site.find({}, function(err, sites){
        for (var i = 0; i < sites.length; i++){
          self.reapSite(sites[i])
        }
      });
    });
  },
  reapSite: function(site){
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

        if (pnas.length < 1){
          var index = site.allocatedPhoneNumbers.indexOf(phoneNumber);
          if (index > -1){
            site.allocatedPhoneNumbers.splice(index, 1);
            site.save();
          }
        }

      });
    }

    for (var i = 0; i < phoneNumbers.length; i++){
      testPhoneNumber(phoneNumbers[i]);
    }
  }
}

module.exports = phonenumberallocator;
