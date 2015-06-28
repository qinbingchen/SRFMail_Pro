var mongoose = require('mongoose');
var schema = mongoose.Schema;

var UserSchema = new schema({
    username: { type: String },
    password: { type: String },
    name: { type: String },
    sex: { type: Number },
    role: { type: Number },
    defaultChecker: { type: schema.ObjectId, ref: 'User' }
});

exports.model = mongoose.model('User', UserSchema);
