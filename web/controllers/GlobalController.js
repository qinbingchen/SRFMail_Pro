SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.current_user_type = CONSTANTS.USER_TYPE.ADMIN;
        $scope.current_user_id = 0;
        $scope.current_user_name = "";

        $scope.category_list = [];
        $scope.mail_list = [];
        $scope.selected_mail = {};
    }]);