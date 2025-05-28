let wsConfig        = { 'permissions' : { 'workflow' : false } };
let links           = [];
let fields          = [];
let tableSettings   = {};
let formSettings    = {};

$(document).ready(function() {
    
    appendProcessing('workspaces-panel', false);
    appendProcessing('tableau', true);
    appendOverlay(true);

    setUIEvents();
    insertMenu();

    $('#button-toggle-create').hide();

    tableSettings = getPanelSettings('', { id : 'table'}, {}, [
        ['editable'     , true  ],
        ['hideLabels'   , true  ],
        ['hideComputed' , false ],
        ['fieldsIn'     , []    ],
        ['fieldsEx'     , []    ]
    ]);

    formSettings = getPanelSettings('', { id : 'table'}, {}, [
        ['editable'     , true  ],
        ['hideLabels'   , false ],
        ['hideComputed' , false ],
        ['fieldsIn'     , []    ],
        ['fieldsEx'     , []    ]
    ]);

    if(wsId === '') {
        $('#main').hide();
        $('#workspaces').show();
        $('#workspaces-close').hide();
        $('#header-subtitle').hide();
        $('#button-toggle-create').hide();
        showWorkspacesList();
    } else {
        getInitialData();
    }
    
});


// Add Event Listeners for user interactions
function setUIEvents() {

    // Header Toolbar
    $('#button-change-workspace').click(function() {
        $('#workspaces-panel-processing').show();
        $('#workspaces').fadeIn();
        $('#main').fadeOut();
        $('#filter-workspaces').val('');
        $('#button-toggle-create').hide();
        if(wsId !== '') $('#workspaces-close').show();
        showWorkspacesList();
    });
    $('#button-toggle-create').click(function() {
        showCreateDialog();
    });


    // Workspaces Selector
    $('#workspaces-close').click(function() {
        $('#workspaces').fadeOut();
        $('#main').fadeIn();
    });
    $('input#filter-workspaces').keyup(function() {
        filterTiles('filter-workspaces', 'workspaces-list');
    });


    // Tableau Toolbar
    $('#tableau-selector').change(function(e) {
        setTableau();
    });
    $('#filter input').on('change paste keyup', function() {
        filterTableColumns($(this).val(), 'tableau-table')
    });
    $('#select-all').click(function() {
        $('th.table-column:visible').addClass('selected');
        updateToolbar();
    });
    $('#deselect-all').click(function() {
        $('body').removeClass('with-edit');
        $('th').removeClass('selected');
        $('td').removeClass('selected');
        $(this).hide();
        updateToolbar();
    });
    $('#hide-items').click(function() {
        hideSelectedItems();
    });
    $('#show-items').click(function() {
        showSelectedItems();
    });
    $('.toggle-layer').click(function() {
        $('body').toggleClass('hidden-layer');
    });
    $('#workflow-actions').change(function() {
        performWorkflowAction();
    });
    $('#archive').click(function() {
        archiveSelected();
    });
    $('#edit-selected').click(function() {
        $('body').toggleClass('with-edit');
        $('body').removeClass('with-summary');
    });
    $('#save').click(function() {
        saveChanges();
    });


    // Edit Selected Records
    $('#clear-edits').click(function(){ 
        clearFields('edit-fields');
    });
    $('#apply-edits').click(function(){ 
        applyEdits();
    });
    $('#close-edits').click(function(){ 
        $('body').removeClass('with-edit');
    });


    // Workflow Actions Dialog
    $('#perform-workflow-actions').click(function(){ 
        setTransitionsDialog();
    });
    $('#transitions-cancel').click(function(){ 
        $('#transitions').hide();
        $('#overlay').hide();
    });
    $('#transitions-submit').click(function(){ 
        submitTransitions();
    });


}


