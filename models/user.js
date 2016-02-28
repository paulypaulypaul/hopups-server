var mongoose = require('mongoose');

// define the schema for our user model
var userSchema = mongoose.Schema({
    facebook         : {
        facebookUserId           : String,
        username        : String,
        firstName        : String,
        lastName         : String,
        email           : String,
        token           : {
          access_token : String,
          stored_time : { type: Date, default: Date.now }
        }
    }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
