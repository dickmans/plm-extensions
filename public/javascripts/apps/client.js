let workspaces  = [];
let maxRequests = 3;
let isPhone     = (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i));


$(document).ready(function() {

    appendProcessing('workspaces');
    appendProcessing('workspace');
    appendProcessing('mow');
    appendProcessing('create');
    appendProcessing('recents');
    appendProcessing('bookmarks');
    appendProcessing('search');

    appendProcessing('item-manages');
    appendProcessing('item-related');
    appendProcessing('item-change-log');

    appendViewerProcessing();
    appendOverlay(true);

    setWorkspaces(function() {
        gotoItem();
    });
    setUIEvents();

    setMOW();
    setRecents();
    setBookmarks();

});



// Set UI controls
function setUIEvents() {


    // Main Toolbar
    $('#back').click(function() {
        let view = $('#item-toolbar').children('.selected').attr('id');
        openItem($(this).attr('data-link'), $(this).attr('data-view'));
        $(this).hide();
        $('#forward').attr('data-link', $(this).attr('data-link')).attr('data-view', view).show();
    });
    $('#forward').click(function() {
        let view = $('#item-toolbar').children('.selected').attr('id');
        openItem($(this).attr('data-link'), $(this).attr('data-view'));
        $(this).hide();
        $('#back').attr('data-link', $(this).attr('data-link')).attr('data-view', view).show();
    });

    // Home Screen Toolbar
    $('#toolbar > div').click(function() {
        $('.screen').hide();
        $('#' + $(this).attr('data-id')).show();
        if($(this).attr('data-id') === 'workspaces') $('#workspace').show();
        if($(this).attr('data-id') === 'search') $('#search-input').focus();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });


    // Adjust UI for client
    if(navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i)) {
        $('#button-recents').click();
    } else {
        $('#mow-refresh').appendTo('#dashboard-mow');
        $('#mow-list').appendTo('#dashboard-mow');
        $('#mow-process').appendTo('#dashboard-mow');
        $('#bookmarks-refresh').appendTo('#dashboard-bookmarks');
        $('#bookmarks-list').appendTo('#dashboard-bookmarks');
        $('#bookmarks-process').appendTo('#dashboard-bookmarks');
        $('#recents-refresh').appendTo('#dashboard-recents');
        $('#recents-list').appendTo('#dashboard-recents');
        $('#recents-process').appendTo('#dashboard-recents');
        $('#button-dashboard').click();
    }

    // Workspace view return
    $('#workspace-back').click(function() {
        
        $('#workspaces').animate({ left : '0px', right : '0px'}, function() {
            $('#workspaces-list').css('overflow-y', 'auto');
        });
        $('#workspace').animate({ left : '100%', right : '-100%'}, function() {
            
        });
    });

    // Home Screen Views Refresh Buttons
    $('#workspaces-refresh').click(function() { setWorkspaces(); });
    $('#create-refresh').click(function() { setWorkspaces(); });
    $('#mow-refresh').click(function() { setMOW(); });
    $('#bookmarks-refresh').click(function() { setBookmarks(); });
    $('#recents-refresh').click(function() { setRecents(); });
    

    // Workspace View Selector and Filter
    $('#workspace-views').change(function() {
        getWorkspaceViewData([]);
    });
    $('#workspace-filter').keyup(function() {
        // console.log($('#workspace-filter').val());
        filterList('workspace-list', $('#workspace-filter').val());
    });


    // Create
    $('#new-action-save').click(function() {

        $('#overlay').show();

        let wsIdNew = $('#new').attr('data-wsid');
        let linkedWorkspaces = [];

        submitCreateForm(wsIdNew, $('#new-sections'), null, {}, function(response) {
            
            $('#overlay').hide();

            if(response.error) {

                showErrorMessage('Error', response.message);

            } else {

                let link = response.data.split('360.net')[1];

                if(typeof $('#item').attr('data-linked-workspaces') !== 'undefined') {
                    if(   $('#item').attr('data-linked-workspaces') !== '') {
                        linkedWorkspaces = $('#item').attr('data-linked-workspaces').split(',');
                    }
                }

                $('#new').hide();

                if(linkedWorkspaces.indexOf(wsIdNew) > -1) {
                    console.log('adding');
                    $.get('/plm/add-managed-items', { 'link' : link, 'items' : [ $('#item').attr('data-link') ] }, function() {
                        openItem(link);
                    });
                } else {
                    openItem(link);
                }
            }
        });

    });
    $('#new-action-cancel').click(function() {
        $('#new').hide();
    });


    // BOM Filter
    $('#bom-filter').keyup(function() {
        filterList('item-bom-list', $('#bom-filter').val());
    });


    // File Upload
    $('#frame-download').on('load', function() {
        console.log('refersh frame');
        $('#overlay').hide();
        $('#item-button-files').click();
        let ws = getWorkspaceDefinition($('#item').attr('data-wsid'));
        setItemAttachments($('#item').attr('data-link'));
    });
    // $("#item-action-upload").click(function() {
    
    //     let urlUpload = "/plm/upload/";
    //         urlUpload += $('#item').attr('data-wsId') + "/";
    //         urlUpload += $('#item').attr('data-dmsId');
    
    //     $("#uploadForm").attr("action", urlUpload);    
    //     $("#select-file").click();
        
    // }); 
    $("#select-file").change(function() {
        
        var file = document.getElementById("select-file")//All files

        if(file.files.length > 0) {
            $('#overlay').show();
            $("#uploadForm").submit();
        }
        
    });


    // Search
    $('#search-input').keypress(function(e) {
        if(e.which == 13) {
            performSearch();
        }
    });
    $('#search-submit').click(function() {
        performSearch();
    });


    // Item Header Button
    $('#item-header-menu').click(function() {
        $('#item-menu').toggle();
    });
    $('#item-header-close').click(function() { 
        $('#back').hide();
        $('#forward').hide();
        $('#item').fadeOut(); 
        $('#item').attr('data-link', ''); 
        $('.previous').show().removeClass('previous');
    });


    $('#item-attachments-upload-files').click(function() {

    });
    // $('#item-action-edit').click(function() {
    //     openItemEditor();
    // });
    $('#item-edit-cancel').click(function() {
        $('#item-edit').hide();
        $('#item-edit-toolbar').hide();
    });
    $('#item-edit-save').click(function() {
        saveChanges();
    });
    $('#item-action-archive').click(function() {

        $('#overlay').show();

        let link = $('#item').attr('data-link');

        $.get('/plm/archive', { 'link' : link }, function(response) {
            $('#overlay').hide();
            if(response.status === 204) openItem(link);
            else showErrorMessage(response.data.message);
        });

    });
    $('#item-action-unarchive').click(function() {

        $('#overlay').show();

        let link = $('#item').attr('data-link');

        $.get('/plm/unarchive', { 'link' : link }, function() {
            $('#overlay').hide();
            openItem(link);
        });

    });


    // Item Views Toolbar
    $('#item-toolbar > div').click(function() {
        $('.item-content').hide();
        $('#' + $(this).attr('data-id')).show();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
    });
    $(document).click(function(event) { 
        var $target = $(event.target);
        if(!$target.closest('#item-header-menu').length && 
        $('#item-menu').is(":visible")) {
          $('#item-menu').hide();
        }        
    });


    // Messages dialog
    $('#message-close').click(function() {
        $('#message').hide();
    });

}


