let linkTask = '';


$(document).ready(function() {

    setUIEvents();
    appendOverlay();

    insertMOW({
        headerLabel         : 'My Outstanding Work List',
        size                : 'xxs',
        openInPLM           : true,
        search              : true,
        number              : true,
        columnsEx           : ['State Set On', 'State Set By', 'Workspace'],
        filterByDueDate     : true,
        filterByWorkspace   : false,
        workspacesIn        : [
            'Change Tasks',
            'Change Requests',
            'Change Orders',
            'Problem Reports'
        ],
        onItemClick  : function(elemClicked) { openTask(elemClicked); }
        // onItemDblClick  : function(elemClicked) { openTask(elemClicked); }
    });

});


function setUIEvents() {

    $('#close-task').click(function() {
        $('#task').hide();  
        $('#mow').show();  
    })

    $('#add-affected-item').click(function() {

        $('#add-root').html('');

        console.log('getting active document');

        getActiveDocument($(this).attr('data-context-descriptor')).then(partNumber => {
        
            // let partNumber = 'CAD_30000096';

            console.log(partNumber);

            let params = {
                'wsId'  : config.search.wsId,
                'limit' : 1,
                'query' : partNumber
            }        

            $.get('/plm/search-descriptor', params, function(response) {
            
                if(response.data.items.length > 0) {

                    console.log(response.data.items[0]);
        
                    let link = response.data.items[0].__self__;

                    // let elemTile = genTile(link, '', '', 'view_in_ar', response.data.items[0].descriptor);
                    let elemTile = genTile(link, '', '', 'icon-3d', response.data.items[0].descriptor);
                        elemTile.appendTo($('#add-root'));
                        insertTileActions('add-root');

                    // $('#add-title').html(partNumber);
                    $('#add').show();
                    insertChildrenChanged(link, 'add-list', '80');
                    
                } else {
        
                    showErrorMessage('Error when searching item', 'Could not find matching item when searching for ' + partNumber);
        
                }
            });        

        });

    });

    // $('#workflow-actions').change(function() {
    //     performWorkflowAction($(this));
    // });

    $('#add-select').click(function() {
        $('#add-list').children().addClass('selected');
    });
    $('#add-deselect').click(function() {
        $('#add-list').children().removeClass('selected');
    });
    $('#add-cancel').click(function() {
        $('#add').hide();
    });
    $('#add-confirm').click(function() {
        $('#add').hide();

        let items = [ $('#add-root').children().first().attr('data-link') ];

        $('#add-list').children('.selected').each(function() {
            items.push($(this).attr('data-link'));
        });

        console.log(items);

        $.get('/plm/add-managed-items', { 'link' : $('#task').attr('data-link'), 'items' : items }, function(response) {
            console.log(response);
            // $('.is-selected').click();
            insertManagedItems($('#task').attr('data-link'), 'managed-items', 'settings');
        });

    });


    // $('#dev').click(function() {

    //     console.log(new Date().getTime());

    //     $.get('/plm/workspaces', {}, function(response) {
    //         console.log(response);
    //         console.log(new Date().getTime());
    //     });

    // });

}



