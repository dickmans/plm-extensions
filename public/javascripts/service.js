let fields, sections, wsIdRequests, sectionIdRequests;
let listSpareParts  = [];
let listWearParts   = [];
let urnPartNumber   = '';
let maintenanceMode = false;
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

let selectedBOMContext      = '';
let wsProblemReports        = { 'id' : '', 'sections' : [], 'fields' : [] };
let wsSparePartsRequests    = { 'id' : '', 'sections' : [], 'fields' : [] };


$(document).ready(function() {
    
    wsProblemReports.id      = config.service.wsIdProblemReports;
    wsSparePartsRequests.id  = config.service.wsIdSparePartsRequests;

    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;

    if(typeof options !== undefined) {
        if(options === 'iot') enableIOT();
    }

    appendProcessing('bom', false);
    appendProcessing('details', false);
    appendProcessing('attachments', true);

    appendProcessing('items', false);
    appendProcessing('processes', false);

    appendViewerProcessing();
    appendOverlay();

    getInitialData();
    setViewer();
    setUIEvents();
    insertAttachments(link);
    setProcesses(link);
    
});

function setUIEvents() {

    // Header Toolbar
    $('#button-reset').click(function() {
        $('tr.selected').click();
        viewerResetSelection(true);
        resetSparePartsList();
        $(this).hide();
    });
    $('#button-settings').click(function() {
        $('#overlay').show();
        $('#options').show();
    });
    $('#submit-request').click(function() {
        $('#request').show();
        $('#overlay').show();
        setRequestList();
    });

  
    // Options Dialog
    $('#options-done').click(function() {
        $('#overlay').hide();
        $('.dialog').hide();
    });
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


    // Process Creation
    $('#create-process').click(function() {
        
        let elemParent = $('#processes-details');
            elemParent.html('');
            elemParent.show();

        $(this).siblings().show();
        $(this).hide();

        $('#processes-list').hide();

        insertItemDetailsFields('processes', '', wsProblemReports.sections, wsProblemReports.fields, null, true, true, true);

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


    // Submit Request Dialog functions
    $('#request-submit').click(function() {
        submitRequest();
    });
    $('#request-cancel').click(function() {
        $('#request').hide();
        $('#overlay').hide();
    });


    // BOM Tree Actions
    $('#bom-search-input').keyup(function() {
        filterBOMTree();
    });


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


    // Maintenance Controls
    $('#remote-control').click(function() {
        window.open(urlRC);
    })
    $('#qr-code').click(function() {
        $('#qr').show();
        $('#overlay').show();
    })
    $('.dialog-close').click(function() {
        $('#overlay').hide();
        $(this).closest('.dialog').hide();
    });

}



// Get viewable and init Forge viewer
function setViewer() {

    $.get('/plm/get-viewables', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {

        if(response.data.length > 0) {

            let found = false;

            for(viewable of response.data) {
                if(viewable.name.indexOf('.iam.dwf') > -1) {
                    initViewer(viewable, 255);
                    found = true;
                    break;
                }
            }

            if(!found) initViewer(response.data[0], 255);

        } else {
            $("#viewer").hide();
        }
    });

}
function onViewerSelectionChanged(event) {

    let found = false;

    if(viewer.getSelection().length === 0) {

        return;

    } else {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            for(property of data.properties) {

                if(partNumberProperties.indexOf(property.displayName) > -1) {

                    let partNumber = property.displayValue;

                    $('tr').each(function() {
                        if(!found) {
                            if($(this).attr('data-part-number') === partNumber) {
                                found = true;
                                $(this).click();
                            }
                        }
                    });

                    if(!found) {
                        if(partNumber.indexOf(':') > -1 ) {
                            partNumber = property.displayValue.split(':')[0];
                            $('tr').each(function() {
                                if(!found) {
                                    if($(this).attr('data-part-number') === partNumber) {
                                        found = true;
                                        $(this).click();
                                        // console.log(index + '-' + $(this).offset().top);
                                        // if(!$(this).hasClass('selected')) {
                                        //     $('#bom-tree').animate({
                                        //         scrollTop: $(this).offset().top
                                        //     });
                                        // }
                                        
                                    }
                                }
                            });
                        }
                    }

                }

            }

        });

    }

}
function initViewerDone() {

    viewerAddMarkupControls();   
    viewerAddViewsToolbar();

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

}