// Display error messages
function showErrorMessage(message) {
    $('#message-header').html('Error occured');
    $('#message-text').html(message);
    $('#message').show();
}



// Retrieve workspaces list
function setWorkspaces(callback) {

    $('#workspaces-processing').show();
    $('#create-processing').show();

    let elemList       = $('#workspaces-list').html('');
    let elemListCreate = $('#create-list').html('');

    $.get('/plm/workspaces', { useCache : true }, function(response) {

        workspaces = [];

        for(let workspace of response.data.items) {

            workspaces.push({
                'id'            : workspace.link.split('/')[4],
                'title'         : workspace.title,
                'icon'          : workspace.category.icon,
                'category'      : workspace.category,
                'link'          : workspace.link,
                'create'        : (workspace.permissions.indexOf('Create') > -1),
                'update'        : (workspace.permissions.indexOf('Update') > -1),
                'delete'        : (workspace.permissions.indexOf('Delete') > -1),
                'fields'        : [],
                'sections'      : [],
                'permissions'   : [],
                'picklists'     : [-1],
                'picklistFields': [],
                'tableaus'      : [],
                'bomViews'      : [],
                'bomViewDefs'   : [],
                'processes'     : []
            })
        }

        sortArray(workspaces, 'title', 'String', 'ascending');

        for(let workspace of workspaces) {

            workspace.picklists = [];

            $('<div></div>').appendTo(elemList)
                .html(workspace.title)
                .attr('data-id', workspace.id)
                .click(function() {
                    openWorkspaceView($(this).attr('data-id'));
                });

            if(workspace.create) {

                $('#button-create').show();

                $('<div></div>').appendTo(elemListCreate)
                    .attr('data-id', workspace.id)
                    .html(workspace.title)
                    .click(function() {
                        // showCreateDialog($(this).attr('data-id'), null);
                        showCreateDialog(workspace.title, workspace.id, null);

                        

                    });

            }
        }

        $('#workspaces-processing').hide();
        $('#create-processing').hide();

        callback();

    });

}



// Set mow counter
function setMOW() {

    let elemList = $('#mow-list').html('');

    $('#mow-processing').show();

    $.get( '/plm/mow', {}, function(response) {

        let data = response.data;

        $('#mow-processing').hide();

        let now = new Date().getTime();

        for(item of data.outstandingWork) {

            let dateClass = '';
            let date = '';

            if(item.hasOwnProperty('milestoneDate')) {
                let targetDate = new Date(item.milestoneDate);
                date = targetDate.toLocaleDateString();
                dateClass = 'in-time';
            }
            if(item.hasOwnProperty('milestoneStatus')) {
                if(item.milestoneStatus === 'CRITICAL') dateClass = 'late';
            }

            let elemItem = $('<div></div>');
                
                elemItem.attr('data-link', item.item.link);

            let elemItemTitle = $('<div></div>');
                elemItemTitle.addClass('link');
                elemItemTitle.addClass('nowrap');
                elemItemTitle.appendTo(elemItem);

            let elemItemWorkspace = $('<div></div>');
                elemItemWorkspace.addClass('item-workspace');
                elemItemWorkspace.addClass('nowrap');
                elemItemWorkspace.appendTo(elemItem);

            let elemItemDate = $('<div></div>');
                elemItemDate.addClass('mow-date');
                elemItemDate.addClass(dateClass);
                elemItemDate.appendTo(elemItem);

                elemItemTitle.html(item.item.title);;
                elemItemWorkspace.html(item.workspace.title);
                elemItemDate.html(date);

                elemItem.appendTo(elemList);

                elemItem.click(function() { openItem($(this).attr('data-link')); });

        }

        $('#mow-counter').html(data.count);

        if(data.count === 0) $('#mow-counter').hide(); else $('#mow-counter').show();

    });

}

