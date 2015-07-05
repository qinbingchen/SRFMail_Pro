SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        //$scope.mail_title = "hello liuxiaran";
        //$scope.time = "1:20";
        //$scope.sender = "fly@163.com";
        //$scope.content="adfadf";
        //$scope.mail_title = $scope.selected_mail.subject;
        //$scope.time = $scope.selected_mail.time.substr(0,10);
        //$scope.sender = $scope.selected_mail.from.address;
        //$scope.content=$scope.selected_mail.html;

        $scope.$on("broadcast_mail_selected", function () {
            console.log("received mail selected");
            console.log($scope.$parent.$parent.selected_mail);
            var url = ROOT_URL + "/api/session/get_detail" + "?id=" + $scope.$parent.$parent.selected_mail;
            $http.get(url).success(function (data) {
                if (data.code == 0) {
                    var length = data.operations.length;
                    var mail = data.operations[length - 1];
                    $scope.mail_title =mail.mail.subject;
                    $scope.time=mail.time;
                    $scope.sender=mail.operator;
                    $scope.content=mail.mail.html;
                } else {
                    console.log(data);

                }
            }).error(function (data, status, headers, config) {
                console.log(data);

            });
        });


    }]);