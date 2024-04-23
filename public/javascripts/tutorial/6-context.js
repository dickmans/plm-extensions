$(document).ready(function() {
    
    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    insertViewer(link);
    insertBOM(link);
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