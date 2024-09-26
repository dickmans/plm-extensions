let stopped = false;


$(document).ready(function() {

    // Toggle Console Panel
    $('#console-toggle').click(function() {
        $(this).toggleClass('icon-chevron-right').toggleClass('icon-chevron-left');
        $('body').toggleClass('no-console');
    })

});


function addLogEntry(text, type, number) {

    if(stopped) return;

    if(isBlank(type)) type = '';
    
    let prefix    = '';
    let className = type;

    switch(type) {

        case 'diff'    : prefix = '! '; break;
        case 'match'   : prefix = '+ '; break;
        case 'error'   : prefix = '&nbsp;!&nbsp;'; className = 'red'; break;
        case 'success' : prefix = '&nbsp;+&nbsp;'; className = 'green';  break;
        case 'head'    : prefix = ''   ; break;
        case 'notice'  : prefix = '&nbsp;-&nbsp;'; break;
        case 'count'   : prefix = '[' + number + '] '; break;
        default        : prefix = type; break;

    }

    $('<div></div>').appendTo($('#console-content'))
        .addClass('console-text')
        .addClass(className)
        .html('<span>' + prefix + '</span>' + text);

    let divElement = document.getElementById('console-content');
        divElement.scrollTop = divElement.scrollHeight;

}
function addLogSeparator() {

    if(stopped) return;

    $('<div></div>').appendTo($('#console-content'))
        .addClass('console-separator')
        .html('-------------------------------------------------------------');

    let divElement = document.getElementById('console-content');
        divElement.scrollTop = divElement.scrollHeight;

}
function addLogSpacer() {

    if(stopped) return;

    $('<div></div>').appendTo($('#console-content')).addClass('console-spacer');

    let divElement = document.getElementById('console');
        divElement.scrollTop = divElement.scrollHeight;

}
function addLogEnd() {

    if(stopped) return;

    $('<div></div>').appendTo($('#console-content'))
        .addClass('console-text')
        .addClass('final')
        .html('### END ###');

    let divElement = document.getElementById('console-content');
        divElement.scrollTop = divElement.scrollHeight

}
function addLogStopped() {

    stopped = true;

    $('<div></div>').appendTo($('#console-content'))
        .addClass('console-text')
        .addClass('final')
        .html('### STOPPED BY USER ###');

    let divElement = document.getElementById('console-content');
        divElement.scrollTop = divElement.scrollHeight

}