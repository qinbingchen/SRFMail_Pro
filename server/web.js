var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var settings = require('../settings');
var Log = require('../lib/log')('[server-web]');
var bodyParser = require('body-parser');
var compression = require('compression');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var path = require('path');

exports.start = function() {
    var port = settings.listen || 3000;
    app.set('port', port);
    server.listen(port);
    server.on('error', function(error) {
        if(error.syscall !== 'listen') {
            throw error;
        }
        switch(error.code) {
            case 'EACCES':
                console.error('Port ' + port + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error('Port ' + port + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
    server.on('listening', function() {
        console.log('Server listening on ' + port);
    });
};

app.use(compression());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
    secret: 'aldnesm89csvjk',
    store: new RedisStore(settings.redis),
    resave: false,
    saveUninitialized: false
}));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Headers', 'accept, accept-version, content-type, request-id, origin, x-api-version, x-request-id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, HEAD');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use('/api', require('../controller'));
app.use('/', express.static(path.join(__dirname, '..', 'web')));