SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize",
    function ($scope, $http, $cookies, $sanitize) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_mail_selected", function () {
            var url = ROOT_URL + "/api/session/get_detail" + "?id=" + $scope.$parent.$parent.selected_mail;
            $http.get(url)
                .success(function (data,status, headers, config) {
                    console.log(data);
                    if (data.code == 0) {


                        $scope.mail = data;
                        console.log("data is" + data);
                        console.log(data.income.subject);
                        console.log(data.income.time);
                        console.log(data.income.from[0].address);
                        console.log(data.income.html);

                    } else {
                        console.log("code is " + data.code);
                        console.log(data);

                    }
                }).error(function (data, status, headers, config) {
                    console.log("error is" + data);

                });
        });


    }]);