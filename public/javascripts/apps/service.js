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

let bom, flatBOM;
let selectedBOMContext      = '';
let wsProblemReports        = { 'id' : '', 'sections' : [], 'fields' : [] };
let wsSparePartsRequests    = { 'id' : '', 'sections' : [], 'fields' : [] };
let paramsAttachments = { 
    'extensionsEx'  : '.dwf,.dwfx',
    'header'        : true, 
    'size'          : 'xs'
}

let features = {
    'homeButton'            : true,
    'toggleItemAttachments' : true,
    'toggleItemDetails'     : true,
    'manageProblemReports'  : true,
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
        'reset'         : true,
        'ghosting'      : true,
        'views'         : true
    }
}


$(document).ready(function() {
    
    wsProblemReports.id      = config.service.wsIdProblemReports;
    wsSparePartsRequests.id  = config.service.wsIdSparePartsRequests;

    appendOverlay();

    getApplicationFeatures('service', function() {

        console.log(features.homeButton);

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

    // Toggles in header toolbar
    $('#toggle-bom').click(function() {
        $('body').toggleClass('no-bom');
        setTimeout(function() { viewer.resize(); }, 250);
    })
    $('#toggle-panel').click(function() {
        $('body').toggleClass('no-panel');
        setTimeout(function() { viewer.resize(); }, 250);
    })
    $('#toggle-details').click(function() {
        $('body').toggleClass('with-details');
        setTimeout(function() { viewer.resize(); }, 250);
    })
    $('#toggle-attachments').click(function() {
        $('body').toggleClass('no-attachments');
        viewer.resize();setTimeout(function() { viewer.resize(); }, 250);
    })


    // Close current product display
    $('#home').click(function() {
        $('body').addClass('screen-landing').removeClass('screen-main').removeClass('screen-request');
        document.title = documentTitle;
        window.history.replaceState(null, null, '/service?theme=' + theme);
    });


    // Spare Parts List Toolbar
    $('#filter-spare-parts').click(function() {
        let partNumbers = [];
        $('.spare-part').hide();
        $('.spare-part.selected').each(function() {
            $(this).show();
            partNumbers.push($(this).attr('data-part-number'));
        });
        viewerSelectModels(partNumbers);
    });
    $('#deselect-spare-parts').click(function() {
        $('.spare-part.selected').removeClass('selected');
        $('.spare-part').show();
        $('#spare-parts-search-input').val('');
        viewerResetColors();
        updateCounter();
    });
    $('#spare-parts-search-input').keyup(function() {
        searchInTiles('items-list', $(this));
    });


    // Submit Request Dialog functions
    $('#request-creation-submit').click(function() {
        submitRequest();
    });
    $('#request-creation-cancel').click(function() {
        $('#request-creation').hide();
        $('#overlay').hide();
    });
    $('#submit-request').click(function() {
        $('#request-creation').show();
        $('#overlay').show();
        setRequestList();
    });

    // Single Request Display Actions
    $('#close-item').click(function() {
        $('body').addClass('screen-landing')
            .removeClass('screen-main')
            .removeClass('screen-request');
        
    });


    // Process Creation
    $('#create-process').click(function() {
        
        $('#processes-sections').html('').show();

        $(this).siblings().show();
        $(this).hide();

        $('#processes-list').hide();

        insertItemDetailsFields('', 'processes', wsProblemReports.sections, wsProblemReports.fields, null, true, true, true);

    });
    $('#cancel-process').click(function() {

        $('#create-process').show();
        $('.process-dialog').hide();
        $('#processes-list').show();
        $('#processes-sections').hide();

    });
    $('#save-process').click(function() {

        if(!validateForm($('#processes-sections'))) return;

        viewerCaptureScreenshot(null, function() {

            $('#processes-toolbar').hide();
            $('#processes-sections').hide();
            $('#processes-list').html('');
            $('#processes-list').show('');
            $('#processes-processing').show();
    
            let link = $('#processes-list').attr('data-source');
    
            submitCreateForm(wsProblemReports.id, $('#processes-sections'), 'viewer-markup-image', function(response ) {

                let newLink = response.data.split('.autodeskplm360.net')[1];
                $.get('/plm/add-managed-items', { 'link' : newLink, 'items' : [ link ] }, function(response) {
                // $.get('/plm/add-relationship', { 'link' : newLink, 'relatedId' : link.split('/')[6] }, function(response) {
                    setProcesses($('#processes-list').attr('data-source'));
                    $('.process-dialog').hide();
                    $('#create-process').show();
                    $('#processes-list').show();
                });

            });

        });

    });


    // BOM Tree Actions
    // $('#bom-search-input').keyup(function() {
    //     filterBOMTree();
    // });


    // Tab Control
    // $('#tabs').children().click(function() {
    //     let id = $(this).attr('data-id');
    //     $('.tab').hide();
    //     $('#' + id).show();
    //     $(this).addClass('selected');
    //     $(this).siblings().removeClass('selected');
    //     maintenanceMode = $('#tab-charts').hasClass('selected');
    //     if(!maintenanceMode) {
    //         if($('#bom-table').children('.selected').length === 0) {
    //             if(viewerDone) {
    //                 viewerResetColors();
    //                 viewer.showAll();
    //             }
    //         }
    //     } else {
    //         if(viewerDone) {
    //             viewer.hideAll();
    //             viewerUnhideModels(listWearParts);
    //         }
    //     }
    // });
    // $('#tabs').children().first().click();

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
        'reset'         : true, 
        'openInPLM'     : false, 
        'goThere'       : true, 
        'hideDetails'   : true, 
        'quantity'      : true,
        'counters'      : true,
        'getFlatBOM'    : true, 
        'showRestricted': false,
        'endItem'       : { 'fieldId' : 'SBOM_END_ITEM', 'value' : true }
    });
    insertViewer(link);
    insertItemDetails(link);
    insertAttachments(link, paramsAttachments);
    setProcesses(link);

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
    // $('#request').show();
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
    insertWorkflowActions(link);

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

        for(response of responses) {
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
function changeBOMViewDone(id, fields, viewBOM, viewFlatBOM) {

    let link = $('#' + id).attr('data-link');
    bom      = viewBOM;
    flatBOM  = viewFlatBOM;

    for(field of fields) {
    
             if(field.fieldId === 'NUMBER')                             urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === config.viewer.fieldIdPartNumber)      urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'THUMBNAIL')                          urns.thumbnail      = field.__self__.urn;
        else if(field.fieldId === 'TITLE')                              urns.title          = field.__self__.urn;
        else if(field.fieldId === 'DESCRIPTION')                        urns.description    = field.__self__.urn;
        else if(field.fieldId === 'QUANTITY')                           urns.quantity       = field.__self__.urn;
        else if(field.fieldId === config.service.fieldId)               urns.spareWearPart  = field.__self__.urn; 
        else if(field.fieldId === config.service.spartPartDetails[0])   urns.material       = field.__self__.urn;
        else if(field.fieldId === config.service.spartPartDetails[1])   urns.weight         = field.__self__.urn;
        else if(field.fieldId === config.service.spartPartDetails[2])   urns.dimensions     = field.__self__.urn;

    }

    insertNonSparePartMessage();
    getBOMSpareParts(bom, flatBOM, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + link.split('/')[4] + '.' + link.split('/')[6], 1.0);

    $('.bom-item').each(function() {
        let elemCell = $('<td></td>').addClass('bom-column-icon').addClass('bom-column-spare-parts').appendTo(this);
        for(sparePart of listSpareParts) {
            if($(this).attr('data-link') === sparePart) {
                $(this).addClass('is-spare-part');
                $('<span></span>').appendTo(elemCell)
                    .addClass('icon')
                    .addClass('icon-package')
                    .addClass('filled')
                    .attr('title', 'Is Spare Part');
            }
        }
    });

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
        .html("This item is not available as standard spare part. While availability is not guaranteed, you may submit a request for this item anyway. We will validate the given item's availability per each request.<br>Do you want to include this item in your request?");
    
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
                }
            });

            let elemSparePart = genTileSparePart(link, itemData.urn, itemData.partNumber, itemData.title, 1.0, 'No Spare Part', 'custom');
                elemSparePart.insertAfter($('#custom-message'));
                elemSparePart.addClass('selected');

            updateCounter();

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
function getBOMSpareParts(bom, flatBOM, parent, qtyTotal) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let isSparePart = getBOMCellValue(edge.child, urns.spareWearPart, bom.nodes);
            let partNumber  = getBOMCellValue(edge.child, urns.partNumber, bom.nodes);
            let link        = getBOMNodeLink(edge.child, bom.nodes);
            let quantity    = getBOMEdgeValue(edge, urns.quantity, null, 0);
            let quantityRow = qtyTotal * quantity;

            if(config.service.fieldValues.indexOf(isSparePart.toLowerCase()) > -1) {

                let qty = quantityRow;

                if(isSparePart.toLowerCase() === 'wear part') {
                    listWearParts.push({
                        'link'          : link,
                        'partNumber'    : partNumber,
                        'linkImage'     : getFirstImageFieldValue(response.data.sections)
                    });
                }

                if(listSpareParts.length > 15) $('#items-list').removeClass('l').addClass('m');

                // if(listSpareParts.indexOf(edge.child) === -1) {
                if(listSpareParts.indexOf(link) === -1) {

                    listSpareParts.push(link);

                    let stockLabel  = 'In stock';
                    let stockClass  = 'normal';
                    let stockRandom = Math.floor(Math.random() * 3) + 1;
                
                         if(stockRandom === 2) { stockLabel = 'Low stock'; stockClass = 'low'; }
                    else if(stockRandom === 3) { stockLabel = 'Out of stock'; stockClass = 'none'; }

                    let title = getBOMCellValue(edge.child, urns.title, bom.nodes);
                    let elemSparePart = genTileSparePart(link, edge.child, partNumber, title, qty, stockLabel, stockClass);

                        elemSparePart.appendTo($('#items-list'));

                } else {

                    $('.spare-part').each(function() {
                        
                        let elemSparePart = $(this);
                        
                        if(elemSparePart.attr('data-link') === link) {
                            let elemSparePartQuantity = elemSparePart.find('.spare-part-quantity').first();
                            let quantitySparePart = parseFloat(elemSparePart.attr('data-qty')) + quantityRow;
                            elemSparePartQuantity.html(quantitySparePart);
                            elemSparePart.attr('data-qty', quantitySparePart);
                        }

                    });

                }
            }

            getBOMSpareParts(bom, flatBOM, edge.child, quantityRow);
        }
    }

    return result;

}
function genTileSparePart(link, urn, partNumber, title, qty, stockLabel, stockClass) {

    let elemSparePart = $('<div></div>');
        elemSparePart.addClass('tile');
        elemSparePart.addClass('spare-part');
        elemSparePart.addClass('spare-part-stock-' + stockClass);
        elemSparePart.attr('data-link', link);
        elemSparePart.attr('data-part-number', partNumber);
        elemSparePart.attr('data-qty', qty);
        elemSparePart.click(function(e) {
            clickSparePart(e, $(this));
        });
        
        
    let elemSparePartImage = $('<div></div>');
        elemSparePartImage.addClass('spare-part-image');
        elemSparePartImage.addClass('tile-image');
        elemSparePartImage.appendTo(elemSparePart);

    let valueImage = getFlatBOMCellValue(flatBOM, link, urns.thumbnail);
    let linkImage = (valueImage === '') ? '' : valueImage;

    getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', function() {});

    if(linkImage === '') {
        $.get('/plm/details', { 'link' : link}, function(response) {
            linkImage  = getFirstImageFieldValue(response.data.sections);
            $('.spare-part').each(function() {
                if($(this).attr('data-link') === link) {
                    let elemSparePartImage = $(this).find('.spare-part-image').first();
                    getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', function() {});
                }
            });
        });
    }
    
    let elemSparePartDetails = $('<div></div>');
        elemSparePartDetails.addClass('spare-part-details');
        elemSparePartDetails.addClass('tile-details');
        elemSparePartDetails.appendTo(elemSparePart);

    let elemSparePartNumber = $('<div></div>');
        elemSparePartNumber.addClass('spare-part-number');
        elemSparePartNumber.addClass('tile-title');
        elemSparePartNumber.html(partNumber);
        elemSparePartNumber.appendTo(elemSparePartDetails);


    let elemSparePartQuantity = $('<span></span>');
        elemSparePartQuantity.addClass('spare-part-quantity');
        elemSparePartQuantity.html(qty);
        elemSparePartQuantity.prependTo(elemSparePartNumber);

    
    let elemSparePartTitle = $('<div></div>');
        elemSparePartTitle.addClass('spare-part-title');
        elemSparePartTitle.html(title);
        elemSparePartTitle.appendTo(elemSparePartDetails);

    let elemSparePartMaterial = $('<div></div>');
        elemSparePartMaterial.addClass('spare-part-material');
        elemSparePartMaterial.html(getBOMCellValue(urn, urns.material, bom.nodes));
        elemSparePartMaterial.appendTo(elemSparePartDetails);

    let partSpec        = '';
    let partWeight      = getBOMCellValue(urn, urns.weight, bom.nodes);
    let partDimensions  = getBOMCellValue(urn, urns.dimensions, bom.nodes);

    if(partWeight !== '') {
        partSpec = partWeight;
        if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
    } else partSpec = partDimensions

    let elemSparePartSpec = $('<div></div>');
        elemSparePartSpec.addClass('spare-part-dimensions');
        elemSparePartSpec.html(partSpec);
        elemSparePartSpec.appendTo(elemSparePartDetails);

    let elemSparePartSide = $('<div></div>');
        elemSparePartSide.addClass('spare-part-side');
        elemSparePartSide.appendTo(elemSparePart);
        
    $('<div></div>').appendTo(elemSparePartSide)
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-zoom-in')
        .addClass('spare-part-show')
        .html('Zoom In')
        .click(function(e) {
            clickSparePartZoomIn(e, $(this));
        });

    let elemSparePartStock = $('<div></div>');
        elemSparePartStock.addClass('spare-part-stock');
        elemSparePartStock.html(stockLabel);
        elemSparePartStock.appendTo(elemSparePartSide);

    return elemSparePart;

}


