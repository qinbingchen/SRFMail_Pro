SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.mail_list = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = mailServices.current_user_type;
        $scope.selected_mail_id = mailServices.selected_mail_id;

        $scope.$on("broadcast_category_did_select", function () {
            $scope.filtered_mail_list = mailServices.filtered_mail_list;
            if ($scope.filtered_mail_list.length != 0) {
                $scope.select_mail($scope.filtered_mail_list[0]);
            } else {
                mailServices.selected_mail_id = "";
                $scope.selected_mail_id = mailServices.selected_mail_id;
                $scope.$emit("emit_mail_did_select");
            }
        });

        $scope.select_mail = function (mail) {
            mailServices.selected_mail_id = mail.id;
            $scope.selected_mail_id = mailServices.selected_mail_id;
            $scope.$emit("emit_mail_did_select");
        };
    }
]);
