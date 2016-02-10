var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SiteSchema   = new Schema({
        name: String
    });

module.exports = mongoose.model('Site', SiteSchema);