// Set recent items list
function setRecents() {

    let elemList = $('#recents-list');
        elemList.html('');

    $('#recents-processing').show();

    $.get( '/plm/recent', {}, function(response) {

        $('#recents-processing').hide();

        for(item of response.data.recentlyViewedItems) {

            let elemItem = $('<div></div>');
                elemItem.attr('data-link', item.item.link);

            let elemItemTitle = $('<div></div>');
                elemItemTitle.addClass('link');
                elemItemTitle.addClass('nowrap');
                elemItemTitle.appendTo(elemItem);

            let elemItemWorkspace = $('<div></div>');
                elemItemWorkspace.addClass('item-workspace');
                elemItemWorkspace.addClass('nowrap');
                elemItemWorkspace.appendTo(elemItem);

                elemItemTitle.html(item.item.title);;
                elemItemWorkspace.html(item.workspace.title);

                elemItem.appendTo(elemList);

                elemItem.click(function() { openItem($(this).attr('data-link')); });

        }

    });

}


// Set bookmarks list
function setBookmarks() {

    let elemList = $('#bookmarks-list');
        elemList.html('');

    $('#bookmarks-processing').show();

    $.get( '/plm/bookmarks', {}, function(response) {

        $('#bookmarks-processing').hide();

        for(item of response.data.bookmarks) {

            let elemItem = $('<div></div>');
                elemItem.attr('data-link', item.item.link);

            let elemItemTitle = $('<div></div>');
                elemItemTitle.addClass('link');
                elemItemTitle.addClass('nowrap');
                elemItemTitle.appendTo(elemItem);

            let elemItemWorkspace = $('<div></div>');
                elemItemWorkspace.addClass('item-workspace');
                elemItemWorkspace.addClass('nowrap');
                elemItemWorkspace.appendTo(elemItem);

                elemItemTitle.html(item.item.title);;
                elemItemWorkspace.html(item.workspace.title);

                elemItem.appendTo(elemList);

                elemItem.click(function() { openItem($(this).attr('data-link')); });

        }

    });

}


// Open workspace view of selected workspace
function openWorkspaceView(wsId) {

    ws = getWorkspaceDefinition(wsId);

    let elemSelectView = $('#workspace-views');
        elemSelectView.hide();
        elemSelectView.html('');

    $('#workspace-title').html(ws.title);
    $('#workspace-filter').val('');
    $('#workspace-list').html('');
    $('#workspaces-list').css('overflow-y', 'hidden');
    $('#workspaces').animate({ left : '-100%', right : '100%'});
    $('#workspace').animate({ left : '0px', right : '0px'});

    if(ws.tableaus.length === 0) {
        $.get('/plm/tableaus', { 'wsId' : wsId }, function(response) {
            if(response.status === 204) {
                $.get('/plm/tableau-init', { 'wsId' : wsId }, function(response) {
                    openWorkspaceView(wsId);
                });
            } else {
                ws.tableaus = response.data;
                openWorkspaceView(wsId);
            }
        });
    } else {

        $('#workspace-process').show();

        for(tableau of ws.tableaus) {

            let elemOption = $('<option></option>');
                elemOption.attr('value', tableau.link);
                elemOption.html(tableau.title);
                elemOption.appendTo(elemSelectView);

            if(tableau.hasOwnProperty('type')) {
                if(tableau.type === 'DEFAULT') {
                    elemOption.attr('selected', 'selected');
                }
            }

        }

        if(ws.tableaus.length > 1) elemSelectView.show();

        if(isPhone) getWorkspaceViewData([]);
        else getWorkspaceViewColumnms();

    }

}
function getWorkspaceViewColumnms() {

    $('#workspace-process').show();

    let count    = 3;
    let link     = $('#workspace-views').val();
    let elemList = $('#workspace-list');
        elemList.html('');

    $.get('/plm/tableau-columns', { 'link' : link }, function(response) {

        getWorkspaceViewData(response.data);

        // for(record of response.data) {

        //     console.log(record);

        //     let elemItem = $('<div></div>');
        //         elemItem.attr('data-link', record.item.link);
        //         elemItem.appendTo(elemList);
        //         elemItem.click(function() { openItem($(this).attr('data-link')); });

        //     let limit = (count > record.fields.length) ? record.fields.length : count;

        //     for(let i = 0; i < limit; i++) {

        //         let field = record.fields[i];

        //         let elemField = $('<div></div>');
        //             elemField.html(field.value);
        //             elemField.addClass('field');
        //             elemField.appendTo(elemItem);

        //         if(field.id === 'WF_CURRENT_STATE') elemField.addClass('item-status');
        //         if(field.value.indexOf('&lt;') > -1) elemField.html($('<div></div>').html(field.value).text());

        //         if(field.id === 'DESCRIPTOR') elemField.addClass('link');

        //     }

        // }

        // $('#workspace-process').hide();

    });

}
function getWorkspaceViewData(columns) {

    $('#workspace-list').hide();
    $('#workspace-processing').show();

    let count    = 3;
    let link     = $('#workspace-views').val();
    let elemList = $('#workspace-list');
        elemList.html('');

    if(columns.length > 0) {

        let elemHeaderRow = $('<div></div>').appendTo(elemList);

        for(let column of columns) {

            $('<div></div>').appendTo(elemHeaderRow)
                .addClass('table-header-cell')
                .html(column.field.title);

        }

    }

    $.get('/plm/tableau-data', { 'link' : link }, function(response) {

        for(let record of response.data.items) {

            let elemItem = $('<div></div>').appendTo(elemList)
                .attr('data-link', record.item.link)
                .click(function() { openItem($(this).attr('data-link')); });

            let limit = (count > record.fields.length) ? record.fields.length : count;

            for(let i = 0; i < limit; i++) {

                let field = record.fields[i];

                let elemField = $('<div></div>').appendTo(elemItem)
                    .html(field.value)
                    .addClass('field');

                     if(field.id === 'WF_CURRENT_STATE') elemField.addClass('item-status');
                else if(field.id === 'DESCRIPTOR'      ) elemField.addClass('link');
                if(field.value.indexOf('&lt;') > -1) elemField.html($('<div></div>').html(field.value).text());

            }

        }

        $('#workspace-list').show();
        $('#workspace-processing').hide();

    });

}
function getWorkspaceDefinition(wsId) {

    for(let workspace of workspaces) {
        if(wsId === workspace.id) {
            return workspace;
        }
    }

}
function filterList(id, value) {

    value = value.toLowerCase();

    let elemList = $('#' + id);

    elemList.children().each(function() {

        let name = $(this).html().toLowerCase();

        if(name.indexOf(value) > -1) $(this).show();
        else $(this).hide();
    });

}


