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

var dispatch = function(req, res, next) {
    var sessionId = req.body.id;
    var readonlyWorkers, readreplyWorkers;
    var deadline;
    if (req.body.deadline) {
        deadline = new Date(req.body.deadline);
        if (deadline.toString() == 'Invalid Date') {
            return res.json({
                code: 1,
                message: 'Error: Invalid date string ' + req.body.deadline
            });
        }
        if (deadline < new Date()) {
            return res.json({
                code: 1,
                message: 'Error: Designated deadline (' + deadline.toLocaleString() + ') is earlier then now (' + (new Date()).toLocaleString() + ')'
            });
        }
    }

    try {
        readonlyWorkers = JSON.parse(req.body.readonly);
        readreplyWorkers = JSON.parse(req.body.readreply);
    } catch (e) {
        return res.json({
            code: 1,
            message: 'Error: Invalid JSON received, please ensure that readonly & readreply parameters hold valid JSON string representations.'
            + ' Reason: ' + e.toString()
            + ' ReadonlyWorkers: ' + req.body.readonly
            + ' ReadreplyWorkers: ' + req.body.readreply
        });
    }

    var currentUser = req.session.user;
    var originalSession, incomeMail;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Error: Invalid session ID ' + sessionId
        });
    }

    async.series([
        // populate originalSession & currentUser
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _originalSession) {
                originalSession = _originalSession;
                callback(err, 'get original session');
            });
        },
        function(callback) {
            if (!deadline || !originalSession) {
                callback();
                return;
            }
            Mail.model.findById(mongoose.Types.ObjectId(originalSession.income), function(err, _incomeMail) {
                incomeMail = _incomeMail;
                if (!incomeMail) {
                    callback(err, 'get income mail');
                    return;
                }
                incomeMail.deadline = deadline;
                incomeMail.save(function(err) {
                    callback(err, 'update income mail');
                });
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
                message: "Error: Couldn't find session with ID " + sessionId
            });
        }

        if (deadline && !incomeMail) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find mail with ID " + originalSession.income + " from session with ID " + originalSession._id
            });
        }

        if (originalSession.status != 0) {
            return res.json({
                code: 1,
                message: "Error: The session's status is " + originalSession.status + " therefore couldn't be dispatched. Aborting."
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
                    return;
                }
                if (designatedWorker.role != User.Role.Worker) {
                    callback();
                    return;
                }
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
            });
        }, function(err) {
            if (err) {
                return res.json({
                    code: 1,
                    message: err.toString()
                });
            }

            if (effectiveWorkers.length == 0) {
                return res.json({
                    code: 1,
                    message: "Error: None of the workers you designated is valid (a user is" +
                    " considered a valid worker if and only if *all* of the following criterias" +
                    " are met: 1) the user can be found in our database; 2) the user is a worker"
                });
            }

            Session.model.findByIdAndRemove(mongoose.Types.ObjectId(sessionId), function(err) {
                if (err) {
                    return res.json({
                        code: 1,
                        message: err.toString()
                    });
                }
                return res.json({
                    code: 0,
                    message: "Success: Workers " + effectiveWorkers.join(", ") + " designated."
                });
            });
        });
    });
};

var urge = function(req, res, next) {

};

router.use(function(req, res, next) {
    if (!req.session.user) {
        return res.json({
            code: 1,
            message: 'Error: You are not yet logged in'
        });
    }
    User.model.findById(mongoose.Types.ObjectId(req.session.user._id), function(err, user) {
        if (err || !user) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find user with ID " + req.session.user._id
            });
        }
        req.session.user = user;
        if (user.role != User.Role.Dispatcher) {
            return res.json({
                code: 1,
                message: "Error: Unauthorized: User " + user.username + " with role " + user.role + " isn't a dispatcher"
            });
        }
        next();
    });
});

router.route('/dispatch').post(dispatch);
router.route('/urge').post(urge);
module.exports = router;