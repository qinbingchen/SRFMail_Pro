exports = module.exports = {
    mongodb: 'mongodb://localhost/SRFMail',
    redis: {
        host: 'localhost',
        port: 6379
    },
    listen: 8888,
    mail: {
        imap: {
            host: 'imap.qq.com',
            port: 993
        },
        smtp: {
            host: 'smtp.qq.com',
            port: 465
        },
        username: '',
        password: ''
    }
};

// Hard code will be deprecated when system module finished