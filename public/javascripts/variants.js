let maxRequests     = 4;

let wsContext       = { 'id' : '', 'sections'  : [], 'fields' : [] }
let wsVariants      = { 'id' : '', 'sections'  : [], 'fields' : [], 'bomViews' : [], 'viewId' : '', 'tableau' : '' }
let listVariants    = [];
let fieldsVariant   = [];
let classesViewer   = [ 'standard', 'no-viewer', 'large-viewer', 'wide-viewer'];
let modeViewer      = 0;
let linkContext     = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
let pendingActions, baseItemNumber;



$(document).ready(function() {

    wsContext.id  = wsId;
    wsVariants.id = config.variants.wsIdItemVariants;

    appendProcessing('bom', false);
    appendProcessing('details', false);
    appendProcessing('item-variants-list-parent', false);
    appendOverlay(true);

    getInitialData();
    insertViewer(linkContext);
    insertItemDetails(linkContext);
    setUIEvents();
    
});


function setUIEvents() {

    // Header Toolbar
    $('#button-toggle-viewer').click(function() {
        $('#main').removeClass('standard');
        $('#main').removeClass('no-viewer');
        $('#main').removeClass('large-viewer');
        $('#main').removeClass('wide-viewer');
        modeViewer = ++modeViewer % 4;
        $('#main').addClass(classesViewer[modeViewer]);
        viewerResize();
    });
    $('#button-toggle-details').click(function() {
        $('#main').toggleClass('with-details');
        $('#main').removeClass('with-create');
        $('#main').removeClass('with-item-variants');
        viewerResize();
    });
    $('#button-new').click(function() {
        if($(this).hasClass('disabled')) return;
        $('#main').toggleClass('with-create');
        $('#main').removeClass('with-details');
        insertItemDetailsFields('create', '', wsVariants.sections, wsVariants.fields, null, true, true, true);
        viewerResize();
    });
    $('#button-save').click(function() {
        if($(this).hasClass('disabled')) return;
        setSaveActions();
        showSaveProcessingDialog();
    });


    // Save Confirmation Dialog
    $('#confirm-saving').click(function() {
        if($(this).hasClass('disabled')) return;
        else {
            $('#overlay').hide();
            $('#dialog-saving').hide();
        }
    });


    // Create Panel
    $('#cancel-create').click(function() {
        $('#main').removeClass('with-create');
        viewerResize();
    });
    $('#save-create').click(function() {
        $('#main').removeClass('with-create');
        if(!validateForm($('#create'))) return;
        $('#overlay').show();
        createNewVariant();
    });


    // Item Variants
    $('#item-variants-close').click(function() {
        $('#main').removeClass('with-item-variants');
    });


}


// Get item details to pull further information from PLM
function getInitialData() {

    let requests = [
        $.get('/plm/details'                , { 'wsId' : wsContext.id, 'dmsId' : dmsId }),
        $.get('/plm/sections'               , { 'wsId' : wsContext.id }),
        $.get('/plm/sections'               , { 'wsId' : wsVariants.id }),
        $.get('/plm/fields'                 , { 'wsId' : wsVariants.id }),
        $.get('/plm/bom-views-and-fields'   , { 'wsId' : wsVariants.id })
    ];

    Promise.all(requests).then(function(responses) {

        $('#header-subtitle').html(responses[0].data.title);
        let variants   = getSectionFieldValue(responses[0].data.sections, config.variants.fieldIdItemVariants, '');
        baseItemNumber = getSectionFieldValue(responses[0].data.sections, config.variants.fieldIdItemNumber, '');
        insertBOM('bom', 'BOM & Variants', linkContext, config.variants.bomViewNameItems, true, false, false, false);

        for(variant of variants) listVariants.push(variant);

        wsContext.sections  = responses[1].data;
        wsVariants.sections = responses[2].data;
        wsVariants.fields   = responses[3].data;
        wsVariants.bomViews = responses[4].data;

        getVariantsWSConfig();

    });

}
function getVariantsWSConfig() {

    let foundSection = false;

    for(section of wsVariants.sections) {

        if(section.name === config.variants.variantsSectionLabel) {

            foundSection = true;

            wsVariants.sectionIdVariansSection = section.__self__.split('/')[6];

            for(sectionField of section.fields) {
                for(field of wsVariants.fields) {
                    if(field.__self__ === sectionField.link) {

                        let elemControl = null;

                        switch(field.type.title) {

                            case 'Integer': 
                            case 'Single Line Text': 
                                elemControl = $('<input>');
                                break;
                            case 'Single Selection': 
                                elemControl = $('<select>');
                                elemControl.addClass('picklist');
    
                                let elemOptionBlank = $('<option></option>');
                                    elemOptionBlank.attr('value', null);
                                    elemOptionBlank.appendTo(elemControl);
    
                                getOptions(elemControl, field.picklist, field.__self__.split('/')[8], 'select', '');

                                break;

                        }

                        fieldsVariant.push({
                            'id'      : field.__self__.split('/')[8],
                            'title'   : sectionField.title,
                            'type'    : field.type.title,
                            'control' : elemControl
                        });

                    }
                }  
            }
        }
    }

    if(!foundSection) showErrorMessage('Cannot find section with name  ' + config.variants.variantsSectionLabel + ' in workspace ' +  config.variants.wsIdVariantItems + ' (wsIdVariantItems)', 'Error loading data');

    wsVariants.fieldIdVariantBaseItem   = config.variants.fieldIdVariantBaseItem;
    wsVariants.sectionIdBaseItem        = getFieldSectionId(wsVariants.sections, config.variants.fieldIdVariantBaseItem);

    for(bomView of wsVariants.bomViews) {
        if(bomView.name === config.variants.bomViewNameVariants) {

            wsVariants.viewId = bomView.id;

            for(field of bomView.fields) {

                if(field.fieldId === config.variants.fieldIdVariantBaseItem) {

                    wsVariants.fieldLinkVariantBaseItem = field.__self__.link;

                }

                     if(field.fieldId === 'QUANTITY'         ) wsVariants.colIdQuantity  = field.__self__.link;
                else if(field.fieldId === 'EDGE_ID_BASE_ITEM') wsVariants.colIdRefEdgeId = field.__self__.link;

                for(fieldVariant of fieldsVariant) {
                    if(fieldVariant.id === field.fieldId) fieldVariant.link = field.__self__.link;
                }

            }

        }
    }

    $('#button-new').removeClass('disabled');

}



