var MailListener = require('../lib/mail-listener2');
var settings = require('../settings');
var Mail = require('../model').mail;
var Session = require('../model').session;
var Attachment = require('../model').attachment;
var fs = require('fs');
var path = require('path');
var Log = require('../lib/log')('[server-receive');
var uuid = require('uuid');

var mailListener = new MailListener({
    username: settings.mail.username,
    password: settings.mail.password,
    host: settings.mail.imap.host,
    port: settings.mail.imap.port,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: true
    },
    mailbox: 'INBOX',
    searchFilter: ['UNSEEN'],
    fetchUnreadOnStart: true,
    mailParserOptions: {
        streamAttachments: true
    }
});

process.on('exit', function() {
    mailListener.stop();
});

mailListener.on('error', function(err){
    Log.e(err);
});

mailListener.on('close', function() {
    Log.d('IMAP connection closed!');
    mailListener.start();
});

mailListener.on('mail', function(_mail, seqno, attributes){
    mailListener.imap.seq.setFlags(seqno, ['Seen'], function() {});
    console.log(_mail.from);
    var mail = {
        from: _mail.from,
        to: _mail.to,
        cc: _mail.cc,
        bcc: _mail.bcc,
        subject: _mail.subject,
        text: _mail.text,
        html: _mail.html,
        attachments: [],
        time: new Date(),
        messageId: _mail.messageId
    };
    if(_mail.attachments) {
        _mail.attachments.forEach(function(row) {
            mail.attachments.push({
                contentType: row.contentType,
                filename: row.filename,
                cid: row.cid,
                content: row.content,
                encoding: row.encoding,
                id: row.contentId
            });
        });
    }
    mail = new Mail.model(mail);
    mail.save(function(err) {
        if(err) {
            return console.error(err);
        }
        var session = new Session.model({
            income: mail._id,
            status: Session.Status.New
        });
        session.save(function(err) {});
    });
});

mailListener.on('attachment', function(attachment) {
    var saveId = uuid.v1();
    var stream = fs.createWriteStream(path.join(__dirname, '../attachments', saveId));
    attachment.stream.pipe(stream);
    var atta = new Attachment.model({
        name: attachment.generatedFileName,
        contentType: attachment.contentType,
        contentId: attachment.contentId,
        type: Attachment.Type.In,
        saveId: saveId
    });
    attachment.contentId = saveId;
    atta.save(function(err) {
        if(err) {
            Log.e(err);
        }
    })
});

exports.start = mailListener.start.bind(mailListener);