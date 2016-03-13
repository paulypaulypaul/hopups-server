var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Action = require('./action');
var Hopup = require('./hopup');
var SiteUser = require('./siteuser');

//{"completedActions":["jRYkVK1xCHebndWC"],"date":{"$$date":1454953113393},"_id":"18fuV9jul1yQ09HX"}

var UserSessionSchema = new Schema({
      completedActions: [{ type: Schema.Types.ObjectId, ref: 'Action' }],
      completedHopups: [{ type: Schema.Types.ObjectId, ref: 'Hopup' }],
      queryString: {},
      user : { type: Schema.Types.ObjectId, ref: 'SiteUser' },
      date: { type: Date, default: Date.now }
    });


module.exports = mongoose.model('UserSession', UserSessionSchema);
