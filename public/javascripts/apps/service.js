let fields, sections, wsIdRequests, sectionIdRequests;
let listSpareParts  = [];
let listWearParts   = [];
let maintenanceMode = false;
let link            = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
let urns = {
    'thumbnail'     : '', 
    'partNumber'    : '', 
    'title'         : '', 
    'description'   : '', 
    'spareWearPart' : '', 
    'material'      : '', 
    'mass'          : '',
    'dimensions'    : ''
}

// let bom, flatBOM;
let selectedBOMContext      = '';
let wsProblemReports        = { 'id' : '', 'sections' : [], 'fields' : [] };
let wsSparePartsRequests    = { 'id' : '', 'sections' : [], 'fields' : [] };
let paramsAttachments = { 
    'extensionsEx'  : '.dwf,.dwfx',
    'header'        : true, 
    'size'          : 'xs'
}
let paramsProcesses = { 
    'headerLabel'       : '', 
    'createWSID'        : '82' ,
    'createSectionsEx'  : ['Review', 'Technical Analysis'],
    'workspacesEx'      : ['83','84']
}
let features = {
    'homeButton'            : true,
    'toggleItemAttachments' : true,
    'toggleItemDetails'     : true,
    'manageProblemReports'  : true,
    'showStock'             : true,
    'requestWorkflowActions': true,
    'viewer' : {
        'cube'          : false,
        'orbit'         : false,
        'firstPerson'   : false,
        'camera'        : false,
        'measure'       : true,
        'section'       : true,
        'explodedView'  : true,
        'modelBrowser'  : false,
        'properties'    : false,
        'settings'      : false,
        'fullscreen'    : true,
        'markup'        : false,
        'ghosting'      : true,
        'highlight'     : true,
        'reset'         : true,
        'views'         : true
    }
}


$(document).ready(function() {
    
    wsProblemReports.id      = config.service.wsIdProblemReports;
    wsSparePartsRequests.id  = config.service.wsIdSparePartsRequests;

    appendProcessing('items');
    appendOverlay();

    let requests = [];

    if(!isBlank(wsId)) { if(!isBlank(dmsId)) {
        requests.push($.get('/plm/bom-views-and-fields', { 'wsId' : wsId }))
    }}

    getApplicationFeatures('service', requests, function(responses) {

        if(!isBlank(wsId)) {
            let addToCache = true;
            for(let workspace of cacheWorkspaces) {
                if(workspace.id === wsId) {
                    workspace.bomViews = responses[1].data;
                    addToCache = false;
                }
            }
            if(addToCache) {
                cacheWorkspaces.push({
                    'id'       : wsId,
                    'bomViews' : responses[1].data
                })
            }
        }

        if(!features.homeButton) {
            $('#home').remove();
            $('#landing').remove();
        }
        if(!features.toggleItemAttachments) {
            $('#attachments').remove();
            $('#toggle-attachments').remove();
        }
        if(!features.toggleItemDetails) {
            $('#details').remove();
            $('#toggle-details').remove();
        }
        if(!features.manageProblemReports) {
            $('#processes').remove();
            $('#tab-processes').remove();
        }
        if(!features.showStock) {
            $('#color-stock').remove();
        }
        if(!features.requestWorkflowActions) $('#workflow-actions').remove();

        $('#header').show();
        $('#startup').remove();
        setUIEvents();

        if(features.homeButton) {

            insertWorkspaceViews(wsSparePartsRequests.id, {
                'id'                : 'requests',
                'headerLabel'       : 'Your Requests', 
                'layout'            : 'table',
                'includeRecents'    : true,
                'startupView'       : ''
            });
            
            if(!isBlank(config.service.wsIdProducts)) insertWorkspaceItems(config.service.wsIdProducts, {
                'id'                 : 'products', 
                'headerLabel'        : config.service.productsListHeader, 
                'icon'               : 'icon-package', 
                'filter'             : config.service.productsFilter,
                'sortBy'             : config.service.productsSortBy, 
                'groupBy'            : config.service.productsGroupBy,
                'fieldIdImage'       : config.service.productsFieldIdImage, 
                'fieldIdTitle'       : config.service.productsFieldIdTitle, 
                'fieldIdSubtitle'    : config.service.productsFieldIdSubtitle, 
                'fieldIdsAttributes' : [ config.service.productsFieldIdBOM ]
            }); 

        }

        if(!isBlank(dmsId)) {
            $('body').addClass('screen-main').removeClass('screen-landing').removeClass('screen-request');
            openItem(link);
        } else $('#landing').show();

    });
    
});


