var mongoose = require('mongoose');

// define the schema for our user model
var userSchema = mongoose.Schema({
    facebook         : {
        facebookUserId           : String,
        username        : String,
        firstName        : String,
        lastName         : String,
        email           : String,
    }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
