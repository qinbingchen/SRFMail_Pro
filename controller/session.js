var mongoose = require('mongoose');
var async = require('async');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var Label = require('../model').label;
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-session]');
var util = require('../lib/util');

var getLabelsFromIdArray = function(labelIdArray, fnCallback) {
    Label.model.find({
        _id: {
            $in: labelIdArray
        }
    }, function(err, labels) {
        if (err) {
            return fnCallback(err, null);
        }

        fnCallback(null, labels);
    });
};

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
                income: session.income ? {
                    from: session.income.from,
                    to: session.income.to,
                    cc: session.income.cc,
                    bcc: session.income.bcc,
                    replyTo: session.income.replyTo,
                    inReplyTo: session.income.inReplyTo,
                    subject: session.income.subject,
                    text: session.income.text,
                    html: session.income.html,
                    attachments: session.income.attachments,
                    labels: null,
                    deadline: session.income.deadline,
                    time: session.income.time
                } : undefined,
                reply: session.reply ? {
                    from: session.reply.from,
                    to: session.reply.to,
                    cc: session.reply.cc,
                    bcc: session.reply.bcc,
                    replyTo: session.reply.replyTo,
                    inReplyTo: session.reply.inReplyTo,
                    subject: session.reply.subject,
                    text: session.reply.text,
                    html: session.reply.html,
                    attachments: session.reply.attachments,
                    time: session.reply.time
                } : undefined
            };
            if(ret.income) {
                if(!ret.income.html) {
                    ret.income.html = '<p style="padding: 20px 0">' + ret.income.text + '</p>'
                }
                if(ret.income.attachments) {
                    ret.income.attachments.forEach(function(attachment) {
                        attachment = {
                            title: attachment.filename,
                            id: attachment.id
                        };
                    });
                }
                ret.income.html = util.fetchContent(ret.income.html);
            }
            if(ret.reply) {
                if(!ret.reply.html && ret.income) {
                    ret.reply.html = '<p style="padding: 20px 0">' + ret.income.text + '</p>'
                }
                if(ret.reply.attachments) {
                    ret.reply.attachments.forEach(function(attachment) {
                        attachment = {
                            title: attachment.filename,
                            id: attachment.id
                        };
                    });
                }
                ret.reply.html = util.fetchContent(ret.reply.html);
            }
            session.operations.forEach(function(row) {
                var op = {
                    operator: row.operator ? row.operator.username : undefined,
                    receiver: row.receiver ? row.receiver.username : undefined,
                    type: row.type,
                    message: row.message,
                    time: row.time
                };
                if(row.mail) {
                    op.mail = row.mail;
                    if(!row.mail.html) {
                        op.mail.html = '<p style="padding: 20px 0">' + row.mail.text + '</p>'
                    }
                    if(row.mail.html) {
                        op.mail.html = util.fetchContent(op.mail.html);
                    }
                    if(row.mail.attachments) {
                        op.mail.attachments.forEach(function(attachment, index) {
                            op.mail.attachments[index] = {
                                title: attachment.filename,
                                id: attachment.id
                            };
                        });
                    }
                }
                ret.operations.push(op);
            });
            ret.operations.sort(function (a, b){
                return a.time.getTime() < b.time.getTime();
            });

            if(session.income && session.income.labels) {
                getLabelsFromIdArray(session.income.labels, function (err, labels) {
                    if (err) {
                        return res.json({
                            code: 1,
                            message: err.toString()
                        });
                    }
                    ret.income.labels = labels;
                    res.json(ret);
                });
            }else{
                res.json(ret);
            }
        });
};

var list = function(req, res, next){
    var ret = {
        code: 0,
        message: 'success',
        count: 0,
        sessions: []
    };
    var queryDispatcherUserName = req.query.dispatcherUserName;
    var queryWorkerUserName = req.query.workerUserName;
    var queryReadonly = util.toBoolean(req.query.readonly);
    var queryReviewerUserName = req.query.reviewer;
    var queryStatus = req.query.status;
    var queryIsRejected = util.toBoolean(req.query.isRejected);
    var queryIsRedirected = util.toBoolean(req.query.isRedirected);
    var find_key = {}, sort_key = {};

    var lastIndex = req.query.last;
    var limit = parseInt(req.query.limit) || 100;
    sort_key.index = 'desc';

    if(lastIndex && isNaN(parseInt(lastIndex))) {
        return res.json({
            code: 1,
            message: 'Invalid parameter last: ' + lastIndex
        });
    }

    switch(req.session.user.role) {
        case User.Role.Reviewer:
            sort_key.isUrged = 'desc';
            find_key.reviewer = req.session.user._id;
            break;
        case User.Role.Worker:
            sort_key.isUrged = 'desc';
            find_key.worker = req.session.user._id;
            break;
        case User.Role.Dispatcher:
            break;
        case User.Role.System:
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
    if(lastIndex) {
        find_key.index = {
            $lt: new Date(parseInt(lastIndex))
        }
    }

    Session.model.find(find_key)
        .limit(limit)
        .sort(sort_key)
        .populate('dispatcher', 'username')
        .populate('worker', 'username')
        .populate('reviewer', 'username')
        .populate('income')
        .populate('reply')
        .populate('operations.mail')
        .exec(function(err, sessions){
            if (err) {
                Log.e({req: req}, err);
                return res.json({
                    code: 1,
                    message: 'Failed to fetch result'
                });
            }
            ret.count = sessions.length;
            async.each(sessions, function(session, callback){
                var list_element = {
                    id: session._id,
                    index: session.index,
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
                var receiverName, operatorName;
                async.parallel([
                    function(callback){
                        if(list_element.lastOperation && list_element.lastOperation.receiver){
                            User.model.findById(list_element.lastOperation.receiver)
                                .exec(function(err, receiver){
                                    if(err) {
                                        res.json({
                                            code: -1,
                                            message: 'Internal error'
                                        });
                                    }
                                    receiverName = receiver.username;
                                    callback(err);
                                })
                        }else{
                            callback();
                        }
                    },
                    function(callback){
                        if(list_element.lastOperation && list_element.lastOperation.operator){
                            User.model.findById(list_element.lastOperation.operator)
                                .exec(function(err, operator){
                                    if(err) {
                                        res.json({
                                            code: -1,
                                            message: 'Internal error'
                                        });
                                    }
                                    operatorName = operator.username;
                                    callback(err);
                                })
                        }else{
                            callback();
                        }
                    }
                ], function(err){
                    if(err){
                        return res.json({
                            code: 1,
                            message: err.toString()
                        });
                    }
                    if(list_element.lastOperation) {
                        list_element.lastOperation = {
                            type: list_element.lastOperation.type,
                            operator: operatorName,
                            receiver: receiverName,
                            message: list_element.lastOperation.message,
                            time: list_element.lastOperation.time,
                            mail: list_element.lastOperation.mail
                        }
                    }
                    if(session.income) {
                        list_element.income = {
                            subject: session.income.subject,
                            from: session.income.from,
                            to: session.income.to,
                            labels: null,
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
                    if (session.income) {
                        getLabelsFromIdArray(session.income.labels, function(err, labels) {
                            list_element.income.labels = labels;
                            ret.sessions.push(list_element);
                            callback();
                        });
                    } else {
                        ret.sessions.push(list_element);
                        callback();
                    }
                })
            }, function(err) {
                if (err) {
                    return res.json({
                        code: 1,
                        message: err.toString()
                    });
                }
                ret.done = (ret.sessions.length < limit);
                res.json(ret);
            });
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