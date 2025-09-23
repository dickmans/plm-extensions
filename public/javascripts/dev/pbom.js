let urlParameters       = getURLParameters();
let wsConfig            = { items : {}, processes : {}, operations : {} };
let links               = {};
let bomPartsList        = [];
let picklists           = { processTypes  :[], operationTypes : [], machines : [] };
let processPartsList    = [];
let collapseOperations  = true;


let paramsCreateProcess = {
    headerLabel         : 'Create New Process',
    hideSections        : true,
    cancelButton        : false,
    firstSectionOnly    : true,
    fieldsEx            : ['LIST_OF_OPERATIONS'],
    contextItemFields   : [],
};
let paramsExistingProcesses = {
    headerLabel : 'Open Existing Manufacturing Process',
    contentSize : 'm',
    layout      : 'table',
    textNoData  : 'There are no processes yet'
};
let filterExistingProcesses = [{
    field       : '',
    type        : 0,
    comparator  : 2
}];
let paramsSources = {
    headerLabel : 'Select Vendor',
    fieldsEx    : ['Manufacturer Part Number', 'Manufacturer'],
    textNoData  : 'No sources defined for this item in PLM'
};
let paramsDetails = {
    editable        : false,
    toggles         : false,
    useCache        : true,
    contentSize     : 's',
    headerLabel     : 'descriptor',
    headerTopLabel  : 'Item Details',
    // layout          : 'narrow',
    // expandSections  : ['Basic'],
    fieldsEx        : ['ACTIONS'],
    sectionsEx      : ['Classification','Others'],
    collapseContents : true
}
let colors = {
    hex    : ['#CE6565', '#E0AF4B', '#E1E154', '#90D847', '#3BD23B', '#3BC580', '#3BBABA', '#689ED4', '#5178C8', '#9C6BCE', '#D467D4', '#CE5C95'],
    vector : [
        [206/255, 101/255, 101/255, 0.8],
        [224/255, 175/255,  75/255, 0.8], 
        [225/255, 225/255,  84/255, 0.8], 
        [144/255, 216/255,  71/255, 0.8], 
        [ 59/255, 210/255,  59/255, 0.8], 
        [ 59/255, 197/255, 128/255, 0.8], 
        [ 59/255, 186/255, 186/255, 0.8], 
        [104/255, 158/255, 212/255, 0.8], 
        [ 81/255, 120/255, 200/255, 0.8], 
        [156/255, 107/255, 206/255, 0.8], 
        [212/255, 103/255, 212/255, 0.8], 
        [206/255,  92/255, 149/255, 0.8]
    ]
}


$(document).ready(function() {

    setUIEvents();
    appendOverlay();

    let initialRequests = [ 
        $.get('/plm/details' , { link : urlParameters.link }),
        $.get('/plm/picklist', { link : '/api/v3/lookups/' + config.pbom.picklists.processTypes   }),
        $.get('/plm/picklist', { link : '/api/v3/lookups/' + config.pbom.picklists.operationTypes }),
        $.get('/plm/picklist', { link : '/api/v3/lookups/' + config.pbom.picklists.equipmentTypes }),
        $.get('/plm/sections', { wsId : config.pbom.workspaces.processes.workspaceId }),
        $.get('/plm/sections', { wsId : config.pbom.workspaces.operations.workspaceId }),
        $.get('/plm/bom-views-and-fields', { wsId : config.pbom.workspaces.processes.workspaceId   }),
        $.get('/plm/bom-views-and-fields', { wsId : config.pbom.workspaces.operations.workspaceId  }),
        $.get('/plm/bom-views-and-fields', { wsId : (config.pbom.workspaces.items.workspaceId || 57) })
    ];

    getFeatureSettings('pbom', initialRequests, function(responses) {

        wsConfig.items      = config.pbom.workspaces.items;
        wsConfig.processes  = config.pbom.workspaces.processes;
        wsConfig.operations = config.pbom.workspaces.operations;

        urlParameters.title      = responses[0].data.title;
        picklists.processTypes   = responses[1].data.items;
        picklists.operationTypes = responses[2].data.items;
        picklists.machines       = responses[3].data.items;

        wsConfig.processes.sections  = responses[4].data;
        wsConfig.operations.sections = responses[5].data;

        getBOMViewDefinition(responses[6].data, config.pbom.workspaces.processes.bomViewName , wsConfig.processes );
        getBOMViewDefinition(responses[7].data, config.pbom.workspaces.operations.bomViewName, wsConfig.operations);
        getBOMViewDefinition(responses[8].data, config.pbom.workspaces.items.bomViewName     , wsConfig.items     );
        
        filterExistingProcesses[0].field    = wsConfig.processes.fields.bom;
        paramsExistingProcesses.fieldsIn    = config.pbom.workspaces.processes.searchResultColumnsIn || ['DESCRIPTOR'];
        paramsExistingProcesses.fieldsEx    = config.pbom.workspaces.processes.searchResultColumnsEx || ['DESCRIPTOR'];
        paramsCreateProcess.fieldsEx        = config.pbom.workspaces.processes.creationFieldsEx || [];

        paramsCreateProcess.contextItemFields.push(wsConfig.processes.fields.bom);

        if(urlParameters.wsId == wsConfig.processes.workspaceId) {  
            
            // Launched from Manufacturing Process

            links.bop = urlParameters.link;
            links.bom = getSectionFieldValue(responses[0].data.sections, wsConfig.processes.fields.bom       , '', 'link');
            links.boo = getSectionFieldValue(responses[0].data.sections, wsConfig.processes.fields.operations, '', 'link');

            insertViewerForBOM();

            links.process   = links.bop;
            links.operation = links.boo;
            links.item      = links.bom;

            setApplicationTitles();
            showProcessEditor();

        } else { 
            
            // Not launched from Manufacturing Process

            links.bom = urlParameters.link;
            showStartupDialog();
            showPBOMSelection();

        }
        
        insertDetails(links.bom, paramsDetails);

        insertBOM(links.bom, {
            id                 : 'bom',
            headerTopLabel     : 'Bill of Materials',
            headerLabel        : 'descriptor',
            bomViewName        : config.pbom.workspaces.items.bomViewName,
            contentSize        : 's',
            collapseContents   : true,
            path               : true,
            openInPLM          : true,
            search             : true,
            toggles            : true,
            viewerSelection    : true,
            includeBOMPartList : true,
            fieldsIn           : ['Quantity', 'M/B'],
            afterCompletion    : function(id, data) { afterSourceBOMCompletion(id, data); },
            onClickItem        : function(elemClicked) { selectSourceBOMNode(elemClicked); },
        });

    });

});
function insertViewerForBOM() {

    if(isBlank(links.bom)) return;

    $.get('/plm/details' , { link : links.bom }, function(response) {

        let linkEBOM = getSectionFieldValue(response.data.sections, 'EBOM'       , '', 'link');

        if(isBlank(linkEBOM)) insertViewer(links.bom); else insertViewer(linkEBOM);

    })

}


