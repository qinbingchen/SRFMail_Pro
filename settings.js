exports = module.exports = {
    mongodb: 'mongodb://localhost/SRFMail',
    redis: {
        host: 'localhost',
        port: 6379
    },
    listen: 8844,
    mail: {
        imap: {
            host: 'imap.163.com',
            port: 993
        },
        smtp: {
            host: 'smtp.163.com',
            port: 465
        },
        username: '15652915887@163.com',
        password: 'tmytmsftpkkflzhm'
    }
};

// Hard code will be deprecated when system module finished