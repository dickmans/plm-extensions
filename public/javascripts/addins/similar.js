$(document).ready(function() {

    setUIEvents();

    let layout = 'table';

    if(window.innerWidth < 900) layout = 'grid';
    if(window.innerWidth < 500) layout = 'list';

    layout = 'list';

    insertItemClassContents(urlParameters.link, {
        id                : 'contents',
        layout            : layout,
        contentSizes      : ['xs', 'm', 'l'],
        singleToolbar     : 'actions',
        fields            : ['DESCRIPTOR', 'REVISION', 'LIFECYCLE'],
        filterByStatus    : true,
        filterByWorkspace : true,
        reload            : true,
        search            : true,
        openInPLM         : true,
        referenceItem     : { __self__ : urlParameters.link},
        afterCompletion   : function(id) { afterClassContentsCompletion(id); },
    }, {
        id         : 'filters-list',
        idContents : 'contents',
        hideHeader : true,
        advanced   : false
    });

});

function setUIEvents() {

    $('#filters-toggle').click(function() {
        $('body').toggleClass('no-filters');
    });

}

function afterClassContentsCompletion(id) {

    let elemContent = $('#' + id + '-content');

    elemContent.find('.content-item').each(function() {

        let elemTile    = $(this);
        let elemActions = elemTile.find('.tile-actions');

        elemTile.addClass('plm-item');

        if(elemActions.length === 0) {
            elemActions = $('<div></div>').appendTo(elemTile).addClass('tile-actions');
            genAddinPLMItemTileActions(elemActions);
        }

    });

}