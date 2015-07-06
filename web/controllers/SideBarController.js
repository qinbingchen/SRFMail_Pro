SRFMailProControllers.controller("SideBarController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.side_bar = true;
        $scope.check_partial_load_status();

        $scope.category_list = CATEGORY_LIST;
        $scope.selected_category = mailServices.selected_category;
        $scope.current_user_type = userServices.current_user_type;

        $scope.select_category = function (category) {
            mailServices.select_category(category);
            $scope.selected_category = mailServices.selected_category;
            $scope.$emit("emit_category_did_select");
        };

        $scope.$on("mail_list_did_load", function () {
            $scope.current_user_type = userServices.current_user_type;
            $scope.select_category(CATEGORY_LIST[userServices.current_user_type].category[0]);
        })
    }]);