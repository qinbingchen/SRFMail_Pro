var mongoose = require('mongoose');
var schema = mongoose.Schema;

var MailSchema = new schema({
    from: [{
        address: String,
        name: String
    }],
    to: [{
        address: String,
        name: String
    }],
    cc: [{
        address: String,
        name: String
    }],
    bcc: [{
        address: String,
        name: String
    }],
    replyTo: { type: String },
    inReplyTo: { type: String },
    subject: { type: String },
    text: { type: String },
    html: { type: String },
    attachments: [{
        id: { type: String },
        contentType: { type: String },
        filename: { type: String },
        path: { type: String },
        cid: { type: String },
        content: { type: String },
        encoding: { type: String }
    }],
    label: [String],
    deadline: { type: Date },
    time: { type: Date },
    messageId: { type: String }
});

exports.model = mongoose.model('Mail', MailSchema);
