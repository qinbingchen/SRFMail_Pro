var SRFMailProControllers = angular.module("SRFMailProControllers", []);

SRFMailProControllers.controller("GlobalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.show_global_loader = false;
        $scope.show_login_loader = false;
        $scope.show_mail_loader = false;

        $scope.partial_load_status = {
            side_bar: false,
            mail_list: false,
            mail: false,
            modal_login: false,
            modal_compose: false,
            popover_dispatch: false,
            popover_label: false,
            popover_forward: false,
            popover_reject: false
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
                    $scope.show_global_loader = true;
                    $scope.load_mail_list();
                }
            }, 0);
        };

        $scope.login = function (username, password) {
            $scope.show_login_loader = true;
            userServices.login(username, password,
                function() {
                    $scope.load_mail_list();
                },
                function() {
                    toastr.error("登陆失败");
                    $scope.show_login_loader = false;
                }
            );
        };

        $scope.logout = function () {
            userServices.logout(
                function () {
                    location.reload();
                },
                function () {
                    location.reload();
                }
            );
        };

        $scope.load_mail_list = function () {
            mailServices.load_mail_list(
                function () {
                    $scope.show_login_loader = false;
                    $scope.show_global_loader = false;
                    $scope.dismiss_modal();
                    $scope.$broadcast("mail_list_did_load");
                    if (!$scope.reviewer_list) {
                        $http.get("/api/user/list_reviewers")
                            .success(function (data, status, headers, config) {
                                $scope.reviewer_list = data["reviewers"];
                            }).error(function (data, status, headers, config) {
                                console.log(data);
                            }
                        );
                    }
                    if (!$scope.worker_list) {
                        $http.get("/api/user/list_workers")
                            .success(function (data) {
                                $scope.worker_list = data.workers;
                            }).error(function (data, status, headers, config) {
                                console.log(data);
                            }
                        );
                    }
                    if (!$scope.label_list) {
                        $scope.label_list = [];
                        $http.get("/api/action/dispatcher/list_labels")
                            .success(function (data) {
                                if (data.code == 0) {
                                    data.labels.map(function (label) {
                                        $scope.label_list.push(label.name);
                                    });
                                } else {
                                    console.log(data);
                                }
                            }).error(function (data, status, headers, config) {
                                console.log(data);
                            }
                        );
                    }
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

        $scope.$on("emit_show_dispatch", function () {
            $scope.$broadcast("broadcast_show_dispatch");
        });

        $scope.$on("emit_show_label", function () {
            $scope.$broadcast("broadcast_show_label");
        });

        $scope.$on("emit_show_forward", function () {
            $scope.$broadcast("broadcast_show_forward");
        });

        $scope.$on("emit_show_reject", function () {
            $scope.$broadcast("broadcast_show_reject");
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

        $scope.$on("emit_show_labelmanage", function() {
            $scope.$broadcast("broadcast_show_labelmanage");
            $scope.show_modal("labelmanage");
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
            $scope.show_login_loader = false;
            if ($(".redactor-box").length > 0) {
                $("textarea#compose-content").redactor("core.destroy");
            }
        };

    }
]);

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

SRFMailProControllers.controller("MailListController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.mail_list = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = mailServices.current_user_type;
        $scope.selected_mail_id = mailServices.selected_mail_id;

        $scope.$on("broadcast_category_did_select", function () {
            $scope.current_user_type = mailServices.current_user_type;
            $scope.filtered_mail_list = mailServices.filtered_mail_list;
            if ($scope.filtered_mail_list.length != 0) {
                $scope.select_mail($scope.filtered_mail_list[0]);
            } else {
                mailServices.selected_mail_id = "";
                $scope.selected_mail_id = mailServices.selected_mail_id;
                $scope.$emit("emit_mail_did_select");
            }
        });

        $scope.select_mail = function (mail) {
            mailServices.selected_mail_id = mail.id;
            $scope.selected_mail_id = mailServices.selected_mail_id;
            $scope.$emit("emit_mail_did_select");
        };
    }
]);

SRFMailProControllers.controller("MailController", ["$scope", "$http", "$cookies", "$sanitize", "userServices", "mailServices",
    function ($scope, $http, $cookies, $sanitize, userServices, mailServices) {
        $scope.partial_load_status.mail = true;
        $scope.check_partial_load_status();

        $scope.current_user_type = userServices.current_user_type;
        $scope.current_user_name = userServices.current_user_name;
        $scope.current_user_display_name = userServices.current_user_display_name;
        $scope.selected_category = mailServices.selected_category;
        $scope.selected_mail_id = mailServices.selected_mail_id;

        $scope.$on("broadcast_mail_did_select", function () {
            $scope.show_mail_loader = true;

            $scope.current_user_type = userServices.current_user_type;
            $scope.current_user_name = userServices.current_user_name;
            $scope.current_user_display_name = userServices.current_user_display_name;
            $scope.selected_category = mailServices.selected_category;
            $scope.selected_mail_id = mailServices.selected_mail_id;

            mailServices.load_mail(
                function () {
                    $scope.deadline_time = "";
                    $scope.selected_mail = mailServices.selected_mail;
                    if ($scope.selected_mail_id != "" && $scope.selected_mail.operations.length > 0) {
                        var sessionHistory = new SessionHistoryKit.SessionHistory("operation-history");
                        sessionHistory.setOperations(mailServices.selected_mail.operations, {});
                        sessionHistory.draw();
                    }
                    if ($scope.selected_mail_id != "") {
                        if ($scope.selected_mail.income) {
                            var time = new Date($scope.selected_mail.income.time);
                            $scope.income_time = time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate()
                                + " " + time.getHours() + ":" + ("0" + time.getMinutes()).slice(-2);
                            if ($scope.selected_mail.income.deadline) {
                                var time = new Date($scope.selected_mail.income.deadline);
                                $scope.deadline_time = time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate()
                                    + " " + time.getHours() + ":" + ("0" + time.getMinutes()).slice(-2);
                            }
                        }
                        if ($scope.selected_mail.reply) {
                            var time = new Date($scope.selected_mail.reply.time);
                            $scope.reply_time = time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate()
                                + " " + time.getHours() + ":" + ("0" + time.getMinutes()).slice(-2);
                        }
                    }
                    $scope.show_mail_loader = false;
                },
                function () {}
            );
        });

        $scope.show_dispatch = function () {
            $scope.$emit("emit_show_dispatch");
        };

        $scope.show_label = function () {
            $scope.$emit("emit_show_label");
        };

        $scope.show_forward = function () {
            $scope.$emit("emit_show_forward");
        };

        $scope.show_reject = function () {
            $scope.$emit("emit_show_reject");
        };

        $scope.remind = function () {
            $http.post("/api/action/dispatcher/urge", {
                id: $scope.selected_mail_id
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    toastr.success("提醒成功");
                } else {
                    console.log(data);
                    toastr.error("提醒失败");
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                toastr.error("提醒失败");
            });
        };

        $scope.pass = function () {
            $http.post("/api/action/worker/pass", {
                id: mailServices.selected_mail_id
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    toastr.success("邮件已处理");
                } else {
                    console.log(data);
                    toastr.error("出现错误");
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                toastr.error("出现错误");
            });
        };

        $scope.send_back = function () {
            $http.post('/api/action/worker/redirect', {
                id: mailServices.selected_mail_id
            }).success(function () {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    toastr.success("退回成功");
                } else {
                    console.log(data);
                    toastr.error("退回失败");
                }
            }).error(function () {
                console.log(data);
                toastr.error("退回失败");
            });
        };

        $scope.review_pass = function () {
            if ($scope.review_reject_show) {
                $scope.review_reject_show = false;
            }
            $http.post("/api/action/reviewer/pass", {
                id: mailServices.selected_mail_id
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    toastr.success("审核通过");
                } else {
                    console.log(data);
                    toastr.error("出现错误");
                }
            }).error(function () {
                console.log(data);
                toastr.error("出现错误");
            });

        };

        $scope.show_compose = function () {
            $scope.$emit("emit_show_compose");
        };

        $scope.show_reply = function () {
            $scope.$emit("emit_show_reply");
        };

        $scope.show_edit = function () {
            $scope.$emit("emit_show_edit");
        };

    }
]);

