$(document).ready(function() {
    
    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    // call methods of common/utils.js to insert DOM elements
    appendProcessing('attachments', false);
    appendProcessing('details', false);
    appendViewerProcessing();
    appendOverlay();
    
    // call methods of common/ui.js to insert PLM data
    insertViewer(link, 240);
    insertItemDetails(link);
    insertAttachments(link);

    // get selected item's descriptor and insert in header subtitle
    setHeaderSubtitle(link);

    // define user interaction events
    setUIEvents();
    
});

function setHeaderSubtitle(link) {

    $.get('/plm/descriptor', { 'link' : link }, function(response) {
        $('#header-subtitle').html(response.data);
    });

}

function setUIEvents() {

    // Header Toolbar
    $('#button-settings').click(function() {
        showErrorMessage('Not implemented yet');
    });

}
