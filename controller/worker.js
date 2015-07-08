/**
 * Created by renfei on 15/7/6.
 */

var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var Attachment = require('../model').attachment;
var _ = require('lodash');
var async = require('async');
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-session]');
var MailSender = require('../lib/mail');

var EmailRegex = /^[a-z0-9]([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;

var submit = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;
    var subject = req.body.subject;
    var html = req.body.html;
    var needReview = req.body.needReview == 'true';
    var reviewerUsername = req.body.reviewer;
    var recipients = req.body.recipients;
    var attachments = req.body.attachments;

    try {
        if (recipients) {
            recipients = JSON.parse(recipients);
        }
        if (attachments) {
            attachments = JSON.parse(attachments);
        }
    } catch (e) {
        return res.json({
            code: 1,
            message: 'Error: Invalid JSON received, please ensure that recipients & attachments parameters hold valid JSON string representations.'
            + ' Reason: ' + e.toString()
            + ' recipients: ' + recipients
            + ' attachments: ' + attachments
        });
    }

    for(var i = 0; i < recipients.length; i++) {
        if(!EmailRegex.test(recipients[i])) {
            return res.json({
                code: 1,
                message: 'Invalid Email Address: ' + recipients[i]
            })
        }
    }

    var reviewer, session;

    if (!mongoose.Types.ObjectId.isValid(sessionId) && typeof sessionId != 'undefined') {
        return res.json({
            code: 1,
            message: 'Invalid session ID ' + sessionId
        });
    }

    async.parallel([
        function(callback) {
            if(needReview) {
                User.model.findOne({ username: reviewerUsername }, function(err, _reviewer) {
                    if(err) {
                        Log.e({req: req}, err);
                        return callback(err);
                    }
                    if(!_reviewer) {
                        return callback(new Error("Couldn't find user with name " + reviewerUsername));
                    }
                    reviewer = _reviewer;
                    callback();
                });
            } else {
                callback();
            }
        },
        function(callback) {
            if(!sessionId) {
                session = new Session.model({
                    worker: user._id
                });
                session.save(callback);
            } else {
                Session.model.findById(mongoose.Types.ObjectId(sessionId)).exec(function(err, _session) {
                    if(err) {
                        Log.e({req: req}, err);
                        return callback(err);
                    }
                    if(!_session) {
                        return callback(new Error("Couldn't find session with ID " + sessionId));
                    }
                    if(_session.status != Session.Status.Dispatched || _session.readonly) {
                        return callback(new Error('Invalid Session Status'));
                    }
                    session = _session;
                    callback();
                });
            }
        },
        function(callback) {
            if(attachments) {
                Attachment.model.find({
                    saveId: {
                        $in: attachments
                    }
                }, function(err, items) {
                    attachments = items;
                    callback(err);
                });
            } else {
                attachments = [];
                callback();
            }
        }
    ], function(err) {
        if (err) {
            return res.json({
                code: 1,
                message: err.toString()
            });
        }

        var repliedMail = new Mail.model({
            to: [],
            from: [{
                address: '15652915887@163.com',
                name: 'SRFMail'
            }],
            subject: subject,
            html: html,
            time: new Date(),
            attachments: []
        });

        recipients.forEach(function(row) {
            repliedMail.to.push({
                name: row.slice(0, row.indexOf('@')),
                address: row
            });
        });

        attachments.forEach(function(row) {
            repliedMail.attachments.push({
                cid: row.contentId,
                path: path.join(__dirname, '../attachments', row.saveId),
                filename: row.name,
                contentType: row.contentType
            });
        });

        repliedMail.save(function(err) {
            if (err) {
                Log.e({req: req}, err);
                return res.json({
                    code: 1,
                    message: err.toString()
                });
            }

            var operationDict = {
                type: needReview ? 3 : 6,
                operator: user._id,
                time: new Date(),
                mail: repliedMail._id
            };
            if (needReview) {
                operationDict['receiver'] = reviewer._id;
                session.reviewer = reviewer._id;
            }
            session.status = needReview ? 2 : 3;
            session.reply = repliedMail._id;
            session.operations.push(operationDict);
            session.isRejected = false;

            session.save(function(err) {
                if (err) {
                    Log.e({req: req}, err);
                    res.json({
                        code: 1,
                        message: err.toString()
                    });
                } else {
                    if(!needReview) {
                        MailSender.sendMail(repliedMail._id.toString(), function(err) {
                            if(err) {
                                Log.e({req: req}, err);
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
                        })
                    }
                }
            });
        });
    });
};

var pass = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Invalid Session ID'
        });
    }

    sessionId = mongoose.Types.ObjectId(sessionId);

    Session.model.findById(sessionId, function(err, session) {
        if (err) {
            return res.json({
                code: 1,
                message: err.toString()
            })
        }
        if(!session) {
            return res.json({
                code: 1,
                message: 'Invalid Session Id'
            })
        }
        if(session.status != Session.Status.Dispatched) {
            return res.json({
                code: 1,
                message: 'Invalid Session Status'
            })
        }
        Session.model.findByIdAndUpdate(sessionId, {
            status: Session.Status.Success,
            $push: {
                operation: {
                    type: Session.Type.MarkSuccess,
                    operator: user._id,
                    receiver: user._id,
                    time: new Date(),
                    mail: session.income
                }
            }
        }, function(err) {
            if (err) {
                return res.json({
                    code: 1,
                    message: err.toString()
                })
            } else {
                return res.json({
                    code: 0,
                    message: 'success'
                })
            }
        })
    });
};