SRFMailProControllers.controller("SelectLabelController", ["$scope", "$http", "$cookies",
    function ($scope, $http, $cookies) {

        $scope.send_label=function(){
            var label_selected = $("#themelabel").select2("val");
            if(label_selected!=null)
            {
                var labels="[\""+label_selected[0]+"\"";
                for(i=1;i<label_selected.length;i++)
                {
                    labels+=",\""+label_selected[i]+"\"";
                }
                labels+="]";

                var url = "/api/action/dispatcher/set_label";
                $http.post(url, {
                    id: $scope.selected_mail_id,
                    labels: labels
                }).success(function (data, status, headers, config) {
                    if (data.code == 0) {
                        location.reload();
                    } else {
                        console.log(data);
                    }
                }).error(function (data, status, headers, config) {
                    console.log(data);
                });
            }
        };

        $scope.show_labelmanage=function(){
            $scope.$emit("emit_show_labelmanage");
        }

        var url_labels = "/api/action/dispatcher/list_labels";
        $http.get(url_labels).success(function (data) {
            $scope.theme_labels=data.labels;

        }).error(function (data, status, headers, config) {
            console.log(data);
        });


        setTimeout(function() {
            $(".select-labels").select2();
        }, 0);
    }]);

SRFMailProControllers.controller("ModalController", ["$scope",
    function ($scope) {
        $scope.prevent_dismiss = function (e) {
            e.stopPropagation();
        };
    }
]);