// Retrieve Workspace Details, BOM and details
function getInitialData() {

    let promises = [
        $.get('/plm/bom-views-and-fields'   , { 'wsId' : wsId }),
        $.get('/plm/details'                , { 'wsId' : wsId, 'dmsId' : dmsId }),
        $.get('/plm/sections'               , { 'wsId' : wsId }),
        $.get('/plm/fields'                 , { 'wsId' : wsId }),
        $.get('/plm/sections'               , { 'wsId' : wsProblemReports.id }),
        $.get('/plm/fields'                 , { 'wsId' : wsProblemReports.id }),
        $.get('/plm/sections'               , { 'wsId' : wsSparePartsRequests.id })
    ];

    Promise.all(promises).then(function(responses) {

        let errors = false;

        for(response of responses) {
            if(response.error) {
                let message = (isBlank(response.data.message)) ? 'Error in accessing ' + response.params.url : response.data.message;
                showErrorMessage(message, 'Error occured');
                errors = true;
            }
        }

        if(!errors) {

            for(view of responses[0].data) {
                if(view.name === config.service.bomViewName) {
                    getBOMData(view.id, view.fields);
                }
            }

            $('#header-subtitle').html(responses[1].data.title);

            document.title = document.title + ': ' + responses[1].data.title

            sections                        = responses[2].data;
            fields                          = responses[3].data;
            wsProblemReports.sections       = responses[4].data;
            wsProblemReports.fields         = responses[5].data;
            wsSparePartsRequests.sections   = responses[6].data;

            insertItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

        }

    });

}
function getBOMData(viewId, viewColumns) {

    let params = {
        'wsId'          : wsId,
        'dmsId'         : dmsId,
        'depth'         : 10,
        'revisionBias'  : revisionBias,
        'viewId'        : viewId
    }

    let promises = [
        $.get('/plm/bom', params),
        $.get('/plm/bom-flat', params)
    ];

    Promise.all(promises).then(function(responses) {
        $('#bom-processing').hide();
        setBOMData(viewColumns,responses[0].data, responses[1].data);
    });

}
function setBOMData(fields, bom, flatBom) {

    let elemRoot = $('#bom-table');
        elemRoot.html('');

    for(field of fields) {
    
             if(field.fieldId === 'NUMBER')                             urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'PART_NUMBER')                        urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'THUMBNAIL')                          urns.thumbnail      = field.__self__.urn;
        else if(field.fieldId === 'TITLE')                              urns.title          = field.__self__.urn;
        else if(field.fieldId === 'DESCRIPTION')                        urns.description    = field.__self__.urn;
        else if(field.fieldId === 'QUANTITY')                           urns.quantity       = field.__self__.urn;
        else if(field.fieldId === config.service.fieldId)               urns.spareWearPart  = field.__self__.urn; 
        else if(field.fieldId === config.service.spartPartDetails[0])   urns.material       = field.__self__.urn;
        else if(field.fieldId === config.service.spartPartDetails[1])   urns.weight         = field.__self__.urn;
        else if(field.fieldId === config.service.spartPartDetails[2])   urns.dimensions     = field.__self__.urn;

    }

    insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + wsId + '.' + dmsId, flatBom, 1.0);
    insertWearParts();

    $('.spare-part').click(function(e) {
        clickSparePart(e, $(this));
    });

    $('#items-processing').hide();

    $('.bom-nav').click(function(e) {

        e.stopPropagation();
        e.preventDefault();

        let elemItem  = $(this).closest('tr');
        let level     = Number(elemItem.attr('data-level'));
        let levelNext = level - 1;
        let levelHide = 10000;
        let elemNext  = $(this).closest('tr');
        let doExpand  = $(this).hasClass('collapsed');

        $(this).toggleClass('collapsed');
        
        do {

            elemNext  = elemNext.next();
            levelNext = Number(elemNext.attr('data-level'));

            if(levelNext > level) {

                if(doExpand) {

                    if(levelHide > levelNext) {

                        elemNext.show();

                        let elemToggle = elemNext.children().first().find('i.bom-nav');

                        if(elemToggle.length > 0) {
                            if(elemToggle.hasClass('collapsed')) {
                                levelHide = levelNext + 1;
                            }
                        }

                    }

                } else {
                    elemNext.hide();
                }

            }
        } while(levelNext > level);


    });

    $('tr').click(function() {

        selectBOMItem($(this));
        
    });

}
function insertNextBOMLevel(bom, elemRoot, parent, flatBom, qtyTotal) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let isSparePart = getBOMCellValue(edge.child, urns.spareWearPart, bom.nodes);
            let partNumber  = getBOMCellValue(edge.child, urns.partNumber, bom.nodes);
            let link        = getBOMNodeLink(edge.child, bom.nodes);
            let quantity    = getBOMEdgeValue(edge, urns.quantity, null, 0);
            let quantityRow = qtyTotal * quantity;

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-is-spare-part', isSparePart);
                elemRow.attr('data-qty', quantityRow);
                elemRow.attr('data-status', 'match');
                elemRow.appendTo(elemRoot);

            if(config.service.fieldValues.indexOf(isSparePart.toLowerCase()) > -1) {

                elemRow.addClass('is-spare-part');

                let valueImage = getFlatBOMCellValue(flatBom, link, urns.thumbnail);
                let linkImage   = (valueImage === '') ? '' : valueImage;
                let qty         = quantityRow;
                let isAssembly  = true;

                for(flatItem of flatBom) {
                    if(flatItem.item.link === link) {
                        qty = flatItem.totalQuantity;
                        isAssembly = false;
                    }
                }

                if(isSparePart.toLowerCase() === 'wear part') {
                    listWearParts.push({
                        'link'          : link,
                        'partNumber'    : partNumber,
                        'linkImage'     : linkImage
                    });
                }

                if(listSpareParts.length > 20) $('#items-list').removeClass('l').addClass('m');

                if(listSpareParts.indexOf(edge.child) === -1) {

                    listSpareParts.push(edge.child);

                    let stockLabel  = 'In stock';
                    let stockClass  = 'normal';
                    let stockRandom = Math.floor(Math.random() * 3) + 1;

                         if(stockRandom === 2) { stockLabel = 'Low stock'; stockClass = 'low'; }
                    else if(stockRandom === 3) { stockLabel = 'Out of stock'; stockClass = 'none'; }

                    let elemSparePart = $('<div></div>');
                        elemSparePart.addClass('tile');
                        elemSparePart.addClass('spare-part');
                        elemSparePart.addClass('spare-part-stock-' + stockClass);
                        elemSparePart.attr('data-link', link);
                        elemSparePart.attr('data-part-number', partNumber);
                        elemSparePart.attr('data-qty', qty);
                        elemSparePart.appendTo($('#items-list'));
                        
                    let elemSparePartImage = $('<div></div>');
                        elemSparePartImage.addClass('spare-part-image');
                        elemSparePartImage.addClass('tile-image');
                        elemSparePartImage.appendTo(elemSparePart);

                    // let valueImage = getFlatBOMCellValue(flatBom, link, urns.thumbnail);
                    // let linkImage = (valueImage === '') ? '' : valueImage;

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
                        elemSparePartNumber.html(getBOMCellValue(edge.child, urns.partNumber, bom.nodes));
                        elemSparePartNumber.appendTo(elemSparePartDetails);


                    let elemSparePartQuantity = $('<span></span>');
                        elemSparePartQuantity.addClass('spare-part-quantity');
                        elemSparePartQuantity.html(qty);
                        elemSparePartQuantity.prependTo(elemSparePartNumber);

                    
                    let elemSparePartTitle = $('<div></div>');
                        elemSparePartTitle.addClass('spare-part-title');
                        elemSparePartTitle.html(getBOMCellValue(edge.child, urns.title, bom.nodes));
                        elemSparePartTitle.appendTo(elemSparePartDetails);
                    
                    // let elemSparePartDescription = $('<div></div>');
                    //     elemSparePartDescription.html(getBOMCellValue(edge.child, urns.description, bom.nodes));
                    //     elemSparePartDescription.appendTo(elemSparePartDetails);
                    
                    let elemSparePartMaterial = $('<div></div>');
                        elemSparePartMaterial.html(getBOMCellValue(edge.child, urns.material, bom.nodes));
                        elemSparePartMaterial.appendTo(elemSparePartDetails);

                    let partSpec        = '';
                    let partWeight      = getBOMCellValue(edge.child, urns.weight, bom.nodes);
                    let partDimensions  = getBOMCellValue(edge.child, urns.dimensions, bom.nodes);

                    if(partWeight !== '') {
                        partSpec = partWeight;
                        if(partWeight !== '') partSpec = partWeight + ' / ' + partDimensions;
                    } else if(partWeight !== '') partSpec = partDimensions

                    let elemSparePartSpec = $('<div></div>');
                        elemSparePartSpec.html(partSpec);
                        elemSparePartSpec.appendTo(elemSparePartDetails);

                    let elemSparePartSide = $('<div></div>');
                        elemSparePartSide.addClass('spare-part-side');
                        elemSparePartSide.appendTo(elemSparePart);
                        
                    let elemSparePartShowMe = $('<div></div>');
                        elemSparePartShowMe.addClass('button');
                        elemSparePartShowMe.addClass('spare-part-show');
                        elemSparePartShowMe.html('Zoom');
                        elemSparePartShowMe.appendTo(elemSparePartSide);
                        elemSparePartShowMe.click(function(e) {
                            clickSparePartShowMe(e, $(this));
                        });

                    let elemSparePartStock = $('<div></div>');
                        elemSparePartStock.addClass('spare-part-stock');
                        elemSparePartStock.html(stockLabel);
                        elemSparePartStock.appendTo(elemSparePartSide);

                } else if(isAssembly) {

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

            for(node of bom.nodes) {
                if(node.item.urn === edge.child) {
                    elemRow.attr('data-dmsId',      node.item.link.split('/')[6]);
                    elemRow.attr('data-link',       node.item.link);
                    elemRow.attr('data-edgeId',     edge.edgeId);
                    elemRow.attr('data-edgeLink',   edge.edgeLink);
                    elemRow.attr('data-level',      edge.depth);
                    elemRow.addClass('bom-level-' + edge.depth);
                }
            }

            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);
                elemCell.html(getBOMItem(edge.child, bom.nodes));

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom, quantityRow);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<i></i>');
                        elemNav.addClass('bom-nav');
                        elemNav.addClass('icon');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                    elemRow.addClass('node');

                }

            });

        }

    }

    return result;

}
function getBOMItem(id, nodes) {

    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.title;
        }
    }

    return '';
    
}
function getBOMNodeLink(id, nodes) {
    for(node of nodes) {
        if(node.item.urn === id) {
            return node.item.link;
        }
    }
    return '';
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
function updateCounter() {

    let count = $('.spare-part.selected').length; 

    $('#counter').html(count);

    if(count === 0) {
        $('#counter').hide();
        $('#submit-request').removeClass('default');
    } else {
        $('#counter').show();
        $('#submit-request').addClass('default');
    }

}
function filterBOMTree() {

    $('tr.result').removeClass('result');

    let filterValue = $('#bom-search-input').val().toLowerCase();

    if(filterValue === '') {

        $('#bom-table').children().each(function() {
            $(this).show();
        });

    } else {

        $('i.collapsed').removeClass('collapsed').addClass('expanded');
        $('#bom-table').children().each(function() {
            $(this).hide();
        });

        $('#bom-table').children().each(function() {

            let cellValue = $(this).children().first().html().toLowerCase();

            if(cellValue.indexOf(filterValue) > -1) {
             
                $(this).show();
                $(this).addClass('result');
             
                let level = Number($(this).attr('data-level'));
                unhideParents(level - 1, $(this));

            }

        });

    }

}
function unhideParents(level, elem) {

    elem.prevAll().each(function() {

        let prevLevel = Number($(this).attr('data-level'));

        if(level === prevLevel) {
            level--;
            $(this).show();
        }

    });

}
function selectBOMItem(elemClicked) {

    if(elemClicked.hasClass('selected')) {
        elemClicked.removeClass('selected');
        insertItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        insertAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        setProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        resetSparePartsList();
        updateViewer();
    } else {
        $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected');
        insertItemDetails(elemClicked.attr('data-link'));
        insertAttachments(elemClicked.attr('data-link'));
        setProcesses(elemClicked.attr('data-link'));
        setSparePartsList(elemClicked);
        // viewerResetColors();
        updateViewer();
    }

    // if(maintenanceMode) {
    //     viewerSetColors(listRed     , new THREE.Vector4(1,   0, 0, 0.5));
    //     viewerSetColors(listYellow  , new THREE.Vector4(1, 0.5, 0, 0.5));
    //     viewerSetColors(listGreen   , new THREE.Vector4(0,   1, 0, 0.5));
    // } else {
    //     viewerResetColors();
    // }

}


// Parse BOM for Spare Parts
function setSparePartsList(elemItem) {

    let list = [];

    // let elemParent = $('#items-list');
    //     elemParent.html('');

    $('#items-processing').show();

    let level       = 0;
    let elemNext    = $('tr').closest().first();

    if(typeof elemItem !== 'undefined') {
        elemNext  = elemItem;
        level     = Number(elemItem.attr('data-level'));
    }

    let levelNext = level - 1;
    
    $('.spare-part').each(function() {
        if(!$(this).hasClass('selected')) $(this).hide();
    });

    do {

        let isSparePart = elemNext.attr('data-is-spare-part');

        if(typeof isSparePart !== 'undefined') {
            if((isSparePart.toLowerCase() === 'yes') || (isSparePart.toLowerCase() === 'spare part') || (isSparePart.toLowerCase() === 'wear part')){

                let link = elemNext.attr('data-link');

                if(list.indexOf(link) === -1) {

                    list.push(link);

                    $('.spare-part').each(function() {
                        if($(this).attr('data-link') === link) $(this).show();
                    });

                }

            }
        }

        elemNext  = elemNext.next();
        levelNext = Number(elemNext.attr('data-level'));

    } while(levelNext > level);

    $('#items-processing').hide();

}
function resetSparePartsList() {
    $('.spare-part').each(function() {
        $(this).show();
    });
}


// Spare Part Interactions
function clickSparePart(e, elemClicked) {

    elemClicked.toggleClass('selected');
    updateCounter();
    updateViewer();

}
function clickSparePartShowMe(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let elemSelected = elemClicked.closest('.spare-part');
        elemSelected.toggleClass('zoom');
        elemSelected.siblings().removeClass('zoom');

    updateViewer();

}


// Viewer interactions
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
                        if(partNumber.indexOf(':') > -1) { partNumber = partNumber.split(':')[0]; }
                        propertyMatch = true;
                        break;
                    }
                }
                if(propertyMatch) break;
            }

            $('.spare-part').each(function() {

                if($(this).attr('data-part-number') === partNumber) {
                    
                    let link = $(this).attr('data-link');

                    if($('#details').attr('data-link') !== link){
                        insertAttachments(link);
                        insertItemDetails(link);
                        setProcesses(link);
                    }
                       
                    $(this).click();

                }

            })
        });

    }

}


