var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.show_modal = function (name) {
            $("#modal-" + name).addClass("show");
            $("#modal-" + name + " .modal").addClass("show");
        };

        $scope.dismiss_modal = function () {
            $(".modal").removeClass("show");
            $(".modal-background").removeClass("show");
        };

        $scope.current_user_type = CONSTANTS.USER_TYPE.ADMIN;
        $scope.current_user_id = 0;
        $scope.current_user_name = "";

        $scope.category_list = [];
        $scope.mail_list = [];
        $scope.selected_mail = {};
    }]);

SRFMailProControllers.controller("ModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.prevent_dismiss = function (e) {
            e.stopPropagation();
        };
    }]);

SRFMailProControllers.controller("ComposeModalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

    }]);