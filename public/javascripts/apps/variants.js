let maxRequests     = 4;

let wsContext       = { 'id' : '', 'sections'  : [], 'fields' : [] }
let wsVariants      = { 'id' : '', 'sections'  : [], 'fields' : [], 'bomViews' : [], 'viewId' : '', 'tableau' : '' }
let listVariants    = [];
let fieldsVariant   = [];
let classesViewer   = [ 'standard', 'viewer-left', 'viewer-off'];
let modeViewer      = 0;
let linkContext     = '/api/v3/workspaces/' + wsId + '/items/' + dmsId;
let pendingActions;

let paramsSummary = {
    bookmark        : true,
    openInPLM       : true,
    hideCloseButton : true,
    layout          : 'tabs',
    contents        : [{ 
        type         : 'details',
        params       : { 
            id               : 'item-details', 
            hideHeaderLabel  : true,
            editable : true,
            toggles          : true,
            collapseContents : true
        }
    }, { 
        type        : 'attachments',
        params      : { 
            id         : 'item-attachments',
            hideHeaderLabel : true,
            editable        : true,
            singleToolbar   : 'controls',
            contentSize     : 'xl'
        }
    }, { 
        type        : 'bom',
        params      : { 
            id      : 'item-bom',
            headerLabel : 'BOM',
            hideHeaderLabel  : true,
            search           : true,
            toggles          : true,
            collapseContents : true
        }
    }, { 
        type        : 'relationships',
        params      : { 
            id         : 'item-relationships',
            hideHeader : true
        }
    }, { 
        type        : 'change-processes',
        params      : { 
            id         : 'item-change-processes',
            headerLabel : ' Processes',
            hideHeader : true
        }
    }]
}


$(document).ready(function() {

    wsContext.id  = wsId;
    wsVariants.id = config.variants.wsIdItemVariants;

    appendOverlay(true);
    setUIEvents();

    let params = {
        wsId   : wsVariants.id,
        fields : [ 'TITLE', config.variants.fieldIdVariantBaseItem ],
        sort   : ['TITLE'],
        filter : [{
            field       : config.variants.fieldIdVariantBaseItem,
            type        : 0,
            comparator  : 15,
            value       : dmsId
        }]
    }

    getFeatureSettings('variants', [$.get( '/plm/search', params)], function(responses) {
        getInitialData(responses[0]);
        insertViewer(linkContext);
        insertItemSummary(linkContext, paramsSummary);
    });
    
});

function setUIEvents() {

    // Header Toolbar
    $('#button-create-variant').click(function() {

        if($(this).hasClass('disabled')) return;

        insertCreate(null, [wsVariants.id], { 
            id                : 'create',
            createButtonIcon  : '',
            createButtonLabel : 'Submit',
            headerLabel       : 'Create new variant',
            hideComputed      : true,
            fieldsIn          : ['TITLE'],
            fieldValues       : [{
                fieldId       : config.variants.fieldIdVariantBaseItem,
                value         : dmsId
            }],
            hideSections      : true,
            afterCreation     : function(id, link) { addNewVariant(link); }
        });
    });
    $('#button-toggle-viewer').click(function() {
        for(let className of classesViewer) $('body').removeClass(className);
        modeViewer = ++modeViewer % classesViewer.length;
        $('body').addClass(classesViewer[modeViewer]);
        viewerResize();
    });
    $('#button-toggle-details').click(function() {
        $('body').toggleClass('with-summary');
        viewerResize();
    });

    // Save Confirmation Dialog
    $('#confirm-saving').click(function() {
        if($(this).hasClass('disabled')) return;
        else {
            $('#overlay').hide();
            $('#dialog-saving').hide();
        }
    });

}


