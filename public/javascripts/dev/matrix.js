let profile          = null;
let links            = { columns : [] };
let treePartsList    = [];
let paramsDetails    = {};
let paramsCreate     = {};
let paramsSummary    = {};
let paramsGridRow    = {};
let wsConfig         = { updatePicklist : false };
let countTreeColumns = 0;


$(document).ready(async function() {
        
    profile = (urlParameters.profile != null) ? config[urlParameters.profile] : config[0];
    
    setUIEvents();
    setProfileDefaults();
    setApplicationLabels();

    links.context = urlParameters.link;

    let requests = [
        $.get('/plm/details'    , { link : links.context}),
        $.get('/plm/sections'   , { link : links.context, useCache : true }),
        $.get('/plm/fields'     , { link : links.context, useCache : true }),
        $.get('/plm/permissions', { link : links.context, useCache : true }),
    ]

    getFeatureSettings('matrix', requests, async function(responses) {

        $('#header-subtitle').html(responses[0].data.title);

        links.tree               = getSectionFieldValue(responses[0].data.sections, profile.context.fieldIdTree, '', 'link');
        wsConfig.contextSections = responses[1].data;
        
        let additionalRequests = [];
        let valueColumns       = getSectionFieldValue(responses[0].data.sections, profile.context.fieldIdColumns, []);

        for(let field of responses[2].data) {
            let fieldId = field.__self__.split('/').pop();
            if(fieldId == profile.context.fieldIdColumns) {
                wsConfig.workspaceId  = field.picklistFieldDefinition.split('/')[4];
                profile.usedInContext = true;
                if(hasPermission(responses[3].data, 'edit_items')) {
                    if(!responses[0].data.itemLocked) {
                        wsConfig.updatePicklist = true;
                    }
                }
            }
        }

        if((valueColumns.length === 0) && (!profile.usedInContext)) {
            valueColumns = await searchColumnItems(responses[0].data.title);
        } else {
            for(let valueColumn of valueColumns) {
                valueColumn.dmsId = String(valueColumn.link.split('/')[6]).padStart(20, '0');
            }
        }

        sortArray(valueColumns, 'dmsId', 'integer', profile.columns.sortDirection);

        for(let value of valueColumns) {
            links.columns.push(value.link);
            additionalRequests.push($.get('/plm/details', { link : value.link }));
        }      

        enableCreateButton();
        
        let paramsTree = profile.panels.insertBOM;
            paramsTree.id                 = 'tree';
            paramsTree.multiSelect        = 'true';
            paramsTree.additionalRequests = additionalRequests;
            paramsTree.onClickItem        = function(elemClicked) { onClickTreeItem( elemClicked); };
            paramsTree.afterCompletion    = function(id, data)    { afterTreeCompleteLoading(id, data); };

        insertBOM(links.tree, paramsTree);

        paramsDetails    = profile.panels.insertDetails || {};
        paramsDetails.id = 'details';

        insertDetails(links.tree, paramsDetails);

        paramsCreate               = profile.panels.insertCreate || {};
        paramsCreate.id            = 'create';
        paramsCreate.getDetails    = true;
        paramsCreate.afterCreation = function(id, link, data, panelId) { afterCreation(id, link, data, panelId); };

        paramsSummary = profile.panels.insertItemSummary || {};
        paramsSummary.id              = 'details';
        paramsSummary.hideCloseButton = true;
        paramsSummary.summaryLayout   = 'tabs'
        paramsSummary.summaryContents = profile.panels.summaryContents || [
            { type : 'details'     },
            { type : 'grid'        },
            { type : 'attachments' },
            { type : 'images', params    : { id : 'item-section-images' , layout : 'grid', contentSize : 'm' } }
        ];

        paramsGridRow = profile.panels.insertGridRowDetails || {};
        paramsGridRow.id              = 'details';

    });

});
async function searchColumnItems(descriptor) {

    if(profile.columns.search == null) return [];

    let paramsSearch = {
        wsId   : profile.columns.search.workspaceId,
        fields : [ profile.columns.search.fieldIdContext ],
        filter : profile.columns.search.additionalFilters || []
    }

    paramsSearch.filter.push({
        field      : profile.columns.search.fieldIdContext,
        type       : 0,
        comparator : 'is',
        value      : descriptor
    });

    let result   = [];
    let response = await $.post('/plm/search', paramsSearch);

    for(let row of response.data.row) {
        result.push({
            link  : '/api/v3/workspaces/' + profile.columns.search.workspaceId + '/items/' + row.dmsId,
            dmsId : String(row.dmsId).padStart(20, '0')
        })
    }

    return result;

}


