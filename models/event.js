var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

//{"siteId":"123","page":"*","selector":"h1","event":"click","message":"title clicked","tag":"title","_id":"2jsmvMiG9GSOSeOY","dataFrom":".products"}

var EventSchema = new Schema({
        name: String,
        siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
        page: String,
        selector: String,
        event: String,
        message: String,
        tag: String,
        dataFrom: String,
        isActionEvent: { type: Boolean, default: false }, 
        active: { type: Boolean, default: true },
        system: { type: Boolean, default: false }
    });


module.exports = mongoose.model('Event', EventSchema);
