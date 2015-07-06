var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
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
                if (userServices.current_user_type == USER_TYPE.NONE) {
                    $scope.show_modal("login");
                } else {
                    $scope.load_mail_list();
                }
            }, 0);
        };

        $scope.logout = function () {
            userServices.logout();
            location.reload()
        };

        $scope.load_mail_list = function () {
            mailServices.load_mail_list(
                function () {
                    $scope.dismiss_modal();
                    $scope.$broadcast("mail_list_did_load");
                },
                function () {}
            );
        };

        $scope.$on("emit_category_did_select", function() {
            $scope.$broadcast("broadcast_category_did_select");
        });

        $scope.$on("emit_mail_did_select", function () {
            $scope.$broadcast("broadcast_mail_did_select");
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

        // TODO REWRITE

        $scope.check = function () {
            $http.post("/api/action/worker/pass", {
                id: $scope.selected_mail
            }).success(function (data, status, headers, config) {
                $scope.reload_mail();
            }).error(function (data, status, headers, config) {
                console.log(data);
            });
        };

        $scope.show_dispatch = function () {
            $scope.dispatch_show = !$scope.dispatch_show;
        };


        $scope.dispatch_show = false;

        // TODO END OF TODO
    }]);

SRFMailProControllers.controller("ModalController", ["$scope",
    function ($scope) {
        $scope.prevent_dismiss = function (e) {
            e.stopPropagation();
        };
    }]);

SRFMailProControllers.controller("LoginModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.modal_login = true;
        $scope.check_partial_load_status();

        $scope.submit = function () {
            userServices.login($scope.username, $scope.password,
                function() {
                    $scope.load_mail_list();
                },
                function() {
                }
            );
        }
    }]);

SRFMailProControllers.controller("ComposeModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.modal_compose = true;
        $scope.check_partial_load_status();

        $scope.$on("show_compose", function () {

        });

        $scope.$on("show_reply", function () {

        });

        $scope.$on("show_edit", function () {

        });
    }]);