function setUIEvents() {


    // Close current product display and return to landing page
    if(features.homeButton) {
        $('#home').click(function() {
            $('body').addClass('screen-landing').removeClass('screen-main').removeClass('screen-request');
            document.title = documentTitle;
            window.history.replaceState(null, null, '/service?theme=' + theme);
        });
    }


    // Toggles in header toolbar
    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        viewerResize();
    })
    if(features.toggleItemAttachments) {
        $('#toggle-attachments').click(function() {
            $('body').toggleClass('no-attachments');
            viewerResize();
        })
    }
    if(features.toggleItemDetails) {
        $('#toggle-details').click(function() {
            $('body').toggleClass('with-details');
            viewerResize();
        })
    }
    $('#toggle-panel').click(function() {
        $('body').toggleClass('no-panel');
        viewerResize();
    })    


    // Spare Parts List Toolbar
    $('#filter-list').click(function() {
        let partNumbers = [];
        $('#items-list').children(":visible").each(function() {
            partNumbers.push($(this).attr('data-part-number'));
        });
        viewerSelectModels(partNumbers);
    });
    $('#color-stock').click(function() {
        highlightSparePartStocks();

    });
    $('#spare-parts-search-input').keyup(function() {
        searchInTiles('items', $(this));
    });



    // Cart interactions
    $('#cart-title').click(function() {
        $('#cart').toggleClass('collapsed');
        adjustCartHeight();
    });
    $('#filter-cart').click(function() {
        let partNumbers = [];
        $('#cart-list').children().each(function() {
            partNumbers.push($(this).attr('data-part-number'));
        });
        viewerSelectModels(partNumbers);
    });
    $('#clear-cart').click(function() {
        $('#cart-list').children().each(function() {
            $(this).prependTo($('#items-list'));
        });
        adjustCartHeight();
    });
    $('#submit-request').click(function() {
        $('#request-creation').show();
        $('#overlay').show();
        setRequestList();
    });


    // Submit Request Dialog functions
    $('#request-creation-submit').click(function() {
        submitRequest();
    });
    $('#request-creation-cancel').click(function() {
        $('#request-creation').hide();
        $('#overlay').hide();
        clearRequestList();
    });


    // Single Request Display Actions
    $('#close-item').click(function() {
        $('body').addClass('screen-landing')
            .removeClass('screen-main')
            .removeClass('screen-request'); 
    });

}


// Insert Contact Details per user account data
function insertAvatarDone(data) {

    $('#request-name').val((isBlank(data.displayName)) ? '' : data.displayName);
    $('#request-company').val((isBlank(data.organization)) ? '' : data.organization);
    $('#request-e-mail').val((isBlank(data.email)) ? '' : data.email);
    $('#request-address').val((isBlank(data.address1)) ? '' : data.address1);
    $('#request-city').val((isBlank(data.city)) ? '' : data.city);
    $('#request-postal').val((isBlank(data.postal)) ? '' : data.postal);
    $('#request-country').val((isBlank(data.country)) ? '' : data.country);

}


// Click on Product in landing page
function clickWorkspaceItem(e, elemClicked) {

    let link = elemClicked.attr('data-engineering_bom');

    if(isBlank(link)) {
        showErrorMessage('Invalid Product Data', 'BOM of the selected product is not availalbe, please contact your administrator');
        return;
    }

    $('body').addClass('screen-main').removeClass('screen-landing').removeClass('screen-request');

    let split = link.split('/');

    window.history.replaceState(null, null, '/service?wsid=' + split[4] + '&dmsid=' + split[6] + '&theme=' + theme);

    openItem(link);

}
function openItem(link) {

    $('#header-subtitle').html('');
    $('#items-list').html('');
    $('#items-processing').show();

    $.get('/plm/descriptor', { 'link' : link}, function(response) {
        $('#header-subtitle').html(response.data);
        document.title = documentTitle + ': ' + response.data;
    });

    if(isBlank(sections)) getInitialData(link.split('/')[4]);
    insertBOM(link, { 
        'bomViewName'   : config.service.bomViewName, 
        'collapsed'     : true,
        'deselect'      : true, 
        'reset'         : true, 
        'openInPLM'     : false, 
        'goThere'       : true, 
        'hideDetails'   : true, 
        'quantity'      : true,
        'counters'      : true,
        'getFlatBOM'    : true, 
        'showRestricted': false,
        'revisionBias'  : 'working',
        'endItem'       : config.service.endItemFilter,
        'selectItems'   : { 'fieldId' : config.service.fieldId, 'values' : config.service.fieldValues }
    });
    insertViewer(link);
    if(features.toggleItemDetails)     insertItemDetails(link);
    if(features.toggleItemAttachments) insertAttachments(link, paramsAttachments);
    if(features.manageProblemReports)  insertChangeProcesses(link, paramsProcesses);

}


