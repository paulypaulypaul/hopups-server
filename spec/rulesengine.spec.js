var RulesEngine = require('../rulesengine');

describe("Rules engine tests", function() {

  beforeEach(function(done) {
    console.log('before each');
    done();
  });

  afterEach(function(done) {
    console.log('after each');
    done();
  });

  it("should return the correct actions for the correct usersession", function(done) {

    var eventsDb = {
      find: function(obj, callback){
        callback(null, [
          {"siteId":"123","page":"*","selector":"h1","event":"click","message":"title clicked","tag":"title","_id":"2jsmvMiG9GSOSeOY"},
          {"siteId":"123","page":"*","selector":"body","event":"initialpageload","message":"initialpageload","_id":"JT7qCBY6TCVagjx4"},
          {"siteId":"123","page":"*","selector":"body","event":"eventfired","message":"eventfired","_id":"yza6Yvbof5jiSD2b"},
          {"siteId":"123","page":"*","selector":"#applynow","event":"click","message":"apply now cicked","_id":"zza6Yvbof8kiFD4f"}
        ]);
      }
    };

    var segmentsDb = {
      find: function(obj, callback){
        callback(null, [
          {"siteId":"123","page":"*","listen":"interest","tag":"title","threshold":3,"_id":"CPOwX4RuYnRw4fD2"},
          {"siteId":"123","page":"*","listen":"inactive","threshold":10,"_id":"q25er3Ou1kjf5LcL"}
        ]);
      }
    }

    var actionsDb = {
      find: function(obj, callback){
        callback(null, [
          {"_id":"iHYkVK1xCGabndEV","siteId":"123","name":"Interest then Inactive","type":"and","page":"*","response":"html","template":"chat.html","multiPage":true,"multiSession":false,"segments":["CPOwX4RuYnRw4fD2","q25er3Ou1kjf5LcL"],"actionEvents":["zza6Yvbof8kiFD4f"]}
        ]);
      }
    };

    var sessionDataDb = {
      find: function(obj, callback){
        callback(null, [
          {"type":"event","siteId":"123","eventId":"2jsmvMiG9GSOSeOY","userId":"GLMeHCNFnPiqncQ7","sessionId":"1234","context":{"location":"/"},"_id":"0n8YQsTKccn2i3i6"},
          {"type":"event","siteId":"123","eventId":"2jsmvMiG9GSOSeOY","userId":"GLMeHCNFnPiqncQ7","sessionId":"12345","context":{"location":"/"},"_id":"3n8YQsTKccn2i3i6"},
          {"type":"event","siteId":"123","eventId":"2jsmvMiG9GSOSeOY","userId":"GLMeHCNFnPiqncQ7","sessionId":"1234","context":{"location":"/"},"_id":"4IKrCcrvUYfrH3Od"}
        ]);
      }
    };

    var userSessionDb = {
      value : {
        "1234": {"_id":"1234","completedActions":[]},
        "12345": {"_id":"12345","completedActions":[]}
      },
      findOne: function(obj, callback){
        //console.log('fo - obj, callback', obj, this.value)
        callback(null, this.value[obj._id]);
      },
      update: function(params, obj, callback){
        //console.log('up - obj, callback', obj, callback)
        this.value[obj._id] = obj;
        callback(null, this.value[obj._id]);
      }
    };

    var now = new Date()
    var lastActive = now.setSeconds(now.getSeconds() - 15);

    var user1 = {
      _id    :  "GLMeHCNFnPiqncQ7",
      siteId : "123",
      currentSessionId: "1234",
      lastActive: lastActive
    }

    var user2 = {
      _id    :  "GLMeHCNFnPiqncQ7",
      siteId : "123",
      currentSessionId: "12345",
      lastActive: lastActive
    }

    var rulesEngine = new RulesEngine(eventsDb, segmentsDb, actionsDb, sessionDataDb, userSessionDb);
    rulesEngine.getClientActions(user1).then(function(actions){
      //console.log('actions1', actions);
      expect(actions.length == 1).toBe(true);
      //The second time we get client actions for the same session we dont send any events back - it has already been fired.
      rulesEngine.getClientActions(user1).then(function(actions){
        expect(actions.length == 0).toBe(true)
        console.log(1)
        //we then get client actions with a new session id so if the sesion/
        //events exsist for that session we get actions back
        rulesEngine.getClientActions(user2).then(function(actions){
          expect(actions.length == 1).toBe(true)
          console.log(1)
          done();
        });
      });
    });
  });

});
