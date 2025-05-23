let linkTask = '';


$(document).ready(function() {

    setUIEvents();
    appendOverlay();

    insertMOW({
        headerLabel       : config.addins.tasks.headerLabelTasks,
        number            : true,
        filterByDueDate   : true,
        filterByWorkspace : true,
        reload            : true,
        search            : false,
        contentSize       : 'xxs',
        columnsEx         : config.addins.tasks.columnsExTasks,
        workspacesIn      : config.addins.tasks.workspacesInTasks,
        onClickItem : function(elemClicked) { openTask(elemClicked); }
    });

});


function setUIEvents() {

    $('#close-task').click(function() {
        $('#task').hide();  
        $('#mow').show();  
    })

    $('#add-affected-item').click(function() {

        $('#add-root').html('');


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

}


// Click entry in the My Outstanding Work list
function openTask(elemClicked) {

    linkTask = elemClicked.attr('data-link');

    insertItemSummary(linkTask, {
        id              : 'task',
        bookmark        : false,
        layout          : 'tabs',
        openInPLM       : true,
        reload          : true,
        toggleBodyClass : 'display-task',
        workflowActions : true,
        contents        : [{ 
            type   : 'details', 
            params : { 
                id              : 'task-details', 
                expandSections  : config.addins.tasks.expandSectionsTask, 
                editable        : true,
                toggles         : true,
                afterCompletion : function(id) { setPicklistActions(id); }
            } 
        },{ 
            type   : 'attachments', 
            params : { 
                id              : 'task-attachments',
                editable        : true,
                layout          : 'list',
                singleToolbar   : 'controls',
                contentSize     : 'm'
            } 
        },{ 
            type   : 'managed-items', 
            params : { 
                id     : 'task-managed-items',
                layout : 'list',
                search : true,
                afterCompletion : function(id) { setManagedItemsActions(id); }
            } 
        },{ 
            type      : 'workflow-history', 
            params : { 
                id     : 'task-workflow-history'
            } 
        }],
        statesColors : [
            { label : 'Planning',    color : '#000000', states : ['Create']  },
            { label : 'Review',      color : '#ffa600', states : ['Review', 'Review & Impact Analysis', 'Peform Tasks', 'Change Control Board Review']  },
            { label : 'In Work',     color : '#ee4444', states : ['Change Order in progress', 'Assigned', 'In Work']   },
            { label : 'Completed',   color : '#8fc844', states : ['Completed'] }
        ]

    });  

}
function setPicklistActions(id) {
    
    $('.field-multi-picklist-item').each(function() {
        
        let elemFieldItem  = $(this);
        let fieldItemLink  = elemFieldItem.attr('data-link');

        elemFieldItem.hide();
        
        if(!isBlank(fieldItemLink)) {

            let wsId       = fieldItemLink.split('/')[4];
            let elemParent = elemFieldItem.parent();

            if(wsId == config.items.wsId) {

                elemParent.addClass('tiles').addClass('list').addClass('xxs').addClass('surface-level-2');

                $.get('/plm/details', { link : fieldItemLink} , function(response) {

                    let partNumber  = getSectionFieldValue(response.data.sections, config.items.fieldIdNumber, '');
                    let pdmFileName = getSectionFieldValue(response.data.sections, 'PRIMARY_FILE_NAME', '');
                    let pdmLocation = getSectionFieldValue(response.data.sections, 'PDM_LOCATION', '');

                    let elemTile    = genSingleTile({
                        link        : fieldItemLink,
                        partNumber  : partNumber,
                        subtitle    : pdmFileName,
                        tileIcon    : 'icon-product',
                        title       : response.data.title
                    },{});
                        
                    elemTile.appendTo(elemParent);
                    elemTile.css('color', 'var(--color-font)')
                        .addClass('plm-item')
                        .addClass('component')
                        .attr('data-type'  , 'plm-item')
                        .attr('data-id'    , partNumber)
                        .attr('data-name'  , pdmFileName)
                        .attr('data-folder', pdmLocation);

                    genAddinTileActions(elemTile);

                    elemFieldItem.remove();

                });
            }

        }

    });

}
function setManagedItemsActions(id) {

    let elemContent = $('#' + id + '-content');

    elemContent.children('.tile').each(function() { $(this).attr('data-type', 'plm-item'); });

    genAddinTilesActions(elemContent); 

    $('<div></div>').appendTo($('#task-managed-items-controls'))
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-link')
        .addClass('default')
        .html('Add Selected')
        .click(function() {
            addSelected();
        });

}
function addSelected() {

    $('#add-root').html('');

    getActiveDocument($(this).attr('data-context-descriptor')).then(partNumber => {
    
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