// Click on existing Spare Parts Request
function clickWorkspaceViewItem(elemClicked) {

    resetItemScreen();
    openSelectedRequest(elemClicked.attr('data-link'));

}
function resetItemScreen() {
    $('.item-descriptor').html('');
    $('.item-status').html('');
    $('.item-summary').find('span').html('');
}
function openSelectedRequest(link) {

    $('body').addClass('screen-request')
        .removeClass('screen-landing')
        .removeClass('screen-main');

    $.get('/plm/details', { 'link' : link }, function(response) {

        $('.item-descriptor').html(response.data.title);
        $('.item-status').html(response.data.currentState.title);

    });

    $.get('/plm/change-summary', { 'link' : link }, function(response) {

        let dateCreated  = new Date(response.data.createdOn);
        let dateModified = '';
        let userModified = '';

        if(!isBlank(response.data.lastModifiedOn)) dateModified = new Date(response.data.lastModifiedOn).toLocaleDateString();
        if(!isBlank(response.data.lastModifiedBy)) userModified = response.data.lastModifiedBy.displayName;

        $('.item-created-by').html(response.data.createdBy.displayName);
        $('.item-created-on').html(dateCreated.toLocaleDateString());
        $('.item-modified-by').html(userModified);
        $('.item-modified-on').html(dateModified);

    });

    getBookmarkStatus(link);
    if(features.requestWorkflowActions) insertWorkflowActions(link);

    insertWorkflowHistory(link, {
        'id'     : 'request-workflow-history',
        'reload' : false
    });
    insertDetails(link, {
        'id'             : 'request-details',
        'compactDisplay' : true,
        'suppressLinks'  : true
    });
    insertGrid(link, {
        'id'            : 'request-grid',
        'headerLabel'   : 'Part List',
        'columnsEx'     : ['UNIT_COST', 'TOTAL_COST'],
        'reload'        : false
    });
    insertAttachments(link, {
        'id'        : 'request-attachments',
        'layout'    : 'tiles',
        'size'      : 'm',
        'upload'    : true
    });


}
function insertAttachmentsDone(id) {

    if(id === 'request-attachments') {
        $('#request-attachments-upload').prependTo($('#item-toolbar'));
    }

}


// Retrieve Workspace Details
function getInitialData(wsId) {

    let promises = [
        $.get('/plm/sections'   , { 'wsId' : wsId }),
        $.get('/plm/fields'     , { 'wsId' : wsId }),
        $.get('/plm/sections'   , { 'wsId' : wsProblemReports.id }),
        $.get('/plm/fields'     , { 'wsId' : wsProblemReports.id }),
        $.get('/plm/sections'   , { 'wsId' : wsSparePartsRequests.id })
    ];

    Promise.all(promises).then(function(responses) {

        let errors = false;

        for(let response of responses) {
            if(response.error) {
                let message = (isBlank(response.data.message)) ? 'Error in accessing ' + response.params.url : response.data.message;
                showErrorMessage('Error occured', message);
                errors = true;
            }
        }

        if(!errors) {
            sections                        = responses[0].data;
            fields                          = responses[1].data;
            wsProblemReports.sections       = responses[2].data;
            wsProblemReports.fields         = responses[3].data;
            wsSparePartsRequests.sections   = responses[4].data;

        }

    });

}     


