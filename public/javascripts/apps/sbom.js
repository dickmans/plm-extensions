let urlParameters      = getURLParameters();
let links              = {}
let wsConfigItems      = {};
let bomCompleted       = 0;
let partsListSourceBOM = [];
let bomTypes           = [];
let paramsDetails      = {
    editable       : false,
    openInPLM      : true,
    bookmark       : true,
    layout         : 'narrow',
    headerLabel    : 'descriptor',
    expandSections : ['Basic']
}

let saveActions = {
    create : {
        label       : 'Creating new BOM items',
        className   : 'pending-create',
        selector    : '.node',
        maxRequests : 1,
    },
    remove : {
        label       : 'Deleting BOM entries',
        className   : 'pending-remove',
        selector    : '',
        maxRequests : 4,
    },
    add : {
        label        : 'Adding BOM items',
        className   : 'pending-add',
        selector    : '',
        maxRequests : 5,
    },
    rename : {
        label       : 'Renaming existing BOM nodes',
        className   : 'pending-rename',
        selector    : '',
        maxRequests : 4,
    }, 
    update : {
        label       : 'Updating existing BOM entries',
        className   : 'pending-item-update',
        selector    : '',
        maxRequests : 5,
    }
}

$(document).ready(function() {

    appendOverlay(true);
    appendProcessing('panel', false);

    $('#header-title').html(config.sbom.appTitle);

    let requests = [
        $.get('/plm/details'             , { link : urlParameters.link }),
        $.get('/plm/picklist'            , { link : '/api/v3/lookups/' + config.sbom.picklistIdItemType }),
        $.get('/plm/sections'            , { wsId : urlParameters.wsId }),
        $.get('/plm/sections'            , { wsId : config.items.wsId }),
        $.get('/plm/bom-views-and-fields', { wsId : config.items.wsId })
    ]; 

    getFeatureSettings('sbom', requests, function(responses) {

        initEditor(responses);
        setUIEvents();
        insertDetails(urlParameters.link, paramsDetails);

        insertBrowser('browser', [{
            label   : 'All Items', 
            type    : 'views',
            id      : 'browser-views',
            wsId    : config.items.wsId,
            settings : { 
                reload : true
            }
        },{
            label   : 'Search', 
            type    : 'search',
            settings : {
                id          : 'browser-search',
                workspaceId : [ config.items.wsId ],
            }
        },{
            label    : 'Bookmarks', 
            type     : 'bookmarks',
            settings : {
                reload       : true,
                workspacesIn : [ config.items.wsId ]
            }
        },{
            label    : 'Recent', 
            type     : 'recents',
            settings : {
                reload       : true,
                workspacesIn : [ config.items.wsId ]
            }
        }], {
            enableDragging  : true,
            enableDetails   : true,
            settingsDetails : paramsDetails
        });

    });

});

function setUIEvents() {

    $('#mode').on('change', function() {
        if($('#mode').val() === 'ebom') { 
            $('.mode-ebom').removeClass('hidden'); 
            $('.mode-lib').addClass('hidden'); 
        } else { 
            $('.mode-ebom').addClass('hidden'); 
            $('.mode-lib').removeClass('hidden'); 
        }
    })

    $('#toggle-viewer').click(function() {
        $(this).toggleClass('toggle-on');
        $('body').toggleClass('no-viewer');
        viewerResize(100);
    });

    $('#toggle-details').click(function() {
        $(this).toggleClass('toggle-on');
        $('body').toggleClass('no-details');
        viewerResize(100);
    });

    $('#save').click(function() {
        if($(this).hasClass('disabled')) return;
        saveChanges();
    }); 

}


