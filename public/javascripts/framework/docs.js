$(document).ready(function() {

    $('.nav-content').click(function() {
        $('.doc-content').hide();
        $('#' + $(this).attr('data-id')).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').first().click();

});