// Geet basic workspace information and data from PLM
function getInitialData() {

    $('#overlay').show();

    let requests = [
        $.get('/plm/workspace', { wsId : wsId, useCache : true }),
        $.get('/plm/tableaus' , { wsId : wsId }),
        $.get('/plm/sections' , { wsId : wsId, useCache : true }),
        $.get('/plm/fields'   , { wsId : wsId, useCache : true }),
        $.get('/plm/tabs'     , { wsId : wsId, useCache : true })
    ]

    Promise.all(requests).then(function(responses) {

        let name            = responses[0].data.name;
        let elemBtnCreate   = $('#button-toggle-create');
        let elemSelector    = $('#tableau-selector');

        $('#header-subtitle').html(responses[0].data.name);
        $('#tableau-processing').show();
        
        if(name.endsWith('s')) name = name.substring(0, name.length - 1);
        
        elemBtnCreate.html('New ' + name).css('display', 'flex');

        if(responses[0].data.permissions.indexOf('Create') > -1) elemBtnCreate.removeClass('disabled'); else elemBtnCreate.addClass('disabled');
        if(responses[0].data.permissions.indexOf('Delete') <  0) $('#archive').addClass('hidden');

        for(let tab of responses[4].data) {
             if(tab.workspaceTabName === 'WORKFLOW_ACTIONS') {
                wsConfig.permissions.workflow = true;
            }
        }

        wsConfig.name = name;
        wsConfig.tabs = responses[4].data;

        setTabLabels(responses[4].data);
        sortArray(responses[1].data, 'title', 'string', 'descending');

        for(let tableau of responses[1].data) {

            let elemOption = $('<option></option>').prependTo(elemSelector)
                .attr('value', tableau.link)
                .html(tableau.title);

            if(tableau.type === 'DEFAULT')  elemOption.attr('selected', true);

        }

        wsConfig.sections = responses[2].data;
        wsConfig.fields   = responses[3].data;

        $('#overlay').hide();

        getPicklists();

    });

}
function getPicklists() {

    let linksPicklists = [];
    let requests       = [];

    $('#tableau-processing').show();

    for(let field of (wsConfig.fields)) {
        if(field.type !== null) {
            if((field.type.title === 'Single Selection') || (field.type.title === 'Radio Button')) {
                if(linksPicklists.indexOf(field.picklist) < 0) {
                    requests.push($.get( '/plm/picklist', { 
                        link     : field.picklist, 
                        limit    : 100, 
                        offset   : 0,
                        useCache : true
                    }));
                    linksPicklists.push(field.picklist);
                }
            }
        }
    }

    Promise.all(requests).then(function(responses) {
        
        for(let response of responses) cachePicklists.push({
            link : response.params.link,
            data : response.data
        });

        setTableau();

    }) ;

}


// Render workspaces list (i.e. if wsId is empty)
function showWorkspacesList() {

    let elemParent = $('#workspaces-list').html('');

    $.get('/plm/workspaces', { useCache : true }, function(response) {

        sortArray(response.data.items, 'title', 'string', 'ascending');

        for(let workspace of response.data.items) {
            genSingleTile({
                link     : workspace.link,
                title    : workspace.title,
                subtitle : workspace.category.name,
                tileIcon : 'icon-folder'
            })
            .appendTo(elemParent)
            .click(function() {
                let link     = $(this).attr('data-link');
                let id       = link.split('/')[4];
                let location = document.location.href.split('/navigator');
                let url      = location[0] + '/navigator?wsId=' + id;
                document.location.href = url + '&theme=' + theme;
            });
        }

        $('#workspaces-panel-processing').hide();

    });

}


// Render Create Dialog
function showCreateDialog() {

    $('body').removeClass('with-edit');

    insertCreate(null, [wsId], { 
        id            : 'create-dialog',
        headerLabel   : 'Create New ' + wsConfig.name,
        toggles       : true,
        hideComputed  : true, 
        collapsed     : true,
        afterCreation : function(id, link) { setTableau(); }
    });
    
}   


