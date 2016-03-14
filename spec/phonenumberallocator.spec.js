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
          {"siteId":site._id}
        ], function(err, siteusers){
          console.log('$$$$$$$$$', siteusers)
          user = siteusers[0];
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    console.log('after each');
  //  connection.connection.db.dropDatabase();
    mongoose.connection.close(function () {
      console.log('Mongoose disconnected on app termination');
      done();
    });
  });

  it("should allocate phone number", function(done) {

      phoneNumberAllocator.allocatePhoneNumber(user).then(function(user){

        console.log('@@@@@@@@@@@@@@@@@@@@@@@--', user, user.phoneNo);
        done();

      });

  });

});
