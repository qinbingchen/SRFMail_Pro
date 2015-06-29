var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;

var login = function(req, res, next) {
    User.model.findOne({
        username: req.body.user,
        password: req.body.password
    }).populate('defaultReviewer', 'username').exec(function(err, user) {
        if(err) {
            return res.json({
                code: 123,
                message: 'asdf'
            });
        }
        if(!user) {
            return res.json({
                code: 123,
                message: 'asdf'
            });
        }
        req.session.user = user._id.toString();
        res.json({
            code: 0,
            message: 'success',
            id: user._id.toString(),
            role: user.role,
            name: user.name,
            gender: user.gender,
            defaultReviewer: user.defaultReviewer.username
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