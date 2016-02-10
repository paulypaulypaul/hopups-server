var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

//{"lastActive":1454592195128,"bfps":[],"siteId":"123","currentSessionId":"9zYLZsasph8uHwXV","_id":"1a8QR5cGPWKmg8wG"}


var SiteUserSchema = new Schema({
        siteId: String,
        lastActive: String,
        bfps: [String],
        currentSessionId: String
    });


module.exports = mongoose.model('SiteUser', SiteUserSchema);
