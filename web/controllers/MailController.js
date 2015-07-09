SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize", "userServices", "mailServices",
    function ($scope, $http, $cookies, $sanitize, userServices, mailServices) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = userServices.current_user_type;
        $scope.current_user_name = userServices.current_user_name;
        $scope.current_user_display_name = userServices.current_user_display_name;
        $scope.selected_category = mailServices.selected_category;
        $scope.selected_mail_id = mailServices.selected_mail_id;
        $scope.fw_show = false;
        $scope.work_sendback_flag = false;// 当退回按钮点击一次之后 disable掉。
        $scope.review_pass_flag = false;

        $scope.$on("broadcast_mail_did_select", function () {
            $scope.show_mail_loader = true;

            $scope.current_user_type = userServices.current_user_type;
            $scope.current_user_name = userServices.current_user_name;
            $scope.current_user_display_name = userServices.current_user_display_name;
            $scope.selected_category = mailServices.selected_category;
            $scope.selected_mail_id = mailServices.selected_mail_id;

            mailServices.load_mail(
                function () {
                    $scope.deadline_time = "";
                    $scope.selected_mail = mailServices.selected_mail;
                    if ($scope.selected_mail_id != "" && $scope.selected_mail.operations.length > 0) {
                        var sessionHistory = new SessionHistoryKit.SessionHistory("operation-history");
                        sessionHistory.setOperations(mailServices.selected_mail.operations, {});
                        sessionHistory.draw();
                    }
                    if ($scope.selected_mail_id != "") {
                        if ($scope.selected_mail.income) {
                            var time = new Date($scope.selected_mail.income.time);
                            $scope.income_time = time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate()
                                + " " + time.getHours() + ":" + ("0" + time.getMinutes()).slice(-2);
                            if ($scope.selected_mail.income.deadline) {
                                var time = new Date($scope.selected_mail.income.deadline);
                                $scope.deadline_time = time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate()
                                    + " " + time.getHours() + ":" + ("0" + time.getMinutes()).slice(-2);
                            }
                        }
                        if ($scope.selected_mail.reply) {
                            var time = new Date($scope.selected_mail.reply.time);
                            $scope.reply_time = time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate()
                                + " " + time.getHours() + ":" + ("0" + time.getMinutes()).slice(-2);
                        }
                    }
                    $scope.show_mail_loader = false;
                },
                function () {}
            );
        });

        $scope.show_dispatch = function () {
            $scope.$emit("emit_show_dispatch");
        };

        $scope.show_label = function () {
            $scope.$emit("emit_show_label");
        };

        $scope.show_forward = function () {
            $scope.$emit("emit_show_forward");
        };

        $scope.show_reject = function () {
            $scope.$emit("emit_show_reject");
        };

        $scope.pass = function () {
            $http.post("/api/action/worker/pass", {
                id: mailServices.selected_mail_id
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    toastr.success("邮件已处理");
                } else {
                    console.log(data);
                    toastr.error("出现错误");
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                toastr.error("出现错误");
            });
        };

        $scope.review_pass = function () {
            $scope.review_pass_flag = true;
            if ($scope.review_reject_show) {
                $scope.review_reject_show = false;
            }
            $http.post("/api/action/reviewer/pass", {
                id: mailServices.selected_mail_id
            }).success(function (data, status, headers, config) {
                toastr.success('审核通过', '');
                $scope.load_mail_list();
                $scope.review_pass_flag = false;
            }).error(function () {
                toastr.error('请重试', '');
                $scope.review_pass_flag = false;
            });

        };

        $scope.review_refuse = function () {
            $scope.review_reject_show = !$scope.review_reject_show;
        };

        $scope.review_refuse_confirm = function () {
            $scope.review_reject_show = false;
            $http.post("/api/action/reviewer/reject", {
                id: mailServices.selected_mail_id,
                message: $scope.review_comment_textarea
            }).success(function () {
                toastr.success('成功退回', '');
                $scope.load_mail_list();
            }).error(function () {
                toastr.error('请重试', '');
            });

        };
        $scope.review_refuse_cancel = function () {
            $scope.review_reject_show = false;
        };



        $scope.remind = function () {
            $http.post("/api/action/dispatcher/urge", {
                id: $scope.selected_mail_id
            }).success(function (data, status, headers, config) {
                $scope.load_mail_list();
                toastr.success('成功提醒', '');
                console.log(data);
            }).error(function (data, status, headers, config) {
                toastr.success('提醒失败，请重试', '');
                console.log(data);
            });
        };

        $scope.show_compose = function () {
            $scope.$emit("emit_show_compose");
        };

        $scope.show_reply = function () {
            $scope.$emit("emit_show_reply");
        };

        $scope.show_edit = function () {
            $scope.$emit("emit_show_edit");
        };

        $scope.worker_sendback = function () {
            $scope.work_sendback_flag = !$scope.work_sendback_flag;

            $http.post('/api/action/worker/redirect', {
                'id': $scope.selected_mail_id
            }).success(function () {
                toastr.success('成功退回', '');
                $scope.load_mail_list();
                $scope.work_sendback_flag = !$scope.work_sendback_flag;
            }).error(function () {
                toastr.error('退回失败，请重试', '');
                $scope.work_sendback_flag = !$scope.work_sendback_flag;
            });
        };

    }]);
