let environments = { 
    source    : { workspace : {}, workspaces : [], scripts : {}, picklists : [] },
    target    : { workspace : {}, workspaces : [], scripts : {}, picklists : [] },
    picklists : [],
    scripts   : [],
    libraries : []
}


$(document).ready(function() {

    $('#source-tenant').val(tenant);

    setUIEvents();
    insertMenu();

    validateSystemAdminAccess(function(isAdmin) {

        if(isAdmin) {

            appendOverlay(false);
            getWorkspaces('source');
        
            if(!isBlank(options)) {
                if(options.length > 0) {
                    $('#target-tenant').val(options[0]);
                    getWorkspaces('target');
                }
            }

        }

    });

});


function setUIEvents() {

    $('#source-tenant').keydown(function (e) {
        if (e.keyCode == 13) {
            getWorkspaces('source');
        }
    });
    $('#target-tenant').keydown(function (e) {
        if (e.keyCode == 13) {
            getWorkspaces('target');
        }
    });

    $('#source-workspaces').on('change', function() {
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

}


// Set workspace selectors for both tenants
function getWorkspaces(id) {

    let tenantName = $('#' + id + '-tenant').val();

    if(tenantName === '') return;

    $('#overlay').show();

    let elemSelect = $('#' + id + '-workspaces');
        elemSelect.children().remove();

    $.get('/plm/workspaces', { tenant : tenantName }, function(response) {

        environments[id].workspaces = response.data.items;

        sortArray(environments[id].workspaces, 'title');
        
        for(let workspace of environments[id].workspaces) {
            $('<option></option>').appendTo(elemSelect)
                .attr('value', workspace.systemName)
                .html(workspace.title);
        }

        if(id === 'target') $('#comparison-start').removeClass('disabled');
        $('#overlay').hide();

        if(id === 'target') {
            $('#target-workspaces').val($('#source-workspaces').val());
        }

    });

}


// Add Report Contents
function addReportHeader(icon, label) {

    let elemParent = $('#report-content');
    let elemHeader = $('<div></div>').appendTo(elemParent).addClass('report-header');

    $('<div></div>').appendTo(elemHeader).addClass('icon').addClass(icon);
    $('<div></div>').appendTo(elemHeader).addClass('label').html(label);

}
function addReportDetail(section, label, match) {

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

    $('#console-content').html('');
    $('.result-summary').html('');
    $('.result-actions').html('');
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

    environments.source.picklists = [];
    environments.target.picklists = [];
    environments.picklists        = [];
    environments.scripts          = [];
    environments.libraries        = [];

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
function endComparison() {
    
    $('#comparison-start').removeClass('disabled');
    $('#comparison-stop').addClass('disabled');
    $('#comparison-report').removeClass('disabled');

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

        $('#summary-settings').html('Workspace type : ' + getWorkspaceTypeLabel(environments.source.workspace.type));

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
            addActionEntry({ step : step, text : 'Change workspace type to <b>' +  getWorkspaceTypeLabel(environments.source.workspace.type) + '</b>', url : url});
            match = false;
            matches.type = false;
        }

        addReportDetail('Workspace Type', getWorkspaceTypeLabel(environments.source.workspace.type), matches.type);
        addReportDetail('Workspace Name', dataSource.name, matches.name);
        addReportDetail('Category Name', dataSource.category.name, matches.category);

        if(match) {
            addLogEntry('Workspace settings match', 'match');
            $('#result-settings').addClass('match');
        } else {
            addLogEntry('Workspace settings do not match', 'diff');
            $('#result-settings').addClass('diff');
        }

        compareWorkspaceTabs();

    });

}
function getWorkspaceTypeLabel(type) {

    let label = '';

    switch(type) {

        case '1': label = 'Basic'; break;
        case '2': label = 'With Workflow'; break;
        case '6': label = 'Revision Controlled'; break;
        case '7': label = 'Revisioning Workspace'; break;

    }

    return label;

}


