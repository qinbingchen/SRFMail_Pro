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
        $scope.mail_list = [
            {
                sender: "啊啊啊啊啊啊啊",
                date: "2015/6/29 18:06",
                title: "操作系统后天考",
                content: "不想考操作系统"
            }, {
                sender: "zuoian",
                date: "hello",
                title: "lll",
                content: "ooooooooo"
            }
        ];
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