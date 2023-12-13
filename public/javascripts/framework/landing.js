$(document).ready(function() {

    updateLinks(document.location.href);

    $('#tenant').html(tenant);
    
    $('#tenant').click(function() {
        window.open('https://' + tenant + '.autodeskplm360.net');
    });

    $('.tile').click(function(e) {

        if(e.shiftKey) {
            if($(this).hasClass('max')) return;
            e.stopPropagation();
            e.preventDefault();
            window.open($(this).find('a').attr('href'), '_blank');
        } else {
            $(this).siblings().hide();
            $(this).addClass('max');
            $('body').removeClass('logs');
            $('.with-log').removeClass('with-log');
            $('.with-troubleshooting').removeClass('with-troubleshooting');
            $('.tiles').addClass('surface-level-1');
        }
    });

    $('.tile').each(function() {

        let elemButtonClose = $('<div></div>');
            elemButtonClose.addClass('button');
            elemButtonClose.addClass('icon');
            elemButtonClose.addClass('icon-close');
            elemButtonClose.addClass('close-app');
            elemButtonClose.appendTo($(this).children('.tile-details').first());
            elemButtonClose.click(function(e) {
                $('.tiles').children().show();
                $('.tile').removeClass('max');
                $('.tile').removeClass('with-log');
                $('.tiles').removeClass('surface-level-1');
                e.preventDefault();
                e.stopPropagation();
            });

        if($(this).children('.troubleshooting').length) {

            let elemButtonTroubleshooting = $('<div></div>');
                elemButtonTroubleshooting.attr('title', 'Toggle Troubleshooting');
                elemButtonTroubleshooting.addClass('button');
                elemButtonTroubleshooting.addClass('icon');
                elemButtonTroubleshooting.addClass('filled');
                elemButtonTroubleshooting.addClass('icon-info');
                elemButtonTroubleshooting.addClass('troubleshooting-button');
                elemButtonTroubleshooting.appendTo($(this).children('.tile-details').first());
                elemButtonTroubleshooting.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let elemTile = $(this).closest('.tile');
                        elemTile.toggleClass('with-troubleshooting')
                        elemTile.removeClass('with-log');
                });

        }

        let elemButtonLog = $('<div></div>');
            elemButtonLog.attr('title', 'Toggle Change Log');
            elemButtonLog.addClass('button');
            elemButtonLog.addClass('icon');
            elemButtonLog.addClass('icon-history');
            elemButtonLog.addClass('change-log');
            elemButtonLog.appendTo($(this).children('.tile-details').first());
            elemButtonLog.click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                let elemTile = $(this).closest('.tile');
                    elemTile.toggleClass('with-log')
                    elemTile.removeClass('with-troubleshooting');
            });

    });

    $('#disclaimer').click(function() {
        $(this).hide();
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