var mongoose = require('mongoose');
var schema = mongoose.Schema;

var SystemSchema = new schema({
    key: { type: String },
    value: { type: String }
});

exports.model = mongoose.model('System', SystemSchema);
