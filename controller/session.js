var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var router = new require('express').Router();

var detail = function(req, res, next) {
    var id = req.query.id;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.json({
            code: 123,
            message: 'asdf'
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
                return res.json({
                    code: 123,
                    message: 'asdf'
                });
            }
            session.dispatcher = session.dispatcher.username;
            session.worker = session.worker.username;
            session.reviewer = session.reviewer.username;
            session.operations.forEach(function(row) {
                row.operator = row.operator.username;
                row.receiver = row.receiver.username;
                row.mail.attachments.forEach(function(attachment, index) {
                    row.mail.attachments[index] = {
                        title: attachment.filename,
                        id: attachment.id
                    };
                });
            });
            res.json(session);
        });
};

var list = function(req, res, next){
    var ret = {
        count: 0,
        sessions: []
    }
    var query_dispatcher_user_name = req.query.dispatcherUserName;
    var query_worker_user_name = req.query.workerUserName;
    var query_readonly = req.query.readonly;
    var query_reviewer_user_name = req.query.reviewer;
    var find_key = {
        status: req.query.status,
        isRejected: req.query.isRejected,
        isRedirected: req.query.isRedirected
    }
    if(query_readonly){
        find_key.readonly = query_readonly
    }
    if(query_dispatcher_user_name) {
        find_key.dispatcher = User.model.findOne({
            username: query_dispatcher_user_name,
            role: User.Role.Dispatcher
        })._id
    }
    if(query_worker_user_name){
        find_key.worker = User.model.findOne({
            username: query_worker_user_name,
            role: User.Role.Worker
        })._id
    }
    if(query_reviewer_user_name){
        find_key.reviewer = User.model.findOne({
            username: query_reviewer_user_name,
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
                return res.json({
                    code: 123,
                    message: 'asdf'
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
                        deadline: session.income.deadline
                    }
                };
                ret.sessions.push(list_element);
            });
            res.json(ret);
    })
}


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
router.route('/get_detail').get(detail);
router.route('/get_list').get(list);

exports = module.exports = router;