// Extend BOM table with variant columns
function bomDisplayDone(id) {

    let requests = [];

    let elemTable = $('#' + id + '-table');

    let elemTableHead = $('<thead></thead>');
        elemTableHead.prependTo(elemTable);

    let elemTableHeadRow1 = $('<tr></tr>');
        elemTableHeadRow1.attr('id', 'table-head-row-titles');
        elemTableHeadRow1.appendTo(elemTableHead);

    let elemTableHeadRowFieldTitles = $('<tr></tr>');
        elemTableHeadRowFieldTitles.attr('id', 'table-head-row-fields');
        elemTableHeadRowFieldTitles.appendTo(elemTableHead);

    let elemTableHeadCell1 = $('<th></th>');
        elemTableHeadCell1.addClass('sticky');
        elemTableHeadCell1.attr('colspan', 2);
        elemTableHeadCell1.appendTo(elemTableHeadRow1);
            
    let elemTableHeadCell2 = $('<th></th>');
        elemTableHeadCell2.addClass('sticky');
        elemTableHeadCell2.attr('colspan', 2);
        elemTableHeadCell2.appendTo(elemTableHeadRowFieldTitles);

    let elemVariantSelector = $('<select>');
        elemVariantSelector.attr('id', 'variant-selector');
        elemVariantSelector.prependTo($('#bom-toolbar'));
        elemVariantSelector.change(function() {
            if($(this).val() === 'all') {
                $('.variant-filter').show();
            } else {
                $('.variant-filter').hide();
                $('.variant-index-' + $(this).val()).show();
            }
        });

    let elemOptionAll = $('<option></option>');
        elemOptionAll.attr('value', 'all');
        elemOptionAll.html('Show all variants');
        elemOptionAll.appendTo(elemVariantSelector);
                
    let indexVariant = 0;

    let elemCellSpacer = $('<th></th>');
        elemCellSpacer.addClass('variant-spacer');
        elemCellSpacer.addClass('variant-filter');

    for(variant of listVariants) {

        requests.push($.get('/plm/bom', { 'link' : variant.link, 'viewId' : wsVariants.viewId } ))

        let elemSpacerHead = elemCellSpacer.clone();
            elemSpacerHead.addClass('variant-index-' + indexVariant);
            
        elemTableHeadRow1.append(elemSpacerHead.clone());
        elemTableHeadRowFieldTitles.append(elemSpacerHead.clone());

        let elemCellHead = $('<th></th>');
            elemCellHead.attr('colspan', fieldsVariant.length + 1);
            elemCellHead.attr('data-link', variant.link);
            elemCellHead.html(variant.title.toUpperCase());
            elemCellHead.addClass('variant-head');
            elemCellHead.addClass('variant-filter');
            
            elemCellHead.addClass('variant-index-' + indexVariant);
            elemCellHead.appendTo(elemTableHeadRow1);
            elemCellHead.click(function() {
                openItemByLink($(this).attr('data-link'));
            });

        for(field of fieldsVariant) {

            let elemCellHeadField = $('<th></th>');
                elemCellHeadField.html(field.title);
                elemCellHeadField.appendTo(elemTableHeadRowFieldTitles);
                elemCellHeadField.addClass('variant-filter');
                
                elemCellHeadField.addClass('variant-index-' + indexVariant);

        }

        let elemCellHeadItem = $('<th></th>');
            elemCellHeadItem.html('Item');
            elemCellHeadItem.addClass('variant-filter');
            elemCellHeadItem.addClass('variant-index-' + indexVariant);
            elemCellHeadItem.appendTo(elemTableHeadRowFieldTitles);

        let elemOptionVariant = $('<option></option>');
            elemOptionVariant.attr('value', indexVariant);
            elemOptionVariant.html(variant.title);
            elemOptionVariant.appendTo(elemVariantSelector);

        indexVariant++;

    }

    indexVariant = 0;

    // Get Variant BOMs and match with master BOM
    Promise.all(requests).then(function(responses) {

        for(response of responses) {

            elemTable.children('tr').each(function() {

                let className     = 'status-match';
                let elemRefItem   = $(this);
                let dmsIdBaseItem = $(this).attr('data-link').split('/')[6];
                let variantItem   = getMatchingVariantItem(response.data.nodes, response.data.edges, wsVariants.fieldLinkVariantBaseItem, dmsIdBaseItem);

                console.log(variantItem);


                if(variantItem === null) {
                    className = 'status-missing';
                    variantItem = validateMatch(response.data.nodes, response.data.edges, elemRefItem);
                    if(variantItem !== null) {
                        className = 'status-identical';
                    } else {
                        variantItem = {
                            'link'      : '',
                            'urn'       : '',
                            'title'     : '',
                            'quantity'  : '',
                            'number'    : '',
                            'edgeId'    : '',
                            'edgeIdRef' : '',
                            'fields'    : []
                        }
                    }
                }

                if(className !== 'status-missing') {
                    if(variantItem !== null) {
                        if(parseInt($(this).attr('data-number')) !== variantItem.number) {
                            console.log(variantItem);
                            className = 'change-bom';
                        } else if(parseFloat($(this).attr('data-quantity')) !== parseFloat(variantItem.quantity)) {
                            className = 'change-bom';
                        }
                    }
                }

                let elemSpacerBody = elemCellSpacer.clone();
                    elemSpacerBody.addClass('variant-index-' + indexVariant);
                    elemSpacerBody.appendTo($(this));

                for(fieldVariant of fieldsVariant) {

                    let elemCellField = $('<td></td>');
                        elemCellField.addClass('variant-filter');
                        elemCellField.addClass('field-value');
                        elemCellField.addClass('variant-index-' + indexVariant);
                        elemCellField.appendTo($(this));

                    let elemControl = fieldVariant.control.clone();
                        elemControl.appendTo(elemCellField);
                        elemControl.click(function(e) {
                            e.stopPropagation();
                        });
                        elemControl.change(function() {
                            valueChanged($(this));
                        });

                    for(field of variantItem.fields) {

                        if(field.id === fieldVariant.id) {

                            switch (fieldVariant.type) {

                                case 'Single Selection':
                                    elemControl.val(field.value.link);
                                    break;

                                default:
                                    elemControl.val(field.value);
                                    break;

                            }

                        }
                    }
        
                }

                let elemCellItem = $('<td></td>');
                    elemCellItem.attr('data-link'       , variantItem.link);
                    elemCellItem.attr('data-edgeid'     , variantItem.edgeId);
                    elemCellItem.attr('data-edgeid-ref' , variantItem.edgeIdRef);
                    elemCellItem.attr('data-quantity'   , variantItem.quantity);
                    elemCellItem.attr('data-number'     , variantItem.number);
                    elemCellItem.attr('data-link-parent', variantItem.parent);
                    elemCellItem.attr('data-link-root'  , response.params.link);
                    elemCellItem.addClass('variant-filter');
                    elemCellItem.addClass('variant-index-' + indexVariant);
                    elemCellItem.addClass('variant-item');
                    elemCellItem.addClass(className);
                    elemCellItem.html(variantItem.title);
                    elemCellItem.appendTo($(this));
                    elemCellItem.click(function(e) {
                        clickItemCell(e, $(this));
                    });

            });

            indexVariant++;

        }

    });

    elemTable.find('.bom-first-col').each(function() {
        $(this).addClass('sticky');
    });

}
function getMatchingVariantItem(nodes, edges, fieldLink, value) {

    for(node of nodes) {
        for(field of node.fields) {
            if(field.metaData.link === fieldLink) {
                let fieldValue = (typeof field.value === 'object') ? field.value.link : field.value;
                if(fieldValue === value) {

                    let result = {
                        'urn'       : node.item.urn,
                        'link'      : node.item.link,
                        'title'     : node.item.title,
                        'quantity'  : 1,
                        'number'    : 0,
                        'fields'    : []
                    }

                    for(fieldVariant of fieldsVariant) {
                        for(nodeField of node.fields) {
                            if(nodeField.metaData.link === fieldVariant.link) {
                                result.fields.push({
                                    'id' : fieldVariant.id,
                                    'value' : nodeField.value
                                });
                            }
                        }
                    }

                    for(edge of edges) {
                        if(edge.child === node.item.urn) {
                            result.number   = edge.itemNumber;
                            result.edgeId   = edge.edgeId;
                            result.quantity = getEdgeQuantity(edge);
                            result.parent   = convertURN2Link(edge.parent);      
                        }
                    }

                    return result;
                }
            }
        }
    }

    return null;
    
}
function validateMatch(nodes, edges, elemRefItem) {

    let link      = elemRefItem.attr('data-link');
    let edgeIdRef = Number(elemRefItem.attr('data-edgeid'));

    for(edge of edges) {
        if(edgeIdRef === edge.edgeId) {
            return {
                'urn'       : elemRefItem.attr('data-urn'),
                'link'      : link,
                'parent'    : '',
                'title'     : '',
                'number'    : edge.itemNumber,
                'edgeId'    : edgeIdRef,
                'edgeIdRef' : edgeIdRef,  
                'quantity'  : getEdgeQuantity(edge),
                'fields'    : []
            }
        }
    }

    for(node of nodes) {
        if(node.item.link === link) {

            let result = {
                'urn'       : node.item.urn,
                'link'      : node.item.link,
                'title'     : '',
                'quantity'  : 0,
                'number'    : 0,
                'fields'    : [],
                'edgeIdRef' : ''
            }

            for(edge of edges) {
                if(edge.child === node.item.urn) {
                    for(edgeField of edge.fields) {
                        if(edgeField.metaData.link === wsVariants.colIdRefEdgeId) {
                            if(Number(edgeField.value) === edgeIdRef) {
                                result.number    = edge.itemNumber;
                                result.edgeId    = edge.edgeId;    
                                result.edgeIdRef = edgeIdRef; 
                                result.quantity  = getEdgeQuantity(edge);                        
                                result.parent    = convertURN2Link(edge.parent);                        
                            }
                        }
                    }
                }
            }

            return result;

        }
    }

    return null;
    
}
function getEdgeQuantity(edge) {

    for(edgeField of edge.fields) {
        if(edgeField.metaData.link === wsVariants.colIdQuantity) return edgeField.value;
    }

    return 0;

}
function valueChanged(elemControl) {

    let elemVariant = elemControl.parent().nextAll('.variant-item').first();
    let index       = elemVariant.index();
    let elemRefItem = elemVariant.closest('tr');
    let levelNext   = Number(elemRefItem.attr('data-level')) - 1;
    let elemPrev    = elemRefItem.prev();


    elemVariant.addClass('change-properties');


    // if((isBlank(elemVariant.attr('data-link')) || elemVariant.hasClass('identical'))) {
    //     elemVariant.addClass('new-item');
    // } else {
    //     elemVariant.addClass('changed-item');
    // }

    // elemVariant.removeClass('match');
    // elemVariant.removeClass('identical');    

    while(levelNext > 0) {
        
        if(elemPrev.length > 0) {

            let level = Number(elemPrev.attr('data-level'));

            if(level === levelNext) {
                levelNext--;
                // elemPrev.children().eq(index).addClass('changed-item').removeClass('match');
                elemPrev.children().eq(index).addClass('change-properties');
            }

        }

        elemPrev = elemPrev.prev();

    }

}
function insertNewVariant(link, title) {

    let indexVariant = $('.variant-head').length + 1;

    insertNewVariantHeader(link, title, indexVariant);
    insertNewVariantFields(link, title, indexVariant);
    
}
function insertNewVariantHeader(link, title, indexVariant) {

    let elemCellSpacer = $('<th></th>');
        elemCellSpacer.addClass('variant-spacer');
        elemCellSpacer.addClass('variant-filter');

    let elemSpacerHead = elemCellSpacer.clone();
        elemSpacerHead.addClass('variant-index-' + indexVariant);
    
    let elemTableHeadRow1 = $('#table-head-row-titles');
        elemTableHeadRow1.append(elemSpacerHead.clone());
    
    let elemTableHeadRowFieldTitles = $('#table-head-row-fields');
        elemTableHeadRowFieldTitles.append(elemSpacerHead.clone());

    let elemCellHead = $('<th></th>');
        elemCellHead.attr('colspan', fieldsVariant.length + 1);
        elemCellHead.attr('data-link', link);
        elemCellHead.html(title);
        elemCellHead.addClass('variant-head');
        elemCellHead.addClass('variant-filter');
    
        elemCellHead.addClass('variant-index-' + indexVariant);
        elemCellHead.appendTo(elemTableHeadRow1);
        elemCellHead.click(function() {
            openItemByLink($(this).attr('data-link'));
        });

    for(field of fieldsVariant) {

        let elemCellHeadField = $('<th></th>');
            elemCellHeadField.html(field.title);
            elemCellHeadField.appendTo(elemTableHeadRowFieldTitles);
            elemCellHeadField.addClass('variant-filter');
            
            elemCellHeadField.addClass('variant-index-' + indexVariant);

    }

    let elemCellHeadItem = $('<th></th>');
        elemCellHeadItem.html('Item');
        elemCellHeadItem.addClass('variant-filter');
        elemCellHeadItem.addClass('variant-index-' + indexVariant);
        elemCellHeadItem.appendTo(elemTableHeadRowFieldTitles);

    let elemOptionVariant = $('<option></option>');
        elemOptionVariant.attr('value', indexVariant);
        elemOptionVariant.html(title);
        elemOptionVariant.appendTo($('#variant-selector'));

}
function insertNewVariantFields(link, title, indexVariant) {

    let elemCellSpacer = $('<th></th>');
        elemCellSpacer.addClass('variant-spacer');
        elemCellSpacer.addClass('variant-filter');

    let elemTable = $('#bom-table');

    elemTable.children('tr').each(function() {

        let className     = 'status-missing';
        // let elemRefItem   = $(this);
        // let dmsIdBaseItem = $(this).attr('data-link').split('/')[6];
        // let variantItem   = getMatchingVariantItem(response.data.nodes, response.data.edges, wsVariants.fieldLinkVariantBaseItem, dmsIdBaseItem);

        // console.log(variantItem);

        // if(variantItem === null) {
            // className = 'status-missing';
            // variantItem = validateMatch(response.data.nodes, response.data.edges, elemRefItem);
            // if(variantItem !== null) {
            //     className = 'identical';
            // } else {
                variantItem = {
                    'link'      : '',
                    'urn'       : '',
                    'title'     : '',
                    'quantity'  : '',
                    'number'    : '',
                    'edgeId'    : '',
                    'edgeIdRef' : '',
                    'fields'    : []
                }
            // }
        // }
        // console.log(variantItem);


        // if(className !== 'missing') {
        //     if(variantItem !== null) {
        //         if(parseInt($(this).attr('data-number')) !== variantItem.number) {
        //             console.log(variantItem);
        //             className = 'changed-bom';
        //         } else if(parseFloat($(this).attr('data-quantity')) !== parseFloat(variantItem.quantity)) {
        //             className = 'changed-bom';
        //         }
        //     }
        // }

        let elemSpacerBody = elemCellSpacer.clone();
            elemSpacerBody.addClass('variant-index-' + indexVariant);
            elemSpacerBody.appendTo($(this));
        
        for(fieldVariant of fieldsVariant) {

            let elemCellField = $('<td></td>');
                elemCellField.addClass('variant-filter');
                elemCellField.addClass('field-value');
                elemCellField.addClass('variant-index-' + indexVariant);
                elemCellField.appendTo($(this));

            let elemControl = fieldVariant.control.clone();
                elemControl.appendTo(elemCellField);
                elemControl.click(function(e) {
                    e.stopPropagation();
                });
                elemControl.change(function() {
                    valueChanged($(this));
                });

            // for(field of variantItem.fields) {

            //     if(field.id === fieldVariant.id) {

            //         switch (fieldVariant.type) {

            //             case 'Single Selection':
            //                 elemControl.val(field.value.link);
            //                 break;

            //             default:
            //                 elemControl.val(field.value);
            //                 break;

            //         }

            //     }
            // }

        }

        let elemCellItem = $('<td></td>');
            elemCellItem.attr('data-link'       , variantItem.link);
            elemCellItem.attr('data-edgeid'     , variantItem.edgeId);
            elemCellItem.attr('data-edgeid-ref' , variantItem.edgeIdRef);
            elemCellItem.attr('data-quantity'   , variantItem.quantity);
            elemCellItem.attr('data-number'     , variantItem.number);
            // elemCellItem.attr('data-link-parent', variantItem.parent);
            elemCellItem.attr('data-link-root'  , link);
            elemCellItem.addClass('variant-filter');
            elemCellItem.addClass('variant-index-' + indexVariant);
            elemCellItem.addClass('variant-item');
            elemCellItem.addClass(className);
            elemCellItem.html();
            elemCellItem.appendTo($(this));
            elemCellItem.click(function(e) {
                clickItemCell(e, $(this));
            });

    });

}