// STEP #2
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

        let tabsSource    = responses[0].data;
        let tabsTarget    = responses[1].data;
        let match         = true;
        let matchNames    = true;
        let matchSequence = true;
        let matchCount    = true;
        let url           = '/admin#section=setuphome&tab=workspaces&item=tabsedit&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
        let step          = 'tabs';
        
        for(let tabTarget of tabsTarget) tabTarget.hasMatch = false;

        for(let tabSource of tabsSource) {

            let matchTab    = false;
            let labelSource = (isBlank(tabSource.name)) ? tabSource.key : tabSource.name;
            let indexSource = (tabsSource.indexOf(tabSource) + 1);
            let matches     = {
                names    : true,
                sequence : true
            }

            for(let tabTarget of tabsTarget) {

                if(tabSource.actionName === tabTarget.actionName) {
                    
                    matchTab           = true;
                    tabTarget.hasMatch = true;
                    let labelTarget    = (isBlank(tabTarget.name)) ? tabTarget.key : tabTarget.name;

                    if(labelSource !== labelTarget) {
                        matchNames = false;
                        matches.names = false;
                        addActionEntry({
                            step : step,
                            text : 'Rename tab <b>' + labelTarget + '</b> to <b>' + labelSource + '</b>',
                            url  : url
                        });
                    }

                    if(tabSource.displayOrder !== tabTarget.displayOrder) {
                        matchSequence = false;
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
                match = false;
                addLogEntry('Tab <b>' + labelSource + '</b> is not available');
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
                matchCount = false; 
                let labelTarget = (isBlank(tabTarget.name)) ? tabTarget.key : tabTarget.name;
                addActionEntry({
                    step : step,
                    text : 'Hide tab <b>' + labelTarget + '</b> for all user roles',
                    url  : url
                });
            }
        }

        if(!matchNames)    { match = false; addLogEntry('Workspace tabs names do not match'); }
        if(!matchSequence) { match = false; addLogEntry('Workspace tabs sequence does not match'); }
        if(!matchCount)    { match = false; addLogEntry('Tenant ' + environments.target.tenantName + ' uses additional tabs'); }

        $('#summary-tabs').html(' Tabs : ' + tabsSource.length);

        if(match) {
            addLogEntry('Workspace tabs match', 'match');
            $('#result-tabs').addClass('match');
        } else {
            addLogEntry('Workspace tabs do not match', 'diff');
            $('#result-tabs').addClass('diff');
        }

        compareItemDetailsTab();

    });

}


// STEP #3
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

        let url             = '/admin#section=setuphome&tab=workspaces&item=itemdetails&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22D%22}';
        let step            = 'details';
        let sectionsSource  = responses[0].data;
        let fieldsSource    = responses[1].data;
        let sectionsTarget  = responses[3].data;
        let fieldsTarget    = responses[4].data;
        let match           = true;
        let matches         = {
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

        environments.source.picklists = responses[2].data.list.picklist;
        environments.target.picklists = responses[5].data.list.picklist;

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
                                    // fieldTarget.index   = index++;
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
                match = false;
                addLogEntry('Section ' + sectionSource.name + ' is not available in ' + environments.target.tenantName);
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
                    match = false;
                    addLogEntry('Field ' + fieldSource.name + ' (' + id + ') is not available in ' + environments.target.tenantName);
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

        if(!matches.sectionsDescriptions) { match = false; addLogEntry('Descriptions of sections do not match');}
        if(!matches.sectionsOrder)        { match = false; addLogEntry('The display order of sections does not match');}
        if(!matches.sectionsCollapsed)    { match = false; addLogEntry('The collapsed option does not match for all sections');}
        if(!matches.sectionsLocked)       { match = false; addLogEntry('The Workflow Locking option does not match for all sections');}
        if(!matches.sectionsFieldsCount)  { match = false; addLogEntry('The number of fields within the sections does not matach');}
        if(!matches.sectionsMatrixes)     { match = false; addLogEntry('The matrixes in the sections do not match');}
        if( matches.sectionsExtra)        { match = false; addLogEntry('There are additional sections in ' + environments.target.tenantName);}

        if(!matches.fieldsNames)              { match = false; addLogEntry('Field names do not match');}
        if(!matches.fieldsDescriptions)       { match = false; addLogEntry('Field descriptions do not match');}
        if(!matches.fieldsTypes)              { match = false; addLogEntry('Field Types do not match');}
        if(!matches.fieldsPreview)            { match = false; addLogEntry('Field visibility in preview does not match');}
        if(!matches.fieldsUoM)                { match = false; addLogEntry('Field units of measures do not match');}
        if(!matches.fieldsPicklists)          { match = false; addLogEntry('Field picklist settings do not match');}
        if(!matches.fieldsLength)             { match = false; addLogEntry('Field Length do not match');}
        if(!matches.fieldsDisplay)            { match = false; addLogEntry('Field Display Widths do not match');}
        if(!matches.fieldsVisibility)         { match = false; addLogEntry('Field visibility settings do not match');}
        if(!matches.fieldsEditability)        { match = false; addLogEntry('Field editability settings do not match');}
        if(!matches.fieldsDefaults)           { match = false; addLogEntry('Field default values do not match');}
        if(!matches.fieldsFormulas)           { match = false; addLogEntry('Computed fields definition does not match');}
        if(!matches.fieldsValidations)        { match = false; addLogEntry('Field validations do not match');}
        if(!matches.fieldsValidationSettings) { match = false; addLogEntry('Field validation variables do not match');}
        if(!matches.fieldsSections)           { match = false; addLogEntry('Fields are in different sections');}
        if(!matches.fieldsOrder)              { match = false; addLogEntry('Fields display order does not match');}
        if( matches.fieldsExtra)              { match = false; addLogEntry('There are additional fields in ' + environments.target.tenantName);}

        $('#summary-details').html(' Sections : ' + sectionsSource.length + ' / Fields : ' + fieldsSource.length);

        if(match) {
            addLogEntry('Workspace Item Details match', 'match');
            $('#result-details').addClass('match');
        } else {
            addLogEntry('Workspace Item Details do not match', 'diff');
            $('#result-details').addClass('diff');
        }

        compareGridTab();

    });

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


