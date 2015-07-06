SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.mail_list = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_did_select_category", function () {
            $scope.filtered_mail_list = mailServices.filtered_mail_list;
        });

        $scope.selectMail = function (mail) {
            mailServices.selected_mail = mail.id;
            $scope.emit("broadcast_did_select_mail");
        };

        $scope.changeClass=function(mail){
            if (mail.id == $scope.selected_mail) {
                return 'mail selected';
            } else {
                return 'mail';
            }
        }
    }
]);