// User clicks on item cells
function clickItemCell(e, elemClicked) {

    console.log('clickItemCell');

    e.preventDefault();
    e.stopPropagation();

    let link = elemClicked.attr('data-link');
    let elemParent = $('#item-variants-list');
    
    if((e.shiftKey) && !isBlank(link)) {

        openItemByLink(link);

    } else {

        $('#item-variants-list-parent-processing').show();
        $('#main').addClass('with-item-variants');
        $('#main').removeClass('with-details');
        $('.item-cell-clicked').removeClass('item-cell-clicked');

        elemParent.html('');
        
        let elemRow         = elemClicked.closest('tr');
        let title           = elemRow.children().first().find('.bom-tree-title').html();
        let selectedDMSID   = elemRow.attr('data-dmsid');

        viewerResetColors();
        viewerSelectModel(elemRow.attr('data-part-number'));

        elemRow.addClass('selected');
        elemRow.siblings().removeClass('selected');
        elemClicked.addClass('item-cell-clicked');
        
        $('#item-variants-title').html(title);

        let requestId = new Date();
            requestId = requestId.getTime();

        elemParent.attr('data-timestamp', requestId);

        let params = {
            wsId : wsVariants.id,
            fields : [
                'DESCRIPTOR',
                config.variants.fieldIdVariantBaseItem
            ],
            filter : [{
                field       : config.variants.fieldIdVariantBaseItem,
                type        : 0,
                comparator  : 15,
                value       : selectedDMSID 
            }],
            sort : ['DESCRIPTOR'],
            requestId : requestId
        }

        for(field of fieldsVariant) { params.fields.push(field.id); }

        $.get( '/plm/search', params, function(response) {

            if(response.params.requestId !== elemParent.attr('data-timestamp')) return;

            $('#item-variants-list-parent-processing').hide();

            for(entry of response.data.row) {

                let title    = '';
                let subtitle = '<table>';

                for(field of entry.fields.entry) {
                    if(field.key === 'DESCRIPTOR') title = field.fieldData.value;
                }

                for(let index = 2; index <response.data.columnKey.length; index++) {

                    let column = response.data.columnKey[index];

                    subtitle += '<tr><td class="tile-key-label">' + column.label + '</td><td class="tile-key-' + column.value + '">';

                    for(field of entry.fields.entry) {
                        if(field.key === column.value) subtitle += field.fieldData.value;
                    }

                    subtitle += '</td></tr>';

                }

                subtitle += '</table>';

                let elemTile = genTile('/api/v3/workspaces/' + wsVariants.id + '/items/' + entry.dmsId, null, null, 'settings', title, subtitle);
                    elemTile.appendTo(elemParent);
                    elemTile.click(function(e) {
                        if(e.shiftKey) openItemByLink($(this).attr('data-link'));
                        else insertSelectedItem($(this));
                    });

            }
            
        });

    }

}
function insertSelectedItem(elemClicked) {

    let elemCell = $('.item-cell-clicked').first();
        elemCell.attr('data-link', elemClicked.attr('data-link'));
        // elemCell.addClass('changed-item');
        elemCell.addClass('change-item');
        // elemCell.removeClass('missing');
        elemCell.html(elemClicked.find('.tile-title').html());

    let index = fieldsVariant.length - 1;
    let elemCellField = elemCell.prev();

    do {

        let value           = '';
        let elemCellValue   = elemClicked.find('.tile-key-' + fieldsVariant[index].id);
        let elemInput       = elemCellField.children().first();

        if(elemCellValue.length > 0) value = elemCellValue.html();

        if(elemInput.is('select')) {
            elemInput.find('option[displayValue="' + value + '"]').attr('selected','selected');
        } else {
            elemInput.val(value);
        }

        index--;
        elemCellField = elemCellField.prev();

    } while (index >= 0);

    // $('#main').removeClass('with-item-variants');

}


