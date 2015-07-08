exports.toBoolean = function(val) {
    return (val == true || val == 'true' || (parseInt(val) != 0 && !isNaN(parseInt(val))));
};

exports.safeParseJson = function(val) {
    var data;
    try {
        data = JSON.parse(val);
    } catch(e) {
        return null;
    }
    return data;
};