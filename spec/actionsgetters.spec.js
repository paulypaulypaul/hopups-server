var HopupsMatcher = require('../hopupsmatcher');

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
        name: 'donkeyhopup',
        segments:[{
          listen: 'interest',
          tag: 'test',
          threshold: 1
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      }]
    }
    var hopupsMatcher = new HopupsMatcher(user, site);

    hopupsMatcher.getHopupsToPerform().then(function(actions){

      expect(actions.length).toEqual(1)
      expect(actions[0].name).toEqual('donkeyhopup')

      console.log('returned actions' , actions);
      done();

    });

  });

});
