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

require('./server/web').start();