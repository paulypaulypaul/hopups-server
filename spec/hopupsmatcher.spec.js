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
            tag : 'matchingtag'
          }
        }
      ],
      currentSession: {
        completedHopups : []
      }
    };

    var site = {
      hopups: [{
        name: 'donkeyhopup',
        segments:[{
          listen: 'interest',
          tag: 'matchingtag',
          threshold: 1
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      },
      {
        name: 'donkeyhopup',
        segments:[{
          listen: 'interest',
          tag: 'nonmatchingtag',
          threshold: 1
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      }]
    };

    var hopupsMatcher = new HopupsMatcher(user, site);

    hopupsMatcher.getHopupsToPerform().then(function(hopups){

      expect(hopups.length).toEqual(1);
      expect(hopups[0].name).toEqual('donkeyhopup');

      done();

    });

  });

  it("should get action if inactive segment matches", function(done) {
    var now = new Date();

    //last active ten seconds ago
    var lastActive = now.setSeconds(now.getSeconds() - 10);


    var user = {
      sessionData:[
        {
          event: {
            tag : 'matchingtag'
          }
        }
      ],
      currentSession: {
        completedHopups : []
      },
      lastActive : lastActive
    };

    var site = {
      hopups: [
        // this hopup will match as only one segment that matches
        {
          name: 'donkeyhopup',
          segments:[{
            listen: 'inactive',
            threshold: 5                 //5 second threshold
          }],
          actions: [{
            name: 'donkeyaction'
          }]
        },
        // this hopup will not match as only one segment that does not match
        {
          name: 'donkeyhopup2',
          segments:[{
            listen: 'inactive',
            threshold: 20                 //20 second threshold
          }],
          actions: [{
            name: 'donkeyaction'
          }]
        },
        // this hopup will match as 2 segments with 2 matches
        {
          name: 'donkeyhopup3',
          segments:[{
            listen: 'interest',
            tag: 'matchingtag',
            threshold: 1
          },
          {
            listen: 'inactive',
            threshold: 5                 //5 second threshold
          }],
          actions: [{
            name: 'donkeyaction'
          }]
        },
        // this hopup will not match as 2 segments only one matches
        {
          name: 'donkeyhopup3',
          segments:[{
            listen: 'interest',
            tag: 'nonematchingtag',
            threshold: 1
          },
          {
            listen: 'inactive',
            threshold: 5                 //5 second threshold
          }],
          actions: [{
            name: 'donkeyaction'
          }]
        }
      ]
    };

    var hopupsMatcher = new HopupsMatcher(user, site);

    hopupsMatcher.getHopupsToPerform().then(function(hopups){

      expect(hopups.length).toEqual(2);
      expect(hopups[0].name).toEqual('donkeyhopup');

      done();

    });

  });

  it("should get action if visits segment matches", function(done) {

   var user = {
      sessionData:[
        {
          event: {
            tag : 'matchingtag'
          }
        }
      ],
      currentSession: {
        completedHopups : []
      },
      usersessions: [
        {}
      ]
    };

    var site = {
      hopups: [{
        name: 'donkeyhopup',
        segments:[{
          listen: 'visits',
          threshold: 1
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      },
      {
        name: 'donkeyhopup',
        segments:[{
          listen: 'interest',
          tag: 'nonmatchingtag',
          threshold: 1
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      }]
    };

    var hopupsMatcher = new HopupsMatcher(user, site);

    hopupsMatcher.getHopupsToPerform().then(function(hopups){

      expect(hopups.length).toEqual(1);
      expect(hopups[0].name).toEqual('donkeyhopup');

      done();

    });

  });

  it("should get action if visits segment matches", function(done) {

   var user = {
      sessionData:[
        {
          event: {
            tag : 'matchingtag'
          }
        }
      ],
      currentSession: {
        completedHopups : []
      },
      usersessions: [
        {}
      ]
    };

    var site = {
      hopups: [{
        name: 'donkeyhopup2',
        segments:[{
          listen: 'visits',
          threshold: 2
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      },
      {
        name: 'donkeyhopup',
        segments:[{
          listen: 'visits',
          tag: 'nonmatchingtag',
          threshold: 1
        }],
        actions: [{
          name: 'donkeyaction'
        }]
      }]
    };

    var hopupsMatcher = new HopupsMatcher(user, site);

    hopupsMatcher.getHopupsToPerform().then(function(hopups){

      expect(hopups.length).toEqual(1);
      expect(hopups[0].name).toEqual('donkeyhopup');

      done();

    });

  });

});