// Search 
function performSearch() {

    let elemList = $('#search-list').html('');

    $('#search-processing').show();
    $('#search-no-results').hide();

    $.get('/plm/search-descriptor', { 'query' : $('#search-input').val(), 'limit' : 50, 'bulk' : 'false' }, function(response) {

        if(!isBlank(response.data.items)) {

            for(let record of response.data.items) {

                let elemItem = $('<div></div>').appendTo(elemList)
                    .attr('data-link', record.__self__)
                    .click(function() { openItem($(this).attr('data-link')); });

                $('<div></div>').appendTo(elemItem)
                    .html(record.descriptor)
                    .addClass('link')
                    .addClass('nowrap');

                $('<div></div>').appendTo(elemItem)
                    .addClass('item-workspace')
                    .html(record.workspaceLongName);

            }

        } else  $('#search-no-results').show();

        $('#search-processing').hide();

    });

}


// Open item defined by wsid and dmsid parameters
function gotoItem() {

    // http://localhost:8080/client?wsId=79&dmsId=11143

    if(!isBlank(wsId)) {
        if(!isBlank(dmsId)) {
            openItem('/api/v3/workspaces/' + wsId + '/items/' + dmsId, 'item-button-details');
        }
    }

}


// Show item 
function openItem(link, buttonView) {

    let dmsId = link.split('/')[6];
    let wsId  = link.split('/')[4];

    if($('#item').attr('data-link') !== '') {
        if($('#item').attr('data-link') !== link) {
            let view = $('#item-toolbar').children('.selected').attr('id');
            $('#back').attr('data-link', $('#item').attr('data-link')).attr('data-view', view).show();
        }
    }

    $('body').addClass('no-viewer');

    $('#new').hide();

    $('#item').show().attr('data-link', link).attr('data-wsId', wsId).attr('data-dmsId', dmsId);
    $('#item').find('.processing').show();
    $('#item').removeClass('archived').removeClass('locked');

    $('#item-header-descriptor').html('');
    $('#item-header-workspace').html('');
    $('#item-header-subtitle').children().hide();
    
    $('.item-content').hide();
    $('#item-header').removeClass('show-info');
    $('#item-menu').hide();
    $('#item-action-edit').hide();
    $('#item-action-upload').hide();
    $('#item-action-archive').hide();
    $('#item-action-unarchive').hide();
    $('#item-workflow-actions').hide();
    $('#item-initiate-process').hide();
    $('#item-edit-toolbar').hide();

    $('#files-counter').hide();
    $('#item-button-details').siblings().hide();


    ws = getWorkspaceDefinition(wsId);

    if(ws.permissions.length === 0) {

        let promises = [
            $.get( '/plm/permissions'           , { wsId : wsId, useCache : true }),
            $.get( '/plm/fields'                , { wsId : wsId, useCache : true }),
            $.get( '/plm/bom-views-and-fields'  , { wsId : wsId, useCache : true }),
            $.get( '/plm/linked-workspaces'     , { wsId : wsId, useCache : true }),
            $.get( '/plm/sections'              , { wsId : wsId, useCache : true })
        ]

        Promise.all(promises).then(function(responses) {

            ws.permissions  = responses[0].data;
            ws.fields       = responses[1].data;
            ws.bomViewDefs  = responses[2].data;
            ws.processes    = responses[3].data;

            if(responses.length > 4) ws.sections = responses[4].data;

            showItem(ws, link);

        });

    } else { showItem(ws, link, buttonView); }

}
function showItem(ws, link, buttonView) {

    setItemDetails(ws, link);

    $('#item-details').html('');

    if(hasPermission(ws.permissions, 'view_attachments')) {
        setItemAttachments(link);
        insertViewer(link);
    }
    if(hasPermission(ws.permissions, 'view_bom')                ) setItemBOM(ws, link);
    if(hasPermission(ws.permissions, 'view_associated_workflow')) setProcesses(link);
    if(hasPermission(ws.permissions, 'view_workflow_items')     ) setManagedItems(link);
    if(hasPermission(ws.permissions, 'view_relationships')      ) setRelationships(link);
    if(hasPermission(ws.permissions, 'view_change_log')         ) getChangeLog(link);

    setItemCreateList(ws, link);

    if(typeof buttonView !== 'undefined') {
        $('#' + buttonView).click();
    } else if($('#item-toolbar').children('.selected:visible').length === 0) {
        $('#item-button-details').click();
    } else {
        $('#item-toolbar').children('.selected:visible').click();
    }

}
function insertViewerDone() {
    
    $('#item-viewer').show();
    $('#item-button-view').show().click();
    
}


