let links           = {}
let wsConfig        = {};
let bomCompleted    = 0;
let urlParameters   = getURLParameters();
let partsEBOM       = [];
let paramsDetails   = {
    editable       : false,
    openInPLM      : true,
    bookmark       : true,
    layout         : 'narrow',
    headerLabel    : 'descriptor',
    expandSections : ['Basic']
}

let saveActions = {
    create : {
        label       : 'Creating new SBOM items',
        className   : 'pending-create',
        selector    : '.sbom-node',
        maxRequests : 1,
    },
    remove : {
        label       : 'Deleting BOM entries',
        className   : 'pending-remove',
        selector    : '',
        maxRequests : 4,
    },
    add : {
        label        : 'Adding Service BOM items',
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

    appendOverlay(false);

    getFeatureSettings('sbom', [], function() {
        getInitialData();
        setUIEvents();
        insertDetails(urlParameters.link, paramsDetails);
    });

});

function setUIEvents() {

    $('#mode').on('change', function() {
        if($('#mode').val() === 'ebom') { $('.mode-ebom').removeClass('hidden'); $('.mode-lib').addClass('hidden'); }
        else { $('.mode-ebom').addClass('hidden'); $('.mode-lib').removeClass('hidden'); }
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

    $('#add-service-offering').click(function() {
        insertService();
        updatePosNumbers();
    });

    $('#add-service-kit').click(function() {
        insertKit({ details : {}});
        updatePosNumbers();
    });

    $('#filterSpareParts').click(function() {
        filterItemsList($('#spare-parts'));
    });

    $('#add-all-recommended').click(function() {
        addAllRecommended();
    });

    $('#save').click(function() {
        saveChanges();
    }); 

}


// Get current Product data
function getInitialData() {

    let requests = [
        $.get('/plm/details'             , { link : urlParameters.link }),
        $.get('/plm/picklist'            , { link : '/api/v3/lookups/' + config.sbom.picklistItemTypes }),
        $.get('/plm/sections'            , { wsId : urlParameters.wsId }),
        $.get('/plm/sections'            , { wsId : config.items.wsId }),
        $.get('/plm/bom-views-and-fields', { wsId : config.items.wsId })
    ];

    Promise.all(requests).then(function(responses) {
        
        $('#overlay').hide();
        $('#header-subtitle').html(responses[0].data.title);
        appendProcessing('serivce-offerings', false);

        links.ebom = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdEBOM, '', 'link');
        links.sbom = getSectionFieldValue(responses[0].data.sections, config.sbom.fieldIdSBOM, '', 'link');

        wsConfig.sections         = responses[3].data;
        wsConfig.fieldIdSparePart = config.sbom.fieldIdSparePart;
        wsConfig.valuesSparePart  = [];

        for(let value of config.sbom.valuesSparePart) wsConfig.valuesSparePart.push(value.toLowerCase());
        
        for(let type of responses[1].data.items) {
            switch(type.title) {
                case config.sbom.typeServiceBOM      : wsConfig.linkTypeSBOM      = type.link; break;
                case config.sbom.typeServiceOffering : wsConfig.linkTypeService   = type.link; break;
                case config.sbom.typeServiceOperation: wsConfig.linkTypeOperation = type.link; break;
                case config.sbom.typeServiceKit      : wsConfig.linkTypeKit       = type.link; break;
            }
        }
        
        for(let bomView of responses[4].data) {
            if(bomView.name === config.sbom.bomViewName) {
                wsConfig.bomViewId     = bomView.id;
                wsConfig.bomViewFields = bomView.fields;
                break;
            }
        }

        insertBrowser('browser', [{
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
        },{
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
        }], {
            enableDragging  : true,
            enableDetails   : true,
            settingsDetails : paramsDetails
            // ondragstart : function(event) { dragStartHandler(event); },
            // ondragend : function(event) { dragEndHandler(event); }
        });

        enableDropTarget($('#spare-parts'));

        insertViewer(links.ebom); 

        insertBOM(links.ebom, {
            collapseContents  : false,
            counters          : true,
            search            : true,
            path              : true,
            toggles           : true,
            viewerSelection   : true,
            includeOMPartList : true,
            headerLabel       : 'Product BOM',
            hideHeaderLabel   : true,
            contentSize       : 'l',
            columnsIn         : ['Quantity'],
            bomViewName       : config.sbom.bomViewName,
            onClickItem       : function(elemClicked) { insertDetails(elemClicked.attr('data-link'), paramsDetails); },
            afterCompletion   : function(id, data)    { 
                partsEBOM = data.bomPartsList; 
                insertBOMItemFilter();
                insertBOMIndicators(); 
                enableBOMItemDragging();
            }
        }); 
        
        createServiceBOM(responses[0].data, responses[2].data, function() {
            getServiceBOM();
        });

    });

}
function createServiceBOM(contextDetails, contextSections, callback) {

     if(isBlank(links.sbom)) {

        let params = {
            wsId      : config.items.wsId,
            sections  : []
        };
    
        let title = 'SBOM of ' + getSectionFieldValue(contextDetails.sections, 'TITLE', '');

        addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', title );
        addFieldToPayload(params.sections, wsConfig.sections, null, config.sbom.fieldIdItemType, { 'link' : wsConfig.linkTypeSBOM } );

        $.post({
            url         : '/plm/create', 
            contentType : 'application/json',
            data        : JSON.stringify(params)
        }, function(response) {
            if(response.error) {
                showErrorMessage('Error', 'Error while creating Service BOM root item, the editor cannot be used at this time. Please review your server configuration.');
            } else {
                links.sbom = response.data.split('.autodeskplm360.net')[1];
                storeSBOMLink(contextSections);
                callback();
            }
        }); 


    } else callback();

}
function storeSBOMLink(contextSections) {

    let params = { link : urlParameters.link, sections : [] }

    addFieldToPayload(params.sections, contextSections, null, config.sbom.fieldIdSBOM, { link : links.sbom });

    $.post('/plm/edit', params, function() {});

}
function getServiceBOM() {

    if(isBlank(links.sbom)) return;

    let bomSettings = { viewFields : wsConfig.bomViewFields };

    let params = {
        link    : links.sbom,
        depth   : 3,
        viewId  : wsConfig.bomViewId
    }

    $('#spare-parts').attr('data-link', links.sbom);

    $.get('/plm/bom', params, function(response) {

        $('#serivce-offerings-processing').remove();
        
        let partsSBOM    = getBOMPartsList(bomSettings, response.data);
        let skipChildren = false;
        let elemService, elemOperation, elemKit;

        for(let part of partsSBOM) {

            let type = part.details.TYPE || { title : '' };

                   if(type.title === config.sbom.typeServiceOffering) {
                elemService = insertService(part.link, part.details.TITLE, part.edgeId, part.linkParent, part.number);
                skipChildren = false
            } else if(type.title === config.sbom.typeServiceOperation) {
                elemOperation = insertOperation(elemService, part.link, part.details.TITLE, part.edgeId, part.number);
                skipChildren = false
            } else if(type.title === config.sbom.typeServiceKit) {
                elemKit = insertKit(part);
                skipChildren = false
            } else if(part.level === 1) {
                insertItem($('#parts'), 'spare-part', '2', part);
                skipChildren = true;
            } else if((part.level === 3) && !skipChildren) {
                insertItem(elemOperation, 'service-item', '1', part);
            } else if((part.level === 2) && !skipChildren) {
                insertItem(elemKit, 'kit-item', '1', part);

            }

        }

        insertBOMIndicators();
        updatePosNumbers();
        
    });
        
}
function insertBOMItemFilter() {

    let elemSelect = $('<select></select>').prependTo($('#bom-controls'))
        .addClass('button')
        .attr('id', 'select-contents')
        .on('change', function() {
            applyBOMItemFilter();
        });

    $('<option></option>').appendTo(elemSelect)
        .attr('value', '--')
        .html('Display All');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'srv')
        .html('Service items only');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'kit')
        .html('Kit items only');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'spr')
        .html('Spare Parts only');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'rec')
        .html('Recommended');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'isbom')
        .html('In SBOM');

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'nisbom')
        .html('Not in SBOM');

}
function insertBOMIndicators() {

    bomCompleted++;

    if(bomCompleted > 1) {       

        $('#bom-thead-row').append($('<th class="bom-column-recommended">Spare/Wear</th>'))
            .append($('<th class="type"><i class="icon icon-service"></i></th>'))
            .append($('<th class="type"><i class="icon icon-package"></i></th>'))
            .append($('<th class="type"><i class="icon icon-details"></i></th>'));

        $('#bom-tbody').children('.content-item').each(function() {

            let elemCellRecommended = $('<td class="bom-column-recommended"></td>');
            let isRecommendedSpare  = false;

            for(let part of partsEBOM) {
                if(part.link === $(this).attr('data-link')) {
                    elemCellRecommended.html(part.details[wsConfig.fieldIdSparePart]);

                    if(!isBlank(part.details[wsConfig.fieldIdSparePart])) {
                        let fieldValue = part.details[wsConfig.fieldIdSparePart].toLowerCase();
                        if(wsConfig.valuesSparePart.includes(fieldValue)) isRecommendedSpare = true;
                    }

                }
            }

            if(isRecommendedSpare) $(this).addClass('recommended-spare-part');

            $(this).append(elemCellRecommended)
                .append($('<td class="type srv">-</td>'))
                .append($('<td class="type kit">-</td>'))
                .append($('<td class="type spr">-</td>'));     

        });

        updateBOMIndicators();

    }

}
function updateBOMIndicators() {

    let serviceItems = $('.sbom-node:not(.hidden)').find('.operation:not(.hidden)').find('.items-list-row:not(.hidden)');
    let kitItems     = $('#kits').find('.item-group:not(.hidden)').find('.items-list-row:not(.hidden)');
    let spareParts   = $('#spare-parts').children(':not(.hidden)');

    $('#bom-tbody').children('.content-item').each(function() {

        let elemBOMItem = $(this);
        let title       = elemBOMItem.attr('data-title');
        let linkBOM     = elemBOMItem.attr('data-link');
        let cellSrv     = elemBOMItem.children('.type.srv').first();
        let cellKit     = elemBOMItem.children('.type.kit').first();
        let cellSpr     = elemBOMItem.children('.type.spr').first();
        
        cellSrv.html('-');
        cellKit.html('-');
        cellSpr.html('-');

        serviceItems.each(function() {

            let elemServiceItem = $(this);
            let linkSrv         = elemServiceItem.attr('data-link');

            if(linkBOM === linkSrv) {
                cellSrv.html('');
                $('<i></i>').appendTo(cellSrv)
                    .addClass('icon')
                    .addClass('isbom')
                    .addClass('icon-service')
                    .attr('title', title + ' is included in at least one Service Offering');
                return false;
            }

        });

        kitItems.each(function() {

            let elemKitItem = $(this);
            let linkKit     = elemKitItem.attr('data-link');

            if(linkBOM === linkKit) {
                cellKit.html('');
                $('<i></i>').appendTo(cellKit)
                    .addClass('icon')
                    .addClass('isbom')
                    .addClass('icon-package')
                    .attr('title', title + ' is included in at least one Kit');
                return false;
            }

        });

        spareParts.each(function() {

            let elemSparePart = $(this);
            let linkSpr       = elemSparePart.attr('data-link');

            if(linkBOM === linkSpr) {
                cellSpr.html('');
                $('<i></i>').appendTo(cellSpr)
                    .addClass('icon')
                    .addClass('isbom')
                    .addClass('icon-details')
                    .attr('title', title + ' is included in list of Spare Parts');
                return false;
            }

        });

    });

}
function updatePosNumbers() {

    let baseService   = config.sbom.basePosNumbers[0];
    let baseKit       = config.sbom.basePosNumbers[1];
    let baseSparePart = config.sbom.basePosNumbers[2];

    $('.service').each(function() {

        let elemService   = $(this);
        let baseOperation = 1;

        if(!elemService.hasClass('hidden')) {
            
            elemService.attr('data-number-new', baseService++);
            elemService.find('.operation').each(function() {

                let elemOperation   = $(this);
                let baseServiceItem = 1;

                if(!elemOperation.hasClass('hidden')) {

                    elemOperation.attr('data-number-new', baseOperation++);
                    elemOperation.find('.items-list-row.service-item').each(function() {

                        let elemItem = $(this);
                        let elemCounter = $(this).find('.tile-counter');

                        if(!elemItem.hasClass('hidden')) elemCounter.html(baseServiceItem++);

                    });   
                }

            });

        }

    });

    $('.group.kit').each(function() {

        let elemKit      = $(this);
        let baseKitItems = 1;

        if(!elemKit.hasClass('hidden')) {

            elemKit.attr('data-number-new', baseKit++);
            elemKit.find('.items-list-row.kit-item').each(function() {

                let elemItem = $(this);
                let elemCounter = $(this).find('.tile-counter');

                if(!elemItem.hasClass('hidden')) elemCounter.html(baseKitItems++);

            })
        }

    });

    $('.items-list-row.spare-part').each(function() {

        let elemItem    = $(this);
        let elemCounter = $(this).find('.tile-counter');

        if(!elemItem.hasClass('hidden')) elemCounter.html(baseSparePart++);

    });

}


