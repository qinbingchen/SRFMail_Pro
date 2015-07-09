var mongoose = require('mongoose');
var schema = mongoose.Schema;

var UserSchema = new schema({
    username: { type: String, unique: true },
    password: { type: String },
    name: { type: String },
    gender: { type: Number },
    role: { type: Number },
    defaultReviewer: { type: schema.ObjectId, ref: 'User' }
});

exports.model = mongoose.model('User', UserSchema);

exports.Gender = {
    Unspecified: 0,
    Male: 1,
    Female: 2
};

exports.Role = {
    System: 0,
    Dispatcher: 1,
    Worker: 2,
    Reviewer: 3
};