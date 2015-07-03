var cluster = require('cluster');

if(cluster.isMaster) {
    var i;
    var os = require('os');
    var ThreadNum = os.cpus.length > 3 ? os.cpus.length : 3;
    var Threads = [];
    var Log = require('./lib/log')('[APP]');
    for(i = 0; i < ThreadNum; i++) {
        var worker = cluster.fork();
        Threads.push(worker);
        setAutoRestart(worker);
    }
    Threads[0].send('receive');
    Threads[1].send('send');
    for(i = 2; i < ThreadNum; i++) {
        Threads[i].send('web');
    }
    function setAutoRestart(worker) {
        worker.on('exit', function (code, signal) {
            if (signal) {
                Log.e("worker was killed by signal: " + signal);
            } else if (code !== 0) {
                Log.e("worker exited with error code: " + code);
            } else {
                Log.d("worker success!");
            }
            Threads.slice(Threads.indexOf(worker), 1);
            worker = cluster.fork();
            Threads.push(worker);
            setAutoRestart(worker);
            worker.send('web');
        });
    }
} else {
    var mongoose = require('mongoose');
    var settings = require('./settings');

    mongoose.connect(settings.mongodb, {
        db: {
            native_parser: true
        },
        server: {
            poolSize: 10,
            socketOptions: {
                keepAlive: 1
            }
        },
        replset: {
            socketOptions: {
                keepAlive: 1
            }
        }
    });

    process.on('message', function(msg) {
        switch(msg) {
            case 'web':
                require('./server/web').start();
                break;
            case 'receive':
                require('./server/receive').start();
                break;
            case 'send':
                require('./server/send').start();
                break;
        }
    })
}