// Get current Product data
function initEditor(responses) {

    $('#header-subtitle').html(responses[0].data.title);

    links.sourceBOM = getSectionFieldValue(responses[0].data.sections, config.sbom.sourceBOM.fieldId, '', 'link');
    links.targetBOM = getSectionFieldValue(responses[0].data.sections, config.sbom.targetBOM.fieldId, '', 'link');

    wsConfigItems.fieldIds         = config.sbom.itemsFieldIds;
    wsConfigItems.sections         = responses[3].data;
    wsConfigItems.fieldIdHighlight = config.sbom.itemHighlight.fieldId;
    wsConfigItems.valuesHighlight  = [];

    for(let value of config.sbom.itemHighlight.fieldValues) wsConfigItems.valuesHighlight.push(value.toLowerCase());
    
    for(let type of responses[1].data.items) {
        if(type.title === config.sbom.targetBOM.itemTypeValue) wsConfigItems.linkTypeTargetBOM = type.link;
    }
    
    for(let bomView of responses[4].data) {
        if(bomView.name === config.sbom.targetBOM.bomViewName) {
            wsConfigItems.bomViewId     = bomView.id;
            wsConfigItems.bomViewFields = bomView.fields;
            break;
        }
    }

    bomTypes = config.sbom.bomTypes;

    for(let bomType of bomTypes) {

        let index = $('#tabs').children().length;

        $('<div></div>').appendTo($('#tabs'))
            .addClass('with-icon')
            .addClass(bomType.icon)
            .attr('data-id', 'bom-type-' + index)
            .html(bomType.tabLabel);

        let elemTab = $('<div></div>').appendTo($('#panel'))
            .addClass('tab-group-main')
            .addClass('hidden')
            .addClass('surface-level-2');

        let elemActions = $('<div></div>').appendTo(elemTab).addClass('panel-actions');
        let elemContent = $('<div></div>').appendTo(elemTab).addClass('panel-content');

        if(!isBlank(bomType.hideQuantity)) {
            if(bomType.hideQuantity) elemContent.addClass('no-quantity');
        }

        bomType.picklistLinks = [];
        bomType.elemContent   = elemContent;
        bomType.className     = 'type-' + index;

        if(bomType.mode != 'list') {

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('default')
                .addClass('with-icon')
                .addClass('icon-create')
                .html(bomType.buttonLabels[0] || 'Create')
                .click(function() {
                    insertNode(bomType, bomType.elemContent, 0, null);
                    updatePosNumbers();        
                });    

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-unfold')
                .click(function() {
                    $(this).parent().next().children('.node').addClass('expanded').removeClass('collapsed');
                }); 

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('icon')
                .addClass('icon-fold')
                .click(function() {
                    $(this).parent().next().children('.node').removeClass('expanded').addClass('collapsed');    
                });

            elemContent.addClass('nodes');

        } else {

            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('with-icon')
                .addClass('icon-list-add')
                .html(bomType.buttonLabels[0] || 'Create')
                .click(function() {
                    addAllHighlighted();
                }) ; 

            elemContent.addClass('items-list')
                .addClass('items-list')
                .addClass('tiles')
                .addClass('list')
                .addClass('xs');

        }

        $('<div></div>').appendTo(elemActions)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-3d')
            .attr('title', 'Highlight items of this list in viewer and in BOM')
            .click(function() {
                filterByItemsList($(this));
            });

        for(let bomItemType of bomType.bomItemTypes) {
            for(let type of responses[1].data.items) {
                if(type.title.toLowerCase() === bomItemType.toLowerCase()) {
                    bomType.picklistLinks.push(type.link);
                } 
            }
        }

    }

    if(isBlank(links.sourceBOM)) {

        showErrorMessage('Failure when loading Source BOM', 'Could not find the source BOM item in field ' + config.sbom.sourceBOM.fieldId + '. Please contact your administrator to review your server settings file.')

    } else {

        insertViewer(links.sourceBOM); 

        insertBOM(links.sourceBOM, {
            collapseContents   : false,
            counters           : true,
            search             : true,
            path               : true,
            toggles            : true,
            viewerSelection    : true,
            openInPLM          : true,
            includeBOMPartList : true,
            headerLabel        : config.sbom.sourceBOM.headerLabel,
            hideHeaderLabel    : (config.sbom.sourceBOM.headerLabel === ''),
            contentSize        : 'l',
            fieldsIn           : ['Quantity'],
            bomViewName        : config.sbom.sourceBOM.bomViewName,
            onClickItem        : function(elemClicked) { insertDetails(elemClicked.attr('data-link'), paramsDetails); },
            afterCompletion    : function(id, data)    { 
                partsListSourceBOM = data.bomPartsList; 
                insertBOMItemFilter();
                insertBOMIndicators(); 
                enableBOMItemDragging();
                $('#save').removeClass('disabled').addClass('default');
            }
        }); 

        }
    
    createTargetBOM(responses[0].data, responses[2].data, function() {
        getTargetBOM();
    });

}
function createTargetBOM(contextDetails, contextSections, callback) {

    if(isBlank(links.targetBOM)) {

        let params = {
            wsId      : config.items.wsId,
            sections  : []
        };
        
        if(!isBlank(links.sourceBOM)) {

            $.get('/plm/details', { link : links.sourceBOM }, function(response) {

                setTargetBOMDefaults(params, contextDetails, response.data, config.sbom.targetBOM.defaults.number     , wsConfigItems.fieldIds.number     );
                setTargetBOMDefaults(params, contextDetails, response.data, config.sbom.targetBOM.defaults.title      , wsConfigItems.fieldIds.title      );
                setTargetBOMDefaults(params, contextDetails, response.data, config.sbom.targetBOM.defaults.description, wsConfigItems.fieldIds.description);

                addFieldToPayload(params.sections, wsConfigItems.sections, null, wsConfigItems.fieldIds.type , { link : wsConfigItems.linkTypeTargetBOM } );

                $.post({
                    url         : '/plm/create', 
                    contentType : 'application/json',
                    data        : JSON.stringify(params)
                }, function(response) {
                    if(response.error) {
                        showErrorMessage('Error', 'Error while creating Target BOM root item, the editor cannot be used at this time. Please review your server configuration.');
                    } else {
                        links.targetBOM = response.data.split('.autodeskplm360.net')[1];
                        storeTargetBOMLink(contextSections);
                        callback();
                    }
                }); 

            });

        }

    } else callback();

}
function setTargetBOMDefaults(params, contextDetails, bomDetails, defaults, fieldId) {

    if(isBlank(defaults.copyFrom)) return;

    let copyFrom    = defaults.copyFrom.split('.');
    let baseDetails = (copyFrom[0] == 'bom') ? bomDetails : contextDetails;
    let baseValue   = getSectionFieldValue(baseDetails.sections, copyFrom[1], '');
    let newValue    = defaults.prefix + baseValue + defaults.suffix;

    if(!isBlank(newValue)) addFieldToPayload(params.sections, wsConfigItems.sections, null, fieldId, newValue);

}
function storeTargetBOMLink(contextSections) {

    let params = { link : urlParameters.link, sections : [] }

    addFieldToPayload(params.sections, contextSections, null, config.sbom.targetBOM.fieldId, { link : links.targetBOM} );

    $.post('/plm/edit', params, function() {});

}
function getTargetBOM() {

    if(isBlank(links.targetBOM)) return;

    let bomSettings = { viewFields : wsConfigItems.bomViewFields };

    let params = {
        link    : links.targetBOM,
        depth   : 3,
        viewId  : wsConfigItems.bomViewId
    }

    $.get('/plm/bom', params, function(response) {

        let partsListTargetBOM  = getBOMPartsList(bomSettings, response.data);
        let indexType           = null;
        let mode                = '';

        for(let part of partsListTargetBOM) {

            let type  = part.details[ wsConfigItems.fieldIds.type] || { title : '' };
            let level = part.level;

            if(level === 1) {
                mode = '';
                for(let index in bomTypes) {
                    if(bomTypes[index].bomItemTypes[0] == type.title) {
                        indexType = index;
                        mode      = bomTypes[index].mode;
                        if(mode === 'list') bomTypes[index].linkRoot = part.link;
                        break;
                    }
                }
            }

            let bomType = bomTypes[indexType];

            switch(mode) {

                case '2-levels-bom':
                    if(level === 1) {
                        bomType.elemRoot = insertNode(bomType, bomType.elemContent, 0, part);
                    } else if(level === 2) {
                        bomType.elemNode = insertNode(bomType, bomType.elemRoot.children('.nodes-list').first(), 1, part);
                    } else if(level === 3) {
                        insertItem(bomType.elemNode, part);
                    }
                    break;

                case '1-level-bom':
                    if(level === 1) {
                        bomType.elemNode = insertNode(bomType, bomType.elemContent, 0, part);
                    } else if(level === 2) {
                        insertItem(bomType.elemNode, part);
                    }
                    break;

                case 'list':
                    if(level === 1) {
                        bomType.elemContent.attr('data-link', bomType.linkRoot)
                            .attr('ondragenter', 'dragEnterList(event)'   )
                            .attr('ondragover' , 'dragEnterList(event)'   )
                            .attr('ondragleave', 'dragLeaveHandler(event)')
                            .attr('ondrop'     , 'dropHandler(event)'     );  
                    } else if(level === 2) insertItem(bomType.elemContent, part);
                    break;

            }

        }

        createListParents(function() {
            insertBOMIndicators();
            updatePosNumbers();
        });
        

    });
        
}
function insertBOMItemFilter() {

    let filters = [];

    if(!isBlank(config.sbom.itemHighlight)) {
        if(!isBlank(config.sbom.itemHighlight.filterLabelIn)) filters.push({ type : 'in', className : 'highlighted', label : config.sbom.itemHighlight.filterLabelIn })
        if(!isBlank(config.sbom.itemHighlight.filterLabelEx)) filters.push({ type : 'ex', className : 'highlighted', label : config.sbom.itemHighlight.filterLabelEx })
    }

    if(!isBlank(config.sbom.targetBOM.filterLabelIn)) filters.push({ type : 'in', className : 'in-use', label : config.sbom.targetBOM.filterLabelIn })
    if(!isBlank(config.sbom.targetBOM.filterLabelEx)) filters.push({ type : 'ex', className : 'in-use', label : config.sbom.targetBOM.filterLabelEx })

    for(let bomType of bomTypes) {
        if(!isBlank(bomType.filterLabelIn)) filters.push({ type : 'in', className : bomType.className, label : bomType.filterLabelIn })
        if(!isBlank(bomType.filterLabelEx)) filters.push({ type : 'ex', className : bomType.className, label : bomType.filterLabelEx })
    }

    sortArray(filters, 'label');

    let elemSelect = $('<select></select>').prependTo($('#bom-controls'))
        .addClass('button')
        .attr('id', 'select-bom-filter')
        .on('change', function() {
            applyBOMItemFilter();
        });

    $('<option></option>').appendTo(elemSelect)
        .attr('value', '--')
        .html('Display All');

    for(let filter of filters) {
        $('<option></option>').appendTo(elemSelect)
        .attr('value', filter.type + '.' + filter.className)
        .html(filter.label);
    }

}
function createListParents(callback) {

    let requests = [];
    let types    = [];

    for(let bomType of bomTypes) {

        if(bomType.mode == 'list') {

            if(isBlank(bomType.linkRoot)) {

                let params = {
                    wsId      : config.items.wsId,
                    sections  : []
                };
        
                let title = bomType.bomItemTypes[0];

                addFieldToPayload(params.sections, wsConfigItems.sections, null, wsConfigItems.fieldIds.title, title );
                addFieldToPayload(params.sections, wsConfigItems.sections, null,  wsConfigItems.fieldIds.type, { link : bomType.picklistLinks[0] } );

                requests.push($.post({
                    url         : '/plm/create', 
                    contentType : 'application/json',
                    data        : JSON.stringify(params)
                }));

                types.push(bomType);

            }
            
        }

    }

    Promise.all(requests).then(function(responses) {

        requests = [];

        for(let index in responses) {

            let response = responses[index];
            let link     = response.data.split('plm360.net')[1];

            let params = {
                linkParent : links.targetBOM,
                linkChild  : link,
                quantity   : 1,
                number     : types[index].basePosNumber,
                pinned     : config.sbom.enableBOMPin
            }

            requests.push($.post('/plm/bom-add', params));
            types[index].linkRoot = link;
            types[index].elemContent.attr('data-link', link);
            types[index].basePosNumber++;
        }

        Promise.all(requests).then(function() {
            callback();
        });

    });

}
function insertBOMIndicators() {

    bomCompleted++;

    if(bomCompleted > 1) {       

        $('#panel-processing').remove();
        enableTabs();

        let elemTHRow = $('#bom-thead-row');
        
        if(!isBlank(config.sbom.itemHighlight)) {
            $('<th></th>').appendTo(elemTHRow) 
                .addClass('bom-column-highlighted')
                .html(config.sbom.itemHighlight.bomColumnTitle);
        }

        for(let bomType of bomTypes) {
            elemTHRow.append($('<th class="type"><i class="icon ' + bomType.icon + '"></i></th>'))
        }
            
        $('#bom-tbody').children('.content-item').each(function() {

            let elemCellHighlighted = $('<td class="bom-column-highlighted"></td>');
            let isHighlighted       = false;

            for(let part of partsListSourceBOM) {
                if(part.link === $(this).attr('data-link')) {
                    if(elemCellHighlighted.length > 0) elemCellHighlighted.html(part.details[wsConfigItems.fieldIdHighlight]);

                    if(!isBlank(part.details[wsConfigItems.fieldIdHighlight])) {
                        let fieldValue = part.details[wsConfigItems.fieldIdHighlight].toLowerCase();
                        if(wsConfigItems.valuesHighlight.includes(fieldValue)) isHighlighted = true;
                    }

                }
            }

            if(isHighlighted) $(this).addClass('highlighted');

            if(elemCellHighlighted.length > 0) elemCellHighlighted.appendTo($(this));

            for(let index in bomTypes) {
                $('<td class="type">-</td>').appendTo($(this)).addClass('type-' + index);
            }

        });

        updateBOMIndicators();

    }

}
function updateBOMIndicators() {

    for(let bomType of bomTypes) {

        let elemContent = bomType.elemContent;

        bomType.itemsList = [];

        elemContent.find('.node:not(.hidden)').find('.items-list-row:not(.hidden)').each(function() {
            bomType.itemsList.push($(this));
        });

        if(elemContent.hasClass('items-list')) {
            elemContent.children('.items-list-row:not(.hidden)').each(function() {
                bomType.itemsList.push($(this));
            });
        }

    }

    $('#bom-tbody').children('.content-item').each(function() {

        let elemBOMItem = $(this);
        let linkBOM     = elemBOMItem.attr('data-link');
        
        elemBOMItem.removeClass('in-use');

        for(let bomType of bomTypes) {

            let elemCell = elemBOMItem.children('.type.' + bomType.className).first();

            elemCell.html('-');

            elemBOMItem.removeClass(bomType.className);

            for(let listItem of bomType.itemsList) {

                let link = listItem.attr('data-link');
                if(!isBlank(link)) {
                    if(link === linkBOM) {
                        elemBOMItem.addClass(bomType.className);
                        elemBOMItem.addClass('in-use');
                        elemCell.html('');
                        $('<i></i>').appendTo(elemCell)
                            .addClass('icon')
                            .addClass(bomType.icon)
                            .css('background', bomType.color)
                            .attr('title', bomType.tabLabel);
                    }
                }

            }
        }
    });

    return;

}
function updatePosNumbers() {

    for(let bomType of bomTypes) {

        let basePosNumber = bomType.basePosNumber;
        let elemContent   = bomType.elemContent;
        let topLevelNodes = elemContent.children('.node');

        if(elemContent.hasClass('items-list')) updateItemListPosNumbers(elemContent.parent());

        topLevelNodes.each(function() {

            if(!$(this).hasClass('hidden')) {

                $(this).attr('data-number-new', basePosNumber++);

                updateItemListPosNumbers($(this));

                let nodesList = $(this).children('.nodes-list');

                if(nodesList.length > 0) {
                    nodesList.children().each(function() {
                        updateItemListPosNumbers($(this));
                    });
                }

            }

        });
    }

}
function updateItemListPosNumbers(elemParent) {

    let elemItemsList = elemParent.children('.items-list');
    let number        = 1;

    if(elemItemsList.length > 0) {

        elemItemsList.children('.list-item').each(function() {

            if(!$(this).hasClass('hidden')) {

                let elemCounter = $(this).find('.tile-counter');
                    elemCounter.html(number++);

            }
            
        });

    }

}


