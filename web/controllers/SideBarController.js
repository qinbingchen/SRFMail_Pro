SRFMailProControllers.controller("SideBarController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.side_bar = true;
        $scope.check_partial_load_status();

        $scope.select_category = function (category) {
            $scope.selected_category = category;
            $scope.filtered_mail_list = $scope.mail_list.filter(function (mail) {
                switch ($scope.current_user_type) {
                    case USER_TYPE.DISPATCHER:
                        switch ($scope.select_category.name) {
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
                            switch ($scope.select_category.name) {
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
                            switch ($scope.select_category.name) {
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
            })
        }
    }]);