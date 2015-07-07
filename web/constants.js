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
                display_name: "待分发"
            }, {
                name: "dispatched",
                display_name: "已分发"
            }, {
                name: "processed",
                display_name: "已处理"
            }
        ]
    }, {
        user_type: USER_TYPE.WORKER,
        category: [
            {
                name: "pending",
                display_name: "未处理"
            }, {
                name: "rejected",
                display_name: "未通过审核"
            }, {
                name: "waiting_for_review",
                display_name: "已提交审核"
            }, {
                name: "success",
                display_name: "已处理"
            }
        ]
    }, {
        user_type: USER_TYPE.REVIEWER,
        category: [
            {
                name: "pending",
                display_name: "未审核"
            }, {
                name: "sent",
                display_name: "已发送"
            }, {
                name: "rejected",
                display_name: "已退回"
            }
        ]
    }
];

var EDIT_MODE = {
    COMPOSE: 0,
    REPLY: 1,
    EDIT: 2
};
