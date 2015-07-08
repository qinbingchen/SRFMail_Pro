var server = require('http').createServer(handler);
var io = require('socket.io')(server);
var settings = require('../settings');
var User = require('../model').user;
var Log = require('../lib/log')('[server-socket]');
var redis = require('redis');
var mongoose = require('mongoose');
var Session = require('../model').session;

var client = redis.createClient(settings.redis.port, settings.redis.host);

function handler(req, res) {
    res.writeHead(200);
    res.end('ok');
}

exports.start = function() {
    server.listen(settings.listen + 1);
};

var sockets = {};

io.on('connection', function(socket) {
    console.log('socket connected');

    setTimeout(function() {
        if(!socket.username) {
            socket.emit('AuthTimeOut').conn.close();
        }
    }, 1000);

    socket.on('Auth', function(username, password) {
        User.model.findOne({
            username: username,
            password: password
        }, function(err, user) {
            if(err) {
                Log.e(err);
                socket.emit('Error', 'Mongo error!');
                return;
            }
            if(!user) {
                socket.emit('AuthFailed');
                return;
            }
            socket.username = user.username;
            sockets[user._id.toString] = socket;
            switch(user.role) {
                case 1:
                    socket.join('dispatcher');
                    break;
                case 2:
                    socket.join('worker');
                    break;
                case 3:
                    socket.join('reviewer');
                    break;
            }
        });
    });
});

client.BRPOP(['ReceiveQueue', 0], function(err, data) {
    if(err) {
        return Log.e(err);
    }
    Session.model.findById(mongoose.Types.ObjectId(data[1]), function(err, session) {
        if(err) {
            return Log.e(err);
        }
        var element = {
            id: session._id,
            readonly: session.readonly,
            dispatcher: session.dispatcher ? session.dispatcher.username : undefined,
            worker: session.worker ? session.worker.username : undefined,
            reviewer: session.reviewer ? session.reviewer.username : undefined,
            status: session.status,
            isRejected: session.isRejected ? session.isRejected : false,
            isRedirected: session.isRedirected ? session.isRejected : false,
            isUrged: session.isUrged ? session.isUrged : false,
            lastOperation: session.operations ? (session.operations.length > 0 ? session.operations[session.operations.length-1] : undefined) : undefined
        };
        if(session.income) {
            element.income = {
                subject: session.income.subject,
                from: session.income.from,
                to: session.income.to,
                labels: session.income.labels,
                deadline: session.income.deadline,
                time: session.income.time
            }
        }
        if(session.reply) {
            element.reply = {
                subject: session.reply.subject,
                from: session.reply.from,
                to: session.reply.to,
                labels: session.reply.labels,
                deadline: session.reply.deadline,
                time: session.reply.time
            }
        }
        io.to('dispatcher').emit('NewMail', element);
    });
});

client.BRPOP(['WorkerQueue', 0], function(err, data) {
    if(err) {
        return Log.e(err);
    }
    Session.model.findById(mongoose.Types.ObjectId(data[1]), function(err, session) {
        if(err) {
            return Log.e(err);
        }
        var element = {
            id: session._id,
            readonly: session.readonly,
            dispatcher: session.dispatcher ? session.dispatcher.username : undefined,
            worker: session.worker ? session.worker.username : undefined,
            reviewer: session.reviewer ? session.reviewer.username : undefined,
            status: session.status,
            isRejected: session.isRejected ? session.isRejected : false,
            isRedirected: session.isRedirected ? session.isRejected : false,
            isUrged: session.isUrged ? session.isUrged : false,
            lastOperation: session.operations ? (session.operations.length > 0 ? session.operations[session.operations.length-1] : undefined) : undefined
        };
        if(session.income) {
            element.income = {
                subject: session.income.subject,
                from: session.income.from,
                to: session.income.to,
                labels: session.income.labels,
                deadline: session.income.deadline,
                time: session.income.time
            }
        }
        if(session.reply) {
            element.reply = {
                subject: session.reply.subject,
                from: session.reply.from,
                to: session.reply.to,
                labels: session.reply.labels,
                deadline: session.reply.deadline,
                time: session.reply.time
            }
        }
        if(Object.keys(sockets).indexOf(session.worker.toString()) > -1) {
            sockets[session.worker.toString()].emit('NewMail', element);
        }
    });
});

client.BRPOP(['ReviewerQueue', 0], function(err, data) {
    if(err) {
        return Log.e(err);
    }
    Session.model.findById(mongoose.Types.ObjectId(data[1]), function(err, session) {
        if(err) {
            return Log.e(err);
        }
        var element = {
            id: session._id,
            readonly: session.readonly,
            dispatcher: session.dispatcher ? session.dispatcher.username : undefined,
            worker: session.worker ? session.worker.username : undefined,
            reviewer: session.reviewer ? session.reviewer.username : undefined,
            status: session.status,
            isRejected: session.isRejected ? session.isRejected : false,
            isRedirected: session.isRedirected ? session.isRejected : false,
            isUrged: session.isUrged ? session.isUrged : false,
            lastOperation: session.operations ? (session.operations.length > 0 ? session.operations[session.operations.length-1] : undefined) : undefined
        };
        if(session.income) {
            element.income = {
                subject: session.income.subject,
                from: session.income.from,
                to: session.income.to,
                labels: session.income.labels,
                deadline: session.income.deadline,
                time: session.income.time
            }
        }
        if(session.reply) {
            element.reply = {
                subject: session.reply.subject,
                from: session.reply.from,
                to: session.reply.to,
                labels: session.reply.labels,
                deadline: session.reply.deadline,
                time: session.reply.time
            }
        }
        if(Object.keys(sockets).indexOf(session.reviewer.toString()) > -1) {
            sockets[session.reviewer.toString()].emit('NewMail', element);
        }
    });
});