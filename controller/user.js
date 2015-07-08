var mongoose = require('mongoose');
var async = require('async');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-user]');

var login = function(req, res, next) {
    User.model.findOne({
        username: req.body.user,
        password: req.body.password
    }).exec(function(err, user) {
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
            defaultReviewer: user.defaultReviewer
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

var password = function(req, res) {
    async.series([
        function(cb) {
            if(req.session.user.username != req.body.user) {
                return cb(new Error('Invalid request'));
            }
            cb();
        },
        function(cb) {
            if(req.body.oldPassword != req.session.user.password) {
                return cb(new Error('Incorrect password'));
            }
            cb();
        },
        function(cb) {
            User.model.findByIdAndUpdate(req.session.user._id, {
                password: req.body.newPassword
            }, cb)
        }
    ], function(err) {
        if(err) {
            res.json({
                code: 1,
                message: err.toString()
            });
        } else {
            res.json({
                code: 0,
                message: 'success'
            });
        }
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

router.route('/logout').post(logout);
router.route('/list_reviewers').get(list_reviewers);
router.route('/list_workers').get(list_workers);
router.route('/password').post(password);

exports = module.exports = router;