$(document).ready(function() {

    updateLinks(document.location.href);

    $('.tile').click(function() {
        $(this).siblings().hide();
        $(this).addClass('max');
        $('.tiles').addClass('surface-level-1');
        $('#close-app').show();
    });

    $('#close-app').click(function() {
        $(this).hide();
        $('.tile').show();
        $('.tile').removeClass('max');
        $('.tiles').removeClass('surface-level-1');
    });
    
});

function updateLinks(location) {

    $('a').each(function() {

        let url = location + $(this).attr('href');

        $(this).attr('href', url);
        $(this).html(url);

    });

    $('.code').each(function() {

        let text = $(this).html();

        text = text.replace(/LOCATION/g, location);

        $(this).html(text);

    });

}