var supertest = require("supertest");
var should = require("should");
var server = supertest.agent("http://localhost:3000");

describe("syncuser test",function(){

  it("post with no userId should return created user",function(done){

    var body = {
      siteId : 'siteId'
    };

    // calling home page api
    server
    .post("/api/syncuser")
    .send(body)
    .expect("Content-type",/json/)
    .expect(200) // THis is HTTP response
    .end(function(err,res){
      res.status.should.equal(200);

      res.body._id.should.not.equal(body.userId);

      done();
    });
  });

  it("post with a userId should return retrived user",function(done){

    var body = {
      siteId : 'siteId',
      userId : '123'
    };

    server
    .post("/api/syncuser")
    .send(body)
    .expect("Content-type",/json/)
    .expect(200) // THis is HTTP response
    .end(function(err,res){
      res.status.should.equal(200);

      body.userId = res.body._id;

      server
      .post("/api/syncuser")
      .send(body)
      .expect("Content-type",/json/)
      .expect(200) // THis is HTTP response
      .end(function(err,res){
        res.body._id.should.equal(body.userId);
        done();
      });
    });
  });

});
