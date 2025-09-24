let urlParameters = getURLParameters();
let tenants       = []
let windows       = [];
let allSccrips    = [];
let completed     = 0;

$(document).ready(function() {

    appendOverlay(false);

    setTenants();
    setUIEvents();
    insertMenu();
    insertWorkspaces();
    insertScripts();
    insertPicklists();
    insertRoles();

});

function setTenants() {

    if(isBlank(urlParameters.tenants)) return;

    tenants = urlParameters.tenants.split(';');

    $('<option></option>').prependTo($('#mod'))
        .attr('value', 'cp')
        .html('Compare Tenants');

    $('#mod').val('cp');

}

function setUIEvents() {

    $('#search').on('keyup', function() { $('.workspace').removeClass('selected'); filterLists(); });

    $('#settings').click(function() { openURL('', '/admin#section=setuphome&tab=general&item=configparams'); });
    $('#wsm'     ).click(function() { openURL('', '/admin#section=setuphome&tab=workspaces'               ); });
    $('#mmd'     ).click(function() { openURL('', '/admin#section=setuphome&tab=general&item=categories'  ); });
    $('#lce'     ).click(function() { openURL('', '/lifecycleEditorView.form'                             ); });
   
   
    $('#clc').click(function() { 
        $(this).addClass('disabled').removeClass('red');
        $.post('/plm/clear-cache', {}, function() {
            $('#clc').removeClass('disabled');
        });
    });

    $('#clw').click(function() { 
        for(let elemWindow of windows) elemWindow.elem.close();
        windows = [];
    });

    $('#workspace-categories').on('change', function() { filterLists(); });
    $('#script-types'        ).on('change', function() { filterLists(); });
    $('#picklist-types'      ).on('change', function() { filterLists(); });

}


function filterLists() {

    filterList('workspaces-list');
    filterList('scripts-list'   );
    filterList('picklists-list' );
    filterList('roles-list'     );

    let elemWorksapce = $('.workspace.selected');
    let workspaceId   = (elemWorksapce.length === 0) ? '' : elemWorksapce.attr('data-id');
    let category      = $('#workspace-categories').val();
    let scriptType    = $('#script-types').val();
    let picklistType  = $('#picklist-types').val();

    if(workspaceId !== '') {

        $('#overlay').show();
        
        let timestamp     = new Date().getTime();
        let picklists     = [];
        let scripts       = [];
        let requests      = [
            $.get('/plm/workspace-scripts'             , { wsId : workspaceId, useCache : true, timestamp : timestamp }),
            $.get('/plm/workspace-workflow-transitions', { wsId : workspaceId, useCache : true, timestamp : timestamp }),
            $.get('/plm/fields'                        , { wsId : workspaceId, useCache : true, timestamp : timestamp })
        ]

        Promise.all(requests).then(function(responses) {

            if(responses[0].params.timestamp != timestamp) return;

            $('#overlay').hide();

            let wsScripts     = responses[0].data;
            let wsTransitions = responses[1].data;
            let wsFields      = responses[2].data;

            for(let script of wsScripts.scripts) if(!scripts.includes(script.__self__)) scripts.push(script.__self__);

            for(let transition of wsTransitions) {
                if(!isBlank(transition.conditionScript )) { if(!scripts.includes(transition.conditionScript.link )) scripts.push(transition.conditionScript.link ); }
                if(!isBlank(transition.validationScript)) { if(!scripts.includes(transition.validationScript.link)) scripts.push(transition.validationScript.link); }
                if(!isBlank(transition.actionScript    )) { if(!scripts.includes(transition.actionScript.link    )) scripts.push(transition.actionScript.link    ); }
            }

            for(let field of wsFields) {
                if(!isBlank(field.picklist)) {
                    let picklist = field.picklist.split('/').pop();
                    if(!picklists.includes(picklist)) {
                        picklists.push(picklist);
                    }
                }
            }

            $('#scripts-list').children().each(function() {
                let link = $(this).attr('data-link');
                let isPinned = $(this).find('.icon-pin-on').length > 0;
                if(!scripts.includes(link)) {
                    if(!isPinned) $(this).addClass('hidden');
                }
            });

            $('#picklists-list').children().each(function() {
                let elemPicklist = $(this);
                let idPickklist = elemPicklist.attr('data-id');
                let isPinned    = $(this).find('.icon-pin-on').length > 0;
                if(!picklists.includes(idPickklist)) {
                    if(!isPinned) $(this).addClass('hidden');
                }
            });

            $('#roles-list').children().each(function() {
                let isPinned    = $(this).find('.icon-pin-on').length > 0;
                if($(this).attr('data-wsid') !== workspaceId) {
                    if(!isPinned) $(this).addClass('hidden');
                }
            });

        });

    }

    if(category !== '---') {

        $('#workspaces-list').children().each(function() {

            let value = $(this).attr('data-category');
            if(value !== category) $(this).addClass('hidden'); 

        });

    }

    if(scriptType !== '---') {

        $('#scripts-list').children().each(function() {

            let type = $(this).attr('data-type');

            switch(type) {

                case 'action'    : if(scriptType !== 'act') $(this).addClass('hidden'); break;
                case 'validation': if(scriptType !== 'val') $(this).addClass('hidden'); break;
                case 'condition' : if(scriptType !== 'con') $(this).addClass('hidden'); break;
                case 'library'   : if(scriptType !== 'lib') $(this).addClass('hidden'); break;

            }

        });

    }

    if(picklistType !== '---') {

        $('#picklists-list').children().each(function() {

            let type = $(this).attr('data-view');

            switch(type) {

                case 'true' : if(picklistType !== 'dyn') $(this).addClass('hidden'); break;
                case 'false': if(picklistType !== 'fix') $(this).addClass('hidden'); break;

            }

        });

    }

}
function filterList(id,) {

    let elemList = $('#' + id);
    let value    = $('#search').val().toLowerCase();

    if(isBlank(value)) {

        elemList.children().removeClass('hidden');

    } else {

        elemList.children().each(function() {

            let isPinned = $(this).find('.icon-pin-on').length > 0;
            let title    = $(this).find('.tile-title').html().toLowerCase();

            if(isPinned) {

                $(this).removeClass('hidden')

            } else {

                if(title.indexOf(value) >= 0) $(this).removeClass('hidden'); else $(this).addClass('hidden');

            }

        });

    }

}