// APS Viewer
function onViewerSelectionChanged(event) {

    if(disableViewerSelectionEvent) return;

    let found = false;

    if(viewer.getSelection().length === 0) {

        return;

    } else {

        viewer.getProperties(event.dbIdArray[0], function(data) {

            for(property of data.properties) {

                if(viewerOptions.partNumberProperties.indexOf(property.displayName) > -1) {

                    let partNumber = property.displayValue;

                    $('#variants-table').children().each(function() {
                        if($(this).attr('data-part-number') === partNumber) {
                            $(this).addClass('selected');
                            let link = $(this).attr('data-link');
                            let requests = [
                                $.get('/plm/details' , { 'link' : link }),
                                $.get('/plm/sections', { 'link' : link }),
                                $.get('/plm/fields'  , { 'link' : link }),
                            ];
                        
                            Promise.all(requests).then(function(responses) {
                                insertItemDetailsFields($('#sections'), '', responses[1].data, responses[2].data, responses[0].data, false, true, false);
                                $('#details-processing').hide();
                            });
                        
                        } else {
                            $(this).removeClass('selected');
                        }
                    });


                }

            }

        });

    }

}
function initViewerDone() {

    viewerAddGhostingToggle();
    viewerAddViewsToolbar();

}


// Create New Variant
function createNewVariant() {

    submitCreateForm(wsVariants.id, $('#create-sections'), null, function(response) {

        let linkVariant = response.data.split('.autodeskplm360.net')[1];

        $.get('/plm/details', { 'link' : linkContext }, function(response) {

            let requests        = [];
            let valueVariants   = [];
            let listCurrent     = getSectionFieldValue(response.data.sections, config.variants.fieldIdItemVariants, []);
            let nextID          = ('00' + (listCurrent.length + 1)).slice(-3);

            for(entry of listCurrent) valueVariants.push(entry.link);

            valueVariants.push(linkVariant);
            
            let paramsItem = { 
                'link'      : linkContext, 
                'sections'  : [{
                    'id'        : getFieldSectionId(wsContext.sections, config.variants.fieldIdItemVariants),
                    'fields'    : [{
                        'fieldId'   : config.variants.fieldIdItemVariants, 
                        'value'     : valueVariants, 
                        'type'      : 'multi-linking-picklist' 
                    }]
                }] 
            }

            requests.push($.get('/plm/edit', paramsItem));

            let paramsVariant = {
                'link'      : linkVariant,
                'sections'  : [{
                    'id' : wsVariants.sectionIdBaseItem,
                    'fields' : [
                        { 'fieldId' : 'NUMBER', 'value' : baseItemNumber },
                        { 'fieldId' : 'ID'    , 'value' : nextID }
                    ]
                }]
            }

            requests.push($.get('/plm/edit', paramsVariant));

            Promise.all(requests).then(function(responses) {
                $.get('/plm/descriptor', { 'link' : linkVariant }, function(response) {
                    $('#overlay').hide();
                    insertNewVariant(linkVariant, response.data);
                });
            });
        });

    });

}