// STEP #4
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

        let url           = '/admin#section=setuphome&tab=workspaces&item=grid&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22G%22}';
        let step          = 'grid';
        let index         = 1;
        let gridSource    = (responses[0].data === '') ? [] : responses[0].data.fields;
        let gridTarget    = (responses[1].data === '') ? [] : responses[1].data.fields;
        let match         = true;
        let matches       = {
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

                    if(colSource.name !== colTarget.name) {
                        matches.names = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Rename grid field ' + colTarget.label + ' to <b>' + colSource.name + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    if(colSource.type.title !== colTarget.type.title) {
                        matches.titles = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Change type of grid field ' + colTarget.label + ' to <b>' + colSource.type.title + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    if(colSource.picklist !== colTarget.picklist) {
                        matches.picklists = false;
                        reportMatch             = false;
                        let text                = '';
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
                        reportMatch = false;
                        addActionEntry({
                            text : 'Change field length of grid field ' + colTarget.label + ' to <b>' + colSource.fieldLength + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    if(colSource.displayLength !== colTarget.displayLength) {
                        matches.displayLengths = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Change display length of grid field ' + colTarget.label + ' to <b>' + colSource.displayLength + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    if(colSource.visibility !== colTarget.visibility) {
                        matches.visibility = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Change visibility of grid field ' + colTarget.label + ' to <b>' + colSource.visibility + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    if(colSource.editability !== colTarget.editability) {
                        matches.editability = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Change editability of grid field ' + colTarget.label + ' to ' + getFieldEditabilityLabel(colSource.editability),
                            step : step,
                            url  : url
                        });
                    }

                    if(colSource.defaultValue !== colTarget.defaultValue) {
                        matches.defaultValues = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Change default value of grid field ' + colTarget.label + ' to <b>' + colSource.defaultValue + '</b>',
                            step : step,
                            url  : url
                        });
                    }
                    if(index !== colTarget.index) {
                        matches.order = false;
                        reportMatch = false;
                        addActionEntry({
                            text : 'Field ' + colTarget.label + ' is at position <b>' + colTarget.index + '</b> but should be at <b>' + index + '</b>',
                            step : step,
                            url  : url
                        });
                    }

                    // if(tabSource.displayOrder !== tabTarget.displayOrder) {
                    //     matchSequence = false;
                    //     addActionEntry({
                    //         text : 'Move tab ' + labelTarget + ' to position ' + tabSource.displayOrder,
                    //         url  : url
                    //     });
                    // }

                    break;

                }

            }

            if(!hasMatch) {
                match = false;
                addLogEntry('Grid field ' + colSource.name + ' is not available in ' + environments.target.tenantName);
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

        if(!matches.names)          { match = false; addLogEntry('Grid field names do not match');}
        if(!matches.titles)         { match = false; addLogEntry('Grid field titles do not match');}
        if(!matches.picklists)      { match = false; addLogEntry('Grid field picklists do not match');}
        if(!matches.fieldLengths)   { match = false; addLogEntry('Grid field lengths do not match');}
        if(!matches.displayLengths) { match = false; addLogEntry('Grid field display lengths do not match');}
        if(!matches.visibility)     { match = false; addLogEntry('Grid field visibility does not match');}
        if(!matches.editability)    { match = false; addLogEntry('Grid field editability does not match');}
        if(!matches.defaultValues)  { match = false; addLogEntry('Grid field default values do not match');}
        if(!matches.order)          { match = false; addLogEntry('Grid fields order does not match');}
        if(!matches.count)          { match = false; addLogEntry('Grid has additional fields');}

        $('#summary-grid').html('Fields : ' + gridSource.length);

        if(match) {
            addLogEntry('Workspace grid fields match', 'match');
            $('#result-grid').addClass('match');
        } else {
            addLogEntry('Workspace grid fields do not match', 'diff');
            $('#result-grid').addClass('diff');
        }

        compareManagedItemsTab();

    });

}


