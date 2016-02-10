var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

//{"siteId":"123","page":"*","selector":"h1","event":"click","message":"title clicked","tag":"title","_id":"2jsmvMiG9GSOSeOY","dataFrom":".products"}

var EventSchema = new Schema({
        name: String,
        siteId: String,
        page: String,
        selector: String,
        event: String,
        message: String,
        tag: String,
        dataFrom: String
    });


module.exports = mongoose.model('Event', EventSchema);
