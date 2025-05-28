let fields, sections, wsIdRequests, sectionIdRequests;
let listSpareParts  = [];
let listWearParts   = [];
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

let paramsDetails = {
    collapseContents : true,
    headerLabel      : 'descriptor',
    layout           : 'narrow',
    toggles          : true,
    fieldsEx         : ['ACTIONS'],
    sectionsEx       : ['Sourcing Summary','Others'],
    expandSections   : ['Basic']
}

let paramsAttachments = { 
    extensionsEx    : ['.dwf','.dwfx'],
    headerLabel     : 'Item Attachments',
    layout          : 'row',
    reload          : false,
    filterByType    : true,
    contentSize     : 'l'
}

let paramsProcesses = { 
    hideHeader          : true, 
    createWSID          : '',
    createHeaderLabel   : 'Create Problem Report',
    createContextItemFields : ['AFFECTED_ITEM'],
    createViewerImageFields : ['IMAGE_1'],
    editable            : true,
    fieldIdMarkup       : '',
    openInPLM           : true,
    reload              : true,
    contentSize         : 'm',
    singleToolbar       : 'actions'
}


$(document).ready(function() {

    appendProcessing('items');
    appendOverlay();
    insertMenu();

    let requests = [];

    if(!isBlank(wsId)) { if(!isBlank(dmsId)) {
        requests.push($.get('/plm/bom-views-and-fields', { wsId : wsId, useCache : true }))
    }}

    getFeatureSettings('service', requests, function(responses) {
    
        paramsProcesses.createWSID    = config.service.wsIdProblemReports;
        paramsProcesses.workspacesIn  = [config.service.wsIdProblemReports.toString()];
        paramsProcesses.fieldIdMarkup = config.service.fieldIdPRImage;
        wsProblemReports.id           = config.service.wsIdProblemReports;
        wsSparePartsRequests.id       = config.service.wsIdSparePartsRequests;

        if(!applicationFeatures.homeButton) {
            $('#home').remove();
            $('#landing').remove();
        }
        if(!applicationFeatures.toggleItemAttachments) {
            $('#attachments').remove();
            $('#toggle-attachments').remove();
        }
        if(!applicationFeatures.toggleItemDetails) {
            $('#details').remove();
            $('#toggle-details').remove();
        }
        if(!applicationFeatures.productDocumentation) {
            $('#documentation').remove();
            $('#tab-documentation').remove();
        }
        if(!applicationFeatures.manageProblemReports) {
            $('#processes').remove();
            $('#tab-processes').remove();
        }
        if(!applicationFeatures.showStock) {
            $('#color-stock').remove();
        }

        if(!applicationFeatures.requestWorkflowActions) $('#workflow-actions').remove();

        $('#header').show();
        setUIEvents();      

        if(applicationFeatures.homeButton) {
            
            if(!isBlank(config.service.wsIdProducts)) insertWorkspaceItems(config.service.wsIdProducts, {
                id              : 'products', 
                headerLabel     : config.service.productsListHeader, 
                search          : true,
                icon            : 'icon-product', 
                layout          : 'grid',
                number          : false,
                filter          : config.service.productsFilter,
                sortBy          : config.service.productsSortBy, 
                groupBy         : config.service.productsGroupBy,
                groupLayout     : 'horizontal',
                additionalData  : [ config.service.productsFieldIdBOM ],
                contentSize     : 'l',
                tileImage       : config.service.productsFieldIdImage, 
                tileTitle       : config.service.productsFieldIdTitle, 
                tileSubtitle    : config.service.productsFieldIdSubtitle, 
                useCache        : false,
                onClickItem     : function(elemClicked) { openProduct(elemClicked); }
            }); 

            insertWorkspaceViews(wsSparePartsRequests.id, {
                id                : 'requests',
                headerLabel       : 'Your Service Requests', 
                layout            : 'table',
                includeRecents    : true,
                reload            : true,
                startupView       : '',
                columnsEx         : ['Requested By'],
                onClickItem       : function(elemClicked) { openRequest(elemClicked); }
            });

        }

        if(!isBlank(dmsId)) {
            
            $('body').addClass('screen-main').removeClass('screen-landing').removeClass('screen-request');

            let params       = document.location.href.split('?')[1].split('&');
            let linkProduct  = null;
            let wsIdProduct  = null;
            let dmsIdProduct = null;

            for(let param of params) {
                if(param.toLowerCase().indexOf('wsidproduct=') === 0) { wsIdProduct = param.split('=')[1]; }
                else if(param.toLowerCase().indexOf('dmsidproduct=') === 0) { dmsIdProduct = param.split('=')[1]; }
            }

            if(!isBlank(wsIdProduct)) {
                if(!isBlank(dmsIdProduct)) {
                 linkProduct = '/api/v3/workspaces/' + wsIdProduct + '/items/' + dmsIdProduct;
                }
            }

            openItem(link, linkProduct);

        } else $('#landing').show();

    });
    
});


