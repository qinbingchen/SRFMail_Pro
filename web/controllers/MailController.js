SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize", "userServices", "mailServices",
    function ($scope, $http, $cookies, $sanitize, userServices, mailServices) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = userServices.current_user_type;
        $scope.selected_mail = mailServices.selected_mail;

        $scope.selected_category = mailServices.selected_category;

        $scope.$on("broadcast_mail_did_select", function () {
            $scope.current_user_type = userServices.current_user_type;
            $scope.selected_mail = mailServices.selected_mail;
            $scope.selected_category = mailServices.selected_category;

            $http.get("/api/session/get_detail" + "?id=" + mailServices.selected_mail)
                .success(function (data,status, headers, config) {
                    if (data.code == 0) {
                        $scope.mail = data;
                    } else {
                        console.log(data);
                    }
                }).error(function (data, status, headers, config) {
                    console.log(data);

                });
        });


        $scope.review_pass = function () {
            $http.post("/api/action/reviewer/pass", {
                id: mailServices.selected_mail
            }).success(function (data, status, headers, config) {
                toastr.success('审核通过', '');
            });

        };

        $scope.review_refuse = function () {
            $scope.review_reject_show = !$scope.review_reject_show;
        };

        $scope.review_refuse_confirm = function () {
            $scope.review_reject_show = false;
            $http.post("/api/action/reviewer/reject", {
                id: mailServices.selected_mail,
                message: $scope.review_comment_textarea
            }).success(function () {
                toastr.success('成功退回', '');
            }).error(function () {
                alert("review refuse confirm is error");
            });

        };
        $scope.review_refuse_cancel = function () {

            $scope.review_reject_show = false;

        };
        $scope.review_edit = function () {
            $scope.$emit("emit_show_compose");
        };
        $scope.check = function () {
            $http.post("/api/action/worker/pass", {
                id: $scope.selected_mail
            }).success(function (data, status, headers, config) {

            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.show_dispatch = function () {
            $scope.dispatch_show = !$scope.dispatch_show;
        };

        $scope.dispatch_show = false;

        $scope.show_compose = function () {
            $scope.$emit("emit_show_compose");
        };

        $scope.show_reply = function () {
            $scope.$emit("emit_show_reply");
        };

        $scope.show_edit = function () {
            $scope.$emit("emit_show_edit");
        };

    }]);