// Parse BOM for Spare Parts
function changeBOMViewDone(id, fields, bom, selectedItems, flatBOM) {

    $('#bom-processing').hide();

    if(selectedItems.length > 15) $('#items-list').removeClass('l').addClass('m');

    let urnsSpareParts = [];

    for(let field of fields) {

        let urnField = field.__self__.urn;

        switch(field.fieldId) {
            case 'NUMBER'                           : urnsSpareParts.partNumber   = urnField; break;
            case 'TITLE'                            : urnsSpareParts.title        = urnField; break;
            case 'DESCRIPTION'                      : urnsSpareParts.description  = urnField; break;
            case config.service.fieldIdImage        : urnsSpareParts.image        = urnField; break;
            case config.viewer.fieldIdPartNumber    : urnsSpareParts.partNumber   = urnField; break;
            case config.service.fieldId             : urnsSpareParts.spareWearPart= urnField; break;
            case config.service.spartPartDetails[0] : urnsSpareParts.material     = urnField; break;
            case config.service.spartPartDetails[1] : urnsSpareParts.weight       = urnField; break;
            case config.service.spartPartDetails[2] : urnsSpareParts.dimensions   = urnField; break;
        }

    }
    
    insertNonSparePartMessage();
    insertBOMSpareParts($('#items-list'), selectedItems, urnsSpareParts, flatBOM);

    $('.bom-item').each(function() {
        let elemCell = $('<td></td>').addClass('bom-column-icon').addClass('bom-column-spare-parts').appendTo(this);
        for(let selectedItem of selectedItems) {
            if($(this).attr('data-link') === selectedItem.node.item.link) {
                $(this).addClass('is-spare-part');
                $('<span></span>').appendTo(elemCell)
                    .addClass('icon')
                    .addClass('icon-package')
                    .addClass('filled')
                    .attr('title', 'Is Spare Part');
            }
        }
    });

    setSparePartStockStatus();

    $('#items-processing').hide();

}