function setUIEvents() {


    // Close current product display and return to landing page
    if(applicationFeatures.homeButton) {
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
    if(applicationFeatures.toggleItemAttachments) {
        $('#toggle-attachments').click(function() {
            $('body').toggleClass('no-attachments');
            viewerResize();
        })
    }
    if(applicationFeatures.toggleItemDetails) {
        $('#toggle-details').click(function() {
            $('body').toggleClass('no-details');
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
        $('#items-content').children(":visible").each(function() {
            partNumbers.push($(this).attr('data-part-number'));
        });
        viewerSelectModels(partNumbers);
    });
    $('#color-stock').click(function() {
        highlightSparePartStocks();

    });
    $('#spare-parts-search-input').keyup(function() {
        searchInTiles('items', $(this));
        // filterPanelContent('items');
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
            $(this).prependTo($('#items-content'));
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

    $('#request-name'   ).val((isBlank(data.displayName )) ? '' : data.displayName);
    $('#request-company').val((isBlank(data.organization)) ? '' : data.organization);
    $('#request-e-mail' ).val((isBlank(data.email       )) ? '' : data.email);
    $('#request-address').val((isBlank(data.address1    )) ? '' : data.address1);
    $('#request-city'   ).val((isBlank(data.city        )) ? '' : data.city);
    $('#request-postal' ).val((isBlank(data.postal      )) ? '' : data.postal);
    $('#request-country').val((isBlank(data.country     )) ? '' : data.country);

}


// Click on Product in landing page
function openProduct(elemClicked) {

    let linkEBOM     = elemClicked.attr('data-' + config.service.productsFieldIdBOM.toLowerCase());
    let linkProduct  = elemClicked.attr('data-link');
    let splitEBOM    = linkEBOM.split('/');
    let splitProduct = linkProduct.split('/');

    if(isBlank(linkEBOM)) {
        showErrorMessage('Invalid Product Data', 'BOM of the selected product is not availalbe, please contact your administrator');
        return;
    }

    $('body').addClass('screen-main').removeClass('screen-landing').removeClass('screen-request');

    window.history.replaceState(null, null, '/service?wsid=' + splitEBOM[4] + '&dmsid=' + splitEBOM[6] + '&wsidproduct=' + splitProduct[4] + '&dmsidproduct=' + splitProduct[6] + '&theme=' + theme);

    openItem(linkEBOM, linkProduct);

}
function openItem(link, linkProduct) {

    $('#header-subtitle').html('');
    $('#items-content').html('');
    $('#cart-list').html('');
    $('#items-processing').show();
    
    adjustCartHeight();

    $.get('/plm/descriptor', { 'link' : link}, function(response) {
        $('#header-subtitle').html(response.data);
        document.title = documentTitle + ': ' + response.data;
    });

    if(!isBlank(linkProduct)) {
        if(applicationFeatures.productDocumentation) {
            $('#tab-documentation').show();
            insertAttachments(linkProduct, {
                id              : 'documentation',
                hideHeader      : true,
                layout          : 'list',
                size            : 'm'
            });
        }
    } else if($('#tab-documentation').length > 0) { $('#tab-documentation').hide(); }

    $('#tabs').children().first().click();

    if(isBlank(sections)) getInitialData(link.split('/')[4]);
    insertBOM(link, { 
        bomViewName   : config.service.bomViewName, 
        collapsed     : true,
        columnsIn     : [ 'Item' , 'Quantity' ],
        reset         : true, 
        path          : true, 
        hideDetails   : true, 
        quantity      : true,
        counters      : true,
        getFlatBOM    : true, 
        showRestricted: false,
        revisionBias  : config.service.revisionBias,
        endItem       : config.service.endItemFilter,
        search        : true,
        selectItems   : { fieldId : config.service.fieldId, values : config.service.fieldValues },
        toggles       : true
    });
    insertViewer(link);
    if(applicationFeatures.toggleItemDetails)     insertDetails(link, paramsDetails);
    if(applicationFeatures.toggleItemAttachments) insertAttachments(link, paramsAttachments);
    if(applicationFeatures.manageProblemReports)  insertChangeProcesses(link, paramsProcesses);

}


// Click on existing Spare Parts Request
function openRequest(elemClicked) {

    let link = elemClicked.attr('data-link');

    insertItemSummary(link, {
        bookmark : false,
        contents : [
            { type : 'workflow-history', className : 'surface-level-1', params : { id : 'request-workflow-history' } },
            { type : 'details'         , className : 'surface-level-1', params : { id : 'request-details', expandSections : config.service.requestSectionsExpanded, suppressLinks : true, sectionsEx : config.service.requestSectionsExcluded } },
            { type : 'grid'            , className : 'surface-level-1', params : { id : 'request-grid', headerLabel : 'Part List', columnsEx : config.service.requestColumnsExcluded } },
            { type : 'attachments'     , className : 'surface-level-1', params : { id : 'request-attachments', editable : true, layout : 'tiles', singleToolbar : 'controls' } },
        ],
        statesColors    : [
            { label : 'New',         color : config.colors.red,    states : ['Received'] },
            { label : 'In Work',     color : config.colors.yellow, states : ['Review', 'Quote Creation'] },
            { label : 'Waiting',     color : config.colors.red,    states : ['Awaiting Response', 'Quote Submitted'] },
            { label : 'Delivery',    color : config.colors.yellow, states : ['Order in process', 'Shipment'] },
            { label : 'Completed',   color : config.colors.green,  states : ['Completed'] }
        ],
        layout          : 'dashboard',
        openInPLM       : false,
        reload          : false,
        workflowActions : applicationFeatures.requestWorkflowActions
    })

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
            wsProblemReports.fieldIdImage   = config.service.fieldIdPRImage;
            wsSparePartsRequests.sections   = responses[4].data;

            if(isBlank(config.service.fieldIdPRImage)) {
                wsProblemReports.fieldIdImage = getFirstImageFieldID(wsProblemReports.fields);
                paramsProcesses.fieldIdMarkup = wsProblemReports.fieldIdImage;
                if(applicationFeatures.manageProblemReports) insertChangeProcesses(link, paramsProcesses);
            }


        }

    });

}     


// Parse BOM for Spare Parts
function changeBOMViewDone(id, settings, bom, selectedItems, flatBOM) {

    $('#bom-processing').hide();

    if(selectedItems.length > 15) $('#items-content').removeClass('l').addClass('m');

    let fields          = [];
    let urnsSpareParts  = [];
    let fieldIdImage    = config.service.fieldIdSparePartImage;

    for(let bomView of settings.bomViews) {
        if(bomView.id == settings.viewId) {
            fields = bomView.columns;
            break;
        }
    }

    if(isBlank(fieldIdImage)) fieldIdImage = getFirstImageFieldID(fields);

    for(let field of fields) {

        let urnField = field.__self__.urn;

        switch(field.fieldId) {
            case 'NUMBER'                           : urnsSpareParts.partNumber   = urnField; break;
            case 'TITLE'                            : urnsSpareParts.title        = urnField; break;
            case 'DESCRIPTION'                      : urnsSpareParts.description  = urnField; break;
            case fieldIdImage                       : urnsSpareParts.image        = urnField; break;
            case config.items.fieldIdNumber         : urnsSpareParts.partNumber   = urnField; break;
            case config.service.fieldId             : urnsSpareParts.spareWearPart= urnField; break;
            case config.service.spartPartDetails[0] : urnsSpareParts.material     = urnField; break;
            case config.service.spartPartDetails[1] : urnsSpareParts.weight       = urnField; break;
            case config.service.spartPartDetails[2] : urnsSpareParts.dimensions   = urnField; break;
        }

    }
    
    insertNonSparePartMessage();
    insertBOMSpareParts($('#items-content'), selectedItems, urnsSpareParts, flatBOM);

    $('<th></th>').addClass('bom-column-icon').addClass('bom-column-spare-parts').appendTo($('#bom-thead-row'));

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
        .appendTo($('#items-content'));
    
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

            // let elemSparePart = genTileSparePart(link, itemData.urn, itemData.partNumber, itemData.title, 1.0);
            let elemSparePart = genTileSparePart(link, itemData.partNumber, 1.0, itemData.title);
                elemSparePart.insertAfter($('#custom-message'));
                elemSparePart.addClass('spare-part-custom');

            if(applicationFeatures.showStock) {

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
                        getImageFromCache(elemWearPartImage, { 'link' : linkImage }, 'settings', '', function() {});
                    }
                });
            });
        } else {
            getImageFromCache(elemWearPartImage, { 'link' : wearPart.linkImage }, 'view_in_ar', '', function() {});
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

    let params = { 
        icon     : 'icon-settings',
        replace  : true
    }

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
                
        $('<span></span>').appendTo(elemSparePartImage)
            .addClass('icon')
            .addClass(params.icon);

        params.imageLink = getFlatBOMCellValue(flatBOM, selectedItem.node.item.link, urnsSpareParts.image);
    
        if(params.imageLink === '') {
            $.get('/plm/details', { 'link' : selectedItem.node.item.link}, function(response) {
                params.imageLink = getFirstImageFieldValue(response.data.sections);
                $('.spare-part').each(function() {
                    if($(this).attr('data-link') === response.params.link) {
                        let elemImage = $(this).find('.spare-part-image').first();
                        appendImageFromCache(elemImage, {}, params, function() {});
                    }
                });
            });
        } else appendImageFromCache(elemSparePartImage, {}, params, function() {});
                    
        let elemSparePartDetails = $('<div></div>').appendTo(elemSparePart)
            .addClass('spare-part-details')
            .addClass('tile-details');

        let elemSparePartData = $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-data')
            .addClass('tile-data');
    
        let elemSparePartID = $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-identifier');
    
        $('<div></div>').appendTo(elemSparePartID)
            .addClass('spare-part-quantity')
            .html(Number(selectedItem.node.totalQuantity));
    
        $('<div></div>').appendTo(elemSparePartID)
            .addClass('spare-part-number')
            .addClass('tile-title')
            .html(selectedItem.node.partNumber);    
        
        let title = selectedItem.node.item.title;

        if(title.indexOf(selectedItem.node.partNumber) === 0) title = selectedItem.node.item.title.split(' - ')[1];

        $('<div></div>').appendTo(elemSparePartDetails)
            .addClass('spare-part-title')
            .html(title);  
    
        $('<div></div>').appendTo(elemSparePartData)
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
    
        $('<div></div>').appendTo(elemSparePartData)
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
            .addClass('icon-delete')
            .addClass('cart-remove')
            .click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                moveSparePart($(this));
            });  
    
            if(applicationFeatures.showStock) {
                $('<div></div>').appendTo(elemSparePartSide).addClass('spare-part-stock');
            }

    }

}
function genTileSparePart(link, partNumber, quantity, title) {

    let elemSparePart = $('<div></div>')
        .addClass('tile')
        .addClass('spare-part')
        .attr('data-link', link)
        .attr('data-part-number', partNumber)
        .attr('data-qty', quantity)
        .click(function(e) {
            clickSparePart($(this));
        });
                    
    let elemSparePartImage = $('<div></div>').appendTo(elemSparePart)
        .addClass('spare-part-image')
        .addClass('tile-image');
            
    // let linkImage = getFlatBOMCellValue(flatBOM, selectedItem.node.item.link, urnsSpareParts.image);

    // getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', function() {});

    // if(linkImage === '') {
        $.get('/plm/details', { 'link' : link}, function(response) {
            linkImage  = getFirstImageFieldValue(response.data.sections);
            $('.spare-part').each(function() {
                if($(this).attr('data-link') === response.params.link) {
                    let elemSparePartImage = $(this).find('.spare-part-image').first();
                    getImageFromCache(elemSparePartImage, { 'link' : linkImage }, 'settings', '', function() {});
                }
            });
        });
    // }
                
    let elemSparePartDetails = $('<div></div>').appendTo(elemSparePart)
        .addClass('spare-part-details')
        .addClass('tile-details');

    let elemSparePartID = $('<div></div>').appendTo(elemSparePartDetails)
        .addClass('spare-part-identifier');

    $('<div></div>').appendTo(elemSparePartID)
        .addClass('spare-part-quantity')
        .html(Number(quantity));

    $('<div></div>').appendTo(elemSparePartID)
        .addClass('spare-part-number')
        .addClass('tile-title')
        .html(partNumber);    

    $('<div></div>').appendTo(elemSparePartDetails)
        .addClass('spare-part-title')
        .html(title);  

    $('<div></div>').appendTo(elemSparePartDetails)
        .addClass('spare-part-material')
        .addClass('with-icon')
        .addClass('icon-product')
        .addClass('filled');
        // .html(getBOMNodeValue(selectedItem.node, urnsSpareParts.material));
        
    let partSpec        = '';
    // let partWeight      = getBOMNodeValue(selectedItem.node, urnsSpareParts.weight);
    // let partDimensions  = getBOMNodeValue(selectedItem.node, urnsSpareParts.dimensions);
            
    // if(partWeight !== '') {
    //     partSpec = partWeight;
    //     if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
    // } else partSpec = partDimensions

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
        .addClass('icon-delete')
        .addClass('cart-remove')
        .click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            moveSparePart($(this));
        });  

        if(applicationFeatures.showStock) {
            $('<div></div>').appendTo(elemSparePartSide).addClass('spare-part-stock');
        }


    return elemSparePart;

}
function setSparePartStockStatus() {

    if(!applicationFeatures.showStock) return;

    $('#items-content').children().each(function() {

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
function clickBOMItem(elemClicked, e) {

    $('.bom-item').removeClass('selected-context');

    if(elemClicked.hasClass('selected')) {
        // elemClicked.removeClass('selected');
        if(applicationFeatures.toggleItemDetails)     insertDetails(elemClicked.attr('data-link'), paramsDetails);
        if(applicationFeatures.toggleItemAttachments) insertAttachments(elemClicked.attr('data-link'), paramsAttachments);
        if(applicationFeatures.manageProblemReports)  insertChangeProcesses(elemClicked.attr('data-link'), paramsProcesses);
        
        setSparePartsList(elemClicked);
        // updateViewer();
        viewerSelectModel(elemClicked.attr('data-part-number'), {
            highlight : false
        });

    } else {
        // $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected-context');
        if(applicationFeatures.toggleItemDetails)     insertDetails(elemClicked.attr('data-link'), paramsDetails);
        if(applicationFeatures.toggleItemAttachments) insertAttachments(elemClicked.attr('data-link'), paramsAttachments);
        if(applicationFeatures.manageProblemReports)  insertChangeProcesses(elemClicked.attr('data-link'), paramsProcesses);

        if(applicationFeatures.toggleItemDetails)     insertDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsDetails);
        if(applicationFeatures.toggleItemAttachments) insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsAttachments);
        if(applicationFeatures.manageProblemReports)  insertChangeProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId, paramsProcesses);

        resetSparePartsList();
        viewerResetSelection({
            fitToView : true
        });


        // updateViewer(elemClicked.attr('data-part-number'));
    }

    // updateBOMPath(elemClicked);
    // updateBOMCounters(elemClicked.closest('.bom').attr('id'));


}
function clickBOMDeselectAllDone() {
    
    let link = $('#bom').attr('data-link');

    if(applicationFeatures.toggleItemDetails) insertDetails(link, paramsDetails);
    if(applicationFeatures.toggleItemAttachments) insertAttachments(link, paramsAttachments);
    resetSparePartsList();
    updateViewer();

}


