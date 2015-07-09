var SB_HOST = ''; // SmartBackstage Host

toastr.options = {
    "closeButton": true,
    "debug": false,
    "positionClass": "toast-top-right",
    "onclick": null,
    "showDuration": "1000",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

$(document).ready(function() {
    $('input').iCheck({
        checkboxClass: 'icheckbox_minimal-grey',
        radioClass: 'iradio_minimal-grey'
    });

    $('select').select2();

    var maxVal = function(a, b) {
        return a > b ? a : b;
    };

    var resizeSiteContent = function() {
        $('.site-content')[0].style.minHeight = maxVal($('.site-sidebar').height(), $(window).height() - 84) + 'px';
    };
    resizeSiteContent();
    $(window).on('resize', resizeSiteContent);

    $('#log-out').click(function() {
        $.ajax(SB_HOST + '/api/user/logout', {
            method: 'POST',
            complete: function() {
                window.location = 'login.html';
            }
        })
    });
});