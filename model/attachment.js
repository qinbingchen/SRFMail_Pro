var mongoose = require('mongoose');
var schema = mongoose.Schema;

var AttachmentSchema = new schema({
    name: String,
    contentType: String,
    type: Number,
    contentId: String,
    saveId: String
});

exports.model = mongoose.model('Attachment', AttachmentSchema);

exports.Type = {
    In: 0,
    Out: 1
};