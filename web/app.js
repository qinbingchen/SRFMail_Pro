var SRFMailProApp = angular.module("SRFMailProApp", [
    "ngCookies",
    "SRFMailProControllers"
]);

var SRFMailProControllers = angular.module("SRFMailProControllers", []);

toastr.options = {
    "newestOnTop": true,
    "timeOut": "3000"
};