// Render Item Details Page
function setItemDetails(ws, link) {

    // $('#item-details-processing').show();

    let elemParent  = $('#item-sections');
        elemParent.html('');

    let promises = [ $.get( '/plm/details', { 'link' : link }) ]

    if(hasPermission(ws.permissions, 'view_workflow')) promises.push($.get('/plm/transitions', { 'link' : link }));

    Promise.all(promises).then(function(responses) {       

        let item = responses[0].data;
        let transitions = (responses.length > 1) ? responses[1].data : [];
            
        setWorkflowActions(transitions);

        item.editable = isEditable(item, transitions);

        if(item.deleted) $('#item').addClass('archived');

        if(!item.itemLocked) {
            if(hasEditableSection(item)) {
                // if(ws.update) {
                    // if(hasPermission(ws.permissions, 'edit_items')) {
                    //     $('#item-action-edit').show();
                    // }
                // }
            }
            if(item.editable) {
                if(hasPermission(ws.permissions, 'add_attachments')) {
                    $('#item-action-upload').show();
                }
                if(ws.delete) {
                    if(item.deleted)  {
                        $('#item-action-unarchive').show();
                    } else {
                        $('#item-action-archive').show();              
                    }
                }
            }
        } else $('#item').addClass('locked');

        if(item.hasOwnProperty('currentState')) {
            $('#item-header-status').html(item.currentState.title).show();
        }

        $('#item-header-descriptor').html(item.title);
        $('#item-header-workspace').html(item.workspace.title).show();
        // $('#item-details-processing').hide();

        let url = document.location.href.split('/client')[0];
            url += '/client?wsId=' + ws.id + '%26dmsId=' + link.split('/')[6];

        $('#item-action-share').attr('href', 'mailto:?body=' + url + '&subject=' + item.title);

        insertDetails(link, {
            hideHeaderLabel : true,
            id              : 'item-details',
            collapsed       : true,
            editable        : true,
            reload          : true,
            singleToolbar   : 'controls',
            toggles         : true
        })

        $('.linking').click(function() {
            openItem($(this).attr('data-item-link'));
        });

    });

}
function isEditable(item, transitions) {

    if(item.workspace.type === "/api/v3/workspace-types/2") {   
        
        // Worklfow Driven
        if(transitions.length > 0) { return true; }
        if(hasPermission(ws.permissions, 'admin_override_workflow_locks')) { return true; }

    } else if(item.workspace.type === "/api/v3/workspace-types/6") { 

        // Rev Controlled
        if(item.workingVersion) { return true; }
        if(hasPermission(ws.permissions, 'override_revision_control_locks')) { return true; }

    }

    return false;

}
function hasEditableSection(item) {

    for(section of item.sections) {

        if(section.sectionLocked === false) {
            return true;
        }

    }

    return false;

}


// Display item attachments
function setItemAttachments(link) {
    
    $('#item-button-files').show();
    $('#files-counter').hide();

    insertAttachments(link, { 
        hideHeaderLabel : true,
        editable        : true,
        id              : 'item-attachments',
        layout          : 'list',
        reload          : true,
        singleToolbar   : 'controls',
        size            : 'xl',
        onLoadComplete  : function(id) { setItemAttachmentsCounter(id); }
    });

}
function setItemAttachmentsCounter (id) {

    let count = $('#item-attachments-content').children('.content-item').length;

    if(count > 0) {
        $('#files-counter').html(count).show();
    }

}



// Get Flat BOM
function setItemBOM(ws, link) {

    let elemParent  = $('#item-bom-list');
        elemParent.html('');

    $('#item-button-bom').show();
    $('#item-bom-process').show();        

    let params = { 
        'wsId' : ws.id,
        'dmsId' : link.split('/')[6],
        'revisionBias' : 'release',
        'viewId' : ws.bomViewDefs[0].id
    };

    $.get( '/plm/bom-flat', params, function(response) {

        for(record of response.data) {

            let elemItem = $('<div></div>');
                elemItem.attr('data-link', record.item.link);
                elemItem.addClass('bom-item');
                elemItem.appendTo(elemParent);
                elemItem.click(function() { openItem($(this).attr('data-link')); });

            let elemItemDetails = $('<div></div>');
                elemItemDetails.addClass('bom-item-details');
                elemItemDetails.appendTo(elemItem);

            let elemItemTitle = $('<div></div>');
                elemItemTitle.addClass('link');
                elemItemTitle.addClass('nowrap');
                elemItemTitle.html(record.item.title);
                elemItemTitle.appendTo(elemItemDetails);

            let elemItemStatus = $('<div></div>');
                elemItemStatus.addClass('bom-item-status');
                elemItemStatus.html(record.item.version);
                elemItemStatus.appendTo(elemItemDetails);

            let elemItemQuantity = $('<div></div>');
                elemItemQuantity.addClass('bom-item-quantity');
                elemItemQuantity.html(record.totalQuantity);
                elemItemQuantity.appendTo(elemItem);  

        }

        $('#item-bom-process').hide();

    });

}


