var redis = require('redis');
var settings = require('../settings');
var Mail = require('../model/mail');
var mongoose = require('mongoose');
var MailSender = require('../lib/mail');
var Log = require('../lib/log')('[server-send]');

var client = redis.createClient(settings.redis.port, settings.redis.host);

exports.start = function() {
    FetchAndSend();
};

function FetchAndSend() {
    client.BRPOP(['MailQueue', 0], function(err, data) {
        Mail.model.findById(mongoose.Types.ObjectId(data[1].toString()), function(err, mail) {
            if(err) {
                return Log.e(err);
            }
            //var mailEntity = {
            //    from: mail.from,
            //    to: mail.to,
            //    cc: mail.cc,
            //    bcc: mail.bcc,
            //    subject: mail.subject,
            //    text: mail.text,
            //    html: mail.html,
            //    attachments: mail.attachments
            //};
            //mail.attachments.forEach(function(file) {
            //    mailEntity.attachments.push({
            //        filename: file.filename,
            //        path: file.path,
            //        contentType: file.contentType,
            //        cid: file.cid
            //    })
            //});
            MailSender.realSendMail(mail, function(err, info) {
                if(err) {
                    return Log.e(err)
                }
                FetchAndSend()
            })
        })
    })
}

