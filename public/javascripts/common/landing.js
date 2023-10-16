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
            $('.with-log').removeClass('.with-log');
            $('.tiles').addClass('surface-level-1');
        }
    });

    $('.tile').each(function() {
        let elemButtonClose = $('<div></div>');
            // elemButtonClose.html('Close');
            elemButtonClose.addClass('button');
            elemButtonClose.addClass('icon');
            elemButtonClose.addClass('icon-close');
            elemButtonClose.addClass('close-app');
            elemButtonClose.appendTo($(this).children('.tile-details').first());
            elemButtonClose.click(function(e) {
                $('.tile').show();
                $('.tile').removeClass('max');
                $('.tile').removeClass('with-log');
                $('.tiles').removeClass('surface-level-1');
                e.preventDefault();
                e.stopPropagation();
            });

        let elemButtonLog = $('<div></div>');
            elemButtonLog.attr('title', 'Toggle Change Log');
            elemButtonLog.addClass('button');
            elemButtonLog.addClass('icon');
            elemButtonLog.addClass('icon-history');
            elemButtonLog.addClass('change-log');
            elemButtonLog.appendTo($(this).children('.tile-details').first());
            elemButtonLog.click(function() {
                $(this).closest('.tile').toggleClass('with-log');
            });


    });

    $('#version').click(function() {
        $('.close-app').click();
        $('body').toggleClass('logs');
    });
    
});

function updateLinks(location) {

    $('a').each(function() {

        let href = $(this).attr('href');

        if(href.indexOf('youtu.be') < 0) {

            let url = location + href;

            $(this).attr('href', url);

            if($(this).html() === '') $(this).html(url);

        }

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