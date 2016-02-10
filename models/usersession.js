var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Action = require('./action');

//{"completedActions":["jRYkVK1xCHebndWC"],"date":{"$$date":1454953113393},"_id":"18fuV9jul1yQ09HX"}

var UserSessionSchema = new Schema({
      completedActions: [{ type: Schema.Types.ObjectId, ref: 'Action' }],
      date: { type: Date, default: Date.now }
    });


module.exports = mongoose.model('UserSession', UserSessionSchema);
