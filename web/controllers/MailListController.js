SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.mail_list = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_category_did_select", function () {
            $scope.filtered_mail_list = mailServices.filtered_mail_list;
            if ($scope.filtered_mail_list.length != 0) {
                $scope.selectMail($scope.filtered_mail_list[0]);
            } else {
                $scope.$emit("emit_mail_did_select");
            }
        });

        $scope.selectMail = function (mail) {
            mailServices.selected_mail = mail.id;
            $scope.$emit("emit_mail_did_select");
        };

        $scope.changeClass = function(mail) {
            if (mail.id == mailServices.selected_mail) {
                return 'mail selected';
            } else {
                return 'mail';
            }
        }
    }
]);
