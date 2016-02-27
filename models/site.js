var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var SiteSchema   = new Schema({
        name: String,
        user: { type: Schema.Types.ObjectId, ref: 'User' },
    });

module.exports = mongoose.model('Site', SiteSchema);
