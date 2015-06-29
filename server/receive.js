var MailListener = require('mail-listener2');
var settings = require('../settings');
var Mail = require('../model').mail;
var Session = require('../model').session;
var fs = require('fs');

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

mailListener.start();

process.on('exit', function() {
    mailListener.stop();
});

mailListener.on('error', function(err){
    console.error(err);
});

mailListener.on('mail', function(_mail, seqno, attributes){
    mailListener.imap.seq.setFlags(seqno, ['Seen'], function() {});
    var mail = {
        from: _mail.from,
        to: _mail.to,
        cc: _mail.cc,
        bcc: _mail.bcc,
        subject: _mail.subject,
        text: _mail.text,
        html: _mail.html,
        attachments: [],
        time: new Date()
    };
    _mail.attachments.forEach(function(row) {
        mail.attachments.push({
            contentType: row.contentType,
            filename: row.filename,
            path: path.join(__dirname, '../attachments', row.contentId),
            cid: row.cid
        });
    });
    mail = new Mail.model(mail);
    mail.save(function(err) {
        if(err) {
            return console.error(err);
        }
        var session = new Session.model({
            income: mail._id,
            status: Session.Status.WaitForDistribute
        });
        session.save(function(err) {});
    });
});

mailListener.on('attachment', function(attachment) {
    var stream = fs.createWriteStream(path.join(__dirname, '../attachments', attachment.contentId));
    attachment.stream.pipe(stream);
});