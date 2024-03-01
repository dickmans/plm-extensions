$(document).ready(function() {

    $('.nav-content').click(function() {
        $('.doc-content').hide();
        $('#' + $(this).attr('data-id')).show();
    });

    $('.nav-content').first().click();

});