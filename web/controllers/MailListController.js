SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

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
