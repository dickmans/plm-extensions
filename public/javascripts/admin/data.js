let maxRequestsCount = 25;
let wsConfig         = {};
let options          = {};
let run              = {};
let records          = null;


// let actions = [
//     // { id : 'replace-owner', class : 'permisson-edit'   , title : 'Replace Owner', subtitle : "Update selected field values" },
//     { id : 'bom-pin'      , class : 'permisson-edit'   , title : 'Change BOM Pin', subtitle : "Enables or disables the pin of all BOM children" },
// ]


$(document).ready(function() {

    setUIEvents();
    insertMenu();

    validateSystemAdminAccess(function(isAdmin) {

        if(isAdmin) {

            let requests = [
                $.get('/plm/workspaces', {}),
                $.get('/plm/users',      {}),
                $.get('/plm/groups',     {})
            ]
        
            getFeatureSettings('items', requests, function(responses) {
                setWorkspaces(responses[0]);
                setUserSelectors(responses[1]);
                setGroupSelectors(responses[2]);
            });

        }
    });

});

function setUIEvents() {

    // Filter Panel
    $('#workspace').on('change', function() { 
        updatefilters();
    });
    $('#workspace-view').on('change', function() { 
        setFilters();
    });
    $('.filter select').on('change', function() { 
        if($(this).attr('id') !== 'properties') {
            getMatches();
        }
    });
    $('.filter .inputs input').on('change', function() { 
        getMatches();
    });
    $('#properties').on('change', function() { 
        insertPropertyFilter() 
    });


    // Actions
    $('.action').click(function() {
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        run.actionId  = $(this).attr('id');
    });
    $('#select-set-value').on('change', function() {

        $('#select-set-value').siblings().addClass('hidden');

        let elemSelected = $(this).children('option:selected');
        let type         = elemSelected.attr('data-type');
        let picklist     = elemSelected.attr('data-picklist');

        switch(type) {
            case 'Date'             : $('#input-set-value').removeClass('hidden').attr('type', 'date'); break;
            case 'Check Box'        : $('#input-set-value').removeClass('hidden').attr('type', 'checkbox'); break;
            case 'Single Selection' : $('#plist-set-value').removeClass('hidden'); setPicklistValues($('#plist-set-value'), picklist); break;
            default                 : $('#input-set-value').removeClass('hidden').removeAttr('type'); break;
        }
    });
    $('#select-perform-transition').on('change', function() {
        let comments = $(this).children('option:selected').attr('data-comments');
        switch(comments) {
            case 'REQUIRED' : 
            case 'OPTIONAL' : $('#input-perform-transition').removeClass('hidden'); break;
            default         : $('#input-perform-transition').addClass('hidden'); break;
        }
    });


    // Common Options
    $('#save-text').on('change', function() {
        if($(this).val() === '--') $('#save-text-value').addClass('hidden');
        else $('#save-text-value').removeClass('hidden');
    });
    $('.toggle').click(function() {
        $(this).toggleClass('filled').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off');
    })


    // Header Toolbar Controls
    $('#clear-console').click(function() {
        $('#console-content').html('');
    });
    $('#test-run').click(function() {
        if($(this).hasClass('disabled')) return;
        $(this).toggleClass('filled').toggleClass('icon-toggle-on').toggleClass('icon-toggle-off');
    });
    $('#start').click(function() {
        if($(this).hasClass('disabled')) return;
        validateInputs();
    });
    $('#stop').click(function() {
        if(!$(this).hasClass('red')) return;
        addLogStopped(); 
        addLogSeparator();
        endProcessing();
    });

}


// During startup retrieve all workspaces and users
function setWorkspaces(response) {

    sortArray(response.data.items, 'title');

    let elemSelect = $('#workspace');

    for(let workspace of response.data.items) {

        $('<option></option>').appendTo(elemSelect)    
            .html(workspace.title)
            .attr('value', workspace.link);

    }

    updatefilters();

}
function setUserSelectors(response) {

    sortArray(response.data.items, 'displayName');

    $('.select-user').each(function() {

        let isAction = $(this).closest('.action').length > 0;
        let label    = (isAction) ? 'Select User' : 'Any';

        if(typeof $(this).attr('data-empty-label') !== 'undefined') label = $(this).attr('data-empty-label');

        $('<option></option>').appendTo($(this))
            .html(label)
            .attr('value', '--');

        for(let user of response.data.items) {

            $('<option></option>').appendTo($(this))
                .attr('data-id', user.userId)
                .attr('data-login', user.loginName)
                .attr('value', user.displayName)
                .html(user.displayName);
            
        }

    });

}
function setGroupSelectors(response) {

    sortArray(response.data.items, 'shortName');

    $('.select-group').each(function() {

        let isAction = $(this).closest('.action').length > 0;
        let label    = (isAction) ? 'Select Group' : 'Any';

        if(typeof $(this).attr('data-empty-label') !== 'undefined') label = $(this).attr('data-empty-label');

        $('<option></option>').appendTo($(this))
            .html(label)
            .attr('value', '--');

        for(let group of response.data.items) {

            $('<option></option>').appendTo($(this))
                .attr('value', group.__self__)
                .html(group.shortName);
            
        }

    });

}


