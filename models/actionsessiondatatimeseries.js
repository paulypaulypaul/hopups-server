var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var ActionSessionDataTimeSeriesSchema = new Schema({
      siteId : { type: Schema.Types.ObjectId, ref: 'Site' },
      dateTime: { type: Date, default: Date.now },
      data:[{
        userId : { type: Schema.Types.ObjectId, ref: 'SiteUser' },
        siteId : { type: Schema.Types.ObjectId, ref: 'Site' },
        sessionId: { type: Schema.Types.ObjectId, ref: 'UserSession' },
        action: { type: Schema.Types.ObjectId, ref: 'Action' },
        hopup: { type: Schema.Types.ObjectId, ref: 'Hopup' },
        date: { type: Date, default: Date.now },
        context: {}
        }]
    });


module.exports = mongoose.model('ActionSessionDataTimeSeries', ActionSessionDataTimeSeriesSchema);