function setUIEvents() { 

    $('#create-button').click(function() {
        insertCreate(null, [ wsConfig.workspaceId ], paramsCreate);
    });

    $('#toggle-details').click(function() {
        $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        $('body').toggleClass('no-details');
    });

    $('#status-bar').children().click(function() {
        
        let elemClicked = $(this);
        
        elemClicked.siblings().removeClass('active');
        elemClicked.siblings().removeClass('inactive');
        elemClicked.removeClass('inactive');
        
        if(elemClicked.hasClass('active')) {
            elemClicked.removeClass('active');
            $('.content-item').show();
        } else {
            $('.content-item').hide();
            elemClicked.siblings().addClass('inactive');
            let className = elemClicked.attr('data-class-name');
            $('.content-item.' + className).each(function() {
                $(this).show();
                treeUnhideParents($(this));
            });
            elemClicked.addClass('active');
        }
        
    });

}
function setProfileDefaults() {

    profile.usedInContext         = false;
    profile.applicationTitle      = profile.labels.applicationTitle   || document.title;
    profile.latestColumnTitle     = profile.labels.latestColumnTitle  || 'Latest Result';
    profile.fieldIdColumnTitle    = profile.columns.fieldIds.title    || 'ID';
    profile.fieldIdColumnSubtitle = profile.columns.fieldIds.subtitle || 'TITLE';
    profile.columns.fieldIds.sort = profile.columns.fieldIds.sort     || '';
    profile.columns.sortDirection = profile.columns.sortDirection     || 'descending';
    profile.statusDefinition      = profile.statusDefinition          || {
        failure : { type : 'failure', className : 'failure', value : 'Failed'   },
        missing : { type : 'missing', className : 'missing', value : 'Missing', },
        pending : { type : 'pending', className : 'pending', value : 'Pending'  },
        success : { type : 'success', className : 'success', value : 'Success'  },
        partial : { type : 'partial', className : 'partial', value : 'Conditional Success' },
    };

    wsConfig.workspaceId = profile.columns.search.workspaceId || '';

}
function setApplicationLabels() {

    $('#header-title').html(profile.applicationTitle);
    document.title        = profile.applicationTitle;

    $('#create-button').html(         profile.labels.buttonCreateNew.label || 'Create New');
    $('#create-button').attr('title', profile.labels.buttonCreateNew.title || 'Click to create new item / column');

}
function enableCreateButton() {
    
    // Enable new process creation only if permissions are granted

    $.get('/plm/permissions', { wsId : wsConfig.workspaceId }, function(response) {
         if(hasPermission(response.data, 'add_items')) {
                 if(!profile.usedInContext ) $('#create-button').removeClass('hidden');
            else if(wsConfig.updatePicklist) $('#create-button').removeClass('hidden');
        }
    });

}