// Filter Viewer and BOM for matching items
function applyBOMItemFilter() {

    let value = $('#select-bom-filter').val();
    
    if(value === '--') {

        $('#bom-tbody').children().show();
        viewerResetSelection();

    } else {

        let partNumbers = [];
        let split       = value.split('.');

        $('#bom-tbody').children().each(function() {

            let elemItem = $(this);

            if(elemItem.hasClass(split[1])) {
                if(split[0] === 'in') {
                    elemItem.show(); 
                    if(elemItem.hasClass('leaf')) partNumbers.push(elemItem.attr('data-part-number'));
                } else elemItem.hide();
            } else {
                if(split[0] === 'in') {
                    elemItem.hide(); 
                } else {
                    elemItem.show();
                    if(elemItem.hasClass('leaf')) partNumbers.push(elemItem.attr('data-part-number'));
                }
            }

        });

        viewerSelectModels(partNumbers);

    }

}


// Insert UI elements for root item definition
function insertNode(bomType, elemParent, level, part) {

    if(isBlank(part)) {
        part = {
            link    : '',
            edgeId  : '',
            number  : '',
            details : {}
        }
        part.details[wsConfigItems.fieldIds.title] = '';
    }

    let hasItems = ((level > 0) || (bomType.mode != '2-levels-bom'));

    let elemNode  = $('<div></div>').appendTo(elemParent)
        .addClass('node')
        .addClass('expanded')
        .addClass('surface-level-1')
        .attr('data-link', part.link)
        .attr('data-edgeid', part.edgeId)
        .attr('data-number', part.number)
        .attr('data-title', part.details[wsConfigItems.fieldIds.title])
        .attr('data-link-type', bomType.picklistLinks[level])
        .attr('ondragenter', 'dragEnterNode(event)')
        .attr('ondragover', 'dragEnterNode(event)')
        .attr('ondragleave', 'dragLeaveHandler(event)')
        .attr('ondrop', 'dropHandler(event)');  

    let elemHeader = $('<div></div>').appendTo(elemNode)
        .addClass('node-header');  

    $('<div></div>').appendTo(elemHeader)
        .addClass('node-toggle')
        .addClass('icon')
        .addClass('button')
        .click(function(e) {
            clickNodeToggle(e, $(this));
        });

    let elemTitle = $('<input>').appendTo(elemHeader)
        .addClass('node-title')
        .attr('placeholder', 'Enter Name')
        .val(part.details[wsConfigItems.fieldIds.title])
        .on('keyup', function() {
            if($(this).val() === '') $(this).addClass('node-title-empty'); else $(this).removeClass('node-title-empty'); 
        });

    if(elemTitle.val() === '') elemTitle.addClass('node-title-empty');
        
    let elemActions = $('<div></div>').appendTo(elemHeader)
        .addClass('node-actions');

    if(bomType.mode == '2-levels-bom') {

        if(level === 0) {
            $('<div></div>').appendTo(elemActions)
                .addClass('button')
                .addClass('default')
                .addClass('with-icon')
                .addClass('icon-create')
                .html(bomType.buttonLabels[level +1] || 'Create')
                .click(function(e) {
                    let elemNodesList = $(this).closest('.node').find('.nodes-list').first();
                    insertNode(bomType, elemNodesList, level + 1, null);
                    updatePosNumbers();
                });
        }

    }

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-3d')
        .click(function() {
            filterByItemsList($(this));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')        
        .click(function() {
            openItemByLink($(this).closest('.node').attr('data-link'));
        })  
        
        $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.node').addClass('hidden');
            updatePosNumbers();
            updateBOMIndicators();
        });     

    if(hasItems) {

        $('<div></div>').appendTo(elemNode)
            .addClass('node-children')
            .addClass('items-list')
            .addClass('tiles')
            .addClass('list')
            .addClass('xs');

    } else {

        $('<div></div>').appendTo(elemNode)
            .addClass('node-children')
            .addClass('nodes-list');

    }

    if(part.link === '') elemTitle.focus();

    return elemNode;

}
function insertItem(elemParent, part) {

    let elemItemsList = (elemParent.hasClass('items-list')) ? elemParent : elemParent.find('.items-list').first();
    let addItem       = true;

    if(elemParent.hasClass('no-quantity')) part.quantity = '1.0';

    elemItemsList.children().each(function() {
        if($(this).attr('data-link') === part.link) {
            if($(this).hasClass('hidden')) {
                $(this).appendTo(elemItemsList).removeClass('hidden');
            }
            addItem = false;
            return $(this);
        }
    })

    if(!addItem) return;

    let elemRow = $('<div></div>').appendTo(elemItemsList)
        .addClass('items-list-row')
        .addClass('list-item')
        .addClass('surface-level-1')
        .attr('data-link', part.link)
        .attr('data-edgeid', part.edgeId)
        .attr('data-number', part.number)
        .attr('data-quantity', part.quantity)
        .attr('ondragenter', 'dragEnterItem(event)')
        .attr('ondragover' , 'dragEnterItem(event)')
        .attr('ondragleave', 'dragLeaveHandler(event)')
        .attr('ondrop'     , 'dropHandler(event)');

    $('<input>').appendTo(elemRow)
        .addClass('list-item-quantity')
        .val(part.quantity);

    let elemItem  = $('<div></div>').appendTo(elemRow)
        .addClass('tile')
        .attr('data-link', part.link)
        .attr('data-edgeid', part.edgeId)
        .attr('data-part-number', part.partNumber)
        .attr('draggable', 'true')
        .attr('ondragstart', 'dragStartHandler(event)')
        .attr('ondragend', 'dragEndHandler(event)')
        .click(function() {
            let isSelected = $(this).hasClass('selected');
            $('.items-list-row').children().removeClass('selected');
            if(!isSelected) {
                $(this).addClass('selected');
                let link = $(this).attr('data-link');
                let first = true;
                viewerSelectModel($(this).attr('data-part-number'));
                insertDetails(link, paramsDetails);
                $('.bom-item').removeClass('selected');
                $('.bom-item').each(function() {
                    if(link === $(this).attr('data-link')) {
                        if(first) {
                            $(this).addClass('selected');
                            bomDisplayItem($(this));
                            updateBOMPath($(this));
                            updatePanelCalculations('bom');
                            first = false;
                        }
                    }
                });
            } else {
                viewerResetSelection();
                $('.bom-item').removeClass('selected');
                updatePanelCalculations('bom');
                resetBOMPath('bom')
            }
        });

    let elemImage = $('<div></div>').appendTo(elemItem)
        .addClass('tile-image')

    $('<div></div>').appendTo(elemImage).addClass('tile-counter').html(part.number);

    let elemDetails = $('<div></div>').appendTo(elemItem)
        .addClass('tile-details');    

    $('<div></div>').appendTo(elemDetails)
        .addClass('tile-title')
        .html(part.title);

    $('<div></div>').appendTo(elemRow)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {

            let elemItemRow = $(this).closest('.items-list-row');
            let elemEdgeId  = elemItemRow.attr('data-edgeid');

            if(elemEdgeId === '') elemItemRow.remove();
            else elemItemRow.addClass('hidden');

            updateBOMIndicators();
            updatePosNumbers();

        });

    return elemRow;

}
function clickNodeToggle(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    elemClicked.closest('.node').toggleClass('collapsed').toggleClass('expanded');

}