function insertNonSparePartMessage() {

    if(isBlank(config.service.enableCustomRequests)) return;
    if(!config.service.enableCustomRequests) return;

    let elemMessage = $('<div></div>')
        .addClass('surface-level-3')
        .addClass('custom-message')
        .attr('id', 'custom-message')
        .appendTo($('#items-list'));
    
    $('<div></div>').appendTo(elemMessage)
        .addClass('custom-message-text')
        .html("The selected item is not available as spare part. While availability is not guaranteed, you may submit a request for this item anyway. We will validate the given item's availability per each request.<br>Do you want to include this item in your request?");
    
    $('<div></div>').appendTo(elemMessage)
        .addClass('custom-message-button')
        .addClass('button')
        .addClass('default')
        .html('Confirm')
        .click(function(){

            $('#custom-message').hide();
            let link = $('#custom-message').attr('data-link');
            let itemData = {};

            $('.bom-item').each(function() {
                if($(this).attr('data-link') === link) {
                    itemData.urn = $(this).attr('data-urn');
                    itemData.partNumber = $(this).attr('data-part-number');
                    itemData.title = $(this).attr('data-title');
                    $(this).addClass('is-spare-part').addClass('spare-part-custom');
                    let elemCell = $(this).find('.bom-column-icon');
                    $('<span></span>').appendTo(elemCell)
                        .addClass('icon')
                        .addClass('icon-package')
                        .addClass('filled')
                        .attr('Custom spare part request');

                }
            });

            let elemSparePart = genTileSparePart(link, itemData.urn, itemData.partNumber, itemData.title, 1.0);
                elemSparePart.insertAfter($('#custom-message'));
                elemSparePart.addClass('spare-part-custom');

            if(features.showStock) {

                let elemStock     = elemSparePart.find('.spare-part-stock');
                let stockLabel    = 'No spare part';
                let stockClass    = 'custom';
        
                elemSparePart.addClass('spare-part-stock-' + stockClass);
                elemStock.attr('title', stockLabel);
        
                $('<div></div>').appendTo(elemStock)
                    .addClass('spare-part-stock-icon');
        
                $('<div></div>').appendTo(elemStock)
                    .addClass('spare-part-stock-label')
                    .html(stockLabel);

            }

        });

}
function insertWearParts() {

    let index = 1;

    for(wearPart of listWearParts) {

        let elemWearPart = $('<div></div>');
            elemWearPart.addClass('wear-part');
            elemWearPart.attr('data-link', wearPart.link);
            elemWearPart.attr('data-part-number', wearPart.partNumber);
            elemWearPart.appendTo($('#wear-parts'));
            elemWearPart.click(function() {
                let link = $(this).attr('data-link');
                $('#bom-table').children().each(function() {
                    if($(this).attr('data-link') === link) { 
                        $(this).click();
                        $(this).get(0).scrollIntoView();
                    }
                });
            });

        let elemWearPartImage = $('<div></div>');
            elemWearPartImage.addClass('wear-part-image');
            elemWearPartImage.appendTo(elemWearPart);              
            
        if(wearPart.linkImage === '') {
            $.get('/plm/details', { 'link' : wearPart.link }, function(response) {
                let linkImage  = getFirstImageFieldValue(response.data.sections);
                $('.wear-part').each(function() {
                    if($(this).attr('data-link') === response.params.link) {
                        let elemWearPartImage = $(this).find('.wear-part-image').first();
                        getImageFromCache(elemWearPartImage, { 'link' : linkImage }, 'settings', function() {});
                    }
                });
            });
        } else {
            getImageFromCache(elemWearPartImage, { 'link' : wearPart.linkImage }, 'view_in_ar', function() {});
        }

        let elemWearPartDescriptor = $('<div></div>');
            elemWearPartDescriptor.addClass('wear-part-descriptor');
            elemWearPartDescriptor.html(wearPart.partNumber);
            elemWearPartDescriptor.appendTo(elemWearPart);

        let elemWearPartHealth = $('<div></div>');
            elemWearPartHealth.attr('id', 'wp' + index++);
            elemWearPartHealth.addClass('wear-part-health');
            elemWearPartHealth.appendTo(elemWearPart);

    }

}
function insertBOMSpareParts(elemParent, selectedItems, urnsSpareParts, flatBOM) {

    for(let selectedItem of selectedItems) {

        let elemSparePart = $('<div></div>').appendTo(elemParent)
            .addClass('tile')
            .addClass('spare-part')
            .attr('data-link', selectedItem.node.item.link)
            .attr('data-part-number', selectedItem.node.partNumber)
            .attr('data-qty', selectedItem.node.totalQuantity)
            .click(function(e) {
                clickSparePart($(this));
            });
                        
        let elemSparePartImage = $('<div></div>').appendTo(elemSparePart)
            .addClass('spare-part-image')
            .addClass('tile-image');
                
        let valueImage = getFlatBOMCellValue(flatBOM, selectedItem.node.item.link, urnsSpareParts.image);
        let linkImage = (valueImage === '') ? '' : valueImage;

        getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', function() {});
    
        if(linkImage === '') {
            $.get('/plm/details', { 'link' : link}, function(response) {
                linkImage  = getFirstImageFieldValue(response.data.sections);
                $('.spare-part').each(function() {
                    if($(this).attr('data-link') === response.params.link) {
                        let elemSparePartImage = $(this).find('.spare-part-image').first();
                        getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', function() {});
                    }
                });
            });
        }
                    
        let elemSparePartDetails = $('<div></div>').appendTo(elemSparePart)
            .addClass('spare-part-details')
            .addClass('tile-details');
    
        let elemSparePartID = $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-identifier');
    
        $('<div></div>').appendTo(elemSparePartID)
            .addClass('spare-part-quantity')
            .html(Number(selectedItem.node.totalQuantity));
    
        $('<div></div>').appendTo(elemSparePartID)
            .addClass('spare-part-number')
            .addClass('tile-title')
            .html(selectedItem.node.partNumber);    
        
        $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-title')
            .html(selectedItem.node.title);  
    
        $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-material')
            .addClass('with-icon')
            .addClass('icon-product')
            .addClass('filled')
            .html(getBOMNodeValue(selectedItem.node, urnsSpareParts.material));
            
        let partSpec        = '';
        let partWeight      = getBOMNodeValue(selectedItem.node, urnsSpareParts.weight);
        let partDimensions  = getBOMNodeValue(selectedItem.node, urnsSpareParts.dimensions);
                
        if(partWeight !== '') {
            partSpec = partWeight;
            if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
        } else partSpec = partDimensions
    
        $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-dimensions')
            .addClass('with-icon')
            .addClass('icon-width')
            .html(partSpec);
    
        let elemSparePartSide = $('<div></div>').appendTo(elemSparePart)
            .addClass('spare-part-side');
    
        let elemCartQuantity = $('<div></div>').appendTo(elemSparePartSide)
            .addClass('cart-quantity')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
    
        $('<div></div>').appendTo(elemCartQuantity)
            .addClass('cart-quantity-label')
            .html('Qty');
    
        $('<input></input>').appendTo(elemCartQuantity)
            .addClass('cart-quantity-input')
            .val('1');
    
        let elemCartAdd = $('<div></div>').appendTo(elemSparePartSide)
            .addClass('button')
            .addClass('cart-add')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                moveSparePart($(this));
            });  
                
        $('<div></div>').appendTo(elemCartAdd)
            .addClass('icon')
            .addClass('icon-cart-add');
    
        $('<div></div>').appendTo(elemCartAdd)
            .html('Add to cart');
    
        $('<div></div>').appendTo(elemSparePartSide)
            .addClass('button')
            .addClass('icon')
            .addClass('icon-cart-remove')
            .addClass('cart-remove')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                moveSparePart($(this));
            });  
    
            if(features.showStock) {
                $('<div></div>').appendTo(elemSparePartSide).addClass('spare-part-stock');
            }

    }

}
function setSparePartStockStatus() {

    if(!features.showStock) return;

    $('#items-list').children().each(function() {

        let elemSparePart = $(this);
        let elemStock     = elemSparePart.find('.spare-part-stock');
        let stockLabel    = 'In stock';
        let stockClass    = 'normal';
        let stockRandom   = Math.floor(Math.random() * 3) + 1;
    
             if(stockRandom === 2) { stockLabel = 'Low stock';    stockClass = 'low';  }
        else if(stockRandom === 3) { stockLabel = 'Out of stock'; stockClass = 'none'; }

        elemSparePart.addClass('spare-part-stock-' + stockClass);
        elemStock.attr('title', stockLabel);

        $('<div></div>').appendTo(elemStock)
            .addClass('spare-part-stock-icon');

        $('<div></div>').appendTo(elemStock)
            .addClass('spare-part-stock-label')
            .html(stockLabel);

    })

}


