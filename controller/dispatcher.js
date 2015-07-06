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

var set_deadline = function(req, res, next) {
    var sessionId = req.body.id;
    var deadline = req.body.deadline;
    var deadlineDate = new Date(deadline);
    if (deadlineDate.toString() == 'Invalid Date') {
        return res.json({
            code: 1,
            message: 'Invalid date ' + deadline
        });
    }

    var currentUser = req.session.user;
    
};

var urge = function(req, res, next) {

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
        if (user.role != User.Role.Dispatcher) {
            return res.json({
                code: 1,
                message: "Unauthorized: User " + user.username + " with role " + user.role + " isn't a dispatcher"
            });
        }
        next();
    });
});

router.route('/dispatch').post(dispatch);
router.route('/set_deadline').post(set_deadline);
router.route('/urge').post(urge);
module.exports = router;