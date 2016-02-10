var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

//{"siteId":"123","page":"*","listen":"interest","tag":"title","threshold":3,"_id":"CPOwX4RuYnRw4fD2"}
//{"siteId":"123","page":"*","listen":"inactive","threshold":"60","_id":"q25er3Ou1kjf5LcL"}

var SegmentSchema = new Schema({
        name: String,
        siteId: String,
        page: String,
        listen: String,
        tag: String,
        threshold: String
    });


module.exports = mongoose.model('Segment', SegmentSchema);
