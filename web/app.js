var SRFMailProApp = angular.module("SRFMailProApp", [
    "ngCookies",
    "ngSanitize",
    "SRFMailProControllers"
]);

SRFMailProApp.service("userServices", ["$http", "$cookies",
    function($http, $cookies) {
        var that = this;

        this.current_user_type = $cookies.get("user_type") == null ? USER_TYPE.NONE : parseInt($cookies.get("user_type"));
        this.current_user_id = $cookies.get("user_id") == null ? "" : $cookies.get("user_id");
        this.current_user_name = $cookies.get("user_name") == null ? "" : $cookies.get("user_name");

        this.login = function (username, password, success, error) {
            $http.post("/api/user/login", {
                user: username,
                password: password
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $cookies.put("user_type", data.role);
                    $cookies.put("user_id", data.id);
                    $cookies.put("user_name", data.name);
                    that.current_user_type = data.role;
                    that.current_user_id = data.id;
                    that.current_user_name = data.name;
                    success();
                } else {
                    console.log(data);
                    error()
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                error()
            });
        };

        this.logout = function () {
            $cookies.remove("connect.sid");
            $cookies.remove("user_type");
            $cookies.remove("user_id");
            $cookies.remove("user_name");
        };
    }
]);

SRFMailProApp.service("mailServices",  ["$http", "$cookies", "userServices",
    function($http, $cookies, userServices) {
        var that = this;

        this.mail_list = [];
        this.filtered_mail_list = [];
        this.selected_mail = "";
        this.selected_category = userServices.current_user_type == USER_TYPE.NONE ? null : CATEGORY_LIST[userServices.current_user_type].category[0];

        this.load_mail_list = function (success, error) {
            $http.get("/api/session/get_list")
                .success(function (data, status, headers, config) {
                    that.mail_list = data["sessions"];
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
            // TODO SORT MAIL LIST
        };

        this.filter_mail_list = function () {
            console.log(userServices);
            this.filtered_mail_list = this.mail_list.filter(function (mail) {
                switch (userServices.current_user_type) {
                    case USER_TYPE.DISPATCHER:
                        switch (that.selected_category.name) {
                            case "pending":
                                return mail.status == STATUS.NEW;
                            case "dispatched":
                                return mail.status == STATUS.DISPATCHED;
                            case "processed":
                                return mail.status == STATUS.WAITINGFORREVIEW || mail.status == STATUS.WAITINGFORSEND || mail.status == STATUS.SUCCESS;
                            default:
                                return false;
                        }
                    case USER_TYPE.WORKER:
                        if (mail.worker != that.current_user_name) {
                            return false;
                        } else {
                            switch (that.selected_category.name) {
                                case "pending":
                                    return mail.status == STATUS.DISPATCHED
                                        && (mail.lastOperation == OPERATION_TYPE.DISPATCH || mail.lastOperation == OPERATION_TYPE.REDIRECT);
                                case "rejected":
                                    return mail.status == STATUS.DISPATCHED && mail.lastOperation == OPERATION_TYPE.REJECT;
                                case "waiting_for_review":
                                    return mail.status == STATUS.WAITINGFORREVIEW;
                                case "success":
                                    return mail.status == STATUS.SUCCESS;
                                default:
                                    return false;
                            }
                        }
                    case USER_TYPE.REVIEWER:
                        if (mail.reviewer != that.current_user_name) {
                            return false;
                        } else {
                            switch (that.selected_category.name) {
                                case "pending":
                                    return mail.status == STATUS.WAITINGFORREVIEW;
                                case "sent":
                                    return mail.status == STATUS.WAITINGFORSEND || mail.status == STATUS.SUCCESS;
                                case "rejected":
                                    return mail.status == STATUS.DISPATCHED;
                                default:
                                    return false;
                            }
                        }
                    default:
                        console.log("ddd");
                        return false;
                }
            });
        }
    }
]);

toastr.options = {
    "newestOnTop": true,
    "timeOut": "3000"
};