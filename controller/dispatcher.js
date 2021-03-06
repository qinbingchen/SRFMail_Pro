/**
 * Created by renfei on 15/7/6.
 */

var mongoose = require('mongoose');
var Session = require('../model').session;
var Mail = require('../model').mail;
var User = require('../model').user;
var Label = require('../model').label;
var _ = require('lodash');
var async = require('async');
var router = new require('express').Router();
var Log = require('../lib/log')('[controller-session]');

Array.prototype.getUnique = function(){
    var u = {}, a = [];
    for (var i = 0, l = this.length; i < l; ++i){
        if (u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
};

var dispatch = function(req, res, next) {
    var sessionId = req.body.id;
    var readonlyWorkers, readreplyWorkers;
    var deadline;
    if (req.body.deadline) {
        deadline = new Date(req.body.deadline);
        if (deadline.toString() == 'Invalid Date') {
            return res.json({
                code: 1,
                message: 'Error: Invalid date string ' + req.body.deadline + '.'
            });
        }
        if (deadline < new Date()) {
            return res.json({
                code: 1,
                message: 'Error: Designated deadline (' + deadline.toLocaleString() + ') is earlier then now (' + (new Date()).toLocaleString() + ').'
            });
        }
    }

    try {
        readonlyWorkers = JSON.parse(req.body.readonly);
        readreplyWorkers = JSON.parse(req.body.readreply);
    } catch (e) {
        return res.json({
            code: 1,
            message: 'Error: Invalid JSON received, please ensure that readonly / readreply parameters hold valid JSON string representations.'
            + ' Reason: ' + e.toString()
            + ' ReadonlyWorkers: ' + req.body.readonly
            + ' ReadreplyWorkers: ' + req.body.readreply
        });
    }

    var currentUser = req.session.user;
    var originalSession, incomeMail;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Error: Invalid session ID ' + sessionId + '.'
        });
    }

    async.series([
        // populate originalSession & currentUser
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _originalSession) {
                originalSession = _originalSession;
                callback(err, 'get original session');
            });
        },
        function(callback) {
            if (!deadline || !originalSession) {
                callback();
                return;
            }
            Mail.model.findById(mongoose.Types.ObjectId(originalSession.income), function(err, _incomeMail) {
                incomeMail = _incomeMail;
                if (!incomeMail) {
                    callback(err, 'get income mail');
                    return;
                }
                incomeMail.deadline = deadline;
                incomeMail.save(function(err) {
                    callback(err, 'update income mail');
                });
            });
        }
    ], function(err) {
        if (err) {
            return res.json({
                code: 1,
                message: err.toString()
            });
        }

        if (!originalSession) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find session with ID " + sessionId + "."
            });
        }

        if (deadline && !incomeMail) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find mail with ID " + originalSession.income + " from session with ID " + originalSession._id + "."
            });
        }

        if (originalSession.status != Session.Status.New) {
            return res.json({
                code: 1,
                message: "Error: The session's status is " + originalSession.status + " therefore couldn't be dispatched. Aborting."
            });
        }

        // spawn sessions iteratively
        var workers = (readonlyWorkers.concat(readreplyWorkers)).getUnique();
        var effectiveWorkers = [];
        async.each(workers, function(worker, callback) {
            User.model.findOne({
                username: worker
            }, function(err, designatedWorker) {
                if (!designatedWorker) {
                    callback();
                    return;
                }
                if (designatedWorker.role != User.Role.Worker) {
                    callback();
                    return;
                }
                effectiveWorkers.push(worker);
                var session = new Session.model({
                    income: originalSession.income,
                    dispatcher: currentUser._id,
                    worker: designatedWorker._id,
                    readonly: (readonlyWorkers.indexOf(worker) > -1),
                    operations: [],
                    status: Session.Status.Dispatched,
                    isRejected: false,
                    isRedirected: false
                });
                originalSession.operations.forEach(function(row) {
                    session.operations.push(row);
                });
                var operationDict = {
                    type: Session.Type.Dispatch,
                    operator: currentUser._id,
                    receiver: designatedWorker._id,
                    time: new Date()
                };
                session.operations.push(operationDict);
                session.save(function(err) {
                    callback(err);
                });
            });
        }, function(err) {
            if (err) {
                return res.json({
                    code: 1,
                    message: err.toString()
                });
            }

            if (effectiveWorkers.length == 0) {
                return res.json({
                    code: 1,
                    message: "Error: None of the workers you designated is valid. A user is" +
                    " considered a valid worker if and only if *all* of the following criteria" +
                    " are met: 1) the user can be found in our database; 2) the user is a worker."
                });
            }

            Session.model.findByIdAndRemove(mongoose.Types.ObjectId(sessionId), function(err) {
                if (err) {
                    return res.json({
                        code: 1,
                        message: err.toString()
                    });
                }
                return res.json({
                    code: 0,
                    message: "Success: Workers " + effectiveWorkers.join(", ") + " designated."
                });
            });
        });
    });
};

