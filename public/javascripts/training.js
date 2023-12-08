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

    // insertCreateForm(wsId);
    // $('#create-continue').click(function() {
    //     if(!validateForm($('#create-sections'))) {
    //         showErrorMessage('Field validations failed', 'Cannot Create Item');
    //         return;
    //     }
    //     $('#overlay').show();   
    //     submitCreateForm(wsId, $('#create-sections'), '', function(response ) {
    //         let newLink = response.data.split('.autodeskplm360.net')[1];
    //         insertItemDetails(newLink);
    //         insertAttachments(newLink);
    //         clearFields('create-sections');
    //         $('#overlay').hide();  
    //     });
    // });

    // insertRecentItems();

    // get selected item's descriptor and insert in header subtitle
    setHeaderSubtitle(link);

    // define user interaction events
    setUIEvents();

});

// function clickRecentItem(elemClicked) {

//     insertItemDetails(elemClicked.attr('data-link'));

// }

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
