$(document).ready(function() {
    
    setUIEvents();

    // getFeatureSettings('transmittals', [], function() {

        // insertSearch({ 
        //     autoClick    : config.portal.autoClick,
        //     inputLabel   : 'Enter part number',
        //     limit        : 15,
        //     number       : true,
        //     contentSize  : 'xs',
        //     tileSubtitle : 'Owner',
        //     search       : false,
        //     workspacesIn : config.portal.workspacesIn,
        //     onClickItem  : function(elemClicked) { openItem(elemClicked); }
        // });

        // insertRecentItems({ 
        //     headerLabel  : 'Recent Items',
        //     search       : false,
        //     reload       : true,
        //     contentSize  : 'xs',
        //     workspacesIn : config.portal.workspacesIn,
        //     onClickItem  : function(elemClicked) { openItem(elemClicked); },
        // });

        // if(!isBlank(wsId) && !isBlank(dmsId)) {

        //     $('#toggle-search').click();
        //     $('#toggle-bom').click();
        //     openItem('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

        // }

    // });

});


function setUIEvents() {

    $('#tabs').children().click(function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        findTransmittals();
    });

    $('#tabs').children().first().click();

}


function findTransmittals() {

    let tab     = $('#tabs').children('.selected').attr('value');
    let filters = [];
    
    switch(tab) {

        case 'new':
            filters.push({
                field       : 'WF_CURRENT_STATE',
                type        : 1,
                comparator  : 2,
                value       : 'Awaiting Acknowledgement'
            });
            break;

        case 'done':
            filters.push({
                field       : 'WF_CURRENT_STATE',
                type        : 1,
                comparator  : 5,
                value       : 'Awaiting Acknowledgement'
            });
            break;

    }
    
    let params = {
        id              : 'list',
        hideHeader      : true,
        search          : true,
        reload          : true,
        singleToolbar   : 'actions',
        // fields          : ['PROJECT_REFERENCE', 'SENDER_USER', 'SUBMISSION_DATE', 'WF_CURRENT_STATE'],
        fields          : ['PROJECT_REFERENCE', 'SENDER_USER', 'SUBMISSION_DATE'],
        layout          : 'table',
        autoClick       : true,
        onClickItem     : function(elemClicked) { openTransmittal(elemClicked); }
    }

    insertResults('309', filters, params);


}

function openTransmittal(elemClicked) {

    insertItemSummary(elemClicked.attr('data-link'), {
        id       : 'panel',
        // bookmark : false,
        contents : [
            { type : 'details'         , params : { 
                id : 'transmittal-details', 
                headerLabel         : 'Properties',
                collapseContents    : true, 
                expandSections      : ['Header', 'Content Summary'],
                sectionsEx          : ['Key Performance Indicators', 'Customer Remarks'],
                editable            : false,
                toggles             : true
            }},
            { type : 'attachments'     , params : { id : 'transmittal-attachments'} },
            { type : 'viewer'          , params : { id : 'transmittal-viewer' } },
            { type : 'workflow-history', className : 'surface-level-3', params : { id : 'transmittal-workflow-history', showNextTransitions : false } },
            { type : 'details'         , params : { 
                id : 'transmittal-remarks', 
                headerLabel         : 'Your Remarks',
                saveButtonLabel     : 'Save Remarks',
                sectionsIn          : ['Customer Remarks'],
                editable            : true,
                hideSections        : true
            }},
        ],
        layout          : 'tabs',
        hideCloseButton : true,
        reload          : true,
        workflowActions : true,
        statesColors : [
            { label : 'New'           , color : '#dd2222', states : ['Awaiting Acknowledgement'] },
            { label : 'Remarks Review', color : '#faa21b', states : ['Remarks Review'] },
            { label : 'Completed'     , color : '#6a9728', states : ['Completed'] }
        ]
    });


}