// Render table with data from standard view or workspace view
function setTableau() {

    $('#filter').children('input').val('');

    $('#tableau-empty').hide();  
    $('#tableau-processing').show();  

    let timestamp = new Date().getTime();

    $('#tableau-selector').attr('data-timestamp', timestamp);

    let link = $('#tableau-selector').val();

    let elemHeader = $('#tableau-header');
        elemHeader.html('');
    
    let elemTable = $('#tableau-body');
        elemTable.html('');

    fields = [];

    updateToolbar();

           if(link === 'bookmarks') { getWorkspaceData(elemTable, timestamp, '/plm/bookmarks', 'bookmarks');
    } else if(link === 'recents'  ) { getWorkspaceData(elemTable, timestamp, '/plm/recent', 'recentlyViewedItems');
    } else if(link === 'mow'      ) { getWorkspaceData(elemTable, timestamp, '/plm/mow', 'outstandingWork');
    } else {

        let requests = [
            $.get('/plm/tableau-columns', { link : link, timestamp : timestamp }),
            $.get('/plm/tableau-data'   , { link : link, timestamp : timestamp })
        ];
    
        Promise.all(requests).then(function(responses) {

            if(responses[0].params.timestamp === $('#tableau-selector').attr('data-timestamp')) {

                $('#tableau-processing').hide();

                if(responses[1].data.items.length > 0) {
                    setTableauRows(elemTable, responses[0].data);
                    setTableauColumns(elemTable, responses[1].data.items);
                } else {
                    $('#tableau-empty').show();
                }

            }
    
        });

    }

}
function appendHeaderCell(elemHeaderRow, indexItem, link, descriptor) {

    let elemHeaderCell = $('<th></th>').appendTo(elemHeaderRow)
        .addClass('table-column')
        .addClass('column-' + indexItem)
        .attr('data-index', indexItem)
        .attr('data-link', link);

    let elemHeaderCellTop = $('<div></div>').appendTo(elemHeaderCell)
        .addClass('table-column-top')
        .click(function() {
            selectColumn($(this));
        });

    let elemHeaderCellDescriptor = $('<div></div>').appendTo(elemHeaderCellTop)
        .addClass('table-column-descriptor');

    if(descriptor !== '') {
        let text = descriptor.split(' - ');
        if(text.length > 1) {
            elemHeaderCellDescriptor.append(text[0]).append($('<br>')).append(text[1]);
            elemHeaderCellTop.addClass('multiline');
        } else {
            elemHeaderCellDescriptor.append(text[0]);
            elemHeaderCellTop.removeClass('multiline');
        }
    } else {
        elemHeaderCellDescriptor.html('# ' + (indexItem + 1));
    }

    let elemHeaderCelSelector = $('<div></div>').appendTo(elemHeaderCellTop)
        .addClass('table-column-selector');

    $('<div></div>').appendTo(elemHeaderCelSelector)
        .attr('title', 'Select this record')
        .addClass('icon')
        .addClass('icon-check-box-checked');

    $('<div></div>').appendTo(elemHeaderCelSelector)
        .attr('title', 'Deselect this record')
        .addClass('icon')
        .addClass('icon-check-box');

    let elemHeaderCellToolbar = $('<div></div>').appendTo(elemHeaderCell)
        .addClass('table-column-toolbar');

    $('<div></div>').appendTo(elemHeaderCellToolbar)
        .attr('title', 'Hide this record')
        .addClass('icon')
        .addClass('button')
        .addClass('icon-hide')
        .click(function() {
            let elemHead = $(this).closest('th');
            let index = elemHead.attr('data-index');
            $('.column-' + index).addClass('invisible');
            elemHead.removeClass('selected');
        });

    $('<div></div>').appendTo(elemHeaderCellToolbar)
        .attr('title', 'Unhide this record')
        .addClass('icon')
        .addClass('button')
        .addClass('icon-show')
        .click(function() {
            let elemHead = $(this).closest('th');
            let index = elemHead.attr('data-index');
            $('.column-' + index).removeClass('invisible');
            elemHead.removeClass('selected');
        });

     $('<div></div>').appendTo(elemHeaderCellToolbar)
        .attr('title', 'Compare this record againt the other records in this table using colors')
        .addClass('icon')
        .addClass('button')
        .html('invert_colors')
        .click(function() {
            toggleComparison($(this));
        });

    $('<div></div>').appendTo(elemHeaderCellToolbar)
        .attr('title', 'Open Details Panel to the right for this record')
        .addClass('icon')
        .addClass('button')
        .html('view_sidebar')
        .click(function() {
            setItemSummary($(this).closest('th').attr('data-link'));
        });

    $('<div></div>').appendTo(elemHeaderCellToolbar)
        .attr('title', 'Clone this record')
        .addClass('icon')
        .addClass('button')
        .addClass('icon-clone')
        .click(function() {
            let link = $(this).closest('th').attr('data-link');
            insertClone(link, {
                afterCloning : function(id, link) { setTableau(); }
            });
        });
        
    $('<div></div>').appendTo(elemHeaderCellToolbar)
        .attr('title', 'Open this record in PLM')
        .addClass('icon')
        .addClass('button')
        .html('open_in_new')
        .click(function() {
            openItemByLink($(this).closest('th').attr('data-link'));
        });

    $('<th></th>').appendTo(elemHeaderRow)
        .addClass('table-spacer')
        .addClass('column-' + indexItem);

    links.push(link);

}


