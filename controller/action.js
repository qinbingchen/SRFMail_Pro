var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var _ = require('lodash');
var router = new require('express').Router();

var dispatcher_dispatch = function(req, res, next) {
    var sessionId = req.body.id;
    var readonlyWorkers = req.body.readonly;
    var readreplyWorkers = req.body.readreply;
    var userId = req.session.user;

    var originalSession, currentUser;

    async.parallel([
        // populate originalSession & currentUser
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _originalSession) {
                originalSession = _originalSession;
                callback(err, 'get original session');
            });
        }, function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(userId), function(err, _currentUser) {
                currentUser = _currentUser;
                callback(err, 'get current user');
            });
        }
    ], function() {
        // spawn sessions iteratively
        var workers = readonlyWorkers.concat(readreplyWorkers);
        workers.forEach(function(worker) {
            User.model.find({
                username: worker
            }, function(err, designatedWorker) {
                var session = _.cloneDeep(originalSession);
                delete session._id;
                session = new Session.model(session);
                session.dispatcher = currentUser._id;
                session.worker = designatedWorker._id;
                session.readonly = (readonlyWorkers.indexOf(designatedWorker) > -1);
                session.operations.push({
                    type: 1,
                    operator: currentUser._id,
                    receiver: designatedWorker._id,
                    time: new Date()
                });
                session.status = 1;
                session.isRejected = false;
                session.isRedirected = false;
                session.save(function(err) {
                    // oh.
                });
            });
        });

        res.json({
            "code": 0,
            "message": "Success"
        });
    });
};

var worker_submit = function(req, res, next) {
    var sessionId = req.body.id;
    var userId = req.session.user;
    var subject = req.body.subject;
    var html = req.body.html;
    var needReview = req.body.needReview;
    var reviewerUsername = req.body.reviewer;

    var user, reviewer, session, incomeMail;

    async.series([
        function(callback) {
            User.model.findById(mongoose.Types.ObjectId(userId), function(err, _user) {
                user = _user;
                callback(err, 'get operating user');
            });
        }, function(callback) {
            User.model.find({ username: reviewerUsername }, function(err, _reviewer) {
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

        res.json({
            "code": 0,
            "message": "Success"
        });
    });
};

var reviewer_pass = function(req, res, next) {
    var sessionId = req.body.id;
    var userId = req.session.user;
    var user, session, mail;

    async.series([
        function(callback) {
            User.model.findById(mongoose.Types.ObjectId(userId), function(err, _user) {
                user = _user;
                callback(err, 'get operating user');
            });
        },
        function(callback) {
            Session.model
                .findById(mongoose.Types.ObjectId(sessionId))
                .populate('reply', 'reply')
                .exec(function(err, _session) {
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

        res.json({
            "code": 0,
            "message": "Success"
        });
    });
};

router.use(function(req, res, next) {
    if(!req.session.user) {
        return res.json({
            code: 123,
            message: 'asdf'
        });
    }
    User.model.findById(mongoose.Types.ObjectId(req.session.user._id), function(err, user) {
        if(err) {
            return res.json({
                code: 123,
                message: 'asdf'
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