// BOM User Interactions
function clickBOMItem(e, elemClicked) {

    if(elemClicked.hasClass('selected')) {
        elemClicked.removeClass('selected');
        if(features.toggleItemDetails)     insertItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        if(features.toggleItemAttachments) insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsAttachments);
        if(features.manageProblemReports)  insertChangeProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsProcesses);
        resetSparePartsList();
        // updateViewer();
        viewerResetSelection({
            fitToView : true
        });
    } else {
        $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected');
        if(features.toggleItemDetails)     insertItemDetails(elemClicked.attr('data-link'));
        if(features.toggleItemAttachments) insertAttachments(elemClicked.attr('data-link'), paramsAttachments);
        if(features.manageProblemReports)  insertChangeProcesses(elemClicked.attr('data-link'), paramsProcesses);
        setSparePartsList(elemClicked);

        viewerSelectModel(elemClicked.attr('data-part-number'), {
            highlight : false
        });

        // updateViewer(elemClicked.attr('data-part-number'));
    }

    updateBOMCounters(elemClicked.closest('.bom').attr('id'));

    // if(maintenanceMode) {
    //     viewerSetColors(listRed     , new THREE.Vector4(1,   0, 0, 0.5));
    //     viewerSetColors(listYellow  , new THREE.Vector4(1, 0.5, 0, 0.5));
    //     viewerSetColors(listGreen   , new THREE.Vector4(0,   1, 0, 0.5));
    // } else {
    //     viewerResetColors();
    // }

}
function clickBOMDeselectAllDone() {
    
    let link = $('#bom').attr('data-link');

    if(features.toggleItemDetails) insertItemDetails(link);
    if(features.toggleItemAttachments) insertAttachments(link, paramsAttachments);
    resetSparePartsList();
    updateViewer();

}


