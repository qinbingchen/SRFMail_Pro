SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize", "userServices", "mailServices",
    function ($scope, $http, $cookies, $sanitize, userServices, mailServices) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = userServices.current_user_type;
        $scope.selected_category = mailServices.selected_category;
        $scope.selected_mail_id = mailServices.selected_mail_id;
        $scope.fw_show = false;
        $scope.work_sendback_flag = false;// 当退回按钮点击一次之后 disable掉。
        $scope.selected_category = mailServices.selected_category;


        $scope.$on("broadcast_mail_did_select", function () {
            $scope.current_user_type = userServices.current_user_type;
            $scope.selected_category = mailServices.selected_category;
            $scope.selected_mail_id = mailServices.selected_mail_id;

            mailServices.load_mail(
                function () {
                    $scope.selected_mail = mailServices.selected_mail;
                },
                function () {

                }
            );
        });

        $scope.review_pass = function () {
            if ($scope.review_reject_show) {
                $scope.review_reject_show = false;
            }
            $http.post("/api/action/reviewer/pass", {
                id: mailServices.selected_mail_id
            }).success(function (data, status, headers, config) {
                toastr.success('审核通过', '');
                $scope.load_mail_list();
            }).error(function () {
                toastr.error('请重试', '');
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

        $scope.check = function () {
            $http.post("/api/action/worker/pass", {
                id: $scope.selected_mail_id
            }).success(function (data, status, headers, config) {

            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.remind = function() {
                $http.post("/api/action/dispatcher/urge", {
                    id: $scope.selected_mail_id
                }).success(function (data, status, headers, config) {
                    toastr.success('成功提醒','');
                    console.log(data);
                }).error(function (data, status, headers, config) {
                    console.log(data);
                });
        };

        $scope.show_dispatch = function () {
            $scope.dispatch_show = !$scope.dispatch_show;
            $scope.label_show = false;
        };
        $scope.dispatch_show = false;

        $scope.show_label = function () {
            $scope.label_show = !$scope.label_show;
            $scope.dispatch_show = false;
        }
        $scope.label_show = false;


        $scope.show_compose = function () {
            $scope.$emit("emit_show_compose");
        };

        $scope.show_reply = function () {
            $scope.$emit("emit_show_reply");
        };

        $scope.show_edit = function () {
            $scope.$emit("emit_show_edit");
        };


        $scope.show_fw = function () {
            $scope.fw_show = !$scope.fw_show;
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