// Apply colors and hide components according to selection
function updateViewer() {

    disableViewerSelectionEvent = true;

    let selectedBOMNode = $('#bom-table').children('.selected');
    let zoomPart = $('.spare-part.zoom').first();

    viewerResetColors();

    if(selectedBOMNode.length === 1) {

        let partNumber = selectedBOMNode.attr('data-part-number');
        let resetView  = (partNumber !== selectedBOMContext);

        viewer.hideAll();
        viewer.setGhosting(false);
        viewerUnhideModel(selectedBOMNode.attr('data-part-number'), resetView);
        selectedBOMContext = partNumber;

        $('#button-reset').show();

    } else {

        viewer.setGhosting(true);
        viewerResetSelection(selectedBOMContext !== '');
        selectedBOMContext = '';

        $('#button-reset').css('display', 'none');

    }

    $('.spare-part.selected').each(function() {
        viewerSetColor($(this).attr('data-part-number'), config.vectors.blue, false, false);
    });

    if(zoomPart.length > 0) {
        $('#button-reset').show();
        viewerSetColorToAll(config.vectors.gray);
        viewerSetColor(zoomPart.attr('data-part-number'), config.vectors.red, true, false);

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
        elemParent.html('');

    $('.spare-part.selected').each(function() {

        let number = $(this).find('.spare-part-number').html();
        let title = $(this).find('.spare-part-title').html();
        
        let elemItem = $('<div></div>');
            elemItem.attr('data-link', $(this).attr('data-link'));
            elemItem.addClass('request-line');
            elemItem.appendTo(elemParent);

        let elemItemName = $('<div></div>');
            elemItemName.addClass('request-item');
            elemItemName.html(number + ' - ' + title);
            elemItemName.appendTo(elemItem);

        let elemItemQuantity = $('<div></div>');
            elemItemQuantity.addClass('request-quantity');
            elemItemQuantity.appendTo(elemItem);

        let elemItemInput = $('<input></input>');
            elemItemInput.val('1');
            elemItemInput.appendTo(elemItemQuantity);

        let elemItemDelete = $('<div></div>');
            elemItemDelete.addClass('request-delete');
            elemItemDelete.addClass('button');
            elemItemDelete.addClass('icon');
            elemItemDelete.addClass('icon-delete');
            elemItemDelete.appendTo(elemItem);
            elemItemDelete.click(function() {
                let lineItem = $(this).closest('.request-line');
                let link = lineItem.attr('data-link');
                $('.spare-part').each(function() {
                    if($(this).attr('data-link') === link) {
                        $(this).removeClass('selected');
                    }
                });
                lineItem.remove();
            });

    });

}



// Create Spare Parts Request in PLM
function submitRequest() {

    $('#request').hide();
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

                let link     = $(this).parent().attr('data-link');
                let quantity = $(this).next().children().first().val();

                let params = {
                    'wsId' : wsSparePartsRequests.id,
                    'link' : response.data.split('.autodeskplm360.net')[1],
                    'data' : [
                        { 'fieldId' : 'ITEM', 'value' : { 'link' : link } },
                        { 'fieldId' : 'QUANTITY', 'value' : quantity }
                    ]
                }
                
                $.get('/plm/add-grid-row', params, function(response) {
                    console.log(response);
                });


            });


        }

        $('#overlay').hide();
        $('.spare-part.selected').each(function() { $(this).click(); });

    });

}




