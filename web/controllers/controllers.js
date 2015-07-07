var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status = {
            side_bar: false,
            mail_list: false,
            mail: false,
            modal_login: false,
            modal_compose: false
        };

        $scope.check_partial_load_status = function () {
            for (var i in $scope.partial_load_status) {
                if ($scope.partial_load_status[i] == false) {
                    return;
                }
            }
            $scope.ready();
        };

        $scope.ready = function () {
            setTimeout(function () {
                if (userServices.current_user_type == USER_TYPE.NONE) {
                    $scope.show_modal("login");
                } else {
                    $scope.load_mail_list();
                }
            }, 0);
        };

        $scope.logout = function () {
            userServices.logout();
            location.reload()
        };

        $scope.load_mail_list = function () {
            mailServices.load_mail_list(
                function () {
                    $scope.dismiss_modal();
                    $scope.$broadcast("mail_list_did_load");
                },
                function () {}
            );
        };

        $scope.$on("emit_category_did_select", function() {
            $scope.$broadcast("broadcast_category_did_select");
        });

        $scope.$on("emit_mail_did_select", function () {
            $scope.$broadcast("broadcast_mail_did_select");
        });

        $scope.$on("emit_show_compose", function() {
            $scope.$broadcast("broadcast_show_compose");
            $scope.show_modal("compose");
        });

        $scope.$on("emit_show_reply", function () {
            $scope.$broadcast("broadcast_show_reply");
            $scope.show_modal("compose");
        });

        $scope.$on("emit_show_edit", function () {
            $scope.$broadcast("broadcast_show_edit");
            $scope.show_modal("compose");
        });

        $("body").on("select2:open", "select", function () {
            $(this).siblings(".select2").addClass("selected");
        }).on("select2:close", "select", function () {
            $(this).siblings(".select2").removeClass("selected");
        });

        $scope.show_modal = function (name) {
            $("#modal-" + name).addClass("show");
            $("#modal-" + name + " .modal").addClass("show");
        };

        $scope.dismiss_modal = function () {
            $(".modal").removeClass("show");
            $(".modal-background").removeClass("show");
        };
    }]);

SRFMailProControllers.controller("ModalController", ["$scope",
    function ($scope) {
        $scope.prevent_dismiss = function (e) {
            e.stopPropagation();
        };
    }]);

SRFMailProControllers.controller("LoginModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.modal_login = true;
        $scope.check_partial_load_status();

        $scope.submit = function () {
            userServices.login($scope.username, $scope.password,
                function() {
                    $scope.load_mail_list();
                },
                function() {
                }
            );
        }
    }]);

SRFMailProControllers.controller("ComposeModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.modal_compose = true;
        $scope.check_partial_load_status();

        $scope.edit_mode = EDIT_MODE.COMPOSE;
        var editor = new wysihtml5.Editor("editor", {
            toolbar: "toolbar",
            parserRules:  wysihtml5ParserRules
        });

        $http.get("/api/user/list_reviewers")
            .success(function (data, status, headers, config) {
                $scope.reviewer_list = data["reviewers"];
            }).error(function (data, status, headers, config) {
                console.log(data);
            });

        $scope.$on("broadcast_show_compose", function () {
            $scope.edit_mode = EDIT_MODE.COMPOSE;
            $scope.recipient = "";
            $scope.subject = "";
            $scope.need_review = false;
            $scope.reviewer = "";
            $("select#reviewer").select2("destroy");
            //$scope.content = "312";

        });

        $scope.$on("broadcast_show_reply", function () {
            $scope.edit_mode = EDIT_MODE.REPLY;
            $scope.recipient = mailServices.selected_mail.income.from[0].address;
            $scope.subject = "Re: " + mailServices.selected_mail.income.subject;
            $scope.need_review = false;
            $scope.reviewer = "";
            $("select#reviewer").select2("destroy");
        });

        $scope.$on("broadcast_show_edit", function () {
            $scope.edit_mode = EDIT_MODE.EDIT;
        });

        $scope.switch_review = function () {
            if ($scope.need_review) {
                $("select#reviewer").select2({
                    data: $scope.reviewer_list,
                    placeholder: "请选择审核人"
                });
            } else {
                $("select#reviewer").select2("destroy");
            }
        };

        $scope.submit = function () {
            if ($scope.recipient == "") {
                return;
            } else {
                switch ($scope.edit_mode) {
                    case EDIT_MODE.COMPOSE:
                        $http.post("/api/action/worker/submit", {
                            recipients: JSON.stringify([$scope.recipient]),
                            subject: $scope.subject,
                            html: $scope.content,
                            attachments: JSON.stringify([]),
                            needReview: $scope.need_review,
                            reviewer: $scope.reviewer
                        }).success(function (data, status, headers, config) {
                            $scope.load_mail_list();
                            $scope.dismiss_modal();
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                        });
                        break;
                    case EDIT_MODE.REPLY:
                        $http.post("/api/action/worker/submit", {
                            id: mailServices.selected_mail_id,
                            recipients: JSON.stringify([$scope.recipient]),
                            subject: $scope.subject,
                            html: $scope.content,
                            attachments: JSON.stringify([]),
                            needReview: $scope.need_review,
                            reviewer: $scope.reviewer
                        }).success(function (data, status, headers, config) {
                            $scope.load_mail_list();
                            $scope.dismiss_modal();
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                        });
                        break;
                    case EDIT_MODE.EDIT:
                        break;
                    default :
                        break;
                }
            }
        }
    }]);
