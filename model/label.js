var mongoose = require('mongoose');
var schema = mongoose.Schema;

var LabelSchema = new schema({
    name: { type: String },
    color: { type: String }
});

exports.model = mongoose.model('Label',LabelSchema);