// Handle Standard Views (Bookmarks, Recents, MOW)
function getWorkspaceData(elemTable, timestamp, url, key) {

    $.get(url, { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp !== $('#tableau-selector').attr('data-timestamp')) return;

        let requests = [];

        for(let entry of response.data[key]) {
            let link = entry.item.link.split('/');
            if(link[4] === wsId) requests.push($.get('/plm/details', { 'link' : entry.item.link, 'timestamp' : timestamp }));
        }

        if(requests.length === 0) {
            $('#tableau-processing').hide();
            return;
        }

        Promise.all(requests).then(function(responses) {

            if(timestamp !== Number($('#tableau-selector').attr('data-timestamp'))) return;

            if(responses.length > 0) {
                setWorkspacesFields(elemTable);
                setWorkspaceRecords(elemTable, responses);
            }
    
            $('#tableau-processing').hide();
    
        });
    });

}
function setWorkspacesFields(elemTable) {

    for(let section of wsConfig.sections) {

        let elemSection = $('<tr></tr>').appendTo(elemTable)
            .addClass('table-section')
            .html('<td>' + section.name + '</td>');

        for(let sectionField of section.fields) {

            for(let field of wsConfig.fields) {

                if(field.__self__ === sectionField.link) {

                    if(field.visibility !== 'NEVER') {
                        if(field.__self__.indexOf('/MATRIX_BLANK_') < 0) {

                            let elemRow = $('<tr></tr>');
                                elemRow.addClass('table-field');
                                elemRow.attr('data-link', field.__self__);
                                elemRow.appendTo(elemTable);

                            let elemCell = $('<td></td>');
                                elemCell.addClass('first-col');
                                elemCell.addClass('nowrap');
                                elemCell.html(field.name);
                                elemCell.appendTo(elemRow);

                            fields.push(field);
                            // insertField(field, { 'sections': [{ 'fields' : fields }] }, $('#edit-fields'), true, true, true);
                            insertDetailsField(field, { 'sections': [{ 'fields' : fields }] }, $('#edit-fields'), false, formSettings);

                        } else {
                            console.log('matrix');
                        }
                    }

                }
            }

        }

    }

}
function setWorkspaceRecords(elemTable, records) {

    let indexItem     = 0;
    let elemHeader    = $('#tableau-header').html('');
    let elemHeaderRow = $('<tr></tr>').appendTo(elemHeader);

    $('<th></th>').appendTo(elemHeaderRow)
        .addClass('first-col');

    for(let record of records) {

        appendHeaderCell(elemHeaderRow, indexItem, record.data.__self__, record.data.title);

        let index = 0;

        elemTable.children('tr.table-field').each(function() {

            let elemCell = $('<td></td>');
                elemCell.appendTo($(this));
                elemCell.addClass('column-' + indexItem);
                elemCell.addClass('table-field');
                // elemCell.hover(function () {
                //     $('table td:nth-child(' + ($(this).index() + 1) + ')').addClass('hover');
                //     $('table th:nth-child(' + ($(this).index() + 1) + ')').addClass('hover');
                // }, function () {
                //     $('table td:nth-child(' + ($(this).index() + 1) + ')').removeClass('hover');
                //     $('table th').removeClass('hover');
                // });

            // let elemControl = insertField(fields[index], record.data, null, false, false, true, true);
            let elemControl = insertDetailsField(fields[index], record.data, null, tableSettings);

            if(typeof elemControl !== 'undefined') {
                let fieldValue = getFieldValue(elemControl);
                elemControl.appendTo(elemCell);
                elemControl.attr('data-db-value', fieldValue.display);
                elemControl.change(function() {
                    highlightChanges();
                });
            }

            let elemCellSpacer = $('<td></td>');
                elemCellSpacer.addClass('table-spacer');
                elemCellSpacer.addClass('column-' + indexItem);
                elemCellSpacer.appendTo($(this));

            index++;

        });

        indexItem++;

    }

    elemTable.children('tr.table-section').each(function() {
        $(this).children().attr('colspan', 1 + (2 * records.length));
    });


}
function highlightChanges() {

    $('th.table-column').each(function () {

        let elemHeader  = $(this);
        let isChanged   = false;
        let index       = elemHeader.attr('data-index');   

        $('td.table-field.column-' + index).each(function() {

            let elemCell    = $(this);
            let elemField   = elemCell.children('.field-value');

            if(elemField.length > 0) {

                let elemControl = elemField.first();
                let fieldData   = getFieldValue(elemControl);

                if(!elemField.hasClass('readonly')) {
                    if(fieldData.display === elemField.attr('data-db-value')) {
                        elemCell.removeClass('changed');
                    } else {
                        elemCell.addClass('changed');
                        isChanged = true;
                    }
                }
            }

        });

        if(isChanged) elemHeader.addClass('changed'); else elemHeader.removeClass('changed');
        
    });

}