// Set UI controls
function setUIEvents() {


    // Main Toolbar Toggles
    $('#toggle-bom').click(function() {
        $(this).toggleClass('toggle-on');
        $('body').toggleClass('no-bom');
        viewerResize(300);
    });
    $('#toggle-details').click(function() {
        $(this).toggleClass('toggle-on');
        $('body').toggleClass('no-details');
        viewerResize(300);
    });


    // Display dialog for selection of matching manufacturing process
    $('#select-root-process').click(function() {
        showPBOMSelection();
    });
    $('#root-selection-close').click(function() {
        $('#overlay').hide();
        $('#root-selection').hide();
    });


    // Process Editor Actions
    $('#process-open').click(function() {
        openItemByLink(links.process);
    });
    $('#process-replace').click(function() {
        showProcessSelection($('.process-selection').first(), 'switch');
    });
    $('#process-save-instructions').click(function() {
        saveProcessInstructions();
    });
    $('.icon-screenshot').click(function() {

        let elemParent = $(this).closest('.process-image');
        let id         = elemParent.attr('data-id');

        elemParent.removeClass('no-canvas').removeClass('no-image');

        viewerCaptureScreenshot(id, function() {});

    });
    $('#process-images').find('.icon-delete').click(function() {
        
        let elemParent = $(this).closest('.process-image');
            elemParent.addClass('no-image').addClass('no-canvas');

        elemParent.find('canvas').html('');

    });
    $('#process-add-operation').click(function() {
        insertOperation({});
        updatePosNumbers();
    });
    $('#process-save-operations').click(function() {
        saveOperations();
    });
    $('#process-operations-fold').click(function() {
        $('#process-operations').find('.operation-details').addClass('hidden');
        $('.operation-toggle').addClass('icon-expand').removeClass('icon-collapse');
    });
    $('#process-operations-unfold').click(function() {
        $('#process-operations').find('.operation-details').removeClass('hidden');
        $('.operation-toggle').removeClass('icon-expand').addClass('icon-collapse');
    });
    $('#process-operations-max').click(function() {
        toggleOperationsDisplay();
    });   
    $('#process-operations-open').click(function() {
        openItemByLink(links.operation);
    });


    $('#process-upload').click(function() {
        clickAttachmentsUpload('process-files-list', $(this));
    });


    // Display dialog for selection of matching manufacturing process of parts
    $('#source-selection-close').click(function() {
        $('#overlay').hide();
        $('#source-selection').hide();
    });
    $('#source-selection-cancel').click(function() {
        closeSourceSelection();
    })
    $('#source-selection-confirm').click(function() {
        selectSource();
    })





    // Operations List Navigation
    $('#process-operations-first').click(function() { displayOperation($('#process-operations-list').children().first()); })
    $('#process-operations-prev' ).click(function() { displayOperation($('.operation.max').prev()); })
    $('#process-operations-next' ).click(function() { displayOperation($('.operation.max').next()); })
    $('#process-operations-last' ).click(function() { displayOperation($('#process-operations-list').children().last()); })


    $('#root-create').click(function() {
        $(this).addClass('selected');
    })

}
function toggleOperationsDisplay() {

    $('#process-description').toggleClass('hidden');
    $('#process-operations-max').toggleClass('icon-maximize').toggleClass('icon-minimize');
    $('#process-operations').toggleClass('max');

}



// Startup
function setApplicationTitles() {
    
    $.get('/plm/descriptor', { link : links.bop }, function(response) {
        $('#header-subtitle').html(response.data);
        $('#process-title'  ).html(response.data);
    });

}
function afterSourceBOMCompletion(id, data) {

    bomPartsList = data.bomPartsList;

    // $('<div></div>').prependTo($('#bom-controls'))
    //     .addClass('button')
    //     .addClass('icon')
    //     .addClass('icon-viewer')
    //     .attr('title', 'Apply process matching colors to viewer')
    //     .attr('id', 'apply-colors')
    //     .click(function() {
    //         $(this).toggleClass('main');
    //         applyViewerColors();
    //     });

    let elemTHeadRow = $('#' + id + '-thead-row');

    $('<th></th>').appendTo(elemTHeadRow).addClass('column-process').html('Process');
    $('<th></th>').appendTo(elemTHeadRow).addClass('column-icon').html('');

    $('#' + id + '-tbody').children().each(function() {

        let elemRow = $(this);
        let isLeaf  = elemRow.hasClass('leaf');
        let mob     = $(this).find('.bom-column-make_or_buy').html();

        $('<td></td>').appendTo(elemRow).addClass('column-process');

        if(mob === 'Stock') {
            elemRow.addClass('status-transparent');
        } else if(isLeaf) {
            elemRow.addClass('status-red');
        } else {
            elemRow.addClass('status-red');
        }

        $('<td></td>').appendTo(elemRow).addClass('column-icon');
        
    });

    insertBOMMatches(links.bop);

}



// Viewer selection to highlight BOM entry
function onViewerSelectionChanged(event) {

    if(viewerHideSelected(event)) return;

    viewerGetSelectedPartNumber(event, function(partNumber) {
        let bomItems = bomDisplayItemByPartNumber(partNumber, true);
        if(bomItems.links.length > 0) {
            selectBOMNode(bomItems.elements[0]);
        }
        applyViewerColors();
    });

}
function applyViewerColors() {

    let elemButton = $('#apply-colors');

    if(elemButton.hasClass('main')) {

        let pnGreen = [];
        let pnRed   = [];

        $('.leaf').each(function() {
            let elemNode = $(this);
            if(elemNode.hasClass('status-green')) pnGreen.push(elemNode.attr('data-part-number'));
            else if(elemNode.hasClass('status-red')) pnRed.push(elemNode.attr('data-part-number'));
        });

        viewerSetColors(pnGreen, { color : config.vectors.green});
        viewerSetColors(pnRed, { color : config.vectors.red, resetColors : false});

    } else {
        viewerResetColors();
    }

}


// If no Manufacturing Process is defined by the URL, display the given selection dialog
function showPBOMSelection() {

    $('#overlay').show();
    $('#root-selection').show().removeClass('hidden');

    paramsCreateProcess.id            = 'root-create';
    paramsCreateProcess.contextItem   = links.bom;
    paramsCreateProcess.afterCreation = function(id, link) { selectPBOMRootItem(link); }

    filterExistingProcesses[0].value       = urlParameters.title;
    paramsExistingProcesses.id             = 'root-processes';
    paramsExistingProcesses.onDblClickItem = function(elemClicked) { selectPBOMRootItem(elemClicked.attr('data-link')); }

    insertCreate([], [wsConfig.processes.workspaceId], paramsCreateProcess);
    insertResults(wsConfig.processes.workspaceId, filterExistingProcesses, paramsExistingProcesses);

}
function selectPBOMRootItem(link) {
    
    $('#startup').remove();
    $('#overlay').hide();
    $('#root-selection').hide();
    $('#header').removeClass('hidden');
    $('#main').removeClass('hidden');
    $('#overlay').removeClass('hidden');

    links.bop     = link;
    links.process = link;

    setApplicationTitles();
    insertViewerForBOM();
    insertBOMMatches(links.bop);

    $.get('/plm/details', { link : links.bop}, function(response) {
        links.operation = getSectionFieldValue(response.data.sections, wsConfig.processes.fields.operations, '', 'link');
        showProcessEditor();
    });

}
function insertBOMMatches(link) {

    if(isBlank(link)) return;

    $('#overlay').show();

    console.log(wsConfig);

    $.get('/plm/bom', { link : link, viewId : wsConfig.processes.bomViewId}, function(response) {

        let partsList = getBOMPartsList({ viewFields : wsConfig.processes.bomViewFields }, response.data);
        let children  = [];

        $('#overlay').hide();
        $('.level-1').each(function() { children.push($(this)); });

        // console.log(partsList);
        // console.log(children);

        syncBOMNodes(children, partsList);

    });

}
function syncBOMNodes(nodes, partsList) {

    for(let node of nodes) {

        let linkNode = node.attr('data-link');

        for(let part of partsList) {

            let linkItem      = part.details[wsConfig.processes.fields.bom].link;
            let linkOperation = part.details[wsConfig.processes.fields.operations];
            let type          = part.details[wsConfig.processes.fields.type];

            if(linkNode === linkItem) {

                if(isBlank(linkOperation)) linkOperation = ''; else linkOperation = linkOperation.link;
                
                node.attr('data-bop-link'     , part.link);
                node.attr('data-bop-edge-link', part.linkParent + '/bom-items/' + part.edgeId);
                node.attr('data-boo-link'     , linkOperation);

                node.removeClass('status-red').addClass('status-green')
                
                let elemCell = node.find('.column-process');
                    elemCell.html(part.details[wsConfig.processes.fields.code]);

                if(!isBlank(type)) {
                    if(typeof type === 'object') {

                        let elemCellIcon = node.find('.column-icon');
                        let elemIcon     = getProcessTypeIcon(type.title);

                        elemCellIcon.html('').append(elemIcon);

                    }
                }

            }

        }

        let children = getBOMItemChildren(node, true);
        syncBOMNodes(children, partsList)

    }

}
function getProcessTypeIcon(value) {

    let elemIcon = $('<div></div>').addClass('icon');

    switch(value) {

        case wsConfig.processes.types.assemble.label:
            elemIcon.addClass(wsConfig.processes.types.assemble.icon);
            elemIcon.attr('title', wsConfig.processes.types.assemble.label);
            break;

        case wsConfig.processes.types.manufacture.label:
            elemIcon.addClass(wsConfig.processes.types.manufacture.icon);
            elemIcon.attr('title', wsConfig.processes.types.manufacture.label);
            break;

        case wsConfig.processes.types.purchase.label:
            elemIcon.addClass(wsConfig.processes.types.purchase.icon);
            elemIcon.attr('title', wsConfig.processes.types.purchase.label);
            break;

    }

    return elemIcon;

}



