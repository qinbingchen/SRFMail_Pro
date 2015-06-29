var express = require('express');
var app = express();
var io = require('io')(app);
var mongoose = require('mongoose');
var settings = require('../settings');
var Log = require('../lib/log')('[server-web]');

mongoose.connect(settings.mongodb, {
    db: {
        native_parser: true
    },
    server: {
        poolSize: 10,
        socketOptions: {
            keepAlive: 1
        }
    },
    replset: {
        socketOptions: {
            keepAlive: 1
        }
    }
});
var db = mongoose.connection;
db.on('error', Log.e.bind(Log, 'connection error'));

exports.start = function() {
    var server = require('http').createServer(app);
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