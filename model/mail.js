var mongoose = require('mongoose');
var schema = mongoose.Schema;

var MailSchema = new schema({
    from: { type: String },
    to: [{ type: String }],
    cc: [{ type: String }],
    bcc: [{ type: String }],
    subject: { type: String },
    text: { type: String },
    html: { type: String },
    attachments: [{
        contentType: { type: String },
        filename: { type: String },
        path: { type: String },
        cid: { type: String }
    }],
    label: { type: schema.ObjectId, ref: 'Label' },
    deadline: { type: Date },
    time: { type: Date }
});

exports.model = mongoose.model('Mail', MailSchema);
