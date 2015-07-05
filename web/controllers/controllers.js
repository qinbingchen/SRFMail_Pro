var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
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

        $scope.ready = function () {
            setTimeout(function () {
                if ($cookies.get("user_type") == null) {
                    $scope.show_modal("login");
                } else {
                    $http.get(ROOT_URL + "/api/session/get_list")
                        .success(function (data, status, headers, config) {
                            $scope.mail_list = data["sessions"];
                            $scope.reload_mail();
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
                if (data.code == 0) {
                    $cookies.put("user_type", data.role);
                    $cookies.put("user_id", data.id);
                    $cookies.put("user_name", data.name);
                    $scope.current_user_type = data.role;
                    $scope.current_user_id = data.id;
                    $scope.current_user_name = data.name;
                    $scope.reload_mail();
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.logout = function () {
            $cookies.remove("connect.sid");
            $cookies.remove("user_type");
            $cookies.remove("user_id");
            $cookies.remove("user_name");
            location.reload()
        };

        $scope.reload_mail = function () {
            $http.get(ROOT_URL + "/api/session/get_list")
                .success(function (data, status, headers, config) {
                    $scope.mail_list = data["sessions"];
                    $scope.$broadcast("reload_mail");
                    $scope.dismiss_modal();
                }).error(function (data, status, headers, config) {
                    console.log(data);
                });
        };

        $scope.$on("emit_category_selected", function() {
            $scope.$broadcast("broadcast_category_selected");
        });

        $scope.$on("emit_mail_selected", function () {
            $scope.$broadcast("broadcast_mail_selected");
        });

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

        $scope.check = function () {
            $http.post(ROOT_URL + "/api/action/worker/pass", {
                id: $scope.selected_mail
            }).success(function (data, status, headers, config) {
                $scope.reload_mail();
            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.show_dispatch=function () {
            $scope.dispatch_show = !$scope.dispatch_show;
        };

        $scope.current_user_type = $cookies.get("user_type") == null ? USER_TYPE.NONE : $cookies.get("user_type");
        $scope.current_user_id = $cookies.get("user_id") == null ? "" : $cookies.get("user_id");
        $scope.current_user_name = $cookies.get("user_name") == null ? "" : $cookies.get("user_name");

        $scope.dispatch_show = false;

        $scope.category_list = CATEGORY_LIST;
        $scope.selected_category = $scope.current_user_type == USER_TYPE.NONE ? null : CATEGORY_LIST[$scope.current_user_type].category[0];

        $scope.mail_list = [];
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
            console.log("username: " + $scope.username);
            console.log("password: " + $scope.password);
            $scope.login($scope.username, $scope.password)
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