// When selecting workspace, enable matching filters
function updatefilters() {

    wsConfig.link = $('#workspace').val();
    wsConfig.name = $('#workspace').children('option:selected').html();
    stopped       = false;

    addLogSeparator();
    addLogEntry('Selected workspace ' + wsConfig.name, 'head');
    
    let requests = [
        $.get('/plm/workspace'  , { link : wsConfig.link }),
        $.get('/plm/permissions', { link : wsConfig.link }),
        $.get('/plm/sections'   , { link : wsConfig.link }),
        $.get('/plm/fields'     , { link : wsConfig.link }),
        $.get('/plm/workspace-scripts'        , { link : wsConfig.link }),
        $.get('/plm/workspace-workflow-states', { link : wsConfig.link }),
        $.get('/plm/tableaus'     , { link : wsConfig.link }),
        $.get('/plm/workspace-workflow-transitions', { link : wsConfig.link }),
        $.get('/plm/workspace-lifecycle-transitions', { link : wsConfig.link })
    ];

    $('#overlay').show();
    $('#workspace-view').children().remove();
    $('.ws-type-2').addClass('hidden');
    $('.ws-type-6').addClass('hidden');
    $('.permission-archive').addClass('hidden');
    $('.permission-edit').addClass('hidden');
    $('.permission-summary').addClass('hidden');
    $('.permission-attachments').addClass('hidden');
    $('.permission-bom-view').addClass('hidden');
    $('.permission-lifecycle').addClass('hidden');
    $('.select-status').children().remove();
    $('.select-script').children().remove();
    $('.select-field').children().remove();
    $('#filter-properties').addClass('hidden');
    $('.property-filter').remove();
    $('#save-text-value').addClass('hidden');
    $('#export-attachments-link').html('All Files will be stored in folder ' + wsConfig.name + ' Files. This folder will be created on the server once the first file gets downloaded.<p><a class="button" target="_blank" href="/storage/exports/' + wsConfig.name + ' Files">Open Folder</a></p>');

    $('.select-user' ).each(function() { $(this).val('--'); });
    $('.select-group').each(function() { $(this).val('--'); });

    Promise.all(requests).then(function(responses) {

        wsConfig.type        = responses[0].data.type.split('/').pop();
        wsConfig.permissions = responses[1].data;
        wsConfig.sections    = responses[2].data;
        wsConfig.fields      = [];
        wsConfig.scripts     = responses[4].data.scripts;
        wsConfig.states      = responses[5].data.states;
        wsConfig.views       = responses[6].data;
        wsConfig.transitions = responses[7].data;
        wsConfig.lifecycles  = responses[8].data;

        for(let field of responses[3].data) {
            if(field.name !== null) wsConfig.fields.push(field);
        }

        sortArray(wsConfig.fields     , 'name' );
        sortArray(wsConfig.states     , 'name' );
        sortArray(wsConfig.views      , 'title');
        sortArray(wsConfig.transitions, 'name' );
        sortArray(wsConfig.lifecycles , 'name' );
    
        $('#overlay').hide();
        $('#filter-properties').removeClass('hidden');

        switch(wsConfig.type) {

            case '2': // Workflow
            case '7': // Revisioning
            case '8': // Suppliers
                $('.ws-type-2').removeClass('hidden');
                break;

            case '6': // Revision Controlled
                $('.ws-type-6').removeClass('hidden');
                break;

        }

        for(let permission of responses[1].data) {

            let permissionLabel = permission.name.split('.shortname.')[1];

            switch(permissionLabel) {
                case 'edit_items'        : $('.permission-edit'       ).removeClass('hidden'); break;
                case 'delete_items'      : $('.permission-archive'    ).removeClass('hidden'); break;
                case 'delete_attachments': $('.permission-attachments').removeClass('hidden'); break;
                case 'view_bom'          : $('.permission-bom-view').removeClass('hidden'); break;
                case 'view_owner_and_change_summary_section': $('.permission-summary').removeClass('hidden'); break;
            }

        }

        setWorkspaceViewSelector();
        setWorkflowStateSelectors();
        setWorkflowTransitionSelectors();
        setLifecycleTransitionSelectors();
        setPropertySelectors();
        setScriptSelectors();
        getMatches();

    });

}
function setWorkspaceViewSelector() {

    let elemSelect = $('#workspace-view');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', '--')
        .html('None, use the filters below');

    for(let view of wsConfig.views) {

        $('<option></option>').appendTo(elemSelect)
            .attr('value', view.link)
            .html(view.title);

    }

    $('#filter-view').removeClass('hidden');

}
function setWorkflowStateSelectors() {

    $('.select-status').each(function() {

        let elemSelect = $(this);

        $('<option></option>').appendTo(elemSelect)
            .attr('value', '--')
            .html('Any');

        for(let status of wsConfig.states) {

            $('<option></option>').appendTo(elemSelect)
                .attr('value', status.name)
                .html(status.name + ' (' + status.customLabel + ')');

        }

    });

}
function setWorkflowTransitionSelectors() {

    $('.select-transition').each(function() {

        let elemSelect = $(this);
            elemSelect.children().remove();

        $('<option></option>').appendTo(elemSelect)
            .attr('value', '--')
            .html('Select Workflow Transition');

        for(let transition of wsConfig.transitions) {

            $('<option></option>').appendTo(elemSelect)
                .attr('data-comments', transition.comments)
                .attr('value', transition.__self__)
                .html(transition.name + ' (' + transition.customLabel + ') to state ' + transition.toState.title);

        }

    });

}
function setLifecycleTransitionSelectors() {

    $('.select-lifecycle').each(function() {

        let elemSelect = $(this);
            elemSelect.children().remove();

        $('<option></option>').appendTo(elemSelect)
            .attr('value', '--')
            .html('Select Lifeycle Transition');

        if(wsConfig.type == "6") {
            for(let lifecycle of wsConfig.lifecycles) {

                $('<option></option>').appendTo(elemSelect)
                    .attr('value', lifecycle.__self__)
                    .html(lifecycle.name + ' ( ' + lifecycle.fromState.title + ' >> ' + lifecycle.toState.title + ' )');

            }
        }

    });

}
function setScriptSelectors() {

    $('.select-script').each(function() {

        let elemSelect = $(this);
        let label      = 'Select Script';

        if(typeof elemSelect.attr('data-empty-label') !== 'undefined') label = elemSelect.attr('data-empty-label');

        $('<option></option>').appendTo(elemSelect)
            .attr('value', '--')
            .html(label);

        for(let script of wsConfig.scripts) {

            $('<option></option>').appendTo(elemSelect)
                .attr('value', script.__self__)
                .html(script.uniqueName);

        }

    });

}
function setPropertySelectors() {

    $('.select-field').each(function() {

        let elemSelect     = $(this);
        let onlyDateFields = elemSelect.hasClass('field-type-date');
        let onlyTextFields = elemSelect.hasClass('field-type-text');
        let onlyCheckboxes = elemSelect.hasClass('field-type-check');
        let onlyEditable   = elemSelect.hasClass('field-editable');
        let label          = 'Select Field';

        if(typeof $(this).attr('data-empty-label') !== 'undefined') label = $(this).attr('data-empty-label');

        $('<option></option>').appendTo(elemSelect)
            .attr('value', '--')
            .html(label);

        for(let field of wsConfig.fields) {

            let fieldId = field.__self__.split('/').pop();
            let type    = field.type.title;
            let add     = true;

            field.id = fieldId;

            if(onlyDateFields) { if(type !== 'Date') add = false; }
            if(onlyTextFields) { if(type !== 'Single Line Text') add = false; }
            if(onlyCheckboxes) { if(type !== 'Check Box') add = false; }
            if(onlyEditable)   { if(field.editability !== 'ALWAYS') add = false; }
            if(onlyEditable)   { if(type === 'Multiple Selection') add = false; }

            if(add) {
                

                $('<option></option>').appendTo(elemSelect)
                    .attr('value', fieldId)
                    .attr('data-type', field.type.title)
                    .attr('data-picklist', field.picklist)
                    .html(field.name + ' (' + fieldId + ')');
                
            }
        }

    });

}
function insertPropertyFilter() {

    let value = $('#properties').val();

    for(let field of wsConfig.fields) {

        if(field.id === value) {
            
            let elemFilter = $('<div></div>').appendTo($('#filter-properties'))
                .addClass('property-filter')
                .addClass('filter')
                .attr('data-id', field.id);
            
            let elemFilterName = $('<div></div>').appendTo(elemFilter)
                .addClass('property-name')

            $('<div></div>').appendTo(elemFilterName)
                .addClass('property-label')
                .addClass('label')
                .html(field.name);

            $('<div></div>').appendTo(elemFilterName)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-delete')
                .click(function() {
                    $(this).closest('.property-filter').remove();
                    getMatches();
                });

            let elemValue = $('<div></div>').appendTo(elemFilter)
                .addClass('property-value')
                .addClass('value');

            let elemSelect = $('<select></select').appendTo(elemValue)
                .addClass('button')
                .attr('id', 'fieldid-' + field.id)
                .attr('data-type', field.type.title)
                .attr('data-field-id', field.id)
                .on('change', function() { 
                    getMatches()
                });
                
            $('<option></option>').appendTo(elemSelect)
                .attr('value', '--')
                .html('Any Value');   

            if(field.type.title === 'Check Box') {

                $('<option></option>').appendTo(elemSelect).attr('value', 'it').html('True');  
                $('<option></option>').appendTo(elemSelect).attr('value', 'if').html('False');  

            } else {

                $('<option></option>').appendTo(elemSelect).attr('value', 'ib').html('Is Blank');  
                $('<option></option>').appendTo(elemSelect).attr('value', 'nb').html('Is Not Blank');  

                switch(field.type.title) {

                    case 'Single Line Text':
                        $('<option></option>').appendTo(elemSelect).attr('value', 'text-is').html('Is');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'text-sw').html('Starts With');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'text-ew').html('Ends With');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'text-co').html('Contains');
                        $('<option></option>').appendTo(elemSelect).attr('value', 'text-dn').html('Does Not Contain');  
                        $('<input></input>').appendTo(elemValue).attr('placeholder', 'Enter Text').addClass('hidden').on('change', function() { getMatches(); });
                        break;

                    case 'Date':
                        $('<option></option>').appendTo(elemSelect).attr('value', 'to').html('Today');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'nt').html('Not Today');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'tw').html('This Week');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'tm').html('This Month');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'ty').html('This Year');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'lw').html('Last Week');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'lm').html('Last Month');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'ly').html('Last Year');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'nw').html('Next Week');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'nm').html('Next Month');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'ny').html('Next Year');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'et').html('Equal To');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'ne').html('Not Equal To');  
                        $('<option></option>').appendTo(elemSelect).attr('value', '-d').html('In Last Number Of Days');  
                        $('<option></option>').appendTo(elemSelect).attr('value', '+d').html('In Next Number Of Days');  
                        $('<option></option>').appendTo(elemSelect).attr('value', 'bw').html('Between');  
                        let elemInputs = $('<div></div>').appendTo(elemValue).addClass('inputs');
                        $('<input></input>').appendTo(elemInputs).attr('type', 'date').addClass('hidden').addClass('date-1').on('change', function() { getMatches(); });
                        $('<input></input>').appendTo(elemInputs).attr('type', 'date').addClass('hidden').addClass('date-2').on('change', function() { getMatches(); });
                        $('<input></input>').appendTo(elemInputs).attr('type', 'number').addClass('hidden').addClass('number').attr('placeholder', '# of days').on('change', function() { getMatches(); });
                        break;

                }

            }

        }
    }

    $('#properties').val('--');

}
function setFilters() {

    let elemSelect = $('#workspace-view');
    let value      = elemSelect.val();
    let groups     = elemSelect.closest('.group').nextAll();

    if(value === '--') {

        groups.each(function() {

            let elemGroup = $(this);

            if(elemGroup.hasClass('ws-type-2')) {
                     if(wsConfig.type == 2) elemGroup.removeClass('hidden');
                else if(wsConfig.type == 7) elemGroup.removeClass('hidden');
            } else if(elemGroup.hasClass('ws-type-6')) {
                if(wsConfig.type == 6) elemGroup.removeClass('hidden');
            } else {
                elemGroup.removeClass('hidden');
            }

        });

    } else {
        groups.addClass('hidden');
    }

}