// Insert validation data to table
function afterTreeCompleteLoading(id, data) {

    treePartsList = data.bomPartsList;

    setStatusBar();
    insertEditModeToggle();
    insertColumnToggles();
    insertLatestColumn();
    insertSeparatorColumn();
    sortAndInsertMatrixColumns(data);

}
function setStatusBar() {

    setStatusBarElement('failure');
    setStatusBarElement('missing');
    setStatusBarElement('pending');
    setStatusBarElement('success');

}
function setStatusBarElement(id) {

    const elemBar   = $('#status-bar-' + id);
    const elemLabel = elemBar.find('.status-bar-label');

    elemBar.attr('data-class-name', profile.statusDefinition[id].className);
    elemLabel.html(profile.statusDefinition[id].value);

}
function insertEditModeToggle() {

    const elemControls = $('#tree-controls');

    $('<div></div>').prependTo(elemControls)
        .attr('id', 'tree-toggle-edit-mode')
        .addClass('button')
        .addClass('with-toggle')
        .addClass('toggle-off')
        .html('Edit Mode')
        .click(function() {
            $('body').toggleClass('edit-mode');
            $(this).toggleClass('toggle-on').toggleClass('toggle-off');
        });

}
function insertColumnToggles() {

    const elemControls = $('#tree-controls');

    $('<div></div>').prependTo(elemControls)
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-plus')
        .html('Unhide All Columns')
        .attr('title', 'Click to unhide all matrix columns')
        .click(function() {
            $('.matrix-column').removeClass('min');
        });

    $('<div></div>').prependTo(elemControls)
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-minus')
        .html('Hide All Columns')
        .attr('title', 'Click to hide all matrix columns')
        .click(function() {
            $('.matrix-column').addClass('min');
        });        

}
function insertLatestColumn() {

    const elemTHead = $('#tree-thead').children().first();
    
    $('<th></th>').appendTo(elemTHead)
        .addClass('matrix-column-latest')
        .html(profile.latestColumnTitle);

    $('#tree-tbody').find('.content-item').each(function() {

        let elemCell = $('<td></td>').appendTo($(this))
            .addClass('matrix-column-latest')
            .click(function(e) {
                clickLatestColumn(e, $(this));
            });

        let elemContent = $('<div></div>').appendTo(elemCell).addClass('matrix-cell-content');
        
        $('<div></div>').appendTo(elemContent).addClass('matrix-latest-label');

        if($(this).hasClass('leaf')) {

            $('<div></div>').appendTo(elemContent)
                .addClass('button')
                .addClass('hidden')
                .addClass('matrix-button-filter-columns')
                .attr('title', 'Click to filter for relevant columns')
                .click(function(e) {
                    filterMatrixColumns(e, $(this));
                });

        }

    });    

}
function clickLatestColumn(e, elemClicked) {

    let link = elemClicked.attr('data-link');

    if(link === '') return;

    e.stopPropagation();
    e.preventDefault();

    openMatrixColumnDetailsPanel(link);

}
function openMatrixColumnDetailsPanel(link) {

    let elemToggleDetails = $('#toggle-details');
    if(elemToggleDetails.hasClass('toggle-off')) elemToggleDetails.click();

    if(settings['details'].link === link) return;
    insertItemSummary(link, paramsSummary);

}
function filterMatrixColumns(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let wasActive = elemClicked.hasClass('default')

    $('.matrix-button-filter-columns').removeClass('default');;
    $('.matrix-column').removeClass('hidden');

    if(!wasActive) {

        elemClicked.addClass('default');

        let listDisconnected = elemClicked.closest('td').nextAll('.matrix-status-disconnected');

        listDisconnected.each(function() {
            let index = $(this).index();
            $('th.matrix-column').eq(index - countTreeColumns).addClass('hidden');
            $('#tree-tbody').children().each(function() {
                $(this).children('.matrix-column').eq(index - countTreeColumns).addClass('hidden');
            });
        });

    }

}
function insertSeparatorColumn() {

    let elemTHead = $('#tree-thead').children().first();
    
    $('<th></th>').appendTo(elemTHead).addClass('matrix-column-separator');

    $('#tree-tbody').find('.content-item').each(function() {
        $('<td></td>').appendTo($(this)).addClass('matrix-column-separator');
    });    

}
function sortAndInsertMatrixColumns(data) {

    let requests = [];

    countTreeColumns = $('#tree-thead-row').children().length;
    links.columns    = [];

    for(let column of data.dataAdditional) {
        requests.push($.get('/plm/grid', { link : column.params.link }));

    }

    if(profile.columns.fieldIds.sort != null) {

        for(let column of data.dataAdditional) {
            column.sortValue = getSectionFieldValue(column.data.sections, profile.columns.fieldIds.sort, '');
        }

        sortArray(data.dataAdditional, 'sortValue', 'string', profile.columns.sortDirection);

    }

    Promise.all(requests).then(function(responses) {

        let indexColumn = 0;

        for(let response of responses) {

            links.columns.push(data.dataAdditional[indexColumn].data.__self__);

            insertMatrixColumn({
                link     : data.dataAdditional[indexColumn].data.__self__,
                sections : data.dataAdditional[indexColumn].data.sections,
                status   : data.dataAdditional[indexColumn].data.currentState.title,
                locked   : data.dataAdditional[indexColumn].data.itemLocked,
                grid     : response.data
            });

            indexColumn++;

        }

        updateStatusIndicators();

    });

}


