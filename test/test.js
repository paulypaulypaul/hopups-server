var supertest = require("supertest");
var should = require("should");

// This agent refers to PORT where program is runninng.

var server = supertest.agent("http://localhost:3000");

// UNIT test begin

describe("syncuser test",function(){

  // #1 should return home page

  it("should return home page",function(done){

    var user = { username : 'marcus', email : 'marcus@marcus.com'};

    // calling home page api
    server
    .post("/api/syncuser")
    .send(user)
    .expect("Content-type",/json/)
    .expect(200) // THis is HTTP response
    .end(function(err,res){
      console.log(user);
      // HTTP status should be 200
      res.status.should.equal(200);
      done();
    });
  });

});