// BOM User Interactions
function clickBOMItem(e, elemClicked) {

    if(elemClicked.hasClass('selected')) {
        elemClicked.removeClass('selected');
        insertItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsAttachments);
        setProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        resetSparePartsList();
        updateViewer();
    } else {
        $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected');
        insertItemDetails(elemClicked.attr('data-link'));
        insertAttachments(elemClicked.attr('data-link'), paramsAttachments);
        setProcesses(elemClicked.attr('data-link'));
        setSparePartsList(elemClicked);
        updateViewer(elemClicked.attr('data-part-number'));
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
function clickBOMResetDone() {
    
    let link = $('#bom').attr('data-link');
    
    $('.spare-part').removeClass('zoom');

    insertItemDetails(link);
    insertAttachments(link, paramsAttachments);
    resetSparePartsList();
    updateViewer();

}


// Manage Spare Parts List Panel
function setSparePartsList(elemItem) {

    $('#items-processing').show();
    
    let list        = [];
    let count       = 0;
    let level       = 0;
    let elemNext    = $('tr').closest().first();
    let isSparePart = elemItem.hasClass('is-spare-part');

    if(typeof elemItem !== 'undefined') {
        elemNext  = elemItem;
        level     = Number(elemItem.attr('data-level'));
    }

    let levelNext = level - 1;
    
    $('.spare-part').each(function() {
        if(!$(this).hasClass('selected')) $(this).hide();
    });

    do {

        let isSparePart = elemNext.hasClass('is-spare-part');

        if(isSparePart) {

            count++;
            let link = elemNext.attr('data-link');

            if(list.indexOf(link) === -1) {

                list.push(link);

                $('.spare-part').each(function() {
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
        } else {
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


// Spare Part interactions
function clickSparePart(e, elemClicked) {

    elemClicked.toggleClass('selected');

    let partNumber = elemClicked.attr('data-part-number');
    let color      = (elemClicked.hasClass('selected')) ? config.vectors.blue : null;

    viewerSetColor(partNumber, {
        'color'         : color, 
        'resetColors'   : true,
        'fitToView'     : true
    });
    updateCounter();

}
function updateCounter() {

    let count = $('.spare-part.selected').length; 

    $('#counter').html(count);

    if(count === 0) {
        $('#counter').hide();
        $('#filter-spare-parts').hide();
        $('#deselect-spare-parts').hide();
        $('#submit-request').removeClass('default');
    } else {
        $('#counter').show();
        $('#filter-spare-parts').show();
        $('#deselect-spare-parts').show();
        $('#submit-request').addClass('default');
    }

}
function clickSparePartZoomIn(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let elemSparePart = elemClicked.closest('.spare-part');
        elemSparePart.siblings().removeClass('zoom');
        elemSparePart.toggleClass('zoom')

    if(elemSparePart.hasClass('zoom')) updateViewer(elemSparePart.attr('data-part-number'));
    else updateViewer();

}


// Viewer init and interactions
function initViewerDone() {

    // viewerAddGhostingToggle();
    // viewerAddResetButton();
    // viewerAddMarkupControls();   
    // viewerAddViewsToolbar();

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

}
function viewerClickReset() {
    viewer.showAll();
    viewer.setViewFromFile();
    clickBOMDeselectAll($('#bom-action-reset'));
    clickBOMResetDone();
}
function onViewerSelectionChanged(event) {

    if(disableViewerSelectionEvent) return;

    if (event.dbIdArray.length === 1) {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            let partNumber = data.name.split(':')[0];
            let propertyMatch = false;

            for(partNumberProperty of config.viewer.partNumberProperties) {
                for(property of data.properties) {
                    if(property.displayName === partNumberProperty) {
                        partNumber = property.displayValue;
                        console.log(partNumber);
                        if(partNumber.indexOf(':') > -1) { partNumber = partNumber.split(':')[0]; }
                        propertyMatch = true;
                        break;
                    }
                }
                if(propertyMatch) break;
            }

            $('.bom-item').each(function() {

                if($(this).attr('data-part-number') === partNumber) {
                
                    let link = $(this).attr('data-link');

                    if($('#details').attr('data-link') !== link){
                        insertAttachments(link, paramsAttachments);
                        insertItemDetails(link);
                        setProcesses(link);
                    }
                
                }

            });

            $('.spare-part').each(function() {
                $(this).hide();
                if($(this).hasClass('selected')) $(this).show();
                if($(this).attr('data-part-number') === partNumber) $(this).show();
            });

        });

    } else {

        resetSparePartsList();
        
    }

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


// Display selected item's Change Processes
function setProcesses(link) {

    $('#processes-toolbar').show();
    $('#processes-processing').show();

    let elemParent = $('#processes-list');
        elemParent.attr('data-source', link);
        elemParent.html('');

    insertChangeProcesses(link, 'processes');

    // $.get('/plm/relationships', { 'link' : link }, function(response) {
    //     if(response.params.link === $('#processes-list').attr('data-source')) {
    //         insertRelationships($('#processes-list'), response.data);
    //         $('#processes-processing').hide();
    //     }
    // });

}


// Set list of selected spare parts for order submittal
function setRequestList() {

    let elemParent = $('#request-list');

    if($('.spare-part.selected').length === 0) {
        elemParent.html('');
        $('#request-creation-submit').addClass('disabled');
        return;
    } else {
        $('#request-creation-submit').removeClass('disabled');
    }

    elemParent.children().each(function() {

        let remove = true;
        let link   = $(this).attr('data-link');

        $('.spare-part.selected').each(function() {
            let linkSelected = $(this).attr('data-link');
            if(linkSelected === link) remove = false;
        });

        if(remove) $(this).remove();

    });

    $('.spare-part.selected').each(function() {

        let link    = $(this).attr('data-link');
        let number  = $(this).find('.spare-part-number').html();
        let title   = $(this).find('.spare-part-title').html();
        let stock   = $(this).find('.spare-part-stock').html();
        let add     = true;

        elemParent.children().each(function() {
            let linkList = $(this).attr('data-link');
            if(linkList === link) add = false;
        });

        if(add) {

            let elemItem = $('<div></div>').appendTo(elemParent)
                .attr('data-link', $(this).attr('data-link'))
                .addClass('request-line');

            $('<div></div>').appendTo(elemItem)
                .addClass('request-item')
                .html(number + ' - ' + title);

            let elemItemQuantity = $('<div></div>').appendTo(elemItem)
                .addClass('request-quantity');

            $('<input></input>').appendTo(elemItemQuantity)
                .addClass('request-input')    
                .val('1');

            $('<div></div>').appendTo(elemItem)
                .addClass('request-stock')
                .html(stock);

            $('<div></div>').appendTo(elemItem)
                .addClass('request-delete')
                .addClass('button')
                .addClass('red')
                .addClass('icon')
                .addClass('icon-delete')
                .click(function() {
                    let lineItem = $(this).closest('.request-line');
                    let link     = lineItem.attr('data-link');
                    $('.spare-part').each(function() {
                        if($(this).attr('data-link') === link) {
                            $(this).removeClass('selected');
                        }
                    });
                    lineItem.remove();
                    if($('#request-list').children().length === 0) $('#request-creation-submit').addClass('disabled');
                });
        }

    });

}


// Create Spare Parts Request in PLM
function submitRequest() {

    if($('#request-creation-submit').hasClass('disabled')) return;

    $('#request-creation').hide();
    $('#overlay').show();

    let params = {
        'wsId'     : wsSparePartsRequests.id,
        'sections' : [{
            'id'        : wsSparePartsRequests.sections[0].urn.split('.')[5],
            'fields'    : [{
                'fieldId'   : 'LINKED_ITEM',
                'value'     : { 'link' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId },
                'type'      : 'picklist'
            },{
                'fieldId'   : 'COMMENTS',
                'value'     : $('#comments').val(),
                'type'      : 'string'
            }]
                
        }]
    } 

    $.post({
        url         : '/plm/create', 
        contentType : 'application/json',
        data        : JSON.stringify(params)
    }, function(response) {

        if(!response.error) {

            $('.request-item').each(function() {

                let link         = $(this).parent().attr('data-link');
                let quantity     = $(this).next().children().first().val();
                let availability = $(this).siblings('.request-stock').html();

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

            showSuccessMessage('Request has been created successfuly.');

        }

        $('#overlay').hide();
        $('.spare-part.selected').each(function() { $(this).click(); });

    });

}