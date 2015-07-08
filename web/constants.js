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
                hint: "表示仍未被分发的邮件列表"
            }, {
                name: "dispatched",
                display_name: "已分发",
                hint: "表示已经分发完但尚未被处理人员处理的邮件列表"
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
                display_name: "未处理",
                hint: "表示未处理的邮件列表"
            }, {
                name: "rejected",
                display_name: "未通过审核",
                hint: "表示被审核人员拒绝并退回的邮件列表"
            }, {
                name: "waiting_for_review",
                display_name: "已提交审核",
                hint: "表示已提交审核但审核人员未处理的邮件列表"
            }, {
                name: "success",
                display_name: "已处理",
                hint: "表示已标记成已处理或已成功发送的邮件列表"
            }
        ]
    }, {
        user_type: USER_TYPE.REVIEWER,
        category: [
            {
                name: "pending",
                display_name: "未审核",
                hint: "表示尚未被审核的邮件列表"
            }, {
                name: "sent",
                display_name: "已通过",
                hint: "表示通过审核的邮件列表"
            }, {
                name: "rejected",
                display_name: "已拒绝",
                hint: "表示已拒绝但尚未被处理人员处理的邮件列表"
            }
        ]
    }
];

var EDIT_MODE = {
    COMPOSE: 0,
    REPLY: 1,
    EDIT: 2
};