var redirect = function(req, res, next) {
    var id = req.body.id;
    var user = req.body.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.json({
            code: 1,
            message: 'Invalid Session ID'
        });
    }

    var modify = {
        isRedirected: true
    };
    var session;

    async.series([
        function(cb) {
            Session.model.findById(mongoose.Types.ObjectId(id), function(err, _session) {
                if(err) {
                    Log.e({req: req}, err);
                    res.json({
                        code: -1,
                        message: 'Internal error'
                    });
                    return cb(err);
                }
                if(!_session) {
                    res.json({
                        code: 1,
                        message: 'Invalid session id'
                    });
                    return cb(new Error('Invalid session id'));
                }
                if(!_session.income) {
                    res.json({
                        code: 1,
                        message: 'Session you wrote couldn\'t be redirected.'
                    });
                    return cb(new Error('Session you wrote couldn\'t be redirected.'));
                }
                session = _session;
                cb();
            });
        },
        function(cb) {
            if(user) {
                User.model.findOne({
                    username: user
                }, function(err, user) {
                    if(err) {
                        Log.e({req: req}, err);
                        res.json({
                            code: -1,
                            message: 'Internal error'
                        });
                        return cb(err);
                    }
                    if(!user) {
                        res.json({
                            code: 1,
                            message: 'Invalid username'
                        });
                        return cb(new Error('Invalid username'));
                    }
                    modify.worker = user._id;
                    modify.$push = {
                        operations: {
                            type: Session.Type.Redirect,
                            operator: req.session.user._id,
                            receiver: user._id,
                            time: new Date(),
                            mail: session.income
                        }
                    };
                    modify.status = Session.Status.Dispatched;
                    cb();
                })
            }                                                                                                                                                                                                                                                                else {
                modify.worker = null;
                modify.$push = {
                    operations: {
                        type: Session.Type.Redirect,
                        operator: req.session.user._id,
                        receiver: session.dispatcher,
                        time: new Date(),
                        mail: session.income
                    }
                };
                modify.status = Session.Status.New;
                cb();
            }
        },
        function(cb) {
            Session.model.findByIdAndUpdate(mongoose.Types.ObjectId(id), modify, function(err) {
                if(err) {
                    Log.e({req: req}, err);
                    res.json({
                        code: -1,
                        message: 'Internal error'
                    });
                }
                cb(err);
            })
        }
    ], function(err) {
        if(err) {
            return;
        }
        res.json({
            code: 0,
            message: 'success'
        });
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
        if (user.role != User.Role.Worker) {
            return res.json({
                code: 1,
                message: "Unauthorized: User " + user.username + " with role " + user.role + " isn't a worker"
            });
        }
        next();
    });
});

router.route('/submit').post(submit);
router.route('/pass').post(pass);
router.route('/redirect').post(redirect);
module.exports = router;