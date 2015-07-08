var redis = require('redis');
var settings = require('../settings');
var client = redis.createClient(settings.redis.port, settings.redis.host);
var Log = require('../lib/log')();

exports.toDispatcher = function(sessionId) {
    client.lpush(['ReceiveQueue', sessionId.toString()], function(err) {
        if(err) {
            Log.e(err);
        }
    });
};

exports.toWorker = function(sessionId) {
    client.lpush(['WorkerQueue', sessionId.toString()], function(err) {
        if(err) {
            Log.e(err);
        }
    });
};

exports.toReviewer = function(sessionId) {
    client.lpush(['ReviewerQueue', sessionId.toString()], function(err) {
        if(err) {
            Log.e(err);
        }
    });
};