var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var Segment = require('./segment');
var Action = require('./action');

//{"siteId":"123","active":false,"name":"Interest then Inactive","type":"and","page":"*","response":"template","location":"http://numero-ph.thisisnumero.internal:5052/template.html","multiPage":true,"multiSession":false,"segments":["q25er3Ou1kjf5LcL","CPOwX4RuYnRw4fD2"],"actionEvents":["zza6Yvbof8kiFD4f"],"_id":"iHYkVK1xCGabndEV"}
//{"siteId":"123","active":true,"name":"Interest then Inactive Slide","type":"and","page":"*","response":"html","location":"http://numero-ph.thisisnumero.internal:5052/slidein.html","multiPage":true,"multiSession":false,"segments":["CPOwX4RuYnRw4fD2","q25er3Ou1kjf5LcL"],"actionEvents":["zza6Yvbof8kiFD4f"],"_id":"jRYkVK1xCHebndWC"}


var ActionSchema = new Schema({
        name: String,
        siteId: String,
        type: { type: String, default: 'and'},
        page: String,
        responsetype: String,
        responsedatafrom: String,
        responsedatalocation: String,
        responsedata:String,
        responsePredefinedTemplate: String,
        multiPage: String,
        multiSession: String,
        events: [{ type: Schema.Types.ObjectId, ref: 'Action' }],
        payload: { type: {}, default: {} },
        templateAttributes: {},
        active: { type: Boolean, default: true },
        system: { type: Boolean, default: false }
    });


module.exports = mongoose.model('Action', ActionSchema);