// STEP #5
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

        let url             = '/admin#section=setuphome&tab=workspaces&item=workflowitems&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22L%22}';
        let step            = 'managed';
        let index           = 1;
        let fieldsSource    = (responses[0].data === '') ? [] : responses[0].data;
        let fieldsTarget    = (responses[1].data === '') ? [] : responses[1].data;
        let match           = true;
        let matches         = {
            names           : true,
            descriptions    : true,
            types           : true,
            preview         : true,
            uom             : true,
            picklists       : true,
            length          : true,
            display         : true,
            visibility      : true,
            editability     : true,
            default         : true,
            order           : true,
            extra           : false
        }

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
                match = false;
                addLogEntry('Field ' + fieldSource.name + ' (' + id + ') is not available in ' + environments.target.tenantName);
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

        if(!matches.names)        { match = false; addLogEntry('Managed Items tab field names do not match');}
        if(!matches.descriptions) { match = false; addLogEntry('Managed Items tab field descriptions do not match');}
        if(!matches.types)        { match = false; addLogEntry('Managed Items tab field Types do not match');}
        if(!matches.preview)      { match = false; addLogEntry('Managed Items tab field visibility in preview does not match');}
        if(!matches.uom)          { match = false; addLogEntry('Managed Items tab field units of measures do not match');}
        if(!matches.picklists)    { match = false; addLogEntry('Managed Items tab field picklists do not match');}
        if(!matches.length)       { match = false; addLogEntry('Managed Items tab field Length do not match');}
        if(!matches.display)      { match = false; addLogEntry('Managed Items tab field Display Widths do not match');}
        if(!matches.visibility)   { match = false; addLogEntry('Managed Items tab field visibility settings do not match');}
        if(!matches.editability)  { match = false; addLogEntry('Managed Items tab field editability settings do not match');}
        if(!matches.default)      { match = false; addLogEntry('Managed Items tab field default values do not match');}
        if(!matches.order)        { match = false; addLogEntry('Managed Items tab fields display order does not match');}
        if( matches.extra)        { match = false; addLogEntry('There are additional Managed Items tab fields in ' + environments.target.tenantName);}

        $('#summary-managed').html('Fields : ' + fieldsSource.length);

        if(match) {
            addLogEntry('Managed Items tab fields match', 'match');
            $('#result-managed').addClass('match');
        } else {
            addLogEntry('Managed Items tab fields do not match', 'diff');
            $('#result-managed').addClass('diff');
        }
        
        compareBOMTab();

    });

}


