var jsdom = require("jsdom");
var fs = require('fs');


describe("Test client app", function() {

  beforeEach(function(done) {
    done();
  });

  afterEach(function(done) {
    done();
  });

/*  it("It should initialise", function(done) {

    fs.readFile('./public/script.js', 'utf8', function (err, data) {

      data = data.replace(/\[%CONFIG%\]/gi,
        JSON.stringify({
          siteId: 1,
          domain: 'http://www.google.com'
        }
      ));

      jsdom.env({
        html: '<h1>hi</h1>',
        scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'],
        src: [data],
        done: function (err, window) {

          window.setTimeout(function(){

              var response = {
                "user": {
                  "phoneNo":"11",
                  "_id":"570bd0b38ae378902837c624",
                  "siteId":"56e8aaaaf2da21f40e4bf06b",
                  "currentSession":{
                    "_id":"5714c12dd73f9e781d601a30",
                    "user":"570bd0b38ae378902837c624",
                    "__v":1,
                    "queryString":{
                      "utm_campaign":"facebook"
                    },
                    "location":"/jackets.html",
                    "date":"2016-04-18T11:12:45.177Z",
                    "completedHopups":["56ef25b21356668815bf4f71"],
                    "completedActions":[]
                  },
                  "__v":0,
                  "currentPhoneNumberAllocation":{
                    "_id":"5714c135d73f9e781d601a35",
                    "user":"570bd0b38ae378902837c624",
                    "phoneNumber":"11","__v":0,
                    "archive":false,
                    "lastUpdated":"2016-04-18T11:12:53.128Z",
                    "created":"2016-04-18T11:12:53.128Z"
                  },
                  "bfps":[],
                  "lastActive":"2016-04-18T11:12:47.103Z"
                },
                "actions":[]
              };

              console.log(window.clientApp.syncCallback(response, window.clientApp));


              done();

          }, 500)
        }
      });

    });



  });
*/
});