// Cart Management
function moveSparePart(elemClicked) {

    let elemSparePart = elemClicked.closest('.spare-part');
    let idList        = elemSparePart.parent().attr('id');

    if(idList === 'items-list') {

        elemSparePart.appendTo($('#cart-list'));
        adjustCartHeight();
        elemSparePart.find('.cart-quantity-input').select();

    } else {

        let elemCustomMessage = $('#custom-message');
        if(elemCustomMessage.length === 0) elemSparePart.prependTo($('#items-list'));
        else elemSparePart.insertAfter(elemCustomMessage);
        adjustCartHeight();

    }
    
}
function adjustCartHeight() {

    let elemCart            = $('#cart');
    let countPartsInCart    = $('#cart-list').children().length;
    let topTabs             = 0;
    let heightCart          = 38;
    let heightCartList      = 0;
    let maxHeight           = ($('#main').height() - 50) * 0.5;
    let heightTiles         = 68;
    let isVisible           = elemCart.is(':visible');

    if(countPartsInCart === 0) {

        if(isVisible) elemCart.hide();

    } else if(elemCart.hasClass('collapsed')) {

        if(!isVisible) setTimeout(function() { elemCart.fadeIn(); }, 300);

        topTabs = 110;

    } else {

        if(!isVisible) setTimeout(function() { elemCart.fadeIn(); }, 300);
        heightCart = 68 + (countPartsInCart * heightTiles);

        if(heightCart > maxHeight) {
            heightCart      = maxHeight;
            heightCartList  = heightCart - 70;
        } else {
            heightCartList  = countPartsInCart * heightTiles;
        }

        topTabs = heightCart + 70;

    }

    elemCart.css('height', heightCart + 'px');
    $('#cart-list').css('height', heightCartList + 'px');
    $('#tabs').css('top', topTabs + 'px');
    $('.tab-group-main').css('top', (56 + topTabs) + 'px');

    updateCartCounter();

}
function updateCartCounter() {

    let count = $('#cart-list').children().length; 

    $('#cart-counter').html(count);

    if(count === 0) {
        $('#cart-counter').hide();
    } else {
        $('#cart-counter').show();
    }

}


// Manage Spare Parts List Panel
function setSparePartsList(elemItem) {

    $('#items-processing').show();
    
    let list        = [];
    let count       = 0;
    let level       = 0;
    let elemNext    = $('tr').closest().first();
    let isSparePart = elemItem.hasClass('is-spare-part');
    let isNode      = elemItem.hasClass('node');

    if(typeof elemItem !== 'undefined') {
        elemNext  = elemItem;
        level     = Number(elemItem.attr('data-level'));
    }

    let levelNext = level - 1;
    
    $('#items-list').children().each(function() {
        $(this).hide();
    });

    do {

        let isSparePart = elemNext.hasClass('is-spare-part');

        if(isSparePart) {

            count++;
            let link = elemNext.attr('data-link');

            if(list.indexOf(link) === -1) {

                list.push(link);

                $('#items-list').children().each(function() {
                    if($(this).attr('data-link') === link) $(this).show();
                });

            }
        }

        elemNext  = elemNext.next();
        levelNext = Number(elemNext.attr('data-level'));

    } while(levelNext > level);

    let elemCustomMessage = $('#custom-message');
    
    if(elemCustomMessage.length > 0) {   
        if(isSparePart) {
            elemCustomMessage.hide();
        } else if(!isNode) {
            elemCustomMessage.attr('data-link', elemItem.attr('data-link')).show();
        } 
    }

    $('#items-processing').hide();

}
function resetSparePartsList() {

    $('#custom-message').hide();
    $('.spare-part').each(function() {
        $(this).show();
    });
}


// Apply stock information using colors
function highlightSparePartStocks() {

    highlightSparePartStock('spare-part-stock-normal', config.vectors.green,  true );
    highlightSparePartStock('spare-part-stock-low'   , config.vectors.yellow, false);
    highlightSparePartStock('spare-part-stock-none'  , config.vectors.red,    false);
    highlightSparePartStock('spare-part-stock-custom', config.vectors.blue,   false);

}
function highlightSparePartStock(className, vector, reset) {

    let partNumbers = [];

    $('#items-list').children(":visible").each(function() {
        let elemSparePart = $(this);
        if(elemSparePart.hasClass(className)) {
            partNumbers.push(elemSparePart.attr('data-part-number'));
        }
    });

    viewerSetColors(partNumbers, { 
        'color'         : vector ,
        'resetColors'   : reset,
        'isolate'       : reset,
        'unhide'        : true
    });

}

// Spare Part interactions
function clickSparePart(elemClicked) {

    let link = elemClicked.attr('data-link');

    if(features.toggleItemDetails) insertItemDetails(link);
    if(features.toggleItemAttachments) insertAttachments(link, paramsAttachments);
    viewerSelectModel(elemClicked.attr('data-part-number'), { 'highlight' : false , 'isolate' : true } );

}


