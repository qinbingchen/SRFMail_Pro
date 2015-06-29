var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;

exports.detail = function(req, res, next) {
    var id = req.query.id;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.json({
            code: 123,
            message: 'asdf'
        });
    }
    id = mongoose.Types.ObjectId(id);
    Session.model.findById(id)
        .populate('dispatcher', 'username')
        .populate('worker', 'username')
        .populate('reviewer', 'username')
        .populate('income')
        .populate('reply')
        .populate('operations.operator', 'username')
        .populate('operations.receiver', 'username')
        .populate('operations.mail')
        .exec(function(err, session) {
            if(err) {
                return res.json({
                    code: 123,
                    message: 'asdf'
                });
            }
            session.dispatcher = session.dispatcher.username;
            session.worker = session.worker.username;
            session.reviewer = session.reviewer.username;
            session.operations.forEach(function(row) {
                row.operator = row.operator.username;
                row.receiver = row.receiver.username;
                row.mail.attachments.forEach(function(attachment, index) {
                    row.mail.attachments[index] = {
                        title: attachment.filename,
                        id: attachment.id
                    };
                });
            });
            res.json(session);
        });
};