// Selection of item in EBOM
function selectSourceBOMNode(elemClicked) {

    let isSelected  = elemClicked.hasClass('selected');
    links.item      = elemClicked.attr('data-link');

    if(isSelected) {

        links.process   = elemClicked.attr('data-bop-link');
        links.operation = elemClicked.attr('data-boo-link');
        
        $('#panel').children().addClass('hidden');

        insertDetails(links.item, paramsDetails);

        if(isBlank(links.process)) {
            showProcessSelection(elemClicked, 'new');
            insertMaterialsOfSelectedBOMItem();
        } else showProcessEditor();

    } else {
        
        links.process   = links.bop;
        links.operation = links.boo;

        showProcessEditor();
        insertDetails(links.bom, paramsDetails);

    }

}
function showProcessSelection(elemClicked, mode) {

    let title = elemClicked.attr('data-title');
    let link  = elemClicked.attr('data-link');

    if(isBlank(mode)) mode = 'new';

    if(mode == 'new') {
        $('#process-selection-message').html('There is no Manufacturing Process defined for');
        $('#process-selection-close').hide();
    } else {
        $('#process-selection-message').html('Define another Manufacturing Process for');
        $('#process-selection-close').show();
    }

    $('.process-selection').removeClass('process-selection');
    $('#process').addClass('hidden');

    elemClicked.addClass('process-selection');

    $('#process-selection-item').html(title);

    paramsCreateProcess.id            = 'process-selection-create';
    paramsCreateProcess.contextItem   = link;
    paramsCreateProcess.afterCreation = function(id, link) { selectItemsProcess(link); }

    filterExistingProcesses[0].value       = elemClicked.attr('data-part-number');
    paramsExistingProcesses.id             = 'process-selection-processes';
    paramsExistingProcesses.onDblClickItem = function(elemClicked) { selectItemsProcess(elemClicked.attr('data-link')); }

    paramsSources.id = 'process-selection-sources';

    insertCreate([], [wsConfig.processes.workspaceId], paramsCreateProcess);
    insertResults(wsConfig.processes.workspaceId, filterExistingProcesses, paramsExistingProcesses);
    insertSourcing(links.item, paramsSources);

    $('#process-selection').removeClass('hidden');

}
function selectItemsProcess(link) {

    links.process = link;

    let elemSelected = $('tr.content-item.selected');
        elemSelected.attr('data-bop-link', links.process).removeClass('status-red').addClass('status-green');

    let requests = [
        $.get('/plm/details', { link : links.process } )
    ];

    if(!isBlank(elemSelected.attr('data-bop-edge-link'))) {
        requests.push($.get('/plm/bom-remove', { edgeLink : elemSelected.attr('data-bop-edge-link') }));
    }  

    let paramsBOMLink = {
        linkChild : links.process,
        quantity  : elemSelected.attr('data-quantity'),
        number    : elemSelected.attr('data-number')
    }

    if(elemSelected.hasClass('level-1')) {

        if(!isBlank(links.bop)) {
            paramsBOMLink.linkParent = links.bop;
            requests.push($.post('/plm/bom-add', paramsBOMLink));
        }

    } else {

        let elemBOMParent = getBOMItemParent(elemSelected);

        if(elemBOMParent.length > 0) {
            if(!isBlank(elemBOMParent.attr('data-bop-link'))) {
                paramsBOMLink.linkParent = elemBOMParent.attr('data-bop-link');
                requests.push($.post('/plm/bom-add', paramsBOMLink));
            }
        }

    }


    Promise.all(requests).then(function(responses) {

        console.log(responses);
        
        links.operation = getSectionFieldValue(responses[0].data.sections, wsConfig.processes.fields.operations, '', 'link');

        let code     = getSectionFieldValue(responses[0].data.sections, wsConfig.processes.fields.code, '');
        let type     = getSectionFieldValue(responses[0].data.sections, wsConfig.processes.fields.type, '', 'title');
        let elemIcon = getProcessTypeIcon(type);

        elemSelected.find('.column-process').html(code);
        elemSelected.find('.column-icon').first().append(elemIcon);


    });

    applyViewerColors();

    $('#process-selection').addClass('hidden');

    showProcessEditor();

    // $.get('/plm/details', { link : link}, function(response) {
    //     console.log(response);
    //     elemSelected.find('.column-process').html(response.data.title);
    // });

    // $('#overlay').hide();
    // $('#root-selection').hide();

}
function showProcessEditor() {

    if(isBlank(links.process  )) links.process   = '';
    if(isBlank(links.operation)) links.operation = '';

    // links.process   = linkProcess;
    // links.operation = linkOperation;

    $('#process-selection').addClass('hidden');
    $('#process').removeClass('hidden');
    $('#process-title').html('');
    $('#process-subtitle').html('');

    // links.process = linkProcess;
    
    $('#process-operations-title-main').html('');
    $('#process-operations-list').html('');
    $('#process-parts-list').html('');
    $('#process-sub-title').html('');
    $('#process-tabs').children('.selected').click();
    $('#process-instructions-text').val('');
    $('.process-image').addClass('no-image').addClass('no-canvas');

    let elemSelected = $('tr.content-item.selected');
    let partNumber   = elemSelected.attr('data-part-number');
    let edgeId       = elemSelected.attr('data-edgeid');
    links.item       = elemSelected.attr('data-link') || links.bom;
    // let linkOBOM     = elemSelected.attr('data-obom-link')  || '';


    // insertMaterials();
    insertOperations();
    // if(linkOBOM !== '') {
        // links.obom = linkOBOM;
        
    // }

         console.log(links);

    if(links.operation !== '') {
        $.get('/plm/descriptor', { link : links.operation }, function(response) {
            $('#process-operations-title-main').html(response.data);
        });
    }

    $.get('/plm/details', { link : links.process }, function(response) {

        console.log(response);

        let instructions = getSectionFieldValue(response.data.sections, 'INSTRUCTIONS', '');
        let titleOperation = getSectionFieldValue(response.data.sections, wsConfig.processes.fields.operations, '', 'title');

        console.log(titleOperation);

            $('#process-operations-title-main').html(titleOperation);
        
        $('#process-title').html(response.data.title);
        $('#process-subtitle').html(getSectionFieldValue(response.data.sections, 'SITE', '', 'title'));
        $('#process-instructions-text').val(instructions);

        for(let index = 1; index <= 5; index++) setProcessImage(response, index);

        console.log(links);

        if(links.operation === '') {

            links.operation = getSectionFieldValue(response.data.sections, wsConfig.processes.fields.operations, '', 'link');

            

            

            if(links.operation !== '') insertOperations();


        }

        elemSelected.attr('data-obom-link', links.operation);

        // if(linkOBOM === '') insertOperations();

    });

    insertAttachments(links.process, {
        id          : 'process-files-list',
        textNoData  : 'No files available. Use the button Add File to upload the first file.',
        editable    : true,
        hideHeader  : true,
        contentSize : 'xs'
    });

    // insertDetails(links.process, {
    //     id : 'process-details',
    //     hideHeader : true,
    //     editable : true
    // })

    // $.get('/plm/bom', { link : links.item, viewId : wsConfig.items.bomViewId, depth : 1 }, function(response) {

    //     let partsList = getBOMPartsList({ viewFields : wsConfig.items.bomViewFields }, response.data);
    //     insertBOMPartsList();

    // });

    // let children = getBOMPartsListChildren(bomPartsList, partNumber, edgeId, 1, false);

    // processPartsList = [];
    
    // console.log(children);

    // for(let child of children) {

    //     insertMaterial({
    //         link        : child.link,
    //         edgeId      : child.edgeId,
    //         partNumber  : child.partNumber,
    //         title       : child.title,
    //         quantity    : child.quantity
    //     });

    //     processPartsList.push(child);

    // }

}
function setProcessImage(response, index) {

    let elemParent = $('#process-image-' + index);
        elemParent.find('img').remove();
    
    let image = getSectionFieldValue(response.data.sections, 'IMAGE_' + index, '');

    if(isBlank(image)) {
        elemParent.addClass('no-image');
    } else {

        elemParent.removeClass('no-image');
        $.get('/plm/image-cache', { imageLink : image }, function(response) {
            $('<img>').attr('src', response.data.url).on('load', function() {
                elemParent.append($(this));
            });
        });
        
    }

}



