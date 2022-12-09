let fields, sections, viewId, wsIdRequests, sectionIdRequests;
let listSpareParts = [];
let urnPartNumber = '';
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

let wsIdProblemReport   = '82';
let maintenanceMode     = false;
let viewerDone          = false;
let wsProblemReports    = { 'sections' : [], 'fields' : [] };


$(document).ready(function() {
    
    let link = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;

    if(typeof options !== undefined) {
        if(options === 'iot') enableIOT();
    }

    getDetails();
    getWSConfig();
    getRequestWSConfig();
    setViewer();
    setUIEvents();
    setAttachments(link);
    setProcesses(link);
    
});

function setUIEvents() {

    // Header Toolbar
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
        
        let elemParent = $('#processes-form');
            elemParent.html('');
            elemParent.show();

        $(this).siblings().show();
        $(this).hide();

        $('#processes-list').hide();

        insertItemDetails(elemParent, wsProblemReports.sections, wsProblemReports.fields, null, true, true, true);

    });
    $('#cancel-process').click(function() {

        $('.process-dialog').hide();
        $('#create-process').show();
        $('#processes-list').show();
        $('#processes-form').hide();

    });
    $('#save-process').click(function() {

        if(!validateForm($('#processes-form'))) return;

        viewerCaptureScreenshot(function() {

            $('#processes-form').hide();
            $('#processes-list').html('');
            $('#processes-list').show('');
            $('#processes-process').show();
    
            let link = $('#processes-list').attr('data-source');
    
            submitCreateForm(wsIdProblemReport, $('#processes-form'), function(response ) {

                let newLink = response.data.split('.autodeskplm360.net')[1];
                // $.get('/plm/add-managed-items', { 'link' : newLink, 'items' : [ link ] }, function(response) {
                $.get('/plm/add-relationship', { 'link' : newLink, 'relatedId' : link.split('/')[6] }, function(response) {
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
        
        $('#request').hide();
        $('#overlay .progress').show();
        
        let params = {
            'wsId'     : wsIdRequests,
            'sections' : [
                {
                    'id'        : sectionIdRequests,
                    'fields'    : [{
                        'fieldId'   : 'LINKED_ITEM',
                        'value'     : { 'link' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId },
                        'type'      : 'picklist'
                    },{
                        'fieldId'   : 'COMMENTS',
                        'value'     : $('#comments').val(),
                        'type'      : 'string'
                    }]
                }
            ]
        } 

        $.post({
            url         : '/plm/create', 
            contentType : "application/json",
            data        : JSON.stringify(params)
        }, function(response) {
    

            if(!response.error) {

                $('.request-item').each(function() {

                    let link     = $(this).parent().attr('data-link');
                    let quantity = $(this).next().children().first().val();

                    let params = {
                        'wsId' : wsIdRequests,
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
            $('#overlay .progress').hide();
            $('.spare-part.selected').each(function() { $(this).click(); });
    
        });

    });
    $('#request-cancel').click(function() {
        $('#request').hide();
        $('#overlay').hide();
    });


    // BOM Tree Actions
    $('#bom-reset').click(function() {
        $('tr.selected').click();
        resetViewerSelection(true);
    });
    $('#bom-search-input').keyup(function() {
        filterBOMTree();
    });


    // Tab Control
    $('#tabs').children().click(function() {
        let id = $(this).attr('data-id');
        $('.tab').hide();
        $('#' + id).show();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        maintenanceMode = $('#tab-charts').hasClass('selected');
        if(!maintenanceMode) {
            if($('#bom-table').children('.selected').length === 0) {
                if(viewerDone) {
                    viewerResetColors();
                    viewer.showAll();
                }
            }
        } else {
            if(viewerDone) viewer.hideAll();
        }
    });
    $('#tabs').children().first().click();


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



// Get Context Item Ddetails
function getDetails() {
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
        
        $('#header-subtitle').html(response.data.title);
        
    });
    
}
function getFieldValue(sections, fieldId, defaultValue) {

    for(section of sections) {
        for(field of section.fields) {
            let id = field.urn.split('.')[9];
            if(id === fieldId) {
                return field.value;
            }

        }
    }

    return defaultValue;

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
function onSelectionChanged(event) {

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

    viewerDone = true;

    viewerAddMarkupControls();   
    viewerAddGhostingToggle();
    viewerAddViewsToolbar();

    $('#viewer-markup-image').attr('data-field-id', 'IMAGE_1');

}


// Retrieve Workspace Details, BOM and details
function getWSConfig() {

    let promises = [
        $.get('/plm/bom-views-and-fields', { 'wsId' : wsId }),
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields', { 'wsId' : wsId }),
        $.get('/plm/sections', { 'wsId' : wsIdProblemReport }),
        $.get('/plm/fields', { 'wsId' : wsIdProblemReport })
    ];

    Promise.all(promises).then(function(responses) {

        for(view of responses[0].data) {
            if(view.name === 'Service') {
                viewId = view.id;
            }
        }

        getBOMData(viewId);

        sections                    = responses[1].data;
        fields                      = responses[2].data;
        wsProblemReports.sections   = responses[3].data;
        wsProblemReports.fields     = responses[4].data;

        setItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);

    });

}
function getBOMData(viewId) {

    let params = {
        'wsId'          : wsId,
        'dmsId'         : dmsId,
        'depth'         : 10,
        'revisionBias'  : 'release',
        'viewId'        : viewId
    }

    let promises = [
        $.get('/plm/bom-view-fields', params),
        $.get('/plm/bom', params),
        $.get('/plm/bom-flat', params)
    ];

    Promise.all(promises).then(function(responses) {
        $('#bom-process').hide();
        setBOMData(responses[0].data, responses[1].data, responses[2].data);
    });

}
function setBOMData(fields, bom, flatBom) {

    let elemRoot = $('#bom-table');
        elemRoot.html('');

    for(field of fields) {
    
             if(field.fieldId === 'NUMBER')          urns.partNumber     = field.__self__.urn;
        else if(field.fieldId === 'THUMBNAIL')       urns.thumbnail      = field.__self__.urn;
        else if(field.fieldId === 'TITLE')           urns.title          = field.__self__.urn;
        else if(field.fieldId === 'DESCRIPTION')     urns.description    = field.__self__.urn;
        else if(field.fieldId === 'SPAREWEAR_PART')  urns.spareWearPart  = field.__self__.urn; 
        else if(field.fieldId === 'MATERIAL')        urns.material       = field.__self__.urn;
        else if(field.fieldId === 'MASS')            urns.mass           = field.__self__.urn;
        else if(field.fieldId === 'DIMENSIONSSIZE')  urns.dimensions     = field.__self__.urn;

    }

    insertNextBOMLevel(bom, elemRoot, 'urn:adsk.plm:tenant.workspace.item:' + tenant.toUpperCase() + '.' + wsId + '.' + dmsId, flatBom);

    $('.spare-part').click(function() {
        $(this).toggleClass('selected');
        updateCounter();
    });

    $('#items-process').hide();


    // setSparePartsList();

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
function insertNextBOMLevel(bom, elemRoot, parent, flatBom) {

    let result = false;

    for(edge of bom.edges) {

        if(edge.parent === parent) {

            result = true;

            let isSparePart = getBOMCellValue(edge.child, urns.spareWearPart, bom.nodes);
            let partNumber  = getBOMCellValue(edge.child, urns.partNumber, bom.nodes);
            let link        = getBOMNodeLink(edge.child, bom.nodes);

            let elemRow = $('<tr></tr>');
                elemRow.attr('data-number', edge.itemNumber);
                elemRow.attr('data-part-number', partNumber);
                elemRow.attr('data-is-spare-part', isSparePart);
                elemRow.attr('data-qty', '1');
                elemRow.attr('data-status', 'match');
                elemRow.appendTo(elemRoot);

            if((isSparePart.toLowerCase() === 'spare part') || (isSparePart.toLowerCase() === 'yes')) {

                elemRow.addClass('is-spare-part');

                if(listSpareParts.indexOf(edge.child) === -1) {

                    listSpareParts.push(edge.child);

                    let stockLabel  = 'In stock';
                    let stockClass  = 'normal';
                    let stockRandom = Math.floor(Math.random() * 3) + 1;

                    if(stockRandom === 2) { stockLabel = 'Low stock'; stockClass = 'low'; }
                    else if(stockRandom === 3) { stockLabel = 'Out of stock'; stockClass = 'none'; }

                    let elemSparePart = $('<div></div>');
                        elemSparePart.addClass('spare-part');
                        elemSparePart.addClass('spare-part-stock-' + stockClass);
                        elemSparePart.attr('data-link', link);
                        elemSparePart.attr('data-part-number', partNumber);
                        elemSparePart.appendTo($('#items-list'));
                        
                    let elemSparePartImage = $('<div></div>');
                        elemSparePartImage.addClass('spare-part-image');
                        elemSparePartImage.addClass('tile-image');
                        elemSparePartImage.appendTo(elemSparePart);

                    let valueImage = getFlatBOMCellValue(flatBom, link, urns.thumbnail);
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
                        elemSparePartNumber.html(getBOMCellValue(edge.child, urns.partNumber, bom.nodes));
                        elemSparePartNumber.appendTo(elemSparePartDetails);
                    
                    let elemSparePartTitle = $('<div></div>');
                        elemSparePartTitle.addClass('spare-part-title');
                        // elemSparePartTitle.addClass('nowrap');
                        elemSparePartTitle.html(getBOMCellValue(edge.child, urns.title, bom.nodes));
                        elemSparePartTitle.appendTo(elemSparePartDetails);
                    
                    // let elemSparePartDescription = $('<div></div>');
                    //     elemSparePartDescription.html(getBOMCellValue(edge.child, urns.description, bom.nodes));
                    //     elemSparePartDescription.appendTo(elemSparePartDetails);
                    
                    let elemSparePartMaterial = $('<div></div>');
                        elemSparePartMaterial.html(getBOMCellValue(edge.child, urns.material, bom.nodes));
                        elemSparePartMaterial.appendTo(elemSparePartDetails);

                    let elemSparePartWeight = $('<div></div>');
                        elemSparePartWeight.html(getBOMCellValue(edge.child, urns.mass, bom.nodes));
                        elemSparePartWeight.appendTo(elemSparePartDetails);

                    let elemSparePartDimensions = $('<div></div>');
                        elemSparePartDimensions.html(getBOMCellValue(edge.child, urns.dimensions, bom.nodes));
                        elemSparePartDimensions.appendTo(elemSparePartDetails);

                    let elemSparePartSide = $('<div></div>');
                        elemSparePartSide.addClass('spare-part-side');
                        elemSparePartSide.appendTo(elemSparePart);
                        
                    let elemSparePartShowMe = $('<div></div>');
                        elemSparePartShowMe.addClass('button');
                        elemSparePartShowMe.addClass('spare-part-show');
                        elemSparePartShowMe.html('Zoom');
                        elemSparePartShowMe.appendTo(elemSparePartSide);
                        elemSparePartShowMe.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            let elemSelected = $(this).closest('.spare-part');
                            let link = elemSelected.attr('data-link');
                            viewerResetColors();
                            viewerSelectModel(elemSelected.attr('data-part-number'), true);
                            $('#bom-reset').show();
                            $('#bom-tree').children().each(function() {
                                if($(this).attr('data-link') === link) $(this).addClass('selected'); else $(this).removeClass('selected');
                            });
                        });

                    let elemSparePartStock = $('<div></div>');
                        elemSparePartStock.addClass('spare-part-stock');
                        elemSparePartStock.html(stockLabel);
                        elemSparePartStock.appendTo(elemSparePartSide);

                    $('.wear-part').each(function() {

                        let elemWearPart = $(this);

                        if(elemWearPart.attr('data-part-number') === partNumber) {
                            elemWearPart.attr('data-link', link);
                            elemWearPart.find('.wear-part-descriptor').first().html(partNumber);
                            let elemWearPartImage = elemWearPart.find('.wear-part-image').first();
                            getImageFromCache(elemWearPartImage, { 'link' : linkImage }, 'view_in_ar', function() {});
                            elemWearPart.click(function() {
                                let link = $(this).attr('data-link');
                                // viewerResetColors();
                                // viewerSelectModel($(this).attr('data-part-number'), true);
                                // $('#bom-reset').show();
                                $('#bom-table').children().each(function() {
                                    console.log($(this).attr('data-link'));
                                    if($(this).attr('data-link') === link) { 
                                        $(this).click();
                                        $(this).get(0).scrollIntoView();
                                    }

                                //     if($(this).attr('data-link') === link) $(this).addClass('selected'); else $(this).removeClass('selected');
                                });

                            });
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

            // for(key of keysMaster) {
            //     let elemCell = $('<td></td>');
            //         elemCell.appendTo(elemRow);
            //         elemCell.html(getBOMCellValue(edge.child, key, bom.nodes));
            // }

            // console.log(edge);
            // console.log(bom.nodes);

            let elemCell = $('<td></td>');
                elemCell.appendTo(elemRow);
                elemCell.html(getBOMItem(edge.child, bom.nodes));

            // let elemCellStatus = $('<td></td>');
            //     elemCellStatus.addClass('cell-status');
            //     elemCellStatus.appendTo(elemRow);

            // for(key of keysVariant) {

            //     let elemCell = $('<td></td>');
            //         elemCell.addClass('cell-variant');
            //         elemCell.appendTo(elemRow);

            //     let elemInput = $('<input>');
            //         elemInput.attr('data-value', '');
            //         elemInput.appendTo(elemCell);
            //         elemInput.keypress(function (e) {
            //             updateValue($(this), e);
            //         });

            // }

            let hasChildren = insertNextBOMLevel(bom, elemRoot, edge.child, flatBom);

            elemRow.children().first().each(function() {
                
                $(this).addClass('bom-first-col');

                if(hasChildren) {

                    let elemNav = $('<i></i>');
                        elemNav.addClass('bom-nav');
                        elemNav.addClass('material-symbols-sharp');
                        elemNav.addClass('expanded');
                        elemNav.prependTo($(this));

                    elemRow.addClass('node');

                }

            });

        }

    }

    return result;


}
// function getBOMItemLink(id, nodes) {

//     for(node of nodes) {
//         if(node.item.urn === id) {
//             return node.item.link;
//         }
//     }

//     return '';
    
// }
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
        $('#bom-reset').hide();
        elemClicked.removeClass('selected');
        resetViewerSelection(true);
        setAttachments('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        setProcesses('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        setSparePartsList();
    } else {
        viewerResetColors();
        $('#bom-reset').show();
        $('tr.selected').removeClass('selected');
        elemClicked.addClass('selected');
        setItemDetails(elemClicked.attr('data-link'));
        setAttachments(elemClicked.attr('data-link'));
        setProcesses(elemClicked.attr('data-link'));
        setSparePartsList(elemClicked);
        viewerSelectModel(elemClicked.attr('data-part-number'), true);;
    }


    // if(maintenanceMode) {
    //     viewerSetColors(listRed     , new THREE.Vector4(1,   0, 0, 0.5));
    //     viewerSetColors(listYellow  , new THREE.Vector4(1, 0.5, 0, 0.5));
    //     viewerSetColors(listGreen   , new THREE.Vector4(0,   1, 0, 0.5));
    // } else {
    //     viewerResetColors();
    // }

}


// Retrieve required details of workspace Spare Parts Requests
function getRequestWSConfig() {

    $.get('/plm/get-workspace-id', { 'name' : 'Spare Parts Requests' }, function(response) {
        wsIdRequests = response.data;
        $.get('/plm/sections', { 'wsId' : wsIdRequests }, function(response) {
            if(response.data.length > 0) {
                sectionIdRequests = response.data[0].urn.split('.')[5];
            }
        });
    });

}



function setSparePartsList(elemItem) {

    let list = [];

    // let elemParent = $('#items-list');
    //     elemParent.html('');

    $('#items-process').show();

    let level = 0;
    let elemNext = $('tr').first();

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

        if(isSparePart.toLowerCase() === 'yes') {

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

    $('#items-process').hide();

}



function setItemDetails(link) {

    $('#details-process').show();

    let elemParent = $('#sections');
        elemParent.html('');

    $.get('/plm/details', { 'link' : link }, function(response) {
        insertItemDetails(elemParent, sections, fields, response.data, false, false, false);
        $('#details-process').hide();
    });

}



// Display selected item's attachments
function setAttachments(link) {

    $('#attachments-process').show();

    let elemParent = $('#attachments-list');
        elemParent.html('');

    $.get('/plm/attachments', { 'link' : link }, function(response) {
        insertAttachments(elemParent, response.data, true);
        $('#attachments-process').hide();
    });

}



// Display selected item's Change Processes
function setProcesses(link) {

    $('#processes-process').show();

    let elemParent = $('#processes-list');
        elemParent.attr('data-source', link);
        elemParent.html('');

    // $.get('/plm/changes', { 'link' : link }, function(response) {
    //     if(response.params.link === $('#processes-list').attr('data-source')) {
    //         insertChangeProcesses($('#processes-list'), response.data);
    //         $('#processes-process').hide();
    //     }
    // });

    $.get('/plm/relationships', { 'link' : link }, function(response) {
        if(response.params.link === $('#processes-list').attr('data-source')) {
            insertRelationships($('#processes-list'), response.data);
            $('#processes-process').hide();
        }
    });

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

        let elemItemDelete = $('<span></span>');
            elemItemDelete.addClass('request-delete');
            elemItemDelete.addClass('material-symbols-sharp');
            elemItemDelete.html('delete');
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
            console.log('is selected');
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