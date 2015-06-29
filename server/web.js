var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var settings = require('../settings');
var Log = require('../lib/log')('[server-web]');

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