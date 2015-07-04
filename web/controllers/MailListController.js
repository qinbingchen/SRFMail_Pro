SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

        $scope.selectMail = function(mail){
            selected_mail = mail.id;
        };

        $scope.changeClass=function(mail){
            if(mail.id==selected_mail)
                return 'mail selected';
            else
                return 'mail';
        }
        


        }]);

