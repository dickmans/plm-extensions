let fileHandler  =  null;
let mode         = 'all';
let timestamp    = 0;
let environments = { 
    source     : { workspace : {}, workspaces : [], scripts : {}, picklists : [], groups : [], roles : [] },
    target     : { workspace : {}, workspaces : [], scripts : {}, picklists : [], groups : [], roles : [] },
    picklists  : [],
    scripts    : [],
    libraries  : []
}
let all = {
    names      : [],
    workspaces : [],
    scripts    : [],
    picklists  : [],
    groups     : [],
    roles      : [],
}


$(document).ready(function() {

    $('#source-tenant').val(tenant);

    setUIEvents();
    insertMenu();

    validateSystemAdminAccess(function(isAdmin) {

        if(isAdmin) {

            appendOverlay(false);

            if(!isBlank(urlParameters.source)) {
                $('#source-tenant').val(urlParameters.source);
            }

            getWorkspaces('source', function() {

                if(!isBlank(urlParameters.workspace)) {
                    if(this.value === 'all-workspaces') $('body').addClass('mode-all'); else $('body').removeClass('mode-all');
                    $('#source-workspaces').val(urlParameters.workspace);
                }

                if(!isBlank(urlParameters.target)) {
                    $('#target-tenant').val(urlParameters.target);
                    getWorkspaces('target', function() {
                        if(!isBlank(urlParameters.start)) {
                            if(urlParameters.start === 'true') {
                                $('#comparison-start').click();
                            }
                        }
                    });
                }

            });

        }

    });

});


function setUIEvents() {


    // Header Toolbar
    $('#export-base'  ).click(function() { exportTenantConfiguration($(this), 'base'); });
    $('#export-target').click(function() { exportTenantConfiguration($(this), 'target'); });


    $('#source-tenant').keydown(function (e) {
        if (e.keyCode == 13) {
            getWorkspaces('source');
        }
    });
    $('#comparison-options input').keyup(function (e) {
        let elemInput = $(this);
        let value     = elemInput.val();
        let id        = (elemInput.attr('id') === 'source-tenant') ? 'source' : 'target';
        setTimeout(function() {
            if(value === elemInput.val()) {
                getWorkspaces(id);
            };
        }, 2000);
    });
    $('#target-tenant').keydown(function (e) {
        if (e.keyCode == 13) {
            getWorkspaces('target');
            $('.result-summary').html('');
            $('.result-actions').html('');
            $('.result-compare').hide();
            $('#comparison-results').children().each(function() {
                $(this).removeClass('match').removeClass('info').removeClass('diff').removeClass('varies').removeClass('disabled');
            });
        }
    });

    $('.icon-compare').click(function() {
        
        let category  = $(this).parent().parent();
        let urlSource = getUtilityURL(category.attr('id'), environments.source);
        let urlTarget = getUtilityURL(category.attr('id'), environments.target);

        let height  = screen.height * 0.6;
        let width   = screen.width / 2 * 0.6;
        let options = 'height=' + height
            + ',width=' + width 
            + ',top=0,toolbar=1,Location=0,Directxories=0,Status=0,menubar=1,Scrollbars=1,Resizable=1';

        const handle = window.open(urlSource, 'comparisonLeft' , options + ',left=0'       );
            if(handle) window.open(urlTarget, 'comparisonRight', options + ',left=' + width);

    });

    $('#source-workspaces').on('change', function() {
        if(this.value === 'all-workspaces') $('body').addClass('mode-all'); else $('body').removeClass('mode-all');
        $('#target-workspaces').val(this.value);
    });
    
    $('#comparison-start').click(function() {
        if($(this).hasClass('disabled')) return;
        startComparison();
    });
    $('#comparison-stop').click(function() {
        if($(this).hasClass('disabled')) return;
        addLogStopped();
        endComparison();
     });

    $('#open-limitations').click(function() {
        $('#dialog-limitations').show();
        $('#overlay').show();
    }); 
    $('#close-limitations').click(function() {
        $('#dialog-limitations').hide();
        $('#overlay').hide();
    }); 

    $('#comparison-report').click(function() {
        $('#dialog-report').show();
        $('#overlay').show();
    }); 
    $('#close-report').click(function() {
        if($(this).hasClass('disabled')) return;
        $('#dialog-report').hide();
        $('#overlay').hide();
    }); 

    $('#comparison-tabs').children().click(function() {
        let index = $(this).index();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        $('#comparison-contents').children().hide();
        $('#comparison-contents').children(':eq('+ index +')').show();
    });

    $('#comparison-tabs').children().first().click();

    $('.comparison-update').click(function() {
        updateComparison($(this));
    });

    $('#download-modified-scripts').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        if($(this).hasClass('toggle-on')) {
            fileHandler = window.showDirectoryPicker() ;
        }
    });

    $('#comparison-contents input').on('keyup', function() {
        applyContentFilter($(this), $(this).next());
    });
    $('#comparison-contents select').on('change', function() {
        applyContentFilter($(this).prev(), $(this));
    });

}
function getUtilityURL(id, environment) {

    let url = 'https://' + environment.tenantName + '.autodeskplm360.net' ;

    switch(id) {

        case 'result-settings'      : url += '/admin#section=setuphome&tab=workspaces&item=workspaceedit&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22}'; break;
        case 'result-tabs'          : url += '/admin#section=setuphome&tab=workspaces&item=tabsedit&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22}'; break;
        case 'result-details'       : url += '/admin#section=setuphome&tab=workspaces&item=itemdetails&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22,%22metaType%22:%22D%22}'; break;
        case 'result-grid'          : url += '/admin#section=setuphome&tab=workspaces&item=grid&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22,%22metaType%22:%22G%22}'; break;
        case 'result-managed'       : url += '/admin#section=setuphome&tab=workspaces&item=workflowitems&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22,%22metaType%22:%22L%22}'; break;
        case 'result-bom'           : url += '/admin#section=setuphome&tab=workspaces&item=bom&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22,%22metaType%22:%22B%22}'; break;
        case 'result-relationships' : url += '/admin#section=setuphome&tab=workspaces&item=relationship&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22}'; break;
        case 'result-print'         : url += '/admin#section=setuphome&tab=workspaces&item=advancedPrintViewList&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22}'; break;
        case 'result-behaviors'     : url += '/admin#section=setuphome&tab=workspaces&item=behavior&params={%22workspaceID%22:%22' + environment.workspace.wsId + '%22}'; break;
        case 'result-states'        : 
        case 'result-transitions'   : url += '/workflowEditor.form?workspaceId=' + environment.workspace.wsId; break;
        case 'result-picklists'     : url += '/admin#section=setuphome&tab=general&item=picklistsview'; break;
        case 'result-roles'         : url += '/admin#section=adminusers&tab=roles'; break;
        case 'result-scripts'       :
        case 'result-libraries'     : url += '/admin#section=setuphome&tab=scripts'; break;

    }

    return url;

}
function applyContentFilters(id) {

    let elemFilters = $('#' + id);

    if(elemFilters.length > 1) return;

    applyContentFilter(elemFilters.children('input'), elemFilters.children('select'));

}
function applyContentFilter(elemInput, elemSelect) {

    let filterInput  = elemInput.val().toLowerCase();
    let filterSelect = elemSelect.val();

    elemInput.closest('.comparison-contents-toolbar').next().find('tbody').find('tr').each(function() {

        let visible = (filterSelect === 'all');
        let elemRow = $(this);

        switch(filterSelect) {

            case 'match'   : visible = (!elemRow.hasClass('missing-base') && elemRow.find('.mismatch').length === 0); break;
            case 'diff'    : visible = (elemRow.hasClass('missing-base') || elemRow.find('.mismatch').length > 0); break;
            case 'base'    : visible = !elemRow.hasClass('missing-base'); break;
            case 'target'  : visible = !elemRow.hasClass('missing-target'); break;
            case 'nibase'  : visible = elemRow.hasClass('missing-base'); break;
            case 'nitarget': visible = elemRow.hasClass('missing-target'); break;

        }

        if(visible) {
            if(filterInput !== '') {
                visible = false;
                elemRow.find('td').each(function() {
                    let text = $(this).html().toLowerCase();
                    if(text.indexOf(filterInput) > -1) {
                        visible = true;
                    }
                });
            }
        }

        if(visible) elemRow.removeClass('hidden'); else elemRow.addClass('hidden');

    });

}
function exportTenantConfiguration(elemButton, id) {

    if(elemButton.hasClass('disabled')) return;

    $('#overlay').show();

    let sheets = [
        { name : 'Workspaces', type : 'workspaces' },
        { name : 'Picklists' , type : 'picklists'  },
        { name : 'Scripts'   , type : 'scripts'    },
    ];

    let tenantName = (elemButton.attr('id') === 'export-base') ? $('#source-tenant').val() : $('#target-tenant').val();

    $.post('/plm/excel-export', {
        fileName : 'Tenant ' + tenantName + '.xlsx',
        sheets   : sheets,
        tenant   : tenantName
    }, function(response) {
        $('#overlay').hide();
        let url = document.location.href.split('/workspace-comparison')[0] + '/' + response.data.fileUrl;
        document.getElementById('frame-download').src = url;
    });
        
}


// Set workspace selectors for both tenants
function getWorkspaces(id, callback) {

    let tenantName = $('#' + id + '-tenant').val();
    
    if(tenantName === '') return;
    
    $('#' + id + '-workspaces').attr('disabled', true).addClass('disabled');
    $('#overlay').show();

    let elemSelect = $('#' + id + '-workspaces');
        elemSelect.children().remove();

    $.get('/plm/workspaces', { tenant : tenantName }, function(response) {

        if(response.params.tenant !== tenantName) return;

        $('#overlay').hide();
        
        environments[id].workspaces = response.data.items || [];

        if(response.error) return;

        if(id === 'source') {
           $('<option></option>').appendTo(elemSelect)
                .attr('value', 'all-workspaces')
                .html('All Workspaces, Scripts etc.');
        }
        
        $('#' + id + '-workspaces').removeAttr('disabled').removeClass('disabled');

        sortArray(environments[id].workspaces, 'title');
        
        for(let workspace of environments[id].workspaces) {
            $('<option></option>').appendTo(elemSelect)
                .attr('value', workspace.systemName)
                .html(workspace.title);
        }

        if(id === 'target') $('#comparison-start').removeClass('disabled');

        if(id === 'target') {
            $('#target-workspaces').val($('#source-workspaces').val());
        } 
        
        if( typeof callback !== 'undefined') { callback(); }

    });

}


// Add Report Contents
function addReportHeader(icon, label) {

    if(mode === 'all') return;

    let elemParent = $('#report-content');
    let elemHeader = $('<div></div>').appendTo(elemParent).addClass('report-header');

    $('<div></div>').appendTo(elemHeader).addClass('icon').addClass(icon);
    $('<div></div>').appendTo(elemHeader).addClass('label').html(label);

}
function addReportDetail(section, label, match) {

    if(mode === 'all') return;
    if(isBlank(match)) match = true;

    let className   = (match) ? 'match' : 'diff';
    let classIcon   = (match) ? 'icon-check' : 'icon-block';
    let elemParent  = $('#report-content');
    let elemDetails = $('<div></div>').appendTo(elemParent).addClass('report-detail');

    $('<div></div>').appendTo(elemDetails).addClass('report-section').html(section);
    $('<div></div>').appendTo(elemDetails).addClass('report-value').html(label);
    $('<div></div>').appendTo(elemDetails)
        .addClass('report-icon')
        .addClass('icon')
        .addClass(className)
        .addClass(classIcon);

}


// Add Action
function addActionEntry(params) {
    
    if(mode === 'all') return;

    let elemParent = $('#actions-' + params.step);

    let elemNew = $('<div></div>').appendTo(elemParent)
        .addClass('action')
        .attr('data-url', params.url);

    let elemText = $('<div></div>').appendTo(elemNew)
        .addClass('button')
        .addClass('action-text')
        .click(function(e) {
            let url  = 'https://' + environments.target.tenantName + '.autodeskplm360.net' + $(this).parent().attr('data-url');
            window.open(url, '_blank');
        });       

    if(!isBlank(params.comp)) {

        elemNew.addClass('with-comparison-button');

        $('<div></div>').appendTo(elemNew)
            .addClass('action-icon')
            .addClass('button')
            .addClass('icon')
            .addClass('icon-compare')
            .attr('link-source', params.comp.source)
            .attr('link-target', params.comp.target)
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();

                let height  = screen.height * 0.6;
                let width   = screen.width / 2 * 0.6;
                let options = 'height=' + height
                    + ',width=' + width 
                    + ',top=0,toolbar=1,Location=0,Directxories=0,Status=0,menubar=1,Scrollbars=1,Resizable=1';

                window.open('https://' + environments.source.tenantName + '.autodeskplm360.net' + params.comp.source, 'comparisonLeft' , options + ',left=0'       );
                window.open('https://' + environments.target.tenantName + '.autodeskplm360.net' + params.comp.target, 'comparisonRight', options + ',left=' + width);

            });

    }
    
    $('<div></div>').appendTo(elemText)
        .addClass('action-instructions')
        .html(params.text);
        $('<div></div>').appendTo(elemNew)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-check-box')
        .addClass('action-icon')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('icon-check-box').toggleClass('icon-check-box-checked').toggleClass('checked');
        });

}


// Launch & stop comparison
function startComparison() {

    stopped = false;

    timestamp = new Date().getTime();

    $('#console-content').html('');
    $('.result-summary').html('');
    $('.result-actions').html('');
    $('.result-compare').hide();
    $('#report-content').html('');


    $('#comparison-start').addClass('disabled');
    $('#comparison-report').addClass('disabled');
    $('#comparison-stop').removeClass('disabled');
    $('#comparison-results').children().each(function() {
        $(this).removeClass('match').removeClass('info').removeClass('diff').removeClass('varies').removeClass('disabled');
    });

    environments.source.tenantName = $('#source-tenant').val();
    environments.target.tenantName = $('#target-tenant').val();
    
    environments.source.workspace.title = $('#source-workspaces').val();
    environments.target.workspace.title = $('#target-workspaces').val();

    environments.source.picklists   = [];
    environments.target.picklists   = [];
    environments.source.permissions = [];
    environments.target.permissions = [];
    environments.picklists          = [];
    environments.scripts            = [];
    environments.libraries          = [];

    mode = ($('#source-workspaces').val() === 'all-workspaces') ? 'all' : 'single';

    if(mode === 'all') {

        $('#comparison-workspaces-table').html('');
        $('#comparison-scripts-table').html('');
        $('#comparison-picklists-table').html('');
        $('#comparison-roles-table').html('');

        $('#comparison-contents').find('input').val('').addClass('hidden');
        $('#comparison-contents').find('select').val('all').addClass('hidden');

        $('#comparison-contents select').each(function() {
            $(this).children().remove();
            $('<option></option>').appendTo($(this)).attr('value', 'all'     ).html('Show All');
            $('<option></option>').appendTo($(this)).attr('value', 'match'   ).html('Show Matches');
            $('<option></option>').appendTo($(this)).attr('value', 'diff'    ).html('Show Differences');
            $('<option></option>').appendTo($(this)).attr('value', 'base'    ).html('Show items of ' + environments.source.tenantName + ' only');
            $('<option></option>').appendTo($(this)).attr('value', 'target'  ).html('Show items of ' + environments.target.tenantName + ' only');
            $('<option></option>').appendTo($(this)).attr('value', 'nibase'  ).html('Show items missing in ' + environments.source.tenantName);
            $('<option></option>').appendTo($(this)).attr('value', 'nitarget').html('Show items missing in ' + environments.target.tenantName);
        });

        addLogSeparator();
        addLogEntry('Getting Initial Data', 'head');

        let requests = [
            $.get('/plm/permissions-definition', { tenant : environments.source.tenantName }),
            $.get('/plm/permissions-definition', { tenant : environments.target.tenantName })
        ]

        Promise.all(requests).then(function(responses) {
        
            environments.source.permissions = responses[0].data.list.permission;
            environments.target.permissions = responses[1].data.list.permission;

            getAllWorkspaces(false);

        });

    } else {

        for(let workspace of environments.source.workspaces) {
            if(workspace.systemName === environments.source.workspace.title) {
                environments.source.workspace.link = workspace.link;
                break;
            }
        }

        for(let workspace of environments.target.workspaces) {
            if(workspace.systemName === environments.target.workspace.title) {
                environments.target.workspace.link = workspace.link;
                break;
            }
        }

        environments.source.workspace.wsId = environments.source.workspace.link.split('/')[4];
        environments.target.workspace.wsId = environments.target.workspace.link.split('/')[4];

        $('#report-header').html(environments.source.workspace.title + ' Comparison Report');

        compareWorkspacesSettings();

    }

}
function endComparison() {
    
    $('#comparison-start').removeClass('disabled');
    $('#comparison-stop').addClass('disabled');

    if(mode !== 'all') $('#comparison-report').removeClass('disabled');

}
function updateComparison(elemButton) {

    timestamp = new Date().getTime();
    stopped   = false;
    mode      = 'all';

    environments.source.tenantName = $('#source-tenant').val();
    environments.target.tenantName = $('#target-tenant').val();
    
    resetComparisonFilterToolbar(elemButton);

    let context = elemButton.attr('data-context');  

    addLogSeparator();
    addLogEntry('Updating ' + context.toUpperCase() + ' comparison', 'head');

    $('#comparison-start').addClass('disabled');
    $('#comparison-report').addClass('disabled');
    $('#comparison-stop').removeClass('disabled');

         if(context === 'workspaces') getAllWorkspaces(true);
    else if(context === 'scripts'   ) getAllScripts(true);
    else if(context === 'picklists' ) getAllPicklists(true);
    else if(context === 'groups'    ) getAllGroups(true);
    else if(context === 'roles'     ) {
        
        let requests = [
            $.get('/plm/permissions-definition', { tenant : environments.source.tenantName, timestamp : timestamp }),
            $.get('/plm/permissions-definition', { tenant : environments.target.tenantName })
        ]

        Promise.all(requests).then(function(responses) {

            if(stopped) return;
            if(responses[0].params.timestamp != timestamp) return;
        
            environments.source.permissions = responses[0].data.list.permission;
            environments.target.permissions = responses[1].data.list.permission;

            getAllRoles(true);

        });
    }        

}
function resetComparisonFilterToolbar(elemButton) {

    let elemToolbar = elemButton.closest('.comparison-contents-toolbar');
    let elemSelect = elemToolbar.find('select');

    elemToolbar.find('.comparison-contents-filters').children().addClass('hidden');
    elemToolbar.find('input').val('');

    elemSelect.children().remove();
    $('<option></option>').appendTo(elemSelect).attr('value', 'all'     ).html('Show All');
    $('<option></option>').appendTo(elemSelect).attr('value', 'match'   ).html('Show Matches');
    $('<option></option>').appendTo(elemSelect).attr('value', 'diff'    ).html('Show Differences');
    $('<option></option>').appendTo(elemSelect).attr('value', 'base'    ).html('Show items of ' + environments.source.tenantName + ' only');
    $('<option></option>').appendTo(elemSelect).attr('value', 'target'  ).html('Show items of ' + environments.target.tenantName + ' only');
    $('<option></option>').appendTo(elemSelect).attr('value', 'nibase'  ).html('Show items missing in ' + environments.source.tenantName);
    $('<option></option>').appendTo(elemSelect).attr('value', 'nitarget').html('Show items missing in ' + environments.target.tenantName);

}