function insertWorkspaces() {

    $.get('/plm/workspaces', { limit : 1000, useCache : true }, function(response) {

        let workspaces = response.data.items;
        let categories = [];

        if(completed++ === 3) $('#overlay').hide();

        sortArray(workspaces, 'title');

        for(let workspace of workspaces) {

            if(!categories.includes(workspace.category.name)) categories.push(workspace.category.name);

            let elemTile = $('<div></div>').appendTo($('#workspaces-list'))
                .attr('data-id', workspace.urn.split('.').pop())
                .attr('data-category', workspace.category.name)
                .addClass('tile')
                .addClass('workspace')
                .click(function() {
                    $(this).siblings().removeClass('selected');
                    $(this).toggleClass('selected');
                    filterLists();
                });

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
                .addClass('tile-workspace-category')
                .html(workspace.category.name);

            $('<div></div>').appendTo(elemDetails)
                .addClass('tile-workspace-id')
                .html(workspace.link.split('/').pop());
  
            $('<div></div>').appendTo(elemDetails)
                .addClass('tile-workspace-name')
                .html(workspace.systemName);

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-settings')
                .attr('title', 'Workspace Settings')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=workspaceedit&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });                

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-details')
                .attr('title', 'Item Details Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=itemdetails&params={"metaType":"D","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });                

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-tag')
                .attr('title', 'Workspace Descriptor')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=descriptor&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });          

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-table')
                .attr('title', 'Grid Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=grid&params={"metaType":"G","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });                

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-released')
                .attr('title', 'Managed Items Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=workflowitems&params={"metaType":"L","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });  

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-bom-tree')
                .attr('title', 'Bill of Materials Tab')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=bom&params={"metaType":"B","workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });          

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-link')
                .attr('title', 'Workspace Relationships')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=relationship&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });    
                
            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-tabs')
                .attr('title', 'Tab Names')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=tabsedit&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });     

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-library-script')
                .attr('title', 'Behaviors')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/admin#section=setuphome&tab=workspaces&item=behavior&params={"workspaceID":"' + $(this).closest('.tile').attr('data-id') + '"}');
                });   

            $('<div></div>').appendTo(elemActions)
                .addClass('tile-icon')
                .addClass('icon')
                .addClass('icon-workflow')
                .attr('title', 'Workflow Editor')
                .click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openURL('workspace', '/workflowEditor.form?workspaceId=' + $(this).closest('.tile').attr('data-id'));
                });  

            insertPinButton(elemTile);

        }


        categories.sort();

        for(let category of categories) {

            $('<option></option>').appendTo($('#workspace-categories'))
                .attr('value', category)
                .html(category)

        }
        

    });

}


