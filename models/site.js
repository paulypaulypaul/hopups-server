var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var SiteSchema   = new Schema({
        name: String,
        description: {type: String, default: 'Bacon ipsum dolor sit amet salami ham hock ham, hamburger corned beef'},
        phoneNumbers: String,
        allocatedPhoneNumbers: [],
        javascriptNamespace: String,
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        active: { type: Boolean, default: true }
    });

module.exports = mongoose.model('Site', SiteSchema);