// Insert Parts List of selected Process
function insertMaterialsOfSelectedBOMItem() {

    $('#materials').html('');

    $.get('/plm/bom', { link : links.item     , viewId : wsConfig.items.bomViewId     , depth : 1 }, function(response) {
        let boMaterials   = getBOMPartsList({ viewFields : wsConfig.items.bomViewFields}     , response.data);
        for(let nodeMaterial of boMaterials) insertMaterial(nodeMaterial);
        updateProcessEditorMaterialsList();
    });

}
function insertMaterial(data) {

    if(isBlank(data)) return;

    if(isBlank(data.edgeId    )) data.edgeId     = '';
    if(isBlank(data.partNumber)) data.partNumber = '';
    if(isBlank(data.title     )) data.title      = '';
    if(isBlank(data.quantity  )) data.quantity   = '';

    let elemParent = $('#materials');

    let elemMaterial = $('<div></div>').appendTo(elemParent)
        .addClass('material')
        .addClass('tile')
        .attr('draggable', 'true')
        .attr('ondragstart', 'dragStartHandler(event)')
        .attr('ondragleave', 'dragLeaveHandler(event)')
        .attr('data-quantity', data.quantity)
        .attr('data-edgeId', data.edgeId)
        .attr('data-title', data.title)
        .attr('data-part-number', data.partNumber)
        .attr('data-link', data.link)
        .click(function() {
            clickMaterial($(this));
        })
        .dblclick(function() {
            openItemByLink($(this).attr('data-link'));
        })

    let elemImage = $('<div></div>').appendTo(elemMaterial).addClass('material-image');

    $('<div></div>').appendTo(elemImage)
        .addClass('material-icon')
        .addClass('icon')
        .addClass('icon-item');

    let elemDetails = $('<div></div>').appendTo(elemMaterial).addClass('material-details');

    let elemHeader = $('<div></div>').appendTo(elemDetails).addClass('material-header');

    // $('<div></div>').appendTo(elemHeader).addClass('material-quantity').html(data.quantity);
    $('<div></div>').appendTo(elemHeader).addClass('material-number').html(data.partNumber);
    $('<div></div>').appendTo(elemHeader).addClass('material-title').html(data.details.TITLE);

    let elemSource = $('<div></div>').appendTo(elemDetails).addClass('material-source').attr('title', 'Consumption')

    if(!isBlank(data.source)) {

        let elemIcon = getProcessTypeIcon(data.source.details.TYPE.title);
            elemIcon.addClass('material-source-icon').appendTo(elemSource);

        $('<div></div>').appendTo(elemSource).addClass('material-source-title').html(data.source.title);

    } else {
        elemSource.html('- no source defined -');
    }

    let elemConsumption = $('<div></div>').appendTo(elemMaterial).addClass('material-consumption');


    $('<div></div>').appendTo(elemConsumption).addClass('material-consumption-actual').html('0.0');
    $('<div></div>').appendTo(elemConsumption).addClass('material-consumption-split' ).html('of');
    $('<div></div>').appendTo(elemConsumption).addClass('material-consumption-target').html(data.quantity);


    // $('<div></div>').appendTo(elemConsumption)
    //     .addClass('part-value')
    //     .addClass('part-consumption-value')
    //     .html();

    if(!isBlank(data.details.IMAGE)) {

        $.get('/plm/image-cache', {
            link        : data.link,
            imageLink   : data.details.IMAGE.link,
            fieldId     : 'IMAGE'
        }, function(response) {

            if(response.error) return;

            let src = response.data.url;

            $('<img>').attr('src', src).on('load', function() {
                elemImage.html('');
                elemImage.append($(this));
            });

        });
    }

    return elemMaterial;

}
function clickMaterial(elemClicked) {

    let wasSelected = elemClicked.hasClass('selected');

    $('.material').removeClass('selected');

    if(wasSelected) {

        insertDetails(links.item, paramsDetails);

        let elemSelectedBOMItem = $('.bom-item.selected');

        if(elemSelectedBOMItem.length === 0) viewerResetSelection();
        else viewerSelectModel(elemSelectedBOMItem.attr('data-part-number'));

    } else {

        elemClicked.addClass('selected');
        viewerSelectModel(elemClicked.attr('data-part-number'));
        insertDetails(elemClicked.attr('data-link'), paramsDetails);

    }

}



