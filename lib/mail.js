var NodeMailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var settings = require('../settings');
var redis = require('redis');
var Mail = require('../model/mail');
var client = redis.createClient(settings.redis.port, settings.redis.host);
var Log = require('./log')('[lib-mail]');

var mailSender = NodeMailer.createTransport(smtpTransport({
    host: settings.mail.smtp.host,
    port: settings.mail.smtp.port,
    secure: true,
    auth: {
        user: settings.mail.username,
        pass: settings.mail.password
    },
    tls: {
        rejectUnauthorized: true
    }
}));

exports.realSendMail = mailSender.sendMail.bind(mailSender);

exports.sendMail = function(_mail, cb) {
    var mail = new Mail.model(_mail);
    mail.save(function(err) {
        if(err) {
            Log.e(err);
            return cb(err);
        }
        client.BLPUSH(['MailQueue', mail._id.toString()], cb)
    })
};