// Highlight item in viewer and display item details upon selection in BOM
function selectBOMItem(e, elemClicked) {

    elemClicked.toggleClass('selected');
    elemClicked.siblings().removeClass('selected');
    
    if(elemClicked.hasClass('selected')) {

        $('#details-content').html('');
        $('#details-processing').show();

        let link       = elemClicked.attr('data-link');
        let partNumber = elemClicked.attr('data-part-number');

        insertItemDetails(link);
        viewerResetColors();
        viewerSelectModel(partNumber);

    } else {

        insertItemDetails(linkContext);
        viewerResetSelection(true);

    }

}



// Apply Changes to PLM
function setSaveActions() {

    // console.log(' >> setSaveActions START');

    pendingActions = [0,0,0,0,0];

    let levelUpdate = 1;

    // item creation
    // item updates
    // bom removals
    // bom additions
    // bom updates

    $('.variant-item').each(function() {

        let elemVariant = $(this);

        if(elemVariant.hasClass('change-item')) {

            elemVariant.addClass('pending-addition'); pendingActions[3]++;

            if(elemVariant.hasClass('status-identical')) {
                elemVariant.addClass('pending-removal'); pendingActions[2]++;
            } else if(elemVariant.hasClass('status-match')) {
                elemVariant.addClass('pending-removal'); pendingActions[2]++;
            }

        } else if(elemVariant.hasClass('change-bom')) {

            if(elemVariant.hasClass('status-missing')) {
                elemVariant.addClass('pending-addition'); pendingActions[3]++;
            } else {
                elemVariant.addClass('pending-update-bom'); pendingActions[4]++;
            }

        } else if(elemVariant.hasClass('change-properties')) {

            if(elemVariant.hasClass('status-match')) {
                elemVariant.addClass('pending-update-item'); pendingActions[1]++;
            } else {
                elemVariant.addClass('pending-creation'); pendingActions[0]++;
                elemVariant.addClass('pending-addition'); pendingActions[3]++;

                if(elemVariant.hasClass('status-identical')) {
                    elemVariant.addClass('pending-removal'); pendingActions[2]++;
                }

            }

        } else if(elemVariant.hasClass('status-missing')) {

            elemVariant.addClass('pending-addition'); pendingActions[3]++;

        }            

    });


    // $('.variant-item.missing').each(function() { 
    //     let level = Number($(this).parent().attr('data-level'));
    //     if(level === levelUpdate) {
    //         $(this).addClass('pending-addition');           
    //         pendingActions[3]++;
    //     } else {
    //         $(this).addClass('identical');   
    //         $(this).removeClass('missing');   
    //     }
    // });


    // $('.variant-item.missing').each(function() { 
    //     let level = Number($(this).parent().attr('data-level'));
    //     if(level === levelUpdate) {
    //         $(this).addClass('pending-addition');           
    //         pendingActions[3]++;
    //     } else {
    //         $(this).addClass('identical');   
    //         $(this).removeClass('missing');   
    //     }
    // });

    // $('.variant-item.new-item').each(function() {
    //     $(this).addClass('pending-creation');           pendingActions[0]++;
    //     $(this).addClass('pending-addition');           pendingActions[3]++;
    // });

    // $('.variant-item.replaced-item').each(function() {
    //     $(this).addClass('pending-removal');            pendingActions[2]++;
    //     $(this).addClass('pending-addition');           pendingActions[3]++;
    // });

    // $('.variant-item.changed-item').each(function() {
    //     // let isNewVariant =  
    //     if($(this).hasClass('identical') || $(this).hasClass('missing')) {
    //         if(isBlank($(this).attr('data-link'))) {
    //             // $(this).addClass('pending-creation');      
    //             //  pendingActions[0]++;
    //         } else {
    //             $(this).addClass('pending-addition');       
    //             pendingActions[3]++;
    //         }
    //         $(this).addClass('pending-removal');        pendingActions[2]++;
    //         setPendingAddition($(this));
    //     } else {
    //         $(this).addClass('pending-update-item');    pendingActions[1]++;
    //     }
    // });

    // $('.variant-item.changed-bom').each(function() { 
    //     $(this).addClass('pending-update-bom');         pendingActions[4]++;
    // });

    console.log(pendingActions);

}
function showSaveProcessingDialog() {
   
    $('.step-bar').addClass('transition-stopper')
    $('.step-bar').css('width', '0%');
    $('#overlay').show();
    $('#confirm-saving').addClass('disabled').removeClass('default');
    $('.in-work').removeClass('in-work');
    $('#step1').addClass('in-work');
    $('.step-bar').removeClass('transition-stopper');
    
    $('#step-counter1').html('0 of ' + pendingActions[0]);
    $('#step-counter2').html('0 of ' + pendingActions[1]);
    $('#step-counter3').html('0 of ' + pendingActions[2]);
    $('#step-counter4').html('0 of ' + pendingActions[3]);
    $('#step-counter5').html('0 of ' + pendingActions[4]);
    
    $('#dialog-saving').show();

    createNewItems();

}
function setPendingAddition(elemParent) {

    let elemRefItem = elemParent.closest('tr');
    let elemNext    = elemRefItem.next();

    if(!elemParent.hasClass('pending-addition')) {
        elemParent.addClass('pending-addition');   
        pendingActions[3]++;
    }

    if(elemNext.length === 0) return;

    let level       = Number(elemRefItem.attr('data-level')) + 1;
    let levelNext   = Number(elemNext.attr('data-level')) ;
    let index       = elemParent.index();

    while(levelNext >= level) {

        console.log(levelNext);

        if(elemNext.length === 0) levelNext = -1;

        if(levelNext === level) {
            elemNext.children().eq(index).addClass('pending-addition');
            pendingActions[3]++;
        }

        elemNext = elemNext.next();

        if(elemNext.length === 0) return;

        levelNext = Number(elemNext.attr('data-level')) ;


    }

}
function createNewItems() {

    // console.log(' >> createNewItems START');

    let pending  = $('.variant-item.pending-creation').length;
    let progress = (pendingActions[0] - pending) * 100 / pendingActions[0];

    $('#step-bar1').css('width', progress + '%');
    $('#step-counter1').html((pendingActions[0] - pending) + ' of ' + pendingActions[0]);


    if(pending > 0) {
        
        let requests = [];
        let elements = [];

        $('.variant-item.pending-creation').each(function() {

            if(requests.length < maxRequests) {

                let elemRefItem     = $(this).closest('tr');
                let elemCellControl = $(this).prev();

                let params = {
                    'wsId' : wsVariants.id,
                    'sections' : [{
                        'id' : wsVariants.sectionIdBaseItem,
                        'fields' : [
                            { 'fieldId' : wsVariants.fieldIdVariantBaseItem, 'value' : elemRefItem.attr('data-link').split('/')[6] }
                        ]
                    },{
                        'id' : wsVariants.sectionIdVariansSection,
                        'fields' : []          
                    }]
                };


                for(let index = fieldsVariant.length - 1; index >= 0; index--) {

                    let field = fieldsVariant[index];
                    let value = elemCellControl.children().first().val();

                    if(field.type === 'Single Selection') value = { 'link' : value };

                    params.sections[1].fields.push({
                        'fieldId' : field.id, 'value' : value
                    });

                    elemCellControl = elemCellControl.prev();

                }

                requests.push($.post('/plm/create', params));
                elements.push($(this));

            }

        });

        Promise.all(requests).then(function(responses) {

            requests = [];
            let errors = false;

            for(response of responses) {

                if(response.error) {
                    showErrorMessage(response.data.message, 'Error');
                    errors = true;
                } else {
                    requests.push($.get('/plm/descriptor', {
                        'link' : response.data.split('.autodeskplm360.net')[1]
                    }));
                }
            }

            if(errors) {
                endProcessing();
                
            } else {
                Promise.all(requests).then(function(responses) {

                    let index = 0;

                    for(response of responses) {

                        let elemItem = elements[index++];
                            elemItem.html(response.data);
                            elemItem.attr('data-link', response.params.link);
                            elemItem.addClass('status-match');
                            elemItem.removeClass('status-identical');
                            elemItem.removeClass('pending-creation');
                            // elemItem.addClass('pending-addition');

                    }

                    createNewItems(); 

                });
            } 

        });

    } else {

        $('#step-bar1').css('width', '100%');
        $('#step1').removeClass('in-work');
        $('#step2').addClass('in-work');
        $('#step-counter1').html(pendingActions[0] + ' of ' + pendingActions[0]);

        updateItems();

    }

}
function updateItems() {

    // console.log(' >> updateItems START');

    let pending  = $('.variant-item.pending-update-item').length;
    let progress = (pendingActions[1] - pending) * 100 / pendingActions[1];

    $('#step-bar2').css('width', progress + '%');
    $('#step-counter2').html((pendingActions[1] - pending) + ' of ' + pendingActions[1]);
    
    if(pending > 0) {
        
        let requests = [];
        let elements = [];

        $('.variant-item.pending-update-item').each(function() {

            if(requests.length < maxRequests) {

                let elemCellControl = $(this).prev();

                let params = {
                    'link' : $(this).attr('data-link'),
                    'sections' : [{
                        'id' : wsVariants.sectionIdVariansSection,
                        'fields' : []          
                    }]
                };

                for(let index = fieldsVariant.length - 1; index >= 0; index--) {

                    let field = fieldsVariant[index];
                    let value = elemCellControl.children().first().val();

                    params.sections[0].fields.push({
                        'fieldId' : field.id, 'value' : value, 'type' : field.type
                    });

                    elemCellControl = elemCellControl.prev();

                }                

                requests.push($.get('/plm/edit', params));
                $(this).removeClass('pending-update-item');
                $(this).removeClass('change-properties');
                $(this).addClass('processing-item');

                elements.push($(this));

            }

        });    
        
        Promise.all(requests).then(function(responses) {
            for(element of elements) element.removeClass('processing-item').addClass('status-match');
            updateItems(); 
        });

    } else {

        $('#step-bar2').css('width', '100%');
        $('#step2').removeClass('in-work');
        $('#step3').addClass('in-work');
        $('#step-counter2').html(pendingActions[1] + ' of ' + pendingActions[1]);

        deleteBOMItems();

    }

}
function deleteBOMItems() {

    // console.log(' >> deleteBOMItems START');

    let pending  = $('.variant-item.pending-removal').length;
    let progress = (pendingActions[2] - pending) * 100 / pendingActions[2];

    $('#step-bar3').css('width', progress + '%');
    $('#step-counter3').html((pendingActions[2] - pending) + ' of ' + pendingActions[2]);

    if(pending > 0) {
        
        let requests = [];
        

        $('.variant-item.pending-removal').each(function() {

            if(requests.length < maxRequests) {

                let elemItem = $(this);
                let linkParent = elemItem.attr('data-link-parent');

                if(!isBlank(linkParent)) {

                    let params = {
                        'wsId'  : linkParent.split('/')[4],
                        'dmsId' : linkParent.split('/')[6],
                        'edgeId': elemItem.attr('data-edgeid')
                    };

                    requests.push($.get('/plm/bom-remove', params));

                }

                elemItem.removeClass('pending-removal');
                elemItem.attr('data-edgeid', '');

            }

        });

        Promise.all(requests).then(function(responses) {
        
            deleteBOMItems();
        
        });

    } else {

        $('#step-bar3').css('width', '100%');
        $('#step3').removeClass('in-work');
        $('#step4').addClass('in-work');
        $('#step-counter3').html(pendingActions[2] + ' of ' + pendingActions[2]);

        addBOMItems();

    }

}  
function addBOMItems() {

    // console.log(' >> addBOMItems START');

    let pending  = $('.variant-item.pending-addition').length;
    let progress = (pendingActions[3] - pending) * 100 / pendingActions[3];

    $('#step-bar4').css('width', progress + '%');
    $('#step-counter4').html((pendingActions[3] - pending) + ' of ' + pendingActions[3]);

    if(pending > 0) {
        
        let requests = [];
        let elements = [];

        $('.variant-item.pending-addition').each(function() {

            if(requests.length < maxRequests) {

                // elemItem.attr('data-link-parent', getParentLink());

                let elemItem    = $(this);
                // let linkParent  = elemItem.attr('data-link-parent');
                let linkParent  = getParentLink(elemItem);
                let linkItem    = elemItem.attr('data-link');
                let refItem     = elemItem.closest('tr');
                // let level       = refItem.attr('data-level');

                elemItem.attr('data-link-parent', linkParent);

                if(isBlank(linkItem)) {
                    if(elemItem.hasClass('status-missing')) linkItem = refItem.attr('data-link');
                }

                let params = {
                    'wsIdParent'    : linkParent.split('/')[4],
                    'dmsIdParent'   : linkParent.split('/')[6],
                    'wsIdChild'     : linkItem.split('/')[4],
                    'dmsIdChild'    : linkItem.split('/')[6],
                    'qty'           : refItem.attr('data-quantity'),
                    'number'        : refItem.attr('data-number'),
                    'pinned'        : true,
                    'fields'        : [
                        { 'link' : wsVariants.colIdRefEdgeId, 'value' : refItem.attr('data-edgeid') }
                    ]
                }

                requests.push($.get('/plm/bom-add', params));
                elements.push(elemItem);
                elemItem.removeClass('pending-update-bom');
                elemItem.removeClass('change-properties');
                elemItem.removeClass('change-bom');
                elemItem.addClass('processing-item');

            }

        });

        Promise.all(requests).then(function(responses) {
            
            let index = 0;

            for(response of responses) {
                let elemItem = elements[index++];
                    elemItem.removeClass('pending-addition');
                    elemItem.removeClass('processing-item');
                    elemItem.attr('data-edgeid', response.data.split('/bom-items/')[1]);
                    
                if(elemItem.hasClass('change-item')) {
                    elemItem.removeClass('change-item');
                    elemItem.addClass('status-match');
                } else if(elemItem.hasClass('status-missing')) {
                    elemItem.addClass('status-identical');
                }

                elemItem.removeClass('status-missing');

            }

            addBOMItems();

        });

    } else {

        $('#step-bar4').css('width', '100%');
        $('#step4').removeClass('in-work');
        $('#step-counter4').html(pendingActions[3] + ' of ' + pendingActions[3]);

        updateBOMItems();

    }

}
function getParentLink(elemItem) {

    let elemRefItem = elemItem.closest('tr');
    let level       = Number(elemRefItem.attr('data-level')) - 1;
    let index       = elemItem.index();
    let result      = '';

    if(level === 0) return elemItem.attr('data-link-root');

    elemRefItem.prevAll('tr').each(function() {
        let newLevel = Number($(this).attr('data-level'));
        if(result === '') {
            if(newLevel === level) {
                result = $(this).children().eq(index).attr('data-link');
                return result;
            } 
        }
    });

    return result;

}
function updateBOMItems() {       
        
    // console.log(' >> updateBOMItems START');

    let pending  = $('.variant-item.pending-update-bom').length;
    let progress = (pendingActions[4] - pending) * 100 / pendingActions[4];

    $('#step-bar5').css('width', progress + '%');
    $('#step-counter5').html((pendingActions[4] - pending) + ' of ' + pendingActions[4]);

    if(pending > 0) {

        let requests = [];
        let elements = [];

        $('.variant-item.pending-update-bom').each(function() {

            if(requests.length < maxRequests) {

                let elemItem    = $(this);
                let elemRefItem = elemItem.closest('tr');
                // let edNumber     = elemItem.attr('data-number');
                // let paramsChild  = elemItem.attr('data-link').split('/');
                // let paramsParent = elemParent.attr('data-link').split('/');
                // let urnMBOM      = elemItem.attr('data-urn-mbom');
                // let edQty        = elemItem.find('.item-qty-input').first().val();

                // if(typeof urnMBOM !== 'undefined') {
                //     let data = elemItem.attr('data-urn-mbom').split('.');
                //     paramsChild[4] = data[4];
                //     paramsChild[6] = data[5];
                // }

                let params = {                    
                    'wsIdParent'  : elemItem.attr('data-link-parent').split('/')[4],
                    'wsIdChild'   : elemItem.attr('data-link').split('/')[4],
                    'dmsIdParent' : elemItem.attr('data-link-parent').split('/')[6],
                    'dmsIdChild'  : elemItem.attr('data-link').split('/')[6],
                    'edgeId'      : elemItem.attr('data-edgeid'),
                    'number'      : elemRefItem.attr('data-number'),
                    'qty'         : elemRefItem.attr('data-quantity'),
                    'pinned'      : true
                };

                requests.push($.get('/plm/bom-update', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            let index = 0;

            for(response of responses) {

                let elemItem = elements[index++];
                    elemItem.removeClass('pending-update-bom');
                    elemItem.removeClass('change-bom');
                    elemItem.addClass('status-match');
                    elemItem.attr('data-number', response.params.number);
                    elemItem.attr('data-quantity', response.params.qty);
        
            }

            updateBOMItems();

        });

    } else {

        $('#step-bar5').css('width', '100%');
        $('#step5').removeClass('in-work');
        $('#step-counter5').html(pendingActions[4] + ' of ' + pendingActions[4]);

        endProcessing();

    }
    
}
function endProcessing() {

    // console.log('>> endProcessing START');

    $('#overlay').show();
    $('#confirm-saving').removeClass('disabled').addClass('default');
    $('.in-work').removeClass('in-work');    

}