SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize", "userServices", "mailServices",
    function ($scope, $http, $cookies, $sanitize, userServices, mailServices) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = userServices.current_user_type;
        $scope.selected_mail_id = mailServices.selected_mail_id;

        $scope.$on("broadcast_mail_did_select", function () {
            $scope.current_user_type = userServices.current_user_type;
            $scope.selected_mail_id = mailServices.selected_mail_id;

            mailServices.load_mail(
                function () {
                    $scope.mail = mailServices.selected_mail;
                },
                function () {

                }
            );
        });

        $scope.check = function () {
            $http.post("/api/action/worker/pass", {
                id: $scope.selected_mail_id
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
