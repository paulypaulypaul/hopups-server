var ActionsGetter = require('../actionsgetters');

describe("Actions getter tests", function() {

  beforeEach(function(done) {
    done();
  });

  afterEach(function(done) {
    done();
  });


  it("should get action if interest segment matches", function(done) {
    var user = {
      sessionData:[
        {
          event: {
            tag : 'test'
          }
        }
      ],
      currentSession: {
        completedHopups : []
      }
    }
    var site = {
      hopups: [{
        segments:[{
          listen: 'interest',
          tag: 'test',
          threshold: 1
        }],
        actions: []
      }]
    }
    var actionsGetter = new ActionsGetter(user, site);

    actionsGetter.getHopupsToPerform().then(function(actions){

      console.log('returned actions' , actions);
      done();

    });

  });

});