var urge = function(req, res, next) {
    var sessionId = req.body.id;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Error: Invalid session ID ' + sessionId + '.'
        });
    }

    Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, session) {
        if (err || !session) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find session by ID " + sessionId + ": " + err.toString
            });
        }

        if (session.status != Session.Status.Dispatched) {
            return res.json({
                code: 1,
                message: "Error: Couldn't urge session with status " + session.status + ": only dispatched sessions can be urged."
            });
        }

        session.isUrged = true;
        session.save(function(err) {
            if (err) {
                return res.json({
                    code: 1,
                    message: err.toString
                });
            }
            return res.json({
                code: 0,
                message: "Successfully urged the worker."
            });
        });
    });
};

var list_label = function(req, res, next) {
    var list = {
        code: 0,
        message: 'success',
        labels: []
    };
    Label.model.find({}, function(err, labels){
        if(err){
            return res.json({
                code: 1,
                message: "couldn't load labels!"
            });
        }
        labels.forEach(function(label){
            list.labels.push({
                name: label.name,
                color: label.color
            });
        });
        res.json(list);
    });
};

var is_valid_color = function(color_str){
    if(color_str.length != 7){
        return false;
    }
    if(color_str[0] != '#')return false;
    for(var i = 1 ; i < 7 ; i ++){
        var c = color_str[i];
        if(!((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f'))){
            return false;
        }
    }
    return true;
};

var set_all_label = function(req, res, next){
    var labels = req.body.labels;
    try {
        labels = JSON.parse(req.body.labels);
    } catch (e) {
        return res.json({
            code: 1,
            message: 'Error: Invalid JSON received, please ensure that the labels parameters hold valid JSON string representation.'
            + ' ParseError: ' + e.toString()
            + ' Labels: ' + req.body.labels
        });
    }
    var newLabels = [];
    async.each(labels, function (label, callback) {
        if(!label.name){
            callback(1);
            return;
        }
        if(!label.color || !is_valid_color(label.color)){
            label.color = '#C0C0C0'
        }
        Label.model.findOne({name: label.name},function(err, db_label){
            if (err) {
                callback();
                return;
            }
            if(db_label){
                db_label.color = label.color;
                db_label.save(function(err){
                    if (err) {
                        callback(1);
                        return;
                    }
                })
            }else{
                newLabels.push({
                    name: label.name,
                    color: label.color
                });
            }
            callback();
            return;
        })
    }, function(err){
        if(err){
            return res.json({
                code: 1,
                message: 'label filter failed'
            })
        }
        Label.model.find({}, function(err, db_labels){
            async.each(db_labels, function(label, callback){
                var find = 0;
                for(var i = 0 ; i < labels.length ; i ++){
                    if(label.name == labels[i].name){
                        find = 1;
                        break;
                    }
                }
                if(find == 0){
                    label.remove(function(err){
                        return callback(err);
                    });
                }else{
                    return callback();
                }
            }, function(err){
                if(err) {
                    return res.json({
                        code: 1,
                        message: 'find failed'
                    });
                }
                Label.model.create(newLabels, function(err) {
                    if(err) {
                        return res.json({
                            code: 1,
                            message: 'Internal error'
                        });
                    }
                    res.json({
                        code: 0,
                        message: 'success'
                    });
                })
            })
        });
    });
};

var set_label = function(req, res, next) {
    var sessionId = req.body.id;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.json({
            code: 1,
            message: 'Error: Invalid session ID ' + sessionId + '.'
        });
    }

    var labels;
    try {
        labels = JSON.parse(req.body.labels);
    } catch (e) {
        return res.json({
            code: 1,
            message: 'Error: Invalid JSON received, please ensure that the labels parameters hold valid JSON string representation.'
            + ' ParseError: ' + e.toString()
            + ' Labels: ' + req.body.labels
        });
    }

    var session, incomeMail;
    async.series([
        function(callback) {
            Session.model.findById(mongoose.Types.ObjectId(sessionId), function(err, _session) {
                session = _session;
                callback(err);
            });
        },
        function(callback) {
            if (session) {
                Mail.model.findById(mongoose.Types.ObjectId(session.income), function(err, _incomeMail) {
                    incomeMail = _incomeMail;
                    callback(err);
                });
            } else {
                callback();
            }
        }
    ], function(err) {
        if (err) {
            return res.json({
                code: 1,
                message: err.toString()
            });
        }

        if (!session) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find session with ID " + sessionId + "."
            });
        }

        if (!incomeMail) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find mail with ID " + session.income + " from session with ID " + session._id + "."
            });
        }

        /*
        if (session.status != Session.Status.New) {
            return res.json({
                code: 1,
                message: "Error: Couldn't set labels for session with status other than 0 (new). The session's status is " + session.status + ". Only new (not yet dispatched) sessions can be set a label. Please, check your session ID."
            });
        }
        */

        labels = labels.getUnique();
        var labels_id = [];
        var cnt = 0;
        labels.forEach(function(label){
            Label.model.findOne({
                name: label
            }, function(err, _label){
                cnt += 1;
                if(err) {
                    Log.e({req: req}, err);
                    return res.json({
                        code: 1,
                        message: 'couldn\'t find label with name ' + label
                    });
                }
                if(_label)labels_id.push(_label._id);
                if(cnt == labels.length){
                    incomeMail.labels = labels_id;
                    incomeMail.save(function(err) {
                        if (err) {
                            return res.json({
                                code: 1,
                                message: err.toString()
                            });
                        }
                        return res.json({
                            code: 0,
                            message: labels.length == 0 ? "Success: All labels removed." : "Success: Labels set to: " + labels.join(', ') + "."
                        });
                    });
                }
            })
        })
    });
};

router.use(function(req, res, next) {
    if (!req.session.user) {
        return res.json({
            code: 1,
            message: 'Error: You are not yet logged in.'
        });
    }
    User.model.findById(mongoose.Types.ObjectId(req.session.user._id), function(err, user) {
        if (err || !user) {
            return res.json({
                code: 1,
                message: "Error: Couldn't find user with ID " + req.session.user._id + "."
            });
        }
        req.session.user = user;
        if (user.role != User.Role.Dispatcher && user.role != User.Role.System) {
            return res.json({
                code: 10,
                message: "Error: Unauthorized: User " + user.username + " with role " + user.role + " isn't a dispatcher."
            });
        }
        next();
    });
});

router.route('/dispatch').post(dispatch);
router.route('/urge').post(urge);
router.route('/set_label').post(set_label);
router.route('/set_all_labels').post(set_all_label);
router.route('/list_labels').get(list_label);

module.exports = router;