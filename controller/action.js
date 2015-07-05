var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var _ = require('lodash');
var async = require('async');
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-session]');

var dispatcher_dispatch = function(req, res, next) {
    var sessionId = req.body.id;
    var readonlyWorkers, readreplyWorkers;
    try {
        readonlyWorkers = JSON.parse(req.body.readonly);
        readreplyWorkers = JSON.parse(req.body.readreply);
    } catch (e) {
        return res.json({
            code: 1,
            message: 'Invalid JSON received, please ensure that readonly & readreply is valid JSON string representation.'
            + ' Reason: ' + e.toString()
            + ' ReadonlyWorkers: ' + req.body.readonly
            + ' ReadreplyWorkers: ' + req.body.readreply
        });
    }

    var currentUser = req.session.user;
    var originalSession;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Invalid session ID ' + sessionId
        });
    }

    async.parallel([
        // populate originalSession & currentUser
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _originalSession) {
                originalSession = _originalSession;
                callback(err, 'get original session');
            });
        }
    ], function(err) {
        if (err) {
            return res.json({
                code: 1,
                message: err.toString()
            });
        }

        if (!originalSession) {
            return res.json({
                code: 1,
                message: "Couldn't find session with ID " + sessionId
            });
        }

        if (originalSession.status != 0) {
            return res.json({
                code: 1,
                message: "The session's status is " + originalSession.status + " therefore couldn't be dispatched. Aborting."
            });
        }

        // spawn sessions iteratively
        var workers = readonlyWorkers.concat(readreplyWorkers);
        var effectiveWorkers = [];
        async.each(workers, function(worker, callback) {
            User.model.findOne({
                username: worker
            }, function(err, designatedWorker) {
                if (!designatedWorker) {
                    callback();
                } else {
                    effectiveWorkers.push(worker);
                    var session = new Session.model({
                        income: originalSession.income,
                        dispatcher: currentUser._id,
                        worker: designatedWorker._id,
                        readonly: (readonlyWorkers.indexOf(worker) > -1),
                        operations: [],
                        status: 1,
                        isRejected: false,
                        isRedirected: false
                    });
                    originalSession.operations.forEach(function(row) {
                        session.operations.push(row);
                    });
                    var operationDict = {
                        type: 1,
                        operator: currentUser._id,
                        receiver: designatedWorker._id,
                        time: new Date()
                    };
                    session.operations.push(operationDict);
                    session.save(function(err) {
                        callback(err);
                    });
                }
            });
        }, function(err) {
            if (err) {
                res.json({
                    code: 1,
                    message: err.toString()
                });
            } else {
                Session.model.findByIdAndRemove(mongoose.Types.ObjectId(sessionId), function(err) {
                    if (err) {
                        return res.json({
                            code: 1,
                            message: err.toString()
                        });
                    } else {
                        return res.json({
                            code: 0,
                            message: "Success; Workers " + effectiveWorkers.join(", ") + " designated."
                        });
                    }
                });
            }
        });
    });
};

var worker_submit = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;
    var subject = req.body.subject;
    var html = req.body.html;
    var needReview = req.body.needReview == 'true';
    var reviewerUsername = req.body.reviewer;

    var reviewer, session, incomeMail;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Invalid session ID ' + sessionId
        });
    }

    async.series([
        function(callback) {
            User.model.findOne({ username: reviewerUsername }, function(err, _reviewer) {
                reviewer = _reviewer;
                callback(err, 'get designated reviewer');
            });
        }, function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _session) {
                session = _session;
                callback(err, 'get session');
            });
        }, function(callback) {
            if (session) {
                Mail.model.findById(mongoose.Types.ObjectId(session.income), function(err, _incomeMail) {
                    incomeMail = _incomeMail;
                    callback(err, 'get income mail');
                });
            }
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

        if (!reviewer) {
            return res.json({
                code: 1,
                message: "Couldn't find user with name " + reviewerUsername
            });
        }

        if (!incomeMail) {
            return res.json({
                code: 1,
                message: "Couldn't find income mail with ID " + session.income + " from session with ID " + session._id
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
                address: incomeMail.to[0].address,
                name: incomeMail.to[0].name
            }],
            subject: subject,
            html: html,
            time: new Date()
        });

        repliedMail.save(function(err) {
            if (err) {
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

var worker_pass = function(req, res, next) {
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

var reviewer_pass = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;
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
        }
    ],function() {
        if (!session) {
            return res.json({
                code: 1,
                message: "Couldn't find session with ID " + sessionId
            });
        }

        if (!mail) {
            return res.json({
                code: 1,
                message: "Couldn't find reply mail with ID " + session.reply + " from session with ID " + session._id
            });
        }

        if (session.status != 2) {
            return res.json({
                code: 1,
                message: "The session's status is " + session.status + " therefore couldn't be reviewed. Aborting."
            });
        }

        var operationDict = { 
            type: 5, 
            operator:  user._id,
            time: new Date(),
            mail: mail._id
        };
        session.status = 3;
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
        next();
    });
});
router.route('/dispatcher/dispatch').post(dispatcher_dispatch);
router.route('/worker/submit').post(worker_submit);
router.route('/worker/pass').post(worker_pass);
router.route('/reviewer/pass').post(reviewer_pass);

module.exports = router;