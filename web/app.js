var SRFMailProApp = angular.module("SRFMailProApp", [
    "ngCookies",
    "ngSanitize",
    "SRFMailProControllers"
]);

SRFMailProApp.service("userServices", ["$http", "$cookies",
    function($http, $cookies) {
        var that = this;

        this.current_user_type = $cookies.get("user_type") == undefined ? USER_TYPE.NONE : parseInt($cookies.get("user_type"));
        this.current_user_id = $cookies.get("user_id") == undefined ? "" : $cookies.get("user_id");
        this.current_user_name = $cookies.get("user_name") == undefined ? "" : $cookies.get("user_name");
        this.current_user_display_name = $cookies.get("user_display_name") == undefined ? "" : $cookies.get("user_display_name");

        this.login = function (username, password, success, error) {
            $http.post("/api/user/login", {
                user: username,
                password: password
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $cookies.put("user_type", data.role);
                    $cookies.put("user_id", data.id);
                    $cookies.put("user_name", username);
                    $cookies.put("user_display_name", data.name);
                    that.current_user_type = data.role;
                    that.current_user_id = data.id;
                    that.current_user_name = username;
                    that.current_user_display_name = data.name;
                    success();
                } else {
                    console.log(data);
                    error();
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                error();
            });
        };

        this.logout = function (success, error) {
            $cookies.remove("connect.sid");
            $cookies.remove("user_type");
            $cookies.remove("user_id");
            $cookies.remove("user_name");
            $cookies.remove("user_display_name");
            $http.post("/api/user/logout")
                .success(function (data, status, headers, config) {
                    if (data.code == 0) {
                        success();
                    } else {
                        console.log(data);
                        error();
                    }
                }).error(function (data, status, headers, config) {
                    console.log(data);
                    error();
                }
            );
        };
    }
]);

SRFMailProApp.service("mailServices", ["$http", "$cookies", "userServices",
    function($http, $cookies, userServices) {
        var that = this;

        this.selected_category = userServices.current_user_type == USER_TYPE.NONE ? null : CATEGORY_LIST[userServices.current_user_type].category[0];
        this.mail_list = [];
        this.filtered_mail_list = [];
        this.selected_mail_id = "";
        this.selected_mail = null;

        this.load_mail_list = function (success, error) {
            $http.get("/api/session/get_list")
                .success(function (data, status, headers, config) {
                    that.mail_list = data["sessions"];
                    that.mail_list.map(function (mail) {
                        var effectiveDate = new Date();
                        if (mail.lastOperation) {
                            effectiveDate = new Date(mail.lastOperation.time);
                        } else if (mail.income) {
                            effectiveDate = new Date(mail.income.time);
                        } else {
                            console.error('warning: mail dont have valid date');
                        }
                        mail.effectiveDate = effectiveDate;
                        mail.display_time = effectiveDate.getFullYear() + '/' + (effectiveDate.getMonth() + 1) + '/' + effectiveDate.getDate()
                            + ' ' + ('0' + effectiveDate.getHours()).slice(-2) + ':' + ('0' + effectiveDate.getMinutes()).slice(-2);
                    });
                    success();
                }).error(function (data, status, headers, config) {
                    console.log(data);
                    error();
                }
            );
        };

        this.select_category = function (category) {
            this.selected_category = category;
            this.filter_mail_list();

            this.filtered_mail_list.sort(function(aMail, anotherMail) {
                if (aMail.effectiveDate.getTime() == anotherMail.effectiveDate.getTime()) {
                    return 0;
                }
                return aMail.effectiveDate.getTime() < anotherMail.effectiveDate.getTime() ? 1 : -1;
            });
        };

        this.filter_mail_list = function () {
            this.filtered_mail_list = this.mail_list.filter(function (mail) {
                switch (userServices.current_user_type) {
                    case USER_TYPE.DISPATCHER:
                        switch (that.selected_category.name) {
                            case "pending":
                                return mail.status == STATUS.NEW;
                            case "dispatched":
                                return mail.status == STATUS.DISPATCHED;
                            default:
                                return false;
                        }
                    case USER_TYPE.WORKER:
                        if (!mail.worker || mail.worker != userServices.current_user_name) {
                            return false;
                        } else {
                            switch (that.selected_category.name) {
                                case "pending":
                                    return mail.status == STATUS.DISPATCHED && mail.lastOperation.type != OPERATION_TYPE.REJECT;
                                case "rejected":
                                    return mail.status == STATUS.DISPATCHED && mail.lastOperation.type == OPERATION_TYPE.REJECT;
                                case "waiting_for_review":
                                    return mail.status == STATUS.WAITINGFORREVIEW;
                                case "success":
                                    return mail.status == STATUS.WAITINGFORSEND || mail.status == STATUS.SUCCESS;
                                default:
                                    return false;
                            }
                        }
                    case USER_TYPE.REVIEWER:
                        if (!mail.reviewer || mail.reviewer != userServices.current_user_name) {
                            return false;
                        } else {
                            switch (that.selected_category.name) {
                                case "pending":
                                    return mail.status == STATUS.WAITINGFORREVIEW;
                                case "passed":
                                    return mail.status == STATUS.WAITINGFORSEND || mail.status == STATUS.SUCCESS;
                                case "rejected":
                                    return mail.status == STATUS.DISPATCHED;
                                default:
                                    return false;
                            }
                        }
                    default:
                        return false;
                }
            });
        };

        this.load_mail = function (success, error) {
            if (this.selected_mail_id == "") {
                that.selected_mail = null;
                success();
            } else {
                $http.get("/api/session/get_detail?id=" + this.selected_mail_id)
                    .success(function (data, status, headers, config) {
                        if (data.code == 0) {
                            that.selected_mail = data;
                            success();
                        } else {
                            console.log(data);
                            error()
                        }
                    }).error(function (data, status, headers, config) {
                        console.log(data);
                        error()
                    }
                );
            }
        };
    }
]);

toastr.options = {
    "newestOnTop": true,
    "timeOut": "3000"
};

var redactor_options = {
    lang: "zh_cn",
    imageUpload: "/api/attachments/upload",
    fileUpload: "/api/attachments/upload",
    imageUploadCallback: function (image, json) {
        $(image).attr("src", "/api/attachments/download?id=" + json.file);
    },
    fileUploadCallback: function (link, json) {
        $(link).attr("href", "/api/attachments/download?id=" + json.file);
    }
};