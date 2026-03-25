let wsContext        = { id : '', sections  : [], fields : [] }
let wsVariants       = { id : '', sections  : [], fields : [], bomViews : [], viewId : '', bomViewLinks : [] }
let listVariants     = [];
let fieldsVariant    = [];
let variantBOMClenup = [];
let classesViewer    = [ 'standard', 'viewer-left', 'viewer-off'];
let modeViewer       = 0;
let derivedData;


let saveActions = {
    retrieval : {
        label       : 'Getting derived data for variant item creation',
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
    addition : {
        label       : 'Adding BOM entries to new variants',
        className   : 'pending-addition',
        selector    : '.variant-item',
        maxRequests : 5,
    },
    replacement : {
        label       : 'Replacing items in BOM with variants',
        className   : 'pending-replacement',
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
    wsVariants.id = config.workspaceItemVariants.workspaceId;

    appendOverlay(true);
    setUIEvents();

    getFeatureSettings('variants', [$.get( '/plm/details', { link : urlParameters.link })], function(responses) {

        if(!isBlank(urlParameters.fieldidebom)) {

            urlParameters.product = urlParameters.link;
            urlParameters.link    = getSectionFieldValue(responses[0].data.sections, urlParameters.fieldidebom, '', 'link');

            $.get( '/plm/details', { link : urlParameters.link }, function(response) {
                urlParameters.root       = response.data.root.link.split('/').pop();
                urlParameters.partNumber = getSectionFieldValue(response.data.sections, common.workspaces.items.fieldIdNumber, '');
                initEditor();
            });

        } else {

            urlParameters.root       = responses[0].data.root.link.split('/').pop();
            urlParameters.partNumber = getSectionFieldValue(responses[0].data.sections, common.workspaces.items.fieldIdNumber, '');
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
            headerLabel       : 'Create new variant for ' + urlParameters.partNumber,
            hideComputed      : true,
            fieldsIn          : [config.workspaceItemVariants.fieldIds.title, config.workspaceItemVariants.fieldIds.baseItem],
            contextItem       : urlParameters.link,
            contextItemField  : config.workspaceItemVariants.fieldIds.baseItem,
            fieldValues       : [{
                fieldId : config.workspaceItemVariants.fieldIds.rootDMSId,
                value   : urlParameters.root
            }],
            hideSections      : true,
            afterCreation     : function(id, link, data, contextId) { addNewVariant(link); }
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

    getInitialData();
    insertViewer(urlParameters.link);
    insertItemSummary(urlParameters.link, paramsSummary);
}
function getInitialData() {

    let requests = [
        $.get('/plm/details'              , { link : urlParameters.link }),
        $.get('/plm/sections'             , { wsId : wsContext.id,  useCache : true }),
        $.get('/plm/sections'             , { wsId : wsVariants.id, useCache : true }),
        $.get('/plm/fields'               , { wsId : wsVariants.id, useCache : true }),
        $.get('/plm/bom-views-and-fields' , { wsId : wsVariants.id, useCache : true })
    ];

    requests.push($.post( '/plm/search', {
        wsId   : wsVariants.id,
        fields : [ config.workspaceItemVariants.fieldIds.title, config.workspaceItemVariants.fieldIds.rootDMSId ],
        sort   : [ config.workspaceItemVariants.fieldIds.title ],
        filter : [{
            field       : config.workspaceItemVariants.fieldIds.rootDMSId,
            type        : 0,
            comparator  : 15,
            value       : urlParameters.root
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
                label : getSearchResultFieldValue(variant, config.workspaceItemVariants.fieldIds.title, ''),
                link  : '/api/v3/workspaces/' + wsVariants.id + '/items/' + variant.dmsId
            });
        }

        wsContext.sections   = responses[1].data;
        wsVariants.sections  = responses[2].data;
        wsVariants.fields    = responses[3].data;
        wsVariants.bomViews  = responses[4].data;
        wsVariants.picklists = [];

        getVariantsWSConfig();

    });

}
function getVariantsWSConfig() {

    let foundSection = false;

    for(let section of wsVariants.sections) {
        if(section.name === config.workspaceItemVariants.sectionLabel) {
            
            foundSection = true;
            
            for(let sectionField of section.fields) {
                for(let field of wsVariants.fields) {
                    if(field.__self__ === sectionField.link) {
                        field.id    = field.__self__.split('/').pop();
                        fieldsVariant.push(field);
                        break;
                    }
                }  
            }
            
        }
    }

    if(!foundSection) showErrorMessage('Error loading data', 'Cannot find section with name  ' + config.workspaceItemVariants.sectionLabel + ' in workspace ' +  config.workspaceItemVariants.workspaceId + ' (wsIdItemVariants)');

    for(let bomView of wsVariants.bomViews) {
        if(bomView.name === config.workspaceItemVariants.bomViewName) {

            wsVariants.viewId       = bomView.id;
            wsVariants.columns      = bomView.fields;
            wsVariants.bomViewLinks = [];

            for(let field of bomView.fields) {

                if(field.fieldId === 'QUANTITY') wsVariants.bomViewLinks.quality  = field.__self__.link;
                if(field.fieldId === config.workspaceItemVariants.bomFieldIdBaseBOMPath) wsVariants.bomViewLinks.baseBOMPath  = field.__self__.link;

                for(let fieldVariant of fieldsVariant) {
                    if(fieldVariant.id === field.fieldId) fieldVariant.link = field.__self__.link;
                }

            }

        }
    }

    if(isBlank(wsVariants.columns)) showErrorMessage('Error loading workspace configuration', 'Cannot find BOM view with name "' + config.workspaceItemVariants.bomViewName + '" in workspace ' +  config.workspaceItemVariants.workspaceId + ' (wsIdItemVariants)');

    $('#button-create-variant').removeClass('disabled');

    settings['create-variant'] = { editable : true };

    getFieldsPicklistsData('create-variant', fieldsVariant, function(response) {

        wsVariants.picklists = response;

        insertBOM(urlParameters.link, { 
            headerLabel       : 'BOM & Variants', 
            bomViewName       : config.workspaceItems.bomViewName || common.workspaces.items.defaultBOMView, 
            fieldsIn          : ['Item', 'Quantity', 'Qty'],
            contentSize       : 'xs',
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
            openInPLM         : true,
            viewerSelection   : true,
            depth             : config.maxBOMLevels,
            onClickItem       : function(elemClicked) { setItemSummary(elemClicked); },
            afterCompletion   : function (id, data) { insertVariants(id, data); }
        });
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
  

    let requests = [];

    sortArray(listVariants, 'label');

    for(let variant of listVariants) requests.push($.get('/plm/bom', { 
        link            : variant.link, 
        depth           : config.maxBOMLevels,
        getBOMPartsList : true,
        revisionBias    : 'working',
        viewId          : wsVariants.viewId 
    } ));

    Promise.all(requests).then(function(responses) {
        let index = 0;
        for(let variant of listVariants) {
            variant.index        = index;
            variant.bomPartsList = responses[index++].data.bomPartsList;
            insertVariant(variant);
            // insertVariant(variant, index, responses[index++]);
        }
    });

}


// Insert existing or new variants to the table
function insertVariant(variant) {

    insertVariantHeaderColumns(variant);
    insertVariantTableCells   (variant);

    $('<option></option>').appendTo($('#variant-selector'))
        .attr('value', variant.index)
        .html(variant.label);

}
function insertVariantHeaderColumns(variant) {

    let elemTHeadFields = $('#table-head-row-fields');
    let elemTHeadTitles = $('#table-head-row-titles');
    let elemSpacerHead  = $('<th></th>')
        .addClass('variant-spacer')
        .addClass('variant-filter')
        .addClass('variant-index-' + variant.index);
            
    elemTHeadFields.append(elemSpacerHead.clone());
    elemTHeadTitles.append(elemSpacerHead.clone());

    $('<th></th>').appendTo(elemTHeadFields)
        .attr('colspan', fieldsVariant.length + 1)
        .attr('data-link', variant.link)
        .html(variant.label)
        .addClass('variant-head')
        .addClass('variant-filter')
        .addClass('variant-index-' + variant.index)
        .attr('title', 'Click to open variant ' + variant.label + ' in new tab')
        .click(function() {
            openItemByLink($(this).attr('data-link'));
        });

    for(let fieldVariant of fieldsVariant) {
        $('<th></th>').appendTo(elemTHeadTitles)
            .html(fieldVariant.name)
            .addClass('variant-filter')
            .addClass('variant-index-' + variant.index)
            .addClass('field-id-' + fieldVariant.id.toLowerCase());
    }

    $('<th></th>').appendTo(elemTHeadTitles)
        .html('Item')
        .addClass('variant-filter')
        .addClass('variant-index-' + variant.index);

}
function insertVariantTableCells(variant) {

    let elemCellSpacer = $('<td></td>').addClass('variant-spacer').addClass('variant-filter');

    for(let variantBOMItem of variant.bomPartsList) variantBOMItem.hasMatch = false;

    $('#bom-tbody').children().each(function() {

        let className    = 'status-missing';
        let elemBaseItem = $(this);
        let baseRootLink = $(this).attr('data-root-link');
        let baseQuantity = $(this).attr('data-quantity');
        let baseEdgeId   = $(this).attr('data-edgeid');
        let status       = 'missing';
        let variantItem  = getVariantBOMItem(elemBaseItem, variant);

        if(variantItem.edgeId !== '') {
            if(baseEdgeId == variantItem.edgeId) {
                status = 'identical';
            } else if(baseQuantity != variantItem.quantity) {
                status = 'update';
            } else if(baseRootLink === variantItem.root) {
                status = 'identical';
            } else if(baseRootLink.split('/').pop() === variantItem.details[config.workspaceItemVariants.fieldIds.rootDMSId]) {
                status = 'match';
            } 
        }

        elemCellSpacer.clone().appendTo($(this)).addClass('variant-index-' + variant.index);

        for(let fieldVariant of fieldsVariant) {

            let elemCellField = $('<td></td>').appendTo($(this))
                .addClass('variant-filter')
                .addClass('field-value')
                .addClass('field-id-' + fieldVariant.id.toLowerCase())
                .addClass('variant-index-' + variant.index);

                let elemInput = insertField({ editable : true}, elemCellField, fieldVariant, variantItem.fields, wsVariants.picklists, [], []);

                elemInput.dblclick(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }).change(function() {
                    valueChanged($(this));
                });
                
        }

        let elemCellItem = $('<td></td>').appendTo($(this))
            .attr('data-link'        , variantItem.link)
            .attr('data-edgeid'      , variantItem.edgeId)
            .attr('data-edgeid-ref'  , variantItem.edgeIdRef)
            .attr('data-quantity'    , variantItem.quantity)
            .attr('data-number'      , variantItem.number)
            .attr('data-link-parent' , variantItem.parent)
            .attr('data-root-link'   , variantItem.root)
            .attr('data-variant-link', variant.link)
            .attr('data-variant-id'  , variant.index)
            .attr('title', 'Use shift-click to open the related item in a new window')
            .addClass('variant-filter')
            .addClass('variant-index-' + variant.index)
            .addClass('variant-item')
            .addClass(className)
            .click(function(e) {
                clickItemCell(e, $(this));
            });

        setVariantItemStyle(elemCellItem, status);

    });

    for(let variantBOMItem of variant.bomPartsList) {
        if(!variantBOMItem.hasMatch) {
            variantBOMClenup.push({
                link   : variantBOMItem.linkParent,
                edgeId : variantBOMItem.edgeId
            });
        }
    }

    insertAllPicklistData({}, wsVariants.picklists, $('#bom-tbody'));

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
        case 'match'    : icon = 'link'       ; title = 'Variant item has been created and linked. Use [Shift]-click to open the item in PLM.'; break; // uses variant item, all data is in sync

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

    $.get('/plm/details', { link : link }, function(response) {
        let label = response.data.title.split(' - ').pop();
        insertVariant({
            link         :  link,
            label        : label,
            bomPartsList : [],
            index        :  index
        // }, index, {
        //     data : {
        //         nodes : [],
        //         edges : []
        //     },
        //     params : {
        //         link : link
        //     }
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

    $.post('/plm/add-relationship', {
        link        : link,
        relatedId   : urlParameters.dmsId,
        description : 'Base Item',
        type        : 'uni'
    }, function() {});

}


// Match table cells to BOM rows
function getVariantBOMItem(elemBaseItem, variant) {

    let baseBOMPath = elemBaseItem.attr('data-number-path');
    let baseEdgeId  = elemBaseItem.attr('data-edgeid');

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

    for(let variantBOMItem of variant.bomPartsList) {

        // if(baseBOMPath === prefixNumberPath + variantBOMItem.numberPath) {
        if(baseBOMPath === variantBOMItem.details.BASE_BOM_PATH) {

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

        } else if(baseEdgeId == variantBOMItem.edgeId) {

            result.edgeId = variantBOMItem.edgeId;
            result.link   = variantBOMItem.link;

            break;

        }

    }

    return result;
    
}
function getEdgeQuantity(edge) {

    for(let edgeField of edge.fields) {
        if(edgeField.metaData.link === wsVariants.bomViewLinks.quality) return edgeField.value;
    }

    return 0;

}
function valueChanged(elemControl) {

    let elemVariant = elemControl;

    if(!elemVariant.hasClass('variant-item')) elemVariant = elemControl.parent().nextAll('.variant-item').first();

    let index            = elemVariant.index();
    let elemBaseItem     = elemVariant.closest('tr');
    let levelBase        = Number(elemBaseItem.attr('data-level'));
    let levelNext        = levelBase - 1;
    let elemPrev         = elemBaseItem.prev();
    // let linkBaseItemRoot = elemBaseItem.attr('data-root-link');
    // let linkVariantRoot  = elemVariant.attr('data-root-link');

    // if(linkBaseItemRoot === linkVariantRoot) {
        setVariantItemStyle(elemVariant, 'new');
    // } else {
        // setVariantItemStyle(elemVariant, 'changed');
    // }

    while(levelNext > 0) {
        
        let linkBaseItemParentRoot = elemPrev.attr('data-root-link');

        if(elemPrev.length > 0) {

            let level = Number(elemPrev.attr('data-level'));

            if(level === levelNext) {

                levelNext--;
                let elemVariantParent     = elemPrev.children().eq(index);
                let linkVariantParentRoot = elemVariantParent.attr('data-root-link');

                if(linkBaseItemParentRoot === linkVariantParentRoot) {
                    setVariantItemStyle(elemVariantParent, 'new');
                    if((levelBase - levelNext) === 1) { elemControl.addClass('addition'); }
                } else if((levelBase - levelNext) === 1) { elemControl.addClass('replacement'); }

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

        let queryFields = ['DESCRIPTOR'];

        for(let fieldVariant of fieldsVariant) queryFields.push(fieldVariant.id);

        insertResults(
            wsVariants.id, 
            [{
                field      : config.workspaceItemVariants.fieldIds.rootDMSId,
                type       : 0,
                comparator : 15,
                value      : elemClicked.closest('tr').attr('data-root-link').split('/').pop()
            }], {
                id              : 'selector',
                headerLabel     : 'Variants of ' + elemClicked.closest('tr').attr('data-title'),
                search          : true,
                number          : true,
                layout          : 'table',
                fields          : queryFields,
                openInPLM       : true,
                openOnDblClick  : true,
                sort            : [config.workspaceItemVariants.fieldIds.title],
                afterCompletion : function(id) { addSelectorFooterButtons(id); }
            }
        )

    }
}
function addSelectorFooterButtons(id) {

    genPanelFooterActionButton(id, 'cancel', { label : 'Cancel' }, function() {
        $('#selector-close').click();
    });

    genPanelFooterActionButton(id, 'cancel', { label : 'Confirm', default : true }, function() {
        let elemSelected = $('#selector-tbody').find('.content-item.selected');
        if(elemSelected.length === 1) {
            insertSelectedItem(elemSelected);
        } else $('#selector-close').click();
    });

}
function insertSelectedItem(elemSelected) {

    $('#selector').hide();

    let elemCell     = $('.item-cell-clicked').first();
    let elemBaseItem = elemCell.closest('tr');
    let level        = Number(elemBaseItem.attr('data-level'));
    let linkCurrent  = elemCell.attr('data-link');
    let linkNew      = elemSelected.attr('data-link');

    if(linkCurrent === linkNew) {
        $('#overlay').hide();
        return;
    }

    elemCell.attr('data-link', linkNew);

    let requests = [
        $.get('/plm/details', { link : linkNew }),
        $.get('/plm/bom',     { 
            link            : linkNew, 
            depth           : config.maxBOMLevels - level,
            viewId          : wsVariants.viewId,
            getBOMPartsList : true
        })
    ];

    Promise.all(requests).then(function(responses) {

        $('#overlay').hide();

        let index           = fieldsVariant.length - 1;
        let elemField       = elemCell.prev();
        let variant         = responses[1].data;
        let indexVariant    = elemCell.index();

        elemCell.attr('data-root-link', responses[0].data.root.link)
            .addClass('replacement')
            .removeClass('item-cell-clicked');

        do {

            let fieldId = elemField.attr('data-id');
            let value   = getSectionFieldValue(responses[0].data.sections, fieldId, '', 'object');
            
            setFieldValue(elemField, value);

            index--;
            elemField = elemField.prev();

        } while (index >= 0);

        setVariantItemStyle(elemCell, 'replaced');

        if(variant.bomPartsList.length === 0) return;

        elemBaseItem.nextAll().each(function() {

            let newBaseItem = $(this);
            let nextLevel   = Number(newBaseItem.attr('data-level'));

            if(nextLevel > level) {

                let baseRootLink = newBaseItem.attr('data-root-link');
                let baseQuantity = newBaseItem.attr('data-quantity');
                let status       = 'missing';
                let variantItem  = getVariantBOMItem(newBaseItem, variant);
                let elemCellItem = newBaseItem.children().eq(indexVariant);

                if(variantItem.edgeId !== '') {
                    if(baseQuantity != variantItem.quantity) {
                        status = 'update';
                    } else if(baseRootLink === variantItem.root) {
                        status = 'identical';
                    } else if(baseRootLink.split('/').pop() === variantItem.details[config.workspaceItemVariants.fieldIds.rootDMSId]) {
                        status = 'match';
                    } 
                }

                setVariantItemStyle(elemCellItem, status);
                setVariantItemCell(elemCellItem, variantItem);
                setVariantItemFields(elemCellItem, variantItem);

            } else return false;
        });

    });

}
function setVariantItemCell(elemCellItem, variantItem) {

    elemCellItem.attr('data-link',      variantItem.link    );
    elemCellItem.attr('data-root-link', variantItem.root    );
    elemCellItem.attr('data-edgeId',    variantItem.edgeId  );
    elemCellItem.attr('data-quantity',  variantItem.quantity);
    elemCellItem.attr('data-number',    variantItem.number  );

}
function setVariantItemFields(elemCellVariant, variantItem) {

    let index     = fieldsVariant.length - 1;
    let elemField = elemCellVariant.prev();

    do {

        let fieldId = elemField.attr('data-id');
        let value   = isBlank(variantItem.details) ? null : variantItem.details[fieldId];
            
        setFieldValue(elemField, value);

        index--;
        elemField = elemField.prev();

    } while (index >= 0);

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
            elemVariant.addClass(saveActions.replacement.className); 
            // elemVariant.addClass(saveActions.addition.className); 

            let children = treeGetItemChildren(elemBaseItem, true);
            
            for(let child of children) {
                child.children().eq(index).addClass(saveActions.addition.className);
            }

        } else if(elemVariant.hasClass('status-update')) {
            
            elemVariant.addClass(saveActions.update.className); 

        } else if(elemVariant.hasClass('status-changed')) {

            elemBaseItem.addClass(saveActions.retrieval.className); 
            elemVariant.addClass(saveActions.creation.className); 
            elemVariant.addClass(saveActions.replacement.className); 
            // elemVariant.addClass(saveActions.addition.className); 

            if(!elemBaseItem.hasClass('leaf')) {
                let children = treeGetItemChildren(elemBaseItem, true);
                for(let child of children) {
                    child.children().eq(index).addClass(saveActions.addition.className);
                }
            }


        } else if(elemVariant.hasClass('status-replaced')) {

            elemVariant.addClass(saveActions.replacement.className); 
            // elemVariant.addClass(saveActions.addition.className); 

        } else if(elemVariant.hasClass('status-missing')) {

            if(elemBaseItem.hasClass('level-1')) {

                // Link base item for BOM Level1
                elemVariant.addClass(saveActions.addition.className);

            } else {
                
                // For Levels 2+ validate if parent is being added
                let elemParent        = treeGetItemParent(elemBaseItem);
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

    // saveActions.replacement.count += variantBOMClenup.length;

}
function showSaveProcessingDialog() {

    $('.step-bar').addClass('transition-stopper')
    $('.step-bar').css('width', '0%');
    $('#overlay').show();
    // $('#confirm-saving').addClass('disabled').removeClass('default');
    $('#confirm-saving').removeClass('disabled').addClass('default');
    $('.in-work').removeClass('in-work');
    $('#step1').addClass('in-work');
    $('.step-bar').removeClass('transition-stopper');

    for(let key of Object.keys(saveActions)) {
        $('#step-label'   + saveActions[key].index).html(saveActions[key].label);
        $('#step-counter' + saveActions[key].index).html('0 of ' + saveActions[key].count);
    }
    
    $('#dialog-saving').show();

    save1GetDerivedData(saveActions.retrieval);

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
function getParentLink(elemItem) {

    let elemRefItem = elemItem.closest('tr');
    let level       = Number(elemRefItem.attr('data-level')) - 1;
    let index       = elemItem.index();
    let result      = '';

    if(level === 0) return elemItem.attr('data-variant-link');

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
function save1GetDerivedData(action) {

    // console.log(' >> save1GetDerivedData START');

    let pending  = updateProgressBar(action);
    let requests = [];

    if(pending.length > 0) {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let params = {
                    wsId        : wsVariants.id,                                   //'create item wsid
                    fieldId     : config.workspaceItemVariants.fieldIds.baseItem,  //'BASE_ITEM'
                    pivotItemId : $(this).attr('data-link').split('/')[6],         //'dmsid of selected picklist ittem;
                    link        : $(this).attr('data-link')
                }

                requests.push($.get('/plm/derived', params));

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

            save1GetDerivedData(action);
            
        });

    } else {

        completeProgressBar(action);
        save2CreateNewItems(saveActions.creation);
        
    }

}
function save2CreateNewItems(action) {

    // console.log(' >> save2CreateNewItems START');

    let pending  = updateProgressBar(action);
    let requests = [];
    let elements = [];

    if(pending.length > 0) {
        
        pending.each(function() {

            if(requests.length < action.maxRequests) {

                let elemBaseItem    = $(this).closest('tr');
                let elemCellControl = $(this).prev();
                let fieldValues     = {};
                let title           = '';

                let params = {
                    wsId        : wsVariants.id,
                    sections    : wsVariants.sections,
                    getDetails  : true,
                    fields      : [{
                        fieldId : config.workspaceItemVariants.fieldIds.baseItem,
                        value   : elemBaseItem.attr('data-link')
                    },{
                        fieldId : config.workspaceItemVariants.fieldIds.rootDMSId,
                        value   : elemBaseItem.attr('data-root-link').split('/').pop()
                    }]
                };

                for(let index = fieldsVariant.length - 1; index >= 0; index--) {

                    let data  = getFieldValue(elemCellControl);

                    params.fields.push({
                        fieldId : data.fieldId,
                        value   : data.value
                    });

                    elemCellControl           = elemCellControl.prev();
                    fieldValues[data.fieldId] = null;

                    if(data.value !== null) fieldValues[data.fieldId] = (typeof data.value === 'object') ? data.value.title : data.value;

                }

                if(config.newItemVariantsTitle.fieldsToConcatenate.length === 0) {

                    for(let fieldValue of fieldValues) {
                        if(title !== '') title += config.newItemVariantsTitle.separator;
                        title += fieldValue.value;
                    }

                } else {
                    for(let fieldId of config.newItemVariantsTitle.fieldsToConcatenate) {
                        if(title !== '') title += config.newItemVariantsTitle.separator;
                        title += fieldValues[fieldId];
                    }
                }

                if(title === '') title = elemBaseItem.attr('data-title');

                params.fields.push({
                    fieldId : config.workspaceItemVariants.fieldIds.title,
                    value   : title
                })

                for(let derived of derivedData) {
                    if(derived.params.link === elemBaseItem.attr('data-link')) {
                          for(let section of derived.data.sections) {
                            for(let field of section.fields) {
                                params.fields.push({
                                    fieldId : field.__self__.split('/').pop(),
                                    value : field.value,
                                })
                            }
                        }
                    }
                }

                requests.push($.post('/plm/create', params));
                elements.push($(this));

            }

        });

        Promise.all(requests).then(function(responses) {

            let errors = false;

            for(let response of responses) {
                if(response.error) {
                    showErrorMessage('Error', response.data.message);
                    errors = true;
                }
            }

            if(errors) { endProcessing(); } else {

                let index = 0;

                for(let response of responses) {

                    let elemCell = elements[index++];
                    
                    elemCell.attr('data-link', response.data.__self__)
                        .addClass('pending-bom-addition')
                        .removeClass(action.className);

                    setVariantItemStyle(elemCell, 'changed');

                    $.post('/plm/add-relationship', {
                        link        : response.data.__self__,
                        relatedId   : urlParameters.dmsId,
                        description : 'Base Item',
                        type        : 'uni'
                    }, function() {});

                }

                save2CreateNewItems(action); 

            } 

        });

    } else {

        completeProgressBar(action);
        save3AddBOMs(saveActions.addition);

    }

}
function save3AddBOMs(action) {

    // console.log(' >> save3AddBOMs START');

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
                    pinned     : true,
                    fields     : []
                }

                params.fields.push({
                    link  : wsVariants.bomViewLinks.baseBOMPath,
                    value : baseItem.attr('data-number-path')
                })

                requests.push($.post('/plm/bom-add', params));
                elements.push(elemItem);
                elemItem.removeClass('pending-addition');

            }

        });

        Promise.all(requests).then(function(responses) {
            
            let index = 0;

            for(let response of responses) {

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

            save3AddBOMs(action);

        });

    } else {

        completeProgressBar(action);
        step4ReplaceBOMItems(saveActions.replacement);

    }

}
function step4ReplaceBOMItems(action) {       
        
    // console.log(' >> step4ReplaceBOMItems START');

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

            step4ReplaceBOMItems(action);

        });

    } else {

        completeProgressBar(action);
        save5UpdateBOMItems(saveActions.update);

    }
    
}
function save5UpdateBOMItems(action) {       
        
    // console.log(' >> save5UpdateBOMItems START');

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

            save5UpdateBOMItems(action);

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
    $('td').removeClass('changed');    

}


// function cleanupVariantBOM(action) {

//     // console.log(' >> cleanupVariantBOM START');

//     let pending  = $('.variant-item.pending-replacement').length + variantBOMClenup.length;
//     let progress = (action.count - pending) * 100 / action.count; 

//     $('#step-bar'     + action.index).css('width', progress + '%');
//     $('#step-counter' + action.index).html((action.count - pending.length) + ' of ' + action.count);

//     if(variantBOMClenup.length > 0) {

//         let requests = [];

//         for(let cleanup of variantBOMClenup) {
//             if(requests.length < action.maxRequests) {
//                 requests.push($.get('/plm/bom-remove', cleanup));
//             }
//         }

//         Promise.all(requests).then(function() {
//             variantBOMClenup.splice(0, requests.length);
//             cleanupVariantBOM(action);
//         });

//     } else removeBOMItems(saveActions.replacement);

// }
// function removeBOMItems(action) {

//     // console.log(' >> removeBOMItems START');

//     let pending  = updateProgressBar(action);
//     let requests = [];

//     if(pending.length > 0) {
        
//         pending.each(function() {

//             if(requests.length < action.maxRequests) {

//                 let elemItem   = $(this);
//                 let linkParent = getParentLink(elemItem);

//                 if(!isBlank(linkParent)) {
//                     // requests.push($.get('/plm/bom-remove', {
//                     //     link   : linkParent,
//                     //     edgeId : elemItem.attr('data-edgeid')
//                     // }));
//                 }

//                 elemItem.removeClass(action.className);
//                 elemItem.attr('data-edgeid', '');

//             }

//         });

//         Promise.all(requests).then(function(responses) { removeBOMItems(action); });

//     } else {

//         completeProgressBar(action);
//         addBOMItems(saveActions.addition);

//     }

// }  
// function addBOMItems(action) {

//     // console.log(' >> addBOMItems START');

//     let pending  = updateProgressBar(action);
//     let requests = [];
//     let elements = [];

//     if(pending.length > 0) {
        
//         pending.each(function() {

//             if(requests.length < action.maxRequests) {

//                 let elemItem    = $(this);
//                 let linkParent  = getParentLink(elemItem);
//                 let linkItem    = elemItem.attr('data-link');
//                 let baseItem    = elemItem.closest('tr');

//                 if(elemItem.hasClass('status-missing') || elemItem.hasClass('status-identical')) {
//                     linkItem = baseItem.attr('data-link');
//                     elemItem.attr('data-link', linkItem);
//                 }

//                 let params = {
//                     linkParent : linkParent,
//                     linkChild  : linkItem,
//                     quantity   : baseItem.attr('data-quantity'),
//                     number     : baseItem.attr('data-number'),
//                     pinned     : true,
//                     fields     : []
//                 }

//                 params.fields.push({
//                     link  : wsVariants.bomViewLinks.baseBOMPath,
//                     value : baseItem.attr('data-number-path')
//                 })

//                 // requests.push($.post('/plm/bom-add', params));
//                 elements.push(elemItem);
//                 elemItem.removeClass('pending-update-bom');

//             }

//         });

//         Promise.all(requests).then(function(responses) {
            
//             let index = 0;

//             for(let response of responses) {

//                 if(response.error) {
//                     showErrorMessage('Error when adding BOM entries', response.data.message);
//                     return;
//                 }

//                 let elemItem = elements[index++];
//                     elemItem.removeClass(action.className);
//                     elemItem.attr('data-edgeid', response.data.split('/bom-items/')[1]);
                    
//                 if(elemItem.hasClass('status-missing')) {
//                     setVariantItemStyle(elemItem, 'identical');
//                 } else if(!elemItem.hasClass('status-identical')) {
//                     setVariantItemStyle(elemItem, 'match');

//                 }

//             }

//             addBOMItems(action);

//         });

//     } else {

//         completeProgressBar(action);
//         updateBOMItems(saveActions.update);

//     }

// }