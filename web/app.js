var SRFMailProApp = angular.module("SRFMailProApp", [
    "ngCookies",
    "ngSanitize",
    "SRFMailProControllers"
]);

SRFMailProApp.service()

toastr.options = {
    "newestOnTop": true,
    "timeOut": "3000"
};