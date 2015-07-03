var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var _ = require('lodash');
var router = new require('express').Router();

var dispatcher_dispatch = function(req, res, next) {
    var sessionId = req.body.id;
    var readonly = req.body.readonly;
    var readreply = req.body.readreply;
    var userId = req.session.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.json({
            code: 123,
            message: 'asdf'
        });
    }

    var readonlyWorkers = JSON.parse(readonly);
    var readreplyWorkers = JSON.parse(readreply);
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