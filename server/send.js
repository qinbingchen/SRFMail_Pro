var redis = require('redis');
var NodeMailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var settings = require('../settings');
var Mail = require('../model/mail');
var mongoose = require('mongoose');
var Session = require('../model').session;
var System = require('../model').system;
var Log = require('../lib/log')('[server-send]');
var path = require('path');

var client = redis.createClient(settings.redis.port, settings.redis.host);

var mailSender;

exports.start = function() {
    System.model.findOne({
        key: 'mail'
    }, function(err, server) {
        if(err) {
            return Log.e(err)
        }
        if(!server) {
            return Log.d('No mail settings');
        }
        mailSender = NodeMailer.createTransport(smtpTransport({
            host: server.value.smtp.host,
            port: server.value.smtp.port,
            secure: true,
            auth: {
                user: server.value.username,
                pass: server.value.password
            },
            tls: {
                rejectUnauthorized: false
            }
        }));
        FetchAndSend();
        console.log('Ready to send mails.');
    });
};

function FetchAndSend() {
    client.BRPOP(['MailQueue', 0], function(err, data) {
        Mail.model.findById(mongoose.Types.ObjectId(data[1].toString()), function(err, mail) {
            if(err) {
                return Log.e(err);
            }
            var mailEntity = {
                from: mail.from,
                to: mail.to,
                cc: mail.cc,
                bcc: mail.bcc,
                subject: mail.subject,
                text: mail.text,
                html: mail.html,
                attachments: []
            };
            if(mail.attachments) {
                mail.attachments.forEach(function(file) {
                    mailEntity.attachments.push({
                        filename: file.filename,
                        path: path.join(__dirname, '../attachments', file.saveId),
                        contentType: file.contentType,
                        cid: file.contentId
                    });
                });
            }
            mailSender.sendMail(mail, function(err, info) {
                Session.model.findOne({
                    reply: mongoose.Types.ObjectId(data[1].toString())
                }, function(_err, session) {
                    if(_err) {
                        return Log.e(err);
                    }
                    if(err) {
                        Log.e(err);
                        if(session.status == Session.Status.TempError) {
                            session.status = Session.Status.PermError;
                            session.operations.push({
                                operator: null,
                                receiver: null,
                                type: Session.Type.Retry,
                                time: new Date(),
                                mail: session.reply
                            });
                            session.operations.push({
                                operator: null,
                                receiver: null,
                                type: Session.Type.MarkFailed,
                                time: new Date(Date.now() + 1000),
                                mail: session.reply
                            });
                        } else {
                            session.operations.push({
                                operator: null,
                                receiver: null,
                                type: Session.Type.Send,
                                time: new Date(),
                                mail: session.reply
                            });
                            session.status = Session.Status.TempError;
                            session.operations.push({
                                operator: null,
                                receiver: null,
                                type: Session.Type.MarkFailed,
                                time: new Date(Date.now() + 1000),
                                mail: session.reply
                            });
                        }
                    } else {
                        if(session.status == Session.Status.TempError) {
                            session.operations.push({
                                operator: null,
                                receiver: null,
                                type: Session.Type.Retry,
                                time: new Date(),
                                mail: session.reply
                            });
                        } else {
                            session.operations.push({
                                operator: null,
                                receiver: null,
                                type: Session.Type.Send,
                                time: new Date(),
                                mail: session.reply
                            });
                        }
                        session.status = Session.Status.Success;
                        session.operations.push({
                            operator: null,
                            receiver: null,
                            type: Session.Type.MarkSuccess,
                            time: new Date(Date.now() + 1000),
                            mail: session.reply
                        });
                    }
                    session.save(function(err) {
                        if(err) {
                            return Log.e(err);
                        }
                    });
                });
                FetchAndSend()
            })
        })
    })
}

