let workspaces  = [];
let maxRequests = 3;
let isPhone     = (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i));


$(document).ready(function() {

    setWorkspaces(function() {
        gotoItem();
    });
    setProfile();
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
        getWorkspaceViewData();
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

        submitCreateForm(wsIdNew, $('#new-list'), function(response) {
            
            $('#overlay').hide();

            if(response.error) {

                showErrorMessage(response.message);

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
                    console.log('2');
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
        setItemAttachments(ws, $('#item').attr('data-link'));
    });
    $("#item-action-upload").click(function() {
    
        let urlUpload = "/plm/upload/";
            urlUpload += $('#item').attr('data-wsId') + "/";
            urlUpload += $('#item').attr('data-dmsId');
    
        $("#uploadForm").attr("action", urlUpload);    
        $("#select-file").click();
        
    }); 
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
    $('#item-action-edit').click(function() {
        openItemEditor();
    });
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

    $('#workspaces-process').show();
    $('#create-process').show();

    let elemList = $('#workspaces-list');
        elemList.html('');

    let elemListCreate = $('#create-list');
        elemListCreate.html('');

    $.get('/plm/workspaces', {}, function(response) {

        workspaces = [];

        for(workspace of response.data.items) {

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

        workspaces.sort(function(a, b){
            var nameA=a.title.toLowerCase(), nameB=b.title.toLowerCase()
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        });

        for(workspace of workspaces) {

            let elemWorkspace = $('<div></div>');
                elemWorkspace.html(workspace.title);
                elemWorkspace.attr('data-id', workspace.id);
                elemWorkspace.appendTo(elemList);
                elemWorkspace.click(function() {
                    openWorkspaceView($(this).attr('data-id'));
                });

            if(workspace.create) {
                workspace.picklists = [];
                $('#button-create').show();
                let elemCreate = $('<div></div>');
                    elemCreate.attr('data-id', workspace.id);
                    elemCreate.html(workspace.title);
                    elemCreate.appendTo(elemListCreate);
                    elemCreate.click(function() {
                        showCreateDialog($(this).attr('data-id'), null);
                    });

                // let elemChevronCreate = $('<div></div>');
                //     elemChevronCreate.addClass('chevron');
                //     elemChevronCreate.addClass('zmdi');
                //     elemChevronCreate.addClass('zmdi-chevron-right');
                //     elemChevronCreate.appendTo(elemCreate);
            }
        }

        $('#workspaces-process').hide();
        $('#create-process').hide();

        callback();
        getWorkspacesPicklists();

    });

}
function getWorkspacesPicklists() {

    let promises = [];
    let pending  = 0;

    for(workspace of workspaces) {
        if(workspace.create) {
            if(workspace.picklists.length === 0) {
                if(workspace.fields.length === 0) {
                    pending++;
                    if(promises.length <= maxRequests) {
                        promises.push($.get( '/plm/fields', { 'wsId' : workspace.id }));
                    }
                }
            }
        }
    }

    if(pending === 0) {
        $('#init-progress').hide();
    } else {
        let progress = (workspaces.length - pending) * 100 / workspaces.length;
        $('#init-progress').css('width', progress + '%').show();
    }
    

    if(promises.length > 0) {
        Promise.all(promises).then(function(results) {
            for(result of results) {
                let id = result.params.wsId;
                for(workspace of workspaces) {

                    if(workspace.id === id) {
                        let picklists = [];
                        let picklistFields = [];
                        workspace.fields = result.data;

                        for(field of result.data) {
                            if(field.editability !== 'NEVER') {
                                if(field.hasOwnProperty('picklistFieldDefinition')) {
                                    if(field.picklistFieldDefinition !== null) {
                                        let picklistId = field.picklistFieldDefinition.split('/')[4];
                                        picklists.push(picklistId);
                                        picklistFields.push(field.__self__.split('/')[8]);
                                    }
                                }
                            }
                        }
                        
                        if(picklists.length === 0) picklists.push(-1);
                        workspace.picklists = picklists;
                        workspace.picklistFields = picklistFields;
                    }

                }
            }
            getWorkspacesPicklists();
        });
    }

}


// Set user profile picture
function setProfile() {

    $.get( '/plm/me', {}, function(response) {

        let elemProfile = $('#account');
            elemProfile.html('');
            elemProfile.css('background', 'url(' + response.data.image.medium + ')');
            elemProfile.css('background-position', 'center');
            elemProfile.css('background-size', '40px');

    });

}


// Set mow counter
function setMOW() {

    let elemList = $('#mow-list');
        elemList.html('');

    $('#mow-process').show();

    $.get( '/plm/mow', {}, function(response) {

        let data = response.data;

        $('#mow-process').hide();

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

        $('.counter').html(data.count);

        if(data.count === 0) $('.counter').hide(); else $('.counter').show();

    });

}

// Set recent items list
function setRecents() {

    let elemList = $('#recents-list');
        elemList.html('');

    $('#recents-process').show();

    $.get( '/plm/recent', {}, function(response) {

        $('#recents-process').hide();

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

    $('#bookmarks-process').show();

    $.get( '/plm/bookmarks', {}, function(response) {

        $('#bookmarks-process').hide();

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
    $('#workspace-list').html('');
    $('#workspaces-list').css('overflow-y', 'hidden');
    $('#workspaces').animate({ left : '-100%', right : '100%'});
    $('#workspace').animate({ left : '0px', right : '0px'});

    if(ws.tableaus.length === 0) {
        $.get('/plm/tableaus', { 'wsId' : wsId }, function(response) {
            if(response.status === 204) {
                $.get('/plm/init-tableaus', { 'wsId' : wsId }, function(response) {
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

            console.log(tableau);

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

        console.log(response);

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

    $('#workspace-process').show();

    let count    = 3;
    let link     = $('#workspace-views').val();
    let elemList = $('#workspace-list');
        elemList.html('');


    if(columns.length > 0) {

        let elemHeaderRow = $('<div></div>');
            elemHeaderRow.appendTo(elemList);

        for(column of columns) {

            let elemHeaderCell = $('<div></div>');
                elemHeaderCell.addClass('table-header-cell');
                elemHeaderCell.html(column.field.title);
                elemHeaderCell.appendTo(elemHeaderRow);

        }

    }

    $.get('/plm/tableau-data', { 'link' : link }, function(response) {

        for(record of response.data) {

            console.log(record);

            let elemItem = $('<div></div>');
                elemItem.attr('data-link', record.item.link);
                elemItem.appendTo(elemList);
                elemItem.click(function() { openItem($(this).attr('data-link')); });

            let limit = (count > record.fields.length) ? record.fields.length : count;

            for(let i = 0; i < limit; i++) {

                let field = record.fields[i];

                let elemField = $('<div></div>');
                    elemField.html(field.value);
                    elemField.addClass('field');
                    elemField.appendTo(elemItem);

                if(field.id === 'WF_CURRENT_STATE') elemField.addClass('item-status');
                if(field.value.indexOf('&lt;') > -1) elemField.html($('<div></div>').html(field.value).text());

                if(field.id === 'DESCRIPTOR') elemField.addClass('link');

            }

        }

        $('#workspace-process').hide();

    });

}
function getWorkspaceDefinition(wsId) {

    for(workspace of workspaces) {
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

    let elemList = $('#search-list');
        elemList.html('');

    $('#search-process').show();
    $('#search-no-results').hide();

    $.get('/plm/search-bulk', { 'query' : $('#search-input').val() }, function(response) {

        if(typeof response.data.items !== 'undefined') {

            for(record of response.data.items) {

                let elemItem = $('<div></div>');
                    elemItem.attr('data-link', record.__self__);
                    elemItem.appendTo(elemList);
                    elemItem.click(function() { openItem($(this).attr('data-link')); });

                let elemItemDescriptor = $('<div></div>');
                    elemItemDescriptor.html(record.title);
                    elemItemDescriptor.addClass('link');
                    elemItemDescriptor.addClass('nowrap');
                    elemItemDescriptor.appendTo(elemItem);

                let elemItemWorkspace = $('<div></div>');
                    elemItemWorkspace.addClass('item-workspace');
                    elemItemWorkspace.html(record.workspace.title);
                    elemItemWorkspace.appendTo(elemItem);

            }

        } else {

            $('#search-no-results').show();

        }

        $('#search-process').hide();
    });

}


// Open item defined by wsid and dmsid parameters
function gotoItem() {

    if(urlWSID !== '') {
        if(urlDMSID !== '') {
            let link = '/api/v3/workspaces/' + urlWSID + '/items/' + urlDMSID;
            openItem(link, 'item-button-details');
        }
    }

}


// Show item 
function openItem(link, buttonView) {

    let dmsId = link.split('/')[6];
    let wsId = link.split('/')[4];

    if($('#item').attr('data-link') !== '') {
        if($('#item').attr('data-link') !== link) {
            let view = $('#item-toolbar').children('.selected').attr('id');
            $('#back').attr('data-link', $('#item').attr('data-link')).attr('data-view', view).show();
        }
    }

    $('#item').show().attr('data-link', link).attr('data-wsId', wsId).attr('data-dmsId', dmsId);
    $('#item').find('.process').show();
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
            $.get( '/plm/permissions', { 'wsId' : wsId }),
            $.get( '/plm/fields', { 'wsId' : wsId }),
            $.get( '/plm/bom-views-and-fields', { 'wsId' : wsId }),
            $.get( '/plm/linked-workspaces', { 'wsId' : wsId })
        ]

        if(ws.sections.length === 0) {

            promises.push($.get( '/plm/sections', { 'wsId' : wsId }));

        }

        Promise.all(promises).then(function(responses) {

            ws.permissions  = responses[0].data;
            ws.fields       = responses[1].data;
            ws.bomViewDefs  = responses[2].data;
            ws.processes    = responses[3].data;

            if(responses.length > 4) ws.sections = responses[4].data;

            showItem(ws, link);

        });

    } else {  showItem(ws, link, buttonView); }

}
function showItem(ws, link, buttonView) {

    setItemDetails(ws, link);

    if(hasPermission(ws, 'view_attachments')) {
        setItemAttachments(ws, link);
        getViewables(link);
    }
    if(hasPermission(ws, 'view_bom')) setItemBOM(ws, link);
    if(hasPermission(ws, 'view_associated_workflow')) setProcesses(link);
    if(hasPermission(ws, 'view_workflow_items')) setManagedItems(link);
    if(hasPermission(ws, 'view_relationships')) setRelationships(link);
    if(hasPermission(ws, 'view_change_log')) getChangeLog(link);

    setItemCreateList(ws, link);

    if(typeof buttonView !== 'undefined') {
        $('#' + buttonView).click();
    } else if($('#item-toolbar').children('.selected:visible').length === 0) {
        $('#item-button-details').click();
    } else {
        $('#item-toolbar').children('.selected:visible').click();
    }

}
function hasPermission(ws, name) {

    for(permission of ws.permissions) {
        if(permission.name === 'permission.shortname.' + name) return true;
    }

    return false;
}


// Render Item Details Page
function setItemDetails(ws, link) {

    $('#item-details-process').show();

    let elemParent  = $('#item-details-fields');
        elemParent.html('');

    let promises = [ $.get( '/plm/details', { 'link' : link }) ]

    if(hasPermission(ws, 'view_workflow')) promises.push($.get('/plm/transitions', { 'link' : link }));

    // console.log(promises);

    Promise.all(promises).then(function(responses) {       

        let item = responses[0].data;
        let transitions = (responses.length > 1) ? responses[1].data : [];
            
        setWorkflowActions(transitions);

        item.editable = isEditable(item, transitions);

        if(item.deleted) $('#item').addClass('archived');

        if(!item.itemLocked) {
            if(hasEditableSection(item)) {
                if(ws.update) {
                    if(hasPermission(ws, 'edit_items')) {
                        $('#item-action-edit').show();
                    }
                }
            }
            if(item.editable) {
                if(hasPermission(ws, 'add_attachments')) {
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
        $('#item-details-process').hide();

        let url = document.location.href.split('/client')[0];
            url += '/client?wsId=' + ws.id + '%26dmsId=' + link.split('/')[6];

        $('#item-action-share').attr('href', 'mailto:?body=' + url + '&subject=' + item.title);

        insertItemDetails(elemParent, ws.sections, ws.fields, item, false, false, false);

        $('.linking').click(function() {
            openItem($(this).attr('data-item-link'));
        });

    });

}
function isEditable(item, transitions) {

    if(item.workspace.type === "/api/v3/workspace-types/2") {   
        
        // Worklfow Driven
        if(transitions.length > 0) { return true; }
        if(hasPermission(ws, 'admin_override_workflow_locks')) { return true; }

    } else if(item.workspace.type === "/api/v3/workspace-types/6") { 

        // Rev Controlled
        if(item.workingVersion) { return true; }
        if(hasPermission(ws, 'override_revision_control_locks')) { return true; }

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
function setItemAttachments(ws, link) {
    
    $('#item-button-files').show();
    $('#item-attachments-process').show();

    let elemParent = $('#item-attachments-list');
        elemParent.html('');

    $.get( '/plm/attachments', { 'link' : link }, function(response) {
        let counter = insertAttachments(elemParent, response.data);
        if(counter > 0) $('#files-counter').show(); else $('#files-counter').hide();
        $('#files-counter').html(counter);
        $('#item-attachments-process').hide();
    });

}


// Get viewables of selected Vault Item to init viewer
function getViewables(link) {

    $('#viewer').html('')

    //$.get( '/plm/get-viewable', { 'link' : link }, function(response) {
    $.get( '/plm/list-viewables', { 'link' : link }, function(response) {

        if(response.params.link !== link) return;

        if(response.data.length > 0) {

            $('#item-button-view').show().click();

            // $('body').removeClass('no-viewer');
            // $('#header-actions').show();

            let viewLink = response.data[0].selfLink;

            $.get( '/plm/get-viewable', { 'link' : viewLink } , function(response) {
                if(response.params.link !== viewLink) return;
                $('#viewer').show();
                initViewer(response.data, 255);
            });

        }

    });

}
function initViewerDone() {
    // alert('10');
    // alert($('#viewer').length);
    // $('#viewer').show();
    // $('#viewer').css('z-index', '10000');
}
function onSelectionChanged(event) {}


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

    let elemParent = $('#item-processes-list');
        elemParent.html('');

    $('#item-button-processes').show();
    $('#item-processes-process').show();

    $.getJSON('/plm/changes', { 'link' : link }, function(response) {
        
        for(process of response.data) {

            //let timeStamp       = new Date(process['last-workflow-history'].created.timeStamp);
            let timeStamp       = new Date(process['last-workflow-history'].created);
            let workspaceName   = '';
            let status          = '';
            let wsId            = process.item.link.split('/')[4];

// console.log(process['last-workflow-history']);
// console.log(process['last-workflow-history'].created);
// console.log(process['last-workflow-history'].created.timeStamp);
// console.log(timeStamp);
// console.log(timeStamp.toDateString());

            for(workspace of workspaces) {
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
    $('#item-manages-process').show();

    $.getJSON('/plm/manages', { 'link' : link }, function(response) {
        
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

        $('#item-manages-process').hide();
        
    });

}


// Get Relationships
function setRelationships(link) {

    let elemParent = $('#item-related-list');
        elemParent.html('');

    $('#item-button-related').show();
    $('#item-related-process').show();

    $.getJSON('/plm/relationships', { 'link' : link }, function(response) {
        
        for(related of response.data) {

            //let timeStamp       = new Date(process['last-workflow-history'].created.timeStamp);
            // let timeStamp       = new Date(process['last-workflow-history'].created);
            // let workspaceName   = '';
            // let status          = '';
            // let wsId            = process.item.link.split('/')[4];

// console.log(process['last-workflow-history']);
// console.log(process['last-workflow-history'].created);
// console.log(process['last-workflow-history'].created.timeStamp);
// console.log(timeStamp);
// console.log(timeStamp.toDateString());

            // for(workspace of workspaces) {
            //     if(workspace.id === wsId) {
            //         workspaceName = workspace.title;
            //     }
            // }

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

            let elemRelatedStatus = $('<div></div>');
                elemRelatedStatus.addClass('process-status');
                elemRelatedStatus.addClass('nowrap');
                elemRelatedStatus.html(related.state.title);
                elemRelatedStatus.appendTo(elemRelated);

            let elemRelatedDetail = $('<div></div>');
                elemRelatedDetail.addClass('process-detail');
                // elemChangeDetail.addClass('nowrap');
                elemRelatedDetail.html(related.description);
                elemRelatedDetail.appendTo(elemRelated);

            // let elemChevron = $('<div></div>');
            //     elemChevron.addClass('chevron');
            //     elemChevron.addClass('zmdi');
            //     elemChevron.addClass('zmdi-chevron-right');
            //     elemChevron.appendTo(elemChange);

        }

        $('#item-related-process').hide();
        
    });

}


// Get Item Chagne Log
function getChangeLog(link) {

    let elemParent = $('#item-change-log-list');
        elemParent.html('');

    $('#item-button-change-log').show();
    $('#item-change-log-process').show();

    $.getJSON('/plm/logs', { 'link' : link }, function(response) {
        
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

        $('#item-change-log-process').hide();
        
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

        let elemWorkflowActionIcon = $('<i class="material-symbols-sharp">keyboard_tab</i>');
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

    for(entry of list) {

        let elemProcess = $('<div></div>');
            elemProcess.addClass('item-action');
            elemProcess.addClass('nowrap');
            elemProcess.attr('data-id', entry.id);
            elemProcess.appendTo(elemParent);
            elemProcess.click(function() {
                showCreateDialog($(this).attr('data-id'), $('#item').attr('data-link'));
            });

    let elemProcessIcon = $('<i class="material-symbols-sharp">add_circle</i>');
        elemProcessIcon.appendTo(elemProcess);
        
    let elemProcessTitle = $('<span></span>');
        elemProcessTitle.html(entry.title);
        elemProcessTitle.appendTo(elemProcess);

    $('#item-initiate-process').show();


    }

}


// Open edit mode of current item and save changes
function openItemEditor() {

    $('#item-edit-progress').show();
    $('#item-edit').show();
    $('#item-edit-toolbar').css('display', 'flex');

    ws = getWorkspaceDefinition($('#item').attr('data-wsid'));

    let elemParent  = $('#item-edit-fields');
        elemParent.html('');

    $.get( '/plm/details', { 'link' : $('#item').attr('data-link') }, function(response) {

        $('#item-edit-process').hide();
        insertItemDetails(elemParent, ws.sections, ws.fields, response.data, true, false, false);

    });

}
function saveChanges() {

    $('#overlay').show();
    submitEdit($('#item').attr('data-link'), $('#item-edit-fields'), function(response) {
        $('#overlay').hide();
        openItem($('#item').attr('data-link'));
        if(response.error) {
            showErrorMessage(response.data.message);
        }
    });

}


// Item create dialog
function showCreateDialog(id, source) {

    let ws = getWorkspaceDefinition(id);

    $('#new').attr('data-wsid', id).show();
    $('#new-header-subtitle').html(ws.title);
    $('#new-process').show();

    let elemParent = $('#new-list');
        elemParent.html('');

    if(ws.sections.length === 0) {
        $.get( '/plm/sections', { 'wsId' : ws.id }, function(response) {
            ws.sections = response.data;
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

                    // $('#new-list').find('option').each(function() {
                    //     console.log('option');
                    //     console.log($(this).attr('value'));
                    // });
                    // $('#new-list').find('.picklist').each(function() {

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

        $('#new-process').hide();

        insertItemDetails(elemParent, ws.sections, ws.fields, defaults, true, true, true);

        // if(source !== null) {

            // $("mySelectList option[id='1']").attr("selected", "selected");

            // console.log(source);
            // console.log($('#new-list').find('option[id="' + source + '"]').length);

            // let sourceId = source.split('/')[4];

            // for(let i = 0; i < ws.picklists.length; i++) {

            //     console.log(sourceId + ' / ' + ws.picklists[i]);

            //     if(ws.picklists[i] === sourceId) {

            //         let fieldName = ws.picklistFields[i];
            //         console.log(fieldName);

            //         $('#new-list').find('option').each(function() {
            //             console.log('option');
            //             console.log($(this).attr('value'));
            //         });
            //         $('#new-list').find('.picklist').each(function() {

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

//            $('#new-list').find('option[id="' + source + '"]').attr('selected', 'selected');
            // $('#new-list').find('select.picklist.linking').each(function() {
            //     $(this).children('').each(function() )
            //     console.log($(this).attr('data-id'));
            // });
        // }

    }

}