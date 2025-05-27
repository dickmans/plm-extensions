let wsContext        = { id : '', sections  : [], fields : [] }
let wsVariants       = { id : '', sections  : [], fields : [], bomViews : [], viewId : '' }
let listVariants     = [];
let fieldsVariant    = [];
let variantBOMClenup = [];
let classesViewer    = [ 'standard', 'viewer-left', 'viewer-off'];
let modeViewer       = 0;
let urlParameters    = getURLParameters();
let derivedData;

let saveActions = {
    retrieval : {
        label       : 'Getting derived item details',
        className   : 'pending-retrieval',
        selector    : '.content-item',
        maxRequests : 5,
    },
    creation : {
        label       : 'Creating new item variants',
        className   : 'pending-creation',
        selector    : '.variant-item',
        maxRequests : 1,
    },
    removal : {
        label       : 'Deleting BOM entries',
        className   : 'pending-removal',
        selector    : '.variant-item',
        maxRequests : 5,
    },
    addition : {
        label        : 'Adding BOM entries',
        className   : 'pending-addition',
        selector    : '.variant-item',
        maxRequests : 5,
    },
    update : {
        label       : 'Updating existing BOM entries',
        className   : 'pending-update',
        selector    : '.variant-item',
        maxRequests : 5,
    }
}

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

    getFeatureSettings('variants', [$.get( '/plm/details', { link : urlParameters.link })], function(responses) {

        if(!isBlank(urlParameters.fieldidebom)) {
            urlParameters.product = urlParameters.link;
            urlParameters.link = getSectionFieldValue(responses[0].data.sections, urlParameters.fieldidebom, '', 'link');
            $.get( '/plm/details', { link : urlParameters.link }, function(response) {
                urlParameters.root = response.data.root.link;
                initEditor();
            });
        } else {
            urlParameters.root = responses[0].data.root.link;
            initEditor();
        }

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
            fieldsIn          : ['TITLE', config.variants.fieldIdBaseItem],
            contextItem       : urlParameters.link,
            contextItemFields : [ config.variants.fieldIdBaseItem ],
            fieldValues       : [{
                fieldId       : config.variants.fieldIdRootItemDmsId,
                value         : urlParameters.root.split('/').pop()
                // fieldId       : config.variants.fieldIdVariantBaseItem,
                // value         : dmsId
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
function initEditor() {
    getInitialData(urlParameters.root.split('/').pop());
    insertViewer(urlParameters.link);
    insertItemSummary(urlParameters.link, paramsSummary);
}
function getInitialData(rootDmsId) {

    let requests = [
        $.get('/plm/details'              , { link : urlParameters.link }),
        $.get('/plm/sections'             , { wsId : wsContext.id,  useCache : true  }),
        $.get('/plm/sections'             , { wsId : wsVariants.id, useCache : true  }),
        $.get('/plm/fields'               , { wsId : wsVariants.id, useCache : true  }),
        $.get('/plm/bom-views-and-fields' , { wsId : wsVariants.id, useCache : true  })
    ];

    requests.push($.post( '/plm/search', {
        wsId   : wsVariants.id,
        fields : [ 'TITLE', config.variants.fieldIdRootItemDmsId ],
        sort   : ['TITLE'],
        filter : [{
            field       : config.variants.fieldIdRootItemDmsId,
            type        : 0,
            comparator  : 15,
            value       : rootDmsId
        }]
    }));

    Promise.all(requests).then(function(responses) {

        $('#header-subtitle').html(responses[0].data.title);
        
        document.title = documentTitle + ': ' + responses[0].data.title;

        let variants = responses[5];

        if(variants.error) {
            showErrorMessage('Startup Error', 'An error occoured when searching for variants in workspace ' + variants.params.wsId + '. Your admin will find all search parameters and response data in the browser console to assist you.');
            console.log(variants);
        }

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
        if(section.name === config.variants.sectionLabelVariantDefinition) {
            
            foundSection = true;
            wsVariants.sectionIdVariantDefinition = section.__self__.split('/')[6];
            
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
    wsVariants.sectionIdBaseItem        = getFieldSectionId(wsVariants.sections, config.variants.fieldIdBaseItem);

    for(let bomView of wsVariants.bomViews) {
        if(bomView.name === config.variants.bomViewNameVariants) {

            wsVariants.viewId  = bomView.id;
            wsVariants.columns = bomView.fields;

            for(let field of bomView.fields) {

                if(field.fieldId === 'QUANTITY') wsVariants.colIdQuantity  = field.__self__.link;

                for(let fieldVariant of fieldsVariant) {
                    if(fieldVariant.id === field.fieldId) fieldVariant.link = field.__self__.link;
                }

            }

        }
    }

    if(isBlank(wsVariants.columns)) showErrorMessage('Error loading workspace configuration', 'Cannot find BOM view with name "' + config.variants.bomViewNameVariants + '" in workspace ' +  config.variants.wsIdItemVariants + ' (wsIdItemVariants)');

    $('#button-create-variant').removeClass('disabled');

    insertBOM(urlParameters.link, { 
        headerLabel       : 'BOM & Variants', 
        bomViewName       : config.variants.bomViewNameItems, 
        reload            : true, 
        hideDetails       : false, 
        includeOMPartList : true, 
        quantity          : true, 
        headers           : true,
        search            : true,
        toggles           : true,
        path              : true,
        counters          : false,
        collapseContents  : true,
        viewerSelection   : true,
        columnsIn         : ['Item', 'Quantity'],
        depth             : config.variants.maxBOMLevels,
        onClickItem       : function(elemClicked) { setItemSummary(elemClicked); },
        afterCompletion   : function (id, data) { insertVariants(id, data); }
    });

}
function insertVariants(id, data) {
    
    let elemControls = $('#bom-controls')

    if($('#variant-selector').length === 0) {

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
            .addClass('default')
            .html('Save')
            .attr('id', 'button-save')
            .click(function() {
                if($(this).hasClass('disabled')) return;
                setSaveActions();
                showSaveProcessingDialog();
            });          

    }

    let elemTHead = $('#bom-thead');
        elemTHead.children('tr').first().attr('id', 'table-head-row-titles');   

    $('<tr></tr>').prependTo(elemTHead)
        .attr('id', 'table-head-row-fields')
        .append('<th class="top-left-table-cell" colspan="2"></th>')
        .append('<th style="background:none" ></th>')
  

    let requests = [];

    sortArray(listVariants, 'label');

    for(let variant of listVariants) requests.push($.get('/plm/bom', { 
        link         : variant.link, 
        depth        : config.variants.maxBOMLevels,
        revisionBias : 'working',
        viewId       : wsVariants.viewId 
    } ));

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

    let elemCellSpacer      = $('<td></td>').addClass('variant-spacer').addClass('variant-filter');
    let variantBOMPartsList = getBOMPartsList({ columns : wsVariants.columns }, response.data);

    for(let variantBOMItem of variantBOMPartsList) variantBOMItem.hasMatch = false;

    $('#bom-tbody').children().each(function() {

        let className      = 'status-missing';
        let elemBaseItem   = $(this);
        let baseRootLink   = $(this).attr('data-root-link');
        let basePartNumber = $(this).attr('data-part-number');
        let baseQuantity   = $(this).attr('data-quantity');
        let status         = 'missing';
        let variantItem    = getVariantBOMItem(elemBaseItem, variantBOMPartsList);

        if(variantItem.edgeId !== '') {
            if(baseQuantity != variantItem.quantity) {
                status = 'update';
            } else if(baseRootLink === variantItem.root) {
                status = 'identical';
            } else if(basePartNumber === variantItem.details[config.variants.fieldIdBaseItemNumber]) {
                status = 'match';
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

                if(field.fieldId === fieldVariant.id) {
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

        let elemCellItem = $('<td></td>').appendTo($(this))
            .attr('data-link'       , variantItem.link)
            .attr('data-edgeid'     , variantItem.edgeId)
            .attr('data-edgeid-ref' , variantItem.edgeIdRef)
            .attr('data-quantity'   , variantItem.quantity)
            .attr('data-number'     , variantItem.number)
            .attr('data-link-parent', variantItem.parent)
            .attr('data-link-root'  , response.params.link)
            .attr('data-variant-id' , index)
            .attr('title', 'Use shift-click to open the related item in a new window')
            .addClass('variant-filter')
            .addClass('variant-index-' + index)
            .addClass('variant-item')
            .addClass(className)
            .click(function(e) {
                clickItemCell(e, $(this));
            });

        setVariantItemStyle(elemCellItem, status);

    });

    for(let variantBOMItem of variantBOMPartsList) {
        if(!variantBOMItem.hasMatch) {
            variantBOMClenup.push({
                link   : variantBOMItem.linkParent,
                edgeId : variantBOMItem.edgeId
            });
        }
    }

}
function setVariantItemStyle(elemCell, status) {

    let title = '';
    let icon  = ';'

    switch(status) {

        case 'missing'  : icon = 'disconnect' ; title = 'No matching item in variant BOM'; break;     // no item existent yet
        case 'identical': icon = 'link'       ; title = 'Variant uses generic design item'; break;    // matches base item
        case 'new'      : icon = 'contains'   ; title = 'A new variant item will be created'; break;  // variant parameter of formerly used base item has been changed, new variant item must be created
        case 'changed'  : icon = 'link-add'   ; title = 'Variant BOM requires update to link selected item'; break; // variant parameter of a variant item has been changed, new variant item must be created
        case 'replaced' : icon = 'link-update'; title = 'Variant BOM requires update to link replaced item'; break; // variant item got replaced with another variant
        case 'update'   : icon = 'link-update'; title = 'Variant BOM requires update due to BOM link property changes (ie Quantity)'; break; // bom relationship property got changed, but same item is still in place
        case 'match'    : icon = 'link'       ; title = 'Variant item has been created and linked'; break; // uses variant item, all data is in sync

    }

    elemCell.removeClass('processing-item')

    elemCell.removeClass('status-missing')
        .removeClass('status-identical')
        .removeClass('status-new')
        .removeClass('status-match')
        .removeClass('status-changed')
        .removeClass('status-replaced')
        .removeClass('status-update')
        .removeClass('status-icon');
    
    elemCell.addClass('status-' + status);
    
    elemCell.removeClass('icon-disconnect')
        .removeClass('icon-contains')
        .removeClass('icon-link')
        .removeClass('icon-link-add')
        .removeClass('icon-link-update')
        .removeClass('icon');

    if(!isBlank(icon)) {
        elemCell.addClass('status-icon')
            .addClass('icon')
            .addClass('icon-' + icon);
    }

    elemCell.attr('title', title);

}


// After new variant creation add it to the table and the product's grid
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

    if(!isBlank(urlParameters.product)) {

        let params = {
            link : urlParameters.product,
            data : [{
                fieldId : 'BOM',
                value : { link : link}
            }]
        }

        $.post('/plm/add-grid-row', params, function() {});
    }


}


// Match table cells to BOM rows
function getVariantBOMItem(elemBaseItem, variantBOMPartsList) {

    let baseNumberPath = elemBaseItem.attr('data-number-path');

    let result = {
        link       : '',
        root       : '',
        urn        : '',
        title      : '',
        partNumber : '',
        quantity   : '',
        number     : '',
        edgeId     : '',
        fields     : []
    }

    for(let variantBOMItem of variantBOMPartsList) {

        if(baseNumberPath === variantBOMItem.numberPath) {

            result.link       = variantBOMItem.link;
            result.root       = variantBOMItem.root;
            result.urn        = variantBOMItem.urn;
            result.title      = variantBOMItem.title;
            result.partNumber = variantBOMItem.partNumber;
            result.quantity   = variantBOMItem.quantity;
            result.number     = variantBOMItem.number;
            result.edgeId     = variantBOMItem.edgeId;
            result.fields     = variantBOMItem.fields;
            result.details    = variantBOMItem.details;

            variantBOMItem.hasMatch = true;

            break;

        }

    }

    return result;
    
}
function getEdgeQuantity(edge) {

    for(let edgeField of edge.fields) {
        if(edgeField.metaData.link === wsVariants.colIdQuantity) return edgeField.value;
    }

    return 0;

}
function valueChanged(elemControl) {

    let elemVariant = elemControl;

    if(!elemVariant.hasClass('variant-item')) elemVariant  = elemControl.parent().nextAll('.variant-item').first();

    let index        = elemVariant.index();
    let elemBaseItem = elemVariant.closest('tr');
    let levelNext    = Number(elemBaseItem.attr('data-level')) - 1;
    let elemPrev     = elemBaseItem.prev();
    let linkBaseItem = elemVariant.closest('tr').attr('data-link');
    let linkVariant  = elemVariant.attr('data-link');

    if(linkBaseItem === linkVariant) {
        setVariantItemStyle(elemVariant, 'new');
    } else {
        setVariantItemStyle(elemVariant, 'changed');
    }

    while(levelNext > 0) {
        
        let linkBasePrev = elemPrev.attr('data-link');

        if(elemPrev.length > 0) {

            let level = Number(elemPrev.attr('data-level'));

            if(level === levelNext) {

                levelNext--;
                let elemVariantParent = elemPrev.children().eq(index);
                let linkVariantParent = elemVariantParent.attr('data-link');

                if(linkBasePrev === linkVariantParent) {
                    setVariantItemStyle(elemVariantParent, 'new');
                }

            }

        }

        elemPrev = elemPrev.prev();

    }

}


// Update item summary after item selection
function setItemSummary(elemClicked) {

    let link = (elemClicked.hasClass('selected')) ? elemClicked.attr('data-link') : urlParameters.link;

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
                // field       : config.variants.fieldIdVariantBaseItem,
                field       : config.variants.fieldIdBaseItemNumber,
                type        : 0,
                comparator  : 15,
                // value       : linkItem.split('/').pop()
                value       : elemClicked.closest('tr').attr('data-part-number')
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

    let elemCell = $('.item-cell-clicked').first();
        elemCell.attr('data-link', elemSelected.attr('data-link'));

    valueChanged(elemCell);

    setVariantItemStyle(elemCell, 'replaced');

    $.get('/plm/details', { link : elemSelected.attr('data-link')}, function(response) {
    
        $('#overlay').hide();
    
        let index         = fieldsVariant.length - 1;
        let elemCellField = elemCell.prev();

        do {

            let elemControl = elemCellField.children().first();
            let elemInput   = elemControl.children().first();
            let fieldId     = elemControl.attr('data-id');
            // let picklist    = elemControl.hasClass('picklist');
            let value       = getSectionFieldValue(response.data.sections, fieldId, '', 'link');

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

}


// Apply Changes to PLM
function setSaveActions() {

    // console.log(' >> setSaveActions START');

    derivedData = [];
    let index   = 1;

    for(let key of Object.keys(saveActions)) {
        $('.' + saveActions[key].className).removeClass(saveActions[key].className);
        saveActions[key].count = 0;
        saveActions[key].index = index++;
    }

    $('.variant-item').each(function() {

        let elemVariant  = $(this);
        let elemBaseItem = $(this).closest('tr');
        let index        = $(this).index();

               if(elemVariant.hasClass('status-new')) {

            elemBaseItem.addClass(saveActions.retrieval.className); 
            elemVariant.addClass(saveActions.creation.className); 
            elemVariant.addClass(saveActions.removal.className); 
            elemVariant.addClass(saveActions.addition.className); 

            if(!elemBaseItem.hasClass('leaf')) {
                let children = getBOMItemChildren(elemBaseItem, true);
                for(let child of children) {
                    child.children().eq(index).addClass(saveActions.addition.className);
                }
            }

        } else if(elemVariant.hasClass('status-update')) {
            
            elemVariant.addClass(saveActions.update.className); 

        } else if(elemVariant.hasClass('status-changed')) {

            elemBaseItem.addClass(saveActions.retrieval.className); 
            elemVariant.addClass(saveActions.creation.className); 
            elemVariant.addClass(saveActions.removal.className); 
            elemVariant.addClass(saveActions.addition.className); 

            if(!elemBaseItem.hasClass('leaf')) {
                let children = getBOMItemChildren(elemBaseItem, true);
                for(let child of children) {
                    child.children().eq(index).addClass(saveActions.addition.className);
                }
            }


        } else if(elemVariant.hasClass('status-replaced')) {

            elemVariant.addClass(saveActions.removal.className); 
            elemVariant.addClass(saveActions.addition.className); 

        } else if(elemVariant.hasClass('status-missing')) {

            if(elemBaseItem.hasClass('level-1')) {

                // Link base item for BOM Level1
                elemVariant.addClass(saveActions.addition.className);

            } else {
                
                // For Levels 2+ validate if parent is being added
                let elemParent        = getBOMItemParent(elemBaseItem);
                let elemParentVariant = elemParent.children().eq(index);

                if(elemParentVariant.hasClass('status-missing')) {
                    setVariantItemStyle(elemVariant, 'identical');
                } else if(elemParentVariant.hasClass('status-identical')) {
                    setVariantItemStyle(elemVariant, 'identical');
                } else {
                    elemVariant.addClass(saveActions.addition.className); 
                }

            }

        }

    });

    for(let key of Object.keys(saveActions)) {
        saveActions[key].count += $('.' + saveActions[key].className).length;
    }

    saveActions.removal.count += variantBOMClenup.length;

}
function showSaveProcessingDialog() {

    $('.step-bar').addClass('transition-stopper')
    $('.step-bar').css('width', '0%');
    $('#overlay').show();
    $('#confirm-saving').addClass('disabled').removeClass('default');
    $('.in-work').removeClass('in-work');
    $('#step1').addClass('in-work');
    $('.step-bar').removeClass('transition-stopper');

    for(let key of Object.keys(saveActions)) {
        $('#step-counter' + saveActions[key].index).html('0 of ' + saveActions[key].count);
        $('#step-label'   + saveActions[key].index).html(saveActions[key].label);
    }

    
    $('#dialog-saving').show();

    getDerivedData(saveActions.retrieval);

}
function updateProgressBar(action) {

    let pending  = $(action.selector + '.' + action.className);
    let progress = (action.count - pending.length) * 100 / action.count;

    $('#step-bar'     + action.index).css('width', progress + '%');
    $('#step-counter' + action.index).html((action.count - pending.length) + ' of ' + action.count);

    return pending;

}
function completeProgressBar(action) {

    let elemStep = $('#step-bar' + action.index).closest('.step');

    $('#step-bar' + action.index).css('width', '100%');
    elemStep.removeClass('in-work');
    elemStep.next().addClass('in-work');
    $('#step-counter' + action.index).html(action.count + ' of ' + action.count);

}
function getDerivedData(action) {

    // console.log(' >> getDerivedData START');

    let pending  = updateProgressBar(action);
    let requests = [];

    if(pending.length > 0) {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                requests.push($.get('/plm/derived', {
                    wsId        : wsVariants.id,                            //'create item wsid
                    fieldId     : config.variants.fieldIdBaseItem,               //'BASE_ITEM'
                    pivotItemId : $(this).attr('data-link').split('/')[6],  //'dmsid of selected picklist ittem;
                    link        : $(this).attr('data-link')
                }));

                $(this).removeClass(action.className);

            }

        });

        Promise.all(requests).then(function(responses) {

            for(let response of responses) {

                if(response.error) {
                    showErrorMessage('Error', response.data.message);
                    endProcessing();
                } else {
                    derivedData.push(response);
                }
            }

            getDerivedData(action);
            
        });

    } else {
        
        completeProgressBar(action);
        createNewItems(saveActions.creation);
        
    }

}
function createNewItems(action) {

    // console.log(' >> createNewItems START');

    let pending  = updateProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length > 0) {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemBaseItem    = $(this).closest('tr');
                let elemCellControl = $(this).prev();

                let params = {
                    wsId       : wsVariants.id,
                    sections   : [{
                        id     : wsVariants.sectionIdBaseItem,
                        fields : [{ 
                            fieldId : config.variants.fieldIdBaseItem, 
                            value   : elemBaseItem.attr('data-link').split('/')[6] 
                        },{
                            fieldId : config.variants.fieldIdRootItemDmsId,
                            value   : elemBaseItem.attr('data-root-link').split('/').pop()
                        }]
                    },{
                        id     : wsVariants.sectionIdVariantDefinition,
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

                for(let derived of derivedData) {
                    if(derived.params.link === elemBaseItem.attr('data-link')) {
                        addDerivedFieldsToPayload(params.sections, wsVariants.sections, derived.data);
                        break;
                    }
                }

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
                        link : response.data.split('.autodeskplm360.net')[1]
                    }));
                }
            }

            if(errors) { endProcessing(); } else {

                Promise.all(requests).then(function(responses) {

                    let index = 0;

                    for(let response of responses) {

                        let elemCell = elements[index++];
                            elemCell.attr('data-link', response.params.link).removeClass(action.className);

                        setVariantItemStyle(elemCell, 'changed');

                    }

                    createNewItems(action); 

                });

            } 

        });

    } else {

        completeProgressBar(action);
        cleanupVariantBOM(saveActions.removal);

    }

}
function cleanupVariantBOM(action) {

    // console.log(' >> cleanupVariantBOM START');

    let pending  = $('.variant-item.pending-removal').length + variantBOMClenup.length;
    let progress = (action.count - pending) * 100 / action.count; 

    $('#step-bar'     + action.index).css('width', progress + '%');
    $('#step-counter' + action.index).html((action.count - pending.length) + ' of ' + action.count);

    if(variantBOMClenup.length > 0) {

        let requests = [];

        for(let cleanup of variantBOMClenup) {
            if(requests.length < action.maxRequests) {
                requests.push($.get('/plm/bom-remove', cleanup));
            }
        }

        Promise.all(requests).then(function() {
            variantBOMClenup.splice(0, requests.length);
            cleanupVariantBOM(action);
        });

    } else  removeBOMItems(saveActions.removal);

}
function removeBOMItems(action) {

    // console.log(' >> removeBOMItems START');

    let pending  = updateProgressBar(action);
    let requests = [];

    if(pending.length > 0) {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem   = $(this);
                let linkParent = getParentLink(elemItem);

                if(!isBlank(linkParent)) {
                    requests.push($.get('/plm/bom-remove', {
                        link   : linkParent,
                        edgeId : elemItem.attr('data-edgeid')
                    }));
                }

                elemItem.removeClass(action.className);
                elemItem.attr('data-edgeid', '');

            }

        });

        Promise.all(requests).then(function(responses) { removeBOMItems(action); });

    } else {

        completeProgressBar(action);
        addBOMItems(saveActions.addition);

    }

}  
function addBOMItems(action) {

    // console.log(' >> addBOMItems START');

    let pending  = updateProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length > 0) {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem    = $(this);
                let linkParent  = getParentLink(elemItem);
                let linkItem    = elemItem.attr('data-link');
                let baseItem    = elemItem.closest('tr');

                if(elemItem.hasClass('status-missing') || elemItem.hasClass('status-identical')) {
                    linkItem = baseItem.attr('data-link');
                    elemItem.attr('data-link', linkItem);
                }

                let params = {
                    linkParent : linkParent,
                    linkChild  : linkItem,
                    quantity   : baseItem.attr('data-quantity'),
                    number     : baseItem.attr('data-number'),
                    pinned     : true
                }

                requests.push($.post('/plm/bom-add', params));
                elements.push(elemItem);
                elemItem.removeClass('pending-update-bom');

            }

        });

        Promise.all(requests).then(function(responses) {
            
            let index = 0;

            for(let response of responses) {

                console.log(response);


                if(response.error) {
                    showErrorMessage('Error when adding BOM entries', response.data.message);
                    return;
                }

                let elemItem = elements[index++];
                    elemItem.removeClass(action.className);
                    elemItem.attr('data-edgeid', response.data.split('/bom-items/')[1]);
                    
                if(elemItem.hasClass('status-missing')) {
                    setVariantItemStyle(elemItem, 'identical');
                } else if(!elemItem.hasClass('status-identical')) {
                    setVariantItemStyle(elemItem, 'match');

                }

            }

            addBOMItems(action);

        });

    } else {

        completeProgressBar(action);
        updateBOMItems(saveActions.update);

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
function updateBOMItems(action) {       
        
    // console.log(' >> updateBOMItems START');

    let pending  = updateProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length > 0) {

        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemItem     = $(this);
                let elemBaseItem = elemItem.closest('tr');

                let params = {                    
                    linkParent : getParentLink(elemItem),
                    linkChild  : elemItem.attr('data-link'),
                    edgeId     : elemItem.attr('data-edgeid'),
                    number     : elemBaseItem.attr('data-number'),
                    quantity   : elemBaseItem.attr('data-quantity'),
                    pinned     : false
                };

                requests.push($.post('/plm/bom-update', params));
                elements.push(elemItem);

            }

        });

        Promise.all(requests).then(function(responses) {

            let index = 0;

            for(let response of responses) {

                let elemItem = elements[index++];
                    elemItem.removeClass(action.className).attr('data-quantity', response.params.qty);

                let linkParent = elemItem.closest('tr').attr('data-link');

                if(linkParent === elemItem.attr('data-link')) {
                    setVariantItemStyle(elemItem, 'identical');
                } else {
                    setVariantItemStyle(elemItem, 'match');
                }
        
            }

            updateBOMItems(action);

        });

    } else {

        completeProgressBar(action);
        endProcessing();

    }
    
}
function endProcessing() {

    // console.log('>> endProcessing START');

    variantBOMClenup = [];

    $('#overlay').show();
    $('#confirm-saving').removeClass('disabled').addClass('default');
    $('.in-work').removeClass('in-work');    

}