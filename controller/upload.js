var multiparty = require('multiparty');
var fs = require('fs');
var uuid = require('uuid');
var Log = require('../lib/log')();

exports = module.exports = function(req, res) {
    var form = new multiparty.Form();
    var count = 0;
    var ret = {
        code: 0,
        message: 'success',
        file: {}
    };

    form.on('part', function(part) {
        if (!part.filename) {
            console.log('got field named ' + part.name);
            part.resume();
        }
        if (part.filename) {
            var name = uuid.v1();
            var stream = fs.createWriteStream(path.join(__dirname, '../attachments', name));
            ret.file[part.filename] = name;
            part.pipe(stream);
        }
        part.on('error', function(err) {
            Log.e(err);
            ret.code = -1;
            ret.message = 'Internal error'
        });
    });

    form.on('close', function() {
        res.json(ret);
    });

    form.parse(req);
};