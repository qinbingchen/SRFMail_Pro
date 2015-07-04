var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.login = function () {
            $http.post(ROOT_URL + "/api/user/login", {
                user: "test0",
                password: "test0"
            }).success(function (data, status, headers, config) {
                console.log(data);
                console.log(status);
                console.log(headers());
            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.test_list = function () {
            $http.get(ROOT_URL + "/api/session/get_list", {
                user: "test0",
                password: "test0"
            }).success(function (data, status, headers, config) {
                console.log(data);
                console.log(status);
                console.log(headers());
            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.show_modal = function (name) {
            $("#modal-" + name).addClass("show");
            $("#modal-" + name + " .modal").addClass("show");
        };

        $scope.dismiss_modal = function () {
            $(".modal").removeClass("show");
            $(".modal-background").removeClass("show");
        };

        $scope.show_compose = function () {
            $scope.$broadcast("show_compose")
        };

        $scope.show_reply = function () {
            $scope.$broadcast("show_reply")
        };

        $scope.show_edit = function () {
            $scope.$broadcast("show_edit")
        };

        $scope.category_list = CATEGORY_LIST;

        $scope.current_user_type = USER_TYPE.DISPATCHER;
        $scope.current_user_id = 0;
        $scope.current_user_name = "";

       $scope.mail_list=[
            {
                "id":"123456",
                "date": "2015/7/4 23:46",
                "income":{
                    "from":{
                        "name":"Susan"
                    },
                    "subject": "hello"
                }
            },
            {
                "id":"123457",
                "date": "2015/7/4 23:47",
                "income":{
                    "from":{
                        "name":"Flavia"
                    },
                    "subject": "Guten Tag"
                }
            }
        ];
        $scope.selected_mail = {};

        $scope.show_modal("login");
    }]);

SRFMailProControllers.controller("ModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.prevent_dismiss = function (e) {
            e.stopPropagation();
        };
    }]);

SRFMailProControllers.controller("LoginModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

    }]);

SRFMailProControllers.controller("ComposeModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.$on("show_compose", function () {

        });

        $scope.$on("show_reply", function () {

        });

        $scope.$on("show_edit", function () {

        });
    }]);