// Handling of Operations
function insertOperations() {

    $('#materials').html('');

    if(isBlank(links.operation)) return;

    let requests = [
        $.get('/plm/bom', { link : links.item     , viewId : wsConfig.items.bomViewId     , depth : 1 }),
        $.get('/plm/bom', { link : links.process  , viewId : wsConfig.processes.bomViewId , depth : 1 }),
        $.get('/plm/bom', { link : links.operation, viewId : wsConfig.operations.bomViewId, depth : 2 })
    ];

    Promise.all(requests).then(function(responses) {

        let boMaterials   = getBOMPartsList({ viewFields : wsConfig.items.bomViewFields}     , responses[0].data);
        let boProcesses   = getBOMPartsList({ viewFields : wsConfig.processes.bomViewFields} , responses[1].data);
        let boOperations  = getBOMPartsList({ viewFields : wsConfig.operations.bomViewFields}, responses[2].data);
        let elemOperation = null;

        for(let nodeOperations of boOperations) {
            if(nodeOperations.level === 1) {
                elemOperation = insertOperation({
                    link                  : nodeOperations.link,
                    id                    : nodeOperations.dmsId,
                    edgeId                : nodeOperations.edgeId,
                    number                : nodeOperations.number,
                    quantity              : nodeOperations.quantity,
                    linkParent            : nodeOperations.linkParent,
                    code                  : nodeOperations.details[wsConfig.operations.fields.code],
                    name                  : nodeOperations.details[wsConfig.operations.fields.name],
                    type                  : nodeOperations.details[wsConfig.operations.fields.type],
                    image                 : nodeOperations.details[wsConfig.operations.fields.image],
                    instructions          : nodeOperations.details[wsConfig.operations.fields.instructions],
                    leadTime              : nodeOperations.details[wsConfig.operations.fields.leadTime],
                    ctHours               : nodeOperations.details[wsConfig.operations.fields.ctHours],
                    ctMinutes             : nodeOperations.details[wsConfig.operations.fields.ctMinutes],
                    ctSeconds             : nodeOperations.details[wsConfig.operations.fields.ctSeconds],
                    ctHoctMillisecondsurs : nodeOperations.details[wsConfig.operations.fields.ctMilliseconds],
                    noOfTimes             : nodeOperations.quantity,
                    fusionTeam            : nodeOperations.details[wsConfig.operations.fields.fusionTeam],
                    description           : nodeOperations.details.DESCRIPTION
                });
            } else if(nodeOperations.level === 2) {
                // console.log(nodeOperations);
                let wsId = nodeOperations.link.split('/')[4];
                // console.log(wsId);
                // console.log(wsConfig.items.workspaceId);
                if(wsId == wsConfig.items.workspaceId) {

                    console.log(nodeOperations);

                    insertOperationPart(elemOperation, {
                        link       : nodeOperations.link,
                        partNumber : nodeOperations.title.split(' - ')[0],
                        quantity   : nodeOperations.quantity,
                        title      : nodeOperations.title,
                        edgeId     : nodeOperations.edgeId
                    });

                }
            }
        }

        $('#process-operations-list').find('select').on('change', function() {
            $(this).closest('.operation').addClass('changed');
        });
        $('#process-operations-list').find('input').on('change', function() {
            $(this).closest('.operation').addClass('changed');
        });
        $('#process-operations-list').find('textarea').on('change', function() {
            $(this).closest('.operation').addClass('changed');
        });

        for(let nodeMaterial of boMaterials) {
            for(let nodeProcess of boProcesses) {

                let linkProcessItem = nodeProcess.details[wsConfig.processes.fields.bom];

                if(!isBlank(linkProcessItem)) linkProcessItem = linkProcessItem.link;

                if(nodeMaterial.link === linkProcessItem) {
                    nodeMaterial.source = nodeProcess;
                    break;
                }

            }
        }
        for(let nodeMaterial of boMaterials) {

            insertMaterial(nodeMaterial);

        }

        updateProcessEditorMaterialsList();

        // insertBOMPartsList();

    });

}
function insertOperation(data) {

    if(isBlank(data)) return;

    if(isBlank(data.link          )) data.link           = '';
    if(isBlank(data.id            )) data.id             = '';
    if(isBlank(data.edgeId        )) data.edgeId         = '';
    if(isBlank(data.number        )) data.number         = '';
    if(isBlank(data.quantity      )) data.quantity       = '';
    if(isBlank(data.linkParent    )) data.linkParent     = '';
    if(isBlank(data.code          )) data.code           = '- NEW -';
    if(isBlank(data.name          )) data.name           = '';
    if(isBlank(data.type          )) data.type           = ''; else data.type = data.type.link;
    if(isBlank(data.image         )) data.image          = '';
    if(isBlank(data.instructions  )) data.instructions   = '';
    if(isBlank(data.ctHours       )) data.ctHours        = '';
    if(isBlank(data.ctMinutes     )) data.ctMinutes      = '';
    if(isBlank(data.ctSeconds     )) data.ctSeconds      = '';
    if(isBlank(data.ctMilliseconds)) data.ctMilliseconds = '';
    if(isBlank(data.leadTime      )) data.leadTime       = '';
    if(isBlank(data.noOfTimes     )) data.noOfTimes      = '';
    if(isBlank(data.fusionTeam    )) data.fusionTeam     = '';
 
    let elemParent = $('#process-operations-list');
    let index      = $('.operation').length + 1;

    let elemOperation = $('<div></div>').appendTo(elemParent)
        .addClass('operation')
        .attr('draggable'    , 'true')
        .attr('ondragstart'  , 'dragStartHandler(event)')
        .attr('ondragenter'  , 'dragEnterOperation(event)')
        .attr('ondragover'   , 'dragEnterOperation(event)')
        .attr('ondragleave'  , 'dragLeaveHandler(event)')
        .attr('ondrop'       , 'dropOperation(event)')
        .attr('data-link'    , data.link)
        .attr('data-edgeId'  , data.edgeId)
        .attr('data-number'  , data.number)
        .attr('data-quantity', data.quantity)
        .attr('data-parent'  , data.linkParent);

    if(data.link === '') elemOperation.addClass('new').addClass('changed');

    let elemHeader = $('<div></div>').appendTo(elemOperation)
        .addClass('operation-header')

    $('<div></div>').appendTo(elemHeader)
        .addClass('operation-toggle')
        .addClass('button')
        .addClass('icon')
        .addClass('icon-expand')
        .click(function() {
            $(this).toggleClass('icon-expand').toggleClass('icon-collapse');
            if($(this).hasClass('icon-expand')) $(this).parent().siblings().addClass('hidden');
                                           else $(this).parent().siblings().removeClass('hidden');
        });

    $('<div></div>').appendTo(elemHeader)
        .addClass('operation-number')
        .html($('.operation').length);  

    $('<div></div>').appendTo(elemHeader)
        .addClass('operation-code')
        // .attr('placeholder', 'Code')
        .html(data.code);

    let elemSelectType = $('<select></select>').appendTo(elemHeader)
        .addClass('operation-type');
        // .addClass('button');

    $('<option></option>').attr('value', '--').appendTo(elemSelectType).html('- No Type Selected -');

    insertPicklistOptions(elemSelectType, 'operationTypes', data.type);

    // $('<option></option>').attr('value', 'Quality').appendTo(elemSelectType).html('Quality Control');
    // $('<option></option>').attr('value', 'Quality').appendTo(elemSelectType).html('Preparation');

    $('<input></input>').appendTo(elemHeader)
        .addClass('operation-name')
        .attr('placeholder', 'Name')
        .val(data.name);

    let elemActions = $('<div></div>').appendTo(elemHeader)
        .addClass('operation-actions');  
        
    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .attr('title', 'Delete this operation (with next Save action)')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).closest('.operation').addClass('hidden');
            updatePosNumbers();
        }) ;

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-maximize')
        .addClass('operation-max-toggle')
        .attr('title', 'Maximize the operation definition')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleOperationsListDisplay($(this));
            // openItemByLink($(this).closest('.operation').attr('data-link'));
        });

    // $('<div></div>').appendTo(elemActions)
    //     .addClass('button')
    //     .addClass('icon')
    //     .addClass('icon-clone')
    //     .attr('title', 'Clone this operation')
    //     .click(function(e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         openItemByLink($(this).closest('.operation').attr('data-link'));
    //     });

    // $('<div></div>').appendTo(elemActions)
    //     .addClass('button')
    //     .addClass('icon')
    //     .addClass('icon-upload')
    //     .attr('title', 'Upload new file')
    //     .click(function(e) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         openItemByLink($(this).closest('.operation').attr('data-link'));
    //     });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')
        .attr('title', 'Navigate to this operation in PLM')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openItemByLink($(this).closest('.operation').attr('data-link'));
        });





    let elemDetails = $('<div></div>').appendTo(elemOperation)
        .addClass('operation-details')
        .addClass('hidden');

    let elemLeft = $('<div></div>').appendTo(elemDetails)
        .addClass('operation-left');
    
    let elemCenter = $('<div></div>').appendTo(elemDetails)
        .addClass('operation-center');
    
    let elemRight = $('<div></div>').appendTo(elemDetails)
        .addClass('operation-right');
        
    
    let elemMaterials = $('<div></div>').appendTo(elemLeft).addClass('operation-materials');

    $('<div></div>').appendTo(elemMaterials).addClass('operation-field-label').html('Materials');
    $('<div></div>').appendTo(elemMaterials).addClass('operation-field-value').addClass('operation-parts-list').addClass('display-flex-column');
        

    let elemDefinition  = $('<div></div>').appendTo(elemCenter).addClass('operation-field').addClass('operation-definition');
    let elemLeadTime    = $('<div></div>').appendTo(elemCenter).addClass('operation-field');
    let elemCycleTime   = $('<div></div>').appendTo(elemCenter).addClass('operation-field');
    let elemRepetitions = $('<div></div>').appendTo(elemCenter).addClass('operation-field');

    let elemImage        =  $('<div></div>').appendTo(elemDefinition).addClass('operation-image').addClass('no-canvas').addClass('no-image');
    let elemImageActions =  $('<div></div>').appendTo(elemImage).addClass('operation-image-actions');
    let elemInstructions =  $('<div></div>').appendTo(elemDefinition).addClass('operation-instructions')

    $('<canvas></canvas>').prependTo(elemImage).addClass('operation-image-canvas').attr('id', 'operation-image-' + index);

    $('<div></div>').appendTo(elemImageActions)
        .addClass('icon')
        .addClass('button')
        .addClass('icon-screenshot')
        .click(function() {
            captureOperationScreenshot($(this), index);
        });

    $('<div></div>').appendTo(elemImageActions)
        .addClass('icon')
        .addClass('button')
        .addClass('icon-delete')
        .addClass('red')
        .click(function() {
            removeOperationScreenshot($(this), index);
        });

    $('<textarea></textarea>').appendTo(elemInstructions).addClass('operation-instructions-value').attr('placeholder', 'Instructions').val(data.instructions);  

    $('<div></div>').appendTo(elemLeadTime).addClass('operation-field-label').html('Lead Time');
    $('<input></input>').appendTo(elemLeadTime).addClass('operation-field-value').addClass('operation-lead-time').attr('placeholder', 'Days').attr('type', 'number').val(data.leadTime);

    $('<div></div>').appendTo(elemCycleTime).addClass('operation-field-label').html('Cycle Time');
    let elemCycleTimeInputs = $('<div></div>').appendTo(elemCycleTime).addClass('operation-field-values');

    $('<input></input>').appendTo(elemCycleTimeInputs).addClass('operation-field-value').addClass('operation-cycle-time').addClass('operation-cycle-time-hh').attr('placeholder', 'hh').val(data.ctHours);
     $('<span>:</span>').appendTo(elemCycleTimeInputs).addClass('operation-cycle-time-separator');
    $('<input></input>').appendTo(elemCycleTimeInputs).addClass('operation-field-value').addClass('operation-cycle-time').addClass('operation-cycle-time-mm').attr('placeholder', 'mm').val(data.ctMinutes);
     $('<span>:</span>').appendTo(elemCycleTimeInputs).addClass('operation-cycle-time-separator');
    $('<input></input>').appendTo(elemCycleTimeInputs).addClass('operation-field-value').addClass('operation-cycle-time').addClass('operation-cycle-time-ss').attr('placeholder', 'ss').val(data.ctSeconds);
     $('<span>:</span>').appendTo(elemCycleTimeInputs).addClass('operation-cycle-time-separator');
    $('<input></input>').appendTo(elemCycleTimeInputs).addClass('operation-field-value').addClass('operation-cycle-time').addClass('operation-cycle-time-ms').attr('placeholder', 'ms').val(data.ctMilliseconds);

    $('<div></div>').appendTo(elemRepetitions).addClass('operation-field-label').html('Repetitions');
    $('<input></input>').appendTo(elemRepetitions).addClass('operation-field-value').addClass('operation-repetitions').attr('placeholder', 'No. of times').val(data.noOfTimes);


    let elemFiles       =  $('<div></div>').appendTo(elemRight).addClass('operation-field');
    let elemFusionTeam  =  $('<div></div>').appendTo(elemRight).addClass('operation-field');
    let elemMachines    =  $('<div></div>').appendTo(elemRight).addClass('operation-field');
    let elemChecklists  =  $('<div></div>').appendTo(elemRight).addClass('operation-field');
    let elemParameters  =  $('<div></div>').appendTo(elemRight).addClass('operation-field');
    let elemWasteCodes  =  $('<div></div>').appendTo(elemRight).addClass('operation-field');

    $('<div></div>').appendTo(elemFiles).addClass('operation-field-label').html('Files');
    $('<input></input>').appendTo(elemFiles).addClass('operation-field-value').addClass('operation-files').attr('placeholder', 'Upload first file');

    $('<div></div>').appendTo(elemFusionTeam).addClass('operation-field-label').html('Fusion Team');
    $('<input></input>').appendTo(elemFusionTeam).addClass('operation-field-value').addClass('operation-fusion-team').attr('placeholder', 'Paste Link').val(data.fusionTeam);

    $('<div></div>').appendTo(elemMachines).addClass('operation-field-label').html('Machines');
    $('<input></input>').appendTo(elemMachines).addClass('operation-field-value').addClass('operation-machines').attr('placeholder', '');

    $('<div></div>').appendTo(elemChecklists).addClass('operation-field-label').html('Checklists');
    $('<input></input>').appendTo(elemChecklists).addClass('operation-field-value').addClass('operation-checklists').attr('placeholder', '');

    $('<div></div>').appendTo(elemParameters).addClass('operation-field-label').html('Parameters');
    $('<input></input>').appendTo(elemParameters).addClass('operation-field-value').addClass('operation-parameters').attr('placeholder', '');

    $('<div></div>').appendTo(elemWasteCodes).addClass('operation-field-label').html('Waste Codes');
    $('<input></input>').appendTo(elemWasteCodes).addClass('operation-field-value').addClass('operation-waste-codes').attr('placeholder', '');


    return elemOperation;

}
function toggleOperationsListDisplay(elemClicked) {

    // elemClicked.toggleClass('icon-maximize').toggleClass('icon-minimize');

    let elemOperation = elemClicked.closest('.operation');
        elemOperation.toggleClass('max');
        elemOperation.siblings().toggleClass('hidden');

    if(elemOperation.hasClass('max')) $('.operation-max-toggle').removeClass('icon-maximize').addClass('icon-minimize');
    else                              $('.operation-max-toggle').removeClass('icon-minimize').addClass('icon-maximize');

    $('#process-operations-nav').toggleClass('hidden');
    $('#process-operations').toggleClass('with-nav');

    let isMax = elemOperation.hasClass('max');
    let elemDetails = elemOperation.find('.operation-details');

    if(isMax) elemDetails.removeClass('hidden'); else elemDetails.addClass('hidden');

}
function displayOperation(elemOperation) {

    if(elemOperation.length === 0) return;

    $('.operation').removeClass('max').addClass('hidden');
    $('.operation-details').addClass('hidden');
    elemOperation.addClass('max').removeClass('hidden');
    elemOperation.find('.operation-details').removeClass('hidden');

}
function captureOperationScreenshot(elemButton, index) {

    let id = 'operation-image-' + index;
    let elemCanvas = $('#' + id);
    let elemImage = elemCanvas.closest('.operation-image');

    elemImage.removeClass('no-canvas');

    console.log(id);

    // $('.icon-screenshot').click(function() {

    //     let elemParent = $(this).closest('.process-image');
    //     let id         = elemParent.attr('data-id');

    //     elemParent.removeClass('no-canvas').removeClass('no-image');

        viewerCaptureScreenshot(id, function() {});

    // });


}
function dragStartHandler(e) {
    
    $('.dragged').removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');
    
    let elemDragged = $(e.target);
        elemDragged.addClass('dragged');

    // e.dataTransfer.setData('text/plain', elemDragged.attr('data-link'));

}
function dragEnterOperation(e) {

    e.preventDefault();

    let elemTarget = $(e.target);

    // if(!elemTarget.hasClass('items-list-row')) elemTarget = elemTarget.closest('.items-list-row');

    elemTarget.closest('.operation').addClass('drag-hover');

}
function dragLeaveHandler(e) {

    $('.drag-hover').removeClass('drag-hover');

}
function dragEndHandler(e) {

    $('.drag-hover').removeClass('.drag-hover');

}
function dropOperation(e) {

    e.preventDefault();
    e.stopPropagation();

    let elemTarget      = $(e.target).closest('.operation');
    let elemDragged     = $('.dragged').first();
    // let isMaterialsList = elemDragged.hasClass('operation-parts-list');
    let isPart          = elemDragged.hasClass('material');

    // console.log('1');
    // console.log(isMaterialsList);
    console.log(isPart);

    if(isPart) {

        addDroppedPartToOperation(elemTarget, elemDragged);

    } else {

        elemDragged.insertBefore(elemTarget);
        updatePosNumbers();

    }


    console.log(elemDragged.hasClass('bom-item'));


    // if(fromBOM) {

    //     let part = {
    //         link        : elemDragged.attr('data-link'), 
    //         title       : elemDragged.attr('data-title'),  
    //         details     : {
    //             NUMBER  : elemDragged.attr('data-part-number')
    //         },
    //         edgeId      : '', 
    //         quantity    : elemDragged.attr('data-quantity')
    //     }

    //     let newItem = insertItem(elemTarget, className, level, part);

    //     if(onItem !== null) newItem.insertBefore(onItem);
    
    // } else  if(fromBrowser) {

    //     let part = {
    //         link        : elemDragged.attr('data-link'), 
    //         title       : elemDragged.attr('data-title'),  
    //         details     : {
    //             NUMBER  : elemDragged.attr('data-part-number')
    //         },
    //         edgeId      : '', 
    //         quantity    : '1.0'
    //     }

    //     let newItem = insertItem(elemTarget, className, level, part);

    //     if(onItem !== null) newItem.insertBefore(onItem);

    // } else {
        
    //     elemDragged = elemDragged.closest('.items-list-row');

    //     if(e.shiftKey) elemDragged = elemDragged.clone();

    //     if(onItem !== null) elemDragged.insertBefore(onItem);
    //     else elemDragged.appendTo(elemTarget);

    // }

    $('.dragged'   ).removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');

}
function updatePosNumbers() {

    let number = 1;

    $('.operation-number').each(function() {
        let elemOperation = $(this).closest('.operation');
        if(!elemOperation.hasClass('hidden')) $(this).html(number++);
    });

}
function addTool(elemToolSelector) {

    console.log(elemToolSelector.val());
    console.log(elemToolSelector.children(':selected').html());

    let elemList = elemToolSelector.prev();

    let elemTool = $('<div></div>').appendTo(elemList)
        .addClass('operation-tool');

    $('<div></div>').appendTo(elemTool)
        .html(elemToolSelector.children(':selected').html());

    $('<div></div>').appendTo(elemTool)
        .addClass('icon')
        .addClass('icon-close');

}
function addDroppedPartToOperation(elemOperation, elemDragged) {

    insertOperationPart(elemOperation, {
        link        : elemDragged.attr('data-link'),
        partNumber  : elemDragged.attr('data-part-number'),
        quantity    : elemDragged.attr('data-quantity'),
        title       : elemDragged.attr('data-title'),
        edgeId      : ''
    });

    // let elemList = elemOperation.find('.operation-parts-list');




    // let elemPart = $('<div></div>').appendTo(elemList)
    //     .addClass('operation-part')
    //     .attr('data-link', elemDragged.attr('data-link'))
    //     .attr('data-part-number', elemDragged.attr('data-part-number'))
    //     .attr('data-edge-id', '')
    //     .attr('data-quantity', '')
    //     .click(function() {

    //     });

    // $('<input></input>').appendTo(elemPart)
    //     .addClass('operation-part-quantity')
    //     .val(elemDragged.attr('data-quantity'))
    //     .on('change', function() { updateProcessEditorMaterialsList();  });

    // $('<div></div>').appendTo(elemPart)
    //     .addClass('operation-part-title')
    //     .html(elemDragged.attr('data-title'))

    // let elemActions = $('<div></div>').appendTo(elemPart)
    //     .addClass('operation-part-actions');

    // $('<div></div>').appendTo(elemActions)
    //     .addClass('button')
    //     .addClass('icon')
    //     .addClass('icon-delete')
    //     .click(function() {
    //         $(this).closest('.operation-part').addClass('hidden');
    //         updateProcessEditorMaterialsList();
    //     });

    updateProcessEditorMaterialsList();

}
function insertOperationPart(elemOperation, data) {

    let elemList = elemOperation.find('.operation-parts-list');

    let elemPart = $('<div></div>').appendTo(elemList)
        .addClass('operation-part')
        .attr('data-link', data.link)
        .attr('data-part-number', data.partNumber)
        .attr('data-edge-id', data.edgeId)
        .attr('data-quantity', data.quantity)
        .click(function() {  });

    $('<input></input>').appendTo(elemPart)
        .addClass('operation-part-quantity')
        .val(data.quantity)
        .on('change', function() { updateProcessEditorMaterialsList();  });

    $('<div></div>').appendTo(elemPart)
        .addClass('operation-part-title')
        .html(data.title)

    let elemActions = $('<div></div>').appendTo(elemPart)
        .addClass('operation-part-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.operation-part').addClass('hidden');
            updateProcessEditorMaterialsList();
        });

}
function updateProcessEditorMaterialsList() {

    console.log('updateProcessEditorMaterialsList START');

    let consumption = [];

    // $('.operation-part:not(.hidden)').each(function() {
    $('.operation-part').each(function() {

        if(!$(this).hasClass('hidden')) {
        
            let partNumber   = $(this).attr('data-part-number');
            let partQuantity = $(this).find('.operation-part-quantity').first().val();
            let operation    = $(this).closest('.operation');
            let opCode       = operation.find('.operation-code').val();
            let opTitle      = opCode + ' ' + operation.find('.operation-title').val();
            let isNew        = true;

            for(let part of consumption) {

                if(part.number === partNumber) {
                    part.consumption += parseFloat(partQuantity);
                    part.operations.push(opTitle);
                    isNew = false;
                    break;
                }

            }

            if(isNew) consumption.push({
                number      : partNumber,
                consumption : parseFloat(partQuantity),
                operations  : [ opTitle ]
            })

        }

    });

    $('#materials').children().each(function() {

        let elemMaterial = $(this);
        let partNumber   = elemMaterial.attr('data-part-number');
        let elemActual   = elemMaterial.find('.material-consumption-actual');
        let consumed     = '0.0';

        for(let part of consumption) {

            if(part.number === partNumber) {
                
                consumed = parseFloat(part.consumption);

                let quantity        = parseFloat($(this).attr('data-quantity'));
                let percent         = consumed * 100 / quantity;
                let background      = 'linear-gradient(to right, #faa21b 0%, #faa21b ' + percent + '%, var(--color-surface-level-4) ' + percent + '%)';
                let elemConsumption = elemMaterial.find('.material-consumption');

                     if(consumed  >  quantity) background = '#dd2222';
                else if (consumed == quantity) background = '#6a9728';
                
                elemMaterial.attr('data-consumption', part.consumption);
                elemActual.html(part.consumption);
                elemConsumption.css('background', background);

                break;

            }
        }

        if(consumed == '0.0') {
            elemActual.html('0.0');
            elemMaterial.find('.material-consumption').css('background', '');
        }

    });

}


