var mongoose = require('mongoose');
var schema = mongoose.Schema;

var LabelSchema = new schema({
    name: { type: String },
    color: { type: String }
});

exports.model = mongoose.model('Label',LabelSchema);

exports.DefaultColors = {
    dark: [
        '#800000',    // maroon
        '#8B0000',    // darkred
        '#C71585',    // mediumvioletred
        '#4B0082',    // indigo
        '#800080',    // purple
        '#000080',    // navy
        '#696969',    // dimgray
        '#006400',    // darkgreen
        '#DAA520',    // goldenrod
        '#D2691E'     // chocolate
    ],
    light: [
        '#FF0000',      // red
        '#FFC0CB',      // pink
        '#7B68EE',      // mediumslateblue
        '#F5DEB3',      // wheat
        '#FFFF00',      // yellow
        '#32CD32',      // limegreen
        '#00BFFF',      // deepskyblue
        '#ADD8E6',      // lightblue
        '#D3D3D3'       // lightgray
    ]
}