// Handle Workspace Views / Tableaus
function setTableauRows(elemTable, tableauColumns) {
    
    $('#edit-fields').html('');

    for(let tableauColumn of tableauColumns) {

        if(tableauColumn.hasOwnProperty('displayOrder')) {

            if(tableauColumn.field.title !== 'Item Descriptor') {

                let elemRow = $('<tr></tr>').appendTo(elemTable)
                    .addClass('table-field')
                    .attr('data-link', tableauColumn.field.__self__);

                $('<td></td>').appendTo(elemRow)
                    .addClass('first-col')
                    .addClass('nowrap')
                    .html(tableauColumn.field.title);

                if(tableauColumn.field.isSystemField) {
                    fields.push({ 'isSystemField' : true });
                } else {
                    for(let field of wsConfig.fields) {
                        if(field.__self__ === tableauColumn.field.__self__) {
                            fields.push(field);
                            // insertField(field, { 'sections': [{ 'fields' : fields }] }, $('#edit-fields'), true, true, true);
                            insertDetailsField(field, { 'sections': [{ 'fields' : fields }] }, $('#edit-fields'), false, formSettings);

                        }
                    }  
                }
            }

        }

    }

    $('#edit-fields').find('.field-value').each(function() {
        $(this).change(function() {
            applyEdits();
        });
    });

}
function setTableauColumns(elemTable, tableauRecords) {

    let indexItem       = 0;
    let elemHeader      = $('#tableau-header').html('');
    let elemHeaderRow   = $('<tr></tr>').appendTo(elemHeader);

    $('<th></th>').appendTo(elemHeaderRow)
        .addClass('first-col');

    for(let tableauRecord of tableauRecords) {

        let descriptor = '';

        for(let tableauField of tableauRecord.fields) {
            if(tableauField.id === 'DESCRIPTOR') descriptor = tableauField.value;
        }

        appendHeaderCell(elemHeaderRow, indexItem, tableauRecord.item.link, descriptor);

        let index = 0;

        elemTable.children('tr').each(function() {

            let link    = $(this).attr('data-link');
            let fieldId = link.split('/')[8];
            let value   = '';
            
            for(let tableauField of tableauRecord.fields) {
                if(tableauField.id === fieldId) {
                    value = tableauField.value;
                    if(!fields[index].isSystemField) {
                        if(fields[index].type.title === 'Image') {
                            if(value !== '') {
                                let linkItem = tableauRecord.item.link.split('/');
                                tableauField.value = {
                                    'link' : '/api/v2/workspaces/' + linkItem[4] + '/items/' + linkItem[6] + '/field-values/' + fieldId + '/image/' + value
                                }
                            }
                        }
                    }
                    break;
                }
            }

            let elemCell = $('<td></td>').appendTo($(this))
                .addClass('column-' + indexItem)
                .addClass('table-field');
           
            if(fields[index].isSystemField) {

                elemCell.html(value);

            } else {

                // let elemControl = insertField(fields[index], { 'sections': [{ 'fields' : tableauRecord.fields }] }, null, false, false, true, true);

                let elemControl = insertDetailsField(fields[index], { 'sections': [{ 'fields' : tableauRecord.fields }] }, null, false, tableSettings);

                if(typeof elemControl !== 'undefined') {
                    let fieldValue = getFieldValue(elemControl);
                    elemControl.appendTo(elemCell);
                    elemControl.attr('data-db-value', fieldValue.display);
                    elemControl.change(function() {
                        highlightChanges();
                    });
                }

            }

            $('<td></td>').appendTo($(this))
                .addClass('table-spacer')
                .addClass('column-' + indexItem);

            index++;

        });

        indexItem++;

    }

}


