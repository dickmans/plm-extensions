$(document).ready(function() {

    $('.nav-header').click(function() {
        $(this).toggleClass('collapsed');
        $(this).next().toggle();
        $(this).next().next().toggle();
        // $('.doc-content').hide();
        // $('#' + $(this).attr('data-id')).show();
        // $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').click(function() {
        $('.doc-content').hide();
        $('#' + $(this).attr('data-id')).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').first().click();

});