// Click entry in the tasks list
function openTask(elemClicked) {

    let link = elemClicked.attr('data-link');

    linkTask = link;

    insertItemSummary(link, {
        id       : 'task',
        bookmark : true,
        contents : [
            { 
                type      : 'details', 
                className : 'surface-level-1', 
                params : { 
                    id        : 'task-details', 
                    collapsed : true, 
                    editable  : true ,
                    toggles   : true
                } 
            },{ 
                type      : 'attachments', 
                className : 'surface-level-1', 
                params : { 
                    id              : 'task-attachments',
                    editable        : true,
                    layout          : 'list',
                    singleToolbar   : 'controls',
                    contentSize     : 'm'
                } 
            },{ 
                type      : 'managed-items', 
                className : 'surface-level-1', 
                params : { 
                    id     : 'task-managed-items',
                    layout : 'list',
                    search : true,
                    onLoadComplete : function(id) { genPLMItemsAddinActions(id); }
                } 
            },{ 
                type      : 'workflow-history', 
                className : 'surface-level-1', 
                params : { 
                    id     : 'task-workflow-history'
                } 
            }
        ],
        statesColors : [
            { label : 'Planning',    color : '#000000', states : ['Create']  },
            { label : 'Review',      color : '#ffa600', states : ['Review', 'Review & Impact Analysis', 'Peform Tasks', 'Change Control Board Review']  },
            { label : 'In Work',     color : '#ee4444', states : ['Change Order in progress']   },
            { label : 'Completed',   color : '#8fc844', states : ['Completed'] }
        ],
        layout          : 'tabs',
        openInPLM       : true,
        reload          : true,
        toggleBodyClass : 'display-task',
        workflowActions : true
    });  



    // insertItemSummary()


    // $('#overlay').show();

    // setItemTabLabels(link.split('/')[4], function(permissions) {

    //     $('#overlay').hide();
    //     $('#mow').hide();
    //     $('#task').show();
    //     $('#attachments-count').hide();
    //     $('.screen').removeClass('surface-level-1');
    //     $('.screen').addClass('surface-level-2');
        
    //     // $('.is-selected').removeClass('is-selected');
    //     // elemClicked.addClass('is-selected');
    
    
    
    //     $('#task-title').html(elemClicked.attr('data-title'));
    //     $('#add-affected-item').attr('data-context-descriptor', elemClicked.attr('data-title'));
        
    //     insertDetails(link, {
    //         compactDisplay  : true,
    //         header      : false
    //         // layout          : 'narrow'
    //     });
    //     insertItemStatus(link, 'task-status');
    //     insertWorkflowActions(link);

    //     if(permissions.includes('attachments')) insertAttachments(link, {
    //             id      : 'attachments',
    //             header  : true,
    //             layout  : 'list',
    //             size    : 'xs',
    //             upload  : true
    //         });

    //     if(permissions.includes('managedItems')) insertManagedItems(link, {
    //         layout      : 'list',
    //         headerLabel : ''
    //     });

    //     if(permissions.includes('workflow'))insertWorkflowHistory(link, { 
    //         header               : false,
    //         id                   : 'history',
    //         showNextTransitions : false
    //     });

    // });


    // insertItemStatus(link, 'task-status');
    // insertWorkflowActions(link);
    // 
    // insertManagedItems(link, 'managed-items', 'settings');
    // 
    // insertWorkflowHistory(link, { 
    //     header               : false,
    //     id                   : 'history',
    //     showNextTransitions : false
    // });


}