// IoT Extensions
let urlRC = document.location.href.split('/service')[0] + '/apps/printer';
let chartEntries = 30;
let chartJobs, chartSupplies, chartTemperature;


async function init() {

    if(maintenanceMode === false) return;

    do {
        await sleep(1000);
        updateCharts();
    } while(true)

}  

function enableIOT() {

    maintenanceMode = true;

    $('#tab-charts').removeClass('hidden');

    initCharts();   
    setQRCodes(); 

}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function initCharts() {
    
    chartJobs = new Chart($('#chart-jobs'), {
        type: 'bar',
        data: {
            labels : [],
            datasets: [
                { label : 'large' ,  data: [],  backgroundColor : '#ee4444' },
                { label : 'medium',  data: [],  backgroundColor : '#ffa600' },
                { label : 'small' ,  data: [],  backgroundColor : '#87bc40' }
            ]
        },
        options: {
            legend : {
                display : false
            },
            layout : {
                padding : {
                    bottom : 40
                }
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    stacked : true,
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    stacked : true,
                    display : false
                }]
            }
        }
    });

    chartSupplies = new Chart($('#chart-supplies'), {
        type: "line",
        data: {
            datasets: [{
                backgroundColor : '#e8f6fe',
                borderColor : '#0696d7',
                data: [],
                pointStyle : 'rect'
            }]
        },
        options: {
            legend : {
                display : false
            },
            layout : {
                padding : {
                    bottom : 40
                }
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        max : 100,
                        steps : 10
                    }
                }],
                xAxes: [{
                    display : false,
                    type: 'time'
                }]
            }
        }
    });

    chartTemperature = new Chart($('#chart-temperature'), {
        type: "line",
        data: {
            datasets: [{
                data: [],
                backgroundColor : [ '#f5f7fa' ]
            }]
        },
        options: {
            legend : {
                display : false
            },
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    display : false,
                    type: 'time'
                }]
            }
        }
    });

    init();

}
function updateCharts() {

    let now = new Date();
    
    $.get('/extensions/get-printer-status', {}, function(response) {

        chartJobs.data.labels.push('');
        chartJobs.data.datasets[0].data.push(response.jobsl);
        chartJobs.data.datasets[1].data.push(response.jobsm);
        chartJobs.data.datasets[2].data.push(response.jobss);

        if(chartJobs.data.datasets[0].data.length > chartEntries) {
            chartJobs.data.labels.splice(0,1);
            chartJobs.data.datasets[0].data.splice(0,1);
            chartJobs.data.datasets[1].data.splice(0,1);
            chartJobs.data.datasets[2].data.splice(0,1);
        }
    
        chartJobs.update();

        chartSupplies.data.datasets[0].data.push({
            x : now.getTime(),
            y : response.supplies
        });

        if(chartSupplies.data.datasets[0].data.length > chartEntries) {
            chartSupplies.data.datasets[0].data.splice(0,1);
        }
    
        chartSupplies.update();

        chartTemperature.data.datasets[0].data.push({
            x : now.getTime(),
            y : response.temperature
        });

        if(chartTemperature.data.datasets[0].data.length > chartEntries) {
            chartTemperature.data.datasets[0].data.splice(0,1);
        }
    
        chartTemperature.update();

        setWearPartStatus('wp1', response.wp1);
        setWearPartStatus('wp2', response.wp2);
        setWearPartStatus('wp3', response.wp3);

        setWearPartColors(response);

    })

}
function setWearPartStatus(id, value ) {

    let color = '#87bc40';

    if(value < 15) color = '#ee4444';
    else if(value <= 25) color = '#ffa600';

    $('#' + id).css('background', 'linear-gradient(to right, ' + color + ' 0%, ' + color + ' ' + value + '%, var(--color-gray-100) ' + value + '%, var(--color-gray-100) 100%)');

}
function setWearPartColors(response) {

    if(maintenanceMode) {

        let listRed    = [];
        let listYellow = [];
        let listGreen  = [];

        setWearPartColor(response.wp1, '001-ASY-0035', listRed, listYellow, listGreen);
        setWearPartColor(response.wp2, '001-MCH-0004', listRed, listYellow, listGreen);
        setWearPartColor(response.wp3, '001-MCH-0005', listRed, listYellow, listGreen);

        viewerSetColors(listRed    , new THREE.Vector4(1,   0, 0, 0.5), false);
        viewerSetColors(listYellow , new THREE.Vector4(1, 0.5, 0, 0.5), false);
        viewerSetColors(listGreen  , new THREE.Vector4(0,   1, 0, 0.5), false);
        
    }


}
function setWearPartColor(value, partNumber, listRed, listYellow, listGreen) {

    let isSelected = false;

    $('#bom-table').children('.selected').each(function() {
        if($(this).attr('data-part-number') === partNumber) {
            isSelected = true;
        }
    });

    if(!isSelected) {
        if(value < 15) listRed.push(partNumber);
        else if(value <= 25) listYellow.push(partNumber);
        else listGreen.push(partNumber);
    }

}
function setQRCodes() {

    $('.qr-code').each(function() {
        $(this).attr('src', 'https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=' + urlRC);
    });

}