// Upon filter selection run query to get matching records count
function getMatches() {

    let elemSelectWSView = $('#workspace-view');
    let timestamp        = new Date().getTime();
    let params           = {
        timestamp  : timestamp,
        workspace  : $('#workspace').children('option:selected').html()
    }

    if(elemSelectWSView.val() === '--') {
        
        let filters   = getSearchFilters();
        stopped       = false;

        params.link     = $('#workspace').val();
        params.pageSize = 1;
        params.filter   = filters;
        params.fields   = [ 'DESCRIPTOR' ];
        params.sort     = [ 'DESCRIPTOR' ];

        $.post('/plm/search', params, function(response) {
            if(timestamp !== params.timestamp) return;
            addLogEntry('There are ' + (response.data.totalResultCount || 0)+ ' matching records in workspace ' + response.params.workspace);
        });

    } else {

        params.link = elemSelectWSView.val();

        $.get('/plm/tableau-data', params, function(response) {
            if(timestamp !== params.timestamp) return;
            addLogEntry('There are ' + (response.data.total || 0)+ ' matching records in workspace ' + response.params.workspace);
        });
        
    }

}   
function getSearchFilters() {

    let filters = [];

    $('.filter select').each(function() {

        let elemSelect  = $(this);
        let elemFilter  = $(this).closest('.filter');
        let filterId    = elemSelect.attr('id');
        let filterValue = elemSelect.children('option:selected').val();

        elemFilter.find('input').addClass('hidden');
        elemSelect.siblings('.inputs').addClass('hidden');
        
        if(!isBlank(filterValue)) {
            if(filterValue !== '--') {

                let filter = { value : '' };

                switch(filterValue) {

                    case 'et': 
                    case 'ne': 
                        elemSelect.siblings('.inputs').removeClass('hidden');
                        elemFilter.find('input.date-1').removeClass('hidden'); 
                        break;

                    case 'bw': 
                        elemSelect.siblings('.inputs').removeClass('hidden');
                        elemFilter.find('input.date-1').removeClass('hidden'); 
                        elemFilter.find('input.date-2').removeClass('hidden'); 
                        break;

                    case '-d': 
                    case '+d': 
                        elemSelect.siblings('.inputs').removeClass('hidden');
                        elemFilter.find('input.number').removeClass('hidden'); 
                        break;

                    default:
                        break;

                }

                if(filterValue.indexOf('text-') === 0) {
                    elemSelect.siblings().removeClass('hidden');
                }

                switch(filterId) {

                    case 'creation':
                        filter = getDateFilter(elemSelect, 3, filterValue);
                        if(filterValue === 'bw') {
                            filters.push(getDateFilter(elemSelect, 3, 'br'));
                        }
                        break;
                        
                    case 'modification':
                        filter = getDateFilter(elemSelect, 3, filterValue);
                        if(filterValue === 'bw') {
                            filters.push(getDateFilter(elemSelect, 3, 'br'));
                        }
                        break;

                    case 'creator':
                        filter.field        = 'CREATED_BY_USERID';
                        filter.type         =  3;
                        filter.comparator   =  15;
                        filter.value        = filterValue;
                        break;

                    case 'modifier':
                        filter.field        = 'LAST_MODIFIED_BY';
                        filter.type         =  3;
                        filter.comparator   =  15;
                        filter.value        = filterValue;
                        break;

                    case 'owner':
                        filter.field        = 'OWNER_USERID';
                        filter.type         =  3;
                        filter.comparator   =  15;
                        filter.value        = filterValue;
                        break;

                    case 'not-owner':
                        filter.field        = 'OWNER_USERID';
                        filter.type         =  3;
                        filter.comparator   =  5;
                        filter.value        = filterValue;
                        break;

                    case 'status-in':
                        filter.field        = 'WF_CURRENT_STATE';
                        filter.type         = 1;
                        filter.comparator   = 15;
                        filter.value        = filterValue;
                        break;

                    case 'status-ex':
                        filter.field        = 'WF_CURRENT_STATE';
                        filter.type         = 1;
                        filter.comparator   = 5;
                        filter.value        = filterValue;
                        break;

                    case 'release':
                        filter.field = 'WORKING';
                        filter.type  = 10;
                        if(filterValue === 'w') filter.comparator =  13;
                        else if(filterValue === 'r') filter.comparator =  14;
                        break;

                    case 'revision':
                        filter.field      = 'LATEST_RELEASE';
                        filter.type       = 10;
                        filter.comparator = 13
                        break;

                    default:
                        if(elemSelect.attr('data-type') === 'Date') {
                            filter = getDateFilter(elemSelect, 0, filterValue);
                            if(filterValue === 'bw') {
                                filters.push(getDateFilter(elemSelect, 0, 'br'));
                            }
                        } else {
                            filter = getPropertyFilter(elemSelect, filterValue);
                        }
                        break;

                }

                if(!isBlank(filter)) filters.push(filter);

            }
        }

    });

    return filters;

}
function getDateFilter(elemSelect, fieldType, filterValue) {

    let fieldId = elemSelect.attr('data-field-id');

    let filter = {
        field : fieldId,
        type  : fieldType,
        value : ''
    };

    let date       = new Date();
    let dateToday  = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
    let date1      = '';
    let date2      = '';
    let elemInputs = elemSelect.siblings('.inputs');

    let valueDay1 = elemInputs.children('.date-1').val();
    let valueDay2 = elemInputs.children('.date-2').val();
    let valueDays = elemInputs.children('.number').val();

    if(valueDay1 !== '') { 
        let d1 = new Date(valueDay1); 
        date1  = d1.getFullYear() + '/' + (d1.getMonth() + 1) + '/' + d1.getDate();
    }

    if(valueDay2 !== '') { 
        let d2 = new Date(valueDay2); 
        date2  = d2.getFullYear() + '/' + (d2.getMonth() + 1) + '/' + d2.getDate();
    }

    switch(filterValue) {
        
        case 'to': filter.comparator = 24; filter.value = ''; break;
        case 'tw': filter.comparator = 25; filter.value = ''; break;
        case 'tm': filter.comparator = 28; filter.value = ''; break;
        case 'ty': filter.comparator = 31; filter.value = ''; break;
        case 'lw': filter.comparator = 26; filter.value = ''; break;
        case 'lm': filter.comparator = 29; filter.value = ''; break;
        case 'ly': filter.comparator = 32; filter.value = ''; break;
        case 'nw': filter.comparator = 27; filter.value = ''; break;
        case 'nm': filter.comparator = 30; filter.value = ''; break;
        case 'ny': filter.comparator = 33; filter.value = ''; break;
        case 'ib': filter.comparator = 22; filter.value = ''; break;
        case 'nb': filter.comparator = 23; filter.value = ''; break;
        
        case 'nt': filter.comparator = 17; filter.value = dateToday; break;

        case 'et': if(valueDay1 !== '') { filter.comparator = 16; filter.value = date1;     } else filter = null; break;
        case 'ne': if(valueDay1 !== '') { filter.comparator = 17; filter.value = date1;     } else filter = null; break;
        case '-d': if(valueDays !== '') { filter.comparator = 34; filter.value = valueDays; } else filter = null; break;
        case '+d': if(valueDays !== '') { filter.comparator = 35; filter.value = valueDays; } else filter = null; break;
        case 'bw': if(valueDay1 !== '') { filter.comparator = 18; filter.value = date1;     } else filter = null; break;
        case 'br': if(valueDay2 !== '') { filter.comparator = 19; filter.value = date2;     } else filter = null; break;  // Upper range of between

    }

    return filter;

}
function getPropertyFilter(elemSelect, filterValue) {

    let filter = {
        field : elemSelect.attr('data-field-id'),
        type  : 0,
        value : ''
    };

    let elemInput = elemSelect.next('input');

    if(elemInput.length > 0) filter.value = elemInput.val();

    switch(filterValue) {

        case 'it': filter.comparator = 13; break;
        case 'if': filter.comparator = 14; break;

        case 'ib': filter.comparator = 20; break;
        case 'nb': filter.comparator = 21; break;
        
        case 'text-is': filter.comparator = 15; break;
        case 'text-sw': filter.comparator =  3; break;
        case 'text-ew': filter.comparator =  4; break;
        case 'text-co': filter.comparator =  2; break;
        case 'text-dn': filter.comparator =  5; break;

    }

    return filter;

}


