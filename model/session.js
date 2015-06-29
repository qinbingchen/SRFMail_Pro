var mongoose = require('mongoose');
var schema = mongoose.Schema;

var SessionSchema = new schema({
    income: { type: schema.ObjectId, ref: 'Mail' },
    distributor: { type: schema.ObjectId, ref: 'User' },
    worker: { type: schema.ObjectId, ref: 'User' },
    readonly: { type: Boolean, default: false },
    reply: { type: schema.ObjectId, ref: 'Mail' },
    checker: { type: schema.ObjectId, ref: 'User' },
    operations: [{
        type: { type: Number },
        operator: { type: schema.ObjectId, ref: 'User' },
        message: { type: String },
        time: { type: Date },
        mail: { type: schema.ObjectId, ref: 'Mail' },
        receiver: { type: schema.ObjectId, ref: 'User' },
        current: { type: Boolean }
    }],
    status: { type: Number },
    isRejected: { type: Boolean },
    isRedirected: { type: Boolean }
});

exports.model = mongoose.model('Session', SessionSchema);

exports.Status = {
    New: 0,
    Dispatched: 1,
    WaitingForReview: 2,
    WaitingForSending: 3,
    Success: 4,
    PermError: 5,
    TempError: 6
};

exports.Type = {
    NotAnOperation: 0,
    Dispatch: 1,
    Redirect: 2,
    SubmitForReview: 3,
    Reject: 4,
    Pass: 5,
    SubmitForSend: 6,
    Retry: 7,
    Abort: 8,
    Send: 9,
    MarkFailed: 10,
    MarkSuccess: 11
};