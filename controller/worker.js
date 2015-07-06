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

var submit = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;
    var subject = req.body.subject;
    var html = req.body.html;
    var needReview = req.body.needReview == 'true';
    var reviewerUsername = req.body.reviewer;

    console.log(req.body);

    var reviewer, session, incomeMail;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Invalid session ID ' + sessionId
        });
    }

    async.parallel([
        function(callback) {
            User.model.findOne({ username: reviewerUsername }, function(err, _reviewer) {
                if(err) {
                    Log.e({req: req}, err);
                }
                reviewer = _reviewer;
                console.log(reviewer);
                callback(err, 'get designated reviewer');
            });
        }, function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId))
                .populate('income')
                .exec(function(err, _session) {
                if(err) {
                    Log.e({req: req}, err);
                }
                session = _session;
                callback(err, 'get session');
            });
        }
    ], function(err) {
        if (err) {
            return res.json({
                code: 1,
                message: err.toString()
            });
        }

        if (!session) {
            return res.json({
                code: 1,
                message: "Couldn't find session with ID " + sessionId
            });
        }

        if(session.status != Session.Status.Dispatched || session.readonly) {
            return res.json({
                code: 1,
                message: 'Invalid Session Status'
            })
        }

        if (!reviewer) {
            return res.json({
                code: 1,
                message: "Couldn't find user with name " + reviewerUsername
            });
        }

        if (session.status != 1) {
            return res.json({
                code: 1,
                message: "The session's status is " + session.status + " therefore couldn't be submitted. Aborting."
            });
        }

        var repliedMail = new Mail.model({
            to: [{
                address: session.income.from[0].address,
                name: session.income.from[0].name
            }],
            from: [{
                address: '15652915887@163.com',
                name: 'SRFMail'
            }],
            subject: subject,
            html: html,
            time: new Date()
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
            }
            session.status = needReview ? 2 : 3;
            session.reply = repliedMail._id;
            session.reviewer = reviewer._id;
            session.operations.push(operationDict);

            session.save(function(err) {
                if (err) {
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
        if(session.status != Session.Status.Dispatched || !session.readonly) {
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