// Save Process Instructions to PLM
function saveProcessInstructions() {

    $('#overlay').show();

    let params = { link : links.process, sections : [] }

    addFieldToPayload(params.sections, wsConfig.processes.sections, null, 'INSTRUCTIONS', $('#process-instructions-text').val());
   
    for(let index = 1; index <= 4; index++) {

        let elemImage = $('#process-image-' + index);
        let value     = null;
        let update    = true;

        console.log($('#canvas-image-' + index)[0]);

             if(!elemImage.hasClass('no-canvas')) value = $('#canvas-image-' + index)[0].toDataURL('image/jpg');
        else if(!elemImage.hasClass('no-image')) update = false;
        
        if(update) addFieldToPayload(params.sections, wsConfig.processes.sections, null, 'IMAGE_' + index, value, false);
    }
    
    console.log(params);

    $.post('/plm/edit', params, function() {
        $('#overlay').hide();
    });

}


// Save Operations to PLM
function saveOperations() {

    console.log('saveOperations START');

    $('#overlay').show();

    let requests = [];
    let elements = [];

    $('.operation').each(function() {

        let elemOperation = $(this);
        let isRemoved     = elemOperation.hasClass('hidden');
        let edgeId        = elemOperation.attr('data-edgeid');
        let dataParent    = elemOperation.attr('data-parent');
        let dataQuantity  = elemOperation.attr('data-quantity');
        let dataNumber    = elemOperation.attr('data-number');
        let newQuantity   = elemOperation.find('.operation-repetitions').val();
        let newNumber     = elemOperation.find('.operation-number').html();

        if(isRemoved ) {

            if(edgeId !== '') {
                requests.push($.get('/plm/bom-remove', {
                    edgeLink : dataParent + '/bom-items/' + edgeId
                }));
            } else {
                elemOperation.remove();
            }

        } else if(edgeId !== '') {

            if(dataQuantity !== '') dataQuantity = parseFloat(dataQuantity);
            if(newQuantity  !== '') newQuantity  = parseFloat(newQuantity);
            if(dataNumber   !== '') dataNumber   = Number(dataNumber);
            if(newNumber    !== '') newNumber    = Number(newNumber);

            if((dataQuantity !== newQuantity) || (dataNumber !== newNumber)) {

                let params = {
                    linkParent : elemOperation.attr('data-parent'),
                    linkChild : elemOperation.attr('data-link'),
                    edgeId : edgeId,
                    quantity : newQuantity,
                    number : newNumber
                }

                requests.push($.post('/plm/bom-update', params));

                elemOperation.attr('data-quantity', newQuantity);
                elemOperation.attr('data-number', newNumber);

            }

        }

    });

    // $('.operation.new').removeClass('changed');

    $('.operation.changed').each(function() {

        let elemOperation = $(this);
        let linkOperation = elemOperation.attr('data-link');

        let params = {
            wsId      : wsConfig.operations.workspaceId,
            sections  : []
        };

        let type           = elemOperation.find('.operation-type').val();
        let name           = elemOperation.find('.operation-name').val();
        let instructions   = elemOperation.find('.operation-instructions-value').val();
        let leadTime       = elemOperation.find('.operation-lead-time').val();
        let ctHours        = elemOperation.find('.operation-cycle-time-hh').val();
        let ctMinutes      = elemOperation.find('.operation-cycle-time-mm').val();
        let ctSeconds      = elemOperation.find('.operation-cycle-time-ss').val();
        let ctMilliseconds = elemOperation.find('.operation-cycle-time-ms').val();
        let noOfTimes      = elemOperation.find('.operation-repetitions').val();
        let fusionTeam     = elemOperation.find('.operation-fusion-team').val();

        if(type === '--') type = null; else type = { link : type };
        // if(leadTime === '') leadTime = null; else leadTime = Number(leadTime);

        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.type, type, false);
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.name, name, false);
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.instructions, instructions, false);
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.leadTime, leadTime, false, 'integer');
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.ctHours, ctHours, false, 'integer');
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.ctMinutes, ctMinutes, false, 'integer');
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.ctSeconds, ctSeconds, false, 'integer');
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.ctMilliseconds, ctMilliseconds, false, 'integer');
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.noOfTimes, noOfTimes, false, 'integer');
        addFieldToPayload(params.sections, wsConfig.operations.sections, null, wsConfig.operations.fields.fusionTeam, fusionTeam, false);

        // params.sections[1].fields[0].type = 'integer';

        // console.log(params);

        if(isBlank(linkOperation)) {


            // addFieldToPayload(params.sections, wsConfig.operations.sections, null, 'TITLE', title, false);

            params.getDetails = true;

            requests.push($.post('/plm/create', params));
            

        } else {


            params.link = linkOperation;

            requests.push($.post('/plm/edit', params));


        }

        elements.push($(this));

    });

    console.log(links);

    Promise.all(requests).then(function(responses) {

        let requestsAdd = []
        let index       = 0;

        console.log(responses);

        for(let response of responses) {

            if(response.error) {

            } else {

                if(response.url.indexOf('/create') === 0) {  

                    let linkNew         = response.data.__self__;
                    let elemOperation   = elements[index++];
                    let quantity        = elemOperation.find('.operation-repetitions').val() || 1;
                    let code            = getSectionFieldValue(response.data.sections, 'CODE', '');

                    elemOperation.find('.operation-code').first().html(code);
                    elemOperation.attr('data-link', linkNew);

                    requestsAdd.push($.post('/plm/bom-add', {
                        linkParent  : links.operation,
                        linkChild   : linkNew,
                        quantity    : quantity,
                        number      : elemOperation.find('.operation-number').html()
                    }));

                }   
            }

        


        }

        saveOpertionsMaterials();

        // index = 0;

        // Promise.all(requestsAdd).then(function(responses) {

        //     for(let response of responses) {
        //         if(response.error) {
        //         } else {
        //             let linkNew = response.data.split('.autodeskplm360.net')[1];
        //             elements[index++].attr('data-edge-link', linkNew);
        //         }
        //     }
        // });

    });

}
function saveOpertionsMaterials() {

    let requests = [];
    let elements = [];

    $('.operation-part').each(function() {

        let elemPart      = $(this);
        let elemOperation = elemPart.closest('.operation');
        let linkParent    = elemOperation.attr('data-link');
        let edgeId        = elemPart.attr('data-edge-id');
        let quantity      = elemPart.find('.operation-part-quantity').val()

        if(elemPart.hasClass('hidden')) {

            if(isBlank(edgeId)) {
                elemPart.remove();
            } else {
                $.get('/plm/bom-remove', {
                    link   : linkParent,
                    edgeId : edgeId
                });
            }

        } else if(isBlank(elemPart.attr('data-edge-id'))) {
            
            requests.push($.post('/plm/bom-add', {
                linkParent  : linkParent,
                linkChild   : elemPart.attr('data-link'),
                quantity    : quantity
            }));

            elements.push(elemPart);

        } else if(elemPart.attr('data-quantity') !== quantity) {

            $.post('/plm/bom-update', {
                linkParent  : linkParent,
                linkChild   : elemPart.attr('data-link'),
                edgeId      : edgeId,
                quantity    : quantity
            });

            elemPart.attr('data-quantity', quantity);

        }

    });

    Promise.all(requests).then(function(responses) {

        let index = 0;

        for(let response of responses) {

            elements[index++].attr('data-edge-id', response.data.split('/').pop());

        }
        $('#overlay').hide();
    });

}


