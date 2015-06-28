var cluster = require('cluster');

if(cluster.isMaster) {
    var i;
    var os = require('os');
    var ThreadNum = os.cpus.length > 3 ? os.cpus.length : 3;
    var Threads = [];
    for(i = 0; i < ThreadNum; i++) {
        Threads.push(cluster.fork())
    }
    Threads[0].send('receive');
    Threads[1].send('send');
    for(i = 2; i < ThreadNum; i++) {
        Threads[i].send('web');
    }
} else {
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