// Insert Matrix Columns with Header Actions
function insertMatrixColumn({ link, sections = [], status = '',  locked = false, grid = [], first = false }) {

    let index     = $('th.matrix-column').length;
    let elemTHead = $('#tree-thead').children().first();
    let elemHead  = $('<th></th>').attr('data-index', index)
        .attr('data-link', link)
        .addClass('matrix-column')
        .addClass('matrix-column-' + index)
        .click(function(e) {
            clickMatrixColumnHead(e, $(this));
        });
        
    if(first) {

        let elemSeparator = $('th.matrix-column-separator');
        elemHead.insertAfter(elemSeparator);

    } else elemHead.appendTo(elemTHead);


    let elemContent = $('<div></div>').appendTo(elemHead).addClass('matrix-head');
    let elemLabels  = $('<div></div>').appendTo(elemContent).addClass('matrix-head-labels');
    let elemActions = $('<div></div>').appendTo(elemContent).addClass('matrix-head-actions');

    const title    = getSectionFieldValue(sections, profile.fieldIdColumnTitle   , '');
    const subtitle = getSectionFieldValue(sections, profile.fieldIdColumnSubtitle, '');

    $('<div></div>').appendTo(elemLabels).addClass('matrix-head-title'   ).html(title);
    $('<div></div>').appendTo(elemLabels).addClass('matrix-head-subtitle').html(subtitle);
    $('<div></div>').appendTo(elemLabels).addClass('matrix-head-status'  ).html(status);

    $('<div></div>').appendTo(elemActions)
        .addClass('button')    
        .addClass('icon')    
        .addClass('icon-minus')
        .addClass('matrix-hide-column')
        .attr('title', 'Hide this column')
        .click(function(e) { clickMatrixColumnToggle(e, $(this), 'hide'); });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')    
        .addClass('icon-plus')
        .addClass('matrix-unhide-column')
        .attr('title', 'Unhide this column')
        .click(function(e) { clickMatrixColumnToggle(e, $(this), 'unhide'); });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')    
        .addClass('icon')    
        .addClass('icon-filter')
        .addClass('matrix-filter-rows')
        .attr('title', 'Filter by this column')
        .click(function(e) { clickMatrixColumnFilter(e, $(this)); });

    $('#tree-tbody').find('.content-item').each(function() {
        insertMatrixColumnCell($(this), index, grid, locked, first);
    });

}
function clickMatrixColumnHead(e,elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    const elemHead = elemClicked.closest('th');

    openMatrixColumnDetailsPanel(elemHead.attr('data-link'));

}
function clickMatrixColumnToggle(e, elemClicked, mode) {

    e.preventDefault();
    e.stopPropagation();

    const elemHead = elemClicked.closest('th');
    const index    = elemHead.data('index');

    if(mode === 'hide') $('.matrix-column-' + index).addClass('min');
                  else  $('.matrix-column-' + index).removeClass('min');

}
function clickMatrixColumnFilter(e, elemClicked, mode) {

    e.preventDefault();
    e.stopPropagation();

    const elemHead  = elemClicked.closest('th');
    const index     = elemHead.data('index');
    const wasActive = elemClicked.hasClass('active');

    $('.matrix-filter-rows').removeClass('active');

    if(!wasActive) {

        elemClicked.addClass('active');
        
        $('.matrix-column').addClass('min');
        $('.matrix-column-' + index).removeClass('min');

        $('.content-item.leaf').each(function() {

            let elemRow = $(this);
            let count   = elemRow.children('.matrix-status-connected.matrix-column-' + index).length;

            if(count === 0) {
                elemRow.hide(); 
            } else {
                treeUnhideParents(elemRow);
                elemRow.show();
            }

        });
        
    } else {
        
        $('.matrix-column').removeClass('min');
        $('.content-item').show();

    }

}


