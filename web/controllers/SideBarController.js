SRFMailProControllers.controller("SideBarController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {
        $scope.partial_load_status.side_bar = true;
        $scope.check_partial_load_status();

        $scope.select_category = function (category) {
            $scope.selected_category = category;

            $scope.$parent.$parent.filtered_mail_list = $scope.mail_list.filter(function (mail) {
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
            //filtered_mail_list.sort(function (a, b) {
            //   // return a.income.time.getTime() < b.income.time.getTime();
            //});

            $scope.$parent.$parent.filtered_mail_list = filtered_mail_list;
            $scope.$emit("emit_category_selected");
        };

        $scope.$on("reload_mail", function () {
            if ($scope.select_category != null) {
                $scope.select_category($scope.selected_category);
            }
        })
    }]);