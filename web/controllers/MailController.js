SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.mail_title = "hello liuxiaran";
        $scope.time = "1:20";
        $scope.sender = "fly@163.com";
        $scope.content="adfadf";
        //$scope.mail_title = $scope.selected_mail.subject;
        //$scope.time = $scope.selected_mail.time.substr(0,10);
        //$scope.sender = $scope.selected_mail.from.address;
        //$scope.content=$scope.selected_mail.html;
    }]);