// Get item details to pull further information from PLM
function getInitialData(variants) {

    let requests = [
        $.get('/plm/details'              , { wsId : wsContext.id,  dmsId    : dmsId }),
        $.get('/plm/sections'             , { wsId : wsContext.id,  useCache : true  }),
        $.get('/plm/sections'             , { wsId : wsVariants.id, useCache : true  }),
        $.get('/plm/fields'               , { wsId : wsVariants.id, useCache : true  }),
        $.get('/plm/bom-views-and-fields' , { wsId : wsVariants.id, useCache : true  })
    ];

    Promise.all(requests).then(function(responses) {

        $('#header-subtitle').html(responses[0].data.title);

        document.title = documentTitle + ': ' + responses[0].data.title;

        for(let variant of variants.data.row) {
            listVariants.push({
                label : getSearchResultFieldValue(variant, 'TITLE', ''),
                link  : '/api/v3/workspaces/' + wsVariants.id + '/items/' + variant.dmsId
            });
        }

        wsContext.sections  = responses[1].data;
        wsVariants.sections = responses[2].data;
        wsVariants.fields   = responses[3].data;
        wsVariants.bomViews = responses[4].data;

        getVariantsWSConfig();

    });

}
function getVariantsWSConfig() {

    let foundSection = false;

    for(let section of wsVariants.sections) {

        if(section.name === config.variants.variantsSectionLabel) {

            foundSection = true;
            wsVariants.sectionIdVariansSection = section.__self__.split('/')[6];

            for(let sectionField of section.fields) {
                for(let field of wsVariants.fields) {
                    if(field.__self__ === sectionField.link) {

                        let elemControl = insertDetailsField(
                            field, 
                            null,  
                            null, 
                            false, 
                            {
                                editable      : true,
                                hideLabels    : true,
                                suppressLinks : true
                            }
                        );
                        
                        fieldsVariant.push({
                            id      : field.__self__.split('/')[8],
                            title   : sectionField.title,
                            type    : field.type.title,
                            control : elemControl
                        });

                    }
                }  
            }
        }
    }

    if(!foundSection) showErrorMessage('Error loading data', 'Cannot find section with name  ' + config.variants.variantsSectionLabel + ' in workspace ' +  config.variants.wsIdItemVariants + ' (wsIdItemVariants)');

    wsVariants.fieldIdVariantBaseItem   = config.variants.fieldIdVariantBaseItem;
    wsVariants.sectionIdBaseItem        = getFieldSectionId(wsVariants.sections, config.variants.fieldIdVariantBaseItem);

    for(let bomView of wsVariants.bomViews) {
        if(bomView.name === config.variants.bomViewNameVariants) {

            wsVariants.viewId = bomView.id;

            for(let field of bomView.fields) {

                if(field.fieldId === config.variants.fieldIdVariantBaseItem) {

                    wsVariants.fieldLinkVariantBaseItem = field.__self__.link;

                }

                     if(field.fieldId === 'QUANTITY'         ) wsVariants.colIdQuantity  = field.__self__.link;
                else if(field.fieldId === 'EDGE_ID_BASE_ITEM') wsVariants.colIdRefEdgeId = field.__self__.link;

                for(let fieldVariant of fieldsVariant) {
                    if(fieldVariant.id === field.fieldId) fieldVariant.link = field.__self__.link;
                }

            }

        }
    }

    $('#button-create-variant').removeClass('disabled');

    insertBOM(linkContext, { 
        headerLabel      : 'BOM & Variants', 
        bomViewName      : config.variants.bomViewNameItems, 
        reset            : true, 
        hideDetails      : false, 
        quantity         : true, 
        headers          : true,
        search           : true,
        toggles          : true,
        path             : true,
        counters         : false,
        collapseContents : true,
        viewerSelection  : true,
        columnsIn        : ['Item', 'Quantity'],
        onClickItem      : function(elemClicked) { setItemSummary(elemClicked); },
        afterCompletion  : function (id) { insertVariants(); }
    });

}
function insertVariants() {
    
    let elemControls = $('#bom-controls');

    let elemSelect = $('<select>').prependTo(elemControls)
        .addClass('button')
        .attr('id', 'variant-selector')
        .change(function() {
            if($(this).val() === 'all') {
                $('.variant-filter').show();
            } else {
                $('.variant-filter').hide();
                $('.variant-index-' + $(this).val()).show();
            }
        });

    $('<option></option>').appendTo(elemSelect)
        .attr('value', 'all')
        .html('Show all variants');

    $('<div></div>').prependTo(elemControls)
        .addClass('button')
        .addClass('with-icon')
        .addClass('icon-save')
        .addClass('default')
        .html('Save')
        .attr('id', 'button-save')
        .click(function() {
            if($(this).hasClass('disabled')) return;
            setSaveActions();
            showSaveProcessingDialog();
        });          

    let elemTHead = $('#bom-thead');
    
    elemTHead.children('tr').first().attr('id', 'table-head-row-titles');   

    $('<tr></tr>').prependTo(elemTHead)
        .attr('id', 'table-head-row-fields')
        .append('<th class="top-left-table-cell" colspan="1"></th>')
        .append('<th style="background:none" ></th>')

    let requests = [];

    // for(let variant of listVariants) setVariantLabel(variant);

    sortArray(listVariants, 'label');

    for(let variant of listVariants) requests.push($.get('/plm/bom', { link : variant.link, viewId : wsVariants.viewId } ));

    Promise.all(requests).then(function(responses) {
        let index = 0;
        for(let variant of listVariants) insertVariant(variant, index, responses[index++]);
    });

}


