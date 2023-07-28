$(document).ready(function() {

    updateLinks(document.location.href);

    $('#tenant').html(tenant);
    
    $('#tenant').click(function() {
        window.open('https://' + tenant + '.autodeskplm360.net');
    });

    $('.tile').click(function(e) {

        if(e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            window.open($(this).find('a').attr('href'), '_blank');
        } else {
            $(this).siblings().hide();
            $(this).addClass('max');
            $('body').removeClass('logs');
            $('.tiles').addClass('surface-level-1');
            $('#close-app').show();
        }
    });

    $('#close-app').click(function() {
        $(this).hide();
        $('.tile').show();
        $('.tile').removeClass('max');
        $('.tiles').removeClass('surface-level-1');
    });

    $('#version').click(function() {
        $('#close-app').click();
        $('body').toggleClass('logs');
    });
    
});

function updateLinks(location) {

    $('a').each(function() {

        let url = location + $(this).attr('href');

        $(this).attr('href', url);

        if($(this).html() === '') $(this).html(url);

    });

    $('.code').each(function() {

        let text = $(this).html();

        text = text.replace(/LOCATION/g, location);

        $(this).html(text);

    });

    $('.url').each(function() {


        $(this).html(location);

    });


}