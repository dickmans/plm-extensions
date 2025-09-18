$(document).ready(function() {

         if(theme.toLowerCase() ===  'dark') { $('body').addClass( 'dark-theme'); theme =  'dark'; }
    else if(theme.toLowerCase() === 'black') { $('body').addClass('black-theme'); theme = 'black'; }
    else                                     { $('body').addClass('light-theme'); theme = 'light'; }

    updateLinks();

    $('#theme-selector').val(theme + '-theme');

    $('#tenant-name').html(tenant);
    
    $('#tenant').click(function() {
        window.open('https://' + tenant + '.autodeskplm360.net');
    });

    $('#theme-selector').change(function() {

        $('body').removeClass('dark-theme');
        $('body').removeClass('black-theme');
        $('body').removeClass('light-theme');
        $('body').addClass($(this).val());

        theme = $(this).val().split('-theme')[0];

        $('a').each(function() {

            let href  = $(this).attr('href');
            let index = href.indexOf('theme=');

            if(index > 0) { href = $(this).attr('href').split('theme=')[0] + 'theme=' + theme;
            } else if(href.indexOf('?') < 0) { href += '?theme=' + theme 
            } else { href += '&theme=' + theme }

            $(this).attr('href', href);
        
        });

    });

    $('#troubleshooting').click(function() {
        let href = document.location.href.split('?');
        let base = href[0] += 'troubleshooting';

        if(href.length > 1) base += '?' + href[1];
        
        window.open(base);
    });

    $('#docs').click(function() {
        let href = document.location.href.split('?');
        let base = href[0] += 'docs';

        if(href.length > 1) base += '?' + href[1];
        
        window.open(base);
    });

    $('.tile').click(function(e) {

        $('.tiles-group-title').addClass('hidden');
        $('.tiles-group-subtitle').addClass('hidden');
        $('.tile').addClass('hidden');
        $(this).removeClass('hidden').addClass('max');
        $('body').removeClass('logs');
        $('.with-log').removeClass('with-log');
        $('.with-troubleshooting').removeClass('with-troubleshooting');
        $('#main').addClass('surface-level-1').removeClass('surface-level-2');
    
    });

    $('.tile').each(function() {

        $('<div></div>').appendTo($(this).children('.tile-details').first())
            .addClass('button')
            .addClass('icon')
            .addClass('icon-close')
            .addClass('close-app')
            .click(function(e) {
                $('.tiles-group-title').removeClass('hidden');
                $('.tiles-group-subtitle').removeClass('hidden');
                $('.tile').removeClass('hidden');
                $('.tile').removeClass('max');
                $('.tile').removeClass('with-log');
                $('#main').removeClass('surface-level-1').addClass('surface-level-2');
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

        $('<div></div>').appendTo($(this).children('.tile-details').first())
            .attr('title', 'Toggle Change Log')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-history')
            .addClass('change-log')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                let elemTile = $(this).closest('.tile');
                    elemTile.toggleClass('with-log')
                    elemTile.removeClass('with-troubleshooting');
            });

    });

    $('.tile-button').click(function(e) {
        
        e.preventDefault();
        e.stopPropagation();

        let url = $(this).attr('href');

        if(url.indexOf('//youtu') < 0) {

            let location = document.location.href.split('?');
            url = location[0] + url;
            let concat = (url.indexOf('?') > -1) ? '&' : '?';
            if(location.length > 1)url += concat + location[1];

        }

        window.open(url);

    })

    $('#disclaimer').click(function() {
        $(this).hide();
    });

    $('#version').click(function() {
        $('.close-app').click();
        $('body').toggleClass('logs');
    });
    
});

function updateLinks() {

    let location = document.location.href.split('?');

    $('a').each(function() {

        let href = $(this).attr('href');

        if(href.indexOf('youtu.be') < 0) {
            if(href.indexOf('https://github.com') < 0) {

                let url = location[0] + href;
                if($(this).html() === '') $(this).html(url);
                let concat = (url.indexOf('?') > -1) ? '&' : '?';
                if(location.length > 1)url += concat + location[1];
                $(this).attr('href', url);
                
            }
        }

    });

    $('.code').each(function() {

        let text = $(this).html();
        text = text.replace(/LOCATION/g, location[0]);
        $(this).html(text);

    });

    $('.url').each(function() {
        $(this).html(location[0]);
    });

}