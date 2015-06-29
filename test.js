//var mongoose = require('mongoose');
//var settings = require('./settings');
//
//mongoose.connect(settings.mongodb, {
//    db: {
//        native_parser: true
//    },
//    server: {
//        poolSize: 10,
//        socketOptions: {
//            keepAlive: 1
//        }
//    },
//    replset: {
//        socketOptions: {
//            keepAlive: 1
//        }
//    }
//});
//
//var session = require('./model').session;
//var user = require('./model').user;
//
//var db = mongoose.connection;
//db.once('open', function() {
//    //var _user = new user.model({
//    //    name: 'test',
//    //    sex: 1
//    //});
//    //_user.save(function() {
//    //    console.log(1);
//    //});
//    //var _session = new session.model({
//    //    worker: _user._id,
//    //    operations: [{
//    //        type: 1,
//    //        operator: _user._id,
//    //        receiver: _user._id,
//    //        message: '123123'
//    //    }]
//    //});
//    //_session.save(function() {
//    //    console.log(2);
//    //});
//    session.model.findOne({}).populate('operations.operator').exec(function() {
//        console.log(arguments);
//    })
//});

var http = require('http');

var url = 'http://www.baidu.com/';

http.get(url, function(res) {
    var data = new Buffer('');
    res.on('data', function(chunk) {
        data = Buffer.concat([data, chunk]);
    });
    res.on('end', function() {
        //data.toString()为get到得内容，字符编码从res.headers中获取
        console.log(data.toString());
    })
});