// Filter tableau table
function filterTableColumns(value, idTable) {

    let elemTable = $('#' + idTable);

    if(value === '') {
        elemTable.find('th.table-column').show();
        elemTable.find('th.table-spacer').show();
        elemTable.find('td.table-field').show();
        elemTable.find('td.table-spacer').show();
        return;
    }

    elemTable.find('th.table-column').hide();
    elemTable.find('th.table-spacer').hide();
    elemTable.find('td.table-field').hide();
    elemTable.find('td.table-spacer').hide();

    value = value.toLowerCase();

    elemTable.find('.table-column-descriptor').each(function() {

        let text = $(this).html().toLowerCase();

        if(text.indexOf(value) > -1) {

            let index = $(this).closest('th').attr('data-index');
            $('.column-' + index).show();

        }

    });

    elemTable.find('td.table-field').each(function() {

        if($(this).children('.image').length === 0) {

            let field = $(this).children('.field-value').first();
            let text  = field.html().toLowerCase();

            if(field.children('input').length === 1) text = field.children('input').val().toLowerCase();
            else if(field.children('select').length === 1) {
                let elemSelect= field.children('select').first(); 
                text = elemSelect.children('option:selected').text().toLowerCase();
            } else if(field.children('textarea').length === 1) text = field.children('textarea').val().toLowerCase();

            if(text.indexOf(value) > -1) {

                let index = $(this).index();
                    index = elemTable.find('th').eq(index).attr('data-index');

                $('.column-' + index).show();

            }

        }

    });

    elemTable.find('td.first-col').show();
    elemTable.find('th').first().show();

}


// Selection of items using checkeboxes
function selectColumn(elemClicked) {

    let elemItem = elemClicked.closest('th');
    let index    = elemItem.attr('data-index');

    if(elemItem.hasClass('selected')) {
        $('.column-' + index).removeClass('selected');
    } else {
        $('.column-' + index).addClass('selected');
    }

    updateToolbar();

}
function updateToolbar() {

    if($('.table-column.selected').length === 0) {
        $('#deselect-all').hide(); 
        $('#edit-selected').hide(); 
        $('#archive').hide(); 
        $('#hide-items').addClass('disabled'); 
        $('#show-items').addClass('disabled'); 
        $('#perform-workflow-actions').addClass('hidden');
    } else {
        $('#deselect-all').show();
        $('#edit-selected').css('display', 'flex');
        $('#archive').css('display', 'flex');
        $('#hide-items').removeClass('disabled'); 
        $('#show-items').removeClass('disabled'); 
        if(wsConfig.permissions.workflow) $('#perform-workflow-actions').removeClass('hidden');
    }

}



// Editing selected items
function applyEdits() {

    $('#edit-fields').find('.field-value').each(function() {

        let elemField   = $(this);
        let fieldData   = getFieldValue(elemField);

        if(fieldData.value !== null) {
            if(fieldData.value !== '') {

                $('#tableau-body').children().each(function() {
                    
                    let elemRow = $(this);

                    if(elemRow.attr('data-link') === fieldData.link) {

                        $('.table-column.selected').each(function() {

                            let elemHead        = $(this);
                            let index           = elemHead.index();
                            let elemFieldTable  = elemRow.children().eq(index).children('.field-value').first();
                            let fieldDataTable  = getFieldValue(elemFieldTable);

                            if(fieldDataTable.value !== fieldData.value) {

                                if(elemFieldTable.find('.radio-option').length > 0) {
                                    elemFieldTable.find('.radio-option').each(function() {
                                        let elemInput = $(this).children('input');
                                            elemInput.prop('checked', false);
                                        if(elemInput.attr('value') === fieldData.value.link) {
                                            elemInput.prop('checked', true);
                                        }
                                    });           
                                } else if(elemFieldTable.find('option').length > 0) {
                                    elemFieldTable.find('option').each(function() {
                                        let elemInput = $(this);
                                        if(elemInput.attr('value') === fieldData.value.link) {
                                            elemInput.attr('selected', true);
                                        } else {
                                            elemInput.attr('selected', false);
                                        }
                                    });
                                } else {
                                    elemFieldTable.children().val(fieldData.value);
                                }

                            }

                        });
                    }

                });
            }
        }

    });

    highlightChanges();

}