// Drag & Drop feature
function enableBOMItemDragging() {

    $('#bom-tbody').children().each(function() {
        
        let elemRow = $(this);
            elemRow.attr('draggable'  , 'true');
            elemRow.attr('ondragstart', 'dragStartHandler(event)');
            elemRow.attr('ondragend'  , 'dragEndHandler(event)');

    });

}
function dragStartHandler(e) {
    
    $('.dragged').removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');
    
    let elemDragged = $(e.target);
        elemDragged.addClass('dragged');

    e.dataTransfer.setData('text/plain', elemDragged.attr('data-link'));

}
function dragEnterNode(e) {

    e.preventDefault();
    e.stopPropagation();

    let elemTarget = $(e.target);

    if(elemTarget.hasClass('items-list')) {
        elemTarget.addClass('drag-hover');
        elemTarget.closest('.node').addClass('drag-hover');
    } else if(elemTarget.children('items-list').length > 0) {
        elemTarget.addClass('drag-hover');
    }

}
function dragEnterList(e) {

    e.preventDefault();
    e.stopPropagation();

    $(e.target).addClass('drag-hover');

}
function dragEnterItem(e) {

    e.preventDefault();
    e.stopPropagation();

    let elemTarget = $(e.target);

    if(!elemTarget.hasClass('items-list-row')) elemTarget = elemTarget.closest('.items-list-row');

    elemTarget.addClass('drag-hover');

}
function dragLeaveHandler(e) {

    $('.drag-hover').removeClass('drag-hover');

}
function dragEndHandler(e) {

    $('.drag-hover').removeClass('.drag-hover');

}
function dropHandler(e) {

    e.preventDefault();
    e.stopPropagation();

    let elemTarget  = $(e.target);
    let elemDragged = $('.dragged').first();
    let fromBOM     = elemDragged.is('tr') && ($('#mode').val() === 'ebom');
    let fromBrowser = elemDragged.hasClass('content-item') && ($('#mode').val() === 'lib');
    let elemItem    = elemTarget.closest('.items-list-row');
    let onItem      = elemItem.length > 0;

    if(fromBOM) {

        let part = {
            link        : elemDragged.attr('data-link'), 
            partNumber  : elemDragged.attr('data-part-number'),  
            title       : elemDragged.attr('data-title'),  
            edgeId      : '', 
            quantity    : elemDragged.attr('data-quantity')
        }

        if(onItem) elemTarget = elemTarget.closest('.items-list');

        let newItem = insertItem(elemTarget, part);

        if(onItem) newItem.insertBefore(elemItem);

    } else if(fromBrowser) {

        let part = {
            link        : elemDragged.attr('data-link'), 
            partNumber  : elemDragged.attr('data-part-number'),  
            title       : elemDragged.attr('data-title'),  
            edgeId      : '', 
            quantity    : '1.0'
        }

        let newItem = insertItem(elemTarget, part);

        if(onItem) newItem.insertBefore(elemItem);

    } else {
        
        elemDragged = elemDragged.closest('.items-list-row');

        if(e.shiftKey) elemDragged = elemDragged.clone();

        if(onItem) elemDragged.insertBefore(elemItem);
        else elemDragged.appendTo(elemTarget);

    }

    $('.dragged'   ).removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');

    updateBOMIndicators();
    updatePosNumbers();

}


