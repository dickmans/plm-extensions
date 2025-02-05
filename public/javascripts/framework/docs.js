$(document).ready(function() {

    $('#gallery').click(function() {
        document.location.href = document.location.href.split('/docs')[0] + '/gallery';
    })

    $('.nav-header').click(function() {
        $(this).toggleClass('collapsed');
        $(this).next().toggle();
        $(this).next().next().toggle();
        // $('.doc-content').hide();
        // $('#' + $(this).attr('data-id')).show();
        // $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').click(function() {
        $('.nav-content').removeClass('selected');
        $(this).addClass('selected');
        $('.doc-content').hide();
        $('#' + $(this).attr('data-id')).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('span.ref').click(function() {
        let id = $(this).attr('data-id')
        $('.nav-content').removeClass('selected');
        $('.nav-content').each(function() {
            if($(this).attr('data-id') === id) $(this).addClass('selected');
        });
        $('.doc-content').hide();
        $('#' + id).show();
        $('#doc-contents').animate({ scrollTop: 0 }, 250);
    });

    $('.nav-content').first().click();

    updateLinks();

});


function updateLinks() {

    let location = document.location.href.split('/docs');

    $('a.button').each(function() {

        let href = $(this).attr('href');

        if(href.indexOf('youtu.be') < 0) {

            let url = location[0] + '/' + href;
            if($(this).html() === '') $(this).html(url);
            let concat = (url.indexOf('?') > -1) ? '&' : '?';
            if(location.length > 1)url += concat + location[1];
            $(this).attr('href', url);
            
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