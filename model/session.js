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
    status: { type: Number }
});

exports.model = mongoose.model('Session', SessionSchema);

exports.Status = {
    WaitForDistribute: 0,
    Distributed: 1,
    Returned: -1,
    Redirected: -2,
    Read: 2, // For readonly
    WaitForCheck: 3,
    CheckFailed: -3,
    Sending: 4,
    SendFailed: -4,
    SendSuccess: 5
};
