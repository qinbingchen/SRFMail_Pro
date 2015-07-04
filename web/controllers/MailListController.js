SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.mail_list = true;
        $scope.check_partial_load_status();

        $scope.selectMail = function(mail){
            selected_mail = mail;
        };

        $scope.changeClass=function(mail){
            if(mail.sender==selected_mail.sender)
                return 'mail selected';
            else
                return 'mail';
        }
        }]);
