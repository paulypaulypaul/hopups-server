var Datastore = require('nedb');
var eventsDb = new Datastore({ filename: 'spec/testdata/events', autoload: true });
var segmentsDb = new Datastore({ filename: 'spec/testdata/segments', autoload: true });
var actionsDb = new Datastore({ filename: 'spec/testdata/actions', autoload: true });
var sessionDataDb = new Datastore({ filename: 'spec/testdata/sessionData', autoload: true });
var userSessionDb = new Datastore({ filename: 'spec/testdata/userSession', autoload: true });


var RulesEngine = require('../rulesengine');

describe("Rules engine tests", function() {

  beforeEach(function(done) {
    console.log('before each')
    userSessionDb.remove({}, function(){
      userSessionDb.insert([ {"_id":"1234","completedActions":[]}, {"_id":"12345","completedActions":[]} ], function(err, docs){
        console.log('err', err);
        done();
      });
    });
  });

  afterEach(function(done) {
    console.log('after each')
    userSessionDb.remove({}, function(){
      userSessionDb.insert([ {"_id":"1234","completedActions":[]}, {"_id":"12345","completedActions":[]} ], function(err, docs){
        console.log('err', err);
        done();
      });
    });
  });

  it("should return the correct actions for the correct usersession", function(done) {

    var userId = "GLMeHCNFnPiqncQ7";
    var siteId = "123";

    var rulesEngine = new RulesEngine(eventsDb, segmentsDb, actionsDb, sessionDataDb, userSessionDb);
    rulesEngine.getClientActions(userId, "1234", siteId).then(function(actions){
      expect(actions.length == 1).toBe(true)
      console.log(1)
      //The second time we get client actions for the same session we dont send any events back - it has already been fired.
      rulesEngine.getClientActions(userId, "1234", siteId).then(function(actions){
        expect(actions.length == 0).toBe(true)
        console.log(1)
        //we then get client actions with a new session id so if the sesion/
        //events exsist for that session we get actions back
        rulesEngine.getClientActions(userId, "12345", siteId).then(function(actions){
          expect(actions.length == 1).toBe(true)
          console.log(1)
          done();
        });
      });
    });
  });

});