// Viewer init and interactions
function initViewerDone() {

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

}
function viewerClickReset() {
    viewer.showAll();
    viewer.setViewFromFile();
    viewerResetSelection();
    // clickBOMDeselectAll($('#bom-action-reset'));
    // clickBOMResetDone();
}
function onViewerSelectionChanged(event) {

    if(disableViewerSelectionEvent) return;

    if (event.dbIdArray.length === 1) {

        let proceed = true;
        let parents = getComponentParents(event.dbIdArray[0]);

        for(let parent of parents) {
            if(proceed) {
                let partNumber = parent.partNumber;

                if(!isBlank(partNumber)) {
                    $('.bom-item').each(function() {
                        if(proceed) {
                            if($(this).attr('data-part-number') === partNumber) {
                                proceed = false;
                                $(this).removeClass('selected');
                                $(this).click();
                                bomDisplayItem($(this));
                            }
                        }
                    });
                }
            }
        }

    } else {

        resetSparePartsList();
        
    }

}
function getFirstBOMParent() {

    console.log('getFirstBOMParent START');


    

    let paths = viewerGetSelectedComponentPaths();
    let result = null;

    console.log(paths);

    for(let path of paths) {

        if(isBlank(result)) {

        console.log(path);

        let parents = path.split('|');

        for(let parent of parents) {

            if(isBlank(result)) {

            console.log(parent);
            
            let partNumber = parent.split(';')[0];


            console.log(partNumber);

            $('.bom-item').each(function() {
                if($(this).attr('data-part-number') === partNumber) {
                    console.log('found it');

                    result = $(this);
                }
            });

        }


        }
    }

    }

    return result;

}
function updateViewer(partNumber) {

    if(typeof partNumber === 'undefined') partNumber = '';

    disableViewerSelectionEvent = true;

    let selectedBOMNode = $('.bom-item.selected').first();

    if(partNumber !== '') {
        viewerSelectModel(partNumber, { 'highlight' : false , 'isolate' : true } );
    } else if(selectedBOMNode.length === 1) {
        partNumber = selectedBOMNode.attr('data-part-number');
        viewerSelectModel(partNumber, { 'highlight' : false ,'isolate' : true } );
    } else {
        viewerResetSelection(true, false);
    }

    disableViewerSelectionEvent = false;

}



// Update request creation dialog upon opening and cosing
function setRequestList() {

    $('#cart').addClass('collapsed');
    
    $('#cart-list').children().each(function() {
        $(this).appendTo($('#request-list'));
    });

    adjustCartHeight();
}
function clearRequestList() {
    
    $('#cart').removeClass('collapsed');

    $('#request-list').children().each(function() {
        $(this).appendTo($('#cart-list'));
    });

    adjustCartHeight();
}


// Create Spare Parts Request in PLM
function submitRequest() {

    if($('#request-creation-submit').hasClass('disabled')) return;

    $('#request-creation').hide();
    $('#overlay').show();
    $('#overlay-processing').show();

    let params = {
        'wsId'     : wsSparePartsRequests.id,
        'sections' : [{
            'id'        : wsSparePartsRequests.sections[0].urn.split('.')[5],
            'fields'    : [{
                'fieldId'   : 'LINKED_ITEM',
                'value'     : { 'link' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId },
                'type'      : 'picklist'
            }]   
        }]
    } 

    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_NAME', $('#request-name').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_COMPANY', $('#request-company').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_EMAIL', $('#request-e-mail').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_ADDRESS', $('#request-address').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_POSTAL_CODE', $('#request-postal').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_CITY', $('#request-city').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_COUNTRY_CODE', $('#request-country').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUEST_SHIPPING_ADDRESS', $('#request-shipping-address').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'COMMENTS', $('#reqeust-comments').val());

    $.post({
        url         : '/plm/create', 
        contentType : 'application/json',
        data        : JSON.stringify(params)
    }, function(response) {

        if(!response.error) {

            $('#request-list').children().each(function() {

                let link         = $(this).attr('data-link');
                let quantity     = $(this).find('.cart-quantity-input').val();
                let availability = $(this).find('.spare-part-stock-label').html();

                let params = {
                    'wsId' : wsSparePartsRequests.id,
                    'link' : response.data.split('.autodeskplm360.net')[1],
                    'data' : [
                        { 'fieldId' : 'ITEM', 'value' : { 'link' : link } },
                        { 'fieldId' : 'QUANTITY', 'value' : quantity },
                        { 'fieldId' : 'AVAILABILITY_AT_REQUEST', 'value' : availability }
                    ]
                }
                
                $.get('/plm/add-grid-row', params, function(response) {});

            });

            $('#request-list').children().each(function() { $(this).prependTo($('#items-list')); });

            showSuccessMessage('Request has been created successfuly.');

        }

        $('#overlay').hide();
        $('.spare-part.selected').each(function() { $(this).click(); });

    });

}