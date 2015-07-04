var ROOT_URL = "http://123.57.64.46:8888";

var STATUS = {
    NEW: 0,
    DISPATCHED: 1,
    WAITINGFORREVIEW: 2,
    WAITINGFORSEND: 3,
    SUCCESS: 4,
    PERMERROR: 5,
    TEMPERROR: 6
};

var OPERATION_TYPE = {
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
};

var USER_TYPE = {
    NONE: -1,
    ADMIN: 0,
    DISPATCHER: 1,
    WORKER: 2,
    REVIEWER: 3
};

var CATEGORY_LIST = [
    {
        user_type: USER_TYPE.ADMIN,
        category: []
    }, {
        user_type: USER_TYPE.DISPATCHER,
        category: [
            {
                name: "pending",
                display_name: "待分发",
                before: null
            }, {
                name: "dispatched",
                display_name: "已分发",
                before: "pending"
            }, {
                name: "processed",
                display_name: "已处理",
                before: "dispatched"
            }
        ]
    }, {
        user_type: USER_TYPE.WORKER,
        category: [
            {
                name: "inbox",
                display_name: "收件箱",
                before: "inbox"
            }, {
                name: "inbox",
                display_name: "收件箱",
                before: "inbox"
            }, {
                name: "inbox",
                display_name: "收件箱",
                before: "inbox"
            }
        ]
    }, {
        user_type: USER_TYPE.REVIEWER,
        category: [
            {
                name: "inbox",
                display_name: "收件箱",
                before: "inbox"
            }, {
                name: "inbox",
                display_name: "收件箱",
                before: "inbox"
            }, {
                name: "inbox",
                display_name: "收件箱",
                before: "inbox"
            }
        ]
    }
];

