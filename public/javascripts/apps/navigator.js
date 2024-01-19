let wsConfig    = { 'permissions' : { 'workflow' : false } };
let links       = [];
let fields      = [];


$(document).ready(function() {
    
    appendProcessing('workspaces-panel', false);
    appendProcessing('tableau', true);
    appendOverlay(true);

    setUIEvents();

    $('#button-toggle-create').hide();

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
    // $('#button-toggle-details').click(function() {
    //     $('body').toggleClass('with-details');
    //     $('body').removeClass('with-create');
    //     $('body').removeClass('with-edit');
    // });
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
        $('th.item-header:visible').addClass('selected');
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
        $('body').removeClass('with-create');
        $('body').removeClass('with-details');
    });
    $('#save').click(function() {
        saveChanges();
    });
    $('#close').click(function() {
        $('body').toggleClass('with-details');
    });


    // Create Dialog
    $('#cancel-create').click(function() {
        $('#button-toggle-create').click();
        insertItemDetailsFields('', 'create', wsConfig.sections, wsConfig.fields, null, true, true, true);
    });
    $('#save-create').click(function() {

        if(!validateForm($('#create'))) return;

        $('#overlay').show();

        submitCreateForm(wsId, $('#create-sections'), null, function(response) {


            clearFields('create-sections');
            let newLink = response.data.split('.autodeskplm360.net')[1];
            setItemDetails(newLink);
            // $('#button-toggle-details').click();
            $('#overlay').hide();
        });

    });


    // Clone Dialog
    $('#button-clone').click(function() {
        let link = $('#details').attr('data-link');
        showClone(link);
    });
    $('#submit-clone').click(function() {
        clickClone($(this));
    });
    $('#cancel-clone').click(function() {
        $('body').removeClass('with-clone');
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
        $.get('/plm/workspace', { 'wsId' : wsId }),
        $.get('/plm/tableaus' , { 'wsId' : wsId }),
        $.get('/plm/sections' , { 'wsId' : wsId }),
        $.get('/plm/fields'   , { 'wsId' : wsId }),
        $.get('/plm/tabs'     , { 'wsId' : wsId }),
        $.get('/plm/bookmarks', { }),
        $.get('/plm/recent'   , { })
    ]

    Promise.all(requests).then(function(responses) {

        let index           = 0;
        let countBookmarks  = 0;
        let name            = responses[0].data.name;

        $('#header-subtitle').html(responses[0].data.name);
        $('#tableau-processing').show();
        
        if(name.endsWith('s')) name = name.substring(0, name.length - 1);
        
        $('#button-toggle-create').html('New ' + name).css('display', 'flex');

        if(responses[0].data.permissions.indexOf('Create') > -1) $('#button-toggle-create').removeClass('disabled'); else $('#button-toggle-create').addClass('disabled');
        if(responses[0].data.permissions.indexOf('Delete') <  0) $('#archive').addClass('hidden');

        for(tab of responses[4].data) {
             if(tab.workspaceTabName === 'WORKFLOW_ACTIONS') {
                // $('.workflow-actions').removeClass('hidden'); 
                wsConfig.permissions.workflow = true;
            }
        }

        insertTabLabels(responses[4].data);

        for(bookmark of responses[5].data.bookmarks) {
            let link = bookmark.item.link.split('/');
            if(link[4] === wsId) countBookmarks++;
        }

        sortArray(responses[1].data, 'title', 'string');

        for(tableau of responses[1].data) {

            let elemOption = $('<option></option>');
                elemOption.attr('value', tableau.link);
                elemOption.attr('nane', index++);
                elemOption.html(tableau.title);
                elemOption.prependTo($('#tableau-selector'));

            if(countBookmarks === 0) {
                if(tableau.hasOwnProperty('type')) {
                    if(tableau.type === 'DEFAULT') {
                        elemOption.attr('selected', true);
                    }
                }
            }

        }

        if(countBookmarks > 0) $('#option-bookmarks').attr('selected', true);

        // if($('#tableau-selector').children().length > 1) $('#tableau-selector').show();

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

    for(field of (wsConfig.fields)) {
        if(field.type !== null) {
            if((field.type.title === 'Single Selection') || (field.type.title === 'Radio Button')) {
                if(linksPicklists.indexOf(field.picklist) < 0) {
                    requests.push($.get( '/plm/picklist', { 'link' : field.picklist, 'limit' : 100, 'offset' : 0 }));
                    linksPicklists.push(field.picklist);
                }
            }
        }
    }

    Promise.all(requests).then(function(responses) {
        
        for(response of responses) cachePicklists.push({
            'link' : response.params.link,
            'data' : response.data
        });

        insertItemDetailsFields('', 'create', wsConfig.sections, wsConfig.fields, null, true, true, true);
        setTableau();

    }) ;

}



// Render workspaces list (i.e. if wsId is empty)
function showWorkspacesList() {

    let elemParent = $('#workspaces-list');
        elemParent.html('');

    $.get('/plm/workspaces', function(response){
        sortArray(response.data.items, 'title', 'string', 'ascending');
        for(workspace of response.data.items) {
            let elemTile = genTile(workspace.link, workspace.urn, null, 'folder', workspace.title, workspace.category.name);
                elemTile.appendTo(elemParent);
                elemTile.click(function() {
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

    $('body').toggleClass('with-create');
    $('body').removeClass('with-edit');
    $('body').removeClass('with-details');
    
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
            $.get('/plm/tableau-columns', { 'link' : link, 'timestamp' : timestamp }),
            $.get('/plm/tableau-data'   , { 'link' : link, 'timestamp' : timestamp })
        ];
    
        Promise.all(requests).then(function(responses) {

            if(responses[0].params.timestamp === $('#tableau-selector').attr('data-timestamp')) {

                $('#tableau-processing').hide();

                if(responses[1].data.length > 0) {
                    setTableauRows(elemTable, responses[0].data);
                    setTableauColumns(elemTable, responses[1].data);
                } else {
                    $('#tableau-empty').show();
                }

            }
    
        });

    }

}
function appendHeaderCell(elemHeaderRow, indexItem, link, descriptor) {

    let elemHeaderCell = $('<th></th>');
        elemHeaderCell.appendTo(elemHeaderRow);
        elemHeaderCell.addClass('item-header');
        elemHeaderCell.addClass('item-' + indexItem);
        elemHeaderCell.attr('data-index', indexItem);
        elemHeaderCell.attr('data-link', link);

    let elemHeaderCellTop = $('<div></div>');
        elemHeaderCellTop.addClass('item-header-top');
        elemHeaderCellTop.appendTo(elemHeaderCell);
        elemHeaderCellTop.click(function() {
            selectColumn($(this));
        });

    let elemHeaderCellDescriptor = $('<div></div>');
        elemHeaderCellDescriptor.addClass('item-descriptor');
        elemHeaderCellDescriptor.appendTo(elemHeaderCellTop);

    if(descriptor !== '') {
        let text = descriptor.split(' - ');
        if(text.length > 1) {
            elemHeaderCellDescriptor.append(text[0]).append($('<br>')).append(text[1]);
        } else {
            elemHeaderCellDescriptor.append(text[0]);
        }
    } else {
        elemHeaderCellDescriptor.html('# ' + (indexItem + 1));
    }

    let elemHeaderCelSelector = $('<div></div>');
        elemHeaderCelSelector.addClass('item-header-selector');
        elemHeaderCelSelector.appendTo(elemHeaderCellTop);

    let elemHeaderCellToggleIcon = $('<div></div>');
        elemHeaderCellToggleIcon.attr('title', 'Select this record');
        elemHeaderCellToggleIcon.addClass('icon');
        elemHeaderCellToggleIcon.addClass('icon-box-checked');
        elemHeaderCellToggleIcon.appendTo(elemHeaderCelSelector);

    let elemHeaderCellToggleIconAlt = $('<div></div>');
        elemHeaderCellToggleIconAlt.attr('title', 'Deselect this record');
        elemHeaderCellToggleIconAlt.addClass('icon');
        elemHeaderCellToggleIconAlt.addClass('icon-box-unchecked');
        elemHeaderCellToggleIconAlt.appendTo(elemHeaderCelSelector);

    let elemHeaderCellToolbar = $('<div></div>');
        elemHeaderCellToolbar.addClass('item-toolbar');
        elemHeaderCellToolbar.appendTo(elemHeaderCell);

    let elemHeaderCellHide= $('<div></div>');
        elemHeaderCellHide.attr('title', 'Hide this record');
        elemHeaderCellHide.addClass('icon');
        elemHeaderCellHide.addClass('button');
        elemHeaderCellHide.addClass('icon-hide');
        elemHeaderCellHide.appendTo(elemHeaderCellToolbar);
        elemHeaderCellHide.click(function() {
            let elemHead = $(this).closest('th');
            let index = elemHead.attr('data-index');
            $('.item-' + index).addClass('invisible');
            elemHead.removeClass('selected');
        });

    let elemHeaderCellUnhide= $('<div></div>');
        elemHeaderCellUnhide.attr('title', 'Unhide this record');
        elemHeaderCellUnhide.addClass('icon');
        elemHeaderCellUnhide.addClass('button');
        elemHeaderCellUnhide.addClass('icon-show');
        elemHeaderCellUnhide.appendTo(elemHeaderCellToolbar);
        elemHeaderCellUnhide.click(function() {
            let elemHead = $(this).closest('th');
            let index = elemHead.attr('data-index');
            $('.item-' + index).removeClass('invisible');
            elemHead.removeClass('selected');
        });

    let elemHeaderCellCompare = $('<div></div>');
        elemHeaderCellCompare.attr('title', 'Compare this record againt the other records in this table using colors');
        elemHeaderCellCompare.addClass('icon');
        elemHeaderCellCompare.addClass('button');
        elemHeaderCellCompare.html('invert_colors');
        elemHeaderCellCompare.appendTo(elemHeaderCellToolbar);
        elemHeaderCellCompare.click(function() {
            toggleComparison($(this));
        });

    let elemHeaderCellDetails = $('<div></div>');
        elemHeaderCellDetails.attr('title', 'Open Details Panel to the right for this record');
        elemHeaderCellDetails.addClass('icon');
        elemHeaderCellDetails.addClass('button');
        elemHeaderCellDetails.html('view_sidebar');
        elemHeaderCellDetails.appendTo(elemHeaderCellToolbar);
        elemHeaderCellDetails.click(function() {
            setItemDetails($(this).closest('th').attr('data-link'));
        });

    let elemHeaderCellClone = $('<div></div>');
        elemHeaderCellClone.attr('title', 'Clone this record');
        elemHeaderCellClone.addClass('icon');
        elemHeaderCellClone.addClass('button');
        elemHeaderCellClone.addClass('icon-clone');
        elemHeaderCellClone.appendTo(elemHeaderCellToolbar);
        elemHeaderCellClone.click(function() {
            let link = $(this).closest('th').attr('data-link');
            showClone(link);
        });
        

    let elemHeaderCellOpen = $('<div></div>');
        elemHeaderCellOpen.attr('title', 'Open this record in PLM');
        elemHeaderCellOpen.addClass('icon');
        elemHeaderCellOpen.addClass('button');
        elemHeaderCellOpen.html('open_in_new');
        elemHeaderCellOpen.appendTo(elemHeaderCellToolbar);
        elemHeaderCellOpen.click(function() {
            openItemByLink($(this).closest('th').attr('data-link'));
        });

    let elemHeaderSpacer = $('<th></th>');
        elemHeaderSpacer.addClass('table-spacer');
        elemHeaderSpacer.addClass('item-' + indexItem);
        elemHeaderSpacer.appendTo(elemHeaderRow);

    links.push(link);
}



// Handle Standard Views (Bookmarks, Recents, MOW)
function getWorkspaceData(elemTable, timestamp, url, key) {

    $.get(url, { 'timestamp' : timestamp }, function(response) {

        if(response.params.timestamp !== $('#tableau-selector').attr('data-timestamp')) return;

        let requests = [];

        for(entry of response.data[key]) {
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

    for(section of wsConfig.sections) {

        let elemSection = $('<tr></tr>');
            elemSection.addClass('table-section');
            elemSection.html('<td>' + section.name + '</td>');
            elemSection.appendTo(elemTable);

        for(sectionField of section.fields) {

            for(field of wsConfig.fields) {

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
                            insertField(field, { 'sections': [{ 'fields' : fields }] }, $('#edit-fields'), true, true, true);

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

    let indexItem = 0;

    let elemHeader = $('#tableau-header');
        elemHeader.html('');

    let elemHeaderRow = $('<tr></tr>');
        elemHeaderRow.appendTo(elemHeader);

    let elemHeaderFirstCell = $('<th></th>');
        elemHeaderFirstCell.appendTo(elemHeaderRow);
        elemHeaderFirstCell.addClass('first-col');

    for(record of records) {

        appendHeaderCell(elemHeaderRow, indexItem, record.data.__self__, record.data.title);

        let index = 0;

        elemTable.children('tr.table-field').each(function() {

            let elemCell = $('<td></td>');
                elemCell.appendTo($(this));
                elemCell.addClass('item-' + indexItem);
                elemCell.addClass('table-field');
                // elemCell.hover(function () {
                //     $('table td:nth-child(' + ($(this).index() + 1) + ')').addClass('hover');
                //     $('table th:nth-child(' + ($(this).index() + 1) + ')').addClass('hover');
                // }, function () {
                //     $('table td:nth-child(' + ($(this).index() + 1) + ')').removeClass('hover');
                //     $('table th').removeClass('hover');
                // });

            let elemControl = insertField(fields[index], record.data, null, false, false, true, true);

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
                elemCellSpacer.addClass('item-' + indexItem);
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

    $('th.item-header').each(function () {

        let elemHeader  = $(this);
        let isChanged   = false;
        let index       = elemHeader.attr('data-index');   

        $('td.table-field.item-' + index).each(function() {

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

    for(tableauColumn of tableauColumns) {

        if(tableauColumn.hasOwnProperty('displayOrder')) {

            if(tableauColumn.field.title !== 'Item Descriptor') {

                let elemRow = $('<tr></tr>');
                    elemRow.addClass('table-field');
                    elemRow.attr('data-link', tableauColumn.field.__self__);
                    elemRow.appendTo(elemTable);

                let elemCell = $('<td></td>');
                    elemCell.addClass('first-col');
                    elemCell.addClass('nowrap');
                    elemCell.html(tableauColumn.field.title);
                    elemCell.appendTo(elemRow);

                if(tableauColumn.field.isSystemField) {
                    
                        fields.push({
                            'isSystemField' : true
                        });
                
                } else {
            
                    for(field of wsConfig.fields) {
                        if(field.__self__ === tableauColumn.field.__self__) {
                            fields.push(field);
                            insertField(field, { 'sections': [{ 'fields' : fields }] }, $('#edit-fields'), true, true, true);
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

    let indexItem = 0;

    let elemHeader = $('#tableau-header');
        elemHeader.html('');

    let elemHeaderRow = $('<tr></tr>');
        elemHeaderRow.appendTo(elemHeader);

    let elemHeaderFirstCell = $('<th></th>');
        elemHeaderFirstCell.appendTo(elemHeaderRow);
        elemHeaderFirstCell.addClass('first-col');

    for(tableauRecord of tableauRecords) {

        let descriptor = '';

        for(tableauField of tableauRecord.fields) {
            if(tableauField.id === 'DESCRIPTOR') descriptor = tableauField.value;
        }

        appendHeaderCell(elemHeaderRow, indexItem, tableauRecord.item.link, descriptor);

        let index = 0;

        elemTable.find('tr').each(function() {

            let link    = $(this).attr('data-link');
            let fieldId = link.split('/')[8];
            let value   = '';
            
            for(tableauField of tableauRecord.fields) {
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

            let elemCell = $('<td></td>');
                elemCell.addClass('item-' + indexItem);
                elemCell.addClass('table-field');
                elemCell.appendTo($(this));
           
            if(fields[index].isSystemField) {

                // Print descriptor column etc.
                elemCell.html(value);

            } else {

                let elemControl = insertField(fields[index], { 'sections': [{ 'fields' : tableauRecord.fields }] }, null, false, false, true, true);

                if(typeof elemControl !== 'undefined') {
                    let fieldValue = getFieldValue(elemControl);
                    elemControl.appendTo(elemCell);
                    elemControl.attr('data-db-value', fieldValue.display);
                    elemControl.change(function() {
                        highlightChanges();
                    });
                }

            }

            let elemCellSpacer = $('<td></td>');
                elemCellSpacer.addClass('table-spacer');
                elemCellSpacer.addClass('item-' + indexItem);
                elemCellSpacer.appendTo($(this));

            index++;

        });

        indexItem++;

    }

}



// Selection of items using checkeboxes
function selectColumn(elemClicked) {

    let elemItem = elemClicked.closest('th');
    let index    = elemItem.attr('data-index');

    if(elemItem.hasClass('selected')) {
        $('.item-' + index).removeClass('selected');
    } else {
        $('.item-' + index).addClass('selected');
    }

    updateToolbar();

}
function updateToolbar() {

    if($('.item-header.selected').length === 0) {
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

                        $('.item-header.selected').each(function() {

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
function setItemDetails(link) {

    $('#details-title').html('');        
    $('#details').attr('data-link', link);

    $('body').removeClass('with-create');
    $('body').removeClass('with-clone');
    $('body').removeClass('with-edit');
    $('body').addClass('with-details');

    insertGrid(link, 'grid');
    insertViewer(link, 255);        
    insertItemDetails(link);
    insertAttachments(link, 'attachments');

    if(wsConfig.permissions.workflow) insertWorkflowActions(link);

    $.get('/plm/descriptor', { 'link' : link }, function(response) {
        $('#details-title').html(response.data);
    });

}



// Toggle Item Visibility
function hideSelectedItems() {

    $('.item-header.selected').each(function() {

        $(this).removeClass('selected');

        let index = $(this).attr('data-index');

        $('.item-' + index).addClass('invisible');

        updateToolbar();

    });

}
function showSelectedItems() {

    $('.item-header.selected').each(function() {

        $(this).removeClass('selected');

        let index = $(this).attr('data-index');

        $('.item-' + index).removeClass('invisible');

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

    $('.item-toolbar').find('.active').removeClass('active');

    elemClicked.addClass('active');

    $('#tableau-body tr.table-field').each(function() {

        let match       = true;
        let elemRow     = $(this);
        let baseCell    = $(this).children('.item-' + index).first();
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

            console.log(hasText);
            console.log(hasChild);
            console.log(baseValue);

            $(this).children().each(function() {

                if(!$(this).hasClass('table-spacer')) {

                    let elemCell = $(this);

                    if((isInvisible && elemCell.hasClass('invisible')) || (!isInvisible && !elemCell.hasClass('invisible'))) {

                        if(!elemCell.hasClass('first-col')) {
                            if(!elemCell.hasClass('item-' + index)) {

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

    $('.item-header.selected').each(function() {
        requests.push($.get('/plm/archive', { 'link' : $(this).attr('data-link')} ));
    });

    Promise.all(requests).then(function(responses) {
        for(response of responses) {
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


// Clone from details view
function showClone(link) {

    $('body').addClass('with-clone');
    $('body').removeClass('with-edit');
    $('body').removeClass('with-details');
    $('body').removeClass('with-create');

    $('#clone').attr('data-link', link);
    $('#clone-sections').html('');
    $.get('/plm/details', { 'link' : link }, function(response) { 
        $('#clone-title').html(response.data.title);
        insertItemDetailsFields('', 'clone', wsConfig.sections, wsConfig.fields, response.data, true, true, true);
    });


}
function clickClone(elemClicked) {

    let elemPanel   = elemClicked.closest('.panel');
    let link        = elemPanel.attr('data-link');

    let params = {
        'link'      : link,
        'sections'  : getSectionsPayload($('#clone-sections'))
    }

    $.post('/plm/clone', params, function(response) {
        let url = response.data.split('.autodeskplm360.net');
        setItemDetails(url[1]);
    });

}



// Perform Workflow Transitions
function performWorkflowAction() {

    $('#overlay').show();

    let selected = $('.item-header.selected');

    if(selected.length === 1) {

        $.get('/plm/transition', { 'link' : selected.first().attr('data-link'), 'transition' : $('#workflow-actions').val()}, function() {
            setTableau();
        });

    }

}
function setTransitionsDialog() {
    
    $('#overlay').show();
    $('#transitions-comment').val('');

    let selected = $('.item-selector.selected');
    let requests = [];
    let elemParent = $('#transitions-list');

    elemParent.html('');

    // for(item of selected) {
    $('.item-header.selected').each(function() {
        let link = $(this).attr('data-link');
        requests.push($.get('/plm/transitions', { 'link' : link} ));
        requests.push($.get('/plm/descriptor',  { 'link' : link} ));
    });

    Promise.all(requests).then(function(responses) {

        $('#transitions').show();

        for(let i = 0; i < responses.length - 1; i+=2) {

            let respTransitions = responses[i].data;
            let respDescriptor  = responses[i+1];

            let elemItem = $('<div></div>');
                elemItem.addClass('transition');
                elemItem.attr('data-link', respDescriptor.params.link);
                elemItem.appendTo(elemParent);

            let elemItemDescriptor = $('<div></div>');
                elemItemDescriptor.html(respDescriptor.data);
                elemItemDescriptor.appendTo(elemItem);

            let elemItemActions = $('<div></div>');
                elemItemActions.appendTo(elemItem);

            if(respTransitions.length > 0) {

                let elemItemSelect = $('<select></select>')
                    .addClass('button')
                    .addClass('select-transition')
                    .appendTo(elemItemActions);

                for(transition of respTransitions) {
                    let elemItemOption = $('<option></option>');
                        elemItemOption.attr('value', transition.__self__);
                        elemItemOption.html(transition.name);
                        elemItemOption.appendTo(elemItemSelect);
                }

            } else {

                let elemNoAction = $('<div></div>');
                    elemNoAction.html('No workflow action available');
                    elemNoAction.appendTo(elemItemActions);

            }

            let elemItemDelete = $('<div></div>');
                elemItemDelete.addClass('button');
                elemItemDelete.addClass('red');
                elemItemDelete.addClass('icon');
                elemItemDelete.addClass('icon-delete');
                elemItemDelete.appendTo(elemItemActions);
                elemItemDelete.click(function() {

                    let transition = $(this).closest('.transition');
                    let link = transition.attr('data-link');
                    $('.item-selector.selected').each(function() {
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

        console.log(link);
        console.log($(this).val());
        console.log($('#transitions-comment').val());

        requests.push($.get('/plm/transition', { 'link' : link, 'transition' : $(this).val(), 'comment' : $('#transitions-comment').val() }));
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

    $('th').each(function() {

        if($(this).hasClass('changed')) {

            let index = $(this).attr('data-index');

            let params = { 
                'link'     : $(this).attr('data-link'),
                'sections' : []
            };

            $('td.item-' + index).each(function() {
                if($(this).hasClass('changed')) {
                    addFieldPayload(params.sections, $(this));
                }
            });

            requests.push($.get('/plm/edit', params));

        }

    });

    Promise.all(requests).then(function(responses) {

        let error = false;

        for(response of responses) {
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

            for(section of sections) {
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