// Add all recommended items to the Spare Parts list
function addAllHighlighted() {

    let listHighlighted = $('.bom-item.highlighted');
    let elemTarget      = $('.panel-content.items-list');

    if(elemTarget.length === 0) return;

    listHighlighted.each(function() {

        let add             = true;
        let elemHighlighted = $(this);
        let linkHighlighted = $(this).attr('data-link');

        elemTarget.children('.items-list-row').each(function() {
            let linkListItem = $(this).attr('data-link');
            if(linkHighlighted === linkListItem) {
                $(this).removeClass('hidden');
                add = false;
                return 0;
            }
        })

        if(add) {

            let part = {
                link        : linkHighlighted, 
                title       : elemHighlighted.attr('data-title'),  
                partNumber  : elemHighlighted.attr('data-part-number'),
                edgeId      : '', 
                quantity    : elemHighlighted.attr('data-quantity')
            };

            insertItem(elemTarget, part);

        }

    });

    updateBOMIndicators();
    updatePosNumbers();

}


/* Filter for items of given contenxt */
function filterByItemsList(elemClicked) {

    let partNumbers  = [];
    let elemParent   = elemClicked.parent();
    let elemContext  = elemParent.parent();

    if(elemContext.hasClass('node-header')) elemContext = elemContext.next();

    $('.bom-item').removeClass('result');
    
    elemContext.find('.items-list-row:not(.hidden)').each(function() {
        let partNumber = $(this).children('.tile').attr('data-part-number');
        partNumbers.push(partNumber);
        $('.bom-item').each(function() {
            if($(this).attr('data-part-number') === partNumber) $(this).addClass('result');
        })
    });
    
    viewerSelectModels(partNumbers);

}