// Set select options based on PLM picklist
function insertPicklistOptions(elemSelect, picklistName, value) {

    let picklist = picklists[picklistName];

    for(let option of picklist) {

        $('<option></option>').appendTo(elemSelect)
            .attr('value', option.link)
            .html(option.title);

    }

    if(value !== '') elemSelect.val(value);

}



// Handling of Material Sources
function showSourceSelection(elemClicked) {

    $('.part').removeClass('source-selection');

    let elemPart = elemClicked.closest('.part');
        elemPart.addClass('source-selection');

    links.part = elemPart.attr('data-link');

    $('#source-selection-title').html('Select source for ' + elemPart.attr('data-part-number'));

    $('#overlay').show();
    $('#source-selection').show();

    paramsCreateProcess.id            = 'source-create';
    paramsCreateProcess.contextItem   = links.part;
    paramsCreateProcess.afterCreation = function(id, link) { selectPBOMRootItem(link); }

    filterExistingProcesses[0].value       = elemPart.attr('data-part-number');
    paramsExistingProcesses.id             = 'source-processes';
    paramsExistingProcesses.onDblClickItem = function(elemClicked) { selectPBOMRootItem(elemClicked.attr('data-link')); }

    insertCreate([], [wsConfig.processes.id], paramsCreateProcess);
    insertResults(wsConfig.processes.id, filterExistingProcesses, paramsExistingProcesses);
    insertSourcing(links.part, {
        id : 'source-vendors'
    })

}
function closeSourceSelection() {

    $('#overlay').hide();
    $('#source-selection').hide();

}
function selectSource() {

    $('#overlay').hide();
    $('#source-selection').hide();

    let elemSource = $('#source-selection').find('.content-item.selected');
    let title      = elemSource.attr('data-title');
    let link       = elemSource.attr('data-link');

    $('.part.source-selection').find('.part-source-selected').html(title);

    for(let processPart of processPartsList) {

        if(processPart.link === links.part) {

            let elemBOM     = getBOMItemByEdgeId('bom', processPart.edgeId);
            let elemBOMCell = elemBOM.find('.column-process');
            let linkEdge    = elemBOM.attr('data-pbom-edge-link');

            let requests = [$.post('/plm/bom-add', {
                linkParent : links.process,
                linkChild  : link,
                quantity   : elemBOM.attr('data-quantity')
            })];

            if(!isBlank(linkEdge)) requests.push($.get('/plm/bom-remove', { edgeLink : linkEdge }));

            Promise.all(requests).then(function(responses) {
                elemBOM.attr('data-pbom-edge-link', responses[0].data.split('.autodeskplm360.ne')[1]);
            });

            elemBOMCell.html(title);
            elemBOM.attr('data-pbom-link', link);
            elemBOM.addClass('status-green').removeClass('status-red');

        }

    }

}