// Get related processes
function setProcesses(link) {

    let elemParent = $('#item-processes-list').html('');

    $('#item-button-processes').show();
    $('#item-processes-process').show();

    $.getJSON('/plm/changes', { 'link' : link }, function(response) {
        
        for(let process of response.data) {

            //let timeStamp       = new Date(process['last-workflow-history'].created.timeStamp);
            let timeStamp       = new Date(process['last-workflow-history'].created);
            let workspaceName   = '';
            let status          = '';
            let wsId            = process.item.link.split('/')[4];

            for(let workspace of workspaces) {
                if(workspace.id === wsId) {
                    workspaceName = workspace.title;
                }
            }

            switch(process['workflow-state'].title) {

                case 'Closed':
                case 'Complete':
                case 'Completed':
                    status = 'completed';
                    break

                default:
                    status = 'in-work';
                    break;

            }

            let elemChange = $('<div></div>');
                elemChange.attr('data-link', process.item.link);
                elemChange.addClass('process');
                elemChange.addClass(status);
                elemChange.appendTo(elemParent);
                elemChange.click(function() {
                    openItem($(this).attr('data-link'));
                });

            let elemChangeTitle = $('<div></div>');
                elemChangeTitle.addClass('process-title');
                elemChangeTitle.addClass('link');
                elemChangeTitle.addClass('nowrap');
                elemChangeTitle.html(process.item.title);
                elemChangeTitle.appendTo(elemChange);

            let elemChangeWorkspace = $('<div></div>');
                elemChangeWorkspace.addClass('process-workspace');
                elemChangeWorkspace.addClass('item-workspace');
                elemChangeWorkspace.addClass('nowrap');
                elemChangeWorkspace.html(workspaceName);
                elemChangeWorkspace.appendTo(elemChange);

            let elemChangeStatus = $('<div></div>');
                elemChangeStatus.addClass('process-status');
                elemChangeStatus.addClass('nowrap');
                elemChangeStatus.html(process['workflow-state'].title);
                elemChangeStatus.appendTo(elemChange);

            let elemChangeDetail = $('<div></div>');
                elemChangeDetail.addClass('process-detail');
                // elemChangeDetail.addClass('nowrap');
                elemChangeDetail.html(process['last-workflow-history'].user.title + ' performed action "' + process['last-workflow-history'].workflowTransition.title + '" on ' + timeStamp.toDateString());
                elemChangeDetail.appendTo(elemChange);

            // let elemChevron = $('<div></div>');
            //     elemChevron.addClass('chevron');
            //     elemChevron.addClass('zmdi');
            //     elemChevron.addClass('zmdi-chevron-right');
            //     elemChevron.appendTo(elemChange);

        }

        $('#item-processes-process').hide();
        
    });

}


// Get managed items
function setManagedItems(link) {

    let elemParent = $('#item-manages-list');
        elemParent.html('');

    $('#item-button-manages').show();
    $('#item-manages-processing').show();

    $.getJSON('/plm/manages', { 'link' : link }, function(response) {
        
        $('#item-manages-processing').hide();

        for(affectedItem of response.data) {

            let workspaceName   = '';
            let wsId            = affectedItem.item.link.split('/')[4];

            for(workspace of workspaces) {
                if(workspace.id === wsId) {
                    workspaceName = workspace.title;
                }
            }

            let elemItem = $('<div></div>');
                elemItem.attr('data-link', affectedItem.item.link);
                elemItem.appendTo(elemParent);
                elemItem.click(function() {
                    openItem($(this).attr('data-link'));
                });

            let elemItemTitle = $('<div></div>');
                elemItemTitle.addClass('link');
                elemItemTitle.addClass('nowrap');
                elemItemTitle.html(affectedItem.item.title);
                elemItemTitle.appendTo(elemItem);

            let elemItemWorkspace = $('<div></div>');
                elemItemWorkspace.addClass('item-workspace');
                elemItemWorkspace.addClass('nowrap');
                elemItemWorkspace.html(workspaceName);
                elemItemWorkspace.appendTo(elemItem);

        }
        
    });

}


// Get Relationships
function setRelationships(link) {

    let elemParent = $('#item-related-list');
        elemParent.html('');

    $('#item-button-related').show();
    $('#item-related-processing').show();

    $.getJSON('/plm/relationships', { 'link' : link }, function(response) {
        
        $('#item-related-processing').hide();

        for(related of response.data) {

            //let timeStamp       = new Date(process['last-workflow-history'].created.timeStamp);
            // let timeStamp       = new Date(process['last-workflow-history'].created);
            // let workspaceName   = '';
            let status          = '';
            // let wsId            = process.item.link.split('/')[4];

            // for(workspace of workspaces) {
            //     if(workspace.id === wsId) {
            //         workspaceName = workspace.title;
            //     }
            // }

            if(typeof related.state !== 'undefined') {
                switch(related.state.title) {

                    case 'Closed':
                    case 'Complete':
                    case 'Completed':
                        status = 'completed';
                        break

                    default:
                        status = 'in-work';
                        break;

                }
            }

            let elemRelated = $('<div></div>');
                elemRelated.attr('data-link', related.item.link);
                elemRelated.addClass('process');
                elemRelated.addClass(status);
                elemRelated.appendTo(elemParent);
                elemRelated.click(function() {
                    openItem($(this).attr('data-link'));
                });

            let elemRelatedTitle = $('<div></div>');
                elemRelatedTitle.addClass('process-title');
                elemRelatedTitle.addClass('link');
                elemRelatedTitle.addClass('nowrap');
                elemRelatedTitle.html(related.item.title);
                elemRelatedTitle.appendTo(elemRelated);

            let elemRelatedWorkspace = $('<div></div>');
                elemRelatedWorkspace.addClass('process-workspace');
                elemRelatedWorkspace.addClass('item-workspace');
                elemRelatedWorkspace.addClass('nowrap');
                elemRelatedWorkspace.html(related.workspace.title);
                elemRelatedWorkspace.appendTo(elemRelated);

            if(typeof related.state !== 'undefined') {
                let elemRelatedStatus = $('<div></div>');
                    elemRelatedStatus.addClass('process-status');
                    elemRelatedStatus.addClass('nowrap');
                    elemRelatedStatus.html(related.state.title);
                    elemRelatedStatus.appendTo(elemRelated);
            }

            let elemRelatedDetail = $('<div></div>');
                elemRelatedDetail.addClass('process-detail');
                elemRelatedDetail.html(related.description);
                elemRelatedDetail.appendTo(elemRelated);

        }

        $('#item-related-process').hide();
        
    });

}