function insertItemDetailsDone(id) {

    $('.linking.field-value').each(function() {
        
        let elemField  = $(this);
        let fieldLink  = elemField.attr('data-item-link');

        if(!isBlank(fieldLink)) {

            let wsId = fieldLink.split('/')[4];

            if(wsId == config.items.wsId) {

                elemField.addClass('surface-level-1').html('');

                $.get('/plm/details', { link : fieldLink} , function(response) {

                    let itemNumber  = getSectionFieldValue(response.data.sections, config.items.fieldIdNumber, '');
                    let pdmFileName = getSectionFieldValue(response.data.sections, 'PRIMARY_FILE_NAME', '');
                    let pdmLocation = getSectionFieldValue(response.data.sections, 'PDM_LOCATION', '');
                    let elemTile    = genTile(elemField.attr('data-item-link'), '', '', 'icon-product', response.data.title);
                        
                    elemField.addClass('tiles').addClass('list').addClass('xxxs');
                    elemField.attr('id', 'field-AFFECTED_ITEM');
                    elemTile.appendTo(elemField);
                    elemTile.css('color', 'var(--color-font)')
                        .addClass('plm-item')
                        .addClass('component')
                        .attr('data-id'    , itemNumber)
                        .attr('data-name'  , pdmFileName)
                        .attr('data-folder', pdmLocation);

                    insertAddinTileActions(elemTile);

                        // insertTileAction(elemTile, false, true, true, true, true);


                });
            }
        }

    });

}
function insertManagedItemsDone() {

    insertTileActions('managed-items-list');

    $('<div></div>').insertBefore($('#managed-items-filter-lifecycle'))
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-link')
        .addClass('default')
        .html('Add Active Document')
        .click(function() {
            addActiveDocument();
            // getActiveDocument().then(function(partNumber) {
            // getActiveDocument('-').then(partNumber => {
                // console.log(partNumber);
            // });

            // viewerGetSelectedComponentPaths().then(function(selectedComponentPaths) {
                // addSelectedFeatureItems(elemFeature, selectedComponentPaths)
            // });



        });

}
function addActiveDocument() {

    $('#add-root').html('');

    console.log('getting active document');

    getActiveDocument($(this).attr('data-context-descriptor')).then(partNumber => {
    
        console.log(partNumber);

        $('#managed-items-no-data').hide();
        $('#managed-items-processing').show();

        let requests = [
            $.get('/plm/search-descriptor'  , { wsId : config.items.wsId, limit : 1, query : partNumber }),
            $.get('/plm/sections'           , { wsId : config.items.wsId }  ),
            $.get('/vault/search-items'     , { query : partNumber }),
        ]

        Promise.all(requests).then(function(responses) {

            console.log(responses);

            let plmItems    = responses[0].data.items;
            let plmSections = responses[1].data;
            let vaultItems  = responses[2].data.results;
            let params      = { sections : [] }

            addFieldToPayload(params.sections, plmSections, null, config.items.fieldIdNumber, partNumber);
            
            if(vaultItems.length > 0) {

                let vaultItem = vaultItems[0];

                addFieldToPayload(params.sections, plmSections, null, 'TITLE', vaultItem.title);
                addFieldToPayload(params.sections, plmSections, null, 'DESCRIPTION', vaultItem.description);
                addFieldToPayload(params.sections, plmSections, null, 'PDM_CATEGORY', vaultItem.category);
                addFieldToPayload(params.sections, plmSections, null, 'PDM_STATUS_NAME', vaultItem.state);
                addFieldToPayload(params.sections, plmSections, null, 'PDM_ITEM_REVISION', vaultItem.revision);
                addFieldToPayload(params.sections, plmSections, null, 'RESPONSIBLE_DESIGNER', vaultItem.lastModifiedUserName);

            }

            console.log(params);
        
            if(plmItems.length === 0) {

                params.wsId = config.items.wsId;

                $.post('/plm/create', params, function(response) {

                    let link = response.data.split('.autodeskplm360.net')[1];

                    $.get('/plm/add-managed-items', { link : linkTask, items : [link] }, function(response) {
                        insertManagedItems(linkTask, {
                            layout      : 'list',
                            headerLabel : ''
                        });
                    });

                });
                
            } else {

                params.link = plmItems[0].__self__;

                let requestsUpdate = [
                    $.post('/plm/edit', params),
                    $.get('/plm/add-managed-items', { link : linkTask, items : [params.link] })
                ]

                Promise.all(requestsUpdate).then(function(responses) {

                    console.log(responses);

                    insertManagedItems(linkTask, {
                        layout      : 'list',
                        headerLabel : ''
                    });

                });
            }
        });        
    });

}


function insertAttachmentsDone() {

    $('#attachments-upload').prependTo($('#task-toolbar'));
    $('#attachments-header').remove();
    
    let count = $('#attachments-list').children().length;

    if(count > 0)  $('#attachments-count').show();

}



// Perform selected workflow action
function performWorkflowAction(elemAction) {

    $('#overlay').show();

    let link = elemAction.attr('data-link');

    $.get('/plm/transition', { 'link' : link, 'transition' : elemAction.val()}, function() {
        $('#overlay').hide();
        $('.is-selected').click();
    });

}



function clickManagedItem(elemClicked) {

    let title = elemClicked.attr('data-title');
    let partNumber = title.split(' - ')[0];

    openComponent(partNumber);

}



function clickWorkflowActionDone() {
    insertItemStatus(linkTask, 'task-status');
        insertWorkflowActions(linkTask);

    insertManagedItems(linkTask, {
        layout      : 'list',
        headerLabel : ''
    });

}


function insertChildrenChangedDone(id) { 
    insertTileActions(id); 
    $('#' + id).children().addClass('selected');
}
function clickChildrenChangedItem(elemClicked) { elemClicked.toggleClass('selected'); }