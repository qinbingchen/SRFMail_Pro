var System = require('../model').system;
var User = require('../model').user;
var Log = require('../lib/log')();
var async = require('async');
var mongoose = require('mongoose');

var router = require('express').Router();

var getUserList = function(req, res) {
    User.find({}).populate('defaultReviewer').exec(function(err, users) {
        if(err) {
            Log.e({req: req}, err);
            return res.json({
                code: 0,
                message: err.toString()
            });
        }
        var dispatcher = [];
        var worker = [];
        var reviewer = [];
        var system = [];
        users.forEach(function(row) {
            if(row.role == User.Role.Dispatcher) {
                dispatcher.push({
                    username: row.username,
                    name: row.name,
                    gender: row.gender
                });
            } else if(row.role == User.Role.Worker) {
                worker.push({
                    username: row.username,
                    name: row.name,
                    gender: row.gender,
                    defaultReviewer: row.defaultReviewer && {
                        username: row.defaultReviewer.username,
                        name: row.defaultReviewer.name,
                        gender: row.defaultReviewer.gender
                    }
                });
            } else if(row.role == User.Role.Reviewer) {
                reviewer.push({
                    username: row.username,
                    name: row.name,
                    gender: row.gender
                });
            } else if(row.role == User.Role.System) {
                system.push({
                    username: row.username,
                    name: row.name,
                    gender: row.gender
                });
            }
        });
        res.json({
            code: 0,
            message: 'success',
            dispatcher: dispatcher,
            worker: worker,
            reviewer: reviewer,
            system: system
        });
    });
};

var addUser = function(req, res) {
    var username = req.body.user;
    var password = req.body.password;
    var name = req.body.name;
    var gender = req.body.gender;
    var role = req.body.role;
    var defaultReviewer = req.body.defaultReviewer;

    if(role < 0 || role > 3) {
        return res.json({
            code: 1,
            message: 'Invalid role'
        });
    }

    if(gender < 0 || gender > 2) {
        return res.json({
            code: 1,
            message: 'Invalid gender'
        });
    }

    async.series([
        function(cb) {
            User.model.find({
                username: username
            }, function(err, users) {
                if(err) {
                    Log.e(err);
                    return cb(err)
                }
                if(users.length > 0) {
                    return cb(new Error('Username exists'));
                }
                cb();
            });
        },
        function(cb) {
            if(!defaultReviewer) {
                cb();
            } else {
                User.findOne({
                    username: defaultReviewer
                }, function(err, user) {
                    if(err) {
                        Log.e(err);
                        return cb(err)
                    }
                    if(!user) {
                        return cb(new Error('Default Reviewer not exist'));
                    }
                    defaultReviewer = user._id;
                    cb();
                });
            }
        },
        function(cb) {
            var user = new User.model({
                username: username,
                password: password,
                name: name,
                gender: gender,
                role: role,
                defaultReviewer: defaultReviewer
            });
            user.save(cb)
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

var removeUser = function(req, res) {
    User.model.findOneAndRemove({
        username: req.body.user
    }, function(err, user) {
        if(err) {
            Log.e({req: req}, err);
            return res.json({
                code: 0,
                message: err.toString()
            });
        }
        if(!user) {
            return res.json({
                code: 1,
                message: 'Not Found'
            });
        }
        res.json({
            code: 0,
            message: 'success'
        });
    })
};

var update = function(req, res) {
    async.series([
        function(cb) {
            if(typeof req.body.role != 'undefined' && (req.body.role < 0 || req.body.role > 3)) {
                cb(new Error('Invalid role'));
            } else {
                cb();
            }
        },
        function(cb) {
            if(typeof req.body.gender != 'undefined' && (req.body.gender < 0 || req.body.gender > 2)) {
                cb(new Error('Invalid gender'));
            } else {
                cb();
            }
        },
        function(cb) {
            if(typeof req.body.defaultReviewer != 'undefined') {
                User.model.findOne({
                    username: req.body.defaultReviewer
                }, function(err, user) {
                    if(err) {
                        Log.e(err);
                        return cb(err);
                    }
                    if(!user) {
                        return cb(new Error('Invalid Default Reviewer'));
                    }
                    req.body.defaultReviewer = user._id;
                    cb();
                });
            } else {
                cb();
            }
        },
        function(cb) {
            var updates = {};
            if(req.body.role) {
                updates.role = req.body.role;
            }
            if(req.body.gender) {
                updates.gender = req.body.gender;
            }
            if(req.body.password) {
                updates.password = req.body.password;
            }
            if(req.body.name) {
                updates.name = req.body.name;
            }
            if(req.body.defaultReviewer) {
                updates.defaultReviewer = req.body.defaultReviewer;
            }
            User.model.findOneAndUpdate({
                username: req.body.user
            }, updates, function(err, user) {
                if(err) {
                    Log.e(err);
                    return cb(err);
                }
                if(!user) {
                    return cb(new Error('Invalid username'));
                }
                cb();
            });
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

var setSettings = function(req, res) {
    async.parallel([
        function(cb) {
            System.model.findOneAndUpdate({
                key: 'sender'
            }, {
                value: req.body.sender
            }, {
                upsert: true
            }, cb);
        },
        function(cb) {
            System.model.findOneAndUpdate({
                key: 'mail'
            }, {
                value: req.body.mail
            }, {
                upsert: true
            }, cb);
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
            process.send('Restart Mail');
        }
    });
};

var detail = function(req, res) {
    User.findOne({
        username: req.body.user
    }).populate('defaultReviewer').exec(function(err, user) {
        if(err) {
            Log.e(err);
            res.json({
                code: 1,
                message: err.toString()
            });
        } else {
            var ret = {
                code: 0,
                message: 'success',
                user: user.username,
                name: user.name,
                role: user.role,
                gender: user.gender
            };
            if(user.defaultReviewer) {
                ret.defaultReviewer= {
                    user: user.defaultReviewer.username,
                    name: user.defaultReviewer.name,
                    role: user.defaultReviewer.role,
                    gender: user.defaultReviewer.gender
                };
            }
            res.json(ret);
        }
    });
};

var getSettings = function(req, res) {
    var ret = {};
    async.parallel([
        function(cb) {
            System.model.findOne({
                key: 'sender'
            }, function(err, val) {
                if(err) {
                    return cb(err);
                }
                if(!val) {
                    ret.sender = undefined;
                } else {
                    ret.sender = val.value;
                }
                cb();
            });
        },
        function(cb) {
            System.model.findOne({
                key: 'mail'
            }, function(err, val) {
                if(err) {
                    return cb(err);
                }
                if(!val) {
                    ret.mail = undefined;
                } else {
                    ret.mail = val.value;
                }
                cb();
            });
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

router.use(function(req, res, next) {
    if (!req.session.user) {
        return res.json({
            code: 1,
            message: 'You are not yet logged in'
        });
    }
    console.log(req.body);
    User.model.findById(mongoose.Types.ObjectId(req.session.user._id), function(err, user) {
        if (err || !user) {
            return res.json({
                code: 1,
                message: "Couldn't find user with ID " + req.session.user._id
            });
        }
        req.session.user = user;
        if (user.role != User.Role.System) {
            return res.json({
                code: 1,
                message: "Unauthorized: User " + user.username + " with role " + user.role + " isn't a system"
            });
        }
        next();
    });
});

router.route('/user/list').get(getUserList);
router.route('/user/detail').get(detail);
router.route('/user/add').post(addUser);
router.route('/user/remove').post(removeUser);
router.route('/user/modify').post(update);
router.route('/settings').get(getSettings).post(setSettings);
module.exports = router;