// Cart Management
function moveSparePart(elemClicked) {

    let elemSparePart = elemClicked.closest('.spare-part');
    let idList        = elemSparePart.parent().attr('id');

    if(idList === 'items-content') {

        elemSparePart.appendTo($('#cart-list'));
        adjustCartHeight();
        elemSparePart.find('.cart-quantity-input').select();

    } else {

        let elemCustomMessage = $('#custom-message');
        if(elemCustomMessage.length === 0) elemSparePart.prependTo($('#items-content'));
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

        topTabs = 100;

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
    let isNode      = elemItem.hasClass('node');

    if(typeof elemItem !== 'undefined') {
        elemNext  = elemItem;
        level     = Number(elemItem.attr('data-level'));
    }

    let levelNext = level - 1;
    
    $('#items-content').children().each(function() {
        $(this).hide();
    });

    do {

        let isSparePart = elemNext.hasClass('is-spare-part');

        if(isSparePart) {

            count++;
            let link = elemNext.attr('data-link');

            if(list.indexOf(link) === -1) {

                list.push(link);

                $('#items-content').children().each(function() {
                    if($(this).attr('data-link') === link) $(this).show();
                });

            }
        }

        elemNext  = elemNext.next();
        levelNext = Number(elemNext.attr('data-level'));

    } while(levelNext > level);

    let elemCustomMessage = $('#custom-message');

    // If no spare part is present, validate if parents are spare parts
    if(list.length === 0) {
        let parents = getBOMItemPath(elemItem);
        for(let parent of parents.items) {
            if(parent.hasClass('is-spare-part')) {
                let linkParent = parent.attr('data-link');
                list.push(linkParent);
                $('#items-content').children().each(function() {
                    if($(this).attr('data-link') === linkParent) $(this).show();
                });
                break;
            }
        }
    }

    // Display message to order custom spare part if enabled
    if(elemCustomMessage.length > 0) {   
        if(list.length > 0) {
            elemCustomMessage.hide();
        // } else if(!isNode) {
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


// Apply stock information using colors
function highlightSparePartStocks() {

    highlightSparePartStock('spare-part-stock-normal', config.vectors.green,  true );
    highlightSparePartStock('spare-part-stock-low'   , config.vectors.yellow, false);
    highlightSparePartStock('spare-part-stock-none'  , config.vectors.red,    false);
    highlightSparePartStock('spare-part-stock-custom', config.vectors.blue,   false);

}
function highlightSparePartStock(className, vector, reset) {

    let partNumbers = [];

    $('#items-content').children(":visible").each(function() {
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

    if(applicationFeatures.toggleItemDetails) insertDetails(link, paramsDetails);
    if(applicationFeatures.toggleItemAttachments) insertAttachments(link, paramsAttachments);
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


    if(viewerHideSelected(event)) return;

    if(disableViewerSelectionEvent) return;

    if (event.dbIdArray.length === 1) {

        let proceed = true;
        let parents = getComponentParents(event.dbIdArray[0]);

        for(let parent of parents) {
            if(proceed) {
                let partNumber = parent.partNumber;

                if(!isBlank(partNumber)) {
                    $('.bom-item').removeClass('selected');
                    $('.bom-item').each(function() {
                        if(proceed) {
                            if($(this).attr('data-part-number') === partNumber) {
                                proceed = false;
                                let linkItem = $(this).attr('data-link');
                                $(this).addClass('selected');
                                bomDisplayItem($(this));
                                setSparePartsList($(this));
                                toggleBOMItemActions($(this));
                                // updateBOMCounters('bom');
                                if(applicationFeatures.toggleItemDetails)     insertDetails(linkItem, paramsDetails);
                                if(applicationFeatures.toggleItemAttachments) insertAttachments(linkItem, paramsAttachments);
                                if(applicationFeatures.manageProblemReports)  insertChangeProcesses(linkItem, paramsProcesses);
                            }
                        }
                    });
                }
            }
        }

    } else if (event.dbIdArray.length === 0) {

        let elemContext = $('.bom-item.selected-context');
        $('.bom-item').removeClass('selected');

        if(elemContext.length === 0) {
            resetSparePartsList();
        } else {
    
            let linkItem = elemContext.attr('data-link');
            elemContext.addClass('selected');
            bomDisplayItem(elemContext);
            setSparePartsList(elemContext);
            toggleBOMItemActions(elemContext);
            // updateBOMCounters('bom');
            if(applicationFeatures.toggleItemDetails)     insertDetails(linkItem, paramsDetails);
            if(applicationFeatures.toggleItemAttachments) insertAttachments(linkItem, paramsAttachments);
            if(applicationFeatures.manageProblemReports)  insertChangeProcesses(linkItem, paramsProcesses);            

        }

    } else {

        resetSparePartsList();
        
    }

}
function getFirstBOMParent() {

    let paths = viewerGetSelectedComponentPaths();
    let result = null;

    for(let path of paths) {

        if(isBlank(result)) {

            let parents = path.split('|');

            for(let parent of parents) {

                if(isBlank(result)) {

                    let partNumber = parent.split(';')[0];

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
        wsId     : wsSparePartsRequests.id,
        sections : []
    } 

    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'LINKED_ITEM'               , { 'link' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId });
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_NAME'            , $('#request-name').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_COMPANY'         , $('#request-company').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_EMAIL'           , $('#request-e-mail').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_ADDRESS'         , $('#request-address').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_CITY'            , $('#request-city').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_POSTAL_CODE'     , $('#request-postal').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUESTOR_COUNTRY_CODE'    , $('#request-country').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUEST_SHIPPING_ADDRESS'  , $('#request-shipping-address').val());
    addFieldToPayload(params.sections, wsSparePartsRequests.sections, null, 'REQUEST_COMMENTS'          , $('#reqeust-comments').val());

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
                
                $.post('/plm/add-grid-row', params, function(response) {});

            });

            $('#request-list').children().each(function() { $(this).prependTo($('#items-content')); });

            showSuccessMessage('Request has been created successfuly.');

        }

        $('#overlay').hide();
        $('.spare-part.selected').each(function() { $(this).click(); });

    });

}