SRFMailProControllers.controller("LoginModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.modal_login = true;
        $scope.check_partial_load_status();

        $scope.submit = function () {
            $scope.login($scope.username, $scope.password);
        }
    }
]);

SRFMailProControllers.controller("LabelmanageModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {  
        $scope.submit = function () {
           $scope.labels_updated=$scope.exist_labels;
            var url_labels_update = "/api/action/dispatcher/set_all_labels";
            alert( JSON.stringify($scope.labels_updated));
        $http.post(url_labels_update, {
                            labels:JSON.stringify($scope.labels_updated)
                        }).success(function (data, status, headers, config) {
                            if(data.code!=0)
                            {
                                    console.log(data.message);
                            }
                            else
                            {$scope.load_mail_list();
                            $scope.dismiss_modal();
                            }                            
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                        });    
        }

        $scope.add_label=function(){
            var label_text=$('#label_name').val();
            var label_color=$('.simple_color_custom_chooser_css').val();

              if (!$('#tags').tagExist(label_text))
              {
                $('#tags').addTag(label_text);
            var exist_labels_length=$scope.exist_labels.length;
            $scope.exist_labels[exist_labels_length]=new Object();
            $scope.exist_labels[exist_labels_length].name=label_text;
            $scope.exist_labels[exist_labels_length].color=label_color;
        }
          update_labels();
        };

//           $(document).ready(function(){
//                $('.simple_color_custom_chooser_css').simpleColor({
//                    chooserCSS: { 'background-color': 'black', 'opacity': '0.8' },
//                    colors:['800000','8B0000','C71585','4B0882','800080','000080','D2691E','FF0000','FFC0CB','7B68EE','F5DEB3','FFFF00','32CD32','00BFFF','ADD8E6','D3D3D3'],
//                    boxWidth:'200px',
//                    boxHeight:'20px',
//                    columns:18 });
//            });
//
//         var url_labels = "/api/action/dispatcher/list_labels";
//        $http.get(url_labels).success(function (data) {
//                $scope.theme_labels=data.labels;
//        }).error(function (data, status, headers, config) {
//            console.log(data);
//    });
//
//        $scope.exist_labels=new Array();
//
//        setTimeout(function()
//        {
//            $scope.exist_labels[0]=new Object();
//            $scope.exist_labels[0].name=$scope.theme_labels[0].name;
//            $scope.exist_labels[0].color=$scope.theme_labels[0].color;
//            $scope.exist_labels_name=$scope.theme_labels[0].name;
//
//        for(i=1;i<$scope.theme_labels.length;i++)
//        {
//            $scope.exist_labels[i]=new Object();
//            $scope.exist_labels[i].name=$scope.theme_labels[i].name;
//            $scope.exist_labels[i].color=$scope.theme_labels[i].color;
//            $scope.exist_labels_name+=","+$scope.theme_labels[i].name;
//        }
//
//            $('#tags').tagsInput({
//                onRemoveTag:function(tag){
//                    $scope.exist_labels.splice(get_label_id(tag),1);
//                    update_labels();
//}});
//
//            $('#tags').importTags($scope.exist_labels_name);
//
//            $scope.label_id=0;
//            update_labels();
//
//        },2000);
//
//    var update_labels=function(){
//$('.tag').each(function()
//          {
//            var tag_text=$(this).text().substr(0 ,$(this).text().length-3);
//            $(this).css("background-color",$scope.exist_labels[get_label_id(tag_text)].color);
//          });
//    }
//
//     var  get_label_id=function(label_text){
//
//            for(j=0;j<$scope.exist_labels.length;j++)
//            {
//                if($scope.exist_labels[j].name==label_text)
//                    return j;
//            }
//    }
//

    }]);

