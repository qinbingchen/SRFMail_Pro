var SRFMailProApp = angular.module("SRFMailProApp", [
    "ngCookies",
    "ngSanitize",
    "SRFMailProControllers"
]);

toastr.options = {
    "newestOnTop": true,
    "timeOut": "3000"
};