// Get Item Chagne Log
function getChangeLog(link) {

    let elemParent = $('#item-change-log-list');
        elemParent.html('');

    $('#item-button-change-log').show();
    $('#item-change-log-processing').show();

    $.getJSON('/plm/logs', { 'link' : link }, function(response) {
        
        $('#item-change-log-processing').hide();

        for(log of response.data) {

            let timeStamp = new Date(log.timeStamp);
            let description = log.description;

            if(description === null) {
                description  = log.details[0].fieldName + ' changed from<br/>';
                description += log.details[0].oldValue + '<br/>';
                description += 'to<br/>';
                description += log.details[0].newValue + '<br/>';
            }

            let elemChange = $('<div></div>');
                elemChange.appendTo(elemParent);

            let elemChangeDetails = $('<div></div>');
                elemChangeDetails.addClass('change-log-details');
                elemChangeDetails.appendTo(elemChange);

            let elemChangeDate = $('<div></div>');
                elemChangeDate.addClass('change-log-date');
                elemChangeDate.html(timeStamp.toDateString());
                elemChangeDate.appendTo(elemChangeDetails);

            let elemChangeUser = $('<div></div>');
                elemChangeUser.addClass('change-log-user');
                elemChangeUser.html(log.user.title);
                elemChangeUser.appendTo(elemChangeDetails);

            let elemChangeAction = $('<div></div>');
                elemChangeAction.addClass('change-log-action');
                elemChangeAction.html(log.action.shortName);
                elemChangeAction.appendTo(elemChange);

            let elemChangeDescription = $('<div></div>');
                elemChangeDescription.addClass('change-log-description');
                elemChangeDescription.html(description);
                elemChangeDescription.appendTo(elemChange);
                
        }

    });

}


// Add workflow actions available to item menu
function setWorkflowActions(transitions) {

    let elemParent = $('#item-workflow-actions-list');
        elemParent.html('');

    for(transition of transitions) {

        let elemWorkflowAction = $('<div></div>');
            elemWorkflowAction.addClass('item-action');
            elemWorkflowAction.addClass('nowrap');
            elemWorkflowAction.attr('data-link', transition.__self__);
            elemWorkflowAction.appendTo(elemParent);
            elemWorkflowAction.click(function() {
                performTransition($('#item').attr('data-link'), $(this).attr('data-link'));
            });

        let elemWorkflowActionIcon = $('<i class="icon">keyboard_tab</i>');
            elemWorkflowActionIcon.appendTo(elemWorkflowAction);
            
        let elemWorkflowActionTitle = $('<span></span>');
            elemWorkflowActionTitle.html(transition.name);
            elemWorkflowActionTitle.appendTo(elemWorkflowAction);

    }

    if(transitions.length > 0 ) {
        $('#item-header').addClass('show-info');
        $('#item-workflow-actions').show();
    }

}
function performTransition(link, transition) {

    $('#overlay').show();

    $.get('/plm/transition', { 'link' : link, 'transition' : transition, 'comment' : 'Performed on mobile client' }, function(response) {
        console.log(response);
        $('#overlay').hide();
        openItem(link);
        if(response.error) {
            let message = response.data.message.split('Message: ')[1];
                message = message.split(', \t details:')[0];
            showErrorMessage(message);
        }
    });

}


// Set list of related processes to add
function setItemCreateList(ws, link) {

    let id = link.split('/')[4];
    let list = [];
    let linkedProcesses = [];

    let elemParent = $('#item-initiate-processes-list');
        elemParent.html('');

    for(workspace of workspaces) {
        if(workspace.create) {
            if(workspace.picklists.indexOf(id) > -1) {

                list.push({
                    'id' : workspace.id,
                    'title' : workspace.title
                });
            }
        }
    }

    for(process of ws.processes) {
        let add = true;
        let wsId = process.link.split('/')[4];
        for(entry of list) {
            
            if(entry.id === wsId) {
                add = false;
            }
        }
        if(add) {
            list.push({
                'id' : wsId,
                'title' : process.title
            });
        }
        linkedProcesses.push(wsId);
    }
    
    $('#item').attr('data-linked-workspaces', linkedProcesses);

    for(let entry of list) {

        let elemProcess = $('<div></div>');
            elemProcess.addClass('item-action');
            elemProcess.addClass('nowrap');
            elemProcess.attr('data-id', entry.id);
            elemProcess.appendTo(elemParent);
            elemProcess.click(function() {
                showCreateDialog($(this).attr('data-id'), $('#item').attr('data-link'));
            });

    let elemProcessIcon = $('<i class="icon">add_circle</i>');
        elemProcessIcon.appendTo(elemProcess);
        
    let elemProcessTitle = $('<span></span>');
        elemProcessTitle.html(entry.title);
        elemProcessTitle.appendTo(elemProcess);

    $('#item-initiate-process').show();


    }

}


