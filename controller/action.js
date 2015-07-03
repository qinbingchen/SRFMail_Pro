var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var router = new require('express').Router();

var dispatcher_dispatch = function(req, res, next) {

};

var worker_submit = function(req, res, next) {

};

var reviewer_pass = function(req, res, next) {

};

router.use(function(req, res, next) {
    if(!req.session.user) {
        return res.json({
            code: 123,
            message: 'asdf'
        });
    }
    User.model.findById(mongoose.Types.ObjectId(req.session.user), function(err, user) {
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