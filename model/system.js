var mongoose = require('mongoose');
var schema = mongoose.Schema;

var SystemSchema = new schema({
    key: { type: String },
    value: { type: schema.Types.Mixed }
});

exports.model = mongoose.model('System', SystemSchema);
