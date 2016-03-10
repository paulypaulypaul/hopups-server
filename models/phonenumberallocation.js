var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var SiteUser = require('./siteuser');

var PhoneNumberAllocation = new Schema({
      user : { type: Schema.Types.ObjectId, ref: 'SiteUser' },
      phoneNumber: String,
      created: { type: Date, default: Date.now },
      lastUpdated: { type: Date, default: Date.now },
      archive: { type: Boolean, default: false }
    });


module.exports = mongoose.model('PhoneNumberAllocation', PhoneNumberAllocation);
