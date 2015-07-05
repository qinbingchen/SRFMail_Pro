var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-session]');

var detail = function(req, res, next) {
    var id = req.query.id;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.json({
            code: 1,
            message: 'Invalid ID'
        });
    }
    id = mongoose.Types.ObjectId(id);
    Session.model.findById(id)
        .populate('dispatcher', 'username')
        .populate('worker', 'username')
        .populate('reviewer', 'username')
        .populate('income')
        .populate('reply')
        .populate('operations.operator', 'username')
        .populate('operations.receiver', 'username')
        .populate('operations.mail')
        .exec(function(err, session) {
            if(err) {
                Log.e({req: req}, err);
                return res.json({
                    code: 1,
                    message: 'Failed to fetch result'
                });
            }
            session.dispatcher = session.dispatcher ? session.dispatcher.username : undefined;
            session.worker = session.worker ? session.worker.username : undefined;
            session.reviewer = session.reviewer ? session.reviewer.username : undefined;
            session.operations.forEach(function(row) {
                row.operator = row.operator.username;
                row.receiver = row.receiver.username;
                if(row.mail.attachments) {
                    row.mail.attachments.forEach(function(attachment, index) {
                        row.mail.attachments[index] = {
                            title: attachment.filename,
                            id: attachment.id
                        };
                    });
                }
            });
            res.json(session);
        });
};

var list = function(req, res, next){
    var ret = {
        count: 0,
        sessions: []
    };
    var queryDispatcherUserName = req.query.dispatcherUserName;
    var queryWorkerUserName = req.query.workerUserName;
    var queryReadonly = req.query.readonly;
    var queryReviewerUserName = req.query.reviewer;
    var queryStatus = req.query.status;
    var queryIsRejected = req.query.isRejected;
    var queryIsRedirected = req.query.isRedirected;
    var find_key = {};
    if(queryStatus){
        find_key.status = queryStatus
    }
    if(queryIsRejected){
        find_key.isRejected = queryIsRejected;
    }
    if(queryIsRedirected){
        find_key.isRedirected = queryIsRedirected;
    }
    if(queryReadonly){
        find_key.readonly = queryReadonly
    }
    if(queryDispatcherUserName) {
        find_key.dispatcher = User.model.findOne({
            username: queryDispatcherUserName,
            role: User.Role.Dispatcher
        })._id
    }
    if(queryWorkerUserName){
        find_key.worker = User.model.findOne({
            username: queryWorkerUserName,
            role: User.Role.Worker
        })._id
    }
    if(queryReviewerUserName){
        find_key.reviewer = User.model.findOne({
            username: queryReviewerUserName,
            role: User.Role.Reviewer
        })._id
    }
    Session.model.find(find_key)
        .populate('dispatcher', 'username')
        .populate('worker', 'username')
        .populate('reviewer', 'username')
        .populate('income')
        .exec(function(err, sessions){
            if (err) {
                Log.e({req: req}, err);
                return res.json({
                    code: 1,
                    message: 'Failed to fetch result'
                });
            }
            ret.count = sessions.length;
            sessions.forEach(function (session, index){
                var list_element = {
                    id: session._id,
                    readonly: session.readonly,
                    dispatcher: session.dispatcher ? session.dispatcher.username : undefined,
                    worker: session.worker ? session.worker.username : undefined,
                    reviewer: session.reviewer ? session.reviewer.username : undefined,
                    status: session.status,
                    isRejected: session.isRejected,
                    isRedirected: session.isRedirected,
                    income: {
                        subject: session.income.subject,
                        from: session.income.from,
                        labels: session.income.labels,
                        deadline: session.income.deadline,
                        time: session.income.time
                    }
                };
                ret.sessions.push(list_element);
            });
            ret.sort(function(a, b){
                return a.income.time.getTime() < b.income.time.getTime();
            })
            res.json(ret);
    })
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
router.route('/get_detail').get(detail);
router.route('/get_list').get(list);

exports = module.exports = router;