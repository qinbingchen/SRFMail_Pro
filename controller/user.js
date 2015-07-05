var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-user]');

var login = function(req, res, next) {
    User.model.findOne({
        username: req.body.user,
        password: req.body.password
    }).populate('defaultReviewer', 'username').exec(function(err, user) {
        if(err) {
            Log.e({req: req}, err);
            return res.json({
                code: 1,
                message: 'Internal error'
            });
        }
        if(!user) {
            return res.json({
                code: 1,
                message: 'Invalid username or password'
            });
        }
        req.session.user = user;
        res.json({
            code: 0,
            message: 'success',
            id: user._id.toString(),
            role: user.role,
            name: user.name,
            gender: user.gender,
            defaultReviewer: user.defaultReviewer ? user.defaultReviewer.username : undefined
        });
    });
};

var logout = function(req, res, next) {
    req.session.destroy();
    res.json({
        code: 0,
        message: 'success'
    });
};

var list_reviewers = function(req, res, next) {
    var list = {
        reviewers: []
    };
    User.model.find({
        role: 3
    }, function(err, reviewers) {
        reviewers.forEach(function(reviewer) {
            list.reviewers.push(reviewer.username);
        });

        res.json(list);
    });
};

var list_workers = function(req, res, next) {
    var list = {
        workers: []
    };
    User.model.find({
        role: 2
    }, function(err, workers) {
        workers.forEach(function(worker) {
            list.workers.push(worker.username);
        });

        res.json(list);
    });
};


router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/list_reviewers').get(list_reviewers);
router.route('/list_workers').get(list_workers);

exports = module.exports = router;