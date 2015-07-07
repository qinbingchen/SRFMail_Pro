var mongoose = require('mongoose');
var async = require('async');
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
            if(!session) {
                return res.json({
                    code: 1,
                    message: "Couldn't find session with ID " + id
                })
            }
            var ret = {
                code: 0,
                message: 'success',
                operations: [],
                dispatcher: session.dispatcher ? session.dispatcher.username : undefined,
                worker: session.worker ? session.worker.username : undefined,
                reviewer: session.reviewer ? session.reviewer.username : undefined,
                status: session.status,
                isRejected: session.isRejected ? session.isRejected : false,
                isRedirected: session.isRedirected ? session.isRejected : false,
                isUrged: session.isUrged ? session.isUrged : false,
                readonly: session.readonly,
                income: session.income,
                reply: session.reply
            };
            if(ret.income && !ret.income.html) {
                ret.income.html = '<p>' + ret.income.text + '</p>'
            }
            if(ret.reply && !ret.reply.html) {
                ret.reply.html = '<p>' + ret.income.text + '</p>'
            }
            session.operations.forEach(function(row) {
                var op = {
                    operator: row.operator ? row.operator.username : undefined,
                    receiver: row.receiver ? row.receiver.username : undefined,
                    type: row.type,
                    message: row.message,
                    time: row.time
                };
                if(ret.income && ret.income.attachments) {
                    ret.income.attachments.forEach(function(attachment, index) {
                        op.mail.attachments[index] = {
                            title: attachment.filename,
                            id: attachment.id
                        };
                    });
                }
                if(ret.reply && ret.reply.attachments) {
                    ret.reply.attachments.forEach(function(attachment, index) {
                        op.mail.attachments[index] = {
                            title: attachment.filename,
                            id: attachment.id
                        };
                    });
                }
                if(row.mail) {
                    op.mail = row.mail;
                }
                if(row.mail && row.mail.attachments) {
                    op.mail.attachments.forEach(function(attachment, index) {
                        op.mail.attachments[index] = {
                            title: attachment.filename,
                            id: attachment.id
                        };
                    });
                }
                ret.operations.push(op);
            });
            ret.operations.sort(function (a, b){
                return a.time.getTime() < b.time.getTime();
            });
            res.json(ret);
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
    var queryIsRejected = req.query.isRejected == "true";
    var queryIsRedirected = req.query.isRedirected == "true";
    var find_key = {};

    switch(req.session.user.role) {
        case User.Role.Reviewer:
            find_key.reviewer = req.session.user._id;
            break;
        case User.Role.Worker:
            find_key.worker = req.session.user._id;
            break;
        case User.Role.Dispatcher:
            break;
        default:
            return res.json({
                code: 1,
                message: 'You are not yet logged in'
            });
            break;
    }

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

    Session.model.find(find_key)
        .populate('dispatcher', 'username')
        .populate('worker', 'username')
        .populate('reviewer', 'username')
        .populate('income')
        .populate('reply')
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
                    isRejected: session.isRejected ? session.isRejected : false,
                    isRedirected: session.isRedirected ? session.isRejected : false,
                    isUrged: session.isUrged ? session.isUrged : false,
                    lastOperation: session.operations ? (session.operations.length > 0 ? session.operations[session.operations.length-1] : undefined) : undefined
                };
                if(session.income) {
                    list_element.income = {
                        subject: session.income.subject,
                        from: session.income.from,
                        to: session.income.to,
                        labels: session.income.labels,
                        deadline: session.income.deadline,
                        time: session.income.time
                    }
                }
                if(session.reply) {
                    list_element.reply = {
                        subject: session.reply.subject,
                        from: session.reply.from,
                        to: session.reply.to,
                        labels: session.reply.labels,
                        deadline: session.reply.deadline,
                        time: session.reply.time
                    }
                }
                ret.sessions.push(list_element);
            });
            ret.sessions.sort(function (a, b){
                var A, B;
                if(a.lastOperation) {
                    A = a.lastOperation.time.getTime();
                } else {
                    A = a.income.time.getTime();
                }
                if(b.lastOperation) {
                    B = b.lastOperation.time.getTime();
                } else {
                    B = b.income.time.getTime();
                }
                return A < B;
            });
            res.json(ret);
        });
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