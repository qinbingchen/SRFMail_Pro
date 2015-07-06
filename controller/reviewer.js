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

router.route('/reviewer/pass').post(reviewer_pass);
module.exports = router;