// STEP #6
function compareBOMTab() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Bill of Materials Tab comparison', 'head');

    let requests = [
        $.get('/plm/bom-views-and-fields', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/bom-views-and-fields', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let url             = '/admin#section=setuphome&tab=workspaces&item=bom&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22,%22metaType%22:%22B%22}';
        let step            = 'bom';
        let viewsSource    = (responses[0].data === '') ? [] : responses[0].data;
        let viewsTarget    = (responses[1].data === '') ? [] : responses[1].data;
        let fieldsTarget   = [];
        let fieldsSource   = [];
        let countBOMFields = 0;
        let match           = true;
        let matches         = {
            viewsDefault        : true,
            viewsFields         : true,
            viewsExtra          : false,
            fieldsNames         : true,
            fieldsUoM           : true,
            fieldsPicklist      : true,
            fieldsLength        : true,
            fieldsDisplay       : true,
            fieldsVisibility    : true,
            fieldsEditability   : true,
            fieldsDefault       : true,
            fieldsFormula       : true,
            fieldsViews         : true,
            fieldsExtra         : false,
            fieldsViewsExtra    : false
        }

        for(let viewTarget of viewsTarget) {
            viewTarget.hasMatch = false;
            for(let viewField of viewTarget.fields) {
                let fieldMatch = false;
                for(let targetField of fieldsTarget) {
                    if(targetField.fieldId === viewField.fieldId) {
                        fieldMatch = true;
                        targetField.views.push({ name : viewTarget.name, order : viewField.displayOrder, displayName : viewField.displayName, hasMatch : false });
                        break;
                    }
                }
                if(!fieldMatch) {
                    viewField.views    = [{ name : viewTarget.name, order : viewField.displayOrder, displayName : viewField.displayName, hasMatch : false }];
                    viewField.label    = '<b>' + viewField.name + ' (' + viewField.fieldId + ')</b>';
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
                match = false;
                addLogEntry('BOM view ' + viewSource.name + ' is not available in ' + environments.target.tenantName);
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

                if(fieldSource.fieldId === fieldTarget.fieldId) {
                        
                    hasMatch             = true;
                    fieldTarget.hasMatch = true;

                    if(isBOMField) {

                        countBOMFields++;

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

            if(!hasMatch) {
                match = false;
                let views = [];
                for(let view of fieldSource.views) views.push(view.name);
                addLogEntry('BOM field ' + fieldSource.label + ' is not available in ' + environments.target.tenantName);
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
                // pare bom views

            }
        }

        if(!matches.viewsDefault)      { match = false; addLogEntry('Default Bill of Materials view does not match'); }
        if(!matches.viewsFields)       { match = false; addLogEntry('The number of fields does not match in all BOM views'); }
        if( matches.viewsExtra)        { match = false; addLogEntry('There are additional BOM views in ' + environments.target.tenantName); }
        if(!matches.fieldsNames)       { match = false; addLogEntry('BOM fields names do not match');}
        if(!matches.fieldsUoM)         { match = false; addLogEntry('BOM fields units of measure do not match');}
        if(!matches.fieldsPicklist)    { match = false; addLogEntry('BOM fields picklists do not match');}
        if(!matches.fieldsLength)      { match = false; addLogEntry('BOM fields lengths do not match');}
        if(!matches.fieldsDisplay)     { match = false; addLogEntry('BOM fields display widths do not match');}
        if(!matches.fieldsVisibility)  { match = false; addLogEntry('BOM fields visibility settings do not match');}
        if(!matches.fieldsEditability) { match = false; addLogEntry('BOM fields editability settings do not match');}
        if(!matches.fieldsDefault)     { match = false; addLogEntry('BOM fields default values settings do not match');}
        if(!matches.fieldsFormula)     { match = false; addLogEntry('BOM fields computed fields do not match');}
        if(!matches.fieldsViews)       { match = false; addLogEntry('BOM views fields do not match');}
        if( matches.fieldsExtra)       { match = false; addLogEntry('There are additional BOM fields in ' + environments.target.tenantName);}
        if( matches.fieldsViewsExtra)  { match = false; addLogEntry('There are BOM views with additional BOM fields in ' + environments.target.tenantName);}

        $('#summary-bom').html('BOM Views : ' + viewsSource.length + ' / BOM Fields : ' + countBOMFields);

        if(match) {
            addLogEntry('Bill of Materials view and fields match', 'match');
            $('#result-bom').addClass('match');
        } else {
            addLogEntry('Bill of Materials view and fields do not match', 'diff');
            $('#result-bom').addClass('diff');
        }

        compareWorkspaceRelationships();

    });

}


// STEP #7
function compareWorkspaceRelationships() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Start Workspace Relationships comparison', 'head');
    addReportHeader('icon-link', 'Workspace Relationships');

    let requests = [
        $.get('/plm/workspace-relationships', { wsId : environments.source.workspace.wsId, type : 'relationships', tenant : environments.source.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.source.workspace.wsId, type : 'project',       tenant : environments.source.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.source.workspace.wsId, type : 'managed',       tenant : environments.source.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.source.workspace.wsId, type : 'bom',           tenant : environments.source.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.target.workspace.wsId, type : 'relationships', tenant : environments.target.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.target.workspace.wsId, type : 'project',       tenant : environments.target.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.target.workspace.wsId, type : 'managed',       tenant : environments.target.tenantName }),
        $.get('/plm/workspace-relationships', { wsId : environments.target.workspace.wsId, type : 'bom',           tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let match   = true;
        let url     = '/admin#section=setuphome&tab=workspaces&item=relationship&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
        let step    = 'relationships';
        let matches = {
            rel : true,
            prj : true,
            bom : true,
            aff : true
        }

        matches.rel = compareWorkspaceRelationship(responses[0].data.workspaces, responses[4].data.workspaces, url, step, 'Relationships');
        matches.prj = compareWorkspaceRelationship(responses[1].data.workspaces, responses[5].data.workspaces, url, step, 'Project');
        matches.aff = compareWorkspaceRelationship(responses[2].data.workspaces, responses[6].data.workspaces, url, step, 'Managed Items');
        matches.bom = compareWorkspaceRelationship(responses[3].data.workspaces, responses[7].data.workspaces, url, step, 'Bill of Materials');

        if(!matches.rel) { match = false; addLogEntry('Related workspaces in tab Relationships do not match'); }
        if(!matches.prj) { match = false; addLogEntry('Related workspaces in tab Project Management do not match'); }
        if(!matches.aff) { match = false; addLogEntry('Related workspaces in tab Managed Items do not match'); }
        if(!matches.bom) { match = false; addLogEntry('Related workspaces in tab Bill of Materials do not match'); }

        $('#summary-relationships').html('Relationships : ' + (responses[0].data.workspaces.length + responses[1].data.workspaces.length + responses[2].data.workspaces.length + responses[3].data.workspaces.length));

        if(match) {
            addLogEntry('Workspace relationships match', 'match');
            $('#result-relationships').addClass('match');
        } else {
            addLogEntry('Workspace relationships do not match', 'diff');
            $('#result-relationships').addClass('diff');
        }

        comparePrintViews();

    });

}
function compareWorkspaceRelationship(relSource, relTarget, url, step, label) {

    let result = true;

    for(let source of relSource) {
        
        let hasMatch = false;
        
        for(let target of relTarget) {
            if(source.link === target.link) hasMatch = true;
        }

        if(!hasMatch) {
            result = false;
            addActionEntry({ text : 'Enable relationships to workspace <b>' + source.title + '</b> in tab <b>' + label + '</b>', step : step, url  : url });
        }

        addReportDetail(label, source.title, hasMatch);

    }

    for(let target of relTarget) {
    
        let hasMatch = false;
    
        for(let source of relSource) {
            if(source.link === target.link) hasMatch = true;
        }

        if(!hasMatch) {
            result = false;
            addActionEntry({ text : 'Remove relationships to workspace <b>' + target.title + '</b> in tab <b>' + label + '</b>', step : step, url  : url });
        }
        
    }

    return result;

}


// STEP #8
function comparePrintViews() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Managed Items Tab comparison', 'head');
    addReportHeader('icon-printer', 'Advanced Print Views');

    let requests = [
        $.get('/plm/workspace-print-views', { wsId : environments.source.workspace.wsId, tenant : environments.source.tenantName }),
        $.get('/plm/workspace-print-views', { wsId : environments.target.workspace.wsId, tenant : environments.target.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let url         = '/admin#section=setuphome&tab=workspaces&item=advancedPrintViewList&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
        let step        = 'print';
        let listSource  = (responses[0].data === '') ? [] : responses[0].data.links;
        let listTarget  = (responses[1].data === '') ? [] : responses[1].data.links;
        let match       = true;
        let matches     = {
            hidden : true,
            list   : true,
            extra  : false
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
                match = false;
                matches.list = false;
                addLogEntry('Advanced print view ' + source.title + ' is not available in ' + environments.target.tenantName);
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

        if(!matches.hidden) { match = false; addLogEntry('The visisbility setting of print views does not match'); }
        if(!matches.list)   { match = false; addLogEntry('There are print views missing in ' + environments.target.tenantName); }
        if( matches.extra)  { match = false; addLogEntry('There are print views in ' + environments.target.tenantName); }

        $('#summary-print').html('Views : ' + listSource.length);

        if(match) {
            addLogEntry('Advanced Print Views match', 'match');
            $('#result-print').addClass('match');
        } else {
            addLogEntry('Advanced Print Views do not match', 'diff');
            $('#result-print').addClass('diff');
        }
        
        compareBehaviors();

    });

}


// STEP #9
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
        let match       = true;
        let url         = '/admin#section=setuphome&tab=workspaces&item=behavior&params={%22workspaceID%22:%22' + environments.target.workspace.wsId + '%22}';
        let step        = 'behaviors';
        let matches = {
            create : true,
            edit   : true,
            demand : true
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

        if(!matches.create) { match = false; addLogEntry('Workspace on create scripts do not match'); }
        if(!matches.edit)   { match = false; addLogEntry('Workspace on edit scripts do not match'); }
        if(!matches.demand) { match = false; addLogEntry('Workspace on demand scripts do not match'); }

        let summary = '';
        
        if(!isBlank(scriptNames.source.create)) summary += 'onCreate';
        if(!isBlank(scriptNames.source.edit)  ) summary += ' onEdit';
        
        summary += ' onDemand:' + scriptNames.source.demand.length;

        $('#summary-behaviors').html(summary);

        if(match) {
            addLogEntry('Workspace behaviors match', 'match');
            $('#result-behaviors').addClass('match');
        } else {
            addLogEntry('Workspace behaviors do not match', 'diff');
            $('#result-behaviors').addClass('diff');
        }

        compareWorkflowStates();

    });

}


// STEP #10
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

        let url         = '/admin#section=setuphome&tab=workspaces';
        let step        = 'states';
        let listSource  = responses[0].data.states;
        let listTarget  = responses[1].data.states;
        let match       = true;
        let matches     = {
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
            let layout   = source.coordinateX + ',' + source.coordinateY + ',' + source.height + ',' + source.width;

            for(let target of listTarget) {

                if(source.customLabel === target.customLabel) {
                    
                    hasMatch        = true;
                    reportMatch     = true;
                    target.hasMatch = true;
                    source.label    = '<b>' + source.name + ' (' + source.customLabel + ')</b>';

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
                        if(stateSource.locked) addActionEntry({ 
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
                        if(stateSource.managed) addActionEntry({ 
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
                match = false;
                addActionEntry({ 
                    text  : 'Add state ' + source.label + ' to the workflow', 
                    steap : step,
                    url   : url });
            }

            addReportDetail(source.customLabel, source.name, reportMatch);

        }

        for(let target of listTarget) {
            if(!target.hasMatch) {
                match = false;
                extra = true;
                addActionEntry({ 
                    text : 'Remove state ' + target.label + ' from the workflow in ' + environments.target.tenantName, 
                    step : step,
                    url  : url
                });
            }
        }

        if(!matches.names  ) { match = false; addLogEntry('Workflow State Names do not match'); }
        if(!matches.locked ) { match = false; addLogEntry('Workflow Lock State does not match'); }
        if(!matches.managed) { match = false; addLogEntry('Workflow Managed State does not match'); }
        if( matches.extra  ) { match = false; addLogEntry('There are additional workflow states in '+ environments.target.tenantName); }
        if(!matches.layout ) addLogEntry('Workflow Layout does not match');

        $('#summary-states').html('States : ' + listSource.length);

        if(match) {
            addLogEntry('Workspace Workflow States match', 'match');
            $('#result-states').addClass('match');
        } else {
            addLogEntry('Workspace Workflow States do not match', 'diff');
            $('#result-states').addClass('diff');
        }

        compareWorkflowTransistions();

    });

}


// STEP #11
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

        let url         = '/admin#section=setuphome&tab=workspaces';
        let step        = 'transitions';
        let listSource  = responses[0].data;
        let listTarget  = responses[1].data;
        let match       = true;
        let matches     = {
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

            // if(!isBlank(target.conditionScript )) { if(!environments.target.scripts.condition.includes( target.conditionScript )) environments.target.scripts.condition.push(target.conditionScript);  }
            // if(!isBlank(target.validationScript)) { if(!environments.target.scripts.validation.includes(target.validationScript)) environments.target.scripts.validation.push(target.validationScript); }
            // if(!isBlank(target.actionScript    )) { if(!environments.target.scripts.action.includes(    target.actionScript    )) environments.target.scripts.action.push(target.actionScript);     }

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
                match = false;
                let from = (isBlank(source.fromState)) ? 'start node' : 'node <b>' + source.fromState.title + '</b>';
                addActionEntry({ text : 'Add transition <b>' + source.name + ' (' + source.customLabel + ')</b> from ' + from + ' to node <b>' + source.toState.title + '</b>', step : step, url  : url });
            }

            addReportDetail(source.customLabel, source.name, reportMatch);

        }

        for(let target of listTarget) {
            if(!target.hasMatch) {
                match = false;
                matches.extra = true;
                addActionEntry({ text : 'Remove transition ' + target.label + ' from the workflow', step : step, url : url });
            }
        }

        if(!matches.fromState)   { match = false; addLogEntry('Workflow Transitions nodes do not match'); }
        else if(!matches.toState)  { match = false; addLogEntry('Workflow Transition nodes do not match'); }
        if(!matches.name) { match = false; addLogEntry('Workflow Transition names do not match'); }
        if(!matches.description) { match = false; addLogEntry('Workflow Transition descriptions do not match'); }
        if(!matches.hidden) { match = false; addLogEntry('Workflow Transition visibility does not match'); }
        if(!matches.permission) { match = false; addLogEntry('Workflow Transition permissions do not match'); }
        if(!matches.conditionScript) { match = false; addLogEntry('Workflow Transition condition scripts do not match'); }
        if(!matches.validationScript) { match = false; addLogEntry('Workflow Transition validation scripts do not match'); }
        if(!matches.actionScript) { match = false; addLogEntry('Workflow Transition action scripts do not match'); }
        if(!matches.sendEMail) { match = false; addLogEntry('Workflow Transition owner notdifications do not match'); }
        if(!matches.showInOutstanding) { match = false; addLogEntry('Workflow Transition outstanding work entries do not match'); }
        if(!matches.notifyPerformers) { match = false; addLogEntry('Workflow Transition notifications do not match'); }
        if(!matches.passwordEnabled) { match = false; addLogEntry('Workflow Transition password settings do not match'); }
        if(!matches.comments) { match = false; addLogEntry('Workflow Transition comments do not match'); }
        if(!matches.saveStepLabel) { match = false; addLogEntry('Workflow Transition save step labels do not match'); }
        if( matches.extra) { match = false; addLogEntry('There are additional transitions in ' + environments.target.tenantName); }

        $('#summary-transitions').html('Transitions : ' + listSource.length);

        if(match) {
            if(!matches.layout ) addLogEntry('Workflow Layout does not match');
            addLogEntry('Workspace Workflow Transitions match', 'match');
            $('#result-transitions').addClass('match');
        } else {
            addLogEntry('Workspace Workflow Transitions do not match', 'diff');
            $('#result-transitions').addClass('diff');
        }

        comparePicklists();

    });

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


// STEP #14
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

            comparePermissions();

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
            addActionEntry({ text : 'Remove value <b>' + target.label + '</b> from list <b>' + targetPicklist.label + '</b>', step : step, url  : urlPicklist });
        }
    }

    return match;

}