// STEP #1
function compareWorkspacesSettings() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Workspace Settings comparison', 'head');
    addReportHeader('icon-item', 'Workspace Settings');

    let requests = [
        $.get('/plm/workspace', { link : environments.source.workspace.link, tenant : environments.source.tenantName }),
        $.get('/plm/workspace', { link : environments.target.workspace.link, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let dataSource  = responses[0].data;
        let dataTarget  = responses[1].data;
        let match       = true;
        let url         = '/admin#section=setuphome&tab=workspaces&item=workspaceedit&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
        let step        = 'settings';
        let matches     = {
            category : true,
            name     : true,
            type     : true
        }

        environments.source.workspace.type = responses[0].data.type.split('/').pop();
        environments.target.workspace.type = responses[1].data.type.split('/').pop();

        $('#summary-settings').html('Workspace type : ' + getWorkspaceTypeLabel(environments.source.workspace));

        if(environments.source.workspace.type === '1') { 
            $('#result-states').addClass('disabled'); 
            $('#result-transitions').addClass('disabled'); 
        }

        if(dataSource.category.name !== dataTarget.category.name) {
            addLogEntry('Workspace categories do not match');
            addActionEntry({ step : step, text : 'Move workspace to category <b>' +  dataSource.category.name + '</b>', url : url});
            match = false;
            matches.category = false;
        }
        if(dataSource.description !== dataTarget.description) {
            addLogEntry('Workspace descriptions do not match');
            addActionEntry({ step : step, text : 'Change workspace description to <b>' +  dataSource.description + '</b>', url : url});
            match = false;
        }
        if(dataSource.name !== dataTarget.name) {
            addLogEntry('Workspace names do not match');
            addActionEntry({ step : step, text : 'Rename workspace to <b>' +  dataSource.name + '</b>', url : url});
            match = false;
            matches.name = false;
        }
        if(dataSource.type !== dataTarget.type) {
            addLogEntry('Workspace types do not match');
            addActionEntry({ step : step, text : 'Change workspace type to <b>' +  getWorkspaceTypeLabel(environments.source.workspace) + '</b>', url : url});
            match = false;
            matches.type = false;
        }

        addReportDetail('Workspace Type', getWorkspaceTypeLabel(environments.source.workspace), matches.type);
        addReportDetail('Workspace Name', dataSource.name, matches.name);
        addReportDetail('Category Name', dataSource.category.name, matches.category);

        if(match) {
            addLogEntry('Workspace settings match', 'match');
            $('#result-settings').addClass('match');
        } else {
            addLogEntry('Workspace settings do not match', 'diff');
            $('#result-settings').addClass('diff');
        }

        $('#result-settings').find('.result-compare').show();
        
        comparePermissions();

    });

}


// STEP #2
function comparePermissions() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Roles comparison', 'head');
    addReportHeader('icon-released', 'Permissions (Roles)');

    let requests = [
        $.get('/plm/roles', { tenant : environments.source.tenantName }),
        $.get('/plm/roles', { tenant : environments.target.tenantName }),
        $.get('/plm/permissions-definition', { tenant : environments.source.tenantName }),
        $.get('/plm/permissions-definition', { tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let url         = '/admin#section=adminusers&tab=roles';
        let step        = 'roles';
        let definitions = responses[2].data.list.permission;
        let permTarget  = responses[3].data.list.permission;
        let listSource  = [];
        let listTarget  = [];
        let match       = true;
        let matches     = {
            description      : true,
            permissions      : true,
            extraRoles       : false,
            extraPermissions : false
        }
        
        for(let role of responses[0].data.list.role) {
            if(role.workspaceID == environments.source.workspace.wsId) {
                role.hasMatch = false;
                listSource.push(role);
                for(let permission of role.permissions.permission) permission.hasMatch = false;
            }
        }

        for(let role of responses[1].data.list.role) {
            if(role.workspaceID == environments.target.workspace.wsId) {
                role.hasMatch = false;
                listTarget.push(role);
                for(let permission of role.permissions.permission) permission.hasMatch = false;
            }
        }

        for(let source of listSource) {

            let hasMatch    = false;
            let reportMatch = false;

            for(let target of listTarget) {

                if(source.name === target.name) {
                    
                    hasMatch        = true;
                    reportMatch     = true;
                    target.hasMatch = true;
                    target.sourceId = source.id;

                    if(source.description !== target.description) {
                        matches.description = false;
                        reportMatch         = false;
                        addActionEntry({ 
                            text : 'Change description of <b>' + target.name + '</b> to <b>' + source.description + '</b>', 
                            step : step,
                            url  : url 
                        });
                    }

                    for(let permission of source.permissions.permission) {

                        let match = false;

                        for(let targetPermission of target.permissions.permission) {
                            if(permission.id === targetPermission.id) {
                                match = true;
                                targetPermission.hasMatch = true;
                                break;
                            }
                        }

                        if(!match) {
                            // Compare workflow permissions by label if ids do not match
                            let sourceDefinition = getPermissionDefinition(definitions, permission.id);
                            if(sourceDefinition.isWorkflowPermission) {
                                for(let targetPermission of target.permissions.permission) {
                                    let targetDefinition = getPermissionDefinition(permTarget, targetPermission.id);
                                    if(targetDefinition.isWorkflowPermission) {
                                        if(sourceDefinition.name = targetDefinition.name) {
                                            match = true;
                                            targetPermission.hasMatch = true;
                                        }
                                    }
                                }
                            }
                        }

                        if(!match) {
                            let label = getPermissionDefinition(definitions, permission.id).name;
                            matches.permissions = false;
                            reportMatch         = false;
                            addActionEntry({ 
                                text : 'Add permission <b>' + label + '</b> to role <b>' + source.name + '</b>', 
                                step : step,
                                url  : url 
                            });
                        }

                    }

                }
            }

            if(!hasMatch) {
                match = false;
                addActionEntry({ 
                    text  : 'Add role <b>' + source.name + '</b>', 
                    step : step,
                    url   : url });
            }

            addReportDetail('Role', source.name, reportMatch);

        }

        for(let target of listTarget) {
            if(!target.hasMatch) {
                match = false;
                matches.extraRoles = true;
                addActionEntry({ 
                    text : 'Remove role <b>' + target.name + '</b> in ' + environments.target.tenantName, 
                    step : step,
                    url  : url
                });
            } else {
                for(let permission of target.permissions.permission) {
                    if(!permission.hasMatch) {
                        match = false;
                        matches.extraPermissions = true;
                        addActionEntry({ 
                            text : 'Remove permission <b>' + getPermissionDefinition(permTarget, permission.id).name + '</b> from role <b>' + target.name + '</b>', 
                            step : step,
                            url  : url
                            // comp : {
                            //     source : '/adminRolePermissionsManage.do?roleId=' + target.sourceId,
                            //     target : '/adminRolePermissionsManage.do?roleId=' + target.id
                            // }
                        });
                    }
                }
            }
        }    

        if(!matches.description     ) { match = false; addLogEntry('Descriptions of roles do not match'); }
        if(!matches.permissions     ) { match = false; addLogEntry('Permission in roles do not match'); }
        if( matches.extraRoles      ) { match = false; addLogEntry('There are additional roles in '+ environments.target.tenantName); }
        if( matches.extraPermissions) { match = false; addLogEntry('There are additional permisions in matching roles in '+ environments.target.tenantName); }

        $('#summary-roles').html('Roles : ' + listSource.length);

        if(match) {
            addLogEntry('Workspace Roles match', 'match');
            $('#result-roles').addClass('match');
        } else {
            addLogEntry('Workspace Roles do not match', 'diff');
            $('#result-roles').addClass('diff');
        }

        $('#result-roles').find('.result-compare').show();

        compareWorkspaceTabs();

    });

}
function getPermissionDefinition(definitions, id) {

    let result = { 
        label                : '' ,
        isWorkflowPermission : false
    };

    for(let definition of definitions) {
        if(definition.id === id) {
            result.name = definition.name;
            result.isWorkflowPermission = (definition.groupName.indexOf('Workflow Permission')  >= 0);
            break;
        }
    }

    return result;

}


// STEP #3
function compareWorkspaceTabs() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Workspace Tabs comparison', 'head');
    addReportHeader('icon-tabs', 'Workspace Tabs Labels and Sequence');

    let requests = [
        $.get('/plm/tabs', { link : environments.source.workspace.link, tenant : environments.source.tenantName }),
        $.get('/plm/tabs', { link : environments.target.workspace.link, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let tabsSource  = responses[0].data;
        let tabsTarget  = responses[1].data;
        let matches     = getTabsMatch(tabsSource, tabsTarget, '');
        // let match         = true;
        // let matchNames    = true;
        // let matchSequence = true;
        // let matchCount    = true;
        // let url           = '/admin#section=setuphome&tab=workspaces&item=tabsedit&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
        // let step          = 'tabs';
        
        // for(let tabTarget of tabsTarget) tabTarget.hasMatch = false;

        // for(let tabSource of tabsSource) {

        //     let matchTab    = false;
        //     let labelSource = (isBlank(tabSource.name)) ? tabSource.key : tabSource.name;
        //     let indexSource = (tabsSource.indexOf(tabSource) + 1);
        //     let matches     = {
        //         names    : true,
        //         sequence : true
        //     }

        //     for(let tabTarget of tabsTarget) {

        //         if(tabSource.actionName === tabTarget.actionName) {
                    
        //             matchTab           = true;
        //             tabTarget.hasMatch = true;
        //             let labelTarget    = (isBlank(tabTarget.name)) ? tabTarget.key : tabTarget.name;

        //             if(labelSource !== labelTarget) {
        //                 matchNames = false;
        //                 matches.names = false;
        //                 addActionEntry({
        //                     step : step,
        //                     text : 'Rename tab <b>' + labelTarget + '</b> to <b>' + labelSource + '</b>',
        //                     url  : url
        //                 });
        //             }

        //             if(tabSource.displayOrder !== tabTarget.displayOrder) {
        //                 matchSequence = false;
        //                 matches.sequence = false;
        //                 addActionEntry({
        //                     step : step,
        //                     text : 'Move tab <b>' + labelTarget + '</b> to position <b>' + tabSource.displayOrder + '</b>',
        //                     url  : url
        //                 });
        //             }

        //             break;

        //         }

        //     }

        //     if(!matchTab) {
        //         match = false;
        //         addLogEntry('Tab <b>' + labelSource + '</b> is not available');
        //         addActionEntry({
        //             step : step,
        //             text : 'Add tab <b>' + tabSource.key + '</b> with label <b>' + labelSource + '</b> in position <b>' + indexSource + '</b>',
        //             url  : url
        //         });
        //     }

        //     addReportDetail(tabSource.workspaceTabName, labelSource, matches.names && matches.sequence);

        // }

        // for(let tabTarget of tabsTarget) {
        //     if(!tabTarget.hasMatch) {
        //         matchCount = false; 
        //         let labelTarget = (isBlank(tabTarget.name)) ? tabTarget.key : tabTarget.name;
        //         addActionEntry({
        //             step : step,
        //             text : 'Hide tab <b>' + labelTarget + '</b> for all user roles',
        //             url  : url
        //         });
        //     }
        // }

        // if(!matchNames)    { match = false; addLogEntry('Workspace tabs names do not match'); }
        // if(!matchSequence) { match = false; addLogEntry('Workspace tabs sequence does not match'); }
        // if(!matchCount)    { match = false; addLogEntry('Tenant ' + environments.target.tenantName + ' uses additional tabs'); }

        $('#summary-tabs').html(' Tabs : ' + tabsSource.length);

        if(matches.all) {
            addLogEntry('Workspace tabs match', 'match');
            $('#result-tabs').addClass('match');
        } else {
            addLogEntry('Workspace tabs do not match', 'diff');
            $('#result-tabs').addClass('diff');
        }

        $('#result-tabs').find('.result-compare').show();

        compareItemDetailsTab();

    });

}
function getTabsMatch(tabsSource, tabsTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url  = '/admin#section=setuphome&tab=workspaces&item=tabsedit&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
    let step = 'tabs';

    let matches = {
        all      : true,
        names    : true,
        sequence : true,
        count    : true
    }

    for(let tabTarget of tabsTarget) tabTarget.hasMatch = false;

    for(let tabSource of tabsSource) {

        let matchTab    = false;
        let labelSource = (isBlank(tabSource.name)) ? tabSource.key : tabSource.name;
        let indexSource = (tabsSource.indexOf(tabSource) + 1);

        for(let tabTarget of tabsTarget) {

            if(tabSource.actionName === tabTarget.actionName) {
                
                matchTab           = true;
                tabTarget.hasMatch = true;
                let labelTarget    = (isBlank(tabTarget.name)) ? tabTarget.key : tabTarget.name;

                if(labelSource !== labelTarget) {
                    matches.names = false;
                    addActionEntry({
                        step : step,
                        text : 'Rename tab <b>' + labelTarget + '</b> to <b>' + labelSource + '</b>',
                        url  : url
                    });
                }

                if(tabSource.displayOrder !== tabTarget.displayOrder) {
                    matches.sequence = false;
                    addActionEntry({
                        step : step,
                        text : 'Move tab <b>' + labelTarget + '</b> to position <b>' + tabSource.displayOrder + '</b>',
                        url  : url
                    });
                }

                break;

            }

        }

        if(!matchTab) {
            matches.all = false;
            addLogEntry(logPrefix + 'Tab <b>' + labelSource + '</b> is not available', 'diff');
            addActionEntry({
                step : step,
                text : 'Add tab <b>' + tabSource.key + '</b> with label <b>' + labelSource + '</b> in position <b>' + indexSource + '</b>',
                url  : url
            });
        }

        addReportDetail(tabSource.workspaceTabName, labelSource, matches.names && matches.sequence);

    }

    for(let tabTarget of tabsTarget) {
        if(!tabTarget.hasMatch) {
            matches.count = false; 
            let labelTarget = (isBlank(tabTarget.name)) ? tabTarget.key : tabTarget.name;
            addActionEntry({
                step : step,
                text : 'Hide tab <b>' + labelTarget + '</b> for all user roles',
                url  : url
            });
        }
    }

    if(!matches.names)    { matches.all = false; addLogEntry(logPrefix + 'Workspace tab names do not match', 'diff'); }
    if(!matches.sequence) { matches.all = false; addLogEntry(logPrefix + 'Workspace tab sequence does not match', 'diff'); }
    if(!matches.count)    { matches.all = false; addLogEntry(logPrefix + 'Tenant ' + environments.target.tenantName + ' uses additional tabs', 'diff'); }

    return matches;

}


