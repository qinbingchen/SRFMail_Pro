exports = module.exports = {
    mysql: {
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root'
    },
    redis: {
        host: 'localhost',
        port: 6379
    },
    listen: 8888,
    mail: {
        imap: {
            host: '',
            port: ''
        },
        smtp: {
            host: '',
            port: ''
        },
        username: '',
        password: ''
    }
};

// Hard code will be deprecated when system module finished