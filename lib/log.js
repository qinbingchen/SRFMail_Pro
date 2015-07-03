var bunyan = require('bunyan');
var path = require('path');

var LogPath = path.join(__dirname, '..', 'Log', 'Out.log');

var ErrPath = path.join(__dirname, '..', 'Log', 'Err.log');

var Logger = bunyan.createLogger({
    name: 'SRFMail-server',
    streams: [{
        stream: process.stdout,
        level: 'trace'
    }, {
        stream: process.stderr,
        level: 'error'
    }, {
        path: LogPath,
        type: 'file',
        level: 'trace'
    }, {
        path: ErrPath,
        type: 'file',
        level: 'error'
    }],
    serializers: {
        req: function(req) {
            return {
                method: req.method,
                url: req.url,
                headers: req.headers,
                remoteAddress:  req.ip,
                query: req.query || '',
                body: req.body || ''
            };
        },
        res: function(res) {
            return {
                status: res._content.status,
                message: res._content.message
            };
        }
    }
});

var LoggerS = Logger.child({src: true});

exports = module.exports = function(identifier) {
    return {
        d: Logger.info.bind(Logger, identifier),
        e: LoggerS.error.bind(LoggerS, identifier)
    }
};