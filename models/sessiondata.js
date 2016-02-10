var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SiteUser = require('./siteuser');
var Site = require('./site');
var UserSession = require('./usersession');
var Action = require('./action');
var Event = require('./event');

//{"type":"event","datetime":{"$$date":1454627887341},"userId":"tbsxpuXeMjvhJ4Z0","sessionId":"2F36Ecrmc69w1DFY","siteId":"123","eventId":"JT7qCBY6TCVagjx4","context":{"location":"/"},"_id":"4DryhuNTw3IBygle"}

var SessionDataSchema = new Schema({
      userId : { type: Schema.Types.ObjectId, ref: 'SiteUser' },
      siteId : { type: Schema.Types.ObjectId, ref: 'Site' },
      sessionId: { type: Schema.Types.ObjectId, ref: 'UserSession' },
      event: { type: Schema.Types.ObjectId, ref: 'Event' },
      context: {},
      date: { type: Date, default: Date.now }
    });


module.exports = mongoose.model('SessionData', SessionDataSchema);
