SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize", "userServices", "mailServices",
    function ($scope, $http, $cookies, $sanitize, userServices, mailServices) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = userServices.current_user_type;
        $scope.selected_mail = mailServices.selected_mail;

        $scope.$on("broadcast_mail_did_select", function () {
            $scope.current_user_type = userServices.current_user_type;
            $scope.selected_mail = mailServices.selected_mail;

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
    }]);