// While inserting Matrix Columns insert matching cells per tree row
function insertMatrixColumnCell(elemRow, index, grid, locked, first) {

    let linkTree = elemRow.attr('data-link');
    let isNode   = elemRow.hasClass('node');
    let isLinked = false;
    let label    = '';

    let elemCell = $('<td></td>')
        .attr('data-index', index)
        .addClass('matrix-column')
        .addClass('matrix-column-' + index)
        .addClass('matrix-cell')
        .click(function(e) {
            clickMatrixColumnCell(e, $(this));
        });
        
    if(first) {

        let elemSeparator = elemRow.find('.matrix-column-separator');
        elemCell.insertAfter(elemSeparator);

    } else {
        elemCell.appendTo(elemRow);
    }


    if(isNode) {

        elemCell.addClass('matrix-column-node');

    } else {
            
        let elemContent = $('<div></div>').appendTo(elemCell).addClass('matrix-cell-content');

        for(let row of grid) {

            let linkRow = getGridRowValue(row, profile.columns.grid.fieldIdLink);

            if(linkTree === linkRow) { 
                isLinked = true;
                elemCell.attr('data-link-grid-row', getGridRowLink(row));
                label = getGridRowValue(row, profile.columns.grid.fieldIdLabel, '', 'title');
                break;
            }

        }

        if(isLinked) elemCell.addClass('matrix-status-connected'); else elemCell.addClass('matrix-status-disconnected');

        if(!locked) {

            elemCell.addClass('matrix-column-editable');

            $('<div></div>').appendTo(elemContent)
                .addClass('button')
                .addClass('matrix-cell-action')
                .addClass('matrix-cell-action-add')
                .html('Add')
                .click(function(e) { clickMatrixColumnCellButton(e, $(this), 'add'); });
                
            $('<div></div>').appendTo(elemContent)
                .addClass('button')
                .addClass('matrix-cell-action')
                .addClass('matrix-cell-action-remove')
                .html('Remove')
                .click(function(e) { clickMatrixColumnCellButton(e, $(this), 'remove'); });

        }

        $('<div></div>').appendTo(elemContent).addClass('matrix-cell-icon');
        $('<div></div>').appendTo(elemContent).addClass('matrix-cell-label');            

        setMatrixColumnCellStatusClass(elemCell, label);

    }

}
function clickMatrixColumnCell(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let link = elemClicked.attr('data-link-grid-row');
    
    if(link == null) return;

    insertGridRowDetails(link, paramsGridRow);

}
function clickMatrixColumnCellButton(e, elemButton, action) {

    e.preventDefault();
    e.stopPropagation();

    const elemCell = elemButton.closest('td');

    if(action === 'add') {

        const linkRow    = elemButton.closest('tr.content-item').attr('data-link');
        const linkColumn = links.columns[elemCell.index() - countTreeColumns];

        let params = {
            link : linkColumn,
            data : [{ 
                fieldId : profile.columns.grid.fieldIdLink, 
                value   : { link : linkRow } 
            }]
        }

        // Set defined default values for new grid entries
        if(profile.columns.grid.hasOwnProperty('defaults')) {
            for(let defaultValue of profile.columns.grid.defaults) {
                params.data.push(defaultValue);
            }
        }

        // Copy data from BOM data to defined grid fields
        if(profile.columns.grid.hasOwnProperty('fieldMapping')) {
            for(let treeItem of treePartsList) {
                if(treeItem.link === linkRow) {
                    for(let fieldMapping of profile.columns.grid.fieldMapping) {
                        params.data.push({
                            fieldId : fieldMapping.grid,
                            value : treeItem.details[fieldMapping.source]
                        })
                    }
                    break;
                }
            }
        }

        $.post('/plm/add-grid-row', params, function(response) {
            if(!response.error) {
                elemCell.attr('data-link-grid-row', response.data.split('.autodeskplm360.net')[1]);
                elemCell.addClass('matrix-status-connected').removeClass('matrix-status-disconnected');
                setMatrixColumnCellStatusClass(elemCell, profile.statusDefinition.pending.value);
                updateStatusIndicators();
            }
        });

    } else if(action === 'remove') {

        const linkGridRow = elemCell.attr('data-link-grid-row');

        $.post('/plm/remove-grid-row', { link : linkGridRow }, function(response) {
            if(!response.error) {
                elemCell.removeClass('matrix-status-connected').addClass('matrix-status-disconnected');
                setMatrixColumnCellStatusClass(elemCell, '');
                updateStatusIndicators();
            }
        });

    }

}
function setMatrixColumnCellStatusClass(elemCell, label) {

    let columnStatus = null;
    let elemIcon     = elemCell.find('.matrix-cell-icon').first();
    let elemLabel    = elemCell.find('.matrix-cell-label').first();

    elemIcon.html('');
    elemLabel.html(label);

    switch(label) {

        case profile.statusDefinition.pending.value: columnStatus = profile.statusDefinition.pending; break;
        case profile.statusDefinition.failure.value: columnStatus = profile.statusDefinition.failure; break;
        case profile.statusDefinition.success.value: columnStatus = profile.statusDefinition.success; break;
        case profile.statusDefinition.partial.value: columnStatus = profile.statusDefinition.partial; break;

    }

    elemCell.removeClass(profile.statusDefinition.pending.className);
    elemCell.removeClass(profile.statusDefinition.failure.className);
    elemCell.removeClass(profile.statusDefinition.success.className);
    elemCell.removeClass(profile.statusDefinition.partial.className);

    if(columnStatus !== null) {

        elemCell.addClass(columnStatus.className);

        switch(columnStatus.type) {
            case 'failure': elemIcon.html('◆'); break;
            case 'pending': elemIcon.html('●'); break;
            case 'success': elemIcon.html('■'); break;
            case 'partial': elemIcon.html('■'); break;
        }

    }

    return columnStatus;

}