// STEP #13
function comparePermissions() {

    if(stopped) return;

    addLogSeparator();
    addLogEntry('Starting Roles comparison', 'head');
    addReportHeader('icon-released', 'Permissions (Roles)');

    let requests = [
        $.get('/plm/roles', { tenant : environments.source.tenantName }),
        $.get('/plm/roles', { tenant : environments.target.tenantName }),
        $.get('/plm/permissions-definition', { tenant : environments.source.tenantName })
    ]

    Promise.all(requests).then(function(responses) {

        let url         = '/admin#section=adminusers&tab=roles';
        let step        = 'roles';
        let definitions = responses[2].data.list.permission;
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

                        for(let permTarget of target.permissions.permission) {
                            if(permission.id === permTarget.id) {
                                match = true;
                                permTarget.hasMatch = true;
                                break;
                            }
                        }

                        if(!match) {
                            let label = getPermissionLabel(definitions, permission.id);
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
                            text : 'Remove permission <b>' + getPermissionLabel(definitions, permission.id) + '</b> from role <b>' + target.name + '</b>', 
                            step : step,
                            url  : url
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

        compareScriptSources();

    });

}
function getPermissionLabel(definitions, id) {

    let label = '';

    for(let definition of definitions) {
        if(definition.id === id) {
            label = definition.shortName
            break;
        }
    }

    return label;

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
                    url  : '/script.form?ID=' + source.params.link.split('/').pop()
                });
            }

            if(source.importNames.toString() !== target.importNames.toString()) {
                matches.libraries = false;
                reportMatch = false;
                let text = (source.importNames.length === 0) ? 'Remove all imports from script <b>' + source.data.uniqueName + '</b>' : 'Script <b>' + source.data.uniqueName + '</b> must import the following scripts (only): <b>' + source.importNames.toString() + '</b>';
                addActionEntry({ 
                    text : text, 
                    step : step,
                    url  : '/script.form?ID=' + source.params.link.split('/').pop()
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
                            url  : '/script.form?ID=' + source.params.link.split('/').pop()
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