// STEP #4
function compareItemDetailsTab() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Item Details Tab comparison', 'head');
    addReportHeader('icon-details', 'Item Details Sections and Fields');

    let requests = [
        $.get('/plm/sections' , { tenant : environments.source.tenantName, wsId : environments.source.workspace.wsId }),
        $.get('/plm/fields'   , { tenant : environments.source.tenantName, wsId : environments.source.workspace.wsId }),
        $.get('/plm/picklists', { tenant : environments.source.tenantName }),
        $.get('/plm/sections' , { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName }),
        $.get('/plm/fields'   , { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName }),
        $.get('/plm/picklists', { tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {     
        
        environments.source.picklists = responses[2].data.list.picklist;
        environments.target.picklists = responses[5].data.list.picklist;
        
        let sectionsSource  = responses[0].data;
        let fieldsSource    = responses[1].data;
        let sectionsTarget  = responses[3].data;
        let fieldsTarget    = responses[4].data;
        let matches         = getItemDetailsMatch(sectionsSource, sectionsTarget, fieldsSource, fieldsTarget);

        $('#summary-details').html(' Sections : ' + sectionsSource.length + ' / Fields : ' + fieldsSource.length);

        if(matches.all) {
            addLogEntry('Workspace Item Details match', 'match');
            $('#result-details').addClass('match');
        } else {
            addLogEntry('Workspace Item Details do not match', 'diff');
            $('#result-details').addClass('diff');
        }

        $('#result-details').find('.result-compare').show();

        compareGridTab();

    });

}
function getItemDetailsMatch(sectionsSource, sectionsTarget, fieldsSource, fieldsTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url  = '/admin#section=setuphome&tab=workspaces&item=itemdetails&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22D%22}';
    let step = 'details';

    let matches = {
        all                     : true,
        sectionsDescriptions    : true,
        sectionsOrder           : true,
        sectionsCollapsed       : true,
        sectionsLocked          : true,
        sectionsFieldsCount     : true,
        sectionsMatrixes        : true,
        sectionsExtra           : false,
        fieldsNames             : true,
        fieldsDescriptions      : true,
        fieldsTypes             : true,
        fieldsPreview           : true,
        fieldsUoM               : true,
        fieldsPicklists         : true,
        fieldsLength            : true,
        fieldsDisplay           : true,
        fieldsVisibility        : true,
        fieldsEditability       : true,
        fieldsDefaults          : true,
        fieldsFormulas          : true,
        fieldsValidations       : true,
        fieldsValidationSettings: true,
        fieldsSections          : true,
        fieldsOrder             : true,
        fieldsExtra             : false
    }

    for(let sectionTarget of sectionsTarget) {
        sectionTarget.hasMatch  = false;
        sectionTarget.name      = sectionTarget.name.trim();
        let index               = 1;
        for(let sectionField of sectionTarget.fields) {
            for(let fieldTarget of fieldsTarget) {
                if(fieldTarget.__self__ === sectionField.link) {
                    fieldTarget.section = sectionTarget.name;
                    fieldTarget.index   = index++;
                }
            }
        }
        for(let targetMatrix of sectionTarget.matrices) {
            for(let matrixRow of targetMatrix.fields) {
                for(let matrixField of matrixRow) {
                    if(!isBlank(matrixField)) {
                        for(let fieldTarget of fieldsTarget) {
                            if(fieldTarget.__self__ === matrixField.link) {
                                fieldTarget.section = sectionTarget.name;
                            }
                        }
                    }
                }
            }
        }
        for(let target of sectionTarget.matrices) target.hasMatch = false;
    }

    for(let sectionSource of sectionsSource) {

        let hasMatch            = false;
        let index               = 1;
        sectionSource.name      = sectionSource.name.trim();
        sectionSource.collapsed = sectionSource.collapsed || false;

        for(let sectionField of sectionSource.fields) {
            for(let fieldSource of fieldsSource) {
                if(fieldSource.__self__ === sectionField.link) {
                    fieldSource.section = sectionSource.name;
                    fieldSource.index   = index++;
                }
            }
        }

        for(let sourceMatrix of sectionSource.matrices) {
            for(let matrixRow of sourceMatrix.fields) {
                for(let matrixField of matrixRow) {
                    if(!isBlank(matrixField)) {
                        for(let fieldSource of fieldsSource) {
                            if(fieldSource.__self__ === matrixField.link) {
                                fieldSource.section = sectionSource.name;
                                // fieldSource.index   = index++;
                            }
                        }
                    }
                }
            }
        }

        for(let sectionTarget of sectionsTarget) {

            if(sectionSource.name === sectionTarget.name) {
                
                hasMatch                = true;
                sectionTarget.hasMatch  = true;
                sectionTarget.collapsed = sectionTarget.collapsed || false;

                if(sectionSource.description !== sectionTarget.description) {
                    matches.sectionsDescriptions = false;
                    addActionEntry({
                        text : 'Change description of section <b>' + sectionTarget.name + '</b> to <b>' + sectionSource.description + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(sectionSource.displayOrder !== sectionTarget.displayOrder) {
                    matches.sectionsOrder = false;
                    addActionEntry({
                        text : 'Section <b>' + sectionTarget.name + '</b> is at position <b>' + sectionTarget.displayOrder + '</b> but should be at <b>' + sectionSource.displayOrder + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(sectionSource.collapsed !== sectionTarget.collapsed) {

                    matches.sectionsCollapsed = false;
                    let label = (sectionSource.collapsed) ? ' ' : ' not ';
                    addActionEntry({
                        text : 'Section <b>' + sectionTarget.name + '</b> should' + label + 'be collapsed',
                        step : step,
                        url  : url
                    });
                }
                    
                // if(sectionSource.sectionLocked !== sectionTarget.sectionLocked) {
                //     matches.sectionsLocked = false;
                //     let label = (sectionSource.sectionLocked) ? 'Enable' : 'Disable';
                //     addActionEntry({
                //         text : label + ' Workflow Locking for section <b>' + sectionTarget.name + '</b>',
                //         step : step,
                //         url  : url
                //     });
                // }

                if(sectionSource.fields.length !== sectionTarget.fields.length) {
                    matches.sectionsFieldsCount = false;
                    addActionEntry({
                        text : 'The number of fields in section <b>' + sectionTarget.name + '</b> does not match',
                        step : step,
                        url  : url
                    });
                }

                for(let sourceMatrix of sectionSource.matrices) {

                    sourceMatrix.hasMatch = false;
                    let matrixMatch = true;

                    for(let targetMatrix of sectionTarget.matrices) {

                        if(JSON.stringify(sourceMatrix.columnNames) === JSON.stringify(targetMatrix.columnNames)) {
                            if(JSON.stringify(sourceMatrix.rowNames) === JSON.stringify(targetMatrix.rowNames)) {
                                
                                sourceMatrix.hasMatch = true;
                                targetMatrix.hasMatch = true;                                   

                                if(sourceMatrix.fields.length === sourceMatrix.fields.length) {

                                    for(let iRow = 0; iRow < sourceMatrix.fields.length; iRow++) {
                                        if(sourceMatrix.fields[iRow].length === sourceMatrix.fields[iRow].length) {
                                            for(let iCol = 0; iCol < sourceMatrix.fields[iRow].length; iCol++) {

                                                if(sourceMatrix.fields[iRow][iCol] === null) {
                                                    if(targetMatrix.fields[iRow][iCol] !== null) {
                                                        matrixMatch = false;
                                                        break;
                                                    }
                                                } else if(targetMatrix.fields[iRow][iCol] === null) {
                                                    matrixMatch = false;
                                                    break;
                                                } else {
                                                    let sourceId = sourceMatrix.fields[iRow][iCol].link.split('/').pop();
                                                    let targetId = targetMatrix.fields[iRow][iCol].link.split('/').pop();

                                                    if(sourceId !== targetId) {
                                                        matrixMatch = false;
                                                        break;
                                                    }
                                                }

                                            }
                                        }
                                    }

                                }
                            }
                        }
                    }

                    if(!sourceMatrix.hasMatch) {
                        matches.sectionsMatrixes = false;
                        addActionEntry({
                            text : 'Add matrix with columns <b>' + sourceMatrix.columnNames + '</b> in section <b>' + sectionSource.name + '</b>',
                            step : step,
                            url  : url
                        });
                    } else if(!matrixMatch) {
                        matches.sectionsMatrixes = false;
                        addActionEntry({
                            text : 'Fields of matrix with columns <b>' + sourceMatrix.columnNames + '</b> in section <b>' + sectionSource.name + '</b> do not match',
                            step : step,
                            url  : url
                        });
                    }

                }

                break;

            }

        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + 'Section ' + sectionSource.name + ' is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({
                text : 'Add section <b>' + sectionSource.name + '</b>',
                step : step,
                url  : url
            });
        }

    }

    for(let sectionTarget of sectionsTarget) {
        if(!sectionTarget.hasMatch) {
            matches.sectionsExtra = true; 
            addActionEntry({
                text : 'Remove section <b>' + sectionTarget.name + '</b> in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }
        for(let matrixTarget of sectionTarget.matrices) {
            if(!matrixTarget.hasMatch) {
                matches.sectionsMatrixes = false;
                addActionEntry({
                    text : 'Remove matrix with columns <b>' + matrixTarget.columnNames + '</b> in section <b>' + sectionTarget.name + '</b>',
                    step : step,
                    url  : url
                });
            }
        }
    }

    for(let fieldTarget of fieldsTarget) {

        fieldTarget.hasMatch = false;
        fieldTarget.valMatch = false;
        fieldTarget.id       = fieldTarget.__self__.split('/').pop();
        fieldTarget.label    = '<b>' + fieldTarget.name + ' (' + fieldTarget.id + ')</b>';

        if(isBlank(fieldTarget.fieldValidators)) {
            fieldTarget.fieldValidators = [];
        } else {
            for(let validation of fieldTarget.fieldValidators) validation.hasMatch = false;
        } 

        if(!isBlank(fieldTarget.defaultValue)) {
            if(typeof fieldTarget.defaultValue === 'object') {
                fieldTarget.defaultValue = fieldTarget.defaultValue.title;
            }
        }

    }

    for(let fieldSource of fieldsSource) {

        if(!isBlank(fieldSource.type)) {

            let hasMatch    = false;
            let reportMatch = false;
            let id          = fieldSource.__self__.split('/').pop();

            if(!isBlank(fieldSource.defaultValue)) {
                if(typeof fieldSource.defaultValue === 'object') {
                    fieldSource.defaultValue = fieldSource.defaultValue.title;
                }
            }
            
            for(let fieldTarget of fieldsTarget) {

                if(!isBlank(fieldSource.type)) {

                    if(id === fieldTarget.id) {
                        
                        hasMatch             = true;
                        fieldTarget.hasMatch = true;
                        reportMatch          = true;

                        if(fieldSource.name !== fieldTarget.name) {
                            matches.fieldsNames = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Change name of field ' + fieldTarget.label + ' to <b>' + fieldSource.name + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.description !== fieldTarget.description) {
                            matches.fieldsDescriptions = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Change description of field ' + fieldTarget.label + ' to <b>' + fieldSource.description + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.type.title !== fieldTarget.type.title) {
                            matches.fieldsTypes = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Change field type of ' + fieldTarget.label + ' to <b>' + fieldSource.type.title + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.visibleOnPreview !== fieldTarget.visibleOnPreview) {
                            matches.fieldsPreview = false;
                            reportMatch = false;
                            let label = (fieldSource.visibleOnPreview) ? 'Enable' : 'Disable'
                            addActionEntry({
                                text : label + ' visibility on preview for field ' + fieldTarget.label,
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.unitOfMeasure !== fieldTarget.unitOfMeasure) {
                            matches.fieldsUoM = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Set UOM of ' + fieldTarget.label + ' to <b>' + fieldSource.unitOfMeasure + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.picklist !== fieldTarget.picklist) {
                            matches.fieldsPicklists = false;
                            reportMatch             = false;
                            let text                = '';
                            if(isBlank(fieldSource.picklist)) {
                                text = 'Field ' + fieldTarget.label + ' should not use a picklist';
                            } else {
                                text = 'Field ' + fieldTarget.label + ' should use picklist <b>' + getPicklistLabel(fieldSource.picklist, environments.source.picklists) + '</b>';
                            }
                            addActionEntry({
                                text : text,
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.fieldLength !== fieldTarget.fieldLength) {
                            matches.fieldsLength = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Set field length of ' + fieldTarget.label + ' to <b>' + fieldSource.fieldLength + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.displayLength !== fieldTarget.displayLength) {
                            matches.fieldsDisplay = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Set display width of ' + fieldTarget.label + ' to <b>' + fieldSource.displayLength + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.visibility !== fieldTarget.visibility) {
                            matches.fieldsVisibility = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Set visibility of ' + fieldTarget.label + ' to <b>' + fieldSource.visibility + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.editability !== fieldTarget.editability) {
                            matches.fieldsEditability = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Set editability of ' + fieldTarget.label + ' to ' + getFieldEditabilityLabel(fieldSource.editability),
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.defaultValue !== fieldTarget.defaultValue) {
                            matches.fieldsDefaults = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Set default value of ' + fieldTarget.label + ' to <b>' + fieldSource.defaultValue + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.formulaField !== fieldTarget.formulaField) {
                            matches.fieldsFormulas = false;
                            reportMatch = false;
                            let label = (fieldSource.formulaField) ? ' ' : ' not ';
                            addActionEntry({
                                text : fieldTarget.label + ' must' + label + 'be a computed field',
                                step : step,
                                url  : url
                            });
                        } else if(fieldSource.formulaField) {
                            addActionEntry({
                                text : 'Review formula of field ' + fieldTarget.label + ' in section <b>' + fieldSource.section + '</b> as it cannot be compared automatically',
                                step : step,
                                url  : url
                            });                                
                        }          
                            
                        let matchValidations = getFieldValidationsMatch(matches, fieldSource, fieldTarget, step, url);                           

                        if(!matchValidations) reportMatch = false;

                        if(fieldSource.section !== fieldTarget.section) {
                            matches.fieldsSections = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Move field ' + fieldTarget.label + ' to section <b>' + fieldSource.section + '</b>',
                                step : step,
                                url  : url
                            });
                        } else if(fieldSource.index !== fieldTarget.index) {
                            matches.fieldsOrder = false;
                            reportMatch = false;
                            addActionEntry({
                                text : 'Field ' + fieldTarget.label + ' is at position <b>' + fieldTarget.index + '</b> but should be at <b>' + fieldSource.index + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                    }
                }
            }

            if(!hasMatch) {
                matches.all = false;
                addLogEntry(logPrefix + 'Field ' + fieldSource.name + ' (' + id + ') is not available in ' + environments.target.tenantName, 'diff');
                addActionEntry({
                    text : 'Add field <b>' + fieldSource.name + ' (' + id + ')</b> to section <b>' + fieldSource.section + '</b> in ' + environments.target.tenantName,
                    step : step,
                    url  : url
                });
            }

            if(!isBlank(fieldSource.picklist)) {
                if(!environments.picklists.includes(fieldSource.picklist)) environments.picklists.push(fieldSource.picklist);
            }

            addReportDetail(fieldSource.section, fieldSource.name, reportMatch);

        }

    }

    for(let fieldTarget of fieldsTarget) {
        if(!isBlank(fieldTarget.type)) {
            if(!fieldTarget.hasMatch) {
                matches.fieldsExtra = true; 
                addActionEntry({
                    text : 'Remove field ' + fieldTarget.label + ' in ' + environments.target.tenantName,
                    step : step,
                    url  : url
                });
            }
        }
    }

    if(!matches.sectionsDescriptions) { matches.all = false; addLogEntry(logPrefix + 'Descriptions of sections do not match', 'diff');}
    if(!matches.sectionsOrder)        { matches.all = false; addLogEntry(logPrefix + 'The display order of sections does not match', 'diff');}
    if(!matches.sectionsCollapsed)    { matches.all = false; addLogEntry(logPrefix + 'The collapsed option does not match for all sections', 'diff');}
    if(!matches.sectionsLocked)       { matches.all = false; addLogEntry(logPrefix + 'The Workflow Locking option does not match for all sections');}
    if(!matches.sectionsFieldsCount)  { matches.all = false; addLogEntry(logPrefix + 'The number of fields within the sections does not matach', 'diff');}
    if(!matches.sectionsMatrixes)     { matches.all = false; addLogEntry(logPrefix + 'The matrixes in the sections do not match', 'diff');}
    if( matches.sectionsExtra)        { matches.all = false; addLogEntry(logPrefix + 'There are additional sections in ' + environments.target.tenantName, 'diff');}

    if(!matches.fieldsNames)              { matches.all = false; addLogEntry(logPrefix + 'Field names do not match', 'diff');}
    if(!matches.fieldsDescriptions)       { matches.all = false; addLogEntry(logPrefix + 'Field descriptions do not match', 'diff');}
    if(!matches.fieldsTypes)              { matches.all = false; addLogEntry(logPrefix + 'Field Types do not match', 'diff');}
    if(!matches.fieldsPreview)            { matches.all = false; addLogEntry(logPrefix + 'Field visibility in preview does not match', 'diff');}
    if(!matches.fieldsUoM)                { matches.all = false; addLogEntry(logPrefix + 'Field units of measures do not match', 'diff');}
    if(!matches.fieldsPicklists)          { matches.all = false; addLogEntry(logPrefix + 'Field picklist settings do not match', 'diff');}
    if(!matches.fieldsLength)             { matches.all = false; addLogEntry(logPrefix + 'Field Length do not match', 'diff');}
    if(!matches.fieldsDisplay)            { matches.all = false; addLogEntry(logPrefix + 'Field Display Widths do not match', 'diff');}
    if(!matches.fieldsVisibility)         { matches.all = false; addLogEntry(logPrefix + 'Field visibility settings do not match', 'diff');}
    if(!matches.fieldsEditability)        { matches.all = false; addLogEntry(logPrefix + 'Field editability settings do not match', 'diff');}
    if(!matches.fieldsDefaults)           { matches.all = false; addLogEntry(logPrefix + 'Field default values do not match', 'diff');}
    if(!matches.fieldsFormulas)           { matches.all = false; addLogEntry(logPrefix + 'Computed fields definition does not match', 'diff');}
    if(!matches.fieldsValidations)        { matches.all = false; addLogEntry(logPrefix + 'Field validations do not match', 'diff');}
    if(!matches.fieldsValidationSettings) { matches.all = false; addLogEntry(logPrefix + 'Field validation variables do not match', 'diff');}
    if(!matches.fieldsSections)           { matches.all = false; addLogEntry(logPrefix + 'Fields are in different sections', 'diff');}
    if(!matches.fieldsOrder)              { matches.all = false; addLogEntry(logPrefix + 'Fields display order does not match', 'diff');}
    if( matches.fieldsExtra)              { matches.all = false; addLogEntry(logPrefix + 'There are additional fields in ' + environments.target.tenantName, 'diff');}

    return matches;

}
function getFieldValidationsMatch(matches, fieldSource, fieldTarget, step, url) {

    if(isBlank(fieldSource.fieldValidators)) return true;

    if(fieldSource.fieldValidators.length === 0) {
        if(fieldTarget.fieldValidators.length === 0) {
            return true;
        }
    }

    let result = true;

    for(let target of fieldTarget.fieldValidators) target.hasMatch = false;

    for(let source of fieldSource.fieldValidators) {

        source.hasMatch = false;

        for(let target of fieldTarget.fieldValidators) {
                
            if(source.validatorName === target.validatorName) {

                source.hasMatch = true;
                target.hasMatch = true;

                if(JSON.stringify(source.variables) !== JSON.stringify(target.variables)) {
                    matches.fieldsValidationSettingss = false;
                    addActionEntry({
                        text : 'Variables of validation ' + getFieldValidationLabel(source.validatorName) +  ' of field ' + fieldTarget.label + ' do not match',
                        step : step,
                        url  : url
                    });
                }

            }

        }

        if(!source.hasMatch) {
            result = false;
            matches.fieldsValidations = false;
            addActionEntry({
                text : 'Add validation ' + getFieldValidationLabel(source.validatorName) + ' to field ' + fieldTarget.label,
                step : step,
                url  : url
            });
        }

    }

    for(let target of fieldTarget.fieldValidators) {
        if(!target.hasMatch) {
            matches.fieldsValidationSettingss = false;
            result = false;
            addActionEntry({
                text : 'Remove validation ' + getFieldValidationLabel(target.validatorName) +  ' from field ' + fieldTarget.label,
                step : step,
                url  : url
            });
        }
    }

    return result;

}
function getFieldValidationLabel(validatorName) {

    let result = validatorName;

    switch(validatorName) {

        case 'bothOrNone'               : result = 'Both Or None'; break;
        case 'conditionallyRequired'    : result = 'Conditionally Required'; break;
        case 'date'                     : result = 'Date'; break;
        case 'dateAfter'                : result = 'Date Greater Than'; break;
        case 'dateBefore'               : result = 'Date Less Than'; break;
        case 'dateNotAfter'             : result = 'Date Less Than Or Equal To'; break;
        case 'dateNotBefore'            : result = 'Date Greater Than Or Equal To'; break;
        case 'dropDownSelection'        : result = 'Selection Required'; break;
        case 'identical'                : result = 'Identical'; break;
        case 'oneOfTheeNotMore'         : result = 'One Of Three Not More'; break;
        case 'oneOrTheOtherNotBoth'     : result = 'One Or The Other, Not Both'; break;
        case 'unique'                   : result = 'Unique'; break;
        case 'uniqueStrict'             : result = 'Unique (Strict)'; break;
        case 'required'                 : result = 'Required'; break;

    }

    return '<b>' + result + '</b>';

}
function getPicklistLabel(link, picklists) {

    let id = link.split('/').pop();

    for(let picklist of picklists) {
        if(picklist.id === id) {
            return picklist.name + ' (' + id + ')';
        }
    }

    return '';

}
function getFieldEditabilityLabel(value) {

    let result = 'True';

    switch(value) {

        case 'NEVER': result = 'False'; break;
        case 'CREATE_ONLY': result = 'Creation Only'; break;

    }

    return '<b>' + result + '</b>';

}


// STEP #5
function compareGridTab() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Grid Tab comparison', 'head');
    addReportHeader('icon-table', 'Grid Tab Fields');

    let requests = [
        $.get('/plm/grid-columns', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/grid-columns', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let gridSource = (responses[0].data === '') ? [] : responses[0].data.fields;
        let gridTarget = (responses[1].data === '') ? [] : responses[1].data.fields;
        let matches    = getGridMatch(gridSource, gridTarget);

        $('#summary-grid').html('Fields : ' + gridSource.length);

        if(matches.all) {
            addLogEntry('Workspace grid fields match', 'match');
            $('#result-grid').addClass('match');
        } else {
            addLogEntry('Workspace grid fields do not match', 'diff');
            $('#result-grid').addClass('diff');
        }

        $('#result-grid').find('.result-compare').show();

        compareManagedItemsTab();

    });

}
function getGridMatch(gridSource, gridTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url  = '/admin#section=setuphome&tab=workspaces&item=grid&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22G%22}';
    let step = 'grid';

    let matches         = {
        all             : true,
        names           : true,
        titles          : true,
        picklists       : true,
        fieldLengths    : true,
        displayLengths  : true,
        visibility      : true,
        editability     : true,
        defaultValues   : true,
        order           : true,
        count           : true
    }

    let index = 1;

    for(let colTarget of gridTarget) {
        colTarget.hasMatch = false;
        colTarget.fieldId  = colTarget.__self__.split('/').pop();
        colTarget.label    = '<b>' + colTarget.name + ' (' + colTarget.fieldId + ')</b>';
        colTarget.index    = index++;
    }

    index = 0;

    for(let colSource of gridSource) {

        let hasMatch    = false;
        let reportMatch = false;
        let fieldId     = colSource.__self__.split('/').pop();

        index++;

        for(let colTarget of gridTarget) {

            if(fieldId === colTarget.fieldId) {
                
                hasMatch           = true;
                reportMatch        = true;
                colTarget.hasMatch = true;

                getDefaultFieldValue(colSource);
                getDefaultFieldValue(colTarget);

                if(colSource.name !== colTarget.name) {
                    matches.names = false;
                    reportMatch   = false;
                    addActionEntry({
                        text : 'Rename grid field ' + colTarget.label + ' to <b>' + colSource.name + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(colSource.type.title !== colTarget.type.title) {
                    matches.titles = false;
                    reportMatch    = false;
                    addActionEntry({
                        text : 'Change type of grid field ' + colTarget.label + ' to <b>' + colSource.type.title + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(colSource.picklist !== colTarget.picklist) {
                    matches.picklists = false;
                    reportMatch       = false;
                    let text          = '';
                    if(isBlank(colSource.picklist)) {
                        text = 'Field ' + colTarget.label + ' should not use a picklist';
                    } else {
                        text = 'Field ' + colTarget.label + ' should use picklist <b>' + getPicklistLabel(colSource.picklist, environments.source.picklists) + '</b>';
                    }
                    addActionEntry({
                        text : text,
                        step : step,
                        url  : url
                    });
                }

                if(colSource.fieldLength !== colTarget.fieldLength) {
                    matches.fieldLengths = false;
                    reportMatch          = false;
                    addActionEntry({
                        text : 'Change field length of grid field ' + colTarget.label + ' to <b>' + colSource.fieldLength + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(colSource.displayLength !== colTarget.displayLength) {
                    matches.displayLengths = false;
                    reportMatch            = false;
                    addActionEntry({
                        text : 'Change display length of grid field ' + colTarget.label + ' to <b>' + colSource.displayLength + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(colSource.visibility !== colTarget.visibility) {
                    matches.visibility = false;
                    reportMatch        = false;
                    addActionEntry({
                        text : 'Change visibility of grid field ' + colTarget.label + ' to <b>' + colSource.visibility + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(colSource.editability !== colTarget.editability) {
                    matches.editability = false;
                    reportMatch         = false;
                    addActionEntry({
                        text : 'Change editability of grid field ' + colTarget.label + ' to ' + getFieldEditabilityLabel(colSource.editability),
                        step : step,
                        url  : url
                    });
                }

                if(colSource.defaultValue !== colTarget.defaultValue) {
                    matches.defaultValues = false;
                    reportMatch           = false;
                    addActionEntry({
                        text : 'Change default value of grid field ' + colTarget.label + ' to <b>' + colSource.defaultValue + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(index !== colTarget.index) {
                    matches.order = false;
                    reportMatch   = false;
                    addActionEntry({
                        text : 'Field ' + colTarget.label + ' is at position <b>' + colTarget.index + '</b> but should be at <b>' + index + '</b>',
                        step : step,
                        url  : url
                    });
                }

                break;

            }

        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + 'Grid field ' + colSource.name + ' is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({
                text : 'Add grid field <b>' + fieldId + '</b> with label <b>' + colSource.name + '</b>',
                step : step,
                url  : url
            });
        }

        if(!isBlank(colSource.picklist)) {
            if(!environments.picklists.includes(colSource.picklist)) environments.picklists.push(colSource.picklist);
        }

        addReportDetail(fieldId, colSource.name, reportMatch);

    }

    for(let colTarget of gridTarget) {
        if(!colTarget.hasMatch) {
            matches.count = false; 
            addActionEntry({
                text : 'Remove grid field ' + colTarget.label + '  in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }
    }

    if(!matches.names)          { matches.all = false; addLogEntry(logPrefix + 'Grid field names do not match', 'diff');}
    if(!matches.titles)         { matches.all = false; addLogEntry(logPrefix + 'Grid field titles do not match', 'diff');}
    if(!matches.picklists)      { matches.all = false; addLogEntry(logPrefix + 'Grid field picklists do not match', 'diff');}
    if(!matches.fieldLengths)   { matches.all = false; addLogEntry(logPrefix + 'Grid field lengths do not match', 'diff');}
    if(!matches.displayLengths) { matches.all = false; addLogEntry(logPrefix + 'Grid field display lengths do not match', 'diff');}
    if(!matches.visibility)     { matches.all = false; addLogEntry(logPrefix + 'Grid field visibility does not match', 'diff');}
    if(!matches.editability)    { matches.all = false; addLogEntry(logPrefix + 'Grid field editability does not match', 'diff');}
    if(!matches.defaultValues)  { matches.all = false; addLogEntry(logPrefix + 'Grid field default values do not match', 'diff');}
    if(!matches.order)          { matches.all = false; addLogEntry(logPrefix + 'Grid fields order does not match', 'diff');}
    if(!matches.count)          { matches.all = false; addLogEntry(logPrefix + 'Grid has additional fields', 'diff');}

    return matches;

}
function getDefaultFieldValue(field) {

    if(typeof field.defaultValue === 'undefined') field.defaultValue = '';
    else if(field.defaultValue === null) field.defaultValue = '';
    else if(typeof field.defaultValue === 'string') field.defaultValue = field.defaultValue;
    else if(typeof field.defaultValue === 'object') field.defaultValue = field.defaultValue.title;

}


// STEP #6
function compareManagedItemsTab() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Managed Items Tab comparison', 'head');
    addReportHeader('icon-rules', 'Managed Items Tab Fields');

    let requests = [
        $.get('/plm/managed-fields', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/managed-fields', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let fieldsSource  = (responses[0].data === '') ? [] : responses[0].data;
        let fieldsTarget  = (responses[1].data === '') ? [] : responses[1].data;
        let matches       = getManagedItemsMatch(fieldsSource, fieldsTarget);

        $('#summary-managed').html('Fields : ' + fieldsSource.length);

        if(matches.all) {
            addLogEntry('Managed Items tab fields match', 'match');
            $('#result-managed').addClass('match');
        } else {
            addLogEntry('Managed Items tab fields do not match', 'diff');
            $('#result-managed').addClass('diff');
        }
        
        $('#result-managed').find('.result-compare').show();   

        compareBOMTab();

    });

}
function getManagedItemsMatch(fieldsSource, fieldsTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url     = '/admin#section=setuphome&tab=workspaces&item=workflowitems&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22L%22}';
    let step    = 'managed';
    let matches = {
        all          : true,
        names        : true,
        descriptions : true,
        types        : true,
        preview      : true,
        uom          : true,
        picklists    : true,
        length       : true,
        display      : true,
        visibility   : true,
        editability  : true,
        default      : true,
        order        : true,
        extra        : false
    }

    let index = 1;

    for(let target of fieldsTarget) {
        target.hasMatch = false;
        target.id       = target.__self__.split('/').pop();
        target.label    = '<b>' + target.name + ' (' + target.id + ')</b>';
        target.index    = index++;
    }

    index = 0;

    for(let fieldSource of fieldsSource) {

        let hasMatch    = false;
        let reportMatch = false;
        let id          = fieldSource.__self__.split('/').pop();

        index ++;
        
        for(let fieldTarget of fieldsTarget) {

            if(id === fieldTarget.id) {
                    
                hasMatch             = true;
                reportMatch          = true;
                fieldTarget.hasMatch = true;

                if(fieldSource.name !== fieldTarget.name) {
                    matches.names = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Change name of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.name + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.description !== fieldTarget.description) {
                    matches.descriptions = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Change description of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.description + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.type.title !== fieldTarget.type.title) {
                    matches.types = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Change type of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.type.title + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.visibleOnPreview !== fieldTarget.visibleOnPreview) {
                    matches.preview = false;
                    reportMatch = false;
                    let label = (fieldSource.visibleOnPreview) ? 'Enable' : 'Disable'
                    addActionEntry({
                        text : label + ' visibility on preview for Managed Items field ' + fieldTarget.label,
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.unitOfMeasure !== fieldTarget.unitOfMeasure) {
                    matches.uom = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Set UOM of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.unitOfMeasure + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.picklist !== fieldTarget.picklist) {
                    matches.picklists = false;
                    reportMatch       = false;
                    let text          = '';
                    if(isBlank(fieldSource.picklist)) {
                        text = 'Field ' + fieldTarget.label + ' should not use a picklist';
                    } else {
                        text = 'Field ' + fieldTarget.label + ' should use picklist <b>' + getPicklistLabel(fieldSource.picklist, environments.source.picklists) + '</b>';
                    }
                    addActionEntry({
                        text : text,
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.fieldLength !== fieldTarget.fieldLength) {
                    matches.length = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Set Managed Items field length of ' + fieldTarget.label + ' to <b>' + fieldSource.fieldLength + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.displayLength !== fieldTarget.displayLength) {
                    matches.display = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Set display width of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.displayLength + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.visibility !== fieldTarget.visibility) {
                    matches.visibility = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Set visibility of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.visibility + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.editability !== fieldTarget.editability) {
                    matches.editability = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Set editability of Managed Items field ' + fieldTarget.label + ' to ' + getFieldEditabilityLabel(fieldSource.editability),
                        step : step,
                        url  : url
                    });
                }

                if(fieldSource.defaultValue !== fieldTarget.defaultValue) {
                    matches.default = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Set default value of Managed Items field ' + fieldTarget.label + ' to <b>' + fieldSource.defaultValue + '</b>',
                        step : step,
                        url  : url
                    });
                }

                if(index !== fieldTarget.index) {
                    matches.order = false;
                    reportMatch = false;
                    addActionEntry({
                        text : 'Field ' + fieldTarget.label + ' is at position <b>' + fieldTarget.index + '</b> but should be at <b>' + index + '</b>',
                        step : step,
                        url  : url
                    });
                }

            }
        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + 'Field ' + fieldSource.name + ' (' + id + ') is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({
                text : 'Add Managed Items field <b>' + fieldSource.name + ' (' + id + ')</b> in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }

        if(!isBlank(fieldSource.picklist)) {
            if(!environments.picklists.includes(fieldSource.picklist)) environments.picklists.push(fieldSource.picklist);
        }

        addReportDetail(id, fieldSource.name, reportMatch);

    }

    for(let fieldTarget of fieldsTarget) {
        if(!fieldTarget.hasMatch) {
            matches.extra = true; 
            addActionEntry({
                text : 'Remove field ' + fieldTarget.label + ' in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }
    }    

    if(!matches.names)        { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field names do not match', 'diff');}
    if(!matches.descriptions) { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field descriptions do not match', 'diff');}
    if(!matches.types)        { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field Types do not match', 'diff');}
    if(!matches.preview)      { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field visibility in preview does not match', 'diff');}
    if(!matches.uom)          { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field units of measures do not match', 'diff');}
    if(!matches.picklists)    { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field picklists do not match', 'diff');}
    if(!matches.length)       { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field Length do not match', 'diff');}
    if(!matches.display)      { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field Display Widths do not match', 'diff');}
    if(!matches.visibility)   { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field visibility settings do not match', 'diff');}
    if(!matches.editability)  { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field editability settings do not match', 'diff');}
    if(!matches.default)      { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab field default values do not match', 'diff');}
    if(!matches.order)        { matches.all = false; addLogEntry(logPrefix + 'Managed Items tab fields display order does not match', 'diff');}
    if( matches.extra)        { matches.all = false; addLogEntry(logPrefix + 'There are additional Managed Items tab fields in ' + environments.target.tenantName, 'diff');}

    return matches;

}


// STEP #7
function compareBOMTab() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Bill of Materials Tab comparison', 'head');

    let requests = [
        $.get('/plm/bom-views-and-fields', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/bom-views-and-fields', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let viewsSource = (responses[0].data === '') ? [] : responses[0].data;
        let viewsTarget = (responses[1].data === '') ? [] : responses[1].data;
        let matches     = getBOMTabMatch(viewsSource, viewsTarget);

        $('#summary-bom').html('BOM Views : ' + viewsSource.length + ' / BOM Fields : ' + matches.fieldsCount);

        if(matches.all) {
            addLogEntry('Bill of Materials view and fields match', 'match');
            $('#result-bom').addClass('match');
        } else {
            addLogEntry('Bill of Materials view and fields do not match', 'diff');
            $('#result-bom').addClass('diff');
        }

        $('#result-bom').find('.result-compare').show();

        compareWorkspaceRelationships();

    });

}
function getBOMTabMatch(viewsSource, viewsTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url           = '/admin#section=setuphome&tab=workspaces&item=bom&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22B%22}';
    let step          = 'bom';
    let fieldsTarget  = [];
    let fieldsSource  = [];
    let matches       = {
        all               : true,
        viewsDefault      : true,
        viewsFields       : true,
        viewsExtra        : false,
        fieldsNames       : true,
        fieldsUoM         : true,
        fieldsPicklist    : true,
        fieldsLength      : true,
        fieldsDisplay     : true,
        fieldsVisibility  : true,
        fieldsEditability : true,
        fieldsDefault     : true,
        fieldsFormula     : true,
        fieldsViews       : true,
        fieldsExtra       : false,
        fieldsViewsExtra  : false,
        fieldsCount       : 0
    }

    for(let viewTarget of viewsTarget) {
        viewTarget.hasMatch = false;
        for(let viewField of viewTarget.fields) {
            let fieldMatch = false;
            for(let targetField of fieldsTarget) {
                if(targetField.fieldTab === viewField.fieldTab) {
                    if(targetField.fieldId === viewField.fieldId) {
                        fieldMatch = true;
                        targetField.views.push({ name : viewTarget.name, order : viewField.displayOrder, displayName : viewField.displayName, hasMatch : false });
                        break;
                    }
                }
            }
            if(!fieldMatch) {
                viewField.views    = [{ name : viewTarget.name, order : viewField.displayOrder, displayName : viewField.displayName, hasMatch : false }];
                viewField.label    = '<b>' + viewField.name + ' (id:' + viewField.fieldId + ', source: ' + viewField.fieldTab +  ')</b>';
                viewField.hasMatch = false;
                fieldsTarget.push(viewField);
            }
        }
    }

    addReportHeader('icon-bom', 'Bill of Materials Views');

    for(let viewSource of viewsSource) {

        let hasMatch    = false;
        let reportMatch = false;

        for(let viewTarget of viewsTarget) {

            if(viewSource.name === viewTarget.name) {
                
                hasMatch            = true;
                viewTarget.hasMatch = true;
                reportMatch         = true;

                if(viewSource.isDefault !== viewTarget.isDefault) {
                    matches.viewsDefault = false;
                    addActionEntry({
                        text : 'Set BOM view <b>' + viewSource.name + '</b> as default view',
                        step : step,
                        url  : url
                    });
                }

                if(viewSource.fields.length !== viewTarget.fields.length) {
                    matches.viewsFields = false;
                    addActionEntry({
                        text : 'The number of fields in BOM view <b>' + viewSource.name + '</b> does not match',
                        step : step,
                        url  : url
                    });
                }

                break;

            }

        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + 'BOM view ' + viewSource.name + ' is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({
                text : 'Add BOM view <b>' + viewSource.name + '</b>',
                step : step,
                url  : url
            });
        }

        for(let viewField of viewSource.fields) {
            let fieldMatch = false;
            for(let sourceField of fieldsSource) {
                if(sourceField.fieldId === viewField.fieldId) {
                    fieldMatch = true;
                    sourceField.views.push({ name : viewSource.name, order : viewField.displayOrder, displayName : viewField.displayName });
                    break;
                }
            }
            if(!fieldMatch) {
                viewField.views    = [{ name : viewSource.name, order : viewField.displayOrder, displayName : viewField.displayName }];
                viewField.label    = '<b>' + viewField.name + ' (' + viewField.fieldId + ')</b>';
                viewField.hasMatch = false;
                fieldsSource.push(viewField);
            }

        }

        addReportDetail(viewSource.name, viewSource.fields.length + ' fields', reportMatch);

    }

    for(let viewTarget of viewsTarget) {
        if(!viewTarget.hasMatch) {
            matches.viewsExtra = true; 
            addActionEntry({
                text : 'Remove BOM view <b>' + viewTarget.name + '</b> in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }
    }

    for(let fieldSource of fieldsSource) {

        let hasMatch   = false;
        let isBOMField = (typeof fieldSource.visibleOnPreview) === 'undefined';
        
        for(let fieldTarget of fieldsTarget) {

            if(fieldSource.fieldTab === fieldTarget.fieldTab) {
                if(fieldSource.fieldId === fieldTarget.fieldId) {
                        
                    hasMatch             = true;
                    fieldTarget.hasMatch = true;

                    if(isBOMField) {

                        matches.fieldsCount++;

                        if(fieldSource.name !== fieldTarget.name) {
                            matches.fieldsNames = false;
                            addActionEntry({
                                text : 'Change name of BOM field ' + fieldTarget.label + ' to <b>' + fieldSource.name + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.unitOfMeasure !== fieldTarget.unitOfMeasure) {
                            matches.fieldsUoM = false;
                            addActionEntry({
                                text : 'Set UOM of BOM field ' + fieldTarget.label + ' to <b>' + fieldSource.unitOfMeasure + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.lookups !== fieldTarget.lookups) {
                            matches.fieldsPicklist = false;
                            reportMatch       = false;
                            let text          = '';
                            if(isBlank(fieldSource.lookups)) {
                                text = 'Field ' + fieldTarget.label + ' should not use a picklist';
                            } else {
                                text = 'Field ' + fieldTarget.label + ' should use picklist <b>' + getPicklistLabel(fieldSource.lookups, environments.source.picklists) + '</b>';
                            }
                            addActionEntry({
                                text : text,
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.fieldLength !== fieldTarget.fieldLength) {
                            matches.fieldsLength = false;
                            addActionEntry({
                                text : 'Set BOM field length of ' + fieldTarget.label + ' to <b>' + fieldSource.fieldLength + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.displayLength !== fieldTarget.displayLength) {
                            matches.fieldsDisplay = false;
                            addActionEntry({
                                text : 'Set display width of BOM field ' + fieldTarget.label + ' to <b>' + fieldSource.displayLength + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.visibility !== fieldTarget.visibility) {
                            matches.fieldsVisibility = false;
                            addActionEntry({
                                text : 'Set visibility of BOM field ' + fieldTarget.label + ' to <b>' + fieldSource.visibility + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.editability !== fieldTarget.editability) {
                            matches.fieldsEditability = false;
                            addActionEntry({
                                text : 'Set editability of BOM field ' + fieldTarget.label + ' to ' + getFieldEditabilityLabel(fieldSource.editability),
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.defaultValue !== fieldTarget.defaultValue) {
                            matches.fieldsDefault = false;
                            addActionEntry({
                                text : 'Set default value of ' + fieldTarget.label + ' to <b>' + fieldSource.defaultValue + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                        if(fieldSource.formulaField !== fieldTarget.formulaField) {
                            matches.fieldsFormula = false;
                            let label = (fieldSource.formulaField) ? ' ' : ' not ';
                            addActionEntry({
                                text : fieldTarget.label + ' must' + label + 'be a computed field',
                                step : step,
                                url  : url
                            });
                        }    

                    }

                    for(let sourceFieldView of fieldSource.views) {

                        let included = false;

                        for(targetFieldView of fieldTarget.views) {

                            if(sourceFieldView.name === targetFieldView.name) {

                                included                 = true;
                                targetFieldView.hasMatch = true;

                                if(sourceFieldView.displayName !== targetFieldView.displayName) {
                                    matches.fieldsViews = false;
                                    addActionEntry({
                                        text : 'Change Display Name of ' + fieldTarget.label + ' to <b>' + sourceFieldView.displayName + '</b>',
                                        step : step,
                                        url  : url
                                    });
                                }

                                if(sourceFieldView.order !== targetFieldView.order) {
                                    matches.fieldsViews = false;
                                    addActionEntry({
                                        text : 'Move ' + fieldTarget.label + ' to position <b>' + (sourceFieldView.order) + '</b> in view <b>' + sourceFieldView.name + '</b>',
                                        step : step,
                                        url  : url
                                    });
                                }

                            }

                        }

                        if(!included) {
                            matches.fieldsViews = false;
                            addActionEntry({
                                text : 'Add field ' + fieldSource.label + ' to BOM view <b>' + sourceFieldView.name + '</b> at position <b>' + (sourceFieldView.order) + '</b>',
                                step : step,
                                url  : url
                            });
                        }

                    }
                }
            }
        }

        if(!hasMatch) {
            matches.all = false;
            let views = [];
            for(let view of fieldSource.views) views.push(view.name);
            addLogEntry(logPrefix + 'BOM field ' + fieldSource.label + ' is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({
                text : 'Add BOM field ' + fieldSource.label + ' in ' + environments.target.tenantName + ' to BOM view <b>' + views.toString() + '</b>',
                step : step,
                url  : url
            });
        }

        if(!isBlank(fieldSource.lookups)) {
            if(!environments.picklists.includes(fieldSource.lookups)) environments.picklists.push(fieldSource.lookups);
        }

    }

    for(let fieldTarget of fieldsTarget) {
        if(!fieldTarget.hasMatch) {
            matches.fieldsExtra = true; 
            addActionEntry({
                text : 'Remove BOM field ' + fieldTarget.label + ' in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        } else {
            for(let view of fieldTarget.views) {
                if(!view.hasMatch) {
                    matches.fieldsViewsExtra = true;
                    addActionEntry({
                        text : 'Remove BOM field ' + fieldTarget.label + ' from view <b>' + view.name + '</b>',
                        step : step,
                        url  : url
                    });
                }
            }
        }
    }    

    if(!matches.viewsDefault)      { matches.all = false; addLogEntry(logPrefix + 'Default Bill of Materials view does not match', 'diff'); }
    if(!matches.viewsFields)       { matches.all = false; addLogEntry(logPrefix + 'The number of fields does not match in all BOM views', 'diff'); }
    if( matches.viewsExtra)        { matches.all = false; addLogEntry(logPrefix + 'There are additional BOM views in ' + environments.target.tenantName, 'diff'); }
    if(!matches.fieldsNames)       { matches.all = false; addLogEntry(logPrefix + 'BOM fields names do not match', 'diff');}
    if(!matches.fieldsUoM)         { matches.all = false; addLogEntry(logPrefix + 'BOM fields units of measure do not match', 'diff');}
    if(!matches.fieldsPicklist)    { matches.all = false; addLogEntry(logPrefix + 'BOM fields picklists do not match', 'diff');}
    if(!matches.fieldsLength)      { matches.all = false; addLogEntry(logPrefix + 'BOM fields lengths do not match', 'diff');}
    if(!matches.fieldsDisplay)     { matches.all = false; addLogEntry(logPrefix + 'BOM fields display widths do not match', 'diff');}
    if(!matches.fieldsVisibility)  { matches.all = false; addLogEntry(logPrefix + 'BOM fields visibility settings do not match', 'diff');}
    if(!matches.fieldsEditability) { matches.all = false; addLogEntry(logPrefix + 'BOM fields editability settings do not match', 'diff');}
    if(!matches.fieldsDefault)     { matches.all = false; addLogEntry(logPrefix + 'BOM fields default values settings do not match', 'diff');}
    if(!matches.fieldsFormula)     { matches.all = false; addLogEntry(logPrefix + 'BOM fields computed fields do not match', 'diff');}
    if(!matches.fieldsViews)       { matches.all = false; addLogEntry(logPrefix + 'BOM views fields do not match', 'diff');}
    if( matches.fieldsExtra)       { matches.all = false; addLogEntry(logPrefix + 'There are additional BOM fields in ' + environments.target.tenantName, 'diff');}
    if( matches.fieldsViewsExtra)  { matches.all = false; addLogEntry(logPrefix + 'There are BOM views with additional BOM fields in ' + environments.target.tenantName, 'diff');}

    return matches;

}


// STEP #8
function compareWorkspaceRelationships() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Start Workspace Relationships comparison', 'head');
    addReportHeader('icon-link', 'Workspace Relationships');

    let requests = [
        $.get('/plm/workspace-all-relationships', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/workspace-all-relationships', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName }),            
    ]

    Promise.all(requests).then(function(responses) {

        let matches = getWorkspaceRelationshipsMatch(responses[0].data, responses[1].data);

        $('#summary-relationships').html('Relationships : ' + (responses[0].data.length));

        if(matches.all) {
            addLogEntry('Workspace relationships match', 'match');
            $('#result-relationships').addClass('match');
        } else {
            addLogEntry('Workspace relationships do not match', 'diff');
            $('#result-relationships').addClass('diff');
        }

        $('#result-relationships').find('.result-compare').show();

        comparePrintViews();

    });

}
function getWorkspaceRelationshipsMatch(relSource, relTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url     = '/admin#section=setuphome&tab=workspaces&item=relationship&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
    let step    = 'relationships';
    let matches = {
        all : true,
        rel : true,
        prj : true,
        bom : true,
        aff : true
    }

    for(let source of relSource) {
        
        let hasMatch = false;
        
        for(let target of relTarget) {
            if(source.title === target.title) hasMatch = true;
        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + source.tab + ' does not allow links to ' + source.title + ' in ' + environments.target.tenantName, 'diff');
            addActionEntry({ text : 'Enable relationships to workspace <b>' + source.title + '</b> in tab <b>' + source.tab + '</b>', step : step, url  : url });
        }

        addReportDetail(source.tab, source.title, hasMatch);

    }

    for(let target of relTarget) {
    
        let hasMatch = false;
    
        for(let source of relSource) {
            if(source.title === target.title) hasMatch = true;
        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + target.tab + ' must not allow links to ' + target.title + ' in ' + environments.target.tenantName, 'diff');
            addActionEntry({ text : 'Remove relationships to workspace <b>' + target.title + '</b> in tab <b>' + target.tab + '</b>', step : step, url  : url });
        }
        
    }

    if(!matches.rel) { matches.all = false; addLogEntry(logPrefix + 'Related workspaces in tab Relationships do not match', 'diff'); }
    if(!matches.prj) { matches.all = false; addLogEntry(logPrefix + 'Related workspaces in tab Project Management do not match', 'diff'); }
    if(!matches.aff) { matches.all = false; addLogEntry(logPrefix + 'Related workspaces in tab Managed Items do not match', 'diff'); }
    if(!matches.bom) { matches.all = false; addLogEntry(logPrefix + 'Related workspaces in tab Bill of Materials do not match', 'diff'); }

    return matches;

}


// STEP #9
function comparePrintViews() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Advanced Print Views comparison', 'head');
    addReportHeader('icon-printer', 'Advanced Print Views');

    let requests = [
        $.get('/plm/workspace-print-views', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/workspace-print-views', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let listSource  = (responses[0].data === '') ? [] : responses[0].data.links;
        let listTarget  = (responses[1].data === '') ? [] : responses[1].data.links;
        let matches     = getPrintViewsMatch(listSource, listTarget);

        $('#summary-print').html('Views : ' + listSource.length);

        if(matches.all) {
            addLogEntry('Advanced Print Views match', 'match');
            $('#result-print').addClass('match');
        } else {
            addLogEntry('Advanced Print Views do not match', 'diff');
            $('#result-print').addClass('diff');
        }

        $('#result-print').find('.result-compare').show();
        
        compareBehaviors();

    });

}
function getPrintViewsMatch(listSource, listTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url     = '/admin#section=setuphome&tab=workspaces&item=advancedPrintViewList&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
    let step    = 'print';
    let matches = {
        all     : true,
        hidden  : true,
        list    : true,
        extra   : false
    }

    for(let target of listTarget) target.hasMatch = false;

    for(let source of listSource) {

        let hasMatch    = false;
        let reportMatch = false;
        
        for(let target of listTarget) {

            if(source.title === target.title) {
                    
                hasMatch        = true;
                reportMatch     = true;
                target.hasMatch = true;

                if(source.hidden !== target.hidden) {
                    matches.hidden     = false;
                    reportMatch.hidden = false;
                    let label = (source.hidden) ? 'Hide' : 'Unhide';
                    addActionEntry({
                        text : label + ' advanced print view <b>' + source.title + '</b>',
                        step : step,
                        url  : url
                    });
                }

            }
        }

        if(!hasMatch) {
            matches.all = false;
            matches.list = false;
            addLogEntry(logPrefix + 'Advanced print view ' + source.title + ' is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({
                text : 'Add advanced print view <b>' + source.title + '</b> in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }

        addReportDetail('Print View', source.title, reportMatch);

    }

    for(let target of listTarget) {
        if(!target.hasMatch) {
            matches.extra = true; 
            addActionEntry({
                text : 'Remove advanced print view <b>' + target.label + '</b> in ' + environments.target.tenantName,
                step : step,
                url  : url
            });
        }
    }    


    if(!matches.hidden) { matches.all = false; addLogEntry(logPrefix + 'The visisbility setting of print views does not match', 'diff'); }
    if(!matches.list)   { matches.all = false; addLogEntry(logPrefix + 'There are print views missing in ' + environments.target.tenantName, 'diff'); }
    if( matches.extra)  { matches.all = false; addLogEntry(logPrefix + 'There are additional print views in ' + environments.target.tenantName, 'diff'); }

    return matches;

}


// STEP #10
function compareBehaviors() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Workspace Behaviors comparison', 'head');
    addReportHeader('icon-status', 'Behaviors');

    let requests = [
        $.get('/plm/workspace-scripts', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/workspace-scripts', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    environments.source.scripts = { create : null, edit : null, demand : [] };
    environments.target.scripts = { create : null, edit : null, demand : [] };

    environments.scripts = [];

    Promise.all(requests).then(function(responses) {

        let listSource  = responses[0].data.scripts;
        let listTarget  = responses[1].data.scripts;
        let matches     = getBehaviorsMatch(listSource, listTarget);
        let summary     = '';
        
        if(matches.countCreate > 0) summary += 'onCreate';
        if(matches.countEdit   > 0) summary += ' onEdit';
        
        summary += ' onDemand:' + matches.countDemand;

        $('#summary-behaviors').html(summary);

        if(matches.all) {
            addLogEntry('Workspace behaviors match', 'match');
            $('#result-behaviors').addClass('match');
        } else {
            addLogEntry('Workspace behaviors do not match', 'diff');
            $('#result-behaviors').addClass('diff');
        }

        $('#result-behaviors').find('.result-compare').show();

        compareWorkflowStates();

    });

}
function getBehaviorsMatch(listSource, listTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url     = '/admin#section=setuphome&tab=workspaces&item=behavior&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
    let step    = 'behaviors';
    let matches = {
        all         : true,
        create      : true,
        edit        : true,
        demand      : true,
        countCreate : 0,
        countEdit   : 0,
        countDemand : 0
    }

    let scriptNames = {
        source : { create : '', edit : '',  demand : [] },
        target : { create : '', edit : '',  demand : [] }
    }

    for(let source of listSource) {
        if(source.scriptBehaviorType === 'ON_CREATE') {
            scriptNames.source.create = source.uniqueName; 
            environments.source.scripts.create = source;
        } else if(source.scriptBehaviorType === 'ON_EDIT') {
            scriptNames.source.edit = source.uniqueName; 
            environments.source.scripts.edit = source;
        } else {
            scriptNames.source.demand.push(source.uniqueName);
            environments.source.scripts.demand.push(source);
        }
    }

    for(let target of listTarget) {
        if(target.scriptBehaviorType === 'ON_CREATE') {
            scriptNames.target.create  = target.uniqueName; 
            environments.target.scripts.create = target;
        } else if(target.scriptBehaviorType === 'ON_EDIT') {
            scriptNames.target.edit = target.uniqueName; 
            environments.target.scripts.edit = target;
        } else {
            scriptNames.target.demand.push(target.uniqueName);
            environments.target.scripts.demand.push(target);
        }
    }    

    if(scriptNames.source.create !== scriptNames.target.create) {
        matches.create = false;
        let text = (isBlank(scriptNames.source.create)) ? 'Remove on create script <b>' + scriptNames.target.create + '</b>' : 'Set on create script <b>' + scriptNames.source.create + '</b>'
        addActionEntry({ text : text, step : step, url  : url });
    } else if(!isBlank(scriptNames.source.create)) {
        environments.scripts.push({
            type   : 'create',
            name   : environments.source.scripts.create,
            source : environments.source.scripts.create,
            target : environments.target.scripts.create
        });
    }

    addReportDetail('On Create Script', isBlank(scriptNames.source.create) ? '' : scriptNames.source.create, matches.create);

    if(scriptNames.source.edit !== scriptNames.target.edit) {
        matches.edit = false;
        let text = (isBlank(scriptNames.source.edit)) ? 'Remove on edit create script <b>' + scriptNames.target.edit + '</b>' : 'Set on edit script <b>' + scriptNames.source.edit + '</b>'
        addActionEntry({ text : text, step : step, url  : url });
    } else if(!isBlank(scriptNames.source.edit)) {
        environments.scripts.push({
            type   : 'edit',
            name   : environments.source.scripts.edit,
            source : environments.source.scripts.edit,
            target : environments.target.scripts.edit
        });
    }

    addReportDetail('On Edit Script', isBlank(scriptNames.source.edit) ? '' : scriptNames.source.edit, matches.edit);

    let matchReport = false;

    for(let script of scriptNames.source.demand) {
        if(scriptNames.target.demand.indexOf(script) === -1) {
            matches.demand = false;
            addActionEntry({ text : 'Add on demand script <b>' + script + '</b>', step : step, url  : url });
        } else {
            matchReport = true;
            environments.scripts.push({
                type   : 'demand',
                name   : script,
                source : environments.source.scripts.demand[scriptNames.source.demand.indexOf(script)],
                target : environments.target.scripts.demand[scriptNames.target.demand.indexOf(script)]
            });               
        }

        addReportDetail('On Demand Script', isBlank(script) ? '' : scriptNames.source.edit, matchReport);

    }

    for(let script of scriptNames.target.demand) {
        if(scriptNames.source.demand.indexOf(script) === -1) {
            matches.demand = false;
            addActionEntry({ text : 'Remove on demand script <b>' + script + '</b>', step : step, url  : url });
        }
    }
        
    matches.countCreate = scriptNames.source.create.length;
    matches.countEdit   = scriptNames.source.edit.length;
    matches.countDemand = scriptNames.source.demand.length;


    if(!matches.create) { matches.all = false; addLogEntry(logPrefix + 'Workspace on create scripts do not match', 'diff'); }
    if(!matches.edit)   { matches.all = false; addLogEntry(logPrefix + 'Workspace on edit scripts do not match', 'diff'); }
    if(!matches.demand) { matches.all = false; addLogEntry(logPrefix + 'Workspace on demand scripts do not match', 'diff'); }

    return matches;

}


// STEP #11
function compareWorkflowStates() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Workflow States comparison', 'head');
    addReportHeader('icon-workflow', 'Workflow States');

    let requests = [
        $.get('/plm/workspace-workflow-states', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/workspace-workflow-states', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let listSource = responses[0].data.states;
        let listTarget = responses[1].data.states;
        let matches    = getWorkflowStatesMatch(listSource, listTarget);

        $('#summary-states').html('States : ' + listSource.length);

        if(matches.all) {
            addLogEntry('Workspace Workflow States match', 'match');
            $('#result-states').addClass('match');
        } else {
            addLogEntry('Workspace Workflow States do not match', 'diff');
            $('#result-states').addClass('diff');
        }

        $('#result-states').find('.result-compare').show();

        compareWorkflowTransistions();

    });

}
function getWorkflowStatesMatch(listSource, listTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url     = '/admin#section=setuphome&tab=workspaces';
    let step    = 'states';
    let matches = {
        all     : true,
        layout  : true,
        locked  : true,
        managed : true,
        names   : true,
        extra   : false
    }

    for(let target of listTarget) {
        target.hasMatch = false;
        target.label    = '<b>' + target.name + ' (' + target.customLabel + ')</b>';
        target.layout   = target.coordinateX + ',' + target.coordinateY + ',' + target.height + ',' + target.width;
    }

        for(let source of listSource) {

        let hasMatch    = false;
        let reportMatch = false;
        let layout      = source.coordinateX + ',' + source.coordinateY + ',' + source.height + ',' + source.width;
        source.label    = '<b>' + source.name + ' (' + source.customLabel + ')</b>';

        for(let target of listTarget) {

            if(source.customLabel === target.customLabel) {
                
                hasMatch        = true;
                reportMatch     = true;
                target.hasMatch = true;
                
                if(source.name !== target.name) {
                    matches.names = false;
                    reportMatch = false;
                    addActionEntry({ 
                        text : 'Change label of state ' + target.label + ' to <b>' + source.name + '</b> using the Workflow Editor', 
                        step : step,
                        url  : url });
                }

                if(source.locked !== target.locked) {
                    matches.locked = false;
                    reportMatch = false;
                    if(source.locked) addActionEntry({ 
                        text : 'Set state ' + source.label + ' as lock state using the Workflow Editor',
                        step : step,
                        url  : url 
                    });
                    else addActionEntry({ 
                        text : 'Remove lock state setting from state ' + source.label + ' using the Workflow Editor', 
                        step : step,
                        url  : url 
                    });
                }

                if(source.managed !== target.managed) {
                    matches.managed = false;
                    reportMatch = false;
                    if(source.managed) addActionEntry({ 
                        text : 'Set state ' + source.label + ' as managed state using the Workflow Editor',
                        step : step,
                        url  : url 
                    });
                    else addActionEntry({ 
                        text : 'Remove managed state setting from state ' + source.label + ' using the Workflow Editor', 
                        step : step,
                        url  : url 
                    });
                }

                if(layout !== target.layout) {
                    matches.layout = false;
                }

            }
        }

        if(!hasMatch) {
            matches.all = false;
            addLogEntry(logPrefix + 'Status ' + source.label + ' not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({ 
                text : 'Add state ' + source.label + ' to the workflow', 
                step : step,
                url  : url });
        }

        addReportDetail(source.customLabel, source.name, reportMatch);

    }

    for(let target of listTarget) {
        if(!target.hasMatch) {
            matches.all = false;
            extra = true;
            addLogEntry(logPrefix + 'Status ' + target.label + ' not available in ' + environments.source.tenantName, 'diff');
            addActionEntry({ 
                text : 'Remove state ' + target.label + ' from the workflow in ' + environments.target.tenantName, 
                step : step,
                url  : url
            });
        }
    }

    if(!matches.names  ) { matches.all = false; addLogEntry(logPrefix + 'Workflow State Names do not match', 'diff'); }
    if(!matches.locked ) { matches.all = false; addLogEntry(logPrefix + 'Workflow Lock State does not match', 'diff'); }
    if(!matches.managed) { matches.all = false; addLogEntry(logPrefix + 'Workflow Managed State does not match', 'diff'); }
    if( matches.extra  ) { matches.all = false; addLogEntry(logPrefix + 'There are additional workflow states in '+ environments.target.tenantName, 'diff'); }
    // if(!matches.layout ) addLogEntry(logPrefix + 'Workflow Layout does not match', 'diff');    

    return matches;

}


// STEP #12
function compareWorkflowTransistions() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Workflow Transitions comparison', 'head');
    addReportHeader('icon-arrow-right', 'Workflow Transitions');

    let requests = [
        $.get('/plm/workspace-workflow-transitions', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/workspace-workflow-transitions', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let listSource = responses[0].data;
        let listTarget = responses[1].data;
        let matches    = getWorkflowTransitionsMatch(listSource, listTarget);

        $('#summary-transitions').html('Transitions : ' + listSource.length);

        if(matches.all) {
            if(!matches.layout ) addLogEntry('Workflow Layout does not match');
            addLogEntry('Workspace Workflow Transitions match', 'match');
            $('#result-transitions').addClass('match');
        } else {
            addLogEntry('Workspace Workflow Transitions do not match', 'diff');
            $('#result-transitions').addClass('diff');
        }

        $('#result-transitions').find('.result-compare').show();

        comparePicklists();

    });

}
function getWorkflowTransitionsMatch(listSource, listTarget, logPrefix) {

    if(isBlank(logPrefix)) logPrefix = '';

    let url     = '/admin#section=setuphome&tab=workspaces';
    let step    = 'transitions';
    let matches = {
        all               : true,
        fromState         : true,
        toState           : true,
        name              : true,
        description       : true,
        hidden            : true,
        permission        : true,
        conditionScript   : true,
        validationScript  : true,
        actionScript      : true,
        sendEMail         : true,
        showInOutstanding : true,
        notifyPerformers  : true,
        passwordEnabled   : true,
        comments          : true,
        saveStepLabel     : true,
        extra             : false,
        layout            : true
    }


    for(let target of listTarget) {

        target.hasMatch = false;
        target.layout   = target.labelPositionA + ',' + target.labelPositionB;
        target.from     = (isBlank(target.fromState)) ? 'Start' : target.fromState.title;
        target.label    = '<b>' + target.name + ' (' + target.customLabel + ')</b>';
        target.scripts  = {};
        
        target.scripts.condition  = (isBlank(target.conditionScript )) ? '' : target.conditionScript.title;
        target.scripts.validation = (isBlank(target.validationScript)) ? '' : target.validationScript.title;
        target.scripts.action     = (isBlank(target.actionScript    )) ? '' : target.actionScript.title;

    }

    for(let source of listSource) {

        let hasMatch    = false;
        let reportMatch = false;
        let layout      = source.labelPositionA + ',' + source.labelPositionB;
        let from        = (isBlank(source.fromState)) ? 'Start' : source.fromState.title

        source.scripts = {};
        source.scripts.condition  = (isBlank(source.conditionScript )) ? '' : source.conditionScript.title;
        source.scripts.validation = (isBlank(source.validationScript)) ? '' : source.validationScript.title;
        source.scripts.action     = (isBlank(source.actionScript    )) ? '' : source.actionScript.title;

        for(let target of listTarget) {

            if(source.customLabel === target.customLabel) {

                hasMatch        = true;
                reportMatch     = true;
                target.hasMatch = true;

                if(from !== target.from) {
                    matches.fromState = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Transition ' + target.label + ' should start at node <b>' + from + '</b>', step : step, url  : url });
                }

                if(source.toState.title !== target.toState.title) {
                    matches.toState = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Transition ' + target.label + ' should end at node <b>' + source.toState.title + '</b>', step : step, url  : url });
                }

                if(source.name !== target.name) {
                    matches.name = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Change name of transition <b>' + target.customLabel + '</b> to <b>' + source.name + '</b> using the Workflow Editor', step : step, url  : url });
                }

                if(source.description !== source.description) {
                    matches.description = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Change description of transition ' + target.label + ' to <b>' + source.description + '</b>', step : step, url  : url });
                }

                if(source.hidden !== target.hidden) {
                    matches.hidden = false;
                    reportMatch = false;
                    let value = (source.hidden) ? 'Hide' : 'Unhide';
                    addActionEntry({ text : value + ' transition ' + target.label, step : step, url  : url });
                }

                if(source.permission.title !== target.permission.title) {
                    matches.permission.title = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Set permission for transition ' + target.label + ' to <b>' + source.permission.title + '</b>', step : step, url  : url });
                }

                if(source.scripts.condition !== target.scripts.condition) {
                    matches.conditionScript = false;
                    reportMatch = false;
                    if(source.scripts.condition === '') addActionEntry({ text : 'Remove precondition script <b>' + target.scripts.condition + '</b> from transition ' + target.label, step : step, url  : url });
                    else addActionEntry({ text : 'Add precondition script <b>' + source.scripts.condition + '</b> to transition ' + target.label, step : step, url  : url });
                } else {
                    addScriptForComparison('condition', source.scripts.condition, source.conditionScript, target.conditionScript);
                }

                if(source.scripts.validation !== target.scripts.validation) {
                    matches.validationScript = false;
                    reportMatch = false;
                    if(source.scripts.validation === '') addActionEntry({ text : 'Remove validation script <b>' + target.scripts.validation + '</b> from transition ' + target.label, step : step, url  : url });
                    else addActionEntry({ text : 'Add validation <b>' + source.scripts.validation + '</b> to transition ' + target.label, step : step, url  : url });
                } else {
                    addScriptForComparison('validation', source.scripts.validation, source.validationScript, target.validationScript);
                }

                if(source.scripts.action !== target.scripts.action) {
                    matches.actionScript = false;
                    reportMatch = false;
                    if(source.scripts.action === '') addActionEntry({ text : 'Remove action script <b>' + target.scripts.action + '</b> from transition ' + target.label, step : step, url  : url });
                    else addActionEntry({ text : 'Add action script <b>' + source.scripts.action + '</b> to transition ' + target.label, step : step, url  : url });
                } else {
                    addScriptForComparison('action', source.scripts.action, source.actionScript, target.actionScript);
                }

                if(source.sendEMail !== target.sendEMail) {
                    matches.sendEMail = false;
                    reportMatch = false;
                    let value = (source.sendEMail) ? 'Enable' : 'Disable';
                    addActionEntry({ text : value + ' owner notification for transition ' + target.label, step : step, url  : url });
                }

                if(source.showInOutstanding !== target.showInOutstanding) {
                    matches.showInOutstanding = false;
                    reportMatch = false;
                    let value = (source.showInOutstanding) ? 'Enable' : 'Disable';
                    addActionEntry({ text : value + ' option "Display in Outstanding Work" for transition ' + target.label, step : step, url  : url });
                }

                if(source.notifyPerformers !== target.notifyPerformers) {
                    matches.notifyPerformers = false;
                    reportMatch = false;
                    let value = (source.notifyPerformers) ? 'Enable' : 'Disable';
                    addActionEntry({ text : value + ' option <b>Notify users who have permission to perform it</b> for transition ' + target.label, step : step, url  : url });
                }
                
                if(source.passwordEnabled !== target.passwordEnabled) {
                    matches.passwordEnabled = false;
                    reportMatch = false;
                    let value = (source.passwordEnabled) ? 'Enable' : 'Disable';
                    addActionEntry({ text : value + ' option <b>Password required</b> for transition ' + target.label, step : step, url  : url });
                }

                if(source.comments !== target.comments) {
                    matches.comments = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Set <b>Comments</b> option of transition ' + target.label + ' to <b>' + source.comments + '</b>', step : step, url  : url });
                }

                if(source.saveStepLabel !== target.saveStepLabel) {
                    matches.saveStepLabel = false;
                    reportMatch = false;
                    addActionEntry({ text : 'Change <b>Save step label</b> of transition ' + target.label + ' to <b>' + source.saveStepLabel + '</b>', step : step, url  : url });
                }

                if(layout !== target.layout) {
                    matches.layout = false;
                }

            }
        }

        if(!hasMatch) {
            matches.all = false;
            let from = (isBlank(source.fromState)) ? 'start node' : 'node <b>' + source.fromState.title + '</b>';
            addLogEntry(logPrefix + 'Transition ' + source.name + ' (' + source.customLabel + ') is not available in ' + environments.target.tenantName, 'diff');
            addActionEntry({ text : 'Add transition <b>' + source.name + ' (' + source.customLabel + ')</b> from ' + from + ' to node <b>' + source.toState.title + '</b>', step : step, url  : url });
        }

        addReportDetail(source.customLabel, source.name, reportMatch);

    }

    for(let target of listTarget) {
        if(!target.hasMatch) {
            matches.all = false;
            matches.extra = true;
            addLogEntry(logPrefix + 'Transition ' + target.label + ' is not available in ' + environments.source.tenantName, 'diff');
            addActionEntry({ text : 'Remove transition ' + target.label + ' from the workflow', step : step, url : url });
        }
    } 


    if(!matches.fromState)         { matches.all = false; addLogEntry(logPrefix + 'Workflow Transitions nodes do not match', 'diff'); }
    else if(!matches.toState)      { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition nodes do not match', 'diff'); }
    if(!matches.name)              { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition names do not match', 'diff'); }
    if(!matches.description)       { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition descriptions do not match', 'diff'); }
    if(!matches.hidden)            { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition visibility does not match', 'diff'); }
    if(!matches.permission)        { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition permissions do not match', 'diff'); }
    if(!matches.conditionScript)   { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition condition scripts do not match', 'diff'); }
    if(!matches.validationScript)  { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition validation scripts do not match', 'diff'); }
    if(!matches.actionScript)      { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition action scripts do not match', 'diff'); }
    if(!matches.sendEMail)         { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition owner notdifications do not match', 'diff'); }
    if(!matches.showInOutstanding) { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition outstanding work entries do not match', 'diff'); }
    if(!matches.notifyPerformers)  { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition notifications do not match', 'diff'); }
    if(!matches.passwordEnabled)   { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition password settings do not match', 'diff'); }
    if(!matches.comments)          { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition comments do not match', 'diff'); }
    if(!matches.saveStepLabel)     { matches.all = false; addLogEntry(logPrefix + 'Workflow Transition save step labels do not match', 'diff'); }
    if( matches.extra)             { matches.all = false; addLogEntry(logPrefix + 'There are additional transitions in ' + environments.target.tenantName, 'diff'); }

    return matches;

}
function addScriptForComparison(type, name, source, target) {
    
    if(isBlank(name)) return;

    for(let script of environments.scripts) {
        if(script.type === type) {
            if(script.source.link === source.link) return;
        }
    }

    environments.scripts.push({
        type   : type,
        name   : name,
        source : source,
        target : target
    });

}


// STEP #13
function comparePicklists() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Picklists comparison', 'head');
    addReportHeader('icon-picklist', 'Picklists');

    let requestsSource  = [];
    let requestsTarget  = [];
    let sourcePicklists = [];
    let targetPicklists = [];
    let url             = '/admin#section=setuphome&tab=general&item=picklistedit&params=';
    let step            = 'picklists';

    for(let picklist of environments.picklists) {
        if(picklist === '/api/v3/lookups/BOM-UOM') {
            addActionEntry({ 
                text : 'Please review the BOM UOM Pick List used by this workspace, it cannot be compared using the REST API', 
                step : step, 
                url  : '/admin#section=setuphome&tab=general&item=uomsetupedit' 
            });
            addLogEntry('Workspace uses BOM UOM Pick List which cannot be compared'); 
        } else requestsSource.push($.get('/plm/picklist-setup', { link : picklist, tenant : environments.source.tenantName }));
    }

    Promise.all(requestsSource).then(function(responses) {

        for(let response of responses) sourcePicklists.push(response.data.picklist);

        for(let source of sourcePicklists) {

            source.match = false;

            for(let target of environments.target.picklists) {
                if((source.id === target.id) ||  ( source.name === target.name)) {
                    source.match = true;
                    source.ref   = target.id
                    target.label = target.name + ' (' + target.id + ')';
                    requestsTarget.push($.get('/plm/picklist-setup', { id : target.id, tenant : environments.target.tenantName }));
                }
            }

        }

        Promise.all(requestsTarget).then(function(responses) {

            let match   = true;
            let matches = {
                name        : true,
                description : true,
                type        : true,
                values      : true
            }

            for(let response of responses) targetPicklists.push(response.data.picklist);

            for(let source of sourcePicklists) {

                let reportMatch = true;
                let urlPicklist = url + '{"name":"' + source.id + '"}';

                if(source.match) {

                    for(let target of targetPicklists) {

                        if(source.ref === target.id) {

                            if(source.description !== target.description) {
                                matches.description = false;
                                reportMatch = false;
                                addActionEntry({ text : 'Change description of  <b>' + target.label + '</b> to <b>' + source.description + '</b>', step : step, url  : urlPicklist });
                            }

                            if(source.view !== target.view) {
                                matches.type = false;
                                reportMatch = false;
                                let type = (source.view) ? 'A list of records from a workspace' : 'A list of values you define';
                                addActionEntry({ text : 'Change type of  <b>' + target.label + '</b> to <b>' + type + '</b>', step : step, url  : urlPicklist });
                            }

                            let matchValues = comparePicklistValues(source, target, step, urlPicklist);

                            if(!matchValues) {
                                reportMatch    = false;
                                matches.values = false;
                            }

                        }


                    }


                } else {

                    matches.name = false;
                    reportMatch  = false;
                    addActionEntry({ text : 'Add picklist <b>' + source.name + ' (' + source.id + ')</b>', step : step, url  : url });

                }

                addReportDetail(source.id, source.name, reportMatch);

            }

            if(!matches.name)        { match = false; addLogEntry('Some picklists are missing'); }
            if(!matches.description) { match = false; addLogEntry('Picklists descriptions do not match'); }
            if(!matches.type)        { match = false; addLogEntry('Picklists types (fixed / dynamic) do not match'); }
            if(!matches.values)      { match = false; addLogEntry('Values of defined/fixed picklists do not match'); }

            $('#summary-picklists').html('Picklists : ' + sourcePicklists.length);

            if(match) {
                addLogEntry('Picklists match', 'match');
                $('#result-picklists').addClass('match');
            } else {
                addLogEntry('Picklists do not match', 'diff');
                $('#result-picklists').addClass('diff');
            }

            $('#result-picklists').find('.result-compare').show();

            compareScriptSources();

        });
       
    });

}
function comparePicklistValues(sourcePicklist, targetPicklist, step, urlPicklist) {

    if(sourcePicklist.view) return true;

    let match = true;

    targetPicklist.label = targetPicklist.name + ' (' + targetPicklist.id + ')';

    for(let target of targetPicklist.values) target.hasMatch = false;
    for(let source of sourcePicklist.values) {

        let hasMatch = false

        for(let target of targetPicklist.values) {
            if(source.label === target.label) {
                hasMatch = true;
                target.hasMatch = true;
                break;
            }
        }

        if(!hasMatch) {
            match = false;
            addActionEntry({ text : 'Add value <b>' + source.label + '</b> to list <b>' + targetPicklist.label + '</b>', step : step, url  : urlPicklist });
        }
    }

    for(let target of targetPicklist.values) {
        if(!target.hasMatch) {
            match = false;
            addActionEntry({ text : 'Remove value <b>' + target.label + '</b> from list <b>' + targetPicklist.label + '</b>', step : step, url  : urlPicklist,
                comp : {
                    source : '/admin#section=setuphome&tab=general&item=picklistedit&params={"name":"' + targetPicklist.id + '"}',
                    target : '/admin#section=setuphome&tab=general&item=picklistedit&params={"name":"' + targetPicklist.id + '"}'
                }
            });
        }
    }

    return match;

}


// STEP #14
function compareScriptSources() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Script Sources comparison', 'head');
    addReportHeader('icon-script', 'Scripts Sources');

    let requests = [];
    let included = [];
    let counters = { create : 0, edit : 0, demand : 0,  validation : 0, condition : 0, action : 0 };

    for(let script of environments.scripts) {

        let linkSource = (isBlank(script.source.__self__)) ? script.source.link : script.source.__self__;
        let linkTarget = (isBlank(script.target.__self__)) ? script.target.link : script.target.__self__;

        if(!included.includes(linkSource)) {

            included.push(linkSource);
            
            requests.push($.get('/plm/script', { link : linkSource, tenant : environments.source.tenantName, type : script.type}));
            requests.push($.get('/plm/script', { link : linkTarget, tenant : environments.target.tenantName }));
        }

    }

    Promise.all(requests).then(function(responses) {

        let step        = 'scripts';
        let match       = true;
        let matches     = {
            description : true,
            source      : true,
            libraries   : true
        }

        for(let index = 0; index < responses.length; index += 2) {

            let source      = responses[index];
            let target      = responses[index + 1];
            let reportMatch = true;

            source.importNames = [];
            target.importNames = [];

            for(let dependsOn of target.data.dependsOn) target.importNames.push(dependsOn.title);
            for(let dependsOn of source.data.dependsOn) {
                source.importNames.push(dependsOn.title);

                let add = true;
                for(let library of environments.libraries) {
                    if(library.link === dependsOn.link) {
                        add = false;
                        break;
                    }
                }

                if(add) environments.libraries.push(dependsOn)

            }

            counters[source.params.type]++;

            if(source.data.displayName !== target.data.displayName) {
                matches.description = false;
                reportMatch = false;
                addActionEntry({ 
                    text : 'Change description of <b>' + source.data.uniqueName + '</b> to <b>' + source.data.displayName + '</b>', 
                    step : step,
                    url  : '/script.form?ID=' + source.params.link.split('/').pop()
                });
            }

            if(source.data.code !== target.data.code) {
                matches.source = false;
                reportMatch = false;
                addActionEntry({ 
                    text : 'Update source code of <b>' + source.data.uniqueName + '</b>', 
                    step : step,
                    url  : '/script.form?ID=' + source.params.link.split('/').pop(),
                    comp : {
                        source : '/script.form?ID=' + source.params.link.split('/').pop(),
                        target : '/script.form?ID=' + target.params.link.split('/').pop()
                    }
                });
                downloadModifiedScript(source, target);
            }

            if(source.importNames.toString() !== target.importNames.toString()) {
                matches.libraries = false;
                reportMatch = false;
                let text = (source.importNames.length === 0) ? 'Remove all imports from script <b>' + source.data.uniqueName + '</b>' : 'Script <b>' + source.data.uniqueName + '</b> must import the following scripts (only): <b>' + source.importNames.toString() + '</b>';
                addActionEntry({ 
                    text : text, 
                    step : step,
                    url  : '/script.form?ID=' + source.params.link.split('/').pop(),
                    comp : {
                        source : '/script.form?ID=' + source.params.link.split('/').pop(),
                        target : '/script.form?ID=' + target.params.link.split('/').pop()
                    }
                });
            }

            addReportDetail(source.params.type, source.data.uniqueName, reportMatch);

        } 

        if(!matches.description) { match = false; addLogEntry('Descriptions of scripts do not match'); }
        if(!matches.source     ) { match = false; addLogEntry('Sources of scripts do not match'); }
        if(!matches.libraries  ) { match = false; addLogEntry('Imports do not match'); }

        let summary = '';

        if(counters.create     > 0) summary += 'create'
        if(counters.edit       > 0) summary += ' edit'
        summary += ' dem:' + counters.demand;
        summary += ' con:' + counters.condition;
        summary += ' val:' + counters.validation;
        summary += ' act:' + counters.action;

        $('#summary-scripts').html(summary);

        if(match) {
            addLogEntry('Script sources and descriptions match', 'match');
            $('#result-scripts').addClass('match');
        } else {
            addLogEntry('Script sources / descriptions do not match', 'diff');
            $('#result-scripts').addClass('diff');
        }

        $('#result-scripts').find('.result-compare').show();

        compareLibraryScripts();

    });

}


// STEP #15
function compareLibraryScripts() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Library Script Sources comparison', 'head');
    addReportHeader('icon-library-script', 'Library Scripts');

    if(environments.libraries.length > 0) {

        let requests = [];
        let match    = true;
        let step     = 'libraries';
        let url      = '/admin#section=setuphome&tab=workspaces';
        let matches  = {
            missing      : false,
            descriptions : true,
            source       : true
        }

        $.get('/plm/scripts', { tenant : environments.target.tenantName }, function(response) {

            if(stopped) return;

            for(let source of environments.libraries) {

                let hasMatch = true

                for(let target of response.data.scripts) {
                    if(source.title === target.uniqueName) {
                        hasMatch = true;
                        requests.push($.get('/plm/script', { link : source.link,     tenant : environments.source.tenantName }));
                        requests.push($.get('/plm/script', { link : target.__self__, tenant : environments.target.tenantName }));
                        break;
                    }
                }

                if(!hasMatch) {
                    matches.missing = true;
                    addLogEntry('Library script ' + source.uniqueName + ' is not available in ' + environments.target.tenantName);
                    addActionEntry({
                        text : 'Add library script <b>' + source.uniqueName + '</b> and add given references',
                        step : step,
                        url  : url
                    });
                }

            }

            Promise.all(requests).then(function(responses) {

                for(let index = 0; index < responses.length; index += 2) {

                    let source      = responses[index];
                    let target      = responses[index + 1];
                    let reportMatch = true;

                    if(source.data.displayName !== target.data.displayName) {
                        matches.descriptions = true;
                        reportMatch = false;
                        addLogEntry('Library script ' + source.data.uniqueName + ' description does not match');
                        addActionEntry({
                            text : 'Set description of library script <b>' + source.data.uniqueName + '</b> to <b>' + source.data.displayName + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    if(source.data.code !== target.data.code) {
                        matches.source = false;
                        reportMatch = false;
                        addActionEntry({ 
                            text : 'Update source code of <b>' + source.data.uniqueName + '</b>', 
                            step : step,
                            url  : '/script.form?ID=' + source.params.link.split('/').pop(),
                            comp : {
                                source : '/script.form?ID=' + source.params.link.split('/').pop(),
                                target : '/script.form?ID=' + target.params.link.split('/').pop()
                            }
                        });
                    } 

                    addReportDetail('Library Script', source.data.uniqueName, reportMatch);

                } 

                if( matches.missing     ) { match = false; addLogEntry('Some library scripts are missing'); }
                if(!matches.descriptions) { match = false; addLogEntry('Some library script descriptions do not match'); }
                if(!matches.source      ) { match = false; addLogEntry('Sources of library scripts do not match'); }

                $('#summary-libraries').html('Library Scripts : ' + environments.libraries.length);

                if(match) {
                    addLogEntry('Library scripts match', 'match');
                    $('#result-libraries').addClass('match');
                } else {
                    addLogEntry('Library scripts do not match', 'diff');
                    $('#result-libraries').addClass('diff');
                }

                $('#result-libraries').find('.result-compare').show();

                endComparison();

            });

        });

    } else {
        $('#summary-libraries').html('Library Scripts : ' + environments.libraries.length);
        addLogEntry('No library scripts required', 'match');
        $('#result-libraries').addClass('match');
        addLogEnd();
        endComparison();
    }

}



// Full Tenant Comparison
function getAllWorkspaces(update) {

    if(stopped) return;   

    $('#comparison-workspaces-table').html('');

    let requests = [
        $.get('/plm/workspaces', { limit : 1000, bulk : true, tenant : environments.source.tenantName, timestamp : timestamp }),
        $.get('/plm/workspaces', { limit : 1000, bulk : true, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        if(stopped) return;
        if(responses[0].params.timestamp != timestamp) return;

        all.workspaces = [];
        all.names      = [];

        for(let source of responses[0].data.items) {

            if(!all.names.includes(source.systemName)) {
                source.categoryName = source.category.name;
                all.names.push(source.systemName);
                all.workspaces.push({
                    systemName  : source.systemName,
                    name        : source.name,
                    category    : source.category.name,
                    description : source.description,
                    type        : getWorkspaceTypeLabel(source),
                    source      : source,
                    target      : {}
                });
            }

        }

        for(let target of responses[1].data.items) {

            target.categoryName = target.category.name;

            if(!all.names.includes(target.systemName)) {
                all.names.push(target.systemName);
                all.workspaces.push({
                    systemName  : target.systemName,
                    name        : target.name,
                    category    : target.category.name,
                    description : target.description,
                    type        : getWorkspaceTypeLabel(target),
                    source      : {},
                    target      : target
                });
            } else {
                let entry = all.workspaces[all.names.indexOf(target.systemName)];
                entry.target = target;
            }

        }

        addLogEntry(all.workspaces.length + ' Workspaces combined', 'success');
        sortArray(all.workspaces, 'systemName');

        for(let workspace of all.workspaces) workspace.completed = false;

        let elemParent = $('#comparison-workspaces-table');
        let elemTable  = $('<table></table>').appendTo(elemParent);
        let elemTHead  = $('<thead></thead>').appendTo(elemTable);
        let elemTBody  = $('<tbody></tbody>').appendTo(elemTable);
        let elemTHRow  = $('<tr></tr>'      ).appendTo(elemTHead);

        elemTable.addClass('row-hovering').addClass('fixed-header').addClass('fixed-column');

        $('<th></th>').appendTo(elemTHRow).addClass('id').html('Workspace').addClass('key');
        $('<th></th>').appendTo(elemTHRow).addClass('exists').html('Tenants');
        $('<th></th>').appendTo(elemTHRow).addClass('name').html('Name');
        $('<th></th>').appendTo(elemTHRow).addClass('category').html('Category');
        $('<th></th>').appendTo(elemTHRow).addClass('description').html('Description');
        $('<th></th>').appendTo(elemTHRow).addClass('type').html('Type');
        $('<th></th>').appendTo(elemTHRow).addClass('wstabs').html('TAB').attr('title', 'Workspace Tabs configuration settings, counters indicate number of visible tabs');
        $('<th></th>').appendTo(elemTHRow).addClass('details').html('DET').attr('title', 'Item Details tab configuration settings, counters inidicate number of sections');
        $('<th></th>').appendTo(elemTHRow).addClass('grid').html('GRD').attr('title', 'Grid configuration settings, counters inidicate number of fields');
        $('<th></th>').appendTo(elemTHRow).addClass('managed').html('AFF').attr('title', 'Affected / Managed items tab, counters indicate number of fields');
        $('<th></th>').appendTo(elemTHRow).addClass('bom').html('BOM').attr('BOM tab configuration setings, counters inidicate number of BOM views');
        $('<th></th>').appendTo(elemTHRow).addClass('relationships').html('REL').attr('title', 'Workspace Relationships settings, counters indicate number of relationship types defined');
        $('<th></th>').appendTo(elemTHRow).addClass('apv').html('APV').attr('title', 'Advanced Print Views, counters inidicate number of views defined');
        $('<th></th>').appendTo(elemTHRow).addClass('behaviors').html('BEH').attr('title', 'Behaaviors, counters inidicated number of scripts defined in the Behaviors tab');
        $('<th></th>').appendTo(elemTHRow).addClass('states').html('WFL').attr('title', 'Workflow States, counters inidicate the total number of workflow steps');
        $('<th></th>').appendTo(elemTHRow).addClass('transitions').html('TRS').attr('title', 'Workflow Transitions, counters inidicate the number of workflow transitions');

        let elemIconPending = $('<div></div>')
            .addClass('icon')
            .addClass('filled')
            .addClass('comparison-icon')
            .addClass('icon-radio-unchecked')
            .addClass('pending');

        for(let workspace of all.workspaces) {

            let elemRow = $('<tr></tr>').appendTo(elemTBody)
                .addClass('row-workspace');

            $('<td></td>').appendTo(elemRow)
                .addClass('id')
                .addClass('key')
                .html(workspace.systemName);

            $('<td></td>').appendTo(elemRow).addClass('name').html(workspace.name).prepend(getComparisonIcon(workspace.source.name, workspace.target.name)); 
            $('<td></td>').appendTo(elemRow).addClass('category').html(workspace.category).prepend(getComparisonIcon(workspace.source.categoryName, workspace.target.categoryName)); 
            $('<td></td>').appendTo(elemRow).addClass('description').html(workspace.description).prepend(getComparisonIcon(workspace.source.description, workspace.target.description)); 
            $('<td></td>').appendTo(elemRow).addClass('type').html(workspace.type).prepend(getComparisonIcon(workspace.source.type, workspace.target.type)); 
            $('<td></td>').appendTo(elemRow).addClass('wstabs').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('details').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('grid').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('managed').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('bom').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('relationships').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('apv').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('behaviors').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('states').append(elemIconPending.clone());
            $('<td></td>').appendTo(elemRow).addClass('transitions').append(elemIconPending.clone());

            elemRow.children().click(function() {
                openWorkspaceControlSideBySide($(this));
            });

            getTenantsAvailability(workspace, elemRow)

        }

        $('#comparison-workspaces-filters').children().removeClass('hidden');
        if(update) compareAllWorkspaces(true); else getAllScripts(false);

    });

}
function openWorkspaceControlSideBySide(elemClicked) {

    let elemWorkspace = elemClicked.closest('.row-workspace');
    let linkLeft      = elemWorkspace.find('.base').attr('data-link');
    let linkRight     = elemWorkspace.find('.target').attr('data-link');
    let type          = '';

    if(isBlank(linkLeft )) return;
    if(isBlank(linkRight)) return;

         if(elemClicked.hasClass('name'         )) type = 'workspace-settings';
    else if(elemClicked.hasClass('category'     )) type = 'workspace-category';
    else if(elemClicked.hasClass('description'  )) type = 'workspace-settings';
    else if(elemClicked.hasClass('type'         )) type = 'workspace-settings';
    else if(elemClicked.hasClass('wstabs'       )) type = 'workspace-tabs';
    else if(elemClicked.hasClass('details'      )) type = 'workspace-details';
    else if(elemClicked.hasClass('grid'         )) type = 'workspace-grid';
    else if(elemClicked.hasClass('managed'      )) type = 'workspace-managed';
    else if(elemClicked.hasClass('bom'          )) type = 'workspace-bom';
    else if(elemClicked.hasClass('relationships')) type = 'workspace-relationships';
    else if(elemClicked.hasClass('apv'          )) type = 'workspace-apv';
    else if(elemClicked.hasClass('behaviors'    )) type = 'workspace-behaviors';
    else if(elemClicked.hasClass('states'       )) type = 'workspace-workflow';
    else if(elemClicked.hasClass('transitions'  )) type = 'workspace-workflow';

    if(type === '') return;

    openAdminControlsSideBySide(type, linkLeft, linkRight, environments.source.tenantName, environments.target.tenantName);

}
function getAllScripts(update) {

    if(stopped) return;

    $('#comparison-scripts-table').html('');

    let requests = [
        $.get('/plm/scripts', { tenant : environments.source.tenantName, timestamp : timestamp }),
        $.get('/plm/scripts', { tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        if(stopped) return;
        if(responses[0].params.timestamp != timestamp) return;

        all.scripts = [];
        all.names   = [];

        for(let source of responses[0].data.scripts) {

            if(!all.names.includes(source.uniqueName)) {
                all.names.push(source.uniqueName);
                all.scripts.push({
                    uniqueName    : source.uniqueName,
                    type          : source.scriptType,
                    imports       : source.dependsOn.length,
                    displayName   : source.displayName,
                    linkSource    : source.__self__,
                    typeSource    : source.scriptType,
                    importsSource : [],
                    linkTarget    : '',
                    typeTarget    : '',
                    importsTarget : [],
                    source : source,
                    target : {}
                });
            }

        }

        for(let target of responses[1].data.scripts) {

            if(!all.names.includes(target.uniqueName)) {
                all.names.push(target.uniqueName);
                all.scripts.push({
                    uniqueName    : target.uniqueName,
                    type          : target.scriptType,
                    imports       : target.dependsOn.length,
                    displayName   : target.displayName,
                    linkTarget    : target.__self__,
                    typeTarget    : target.scriptType,
                    importsTarget : [],
                    linkSource    : '',
                    typeSource    : '',
                    importsSource : [],
                    source : {},
                    target : target
                });
            } else {

                let script = all.scripts[all.names.indexOf(target.uniqueName)];

                script.linkTarget = target.__self__;
                script.typeTarget = target.scriptType;
                script.target = target;
            }

        }

        addLogEntry(all.scripts.length + ' Scripts combined', 'success');
        sortArray(all.scripts, 'uniqueName');

        let elemParent = $('#comparison-scripts-table');
        let elemTable  = $('<table></table>').appendTo(elemParent);
        let elemTHead  = $('<thead></thead>').appendTo(elemTable);
        let elemTBody  = $('<tbody></tbody>').appendTo(elemTable);
        let elemTHRow  = $('<tr></tr>'      ).appendTo(elemTHead);

        elemTable.addClass('row-hovering').addClass('fixed-header').addClass('fixed-column');

        $('<th></th>').appendTo(elemTHRow).addClass('name').html('Name').addClass('key');
        $('<th></th>').appendTo(elemTHRow).addClass('exists').html('Tenants');
        $('<th></th>').appendTo(elemTHRow).addClass('type').html('Type');
        $('<th></th>').appendTo(elemTHRow).addClass('imports').html('Imports');
        $('<th></th>').appendTo(elemTHRow).addClass('source').html('Source Code');
        $('<th></th>').appendTo(elemTHRow).addClass('description').html('Description');

        for(let script of all.scripts) {

            let elemRow = $('<tr></tr>').appendTo(elemTBody).addClass('row-script');

            $('<td></td>').appendTo(elemRow)
                .addClass('name')
                .addClass('key')
                .html(script.uniqueName);

            $('<td></td>').appendTo(elemRow).addClass('type').html(script.type).prepend(getComparisonIcon(script.typeSource, script.typeTarget));
            $('<td></td>').appendTo(elemRow).addClass('imports').html(script.imports).prepend(getComparisonIcon(null, null));
            $('<td></td>').appendTo(elemRow).addClass('source').append(getComparisonIcon(null, null));
            $('<td></td>').appendTo(elemRow).addClass('description').html(script.displayName).prepend(getComparisonIcon(script.source.displayName, script.target.displayName));

            script.completed = false;
            getTenantsAvailability(script, elemRow);

        }

        $('#comparison-scripts-filters').children().removeClass('hidden');
        if(update) compareAllScripts(true); else getAllPicklists(false);

    });

}
function getAllPicklists(update) {

    if(stopped) return;

    $('#comparison-picklists-table').html('');

    let requests = [
        $.get('/plm/picklists', { limit : 1000, tenant : environments.source.tenantName, timestamp : timestamp }),
        $.get('/plm/picklists', { limit : 1000, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        if(stopped) return;
        if(responses[0].params.timestamp != timestamp) return;

        all.picklists = [];
        all.names     = [];

        for(let source of responses[0].data.list.picklist) {

            if(!all.names.includes(source.id)) {
                all.names.push(source.id);
                all.picklists.push({
                    id     : source.id,
                    name   : source.name,
                    type   : (source.view) ? 'Workspace View' : 'Static List',
                    source : source,
                    target : {}
                });
            }

        }

        for(let target of responses[1].data.list.picklist) {

            if(!all.names.includes(target.id)) {
                all.names.push(target.id);
                all.picklists.push({
                    id     : target.id,
                    name   : target.name,
                    type   : (target.view) ? 'Workspace View' : 'Static List',
                    source : {},
                    target : target
                });
            } else {
                let entry = all.picklists[all.names.indexOf(target.id)];
                entry.target = target;
            }

        }
        
        addLogEntry(all.picklists.length + ' Picklists combined', 'success');
        sortArray(all.picklists, 'id');

        let elemParent = $('#comparison-picklists-table');
        let elemTable  = $('<table></table>').appendTo(elemParent);
        let elemTHead  = $('<thead></thead>').appendTo(elemTable);
        let elemTBody  = $('<tbody></tbody>').appendTo(elemTable);
        let elemTHRow  = $('<tr></tr>'      ).appendTo(elemTHead);

        elemTable.addClass('row-hovering').addClass('fixed-header').addClass('fixed-column');

        $('<th></th>').appendTo(elemTHRow).addClass('id').html('ID').addClass('key');
        $('<th></th>').appendTo(elemTHRow).addClass('exists').html('Tenants');
        $('<th></th>').appendTo(elemTHRow).addClass('name').html('Name');
        $('<th></th>').appendTo(elemTHRow).addClass('type').html('Type');
        $('<th></th>').appendTo(elemTHRow).addClass('values').html('Values');

        for(let picklist of all.picklists) {

            let elemRow = $('<tr></tr>').appendTo(elemTBody).addClass('row-picklist');

            $('<td></td>').appendTo(elemRow).addClass('id').html(picklist.id).addClass('key');
            $('<td></td>').appendTo(elemRow).addClass('name').html(picklist.name).prepend(getComparisonIcon(picklist.source.name, picklist.target.name));  
            $('<td></td>').appendTo(elemRow).addClass('type').prepend(getComparisonIcon(null, null));
            $('<td></td>').appendTo(elemRow).addClass('values').prepend(getComparisonIcon(null, null));                

            getTenantsAvailability(picklist, elemRow);
            picklist.completed = false;

        }

        $('#comparison-picklists-filters').children().removeClass('hidden');
        if(update) compareAllPicklists(true); else getAllRoles(false);

    });

}
function getAllRoles(update) {

    if(stopped) return;

    $('#comparison-roles-table').html('');

    let requests = [
        $.get('/plm/roles', { limit : 1000, tenant : environments.source.tenantName, timestamp : timestamp }),
        $.get('/plm/roles', { limit : 1000, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        if(stopped) return;
        if(responses[0].params.timestamp != timestamp) return;

        all.roles = [];
        all.names = [];

        for(let source of responses[0].data.list.role) {

            if(!all.names.includes(source.name)) {
                all.names.push(source.name);
                all.roles.push({
                    name        : source.name,
                    description : source.description,
                    source      : source,
                    target      : {}
                });
            }

        }

        for(let target of responses[1].data.list.role) {

            if(!all.names.includes(target.name)) {
                all.names.push(target.name);
                all.roles.push({
                    name        : target.name,
                    description : target.description,
                    source      : {},
                    target      : target
                });
            } else {
                let entry = all.roles[all.names.indexOf(target.name)];
                    entry.target = target;
            }

        }

        addLogEntry(all.roles.length + ' Roles combined', 'success');
        sortArray(all.roles, 'name');

        let elemParent = $('#comparison-roles-table');
        let elemTable  = $('<table></table>').appendTo(elemParent);
        let elemTHead  = $('<thead></thead>').appendTo(elemTable);
        let elemTBody  = $('<tbody></tbody>').appendTo(elemTable);
        let elemTHRow  = $('<tr></tr>'      ).appendTo(elemTHead);

        elemTable.addClass('row-hovering').addClass('fixed-header').addClass('fixed-column');

        $('<th></th>').appendTo(elemTHRow).addClass('name').html('Name').addClass('key');
        $('<th></th>').appendTo(elemTHRow).addClass('exists').html('Tenants');
        $('<th></th>').appendTo(elemTHRow).addClass('description').html('Description');
        $('<th></th>').appendTo(elemTHRow).addClass('permissions').html('Permissions');

        for(let role of all.roles) {
            
            let count = (typeof role.source.permissions === 'undefined') ? role.target.permissions.permission.length : role.source.permissions.permission.length;
            
            if(typeof role.source.permissions === 'undefined') role.source.permissions = { permission : [] };
            else {
                for(let permission of role.source.permissions.permission) {
                    for(let definition of environments.source.permissions) {
                        if(permission.id === definition.id) {
                            permission.title = definition.name;
                        }
                    }
                }
            }

            if(typeof role.target.permissions === 'undefined') role.target.permissions = { permission : [] };
            else {
                for(let permission of role.target.permissions.permission) {
                    for(let definition of environments.target.permissions) {
                        if(permission.id === definition.id) {
                            permission.title = definition.name;
                        }
                    }
                }
            }

            let elemRow = $('<tr></tr>').appendTo(elemTBody).addClass('row-role');

            $('<td></td>').appendTo(elemRow).addClass('name').addClass('key').html(role.name);
            $('<td></td>').appendTo(elemRow).addClass('description').html(role.description).prepend(getComparisonIcon(role.source.description, role.target.description));
            $('<td></td>').appendTo(elemRow).addClass('permissions').prepend(getComparisonIcon(null, null));


            getTenantsAvailability(role, elemRow);
            role.completed = false;

        }

        $('#comparison-roles-filters').children().removeClass('hidden');

        if(update) compareAllRoles(true); else getAllGroups(false);

    });

}
function getAllGroups(update) {

    if(stopped) return;

    $('#comparison-groups-table').html('');

    let requests = [
        $.get('/plm/groups', { limit : 1000, tenant : environments.source.tenantName, timestamp : timestamp }),
        $.get('/plm/groups', { limit : 1000, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        if(stopped) return;
        if(responses[0].params.timestamp != timestamp) return;

        all.groups = [];
        all.names  = [];

        for(let source of responses[0].data.items) {

            if(!all.names.includes(source.shortName)) {
                all.names.push(source.shortName);
                all.groups.push({
                    name        : source.shortName,
                    linkSource  : source.__self__,
                    linkTarget  : '',
                    source      : source,
                    target     : {}
                });
            }

        }

        for(let target of responses[1].data.items) {

            if(!all.names.includes(target.shortName)) {
                all.names.push(target.shortName);
                all.groups.push({
                    name       : target.shortName,
                    linkTarget : target.__self__,
                    linkSource : '',
                    source : {},
                    target : target
                });
            } else {
                let entry = all.groups[all.names.indexOf(target.shortName)];
                entry.linkTarget = target.__self__;
                entry.target = target;
            }

        }

        addLogEntry(all.groups.length + ' Groups combined', 'success');
        sortArray(all.groups, 'name');

        let elemParent = $('#comparison-groups-table');
        let elemTable  = $('<table></table>').appendTo(elemParent);
        let elemTHead  = $('<thead></thead>').appendTo(elemTable);
        let elemTBody  = $('<tbody></tbody>').appendTo(elemTable);
        let elemTHRow  = $('<tr></tr>'      ).appendTo(elemTHead);

        elemTable.addClass('row-hovering').addClass('fixed-header').addClass('fixed-column');

        $('<th></th>').appendTo(elemTHRow).addClass('name').html('Name').addClass('key');
        $('<th></th>').appendTo(elemTHRow).addClass('exists').html('Tenants');
        $('<th></th>').appendTo(elemTHRow).addClass('description').html('Description');

        for(let group of all.groups) {

            let description = group.source.longName || group.target.longName || '';
            let elemRow     = $('<tr></tr>').appendTo(elemTBody).addClass('row-group');

            $('<td></td>').appendTo(elemRow).addClass('name').addClass('key').html(group.name);
            $('<td></td>').appendTo(elemRow).addClass('description').html(description).prepend(getComparisonIcon(group.source.longName, group.target.longName));

            getTenantsAvailability(group, elemRow);
            group.completed = false;

        }

        $('#comparison-groups-filters').children().removeClass('hidden');

        if(update) endComparison(); else compareAllWorkspaces();

    });

}


function getComparisonIcon(valueSource, valueTarget) {
    
    let elemIcon = $('<div></div>')
        .addClass('icon')
        .addClass('filled')
        .addClass('comparison-icon');

    if((valueSource === null) && (valueTarget === null) ){
        elemIcon.addClass('icon-radio-unchecked').addClass('pending');
    } else if(valueSource === valueTarget) {
        elemIcon.addClass('icon-check').addClass('match')
     } else elemIcon.addClass('icon-important').addClass('mismatch');

    return elemIcon;

}
function getTenantsAvailability(entry, elemRow) {

    let elemKey = elemRow.find('.key').first();

    let elemExists = $('<td></td>').insertAfter(elemKey)
        .addClass('exists');

    let elemExistsBase = $('<div></div>').appendTo(elemExists)
        .addClass('base')
        .addClass('filled')
        .addClass('with-icon')
        .attr('data-link', entry.source.__self__ || entry.source.uri || '')
        .attr('title', 'Exists in ' + environments.source.tenantName)
        .html('Base')
        .click(function() { openItem($(this)); });
        
    let elemExistsTarget = $('<div></div>').appendTo(elemExists)
        .addClass('target')   
        .addClass('filled')
        .addClass('with-icon') 
        .attr('data-link', entry.target.__self__ || entry.target.uri || '')
        .attr('title', 'Exists in ' + environments.target.tenantName)
        .html('Target')
        .click(function() { openItem($(this)); });

    let elemCompare = $('<div></div>')
        .addClass('button') 
        .addClass('icon')   
        .addClass('icon-compare')
        .attr('title', 'Open editors side by side')
        .click(function() { openSideBySide($(this)); });

    if(isBlank(entry.source.__self__) && isBlank(entry.source.uri)) {

        elemRow.addClass('missing-base');
        elemExistsBase.attr('title', 'Missing in ' + environments.source.tenantName);

    } else if(isBlank(entry.target.__self__) && isBlank(entry.target.uri)) {

        elemRow.addClass('missing-target');
        elemExistsTarget.attr('title', 'Missing in ' + environments.target.tenantName);

    } else {
        elemCompare.appendTo(elemExists);
    }

}
function openItem(elemClicked) {

    if(elemClicked.closest('tr').hasClass('row-workspace')) return;

    let tenantName = (elemClicked.hasClass('target')) ? environments.target.tenantName : environments.source.tenantName;
    let link       = elemClicked.attr('data-link');
    let type       = '';

    if(isBlank(link)) return;

    let elemTable = elemClicked.closest('.comparison-contents-table');

    switch(elemTable.attr('id')) {

        case 'comparison-workspaces-table': type = 'workspace'; break;
        case 'comparison-scripts-table'   : type = 'script'   ; break;
        case 'comparison-picklists-table' : type = 'picklist' ; break;
        case 'comparison-roles-table'     : type = 'role'     ; break;
        case 'comparison-groups-table'    : type = 'group'    ; break;

    }

    openAdminControl(type, link, tenantName);

}
function openSideBySide(elemClicked) {

    let linkLeft  = elemClicked.siblings('.base'  ).attr('data-link');
    let linkRight = elemClicked.siblings('.target').attr('data-link');
    let type       = '';

    if(isBlank(linkLeft)) return;
    if(isBlank(linkRight)) return;

    let elemTable = elemClicked.closest('.comparison-contents-table');

    switch(elemTable.attr('id')) {

        case 'comparison-workspaces-table': type = 'workspace'; break;
        case 'comparison-scripts-table'   : type = 'script'   ; break;
        case 'comparison-picklists-table' : type = 'picklist' ; break;
        case 'comparison-roles-table'     : type = 'role'     ; break;
        case 'comparison-groups-table'    : type = 'group'    ; break;

    }

    openAdminControlsSideBySide(type, linkLeft, linkRight, environments.source.tenantName, environments.target.tenantName);

}


function compareAllWorkspaces(update) {

    if(stopped) return;

    addLogSpacer();
    addLogSeparator();
    addLogEntry('Starting Workspace Comparison', 'head');
    addLogSpacer();
    addLogEntry($('.row-workspace.missing-base').length + ' workspaces missing in ' + environments.source.tenantName, 'diff');
    addLogEntry($('.row-workspace.missing-target').length + ' workspaces missing in ' + environments.target.tenantName, 'diff');
    addLogSpacer();

    compareNextWorkspace(update);

}
function compareNextWorkspace(update) {

    if(stopped) return;

    let proceed = true;
    let index   = 0;

    for(let workspace of all.workspaces) {

        if(!workspace.completed) {
        
            let requests = [];

            if(isBlank(workspace.source.__self__)) {
                
                addLogEntry('Workspace ' + workspace.name + ' missing in ' + environments.source.tenantName, 'diff');

                requests = [
                    $.get('/plm/tabs', { link : workspace.target.__self__, tenant : environments.target.tenantName, timestamp : timestamp }),
                    $.get('/plm/fields', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/grid-columns', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/managed-fields', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/bom-views-and-fields', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-all-relationships', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-print-views', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-scripts', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-workflow-states', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-workflow-transitions', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                ];


            } else if(isBlank(workspace.target.__self__)) {

                addLogEntry('Workspace ' + workspace.name + ' missing in ' + environments.target.tenantName, 'diff');

                requests = [
                    $.get('/plm/tabs', { link : workspace.source.__self__, tenant : environments.source.tenantName, timestamp : timestamp }),
                    $.get('/plm/fields', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/grid-columns', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/managed-fields', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/bom-views-and-fields', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-all-relationships', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-print-views', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-scripts', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-workflow-states', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-workflow-transitions', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                ];

            } else {

                addLogEntry('Comparing Workspace of <strong>' + workspace.name + '</strong>', '');

                requests = [
                    $.get('/plm/tabs', { link : workspace.source.__self__, tenant : environments.source.tenantName, timestamp : timestamp }),
                    $.get('/plm/tabs', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/sections', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/sections', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/fields', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/fields', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/grid-columns', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/grid-columns', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/managed-fields', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/managed-fields', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/bom-views-and-fields', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/bom-views-and-fields', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-all-relationships', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-all-relationships', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-print-views', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-print-views', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-scripts', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-scripts', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-workflow-states', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-workflow-states', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                    $.get('/plm/workspace-workflow-transitions', { link : workspace.source.__self__, tenant : environments.source.tenantName }),
                    $.get('/plm/workspace-workflow-transitions', { link : workspace.target.__self__, tenant : environments.target.tenantName }),
                ];

            }
        
            Promise.all(requests).then(function(responses) {

                if(responses[0].params.timestamp != timestamp) return;

                let tabs          = { match : false, count : responses[0].data.length };
                let details       = { match : false, count : responses[1].data.length };
                let grid          = { match : false, count : 0 };
                let managed       = { match : false, count : responses[3].data.length };
                let bom           = { match : false, count : responses[4].data.length };
                let relationships = { match : false, count : responses[5].data.length };
                let printViews    = { match : false, count : (responses.length > 10) ? 0 : responses[6].data.links.length };
                let behaviors     = { match : false, count : (responses.length > 10) ? 0 : responses[7].data.scripts.length };
                let states        = { match : false, count : (responses.length > 10) ? 0 : responses[8].data.states.length };
                let transistions  = { match : false, count : responses[9].data.length };

                if(requests.length > 15) {

                    tabs.match          = getTabsMatch(responses[0].data, responses[1].data, 'TAB: ').all;
                    details.match       = getItemDetailsMatch(responses[2].data, responses[3].data, responses[4].data, responses[5].data, 'DET: ').all;
                    grid.match          = getGridMatch(responses[6].data.fields, responses[7].data.fields, 'GRD: ').all;
                    managed.match       = getManagedItemsMatch(responses[8].data, responses[9].data, 'AFF: ').all;
                    bom.match           = getBOMTabMatch(responses[10].data, responses[11].data, 'BOM: ').all;
                    relationships.match = getWorkspaceRelationshipsMatch(responses[12].data, responses[13].data, 'REL: ').all;
                    printViews.match    = getPrintViewsMatch(responses[14].data.links, responses[15].data.links, 'APV: ').all;
                    behaviors.match     = getPrintViewsMatch(responses[16].data.scripts, responses[17].data.scripts, 'BEH: ').all;
                    states.match        = getWorkflowStatesMatch(responses[18].data.states, responses[19].data.states, 'WFL: ').all;
                    transistions.match  = getWorkflowTransitionsMatch(responses[20].data, responses[21].data, 'TRS: ').all;

                    details.count       = responses[3].data.length
                    grid.count          = (responses[6].data === '') ? 0 : responses[6].data.fields.length;
                    managed.count       = responses[8].data.length;
                    bom.count           = responses[10].data.length;
                    relationships.count = responses[12].data.length;
                    printViews.count    = responses[14].data.links.length;
                    behaviors.count     = responses[16].data.scripts.length;
                    states.count        = responses[18].data.states.length;
                    transistions.count  = responses[20].data.length;
 
                } else {

                    grid.count = (responses[2].data === '') ? 0 : responses[2].data.fields.length;

                }

                let elemRow    = $('.row-workspace:eq(' + index + ')');

                elemRow.find('.wstabs'       ).html(tabs.count         ).prepend(getComparisonIcon(true, tabs.match)); 
                elemRow.find('.details'      ).html(details.count      ).prepend(getComparisonIcon(true, details.match)); 
                elemRow.find('.grid'         ).html(grid.count         ).prepend(getComparisonIcon(true, grid.match)); 
                elemRow.find('.managed'      ).html(managed.count      ).prepend(getComparisonIcon(true, managed.match)); 
                elemRow.find('.bom'          ).html(bom.count          ).prepend(getComparisonIcon(true, bom.match)); 
                elemRow.find('.relationships').html(relationships.count).prepend(getComparisonIcon(true, relationships.match)); 
                elemRow.find('.apv'          ).html(printViews.count   ).prepend(getComparisonIcon(true, printViews.match)); 
                elemRow.find('.behaviors'    ).html(behaviors.count    ).prepend(getComparisonIcon(true, behaviors.match)); 
                elemRow.find('.states'       ).html(states.count       ).prepend(getComparisonIcon(true, states.match)); 
                elemRow.find('.transitions'  ).html(transistions.count ).prepend(getComparisonIcon(true, transistions.match));

                workspace.completed = true;
                applyContentFilters('comparison-workspaces-filters');
                compareNextWorkspace();

            });

            proceed = false;
            return;

        }

        index++;

    }

    if(proceed) {
        if(update) endComparison(); else compareAllScripts();
    }    

}   
function compareAllScripts(update) {

    if(stopped) return;

    addLogSpacer();
    addLogSeparator();
    addLogEntry('Starting Script Comparison', 'head');    

    compareNextScript(update);

}
function compareNextScript(update) {

    if(stopped) return;

    let proceed = true;
    let index   = 0;

    for(let script of all.scripts) {

        if(!script.completed) {

            let requests = [];

            if(isBlank(script.source.__self__)) {

                addLogEntry(script.uniqueName + ' missing in ' + environments.source.tenantName, 'diff');
                requests.push($.get('/plm/script', { link : script.target.__self__, tenant : environments.target.tenantName, timestamp : timestamp }));

            } else if(isBlank(script.target.__self__)) {

                addLogEntry(script.uniqueName + ' missing in ' + environments.target.tenantName, 'diff');
                requests.push($.get('/plm/script', { link : script.source.__self__, tenant : environments.source.tenantName, timestamp : timestamp}));
                
            } else {
                
                addLogEntry('Comparing script ' + script.uniqueName, 'notice');
                requests.push($.get('/plm/script', { link : script.target.__self__, tenant : environments.target.tenantName, timestamp : timestamp }));
                requests.push($.get('/plm/script', { link : script.source.__self__, tenant : environments.source.tenantName, timestamp : timestamp }));

            }

            Promise.all(requests).then(function(responses) {

                if(responses[0].params.timestamp != timestamp) return;

                let length  = { match : false, count : responses[0].data.code.length      }
                let imports = { match : false, count : responses[0].data.dependsOn.length };

                if(responses.length > 1) {

                    let source  = responses[0];
                    let target  = responses[1];

                    source.importNames = [];
                    target.importNames = [];

                    for(let dependsOn of source.data.dependsOn) source.importNames.push(dependsOn.title);
                    for(let dependsOn of target.data.dependsOn) target.importNames.push(dependsOn.title);

                    imports.match = (source.importNames.toString() === target.importNames.toString());
                    length.match  = (source.data.code              === target.data.code             );

                }

                let elemRow = $('.row-script:eq(' + index + ')');

                elemRow.find('.imports').html(imports.count).prepend(getComparisonIcon(true, imports.match)); 
                elemRow.find('.source' ).html(length.count ).prepend(getComparisonIcon(true,  length.match)); 

                script.completed = true;
                downloadModifiedScript(length.match, imports.match, script.uniqueName, responses)
                applyContentFilters('comparison-scripts-filters');
                compareNextScript(update);

            });
        
            proceed = false;
            return;

        }

        index++;

    }

    if(proceed) {
        if(update) endComparison(); else compareAllPicklists(false);
    }

}
function downloadModifiedScript(lengthsMatch, importsMatch, scriptName, responses) {

    if($('#download-modified-scripts').hasClass('toggle-off')) return;

    if(lengthsMatch) {
        if(importsMatch) return;
    }
    if(responses.length < 2) return;

    downloadModifiedScriptFile(scriptName, ' - SRC - ' + environments.source.tenantName, responses[0].data.code);
    downloadModifiedScriptFile(scriptName, ' - TGT - ' + environments.target.tenantName, responses[1].data.code);

}
async function downloadModifiedScriptFile(scriptName, suffix, code) {

    let fileName   = scriptName + suffix + '.js';
    let dirHandler = await createDirectory(fileHandler, '');
    let fileHandle = await dirHandler.getFileHandle(fileName, { create: true });
    let writable   = await fileHandle.createWritable();

    await writable.write(code);
    await writable.close();

}
function compareAllPicklists(update) {

    if(stopped) return;

    addLogSpacer();
    addLogSeparator();
    addLogEntry('Starting Picklist Comparison', 'head');  
    
    compareNextPicklist(update);

}
function compareNextPicklist(update) {

    if(stopped) return;

    let proceed = true;
    let index   = 0;

    for(let picklist of all.picklists) {

        if(!picklist.completed) {

            let requests = [];

            if(isBlank(picklist.source.uri)) {

                addLogEntry(picklist.name + ' missing in ' + environments.source.tenantName, 'diff');
                requests.push($.get('/plm/picklist-setup', { link : picklist.target.uri, tenant : environments.target.tenantName, timestamp : timestamp }));

            } else if(isBlank(picklist.target.uri)) {

                addLogEntry(picklist.name + ' missing in ' + environments.target.tenantName, 'diff');
                requests.push($.get('/plm/picklist-setup', { link : picklist.source.uri, tenant : environments.source.tenantName, timestamp : timestamp }));
                
            } else {
                
                addLogEntry('Comparing picklist ' + picklist.name, 'notice');
                requests.push($.get('/plm/picklist-setup', { link : picklist.target.uri, tenant : environments.target.tenantName, timestamp : timestamp }));
                requests.push($.get('/plm/picklist-setup', { link : picklist.source.uri, tenant : environments.source.tenantName, timestamp : timestamp }));

            }

            Promise.all(requests).then(function(responses) {

                if(responses[0].params.timestamp != timestamp) return;

                let type   = { match : false, label : (responses[0].data.picklist.view) ? 'Workspace View' : 'Fixed List' };
                let values = { match : false, count : -1 };

                if(responses[0].data.picklist.hasOwnProperty('values')) values.count = responses[0].data.picklist.values.length;

                if(responses.length > 1) {

                    let source  = responses[0].data.picklist;
                    let target  = responses[1].data.picklist;
                    
                    source.listValues = [];
                    target.listValues = [];
                    
                    if(source.hasOwnProperty('values')) {
                        for(let sourceValue of source.values) source.listValues.push(sourceValue.label);
                        source.listValues.sort();
                    }
                    if(target.hasOwnProperty('values')) {
                        for(let targetValue of target.values) target.listValues.push(targetValue.label);
                        target.listValues.sort();
                    }
                    
                      type.match = (source.view === target.view);
                    values.match = (source.listValues.toString() == target.listValues.toString());

                }

                let elemRow    = $('.row-picklist:eq(' + index + ')');
                let elemValues = elemRow.find('.values');              

                elemRow.find('.type'  ).html(type.label).prepend(getComparisonIcon(true, type.match)); 

                if(values.count < 0) {
                    elemValues.html('').prepend(getComparisonIcon(true,  values.match)); 
                } else {
                    elemValues.html(values.count).prepend(getComparisonIcon(true,  values.match)); 
                }

                picklist.completed = true;
                applyContentFilters('comparison-picklists-filters');
                compareNextPicklist(update);

            });
        
            proceed = false;
            return;

        }

        index++;

    }

    if(proceed) {
        if(update) endComparison(); else compareAllRoles();
    }

}
function compareAllRoles(update) {

    if(stopped) return;

    addLogSpacer();
    addLogSeparator();
    addLogEntry('Starting Role Comparison', 'head');   
    
    compareNextRole(update);
}
function compareNextRole(update) {

    if(stopped) return;

    let proceed = true;
    let index   = 0;

    for(let role of all.roles) {

        if(!role.completed) {

            let permissions  = { match : false, count : 0};

            if(isBlank(role.source.uri)) {

                addLogEntry(role.name + ' missing in ' + environments.source.tenantName, 'diff');
                permissions.count = role.target.permissions.permission.length;

            } else if(isBlank(role.target.uri)) {

                addLogEntry(role.name + ' missing in ' + environments.target.tenantName, 'diff');
                permissions.count = role.source.permissions.permission.length;
                
            } else {
                
                addLogEntry('Comparing picklist ' + role.name, 'notice');
                permissions.count = role.source.permissions.permission.length;

            }

            let listSource = [];
            let listTarget = [];

            for(let permission of role.source.permissions.permission) listSource.push(permission.title);
            for(let permission of role.target.permissions.permission) listTarget.push(permission.title);

            permissions.match = (listSource.toString() == listTarget.toString());
            
            let elemRow = $('.row-role:eq(' + index + ')');

            elemRow.find('.permissions').html(permissions.count ).prepend(getComparisonIcon(true,  permissions.match)); 

            role.completed = true;
            applyContentFilters('comparison-roles-filters');
            compareNextRole(update);
        
            proceed = false;
            return;

        }

        index++;

    }

    if(proceed) {
        if(update) endComparison(); else endComparison();
    }

}