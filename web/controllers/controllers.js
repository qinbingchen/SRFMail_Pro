var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.ready = function () {
            setTimeout(function () {
                if ($cookies.get("connect.sid") == null) {
                    $scope.show_modal("login");
                    console.log("123");
                } else {
                    console.log("456");
                    $http.get(ROOT_URL + "/api/session/get_list")
                        .success(function (data, status, headers, config) {
                            $scope.mail_list = data["sessions"];
                            $scope.dismiss_modal();
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                        });
                }
            }, 0);
        };

        $scope.login = function (username, password) {
            $http.post(ROOT_URL + "/api/user/login", {
                user: username,
                password: password
            }).success(function (data, status, headers, config) {
                $http.get(ROOT_URL + "/api/session/get_list")
                    .success(function (data, status, headers, config) {
                        $scope.mail_list = data["sessions"];
                        $scope.dismiss_modal();
                    }).error(function (data, status, headers, config) {
                        console.log(data);
                    });
            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.logout = function () {
           $cookies.remove("connect.sid");
           location.reload()
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
<<<<<<< HEAD

        $scope.partial_load_status = {
            side_bar: false,
            mail_list: false,
            mail: false,
            modal_login: false,
            modal_compose: false
        };

        $scope.check_partial_load_status = function () {
            for (var i in $scope.partial_load_status) {
                if ($scope.partial_load_status[i] == false) {
                    return;
                }
            }
            $scope.ready();
        };

        $scope.show_dispatch=function (){
            if($(".bubble").css("display")=="none")
                $(".bubble").show();
            else
                $(".bubble").hide();
        };
        

        $scope.current_user_type = USER_TYPE.DISPATCHER;
        $scope.current_user_id = 0;
        $scope.current_user_name = "";

        $scope.category_list = CATEGORY_LIST;
        $scope.selected_category = $scope.current_user_type == USER_TYPE.NONE ? null : CATEGORY_LIST[$scope.current_user_type].category[0];

        $scope.mail_list = [];
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
        $scope.filtered_mail_list = [];
        $scope.selected_mail = "";



    }]);

SRFMailProControllers.controller("ModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.prevent_dismiss = function (e) {
            e.stopPropagation();
        };
    }]);

SRFMailProControllers.controller("LoginModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.modal_login = true;
        $scope.check_partial_load_status();

        $scope.submit = function () {
            $scope.login(username, password)
        }
    }]);

SRFMailProControllers.controller("ComposeModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.modal_compose = true;
        $scope.check_partial_load_status();

        $scope.$on("show_compose", function () {

        });

        $scope.$on("show_reply", function () {

        });

        $scope.$on("show_edit", function () {

        });
    }]);
