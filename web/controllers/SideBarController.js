SRFMailProControllers.controller("SideBarController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.side_bar = true;
        $scope.check_partial_load_status();

        $scope.select_category = function (category) {
            $scope.selected_category = category;

            console.log("user type:" + $scope.current_user_type);
            console.log("selected: " + $scope.selected_category);

            $scope.$parent.filtered_mail_list = $scope.mail_list.filter(function (mail) {
                console.log(mail);
                switch ($scope.current_user_type) {
                    case USER_TYPE.DISPATCHER:
                        switch ($scope.selected_category.name) {
                            case "pending":
                                return mail.status == STATUS.NEW;
                            case "dispatched":
                                return mail.status == STATUS.DISPATCHED;
                            case "processed":
                                return mail.status == STATUS.WAITINGFORREVIEW || mail.status == STATUS.WAITINGFORSEND || mail.status == STATUS.SUCCESS;
                            default:
                                return false;
                        }
                    case USER_TYPE.WORKER:
                        if (mail.worker != $scope.current_user_name) {
                            return false;
                        } else {
                            switch ($scope.selected_category.name) {
                                case "pending":
                                    return mail.status == STATUS.DISPATCHED;
                                case "waiting_for_review":
                                    return mail.status == STATUS.WAITINGFORREVIEW;
                                case "success":
                                    return mail.status == STATUS.SUCCESS;
                                default:
                                    return false;
                            }
                        }
                    case USER_TYPE.REVIEWER:
                        if (mail.reviewer != $scope.current_user_name) {
                            return false;
                        } else {
                            switch ($scope.selected_category.name) {
                                case "pending":
                                    return mail.status == STATUS.WAITINGFORREVIEW;
                                case "sent":
                                    return mail.status == STATUS.WAITINGFORSEND || mail.status == STATUS.SUCCESS;
                                case "rejected":
                                    return mail.status == STATUS.DISPATCHED;
                                default:
                                    return false;
                            }
                        }
                    default:
                        return false;
                }
            });
            $scope.$apply();
            console.log($scope.filtered_mail_list);
        }
    }]);