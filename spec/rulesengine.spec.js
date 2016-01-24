var Datastore = require('nedb');
var eventsDb = new Datastore({ filename: 'spec/testdata/events', autoload: true });
var segmentsDb = new Datastore({ filename: 'spec/testdata/segments', autoload: true });
var actionsDb = new Datastore({ filename: 'spec/testdata/actions', autoload: true });
var sessionDataDb = new Datastore({ filename: 'spec/testdata/sessionData', autoload: true });
var userSessionDb = new Datastore({ filename: 'spec/testdata/userSession', autoload: true });
userSessionDb.remove({});
userSessionDb.insert([ {"_id":"1234","completedActions":[]}, {"_id":"12345","completedActions":[]} ]);

var RulesEngine = require('../rulesengine');

describe("Rules engine tests", function() {

  it("should return no events", function(done) {

    var userId = "GLMeHCNFnPiqncQ7";
    var siteId = "123";

    var rulesEngine = new RulesEngine(eventsDb, segmentsDb, actionsDb, sessionDataDb, userSessionDb);

    rulesEngine.getClientActions(userId, "1234", siteId).then(function(events){

      expect(events.length == 1).toBe(true)

      //The second time we get client actions for the same session we dont send any events back - it has already been fired.
      rulesEngine.getClientActions(userId, "1234", siteId).then(function(events){

        expect(events.length == 0).toBe(true)

        //we then get client actions with a new session id so if the sesion/
        //events exsist for that session we get actions back
        rulesEngine.getClientActions(userId, "12345", siteId).then(function(events){

          expect(events.length == 1).toBe(true)

          //reset the db afer test
          userSessionDb.remove({});
          userSessionDb.insert([ {"_id":"1234","completedActions":[]}, {"_id":"12345","completedActions":[]} ]);

          done();

        });
      });
    });
  });
});
