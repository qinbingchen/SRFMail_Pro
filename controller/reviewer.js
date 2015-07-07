/**
 * Created by renfei on 15/7/6.
 */

var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var _ = require('lodash');
var async = require('async');
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-session]');
var MailSender = require('../lib/mail');

var reject = function(req, res, next){
    var sessionId = req.body.id;
    var message = req.body.message;
    var user = req.session.user;

    if(!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Invalid session ID ' + sessionId
        });
    }

    Session.model.findById(sessionId)
        .populate('worker', 'username')
        .populate('reply')
        .exec(function (err, session){
            if (err) {
                Log.e({req: req}, err);
                return res.json({
                    code: 1,
                    message: 'Failed to fetch result via session id'
                });
            }
            if (!session) {
                return res.json({
                    code: 1,
                    message: "Couldn't find session with ID " + sessionId
                });
            }
            var mail = session.reply, sender = session.worker;

            if (!mail) {
                return res.json({
                    code: 1,
                    message: "Couldn't find reply mail with ID " + session.reply + " from session with ID " + session._id
                });
            }

            if (session.status != Session.Status.WaitingForReview) {
                return res.json({
                    code: 1,
                    message: "The session's status is " + session.status + " therefore couldn't be reviewed. Aborting."
                });
            }

            if(!sender){
                return res.json({
                    code: 1,
                    message: "this mail have no worker, cannot be reject"
                })
            }

            var operationDict = {
                type: Session.Type.Reject,
                operator: user._id,
                receiver: sender._id,
                message: message,
                time: new Date(),
                mail: mail ? mail._id : undefined
            };

            session.isRejected = true;
            session.status = Session.Status.Dispatched;
            session.operations.push(operationDict);

            session.save(function(err) {
                if (err) {
                    res.json({
                        code: 1,
                        message: err.toString()
                    });
                } else {
                    res.json({
                        "code": 0,
                        "message": "Success"
                    });
                }
            });
        })
};

var pass = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;
    var subject = req.body.subject;
    var html = req.body.html;
    var attachments = req.body.attachments;
    var newMail;

    var session, mail;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Invalid session ID ' + sessionId
        });
    }

    async.series([
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _session) {
                session = _session;
                callback(err, 'get session');
            });
        },
        function(callback) {
            Mail.model.findById(mongoose.Types.ObjectId(session.reply), function(err, _mail) {
                mail = _mail;
                callback(err, 'get mail');
            });
        },
        function(callback) {
            if (!session) {
                return callback(new Error("Couldn't find session with ID " + sessionId));
            }

            if (!mail) {
                return callback(new Error("Couldn't find reply mail with ID " + session.reply + " from session with ID " + session._id));
            }

            if (session.status != Session.Status.WaitingForReview) {
                return callback(new Error("The session's status is " + session.status + " therefore couldn't be reviewed. Aborting."));
            }

            if(subject || html || attachments) {
                newMail = _.cloneDeep(mail);
                delete newMail._id;
                if(subject){
                    newMail.subject = subject;
                }
                if(html){
                    newMail.html = html;
                }
                if(attachments){
                    newMail.attachments = attachments;
                }
                newMail.time = new Date();
                newMail = new Mail.model(newMail);

                newMail.save(function(err) {
                    return callback(err);
                });
            } else {
                newMail = mail;
                callback();
            }
        },
        function(callback) {
            var operationDict = {
                type: Session.Type.Pass,
                operator: user._id,
                time: new Date(),
                mail: newMail._id
            };
            session.status = Session.Status.WaitingForSend;
            session.operations.push(operationDict);
            session.reply = newMail._id;

            session.save(callback);
        },
        function(callback) {
            MailSender.sendMail(newMail._id, callback);
        }
    ],function(err) {
        if (err) {
            res.json({
                code: 1,
                message: err.toString()
            });
        } else {
            res.json({
                "code": 0,
                "message": "Success"
            });
        }
    });
};

router.use(function(req, res, next) {
    if (!req.session.user) {
        return res.json({
            code: 1,
            message: 'You are not yet logged in'
        });
    }
    User.model.findById(mongoose.Types.ObjectId(req.session.user._id), function(err, user) {
        if (err || !user) {
            return res.json({
                code: 1,
                message: "Couldn't find user with ID " + req.session.user._id
            });
        }
        req.session.user = user;
        if (user.role != User.Role.Reviewer) {
            return res.json({
                code: 1,
                message: "Unauthorized: User " + user.username + " with role " + user.role + " isn't a reviewer"
            });
        }
        next();
    });
});

router.route('/pass').post(pass);
router.route('/reject').post(reject);
module.exports = router;