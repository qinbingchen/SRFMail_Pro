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
    var readonlyWorkers = req.body.readonly;
    var readreplyWorkers = req.body.readreply;
    var currentUser = req.session.user;

    var originalSession;

    async.parallel([
        // populate originalSession & currentUser
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _originalSession) {
                originalSession = _originalSession;
                callback(err, 'get original session');
            });
        }
    ], function() {
        // spawn sessions iteratively
        Log.e({
            readonlyWorkers: readonlyWorkers,
            readreplyWorkers: readreplyWorkers
        });
        var workers = readonlyWorkers.concat(readreplyWorkers);
        Log.e({
            workers: workers
        });
        async.each(workers, function(worker, callback) {
            User.model.findOne({
                username: worker
            }, function(err, designatedWorker) {
                if (!designatedWorker) {
                    callback();
                } else {
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
                    Log.e({
                        opDict: operationDict
                    });
                    session.operations.push(operationDict);
                    session.save(function(err) {
                        callback();
                    });
                }
            });
        }, function(err) {
            res.json({
                "code": 0,
                "message": "Success"
            });
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
            Mail.model.findById(mongoose.Types.ObjectId(session.income), function(err, _incomeMail) {
                incomeMail = _incomeMail;
                callback(err, 'get income mail');
            });
        }
    ], function() {
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
                res.json({
                    "code": 0,
                    "message": "Success"
                });
            });
        });
    });
};

var reviewer_pass = function(req, res, next) {
    var sessionId = req.body.id;
    var user = req.session.user;
    var session, mail;

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
        var operationDict = { 
            type: 5, 
            operator:  user._id,
            time: new Date(),
            mail: mail._id
        };
        session.status = 3;
        session.operations.push(operationDict);

        session.save(function(err) {
            res.json({
                "code": 0,
                "message": "Success"
            });
        });
    });
};

router.use(function(req, res, next) {
    if(!req.session.user) {
        return res.json({
            code: 1,
            message: 'You are not yet logged in'
        });
    }
    User.model.findById(mongoose.Types.ObjectId(req.session.user._id), function(err, user) {
        if(err) {
            return res.json({
                code: 1,
                message: 'Invalid user id'
            });
        }
        req.session.user = user;
        next();
    });
});
router.route('/dispatcher/dispatch').post(dispatcher_dispatch);
router.route('/worker/submit').post(worker_submit);
router.route('/reviewer/pass').post(reviewer_pass);

module.exports = router;