// Open edit mode of current item and save changes
// function openItemEditor() {

//     $('#item-edit-processing').show();
//     $('#item-edit').show();
//     $('#item-edit-sections').html('');
//     $('#item-edit-toolbar').css('display', 'flex');

//     insertItemDetailsFields($('#item').attr('data-link'), 'item-edit', null, null, null, true, false, false);

// }
// function saveChanges() {

//     $('#overlay').show();
//     submitEdit($('#item').attr('data-link'), $('#item-edit-sections'), function(response) {
//         $('#overlay').hide();
//         $('#item-edit').hide();
//         $('#item-viewer').hide();
//         $('#item-details').show();
//         $('#item-edit-toolbar').hide();
//         $('#item-button-details').click();
//         // openItem($('#item').attr('data-link'));
//         insertItemDetailsFields($('#item').attr('data-link'), 'item', null, null, null, false, false, false);
//         if(response.error) {
//             showErrorMessage(response.data.message);
//         }
//     });

// }


// Item create dialog
// function showCreateDialog(id, source) {
function showCreateDialog(wsTitle, wsId, source) {

    // let ws = getWorkspaceDefinition(id);

    // $('#new').attr('data-wsid', id).show();
    $('#new-header-subtitle').html(wsTitle);
    $('#new').show();
    // $('#new-processing').show();

    // insertCreate([workspace.title], [workspace.id], {
    insertCreate([wsTitle], [wsId], {
        id              : 'new-form',
        hideHeader      : true,
        onCancel        : function() {  $('#new').hide(); },
        afterCreation   : function(id, link) { openItem(link); }

    });


    return;

    let elemParent = $('#new-sections');
        elemParent.html('');


    if(ws.sections.length === 0) {

        let requests = [
            $.get( '/plm/sections', { 'wsId' : ws.id }),
            $.get( '/plm/fields', { 'wsId' : ws.id })
        ];

        Promise.all(requests).then(function(responses) {
            ws.sections = responses[0].data;
            ws.fields   = responses[1].data;
            showCreateDialog(id, source);
        });
        
    } else {

        let defaults = null;

        if(source !== null) {   
            defaults = {
                'sections' : [{
                    'fields' : []
                }]
            }

            let sourceId = source.split('/')[4];

            for(let i = 0; i < ws.picklists.length; i++) {

                if(ws.picklists[i] === sourceId) {

                    let fieldName = ws.picklistFields[i];

                    defaults.sections[0].fields.push({
                        'urn' : '.' + fieldName,
                        'value' : {
                            'link' : source,
                            'title' : $('#item-header-descriptor').html()
                        }
                    });

                    // $('#new-sections').find('option').each(function() {
                    //     console.log('option');
                    //     console.log($(this).attr('value'));
                    // });
                    // $('#new-sections').find('.picklist').each(function() {

                        // let elemSelect = $(this);
                        // console.log(elemSelect.val());

                        // console.log($(this).attr('data-id') );

                        // if($(this).attr('data-id') === fieldName) {
                        //     console.log(source);
                        //     console.log($(this).value);
                        //     console.log($(this).val());
                        //     // $(this).val(source).change();

                        //     // $(this).children().each(function() {
                        //     //     console.log($(this).attr('value'));
                        //     //     if($(this).attr('value') === source) {
                        //     //         $(this).attr('selected', 'selected');
                        //     //     }


                        //     // });

                        //     $(this).value = source;

                        //     $(this).val(source);
                        //     //$(this).val() = source;
                        //     console.log('value set');
                        //     console.log($(this).val());
                        // }
                    // })


                }

            }
        }

        $('#new-processing').hide();

        insertItemDetailsFields( '', 'new',ws.sections, ws.fields, defaults, true, true, true);

        // if(source !== null) {

            // $("mySelectList option[id='1']").attr("selected", "selected");

            // console.log(source);
            // console.log($('#new-sections').find('option[id="' + source + '"]').length);

            // let sourceId = source.split('/')[4];

            // for(let i = 0; i < ws.picklists.length; i++) {

            //     console.log(sourceId + ' / ' + ws.picklists[i]);

            //     if(ws.picklists[i] === sourceId) {

            //         let fieldName = ws.picklistFields[i];
            //         console.log(fieldName);

            //         $('#new-sections').find('option').each(function() {
            //             console.log('option');
            //             console.log($(this).attr('value'));
            //         });
            //         $('#new-sections').find('.picklist').each(function() {

            //             // let elemSelect = $(this);
            //             // console.log(elemSelect.val());

            //             // console.log($(this).attr('data-id') );

            //             // if($(this).attr('data-id') === fieldName) {
            //             //     console.log(source);
            //             //     console.log($(this).value);
            //             //     console.log($(this).val());
            //             //     // $(this).val(source).change();

            //             //     // $(this).children().each(function() {
            //             //     //     console.log($(this).attr('value'));
            //             //     //     if($(this).attr('value') === source) {
            //             //     //         $(this).attr('selected', 'selected');
            //             //     //     }


            //             //     // });

            //             //     $(this).value = source;

            //             //     $(this).val(source);
            //             //     //$(this).val() = source;
            //             //     console.log('value set');
            //             //     console.log($(this).val());
            //             // }
            //         })


            //     }

            // }

//            $('#new-sections').find('option[id="' + source + '"]').attr('selected', 'selected');
            // $('#new-sections').find('select.picklist.linking').each(function() {
            //     $(this).children('').each(function() )
            //     console.log($(this).attr('data-id'));
            // });
        // }

    }

}