// Update table after creation of new item
function afterCreation(id, link, data, panelId) {

    let listSelected = $('.content-item.leaf.selected');
    let requests     = [];

    links.columns.unshift(link);

    if(wsConfig.updatePicklist) {
        $.post('/plm/edit', {
            link     : links.context,
            sections : wsConfig.contextSections,
            fields   : [{
                fieldId : profile.context.fieldIdColumns,
                type    : 'multi-select',
                value   : links.columns
            }]
        });
    }

    listSelected.each(function() {

        let elemSelected = $(this);

        let params       = {
            link : link,
            data : [
                { fieldId : profile.columns.grid.fieldIdLink, value : { link : elemSelected.attr('data-link') } },
            ]
        }

        if(profile.columns.grid.hasOwnProperty('defaults')) {
            for(let defaultValue of profile.columns.grid.defaults) {
                params.data.push(defaultValue);
            }
        }        

        requests.push($.post('/plm/add-grid-row', params));

    });

    Promise.all(requests).then(function(responses) {

        $.get('/plm/grid', { link : link }, function(response) {

            insertMatrixColumn({
                link     : link,
                sections : data.sections,
                subtitle : (data.currentState.title || ''),
                grid     : response.data,
                first    : (profile.columns.sortDirection.toLowerCase() === 'descending')
            });

            updateStatusIndicators();

        });


    });

}


// Display selected tree item details panel
function onClickTreeItem(elemClicked) {

    const link       = elemClicked.attr('data-link');
    const isSelected = elemClicked.hasClass('selected');

    if(isSelected) insertDetails(link,       paramsDetails);   
    else           insertDetails(links.tree, paramsDetails);

}


