var settings = require('../settings');
var redis = require('redis');
var client = redis.createClient(settings.redis.port, settings.redis.host);
var Log = require('./log')('[lib-mail]');

exports.sendMail = function(id, cb) {
    client.LPUSH(['MailQueue', id.toString()], cb)
};