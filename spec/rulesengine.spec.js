var RulesEngine = require('../rulesengine');
var mongoose   = require('mongoose');
var connection = mongoose.connect('mongodb://localhost/hopups-test');

var Event = require('../models/event');
var Segment = require('../models/segment');
var Action = require('../models/action');
var SessionData = require('../models/sessiondata');
var SiteUser = require('../models/siteuser');
var UserSession = require('../models/usersession');
var Site = require('../models/site');
var Hopup = require('../models/hopup');

describe("Rules engine tests", function() {
  var site;
  var user1;
  var user2;
  var usersession2;

  beforeEach(function(done) {
    var now = new Date()
    var lastActive = now.setSeconds(now.getSeconds() - 15);
    Site.create([
      {name: 'test'}
    ], function(err, sites){
      site = sites[0];
      Event.create([
        {"siteId":site._id,"page":"*","selector":"h1","event":"click","message":"title clicked","tag":"title"},
        {"siteId":site._id,"page":"*","selector":"body","event":"initialpageload","message":"initialpageload"},
        {"siteId":site._id,"page":"*","selector":"body","event":"eventfired","message":"eventfired"},
        {"siteId":site._id,"page":"*","selector":"#applynow","event":"click","message":"apply now cicked"}
      ], function(err, events){

        Segment.create([
          {"siteId":site._id,"page":"*","listen":"interest","tag":"title","threshold":3},
          {"siteId":site._id,"page":"*","listen":"inactive","threshold":10}
        ], function(err, segments){
          var segment1Id = segments[0]._id;
          var segment2Id = segments[1]._id;

          Action.create([
            {
              "siteId":site._id,
              "name" : "Title interest template",
              "responsedatalocation" : "http://numero-ph.thisisnumero.internal:5052/template.html",
              "responsedatafrom" : "uri",
              "responsetype" : "template",
              "page" : "",
              "type" : "and",
              "events" : []
          }], function(err, actions){
            var action1Id = actions[0]._id;

            Hopup.create([{
              "siteId":site._id,
              "name": "blah",
              "actions" : [action1Id],
              "segments":[segment1Id,segment2Id]
            }], function(err, hopups){

              UserSession.create([
                {"completedActions":[]},
                {"completedActions":[]}
              ], function(err, usersessions){
                var usersession1Id = usersessions[0]._id;
                var usersession2Id = usersessions[1]._id;
                usersession2 = usersessions[1];

                SiteUser.create([
                  {"siteId":site._id,currentSession:usersession1Id,lastActive:lastActive},
                  {"siteId":site._id,currentSession:usersession2Id,lastActive:lastActive}
                ], function(err, siteusers){
                  user1 = siteusers[0];
                  user2 = siteusers[1];

                  usersessions[0].user = user1._id;
                  usersessions[0].save();

                  usersessions[1].user = user1._id;
                  usersessions[1].save();

                  SessionData.create([
                    {"type":"event","siteId":site._id,"event":events[0]._id,"userId":siteusers[0]._id,"sessionId":usersession1Id,"context":{"location":"/"}},
                    {"type":"event","siteId":site._id,"event":events[0]._id,"userId":siteusers[0]._id,"sessionId":usersession1Id,"context":{"location":"/"}},
                    {"type":"event","siteId":site._id,"event":events[0]._id,"userId":siteusers[0]._id,"sessionId":usersession1Id,"context":{"location":"/"}},
                    {"type":"event","siteId":site._id,"event":events[0]._id,"userId":siteusers[0]._id,"sessionId":usersession2Id,"context":{"location":"/"}},
                    {"type":"event","siteId":site._id,"event":events[0]._id,"userId":siteusers[0]._id,"sessionId":usersession2Id,"context":{"location":"/"}},
                    {"type":"event","siteId":site._id,"event":events[0]._id,"userId":siteusers[0]._id,"sessionId":usersession2Id,"context":{"location":"/"}}
                  ], function(err, sessiondatas){

                    done();
                  });
                });
              });
            });
          });
        });
      });
    });

  });

  afterEach(function(done) {
    console.log('after each');
    //connection.connection.db.dropDatabase();
    done();
  });

  it("should return the correct actions for the correct usersession", function(done) {
      var rulesEngine = new RulesEngine();
      rulesEngine.getClientActions(user1).then(function(actions){
        expect(actions.length == 1).toBe(true);
        //The second time we get client actions for the same session we dont send any events back - it has already been fired.
        rulesEngine.getClientActions(user1).then(function(actions){
          expect(actions.length == 0).toBe(true)
          //we then get client actions with a new session id so if the sesion/
          //events exsist for that session we get actions back
          user1.currentSession = usersession2._id;
          rulesEngine.getClientActions(user1).then(function(actions){
            expect(actions.length == 1).toBe(true)
            //console.log(1)
            done();
          });
        });
      });
  });

});
