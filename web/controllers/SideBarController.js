SRFMailProControllers.controller("SideBarController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.select_category = function (category) {
            $scope.selected_category = category;
            $scope.filtered_mail_list = $scope.mail_list.filter(function (mail) {
                switch ($scope.current_user_type) {
                    case USER_TYPE.DISPATCHER:
                        switch ($scope.select_category.name) {
                            case "pending":

                            case "dispatched":

                            case "processed":

                            default:
                                return false;
                        }
                        break;
                    case USER_TYPE.WORKER:
                        switch ($scope.select_category.name) {
                            case "pending":

                            case "dispatched":

                            case "processed":

                            default:
                                return false;
                        }
                        break;
                    case USER_TYPE.REVIEWER:
                        switch ($scope.select_category.name) {
                            case "pending":

                            case "dispatched":

                            case "processed":

                            default:
                                return false;
                        }
                        break;
                    default:
                        return false;
                }
            })
        }
    }]);