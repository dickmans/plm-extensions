$(document).ready(function() {
    
    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    insertViewer(link);
    insertBOM(link, { bomViewName : 'Details', hideDetails : true} );
    insertDetails(link);
    insertAttachments(link);
    setHeaderSubtitle(link);

    setUIEvents();

});

function setHeaderSubtitle(link) {

    $.get('/plm/descriptor', { 'link' : link }, function(response) {
        $('#header-subtitle').html(response.data);
    });

}

function setUIEvents() {

    // Implement your UI events here

}

function clickBOMItemDone(elemClicked) {

    if(elemClicked.hasClass('selected')) { 
        viewerSelectModel(elemClicked.attr('data-part-number'));
        insertDetails(elemClicked.attr('data-link'));
        insertAttachments(elemClicked.attr('data-link'));
    } else {
        viewerResetSelection();
    }

}