// Display record details in panel on right hand side
function setItemSummary(link) {

    $('body').removeClass('with-edit');

    insertItemSummary(link, {
        id       : 'summary',
        bookmark : true,
        contents : [
            { 
                type        : 'details', 
                params      : { 
                    id          : 'item-details', 
                    collapsed   : true, 
                    editable    : true ,
                    toggles     : true
                } 
            },{ 
                type         : 'attachments', 
                params       : { 
                    id       : 'item-attachments',
                    editable : true,
                    singleToolbar : 'controls'
                } 
            },{ 
                type        : 'bom', 
                params      : { 
                    id      : 'item-bom',
                    search  : true
                } 
            },{ 
                type        : 'workflow-history', 
                params      : { 
                    id      : 'summary-workflow-history' ,
                    header  : false
                }
            }
        ],
        afterCloning    : function(id, link) { setTableau(); },
        cloneable       : true,
        layout          : 'tabs',
        hideSubtitle    : true,
        openInPLM       : true,
        reload          : true,
        toggleBodyClass : 'with-summary',
        workflowActions : wsConfig.permissions.workflow
    }); 

}



// Toggle Item Visibility
function hideSelectedItems() {

    $('.table-column.selected').each(function() {

        $(this).removeClass('selected');

        let index = $(this).attr('data-index');

        $('.column-' + index).addClass('invisible');

        updateToolbar();

    });

}
function showSelectedItems() {

    $('.table-column.selected').each(function() {

        $(this).removeClass('selected');

        let index = $(this).attr('data-index');

        $('.column-' + index).removeClass('invisible');

        updateToolbar();

    });

}



// Toggle Comparison
function toggleComparison(elemClicked) {

    $('tr').removeClass('match');
    $('td').removeClass('match');
    $('td').removeClass('base');
    $('td').removeClass('mismatch');

    elemClicked.toggleClass('active');

    if(!elemClicked.hasClass('active')) return;

    let index       = elemClicked.closest('th').attr('data-index');
    let isInvisible = elemClicked.closest('th').hasClass('invisible');

    $('.table-column-toolbar').find('.active').removeClass('active');

    elemClicked.addClass('active');

    $('#tableau-body tr.table-field').each(function() {

        let match       = true;
        let elemRow     = $(this);
        let baseCell    = $(this).children('.column-' + index).first();
        let hasText     = (baseCell.children().length === 0);
        let hasChild    = (baseCell.children('div').length > 0);
        let hasRadio    = (baseCell.children('div.radio').length > 0);
        let baseValue   = baseCell.children().first().val();

        if(!baseCell.hasClass('table-spacer')) {

            baseCell.addClass('base');

                 if(hasText ) baseValue = baseCell.html();
            else if(hasRadio) baseValue = baseCell.find('input:checked').first().val();
            else if(hasChild) {
                let elemInputs = baseCell.children('div').first().children('input');
                if( elemInputs.length > 0) {
                    baseValue = elemInputs.first().val();
                } else {
                    baseValue = baseCell.children('div').first().html();
                }
            }

            $(this).children().each(function() {

                if(!$(this).hasClass('table-spacer')) {

                    let elemCell = $(this);

                    if((isInvisible && elemCell.hasClass('invisible')) || (!isInvisible && !elemCell.hasClass('invisible'))) {

                        if(!elemCell.hasClass('first-col')) {
                            if(!elemCell.hasClass('column-' + index)) {

                                let value = elemCell.children().first().val();

                                    if(hasText ) value = elemCell.html();
                                else if(hasRadio) value = elemCell.find('input:checked').first().val();
                                else if(hasChild) value = elemCell.children('div').first().html();

                                if(value !== baseValue) {
                                    match = false;
                                    elemCell.addClass('mismatch');
                                } else {
                                    elemCell.addClass('match');
                                }

                            }
                        }
                    }
                }

            });

            if(match) elemRow.addClass('match');

        }

    });

}


// Archive selected items
function archiveSelected() {

    let requests = [];

    $('#overlay').show();

    $('.table-column.selected').each(function() {
        requests.push($.get('/plm/archive', { 'link' : $(this).attr('data-link')} ));
    });

    Promise.all(requests).then(function(responses) {
        for(let response of responses) {
            if(response.error) {
                if(typeof response.data !== 'undefined') {
                    if(typeof response.data.message !== 'undefined') {
                        showErrorMessage('Error', response.data.message);
                    }
                }
            }
        }
        $('#overlay').hide();
        setTableau();
    });

}



