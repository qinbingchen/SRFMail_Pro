SRFMailProControllers.controller("SelectLabelController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

           $scope.send_label=function(){
                var label_selected = $("#themelabel").select2("val");
                if(label_selected!=null)
                {
                    var labels="[\""+label_selected[0]+"\"";
                    for(i=1;i<label_selectedlength;i++) 
                    {
                        labels+=",\""+label_selected[i]+"\"";
                    }
                    labels="]";

                    var url = "/api/action/dispatcher/set_label";
                    $http.post(url, {
                        id: $scope.$parent.$parent.selected_mail,
                        labels: labels
                    }).success(function (data, status, headers, config) {
                        if (data.code == 0) {
                        } else {
                            console.log(data);
                        }
                    }).error(function (data, status, headers, config) {
                        console.log(data);
                    });
                }                   
        };       

        var url_labels = "/api/user/list_label";
        $http.get(url_labels).success(function (data) {
                $scope.theme_labels=data.theme_labels;
           
        }).error(function (data, status, headers, config) {
            console.log(data);
    });

        $scope.theme_labels=["hello","goodmorning"];
        	setTimeout(function() {               
               $(".select-labels").select2({
                    data: $scope.theme_labels
                });
        }, 2000);  
    }]);

