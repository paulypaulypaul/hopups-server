var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

//{"lastActive":1454592195128,"bfps":[],"siteId":"123","currentSessionId":"9zYLZsasph8uHwXV","_id":"1a8QR5cGPWKmg8wG"}


var SiteUserSchema = new Schema({
        siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
        lastActive: { type: Date, default: Date.now },
        bfps: [String],
        currentSessionId: { type: Schema.Types.ObjectId, ref: 'UserSession' },
        currentPhoneNumberAllocation: { type: Schema.Types.ObjectId, ref: 'PhoneNumberAllocation' }
    });


module.exports = mongoose.model('SiteUser', SiteUserSchema);
