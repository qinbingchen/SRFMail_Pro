exports = module.exports = {
    mongodb: 'mongodb://localhost/SRFMail',
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