// Perform Workflow Transitions
function setTransitionsDialog() {
    
    $('#overlay').show();
    $('#transitions-comment').val('');

    let requests   = [];
    let elemParent = $('#transitions-list').html('');

    $('.table-column.selected').each(function() {
        let link = $(this).attr('data-link');
        requests.push($.get('/plm/transitions', { 'link' : link} ));
        requests.push($.get('/plm/descriptor',  { 'link' : link} ));
    });

    Promise.all(requests).then(function(responses) {

        $('#transitions').show();

        for(let i = 0; i < responses.length - 1; i += 2) {

            let respTransitions = responses[i].data;
            let respDescriptor  = responses[i+1];

            let elemItem = $('<div></div>').appendTo(elemParent)
                .addClass('transition')
                .attr('data-link', respDescriptor.params.link);

            $('<div></div>').appendTo(elemItem)
                .html(respDescriptor.data);

            let elemItemActions = $('<div></div>').appendTo(elemItem)
                .addClass('transition-actions')

            if(respTransitions.length > 0) {

                let elemItemSelect = $('<select></select>').appendTo(elemItemActions)
                    .addClass('button')
                    .addClass('select-transition');

                for(let transition of respTransitions) {
                    $('<option></option>').appendTo(elemItemSelect)
                        .attr('value', transition.__self__)
                        .html(transition.name);
                }

            } else {

                $('<div></div>').appendTo(elemItemActions)
                    .html('No workflow action available');

            }

            $('<div></div>').appendTo(elemItemActions)
                .addClass('button')
                .html('Apply to all')
                .click(function() {
                    let elemSelect = $(this).prev();
                    let value      = elemSelect.val();
                    $('#transitions-list').find('select').each(function() {
                        let elemNext = $(this);
                        let elemOption = elemNext.children('[value="' + value + '"]');
                        if (elemOption.length > 0) $(this).val(value);
                    });
                });

            $('<div></div>').appendTo(elemItemActions)
                .addClass('button')
                .addClass('red')
                .addClass('icon')
                .addClass('icon-delete')
                .click(function() {
                    let transition = $(this).closest('.transition');
                    let link = transition.attr('data-link');
                    $('.column-selector.selected').each(function() {
                        if($(this).attr('data-link') === link) {
                            $(this).removeClass('selected');
                        }
                    });
                    transition.remove();
                });


        }

    });

}
function submitTransitions() {

    let requests = [];
    $('#transitions').hide();

    $('.select-transition').each(function() {
        let link = $(this).closest('.transition').attr('data-link');
        requests.push($.get('/plm/transition', { 
            link        : link, 
            transition  : $(this).val(),
            comment     : $('#transitions-comment').val() 
        }));
    });

    Promise.all(requests).then(function(responses) {
        $('#overlay').hide();
        setTableau();
    });

}



// Save Changes to Item Details
function saveChanges() {

    $('#overlay').show();

    let requests = [];

    $('th.changed').each(function() {

        let index = $(this).attr('data-index');

        let params = { 
            link     : $(this).attr('data-link'),
            sections : []
        };

        $('td.column-' + index).each(function() {
            if($(this).hasClass('changed')) {
                addFieldPayload(params.sections, $(this));
            }
        });

        requests.push($.post('/plm/edit', params));

    });

    Promise.all(requests).then(function(responses) {

        let error = false;

        for(let response of responses) {
            if(response.error) {
                if(!error) {
                    error = true;
                    showErrorMessage('Error while saving', 'Please refresh the page to reset data to database values');
                }
            }
        }

        $('#overlay').hide();
        $('th.changed').removeClass('changed');
        $('td.changed').removeClass('changed');

    });

}
function addFieldPayload(sections, elemCell) {

    let elemField   = elemCell.children().first();
    let fieldData   = getFieldValue(elemField);
    let sectionId   = getFieldSectionId(wsConfig.sections, fieldData.fieldId);
    let isNew       = true;

    if(fieldData.value !== null) {
        if(typeof fieldData.value !== 'undefined') {

            for(let section of sections) {
                if(section.id === sectionId) {
                    isNew = false;
                    section.fields.push(fieldData);
                }
            }

            if(isNew) {
                sections.push({
                    'id' : sectionId,
                    'fields': [fieldData]
                })
            }

        }
    }

    elemField.attr('data-db-value', fieldData.display);

}