// Insert existing or new variants to the table
function insertVariant(variant, index, response) {
    
    insertVariantHeaderColumns(variant, index);
    insertVariantTableCells(variant, index, response);

    $('<option></option>').appendTo($('#variant-selector'))
        .attr('value', index)
        .html(variant.label);

}
// function setVariantLabel(variant) {

//     variant.label = variant.title.split(' - ').pop();

// }
function insertVariantHeaderColumns(variant, index) {

    let elemTHeadFields = $('#table-head-row-fields');
    let elemTHeadTitles = $('#table-head-row-titles');
    let elemSpacerHead  = $('<th></th>')
        .addClass('variant-spacer')
        .addClass('variant-filter')
        .addClass('variant-index-' + index);
            
    elemTHeadFields.append(elemSpacerHead.clone());
    elemTHeadTitles.append(elemSpacerHead.clone());

    $('<th></th>').appendTo(elemTHeadFields)
        .attr('colspan', fieldsVariant.length + 1)
        .attr('data-link', variant.link)
        .html(variant.label)
        .addClass('variant-head')
        .addClass('variant-filter')
        .addClass('variant-index-' + index)
        .click(function() {
            openItemByLink($(this).attr('data-link'));
        });

    for(let fieldVariant of fieldsVariant) {
        $('<th></th>').appendTo(elemTHeadTitles)
            .html(fieldVariant.title)
            .addClass('variant-filter')
            .addClass('variant-index-' + index)
            .addClass('field-id-' + fieldVariant.id.toLowerCase());
    }

    $('<th></th>').appendTo(elemTHeadTitles)
        .html('Item')
        .addClass('variant-filter')
        .addClass('variant-index-' + index);

}
function insertVariantTableCells(variant, index, response) {

    let elemCellSpacer = $('<th></th>').addClass('variant-spacer').addClass('variant-filter');

    $('#bom-tbody').children().each(function() {

        let className     = 'status-match';
        let elemRefItem   = $(this);
        let dmsIdBaseItem = $(this).attr('data-link').split('/')[6];
        let variantItem   = getMatchingVariantItem(response.data.nodes, response.data.edges, wsVariants.fieldLinkVariantBaseItem, dmsIdBaseItem);

        if(isBlank(variantItem)) {
            className = 'status-missing';
            variantItem = validateMatch(response.data.nodes, response.data.edges, elemRefItem);
            if(!isBlank(variantItem)) {
                className = 'status-identical';
            } else {
                variantItem = {
                    link      : '',
                    urn       : '',
                    title     : '',
                    quantity  : '',
                    number    : '',
                    edgeId    : '',
                    edgeIdRef : '',
                    fields    : []
                }
            }
        }

        if(className !== 'status-missing') {
            if(!isBlank(variantItem)) {
                if($(this).attr('data-number') != variantItem.number) {
                    console.log(variantItem);
                    className = 'change-bom';
                } else if(parseFloat($(this).attr('data-quantity')) !== parseFloat(variantItem.quantity)) {
                    className = 'change-bom';
                }
            }
        }

        elemCellSpacer.clone().appendTo($(this)).addClass('variant-index-' + index);

        for(let fieldVariant of fieldsVariant) {

            let elemCellField = $('<td></td>').appendTo($(this))
                .addClass('variant-filter')
                .addClass('field-value')
                .addClass('field-id-' + fieldVariant.id.toLowerCase())
                .addClass('variant-index-' + index);
                
            let elemControl = fieldVariant.control.clone();

            elemControl.appendTo(elemCellField)
                .click(function(e) {
                    e.stopPropagation();
                }).change(function() {
                    valueChanged($(this));
                });

            for(let field of variantItem.fields) {
                if(field.id === fieldVariant.id) {
                    let elemInput = elemControl.children().first();
                    switch (fieldVariant.type) {

                        case 'Single Selection':
                            elemInput.val(field.value.link);
                            break;

                        default:
                            elemInput.val(field.value);
                            break;

                    }
                }
            }

        }

        // let variantTitle = variantItem.title;
        // if(!isBlank(variantTitle)) {
        //     if(variantTitle.indexOf(' - ') > -1) { 
        //         variantTitle = variantTitle.split(' - ')[0] + '-' + variantTitle.split(' - ')[1];
        //     }
        // }

        let elemCellItem = $('<td></td>').appendTo($(this))
            .attr('data-link'       , variantItem.link)
            .attr('data-edgeid'     , variantItem.edgeId)
            .attr('data-edgeid-ref' , variantItem.edgeIdRef)
            .attr('data-quantity'   , variantItem.quantity)
            .attr('data-number'     , variantItem.number)
            .attr('data-link-parent', variantItem.parent)
            .attr('data-link-root'  , response.params.link)
            .attr('title', 'Use shift-click to open the related item in a new window')
            .addClass('variant-filter')
            .addClass('variant-index-' + index)
            .addClass('variant-item')
            .addClass(className)
            .html(getVariantNumber(variantItem.title))
            .click(function(e) {
                clickItemCell(e, $(this));
            });

        if(className === 'status-missing') {
            elemCellItem.addClass('icon')
                .addClass('icon-disconnect')
                .addClass('status-icon')
                .attr('title', 'No matching item in BOM yet');
        } else if(className === 'status-identical') {
            elemCellItem.addClass('icon')
                .addClass('icon-link')
                .addClass('status-icon')
                .attr('title', 'Using identical item, no variant');
        } else {
            elemCellItem.removeClass('icon')    
                .removeClass('icon-link')   
                .removeClass('icon-disconnect')    
                .removeClass('icon-status');    
        }

    });

}


