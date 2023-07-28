$(document).ready(function() {

    setUIEvents();

});



// Set UI controls
function setUIEvents() {

    $('#applications').children().click(function() {
        document.location.href = $(this).attr('data-link');
    });
}