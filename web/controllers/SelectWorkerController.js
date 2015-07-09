SRFMailProControllers.controller("PopoverDispatchController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

       $scope.sendDispatch = function () {

        var readreply_selected = $("#readreply").select2("val");
        if (readreply_selected != null) {
            var readreply="[\""+readreply_selected[0]+"\"";
            for(i=1;i<readreply_selected.length;i++)
            {
                readreply+=",\""+readreply_selected[i]+"\"";
            }
            readreply+="]";
        }
        else
        {
            readreply="[]";
        }

        var readonly_selected = $("#readonly").select2("val");
        if(readonly_selected!=null)
        {
            var readonly="[\""+readonly_selected[0]+"\"";
            for(i=1;i<readonly_selected.length;i++)
            {
                readonly+=",\""+readonly_selected[i]+"\"";
            }
            readonly+="]";
        }
        else
        {
            readonly="[]";
        }

        var deadline = $("#deadline").val();

        $http.post("/api/action/dispatcher/dispatch", {
            id: $scope.$parent.$parent.selected_mail_id,
            readonly: readonly,
            readreply: readreply,
            deadline: deadline
        }).success(function (data, status, headers, config) {
            if (data.code == 0) {
                location.reload();
            } else {
                console.log(data);
            }
        }).error(function (data, status, headers, config) {
            console.log(data);
        });
    };

        $http.get("/api/user/list_workers")
            .success(function (data) {
                if (data.code == 0) {
                    $scope.worker_list = data.workers;
                } else {
                    console.log(data);
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
            });

        setTimeout(function() {
               $(".select-workers").select2({
                    data: $scope.workers
                });              

                $('#deadline-time').datetimepicker({
                    controlType: 'select',
                    oneLine: true,
                    timeFormat: 'hh:mm tt'
                });
        }, 2000);  
    }
]);