// Update picklist value selectors
function setPicklistValues(elemSelect, link) {

    elemSelect.children().remove();

    let timestamp = new Date().getTime();

    $.get('/plm/picklist', { link : link, timestamp : timestamp }, function(response) {

        if(response.params.timestamp != timestamp) return;

        sortArray(response.data.items, 'title');

        for(let item of response.data.items) {

            $('<option></option>').appendTo(elemSelect)
                .attr('value', item.link)
                .html(item.title);

        }

    });

}


// Perform the selected action on the matching records
function validateInputs() {

    let elemAction = $('.action.selected');
    let proceed    = true;

    if(elemAction.length === 0) { 
        proceed = false;  addLogEntry('Cannot start, no action is selected', 'error') 
    } else {
        if(elemAction.attr('id') === 'add-owner') {
            if($('#select-add-owner-user').val() === '--') {
                if($('#select-add-owner-group').val() === '--') {
                    addLogEntry('Cannot start: Action options are not set', 'error');
                    proceed = false;
                }
            }
        } else if(elemAction.attr('id') === 'remove-owner') {
            if($('#select-remove-owner-user').val() === '--') {
                if($('#select-remove-owner-group').val() === '--') {
                    addLogEntry('Cannot start: Action options are not set', 'error');
                    proceed = false;
                }
            }
        } else if(elemAction.attr('id') !== 'delete-attachments') {
            elemAction.find('select').each(function() {
                if($(this).val() === '--') {
                    addLogEntry('Cannot start: Action options are not set', 'error');
                    proceed = false;
                }
            });
        }
    }

    if(proceed) startProcessing();

}
function startProcessing() {

    $('#stop').addClass('red');
    $('#test-run').addClass('disabled');
    $('#start').addClass('disabled');
    $('#overlay').show();

    options.mode          = $('#mode').val() || 'continue';

    options.includeBOM    = $('#include-bom').val();

    options.saveDate      = $('#save-date'   ).val() || '--';
    options.saveCheck     = $('#save-check'  ).val() || '--';
    options.saveUncheck   = $('#save-uncheck').val() || '--';
    options.saveText      = $('#save-text'   ).val() || '--';
    options.saveClear     = $('#save-clear'  ).val() || '--';

    options.testRun       = $('#test-run').hasClass('icon-toggle-on');
    options.requestsCount = Number($('#requestsCount').val()) || 5;
    options.autoTune      = $('#auto-tune').hasClass('icon-toggle-on');
    options.maxErrors     = $('#maxErrors').val() || 10;
    options.searchSize    = Number($('#pageSize').val()) || 100;

    if(options.requestsCount > maxRequestsCount) options.requestsCount = maxRequestsCount;
    if(options.includeBOM !== '--') options.searchSize = 1;

    run.active       = true;
    run.counter      = 1;
    run.done         = 0;
    run.total        = -1;
    run.success      = 0;
    run.errors       = [];
    run.ids          = [];
    run.storage      = '';

    run.params = {
        pageNo    : 0,
        pageSize  : options.searchSize,
        size      : options.searchSize,
        workspace : $('#workspace').children('option:selected').html()
    }

    stopped = false;

    addLogSpacer();
    addLogSeparator();
    addLogEntry('### START ###', 'head');
    addLogSpacer();

    let view = $('#workspace-view').val();

    if(view === '--') {

        run.url           = '/plm/search';
        run.method        = 'post';
        run.params.link   = $('#workspace').val();
        run.params.filter = getSearchFilters();
        run.params.fields = [ 'DESCRIPTOR' ];
        run.params.sort   = [ 'DESCRIPTOR' ];

        if(run.actionId === 'store-dmsid') run.params.fields.push($('#select-store-dmsid').val());

    } else {

        run.url         = '/plm/tableau-data';
        run.method      = 'get';
        run.params.link = view;
        
    }

    if(run.actionId === 'export-attachments') {
        run.storage = '/storage/exports/' + $('#workspace').children('option:selected').html() + ' Files';
        addLogEntry('Files will be stored at  <a target="_blank" href="' + run.storage + '">' + $('#workspace').children('option:selected').html() + '</a>');
        addLogSpacer();
    }

    getNextRecords();


}
function getNextRecords() {

    run.params.pageNo = (options.mode === 'continue') ? (run.params.pageNo + 1) : 1;
    run.params.page   = run.params.pageNo;

    if(run.errors.length === options.maxErrors) stopped = true;

    if(stopped) return;

    $.ajax({
        url     : run.url,
        type    : run.method,
        data    : run.params, 
        success : function(response) {

            if(run.total < 0) {
                run.total = response.data.totalResultCount || response.data.total;
                $('#progress').removeClass('hidden');
            }

            if(isBlank(run.total)) run.total = 0;

            updateProgress(0);
            setRecordsData(response);

            if(records.length === 0) {
                endProcessing();
            } else {
                if(records.length === 1) addLogEntry('Found next record to process');
                else addLogEntry('Found next ' + records.length + ' records to process');
                processNextRecords();
            }
            
        }
    });

}
function setRecordsData(response) {

    records = response.data.row || response.data.items;

    for(let record of records) {

        if(run.url === '/plm/search') {

            record.link       = wsConfig.link + '/items/' + record.dmsId;
            record.dmsId      = record.dmsId.toString();
            record.descriptor = record.fields.entry[0].fieldData.value;

        } else {

            record.link       = record.item.link;
            record.dmsId      = record.item.link.split('/').pop();
            record.descriptor = record.dmsId;

            for(let field of record.fields) {
                if(field.id === 'DESCRIPTOR') {
                    record.descriptor = field.value;
                    break;
                } 
            }
    

        }

        record.includeBOM = options.includeBOM;
        run.ids.push(record.dmsId);

    }
    
}
function processNextRecords() {

    run.start = new Date().getTime()/1000;
    let limit = (records.length < options.requestsCount) ? records.length : options.requestsCount;

    if(options.includeBOM === 'aa') limit = 1;

    let requests = genRequests(limit);

    if(stopped) return;

    updateProgress(requests.length);

    Promise.all(requests).then(function(responses) {

        let updateRequests = genUpdateRequests(responses);

        Promise.all(updateRequests).then(function(responsesUpdate) {
            
            run.done += limit;
            
            if(stopped) return;

            let completionRequests = (updateRequests.length === 0) ? genCompletionRequests(limit, responses) : genCompletionRequests(limit, responsesUpdate);
            let now  = new Date().getTime()/1000;
            let diff = now - run.start;

            if(records[0].includeBOM === '--') {
                if(run.done === run.total) options.autoTune = false;
            }

            Promise.all(completionRequests).then(function() {

                if(stopped) return;

                if(options.autoTune) {

                    let threshold = (requests.length + updateRequests.length) * diff / 18;
                    let value     = Math.round(diff * 10000) / 10000;
    
                    if(threshold < 1) {
                        if(options.requestsCount < maxRequestsCount) {
                            options.requestsCount++;
                            addLogEntry('Increasing requests count to ' + options.requestsCount + ' (' + value + ' s / request)', 'success');
                        }
                    } else {
                        options.requestsCount--;
                        addLogEntry('Decreasing requests count to ' + options.requestsCount + ' (' + value + ' s / request)', 'notice');
                    }
    
                }

                if(records[0].includeBOM !== '--') {

                    getBOMRecords();

                } else {

                    records.splice(0, limit);

                    if(records.length === 0) {
                        getNextRecords();
                    } else {
                        processNextRecords();
                    }

                }

            });

        });

    });

}
function genRequests(limit) {

    let requests = [];

    for(let i = 0; i < limit; i++) {

        let record = records[i];

        let params = {
            link       : record.link,
            descriptor : record.descriptor,
            sections   : []
        }

        let link    = genItemURL({ link : params.link });
        let message = (options.testRun) ? 'Would process' : 'Processing';

        addLogEntry(message + ' <a target="_blank" href="' + link + '">' + params.descriptor + '</a>', 'notice');

        if((options.testRun) || stopped) {

        } else {

                   if(run.actionId === 'store-dmsid') {

                let fieldId = $('#select-store-dmsid').val();
                let value   = getRecordFieldValue(record, fieldId, '');
                
                if(value != record.dmsId) {
                    addFieldToPayload(params.sections, wsConfig.sections, null, fieldId, record.dmsId);
                    requests.push($.post('/plm/edit', params));
                } else {
                    addLogEntry('Right dmsId is already set for <a target="_blank" href="' + link + '">' + params.descriptor + '</a>', 'notice');
                }
            
            } else if(run.actionId === 'set-value') {

                let type  = $('#select-set-value').children('option:selected').attr('data-type');
                let value = $('#input-set-value').val();

                if(type === 'Check Box') {
                    value = $('#input-set-value').is(":checked")
                } else if(type === 'Single Selection') {
                    value = { link : $('#plist-set-value').val() };
                }

                addFieldToPayload(params.sections, wsConfig.sections, null, $('#select-set-value').val(), value, false);
                requests.push($.post('/plm/edit', params));

            } else if(run.actionId === 'copy-value') {

                requests.push($.get('/plm/details', params));

            } else if(run.actionId === 'clear-field') {

                addFieldToPayload(params.sections, wsConfig.sections, null, $('#select-clear-field').val(), null, false);
                requests.push($.post('/plm/edit', params));

            } else if(run.actionId === 'set-owner') {

                params.owner = $('#select-set-owner').children('option:selected').attr('data-id');
                params.notify = ($('#select-notify-new-owner').val() === 'y');

                requests.push($.post('/plm/set-owner', params));

            } else if(run.actionId === 'add-owner') {

                let user  = $('#select-add-owner-user' ).children('option:selected').attr('data-id');
                let group = $('#select-add-owner-group').val();
                
                if(user  !== '--') params.user  = user;
                if(group !== '--') params.group = group;

                requests.push($.post('/plm/add-owner', params));
            
            } else if(run.actionId === 'remove-owner') {

                let user  = $('#select-remove-owner-user' ).children('option:selected').attr('data-id');
                let group = $('#select-remove-owner-group').val();
                
                if(user  !== '--') params.user  = user;
                if(group !== '--') params.group = group;

                requests.push($.post('/plm/remove-owner', params));

            } else if(run.actionId === 'clear-owners') {

                requests.push($.post('/plm/clear-owners', params));

            } else if(run.actionId === 'export-attachments') {

                params.folder       = $('#workspace').children('option:selected').html() + ' Files';
                params.includeDMSID = $('#select-export-attachments-dmsid').val().toLowerCase();
                params.filenamesIn  = $('#input-export-attachments-in').val().toLowerCase();
                params.filenamesEx  = $('#input-export-attachments-ex').val().toLowerCase();

                requests.push($.post('/plm/export-attachments', params));

            } else if(run.actionId === 'delete-attachments') {

                requests.push($.get('/plm/attachments', params));

            } else if(run.actionId === 'perform-transition') {

                params.transition = $('#select-perform-transition').val();
                let elemComment = $('#input-perform-transition');
                if(!elemComment.hasClass('hidden')) params.comment = elemComment.val();
                requests.push($.get('/plm/transition', params));
            } else if(run.actionId === 'perform-lifecycle-transition') {

                params.transition = $('#select-perform-lifecycle-transition').val();
                let elemRevision = $('#input-perform-lifecycle-transition');
                if(!elemRevision.hasClass('hidden')) params.revision = elemRevision.val();

                console.log(params);

                requests.push($.get('/plm/lifecycle-transition', params));

            } else if(run.actionId === 'run-script') {

                params.script = $('#select-run-script').val();
                requests.push($.get('/plm/run-item-script', params));

            } else if(run.actionId === 'archive') {

                requests.push($.get('/plm/archive', params));

            }

        }

    }

    return requests;
    
}
function getRecordFieldValue(record, fieldId, value) {

    if(isBlank(value)) value = '';

         if(record.hasOwnProperty('rowId' )) value = getSearchResultFieldValue(record, fieldId, '');
    else if(record.hasOwnProperty('fields')) value =  getWorkspaceViewRowValue(record, fieldId, '');

    return value;

}
function genUpdateRequests(responses) {

    let requests = [];

    for(let response of responses) {

        let params = {
            link       : response.params.link,
            descriptor : response.params.descriptor,
            sections   : []
        }

        if(run.actionId === 'copy-value') {

            let value = getSectionFieldValue(response.data.sections, $('#select-copy-from').val(), '');
            let fieldId = $('#select-copy-to').val();

            addFieldToPayload(params.sections, wsConfig.sections, null, fieldId, value, false);

            requests.push($.post('/plm/edit', params));
                
        } else if(run.actionId === 'delete-attachments') {

            if(response.data.length > 0) {

                params.fileIds = [];

                for(let attachment of response.data) {

                    let filename    = attachment.name.toLowerCase();
                    let filenamesIn = $('#input-delete-attachments-in').val().toLowerCase();
                    let filenamesEx = $('#input-delete-attachments-ex').val().toLowerCase();
                    let deleteFile  = false;

                    if((filenamesIn === '') || (filename.indexOf(filenamesIn) < 0)) {
                        if((filenamesEx === '') || (filename.indexOf(filenamesEx) > -1)) {
                            params.fileIds.push(attachment.id); 
                            deleteFile = true;
                        }
                    }

                    if(deleteFile) addLogEntry('DELETING file ' + attachment.name + ' of ' + params.descriptor, 'notice');
                              else addLogEntry('KEEPING  file ' + attachment.name + ' of ' + params.descriptor, 'notice');
                    
                }

                if(params.fileIds.length > 0) requests.push($.get('/plm/delete-attachments', params));

            }

        }

    }

    return requests;

}
function genCompletionRequests(limit, responses) {

    let requests = [];

    for(let i = 0; i < limit; i++) {

        let record  = records[i];
        let success = true;

        for(let response of responses) {

            if(record.link === response.params.link) {

                if(response.error) {

                    success = false;

                    run.errors.push({
                        link       : response.params.link,
                        descriptor : response.params.descriptor
                    });

                    let link = genItemURL({ link : response.params.link });

                    addLogEntry('Error while processing  <a target="_blank" href="' + link + '">' + response.params.descriptor + '</a>', 'error');
                    if(response.message !== '') addLogEntry('Error message: "' + response.message + '"', 'indent');

                }

            }

        }

        if(run.errors.length > options.maxErrors) {
            addLogStoppedByErrors(run.errors);
            endProcessing();
            return [];
        }

        if(success) {
            
            run.success++;;

            let params = {
                link       : record.link,
                sections   : []
            }

            let date = new Date();
            let now  = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

            if(options.saveDate    !== '--') addFieldToPayload(params.sections, wsConfig.sections, null, options.saveDate   , now     );
            if(options.saveCheck   !== '--') addFieldToPayload(params.sections, wsConfig.sections, null, options.saveCheck  , 'true'  );
            if(options.saveUncheck !== '--') addFieldToPayload(params.sections, wsConfig.sections, null, options.saveUncheck, 'false' );
            if(options.saveText    !== '--') addFieldToPayload(params.sections, wsConfig.sections, null, options.saveText   , $('#save-text-value').val() );
            if(options.saveClear   !== '--') addFieldToPayload(params.sections, wsConfig.sections, null, options.saveClear  , null    );

            if(params.sections.length > 0) requests.push($.post('/plm/edit', params));

        }

    }

    return requests;

}
function getBOMRecords() {

    let link   = records[0].link;
    let count  = 0;
    let params = { link : link }

    addLogEntry('Getting BOM items of ' + records[0].descriptor, 'notice');

    switch(records[0].includeBOM) {

        case 'w1': params.depth =  1; params.revisionBias = 'working'; break;
        case 'wa': params.depth = 10; params.revisionBias = 'working'; break;
        case 'r1': params.depth =  1; params.revisionBias = 'release'; break;
        case 'ra': params.depth = 10; params.revisionBias = 'release'; break;
        case 'a1': params.depth =  1; params.revisionBias = 'release'; break;
        case 'aa': params.depth =  1; params.revisionBias = 'release'; break;

    }

    $.get('/plm/bom', params, function(response) {

        let nodesNew = [];

        for(let node of response.data.nodes) {

            let dmsId = node.item.link.split('/').pop();           

            if(!run.ids.includes(dmsId)) {

                count++;
                run.ids.push(dmsId);

                let record = {
                    link        : node.item.link,
                    dmsId       : dmsId,
                    descriptor  : node.item.title,
                };

                switch(records[0].includeBOM) {

                    case 'w1': 
                    case 'wa': 
                    case 'r1': 
                    case 'ra': 
                    case 'a1': record.includeBOM = '--'; break;
                    case 'aa': record.includeBOM = 'aa'; break;
            
                }

                records.push(record);
                nodesNew.push(node);

            }

        }

        addLogEntry(count + ' BOM items added to queue for ' + records[0].descriptor, 'notice');

        run.total += count;

        if(records[0].includeBOM.indexOf('a') === 0) {

            addLogEntry('Getting all revisions of ' +  nodesNew + ' BOM items', 'notice');
            getBOMNodesRevisions(nodesNew, 0, 0);

        } else {

            records.splice(0, 1);
            if(records.length === 0) getNextRecords(); else processNextRecords();

        }

    });

}
function getBOMNodesRevisions(nodesNew, index, count) {

    let remaining   = nodesNew.length - index;
    let limit       = (remaining < options.requestsCount) ? remaining : options.requestsCount;
    let requests    = [];
    let i           = 0;

    for(i; i < limit; i++) {
        let node = nodesNew[index + i];
        requests.push($.get('/plm/versions', { link : node.item.link}));
    }

    Promise.all(requests).then(function(responses) {

        for(let response of responses) {
            for(let version of response.data.versions) {

                let dmsId = version.item.link.split('/').pop();           

                if(!run.ids.includes(dmsId)) {

                    run.ids.push(dmsId);
                    count++;

                    let record = {
                        link        : version.item.link,
                        dmsId       : dmsId,
                        descriptor  : version.item.title,
                    };

                    switch(records[0].includeBOM) {

                        case 'w1': 
                        case 'wa': 
                        case 'r1': 
                        case 'ra': 
                        case 'a1': record.includeBOM = '--'; break;
                        case 'aa': record.includeBOM = 'aa'; break;
                
                    }

                    records.push(record);

                } else {

                    console.log('Skipping duplicate dmsId : ' + dmsId);
                }

            }
        }

        if(nodesNew.length > (index + i)) {

            getBOMNodesRevisions(nodesNew, index + i, count);

        } else {

            addLogEntry(count + ' revs added for ' + records[0].descriptor, 'notice');
            run.total += count;
            records.splice(0, 1);
            if(records.length === 0) getNextRecords(); else processNextRecords();

        }

    });

}
function updateProgress(current) {

    let widthDone    = run.done * 100 / run.total;
    let widthCurrent = current * 100 / run.total;

    $('#progress-done').css('width', widthDone + '%');
    $('#progress-current').css('width', widthCurrent + '%');
    $('#progress-current').css('left', widthDone + '%');
    $('#progress-text').html('Processed ' + run.done + ' of ' + run.total);

}
function endProcessing() {

    if(!run.active) return;

    run.active = false;

    $('#stop').removeClass('red');
    $('#test-run').removeClass('disabled');
    $('#start').removeClass('disabled');
    $('#progress').addClass('hidden');
    $('#overlay').hide();

    addLogSpacer();

    if(!options.testRun) {

        addLogSpacer();
        addLogEntry('SUMMARY', 'head');

        $('<div></div>').appendTo($('#console-content')).addClass('console-spacer');

        let elemTable = $('<table></table>').appendTo($('#console-content'));
        
        insertLogSummaryRow(elemTable, 'Total items to process', run.total);
        insertLogSummaryRow(elemTable, 'Processed items (success and failure)', run.done);
        insertLogSummaryRow(elemTable, 'Successful items', run.success);
        insertLogSummaryRow(elemTable, 'Failed items', run.errors.length);

        $('<div></div>').appendTo($('#console-content')).addClass('console-spacer');

        if(!stopped) {
            if(options.mode === 'continue') {
                if(run.total > run.done) {
                    addLogSpacer();
                    addLogEntry('Not all items were processed');
                    addLogEntry('Did the action possible impact the filter results?');
                    addLogSpacer();
                }
            }
        }

        if(run.errors.length > 0) {
        
            addLogSpacer();
            addLogSpacer();

            addLogEntry('LIST OF FAILED ITEMS', 'head');

            for(let error of run.errors) {
                addLogEntry('<a target="_blank" href="' + genItemURL({ link : error.link}) + '">' + error.descriptor + '</a>', 'error')
            }

            addLogSpacer();

        }

        if(run.actionId === 'export-attachments') {
            addLogSpacer();
            addLogEntry('Files are available at  <a target="_blank" href="' + run.storage + '">' + $('#workspace').children('option:selected').html() + '</a>');
        }

    }

    addLogEnd();
    addLogSeparator();
    addLogSpacer();



    let divElement = document.getElementById('console-content');
        divElement.scrollTop = divElement.scrollHeight

}
function insertLogSummaryRow(elemTable, label, value) {

    let elemRow = $('<tr></tr>').appendTo(elemTable);

    elemRow.append($('<td>' + label + '</td>'));
    elemRow.append($('<td style="text-align:right">' + value + '</td>'));

}