// Set status column content and style
function updateStatusIndicators() {


    let statusBarCounters = {
        failure : 0,
        missing : 0,
        pending : 0,
        success : 0,
        partial : 0
    }      


    // Update Tree Leaf Latest Result Column
    $('#tree-tbody').find('.content-item.leaf').each(function() {

        let elemLeaf  = $(this);
        let listCells = elemLeaf.children('.matrix-column');
        let status    = null;
        let index     = null;

        listCells.each(function() {

            status = getMatchingStatusByClass($(this));

            if(status !== null) {
                index = $(this).index() - countTreeColumns;
                return false;
            }

        });

        updateLatestColumn(elemLeaf, status, index);

        if(status === null) {
            statusBarCounters.missing++; 
            elemLeaf.addClass(profile.statusDefinition.missing.className);
        } else statusBarCounters[status.type]++;

    }); 


    // Update Tree Nodes Latest Result Column
    $('#tree-tbody').find('.content-item.node').each(function() {

        let elemNode = $(this);
        let children = treeGetItemChildren(elemNode, false, 'leaf');
        let counters = {
            failure : 0,
            missing : 0,
            pending : 0,
            success : 0,
            partial : 0
        }

        for(let child of children) {

                 if(child.hasClass(profile.statusDefinition.pending.className)) counters.pending++;
            else if(child.hasClass(profile.statusDefinition.failure.className)) counters.failure++;
            else if(child.hasClass(profile.statusDefinition.partial.className)) counters.partial++;
            else if(child.hasClass(profile.statusDefinition.success.className)) counters.success++;
            else counters.missing++;

        }

        elemNode.removeClass(profile.statusDefinition.failure.className);
        elemNode.removeClass(profile.statusDefinition.pending.className);
        elemNode.removeClass(profile.statusDefinition.success.className);
        elemNode.removeClass(profile.statusDefinition.partial.className);        

             if(counters.failure   > 0) elemNode.addClass(profile.statusDefinition.failure.className);
        else if(counters.pending   > 0) elemNode.addClass(profile.statusDefinition.pending.className);
        else if(counters.missing === 0) elemNode.addClass(profile.statusDefinition.success.className);
        else                            elemNode.addClass(profile.statusDefinition.missing.className);

    }); 


    // Update Status Bar Elements
    updateStatusBarElement(statusBarCounters, 'failure');
    updateStatusBarElement(statusBarCounters, 'missing');
    updateStatusBarElement(statusBarCounters, 'pending');
    updateStatusBarElement(statusBarCounters, 'success');

    $('#status-bar').removeClass('hidden');

}
function getMatchingStatusByClass(elem) {

         if(elem.hasClass(profile.statusDefinition.failure.className)) return profile.statusDefinition.failure;
    else if(elem.hasClass(profile.statusDefinition.pending.className)) return profile.statusDefinition.pending;
    else if(elem.hasClass(profile.statusDefinition.success.className)) return profile.statusDefinition.success;
    else if(elem.hasClass(profile.statusDefinition.partial.className)) return profile.statusDefinition.partial;

    return null;

}
function updateLatestColumn(elemRow, status, index) {

    elemRow.removeClass(profile.statusDefinition.failure.className);
    elemRow.removeClass(profile.statusDefinition.missing.className);
    elemRow.removeClass(profile.statusDefinition.pending.className);
    elemRow.removeClass(profile.statusDefinition.success.className);
    elemRow.removeClass(profile.statusDefinition.partial.className);

    const elemLatest = elemRow.find('.matrix-column-latest').first();
    const elemLabel  = elemLatest.find('.matrix-latest-label');

    elemLatest.attr('data-link', '');
    elemLabel.html('');

    if(status === null) return;

    elemRow.addClass(status.className);

    let elemHead  = $('th.matrix-column').eq(index);
    let elemTitle = elemHead.find('.matrix-head-title');
    const link    = elemHead.attr('data-link');
    const count   = elemRow.find('.matrix-status-connected').length;

    elemLatest.attr('data-link', link);
    elemLatest.find('.matrix-button-filter-columns').html(count).removeClass('hidden');
    elemLabel.html(elemTitle.html());

}
function updateStatusBarElement(statusBarCounters, id) {

    const elemBar     = $('#status-bar-' + id);
    const elemCounter = elemBar.find('.status-bar-counter');
    
    elemBar.css('flex-grow', statusBarCounters[id]);
    elemCounter.html(statusBarCounters[id]);

    if(statusBarCounters[id] === 0) elemBar.addClass('hidden'); else elemBar.removeClass('hidden');

}