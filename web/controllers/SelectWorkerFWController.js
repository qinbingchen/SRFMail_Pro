SRFMailProControllers.controller("SelectWorkerFWController", ["$scope", "$http", "$cookies",
        function ($scope, $http, $cookies) {

            $scope.confirm_fw = function () {

                var fw_selected = $("#select-worker").select2("val");


                $http.post('/api/action/worker/redirect', {
                    'id': $scope.selected_mail_id,
                    'user': fw_selected
                }).success(function () {
                    toastr.success('转发成功', '');
                    $scope.load_mail_list();


                }).error(function () {
                    toastr.error('转发失败，请重试', '');
                });

                $scope.show_fw();
            };
        }]
);