SRFMailProControllers.controller("ComposeModalController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.modal_compose = true;
        $scope.check_partial_load_status();

        $scope.edit_mode = EDIT_MODE.COMPOSE;

        $scope.$on("broadcast_show_compose", function () {
            $scope.edit_mode = EDIT_MODE.COMPOSE;
            $scope.recipient = "";
            $scope.subject = "";
            $scope.need_review = false;
            $scope.reviewer = "";
            $scope.content = "";
            $("textarea#compose-content").redactor(redactor_options);
        });

        $scope.$on("broadcast_show_reply", function () {
            $scope.edit_mode = EDIT_MODE.REPLY;
            $scope.recipient = mailServices.selected_mail.income.from[0].address;
            $scope.subject = "Re: " + mailServices.selected_mail.income.subject;
            $scope.need_review = false;
            $scope.reviewer = "";
            $("textarea#compose-content").redactor(redactor_options);
            $("textarea#compose-content").redactor("code.set", mailServices.selected_mail.income.html);
        });

        $scope.$on("broadcast_show_edit", function () {
            $scope.edit_mode = EDIT_MODE.EDIT;
            $scope.recipient = mailServices.selected_mail.reply.to[0].address;
            $scope.subject = mailServices.selected_mail.reply.subject;
            $("textarea#compose-content").redactor(redactor_options);
            $("textarea#compose-content").redactor("code.set", mailServices.selected_mail.reply.html);
        });

        $scope.switch_review = function () {
            if ($scope.need_review) {
                $("select#reviewer").select2({
                    data: $scope.reviewer_list,
                    placeholder: "请选择审核人..."
                });
            } else {
                $("select#reviewer").select2("val", "");
            }
        };

        $scope.submit = function () {
            var html = $("textarea#compose-content").redactor("code.get");
            if ($scope.compose_form.$valid) {
                switch ($scope.edit_mode) {
                    case EDIT_MODE.COMPOSE:
                        $http.post("/api/action/worker/submit", {
                            recipients: JSON.stringify([$scope.recipient]),
                            subject: $scope.subject,
                            html: html,
                            attachments: JSON.stringify([]),
                            needReview: $scope.need_review,
                            reviewer: $scope.reviewer
                        }).success(function (data, status, headers, config) {
                            if (data.code == 0) {
                                toastr.success("发送成功");
                                $scope.load_mail_list();
                                $scope.dismiss_modal();
                            } else {
                                console.log(data);
                                toastr.error("发送失败");
                            }
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                            toastr.error("发送失败");
                        });
                        break;
                    case EDIT_MODE.REPLY:
                        $http.post("/api/action/worker/submit", {
                            id: mailServices.selected_mail_id,
                            recipients: JSON.stringify([$scope.recipient]),
                            subject: $scope.subject,
                            html: html,
                            attachments: JSON.stringify([]),
                            needReview: $scope.need_review,
                            reviewer: $scope.reviewer
                        }).success(function (data, status, headers, config) {
                            if (data.code == 0) {
                                toastr.success("回复成功");
                                $scope.load_mail_list();
                                $scope.dismiss_modal();
                            } else {
                                console.log(data);
                                toastr.error("回复失败");
                            }
                        }).error(function (data, status, headers, config) {
                            console.log(data);
                            toastr.error("回复失败");
                        });
                        break;
                    case EDIT_MODE.EDIT:
                        $http.post("/api/action/reviewer/pass", {
                            id: mailServices.selected_mail_id,
                            subject: $scope.subject,
                            html: html,
                            attachments: JSON.stringify([])
                        }).success(function (data, status, headers, config) {
                            if (data.code == 0) {
                                toastr.success("发送成功");
                                $scope.load_mail_list();
                                $scope.dismiss_modal();
                            } else {
                                console.log(data);
                                toastr.error("发送失败");
                            }
                        }).error(function () {
                            console.log(data);
                            toastr.error("发送失败");
                        });
                        break;
                    default :
                        break;
                }
            }
        }
    }
]);

SRFMailProControllers.controller("PopoverController", ["$scope",
    function ($scope) {
        $scope.position_popover = function (name) {
            $button = $("#show-" + name);
            var left = $button.offset().left + $button.width() / 2 - 110;
            $("#popover-" + name).css("left", left + "px");
        };
    }
]);

