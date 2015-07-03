var CONSTANTS = {
    "ROOT_URL": "http://api.51zhiquan.com",

    "STATUS": {
        NEW: 0,
        DISPATCHED: 1,
        WAITINGFORREVIEW: 2,
        WAITINGFORSEND: 3,
        SUCCESS: 4,
        PERMERROR: 5,
        TEMPERROR: 6
    },

    "OPERATION_TYPE": {
        NOTANOPERATION: 0,
        DISPATCH: 1,
        REDIRECT: 2,
        SUBMITFORREVIEW: 3,
        REJECT: 4,
        PASS: 5,
        SUBMITFORSEND: 6,
        RETRY: 7,
        ABORT: 8,
        SEND: 9,
        MARKFAILED: 10,
        MARKSUCCESS: 11
    },

    "USER_TYPE": {
        ADMIN: 0,
        DISPATCHER: 1,
        WORKER: 2,
        REVIEWER: 3
    }
};