// Viewer selection to highlight BOM entry
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    viewerGetSelectedPartNumber(event, function(partNumber) {
        let links = bomDisplayItemByPartNumber(partNumber);
        if(links.length > 0) {
            insertDetails(links[0], paramsDetails);
        }
    });

}


// Save all changes when clicking the Save button
function saveChanges() {
    
    resetSaveActions();
    hideMessage();

    let missingTitles = false;

    $('.node-title-empty').each(function() {
        let elemParent = $(this).closest('.node');
        if(!elemParent.hasClass('hidden')) missingTitles = true;
    })    
    
    if(missingTitles) {
        showErrorMessage('Missing Data', 'Cannot save changes as names are missing');
        return;
    }

    $('#panel').find('.node').each(function() {

        let link   = $(this).attr('data-link');
        let edgeId = $(this).attr('data-edgeid');
        let title  = $(this).attr('data-title');
        let posCur = $(this).attr('data-number');
        let posNew = $(this).attr('data-number-new');
        let label  = $(this).find('.node-title').val();
        let hidden = $(this).hasClass('hidden');

        if(hidden) {
            if(edgeId === '') $(this).remove();
            else $(this).addClass(saveActions.remove.className);
        }
        else if(link === '')  $(this).addClass(saveActions.create.className).addClass(saveActions.add.className);
        else if(title !== label) $(this).addClass(saveActions.rename.className);

        if(edgeId !== '') {
            if(!isBlank(posNew)) {
                if(posNew !== posCur) {
                    if(!$(this).hasClass('hidden')) {
                        $(this).addClass(saveActions.update.className);
                    }
                }
            }
        }

    });

    $('.items-list-row').each(function() {

        let elemItemRow = $(this);
        let edgeId      = elemItemRow.attr('data-edgeid');
        let quantity    = getItemQuantity(elemItemRow);
        let posCur      = $(this).attr('data-number');
        let posNew      = getPosNumber($(this));

        if(elemItemRow.hasClass('hidden')) elemItemRow.addClass(saveActions.remove.className).removeClass(saveActions.update.className);
        else if(edgeId === '') elemItemRow.addClass(saveActions.add.className);
        else if(parseFloat(quantity) !== parseFloat(elemItemRow.attr('data-quantity'))) {
            elemItemRow.addClass(saveActions.update.className);
        }

        if(edgeId !== '') {
            if(posNew !== '') {
                if(posNew !== posCur) {
                    if(!elemItemRow.hasClass('hidden')) {
                        $(this).addClass(saveActions.update.className);
                    }
                }
            }
        }

    });

    showSaveDialog();
    createNewItems(saveActions.create);

}
function createNewItems(action) {

    let pending  = updateSaveProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length === 0) { removeBOMItems(saveActions.remove); }
    else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let params = {
                    wsId      : config.items.wsId,
                    sections  : []
                };

                let title = $(this).find('.node-title').first().val();
                let type  = $(this).attr('data-link-type');

                addFieldToPayload(params.sections, wsConfigItems.sections, null, wsConfigItems.fieldIds.title, title);
                addFieldToPayload(params.sections, wsConfigItems.sections, null,  wsConfigItems.fieldIds.type, { link : type });
    
                requests.push($.post('/plm/create', params));
                elements.push($(this));

                $(this).attr('data-title', title);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error', response.data.message);
                    endSaveProcessing();
                }
            }

            storeNewItemLinks(action, elements, responses);
            createNewItems(action); 

        });

    }

}
function removeBOMItems(action) {

    let pending  = updateSaveProgressBar(action);
    let requests = [];

    if(pending.length === 0) { addBOMItems(saveActions.add); }
    else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem   = $(this);
                let linkParent = getParentLink(elemItem);
                let edgeId     = elemItem.attr('data-edgeid');

                if(!isBlank(linkParent)) {
                    requests.push($.get('/plm/bom-remove', {
                        link   : linkParent,
                        edgeId : edgeId
                    }));
                }

                elemItem.remove();

            }

        });

        Promise.all(requests).then(function() { removeBOMItems(action); });        

    }

}  
function addBOMItems(action) {

    let pending  = updateSaveProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length === 0) { renameItems(saveActions.rename); }
    else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem = $(this);
                let quantity = getItemQuantity(elemItem);

                let params = {
                    linkParent : getParentLink(elemItem),
                    number     : getPosNumber(elemItem),
                    linkChild  : elemItem.attr('data-link'),
                    quantity   : quantity,
                    pinned     : false
                }

                requests.push($.post('/plm/bom-add', params));
                elements.push(elemItem);

                $(this).attr('data-quantity', params.quantity);
                $(this).attr('data-number'  , params.number);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error', response.data.message);
                    endSaveProcessing();
                }
            }

            storeNewBOMEdgeId(action, elements, responses);
            addBOMItems(action);

        });

    }

}
function renameItems(action) {

    let pending  = updateSaveProgressBar(action);
    let requests = [];

    if(pending.length === 0) { updateBOMItems(saveActions.update); }
    else {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem = $(this);
                let params   = {
                    link     : elemItem.attr('data-link'),
                    sections : []
                };

                let title = elemItem.find('.node-title').first().val();

                addFieldToPayload(params.sections, wsConfigItems.sections, null, wsConfigItems.fieldIds.title, title);

                console.log(wsConfigItems);
                console.log(title);
                console.log(params);

                requests.push($.post('/plm/edit', params));
                elemItem.removeClass(action.className);
                elemItem.attr('data-title', title);

            }

        });

        Promise.all(requests).then(function(responses) { renameItems(action);  });

    }

}
function updateBOMItems(action) {       
    
    let pending  = updateSaveProgressBar(action);
    let requests = [];

    if(pending.length === 0) { endSaveProcessing(); }
    else {

        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem = $(this);
                let quantity = getItemQuantity(elemItem);
                let number   = getPosNumber(elemItem);

                let params = {                    
                    linkParent : getParentLink(elemItem),
                    linkChild  : elemItem.attr('data-link'),
                    edgeId     : elemItem.attr('data-edgeid'),
                    number     : number,
                    quantity   : quantity,
                    pinned     : false
                };

                requests.push($.post('/plm/bom-update', params));
                elemItem.removeClass(action.className);

                elemItem.attr('data-quantity', quantity);
                elemItem.attr('data-number', number);
                elemItem.removeAttr('data-number-new');

            }

        });

        Promise.all(requests).then(function(responses) { updateBOMItems(action) });

    }
    
}
function getParentLink(elemItem) {

    let isRoot = elemItem.parent().hasClass('panel-content');

    if(isRoot) {
        if(elemItem.hasClass('node')) return links.targetBOM;
        else return elemItem.parent().attr('data-link');
    }

    let elemParentNode = elemItem.closest('.node-children').closest('.node');

    return elemParentNode.attr('data-link');

}
function getPosNumber(elemItem) {

    let isItem      = elemItem.hasClass('items-list-row');
    let elemCounter = elemItem.find('.tile-counter');
    let valueNew    = elemItem.attr('data-number-new');

    if(isItem) { if(elemCounter.length > 0) return elemCounter.html(); }
    if(!isBlank(valueNew)) return valueNew;
    
    return ;

}
function getItemQuantity(elemItem) {

    if(elemItem.hasClass('node')) return 1.0;

    let elemQuantity = elemItem.find('.list-item-quantity');
    let elemParent   = elemItem.closest('.items-list');

    if(elemParent.attr('id') === 'spare-parts') return 1.0;

    return elemQuantity.val();

}