SRFMailProControllers.controller("DispatchPopoverController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.popover_dispatch = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_show_dispatch", function () {
            $scope.position_popover("dispatch");
            var $readreply = $("select#dispatch-readreply");
            var $readonly = $("select#dispatch-readonly");
            if ($readreply.hasClass("select2-hidden-accessible")) {
                $readreply.select2("val", "");
            } else {
                $readreply.select2({
                    placeholder: "选择处理人...",
                    data: $scope.worker_list
                });
            }
            if ($readonly.hasClass("select2-hidden-accessible")) {
                $readonly.select2("val", "");
            } else {
                $readonly.select2({
                    placeholder: "选择查看人...",
                    data: $scope.worker_list
                });
            }
            $("#dispatch-deadline").datetimepicker({
                minDate: 0,
                lang: "zh-cn",
                i18n: {
                    "zh-cn": {
                        months: [
                            "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"
                        ],
                        dayOfWeek: [
                            "日", "一", "二", "三", "四", "五", "六"
                        ]
                    }
                }
            });
            $scope.show_popover = true;
        });

        $scope.submit = function () {
            var readreply = $("select#dispatch-readreply").val();
            var readonly = $("select#dispatch-readonly").val();
            var deadline = $scope.deadline;
            if (deadline && deadline != "") {
                deadline = new Date(deadline).toISOString();
            }
            $http.post("/api/action/dispatcher/dispatch", {
                id: mailServices.selected_mail_id,
                readreply: readreply == null || readreply == "" ? JSON.stringify([]) : JSON.stringify(readreply),
                readonly: readonly == null || readonly == "" ? JSON.stringify([]) : JSON.stringify(readonly),
                deadline: deadline
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    $scope.show_popover = false;
                    toastr.success("分发成功");
                } else {
                    console.log(data);
                    toastr.error("分发失败");
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                toastr.error("分发失败");
            });
        }
    }]);

SRFMailProControllers.controller("LabelPopoverController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.popover_label = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_show_label", function () {
            $scope.position_popover("label");
            var $label_select = $("select#label-select");
            if ($label_select.hasClass("select2-hidden-accessible")) {
                $label_select.select2("val", "");
            } else {
                $label_select.select2({
                    placeholder: "添加标签...",
                    data: $scope.label_list
                });
            }
            $scope.show_popover = true;
        });

        $scope.submit = function () {
            var labels = $("select#label-select").val();
            $http.post("/api/action/dispatcher/set_label", {
                id: mailServices.selected_mail_id,
                labels: labels == null || labels == "" ? JSON.stringify([]) : JSON.stringify(labels)
            }).success(function (data, status, headers, config) {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    $scope.show_popover = false;
                    toastr.success("标签添加成功");
                } else {
                    console.log(data);
                    toastr.error("标签添加失败");
                }
            }).error(function (data, status, headers, config) {
                console.log(data);
                toastr.error("标签添加失败");
            });
        };

        $scope.show_labelmanage=function(){
            $scope.$emit("emit_show_labelmanage");
        };
    }
]);

SRFMailProControllers.controller("ForwardPopoverController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.popover_forward = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_show_forward", function () {
            $scope.position_popover("forward");
            var $forward_select = $("select#forward-select");
            if ($forward_select.hasClass("select2-hidden-accessible")) {
                $forward_select.select2("val", "");
            } else {
                $forward_select.select2({
                    placeholder: "选择处理人...",
                    data: $scope.worker_list
                });
            }
            $scope.show_popover = true;
        });

        $scope.submit = function () {
            $http.post('/api/action/worker/redirect', {
                id: mailServices.selected_mail_id,
                user: $("#forward-select").select2("val")
            }).success(function () {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    $scope.show_popover = false;
                    toastr.success("转发成功");
                } else {
                    console.log(data);
                    toastr.error("转发失败");
                }
            }).error(function () {
                console.log(data);
                toastr.error("转发失败");
            });
            $scope.show_popover = false;
        };
    }
]);

SRFMailProControllers.controller("RejectPopoverController", ["$scope", "$http", "$cookies", "userServices", "mailServices",
    function ($scope, $http, $cookies, userServices, mailServices) {
        $scope.partial_load_status.popover_reject = true;
        $scope.check_partial_load_status();

        $scope.$on("broadcast_show_reject", function () {
            $scope.position_popover("reject");
            $scope.show_popover = true;
        });

        $scope.review_refuse_confirm = function () {
            $scope.show_popover = false;
            $http.post("/api/action/reviewer/reject", {
                id: mailServices.selected_mail_id,
                message: $scope.review_comment
            }).success(function () {
                if (data.code == 0) {
                    $scope.load_mail_list();
                    $scope.show_popover = false;
                    toastr.success("转发成功");
                } else {
                    console.log(data);
                    toastr.error("转发失败");
                }
            }).error(function () {
                console.log(data);
                toastr.error("转发失败");
            });

        };
    }
]);