function insertScripts() {

    $.get('/plm/scripts', { useCache : true }, function(response) {

        allScripts = response.data.scripts;

        if(completed++ === 3) $('#overlay').hide();

        sortArray(allScripts, 'uniqueName');

        for(let script of allScripts) {

            let elemTile = $('<div></div>').appendTo($('#scripts-list'))
                .attr('data-id', script.__self__.split('/').pop())
                .attr('data-link', script.__self__)
                .attr('data-type', script.scriptType.toLowerCase())
                .addClass('tile')
                .click(function() {
                    openURL('script', '/script.form?ID=' + $(this).attr('data-id'));
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
                    openURL('scriptwu', '/script/whereused.form?ID=' + $(this).closest('.tile').attr('data-id'));
                });

            insertPinButton(elemTile);

        }

    });

}


function insertPicklists() {

    $.get('/plm/picklists', { useCache : true }, function(response) {

        let picklists = response.data.list.picklist;

        if(completed++ === 3) $('#overlay').hide();

        sortArray(picklists, 'name');

        for(let picklist of picklists) {

            let elemTile = $('<div></div>').appendTo($('#picklists-list'))
                .attr('data-id', picklist.id)
                .attr('data-view', picklist.view)
                .addClass('tile')
                .click(function() {
                    openURL('workspace', '/admin#section=setuphome&tab=general&item=picklistedit&params={"name":"' + $(this).attr('data-id') + '"}');
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
                    openURL('picklistwu', '/pickListWhereUsed.do?name=' + $(this).closest('.tile').attr('data-id'));
                });

            insertPinButton(elemTile);

        }

    });

}


function insertRoles() {

    $.get('/plm/roles', { useCache : true }, function(response) {

        let roles = response.data.list.role;

        if(completed++ === 3) $('#overlay').hide();

        sortArray(roles, 'name');

        for(let role of roles) {

            let elemTile = $('<div></div>').appendTo($('#roles-list'))
                .addClass('tile')
                .attr('data-id', role.id)
                .attr('data-wsid', role.workspaceID)
                .click(function() {
                    openURL('role', '/adminRolePermissionsManage.do?roleId=' + $(this).attr('data-id'));
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
        .addClass('icon-pin')
        .attr('title', 'Pin this item to keep it visible while searching')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('icon-pin-on').toggleClass('filled');
        }); 

}


function openURL(panelName, url) {

    if(url === '') return;

    let mode = $('#mod').val();

    if(mode === 'cp') {

        let index = 0;

        for(let panelName of tenants)  {

            let panelURL = 'https://' + panelName + '.autodeskplm360.net' + url;
            let top      = screen.height * 0.3;
            let height   = screen.height * 0.6;
            let width    = screen.width / tenants.length;
            let left     = (width * index++);
            let options  = 'height=' + height
                + ',width=' + width 
                + ',top='   + top
                + ',left='  + left
                + ',toolbar=0,Location=0,Directxories=0,Status=0,menubar=1,Scrollbars=1,Resizable=1';

            let newWindow = window.open(panelURL, panelName, options);

            addNewWindow(panelName, newWindow);

        }

    } else {

        url  = 'https://' + tenant + '.autodeskplm360.net' + url;

        if((panelName === '') || (mode === 'nt')) { window.open(url, '_blank'); return; }

        if(mode === 'sp') panelName = 'PLM';

        let top      = screen.height * 0.3;
        let height   = screen.height * 0.6;
        let width   = screen.width / 2;
        let left    = width;
        let options = 'height=' + height
            + ',width=' + width 
            + ',top='   + top
            + ',left='  + left
            + ',toolbar=0,Location=0,Directxories=0,Status=0,menubar=1,Scrollbars=1,Resizable=1';

        let newWindow = window.open(url, panelName, options);

        addNewWindow(panelName, newWindow);

    }

}

function addNewWindow(panelName, newWindow) {

    let isNew = true;

    for(let elemWindow of windows) {

        if(elemWindow.name === panelName) {
            isNew = false;
        }

    }

    if(isNew) windows.push({
        name : panelName,
        elem : newWindow
    })

}