// Filter Viewer and BOM for matching items
function applyBOMItemFilter() {

    let value       = $('#select-contents').val();
    let partNumbers = [];

    if(value === '--') {

        $('#bom-tbody').children().show();
        viewerResetSelection();

    } else if(value === 'nisbom') {


        $('#bom-tbody').children().each(function() {

            let elemRow    = $(this);
            let sbomItems  = elemRow.find('.isbom').length;
            let partNumber = elemRow.attr('data-part-number');
            
            if(sbomItems === 0) {
                elemRow.show();
                if(elemRow.hasClass('leaf')) partNumbers.push(partNumber);

            } else elemRow.hide();
    
        });

        viewerSelectModels(partNumbers);

    } else if(value === 'rec') {

        $('#bom-tbody').children().hide();

        $('#bom-tbody').find('.recommended-spare-part').each(function() {

            let partNumber = $(this).attr('data-part-number');
            
            $(this).show();
            partNumbers.push(partNumber);
    
        });
    
        viewerSelectModels(partNumbers);       
        

    } else {

        $('#bom-tbody').children().hide();

        let classFilter = '.icon-service';

             if(value === 'kit'  ) classFilter = '.icon-package';
        else if(value === 'spr'  ) classFilter = '.icon-details';
        else if(value === 'isbom') classFilter = '.isbom';

        $('#bom-tbody').find(classFilter).each(function() {

            let elemRow    = $(this).closest('.content-item');
            let partNumber = elemRow.attr('data-part-number');
            
            elemRow.show();
            partNumbers.push(partNumber);
    
        });
    
        viewerSelectModels(partNumbers);

    }

}


