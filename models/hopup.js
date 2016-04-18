var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var Segment = require('./segment');
var Action = require('./action');
var Event = require('./event');
var Site = require('./site');

//{"siteId":"123","active":false,"name":"Interest then Inactive","type":"and","page":"*","response":"template","location":"http://numero-ph.thisisnumero.internal:5052/template.html","multiPage":true,"multiSession":false,"segments":["q25er3Ou1kjf5LcL","CPOwX4RuYnRw4fD2"],"actionEvents":["zza6Yvbof8kiFD4f"],"_id":"iHYkVK1xCGabndEV"}
//{"siteId":"123","active":true,"name":"Interest then Inactive Slide","type":"and","page":"*","response":"html","location":"http://numero-ph.thisisnumero.internal:5052/slidein.html","multiPage":true,"multiSession":false,"segments":["CPOwX4RuYnRw4fD2","q25er3Ou1kjf5LcL"],"actionEvents":["zza6Yvbof8kiFD4f"],"_id":"jRYkVK1xCHebndWC"}

var HopupSchema = new Schema({
        name: String,
        siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
        actions: [{ type: Schema.Types.ObjectId, ref: 'Action' }],
        segments: [{ type: Schema.Types.ObjectId, ref: 'Segment' }],
        events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],

        multiPage: { type: Boolean, default: true }, //should events for one session be collected over mulitple pages
        multiSession: { type: Boolean, default: true }, //should events be collected over multiple sessions
        timesPerSession: { type: Number, default: 1 }, //number of times event fired per session

        active: { type: Boolean, default: true },
        system: { type: Boolean, default: false }
    });


module.exports = mongoose.model('Hopup', HopupSchema);