// Function after new variant creation add it to the table
function addNewVariant(link) {

    let index = $('.variant-head').length + 1;

    $.get('/plm/details', { link : link}, function(response) {
        let label = response.data.title.split(' - ').pop();
        insertVariant({
            link :  link,
            label : label
        }, index, {
            data : {
                nodes : [],
                edges : []
            },
            params : {
                link : link
            }
        });
    });

}


// Match table cells to BOM rows
function getMatchingVariantItem(nodes, edges, fieldLink, value) {

    for(let node of nodes) {
        for(let field of node.fields) {
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

                    for(let fieldVariant of fieldsVariant) {
                        for(let nodeField of node.fields) {
                            if(nodeField.metaData.link === fieldVariant.link) {
                                result.fields.push({
                                    id    : fieldVariant.id,
                                    value : nodeField.value,
                                    link  : nodeField.metaData.link
                                });
                                // console.log(nodeField);
                                // nodeField.id = nodeField.__self__.split('/').pop();
                                // result.fields.push(nodeField);
                            }
                        }
                    }

                    for(let edge of edges) {
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

    for(let edge of edges) {
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

    for(let node of nodes) {
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

            for(let edge of edges) {
                if(edge.child === node.item.urn) {
                    for(let edgeField of edge.fields) {
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

    for(let edgeField of edge.fields) {
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


// Etract number from descriptor
function getVariantNumber(descriptor) {

    let result = descriptor;

    if(!isBlank(descriptor)) {
        let split = descriptor.split(' - ');
        result = split[0];
    }

    return result;

}


// Update item summary after item selection
function setItemSummary(elemClicked) {

    let link = (elemClicked.hasClass('selected')) ? elemClicked.attr('data-link') : linkContext;

    insertItemSummary(link, paramsSummary);

}


// User clicks on item cells
function clickItemCell(e, elemClicked) {

    e.preventDefault();
    e.stopPropagation();

    let linkItem    = elemClicked.closest('tr').attr('data-link');
    let linkVariant = elemClicked.attr('data-link');

    $('td').removeClass('item-cell-clicked');
    elemClicked.addClass('item-cell-clicked');

    if((e.shiftKey) && !isBlank(linkVariant)) {

        openItemByLink(linkVariant);

    } else if((e.shiftKey) && !isBlank(linkItem)) {

        openItemByLink(linkItem);

    } else {

        let queryFields = [];

        for(let fieldVariant of fieldsVariant) queryFields.push(fieldVariant.id);

        insertResults(
            wsVariants.id, 
            [{
                field       : config.variants.fieldIdVariantBaseItem,
                type        : 0,
                comparator  : 15,
                value       : linkItem.split('/').pop()
            }], {
                id              : 'selector',
                headerLabel     : 'Variants of ' + elemClicked.closest('tr').attr('data-title'),
                search          : true,
                number          : true,
                layout          : 'table',
                fields          : queryFields,
                openInPLM       : true,
                openOnDblClick  : true,
                sort            : ['TITLE'],
                afterCompletion : function(id) { addSelectorFooterButtons(id); }
            }
        )

    }
}
function addSelectorFooterButtons(id) {

    genPanelFooterActionButton(id, {}, 'cancel', { label : 'Cancel' }, function() {
        $('#selector-close').click();
    });

    genPanelFooterActionButton(id, {}, 'cancel', { label : 'Confirm', default : true }, function() {
        let elemSelected = $('#selector-tbody').find('.content-item.selected');
        if(elemSelected.length === 1) {
            insertSelectedItem(elemSelected);
        } else $('#selector-close').click();
    });

}
function insertSelectedItem(elemSelected) {

    $('#selector').hide();

    let elemCell = $('.item-cell-clicked').first()
        .attr('data-link', elemSelected.attr('data-link'))
        .addClass('change-item')
        .html(getVariantNumber(elemSelected.attr('data-title')))
        .removeClass('status-identical')
        .removeClass('pending-creation')
        .removeClass('icon')
        .removeClass('status-icon')
        .removeClass('icon-link')
        .removeClass('icon-disconnect');

    // let linkSelected = elemSelected.attr('data-link');

    console.log(elemCell.length);

    $.get('/plm/details', { link : elemSelected.attr('data-link')}, function(response) {
    
        console.log(response);
        
        $('#overlay').hide();
    
        let index         = fieldsVariant.length - 1;
        let elemCellField = elemCell.prev();

        do {

            let elemControl = elemCellField.children().first();
            let elemInput   = elemControl.children().first();
            let fieldId     = elemControl.attr('data-id');
            // let picklist    = elemControl.hasClass('picklist');
            let value       = getSectionFieldValue(response.data.sections, fieldId, '', 'link');

            // console.log(fieldId);
            // console.log(picklist);
            // console.log(value);

            // elemControl.val(value);


            elemInput.val(value);

            // switch (fieldVariant.type) {

            //     case 'Single Selection':
            //         elemInput.val(field.value.link);
            //         break;

            //     default:
            //         elemInput.val(field.value);
            //         break;

            // }





    //     let value           = '';
    //     let elemCellValue   = elemClicked.find('.tile-key-' + fieldsVariant[index].id);
    //     let elemInput       = elemCellField.children().first();

    //     if(elemCellValue.length > 0) value = elemCellValue.html();

    //     if(elemInput.is('select')) {
    //         elemInput.children('option').each(function() {
    //             if($(this).attr('displayValue') === value) {
    //                 value = $(this).attr('value');
    //             }
    //         });
    //     }
        
    //     elemInput.val(value);
            index--;
            elemCellField = elemCellField.prev();

        } while (index >= 0);

        elemCell.removeClass('item-cell-clicked');

    });

    // $('#main').removeClass('with-item-variants');

}


// APS Viewer
// function onViewerSelectionChanged(event) {

//     if(disableViewerSelectionEvent) return;

//     let found = false;

//     if(viewer.getSelection().length === 0) {

//         return;

//     } else {

//         viewer.getProperties(event.dbIdArray[0], function(data) {

//             for(let property of data.properties) {

//                 if(viewerOptions.numberProperties.indexOf(property.displayName) > -1) {

//                     let partNumber = property.displayValue;

//                     $('#variants-table').children().each(function() {
//                         if($(this).attr('data-part-number') === partNumber) {
//                             $(this).addClass('selected');
//                             let link = $(this).attr('data-link');
//                             let requests = [
//                                 $.get('/plm/details' , { 'link' : link }),
//                                 $.get('/plm/sections', { 'link' : link }),
//                                 $.get('/plm/fields'  , { 'link' : link }),
//                             ];
                        
//                             Promise.all(requests).then(function(responses) {
//                                 insertItemDetailsFields('', $('#sections'), responses[1].data, responses[2].data, responses[0].data, false, true, false);
//                                 $('#details-processing').hide();
//                             });
                        
//                         } else {
//                             $(this).removeClass('selected');
//                         }
//                     });


//                 }

//             }

//         });

//     }

// }



// Apply Changes to PLM
function setSaveActions() {

    console.log(' >> setSaveActions START');

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
                    wsId       : wsVariants.id,
                    sections   : [{
                        id     : wsVariants.sectionIdBaseItem,
                        fields : [{ 
                            fieldId : wsVariants.fieldIdVariantBaseItem, 
                            value   : elemRefItem.attr('data-link').split('/')[6] 
                        }]
                    },{
                        id     : wsVariants.sectionIdVariansSection,
                        fields : []          
                    }]
                };

                for(let index = fieldsVariant.length - 1; index >= 0; index--) {

                    // let field = fieldsVariant[index];
                    let data  = getFieldValue(elemCellControl.children().first());
                    // let value = elemCellControl.children().first().val();

                    // if(field.type === 'Single Selection') value = { 'link' : value };

                    params.sections[1].fields.push({
                        fieldId : data.fieldId,
                        value   : data.value
                    });

                    // let fieldValue = getFieldValue(elemCellControl.children().first());
                    // console.log(fieldValue);

                    elemCellControl = elemCellControl.prev();

                }

                console.log(params);

                requests.push($.post('/plm/create', params));
                elements.push($(this));

            }

        });

        Promise.all(requests).then(function(responses) {

            requests   = [];
            let errors = false;

            for(let response of responses) {

                if(response.error) {
                    showErrorMessage('Error', response.data.message);
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

                    for(let response of responses) {

                        elements[index++]
                            .html(getVariantNumber(response.data))
                            .attr('data-link', response.params.link)
                            .addClass('status-match')
                            .removeClass('status-identical')
                            .removeClass('pending-creation')
                            .removeClass('icon')
                            .removeClass('status-icon')
                            .removeClass('icon-link')
                            .removeClass('icon-disconnect');

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

    console.log(' >> updateItems START');

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
                    link       : $(this).attr('data-link'),
                    sections   : [{
                        id     : wsVariants.sectionIdVariansSection,
                        fields : []          
                    }]
                };

                for(let index = fieldsVariant.length - 1; index >= 0; index--) {

                    let data = getFieldValue(elemCellControl.children().first());

                    params.sections[0].fields.push({
                        fieldId : data.fieldId, 
                        value   : data.value, 
                        type    : data.type
                    });

                    elemCellControl = elemCellControl.prev();

                }       
                
                console.log(params);
                
                requests.push($.post('/plm/edit', params));
                elements.push($(this));

                $(this).removeClass('pending-update-item');
                $(this).removeClass('change-properties');
                $(this).addClass('processing-item');

            }

        });    
        
        Promise.all(requests).then(function(responses) {
            for(let element of elements) element.removeClass('processing-item').addClass('status-match');
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
                    'quantity'      : refItem.attr('data-quantity'),
                    'number'        : refItem.attr('data-number'),
                    'pinned'        : true,
                    'fields'        : [
                        { 'link' : wsVariants.colIdRefEdgeId, 'value' : refItem.attr('data-edgeid') }
                    ]
                }

                requests.push($.get('/plm/bom-add', params));
                elements.push(elemItem);
                elemItem.removeClass('pending-update-bom')
                    .removeClass('change-properties')
                    .removeClass('change-bom')
                    .addClass('processing-item');

            }

        });

        Promise.all(requests).then(function(responses) {
            
            let index = 0;

            for(let response of responses) {

                console.log(response);

                if(response.error) {
                    showErrorMessage('Error when adding BOM entries', response.data[0].message);
                    return;
                }

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

            for(let response of responses) {

                elements[index++].removeClass('pending-update-bom')
                    .removeClass('change-bom')
                    .addClass('status-match')
                    .attr('data-number', response.params.number)
                    .attr('data-quantity', response.params.qty);
        
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