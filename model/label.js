var mongoose = require('mongoose');
var schema = mongoose.Schema;

var labelSchema = new schema({
    name: { type: String },
    color: { type: Number }
})

exports.model = mongoose.model('Label', labelSchema);

exports.Color = {
    Red: "#FF0000",
    Yellow: "#FFFF00",
    Blue: "0000FF",
    Green: "#00FF00",
    White: "#FFFFFF",
    Pink: "FF00FF",
    Grey: "C0C0C0"
};