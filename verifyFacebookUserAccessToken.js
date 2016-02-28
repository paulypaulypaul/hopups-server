var User = require('./models/user');
var moment = require('moment')
var request = require('request');
var Q = require('q');


var findUserByAccessToken = function(token){
  var deferred = Q.defer();

  User.findOne({ 'facebook.token.access_token' :  token }, function(err, user) {
    if (err){
      deferred.reject(err);
    } else {
      deferred.resolve(user);
    }
  });

  return deferred.promise;
}

var validateFacebookToken = function(token){
  var deferred = Q.defer();

  var path = 'https://graph.facebook.com/me?access_token=' + token;
console.log('path', path)
  request(path, function (error, response, body) {

    var data = JSON.parse(body);
  console.log('facebook responce', data)
    if (!error && response && response.statusCode && response.statusCode == 200) {
      console.log('facebook responce', data)
      deferred.resolve(data);
    }
    else {
      deferred.reject({code: response.statusCode, message: data.error.message});
    }
  });

  return deferred.promise;
}


var findOrCreateUserByFacebookData = function(data, token){
  var deferred = Q.defer();

  var facebook_user = {
    facebookUserId: data.id,
    username: data.name,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    token: {
      access_token : token
    }
  };

  // find a user whose email is the same as the forms email
  // we are checking to see if the user trying to login already exists
  User.findOne({ 'facebook.email' :  facebook_user.email }, function(err, user) {

      if (user) {
        console.log('found user')

          user.facebook.token.access_token = token;
          user.facebook.token.stored_time = Date.now();

          user.save(function(err, user) {
              if (err)
                  throw err;

              deferred.resolve(user);
          });

      } else {
          console.log('creating user')
          var newUser            = new User();
          newUser.facebook = facebook_user;

          newUser.save(function(err, user) {
              deferred.resolve(user);
          });
      }

    });
  return deferred.promise;
}




module.exports = function(req, res, next) {
  if (!req.headers.authorization){
    res.status(500).send('no auth header');
  } else {

    var token = req.headers.authorization.split(' ')[1];
    console.log('token', token);

    //to prevent going over the facebook rate limit we need to store the current token against a user
    //and then check for the token in the header for that user - only check with facebook when the tokenhas expired
    //of corse this is a problem if the user logs out - what shold we do!!!!!!!!!!

    findUserByAccessToken(token).then(function(user){
     if (!user){

       validateFacebookToken(token).then(function(data){
         findOrCreateUserByFacebookData(data, token).then(function(user){
           req.user = user
           next();
         });
       });

     } else {

       var updated_time = moment(user.facebook.token.stored_time).add(1, 'h');

       if (updated_time < moment()){
         console.log('!!!!!!!!!!!!!!!!!!!!!!!!!expired', user.facebook.token.stored_time);

         validateFacebookToken(token).then(function(data){
           findOrCreateUserByFacebookData(data, token).then(function(user){
             req.user = user
             next();
           });
         });

       } else {
         console.log('!!!!!!!!!!!!!!!!!!!!!!!!!NOTexpired', user.facebook.token.stored_time);
         req.user = user;
         next();
       }
     }

   });


 }


}
