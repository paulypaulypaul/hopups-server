var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SitePhoneNumber = new Schema({
      phoneNumber: String,
      user : { type: Schema.Types.ObjectId, ref: 'SiteUser' },
      site : { type: Schema.Types.ObjectId, ref: 'Site' },
      lastUpdated: { type: Date, default: Date.now }
      created: { type: Date, default: Date.now },
    });


module.exports = mongoose.model('SitePhoneNumber', SitePhoneNumber);
