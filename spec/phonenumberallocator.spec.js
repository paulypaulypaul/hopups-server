var mongoose   = require('mongoose');

var PhoneNumberAllocation = require('../models/phonenumberallocation');
var Site = require('../models/site');
var SiteUser = require('../models/siteuser');

var PhoneNumberAllocator = require('../phonenumberallocator');
var phoneNumberAllocator = new PhoneNumberAllocator();

describe("Rules engine tests", function() {
  var connection;
  var site;
  var user;
  var user2;
  beforeEach(function(done) {
    connection = mongoose.connect('mongodb://localhost/hopups-test', function(){
      Site.create([
        {
          name: 'test',
          phoneNumbers: '111,222,333'
        }
      ], function(err, sites){

        site = sites[0];

        SiteUser.create([
          {"siteId":site._id},
          {"siteId":site._id}
        ], function(err, siteusers){
          user = siteusers[0];
          user2 = siteusers[1];
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    console.log('after each');
    connection.connection.db.dropDatabase();
    mongoose.connection.close(function () {
      console.log('Mongoose disconnected on app termination');
      done();
    });
  });

  it("should allocate phone number", function(done) {
    phoneNumberAllocator.allocatePhoneNumber(user).then(function(user){
      expect(user._doc.phoneNo).toEqual('111');

      //the site has had allocated phoen numbers updated
      Site.findOne({_id: user.siteId}).then(function(site){
        expect(site.allocatedPhoneNumbers).toEqual(['111']);

        //as the first allocation is still not times out we expect the ame back
        phoneNumberAllocator.allocatePhoneNumber(user).then(function(user){
          expect(user._doc.phoneNo).toEqual('111');

          phoneNumberAllocator.allocatePhoneNumber(user2).then(function(user2){
            expect(user2._doc.phoneNo).toEqual('222');

            //the site has had allocated phoen numbers updated
            Site.findOne({_id: user.siteId}).then(function(site){
              expect(site.allocatedPhoneNumbers).toEqual(['111','222']);

              done();
            });
          });
        });
      });
    });
  });

});