// Insert UI elements for Service BOM definition
function insertService(link, title, edgeId, parent, number) {

    if(isBlank(link)  ) link   = '';
    if(isBlank(title) ) title  = '';
    if(isBlank(edgeId)) edgeId = '';
    if(isBlank(parent)) parent = '';
    if(isBlank(number)) number = '';

    let elemService = $('<div></div>').appendTo($('#serivce-offerings'))
        .addClass('group')
        .addClass('sbom-node')
        .addClass('service')
        .addClass('min')
        .addClass('surface-level-1')
        .attr('data-link', link)
        .attr('data-title', title)
        .attr('data-edgeid', edgeId)
        .attr('data-number', number)
        .attr('data-parent', parent)
        .attr('data-link-type', wsConfig.linkTypeService);

    if(link === '') elemService.addClass('expanded'); else elemService.addClass('collapsed');

    let elemHeader = $('<div></div>').appendTo(elemService)
        .addClass('group-header');        

    $('<div></div>').appendTo(elemHeader)
        .addClass('group-toggle')
        .addClass('icon')
        .addClass('button')
        .click(function(e) {
            clickGroupToggle(e, $(this));
        });

    let elemTitle = $('<input>').appendTo(elemHeader)
        .addClass('group-title')
        .attr('placeholder', 'Enter Service Name');

    if(!isBlank(title)) elemTitle.val(title);

    let elemActions = $('<div></div>').appendTo(elemHeader)
        .addClass('group-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('with-icon')
        .addClass('default')
        .addClass('icon-create')
        .html('Operation')
        .click(function(e) {
            insertOperation($(this).closest('.service'));
            updatePosNumbers();
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('toggle-maximize')
        .click(function(e) {
            clickMaximizeToggle(e, $(this));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-3d')
        .click(function() {
            filterItemsList($(this).closest('.service'));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')        
        .click(function() {
            openItemByLink($(this).closest('.service').attr('data-link'));
        })

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.group').addClass('hidden');
            updatePosNumbers();
            updateBOMIndicators();
        });

    $('<div></div>').appendTo(elemService)
        .addClass('operations');

    if(link === '') elemTitle.focus();

    return elemService;

}
function insertOperation(elemService, link, title, edgeId, number) {

    if(isBlank(link)  ) link   = '';
    if(isBlank(title) ) title  = '';
    if(isBlank(edgeId)) edgeId = '';
    if(isBlank(number)) number = '';

    let elemContent = elemService.find('.operations').first();

    let elemOperation  = $('<div></div>').appendTo(elemContent)
        .addClass('group')
        .addClass('sbom-node')
        .addClass('operation')
        .addClass('expanded')
        .addClass('surface-level-1')
        .attr('data-link', link)
        .attr('data-title', title)
        .attr('data-edgeid', edgeId)
        .attr('data-number', number)
        .attr('data-link-type', wsConfig.linkTypeOperation);

    enableDropTarget(elemOperation);

    let elemHeader = $('<div></div>').appendTo(elemOperation)
        .addClass('group-header');  

    $('<div></div>').appendTo(elemHeader)
        .addClass('group-toggle')
        .addClass('icon')
        .addClass('button')
        .click(function(e) {
            clickGroupToggle(e, $(this));
        });

    let elemTitle = $('<input>').appendTo(elemHeader)
        .addClass('group-title')
        .attr('placeholder', 'Enter Operation Name');      
        
    if(!isBlank(title)) elemTitle.val(title);        

    let elemActions = $('<div></div>').appendTo(elemHeader)
        .addClass('group-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-3d')
        .click(function() {
            filterItemsList($(this));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')        
        .click(function() {
            openItemByLink($(this).closest('.service').attr('data-link'));
        })  
        
        $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.group').addClass('hidden');
            updatePosNumbers();
            updateBOMIndicators();
        });     

    $('<div></div>').appendTo(elemOperation)
        .addClass('items-list')
        .addClass('operation-items')
        .addClass('tiles')
        .addClass('list')
        .addClass('xs');

    if(link === '') elemTitle.focus();

    return elemOperation;

}
function insertKit(part) {

    let link   = part.link || '';
    let title  = part.details.TITLE || '';
    let edgeId = part.edgeId || '';
    let number = part.number || '';

    let elemKit = $('<div></div>').appendTo($('#kits'))
        .addClass('group')
        .addClass('item-group')
        .addClass('sbom-node')
        .addClass('kit')
        .addClass('min')
        .addClass('surface-level-1')
        .attr('data-link', link)
        .attr('data-title', title)
        .attr('data-edgeid', edgeId)
        .attr('data-number', number)
        .attr('data-link-type', wsConfig.linkTypeKit);
        
    enableDropTarget(elemKit);      

    if(link === '') elemKit.addClass('expanded'); else elemKit.addClass('collapsed');        

    let elemHeader = $('<div></div>').appendTo(elemKit)
        .addClass('group-header');        

    $('<div></div>').appendTo(elemHeader)
        .addClass('group-toggle')
        .addClass('icon')
        .addClass('button')
        .click(function(e) {
            clickGroupToggle(e, $(this));
        });

    let elemTitle = $('<input>').appendTo(elemHeader)
        .addClass('group-title')
        .attr('placeholder', 'Enter Kit Name');

    if(!isBlank(title)) elemTitle.val(title);

    let elemActions = $('<div></div>').appendTo(elemHeader)
        .addClass('group-actions');

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('toggle-maximize')
        .click(function(e) {
            clickMaximizeToggle(e, $(this));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-3d')
        .click(function() {
            filterItemsList($(this).closest('.kit'));
        });

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-open')        
        .click(function() {
            openItemByLink($(this).closest('.sbom-node').attr('data-link'));
        })

    $('<div></div>').appendTo(elemActions)
        .addClass('button')
        .addClass('icon')
        .addClass('icon-delete')
        .click(function() {
            $(this).closest('.group').addClass('hidden');
            updatePosNumbers();
            updateBOMIndicators();
        });

    $('<div></div>').appendTo(elemKit)
        .addClass('items-list')
        .addClass('kit-items')
        .addClass('tiles') 
        .addClass('list')
        .addClass('xs');

    if(link === '') elemTitle.focus();

    return elemKit;

}
function insertItem(elemParent, className, surfaceLevel, part) {

    if(isBlank(surfaceLevel)) surfaceLevel = '1';

    let link        = part.link || '';
    let title       = part.title || '';
    let edgeId      = part.edgeId || '';
    let number      = part.number || '';
    let partNumber  = part.details.NUMBER || '';
    let quantity    = part.quantity || 1.0;

    let elemItemsList = elemParent.find('.items-list').first();
    let addItem       = true;

    elemItemsList.children().each(function() {
        if($(this).attr('data-link') === link) {
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
        .addClass(className)
        .addClass('surface-level-' + surfaceLevel)
        .attr('data-link', link)
        .attr('data-edgeid', edgeId)
        .attr('data-number', number)
        .attr('data-quantity', quantity)
        .attr('ondragenter', 'dragEnterItem(event)')
        .attr('ondragover' , 'dragEnterItem(event)')
        .attr('ondragleave', 'dragLeaveHandler(event)')
        .attr('ondrop'     , 'dropHandler(event)');

    $('<input>').appendTo(elemRow)
        .addClass('list-item-quantity')
        .val(quantity);

    let elemItem  = $('<div></div>').appendTo(elemRow)
        .addClass(className)
        .addClass('tile')
        .addClass('sbom-item')
        .attr('data-link', link)
        .attr('data-edgeid', edgeId)
        .attr('data-part-number', partNumber)
        .attr('draggable', 'true')
        .attr('ondragstart', 'dragStartHandler(event)')
        .attr('ondragend', 'dragEndHandler(event)')
        .click(function() {
            let isSelected = $(this).hasClass('selected');
            $('.sbom-item').removeClass('selected');
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

    $('<div></div>').appendTo(elemImage).addClass('tile-counter').html(number);

    let elemDetails = $('<div></div>').appendTo(elemItem)
        .addClass('tile-details');    

    $('<div></div>').appendTo(elemDetails)
        .addClass('tile-title')
        .html(title);

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
function clickGroupToggle(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    elemClicked.closest('.group').toggleClass('collapsed').toggleClass('expanded');

}
function clickMaximizeToggle(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let elemGroup = elemClicked.closest('.group');

    // elemClicked.toggleClass('icon-chevron-right').toggleClass('icon-chevron-down');
    elemClicked.closest('.group').toggleClass('max').toggleClass('min');

    if(elemGroup.hasClass('max')) {
        elemGroup.removeClass('collapsed').addClass('expanded');
    }

}
function dragEnterItem(e) {

    e.preventDefault();

    let elemTarget = $(e.target);

    if(!elemTarget.hasClass('items-list-row')) elemTarget = elemTarget.closest('.items-list-row');

    elemTarget.addClass('drag-hover');

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
function enableDropTarget(elem) {

    elem.attr('ondragenter', 'dragEnterHandler(event)');
    elem.attr('ondragover' , 'dragOverHandler(event)' );
    elem.attr('ondragleave', 'dragLeaveHandler(event)');
    elem.attr('ondrop'     , 'dropHandler(event)'     );  

}
function dragStartHandler(e) {
    
    $('.dragged').removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');
    
    let elemDragged = $(e.target);
        elemDragged.addClass('dragged');

    e.dataTransfer.setData('text/plain', elemDragged.attr('data-link'));

}
function dragEnterHandler(e) {

    e.preventDefault();
    $(e.target).addClass('drag-hover');

}
function dragOverHandler(e) {

    e.preventDefault();

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
    let className   = '';
    let level       = '1';
    let fromBOM     = elemDragged.is('tr');
    let fromBrowser = (elemDragged.hasClass('tile') && elemDragged.hasClass('content-item'))
    let onItem      = null;

    if(elemTarget.hasClass('operation')) { className = 'service-item'; level = '1'; }
    else if(elemTarget.hasClass('kit')) { className = 'kit-item'; level = '1'; }
    else if(elemTarget.attr('id') === 'spare-parts') { className = 'spare-part'; level = '2'; elemTarget = $('#parts');}
    else {

        onItem     = elemTarget.closest('.items-list-row');
        elemTarget = elemTarget.closest('.items-list').parent();
        className  = 'spare-part';

             if(onItem.hasClass('service-item')) className = 'service-item';
        else if(onItem.hasClass('kit-item'    )) className = 'kit-item';
        
    }

    if(fromBOM) {

        let part = {
            link        : elemDragged.attr('data-link'), 
            title       : elemDragged.attr('data-title'),  
            details     : {
                NUMBER  : elemDragged.attr('data-part-number')
            },
            edgeId      : '', 
            quantity    : elemDragged.attr('data-quantity')
        }

        let newItem = insertItem(elemTarget, className, level, part);

        if(onItem !== null) newItem.insertBefore(onItem);
    
    } else  if(fromBrowser) {

        let part = {
            link        : elemDragged.attr('data-link'), 
            title       : elemDragged.attr('data-title'),  
            details     : {
                NUMBER  : elemDragged.attr('data-part-number')
            },
            edgeId      : '', 
            quantity    : '1.0'
        }

        let newItem = insertItem(elemTarget, className, level, part);

        if(onItem !== null) newItem.insertBefore(onItem);

    } else {
        
        elemDragged = elemDragged.closest('.items-list-row');

        if(e.shiftKey) elemDragged = elemDragged.clone();

        if(onItem !== null) elemDragged.insertBefore(onItem);
        else elemDragged.appendTo(elemTarget);

    }

    $('.dragged'   ).removeClass('dragged');
    $('.drag-hover').removeClass('drag-hover');

    updateBOMIndicators();
    updatePosNumbers();

}


// Add all recommended items to the Spare Parts list
function addAllRecommended() {

    let listRecommended = $('.recommended-spare-part');
    let listSpareParts  = $('#spare-parts').children();

    listRecommended.each(function() {

        let add = true;
        let elemRecommended = $(this);
        let linkRecommended = $(this).attr('data-link');

        listSpareParts.each(function() {
            let linkSparePart = $(this).attr('data-link');
            if(linkRecommended === linkSparePart) {
                add = false;
                return 0;
            }
        })

        if(add) {

            let part = {
                link        : linkRecommended, 
                title       : elemRecommended.attr('data-title'),  
                details     : {
                    NUMBER  : elemRecommended.attr('data-part-number')
                },
                edgeId      : '', 
                quantity    : elemRecommended.attr('data-quantity')
            };

            insertItem($('#parts'), 'spare-part', '2', part);

        }

    });

    updateBOMIndicators();
    updatePosNumbers();

}


/* Filter for items of given contenxt */
function filterItemsList(elemParent) {

    let partNumbers = [];
    $('.bom-item').removeClass('result');
    
    elemParent.find('.tile').each(function() {
        let partNumber = $(this).attr('data-part-number');
        partNumbers.push(partNumber);
        $('.bom-item').each(function() {
            if($(this).attr('data-part-number') === partNumber) $(this).addClass('result');
        })
    });
    
    viewerSelectModels(partNumbers);

}


function selectOperations(elemButton, mode) {

    let elemParent = elemButton.closest('.service');
    let elemOperations = elemParent.find('.service-operation');

    elemOperations.each(function() {

        if(mode === 'all') $(this).addClass('selected');
        else $(this).removeClass('selected');

    });

}
function selectItems(elemButton, mode) {

    let elemParent = elemButton.closest('.service');
    let elemServiceItems = elemParent.find('.service-item');

    elemServiceItems.each(function() {

        if(mode === 'all') $(this).addClass('selected');
        else $(this).removeClass('selected');

    });

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

    $('.sbom-node').each(function() {

        let link   = $(this).attr('data-link');
        let edgeId = $(this).attr('data-edgeid');
        let title  = $(this).attr('data-title');
        let label  = $(this).find('.group-title').val();
        let hidden = $(this).hasClass('hidden');
        let posCur = $(this).attr('data-number');
        let posNew = $(this).attr('data-number-new');

        if(hidden) {
            if(edgeId === '') $(this).remove();
            else $(this).addClass(saveActions.remove.className);
        }
        else if(link === '')  $(this).addClass(saveActions.create.className).addClass(saveActions.add.className);
        else if(title !== label) $(this).addClass(saveActions.rename.className);

        if(!isBlank(posNew)) {
            if(posNew !== posCur) {
                $(this).addClass(saveActions.update.className);
            }

        }

    });

    $('.items-list-row').each(function() {

        let elemItemRow = $(this);
        let edgeId      = elemItemRow.attr('data-edgeid');
        let quantity    = getItemQuantity(elemItemRow);
        let posCur      = $(this).attr('data-number');
        let posNew      = getPosNumber($(this));

        if(elemItemRow.hasClass('hidden')) elemItemRow.addClass(saveActions.remove.className);
        else if(edgeId === '') elemItemRow.addClass(saveActions.add.className);
        else if(parseFloat(quantity) !== parseFloat(elemItemRow.attr('data-quantity'))) {
            elemItemRow.addClass(saveActions.update.className);
        }

        if(edgeId !== '') {
            if(posNew !== '') {
                if(posNew !== posCur) {
                    $(this).addClass(saveActions.update.className);
                }
            }
        }

    });

    showSaveDialog();
    createNewItems(saveActions.create);

}
function getParentLink(elemItem) {

    if(elemItem.hasClass('service'   )) return links.sbom;
    if(elemItem.hasClass('operation' )) return elemItem.closest('.service').attr('data-link');
    if(elemItem.hasClass('kit'       )) return links.sbom;
    if(elemItem.hasClass('spare-part')) return links.sbom;
    
    let elemParent = elemItem.closest('.items-list').parent();

    return elemParent.attr('data-link');

}
function getPosNumber(elemItem) {

    let isItem      = elemItem.hasClass('items-list-row');
    let elemCounter = elemItem.find('.tile-counter');
    let valueNew    = elemItem.attr('data-number-new');
    // let elemParent   = elemItem.closest('.items-list');

    if(isItem) { if(elemCounter.length > 0) return elemCounter.html(); }
    if(!isBlank(valueNew)) return valueNew;
    


    // if(elemParent.attr('id') === 'spare-parts') return 1.0;

    return ;

}
function getItemQuantity(elemItem) {

    let elemQuantity = elemItem.find('.list-item-quantity');
    let elemParent   = elemItem.closest('.items-list');

    if(elemParent.attr('id') === 'spare-parts') return 1.0;

    return elemQuantity.val();

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

                let title = $(this).find('.group-title').first().val();
                let type  = $(this).attr('data-link-type');

                addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', title);
                addFieldToPayload(params.sections, wsConfig.sections, null, 'TYPE' , { link : type });
    
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

                let title = elemItem.find('.group-title').first().val();

                addFieldToPayload(params.sections, wsConfig.sections, null, 'TITLE', title);

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