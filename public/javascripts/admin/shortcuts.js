$(document).ready(function() {

    setUIEvents();
    insertMenu();
    insertWorkspaces();
    insertScripts();
    insertPicklists();
    insertRoles();

});

function setUIEvents() {

    $('#search').on('keyup', function() { filterItems(); });

    $('#settings').click(function() { openURL('/admin#section=setuphome&tab=general&item=configparams'); });
    $('#wsm'     ).click(function() { openURL('/admin#section=setuphome&tab=workspaces'               ); });
    $('#mmd'     ).click(function() { openURL('/admin#section=setuphome&tab=general&item=categories'  ); });
    $('#lce'     ).click(function() { openURL('/lifecycleEditorView.form'                             ); });

}

function filterItems() {

    let value = $('#search').val().toLowerCase();

    filterList('workspaces-list', value);
    filterList('scripts-list'   , value);
    filterList('picklists-list' , value);
    filterList('roles-list'     , value);

}
function filterList(id, value) {

    let elemList = $('#' + id);

    if(isBlank(value)) {

        elemList.children().removeClass('hidden');

    } else {

        elemList.children().each(function() {

            let isPinned = $(this).find('.icon-bookmark').length > 0;

            if(isPinned) {

                $(this).removeClass('hidden')

            } else {

                let title = $(this).find('.tile-title').html().toLowerCase();
                if(title.indexOf(value) >= 0) $(this).removeClass('hidden'); else $(this).addClass('hidden');

            }

        });

    }

}


function insertWorkspaces() {

    $.get('/plm/workspaces', { limit : 1000 }, function(response) {

        let workspaces = response.data.items;

        sortArray(workspaces, 'title');

        for(let workspace of workspaces) {

            let elemTile = $('<div></div>').appendTo($('#workspaces-list'))
                .attr('data-id', workspace.urn.split('.').pop())
                .addClass('tile');

            $('<div></div>').appendTo(elemTile)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-folder');
            
            $('<div></div>').appendTo(elemTile)
                .addClass('tile-title')
                .addClass('tile-workspace-title')
                .html(workspace.title);

            let elemExtended = $('<div></div>').appendTo(elemTile).addClass('tile-workspace');
            let elemDetails  = $('<div></div>').appendTo(elemExtended).addClass('tile-workspace-details');
            let elemActions  = $('<div></div>').appendTo(elemExtended).addClass('tile-actions');
                
            $('<div></div>').appendTo(elemDetails)
                .addClass('tile-workspace-id')
                .addClass('tile-title')
                .html(workspace.link.split('/').pop());
  
            $('<div></div>').appendTo(elemDetails)
                .addClass('tile-workspace-name')
                .addClass('tile-title')
                .html(workspace.systemName);

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-settings')
                .attr('title', 'Workspace Settings')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=workspaceedit&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });                

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-details')
                .attr('title', 'Item Details Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=itemdetails&params={"metaType":"D","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });                

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-tag')
                .attr('title', 'Workspace Descriptor')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=descriptor&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });          

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-table')
                .attr('title', 'Grid Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=grid&params={"metaType":"G","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });                

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-released')
                .attr('title', 'Managed Items Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=workflowitems&params={"metaType":"L","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });  

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-bom-tree')
                .attr('title', 'Bill of Materials Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=bom&params={"metaType":"B","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });          

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-link')
                .attr('title', 'Workspace Relationships')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=relationship&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });    
                
            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-tabs')
                .attr('title', 'Tab Names')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=tabsedit&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });     

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-library-script')
                .attr('title', 'Behaviors')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/admin#section=setuphome&tab=workspaces&item=behavior&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });   

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-workflow')
                .attr('title', 'Workflow Editor')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/workflowEditor.form?workspaceId=' + $(this).closest('.tile').attr('data-id'));
                });  

            insertPinButton(elemTile);

        }

    });

}


function insertScripts() {

    $.get('/plm/scripts', {}, function(response) {

        let scripts = response.data.scripts;

        sortArray(scripts, 'uniqueName');

        for(let script of scripts) {

            let elemTile = $('<div></div>').appendTo($('#scripts-list'))
                .attr('data-id', script.__self__.split('/').pop())
                .addClass('tile')
                .click(function() {
                    openURL('/script.form?ID=' + $(this).attr('data-id'));
                });

            $('<div></div>').appendTo(elemTile)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-library-script');
            
            $('<div></div>').appendTo(elemTile)
                .addClass('tile-title')
                .html(script.uniqueName);

            let elemActions = $('<div></div>').appendTo(elemTile).addClass('tile-actions');

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-search-list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/script/whereused.form?ID=' + $(this).closest('.tile').attr('data-id'));
                });

            insertPinButton(elemTile);

        }

    });

}


function insertPicklists() {

    $.get('/plm/picklists', {}, function(response) {

        let picklists = response.data.list.picklist;

        sortArray(picklists, 'name');

        for(let picklist of picklists) {

            let elemTile = $('<div></div>').appendTo($('#picklists-list'))
                .attr('data-id', picklist.id)
                .addClass('tile')
                .click(function() {
                    openURL('/admin#section=setuphome&tab=general&item=picklistedit&params={"name":"' + $(this).attr('data-id') + '"}');
                });

            $('<div></div>').appendTo(elemTile)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-list');
            
            $('<div></div>').appendTo(elemTile)
                .addClass('tile-title')
                .html(picklist.name);
            
            let elemActions = $('<div></div>').appendTo(elemTile).addClass('tile-actions');

            $('<div></div>').appendTo(elemActions)
                .addClass('icon')
                .addClass('icon-search-list')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('/pickListWhereUsed.do?name=' + $(this).closest('.tile').attr('data-id'));
                });

            insertPinButton(elemTile);

        }

    });

}


function insertRoles() {

    $.get('/plm/roles', {}, function(response) {

        let roles = response.data.list.role;

        sortArray(roles, 'name');

        for(let role of roles) {

            let elemTile = $('<div></div>').appendTo($('#roles-list'))
                .addClass('tile')
                .attr('data-id', role.id)
                .click(function() {
                    openURL('/adminRolePermissionsManage.do?roleId=' + $(this).attr('data-id'));
                });

            $('<div></div>').appendTo(elemTile)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-role');
            
            $('<div></div>').appendTo(elemTile)
                .addClass('tile-title')
                .html(role.name);

            insertPinButton(elemTile);

        }

    });

}


function insertPinButton(elemTile) {

    $('<div></div>').appendTo(elemTile)
        .addClass('tile-icon')
        .addClass('icon')
        .addClass('icon-bookmark-toggle')
        .addClass('icon-bookmark-off')
        .attr('title', 'Pin this item to keep it visible while searching')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('icon-bookmark').toggleClass('icon-bookmark-off');
        }); 

}


function openURL(url) {

    if(url === '') return;

    url  = 'https://' + tenant + '.autodeskplm360.net' + url;

    window.open(url, '_blank');

}