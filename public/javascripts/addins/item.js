let fieldsVariant = [];
let wsVariants    = { 'id' : '275' }

$(document).ready(function() {

    appendProcessing('details');
    appendOverlay(true);

    setUIEvents();
    insertItemDetails(link, null, null, [], ['ACTIONS']);
    insertAttachments(link);
    insertWorkspaceItems('274', 'dialog-variants-list', 'format_color_fill');
    insertFlatBOM(link, null, '', 'EFE', true, true, true, true, false, [], true);
    insertBOM(link, 'master-bom', '', '', true, false, true, true, true, true, true);
    getVariantsInitialData();

});


function setUIEvents() {

    $('#item-variants-select').click(function() {
        $('#overlay').show();
        $('#dialog-variants').show();
    });


    $('#dialog-variants-cancel').click(function() {
        $('#overlay').hide();
        $('.dialog').hide();
    });
    $('#dialog-variants-apply').click(function() {
        $('#overlay').hide();
        $('.dialog').hide();
        setVariantsEditor();
    });

}


// Flat BOM Additions
function insertFlatBOMDone(id) {

    let elemToolbar = $('#' + id + '-toolbar');
        
    let elemToggle = $('<div></div>');
        elemToggle.addClass('button');    
        elemToggle.addClass('with-icon');    
        elemToggle.addClass('isolate-off');
        elemToggle.html('Isolate');
        elemToggle.prependTo(elemToolbar);
        elemToggle.click(function() {
            let elemButton = $(this);
                elemButton.toggleClass('isolate-on');
                elemButton.toggleClass('isolate-off');
            isolate = !isolate;

            let partNumbers = [];

            $('.flat-bom-item.selected').each(function() {
                partNumbers.push($(this).attr('data-part-number'));
            })
        
            select3D(partNumbers);

        });

    let elemCounter = $('<div></div>');
        elemCounter.addClass('button');    
        elemCounter.attr('id', 'flat-bom-counter');
        elemCounter.html();
        elemCounter.hide();
        elemCounter.prependTo(elemToolbar);
        elemCounter.click(function() {
            let elemButton = $(this);
                elemButton.toggleClass('filter-selected');

            filterFlatBOMBySelection();

        });

}
function filterFlatBOMBySelection(enforce) {

    if(isBlank(enforce)) enforce = false;

    let elemButton = $('#flat-bom-counter');

    if((elemButton).hasClass('filter-selected')) {
        $('#bom-flat-tbody').children().hide();
        $('#bom-flat-tbody').children('.selected').show();
        
    } else {
        $('#bom-flat-tbody').children().show();
    }

    if(enforce) $('#bom-flat-tbody').children().show();

}
function changeFlatBOMViewDone() {
    $('#bom-flat-select-all').click(function() { 
        let count = $(this).hasClass('icon-check-box-checked') ? 0 : $('#bom-flat-tbody').children().length;
        updateFlatBOMCounter(count); 
        filterFlatBOMBySelection(true);
    });

}
function clickFlatBOMItem(elemClicked) {

    let partNumbers = [];

    elemClicked.toggleClass('selected');

    $('.flat-bom-item.selected').each(function() {
        partNumbers.push($(this).attr('data-part-number'));
    })

    select3D(partNumbers);
    updateFlatBOMCounter();

}
function updateFlatBOMCounter(count) {


    console.log('updateFlatBOMCounter START');

    if(isBlank(count)) count = $('#bom-flat-tbody').children('.selected').length;

    console.log(count);

    let elemCounter = $('#flat-bom-counter');

        elemCounter.html(count + ' Zeilen gewählt');

    if(count > 0) {
        elemCounter.show(); 
    } else {
        elemCounter.hide();
        elemCounter.removeClass('filter-selected');
    }

    filterFlatBOMBySelection();

}



function getVariantsInitialData() {

    let requests = [
        $.get('/plm/details'                , { 'link' : link }),
        $.get('/plm/sections'               , { 'wsId' : wsVariants.id }),
        $.get('/plm/fields'                 , { 'wsId' : wsVariants.id }),
        $.get('/plm/bom-views-and-fields'   , { 'wsId' : wsVariants.id })
    ];

    Promise.all(requests).then(function(responses) {

        let variants   = getSectionFieldValue(responses[0].data.sections, 'VARIANTS', '');
        // insertBOM(linkContext, 'bom', config.variants.bomViewNameItems, 'BOM & Variants', true, true, false, false, false);

        // for(variant of variants) listVariants.push(variant);

        // wsContext.sections  = responses[1].data;
        wsVariants.sections = responses[1].data;
        wsVariants.fields   = responses[2].data;
        wsVariants.bomViews = responses[3].data;

        getVariantsWSConfig();

    });


}
function getVariantsWSConfig() {

    let foundSection = false;

    for(section of wsVariants.sections) {

        if(section.name === 'Variante') {

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

    // if(!foundSection) showErrorMessage('Cannot find section with name  ' + config.variants.variantsSectionLabel + ' in workspace ' +  config.variants.wsIdVariantItems + ' (wsIdVariantItems)', 'Error loading data');

    wsVariants.fieldIdVariantBaseItem   = 'BASE_ITEM';
    wsVariants.sectionIdBaseItem        = getFieldSectionId(wsVariants.sections, config.variants.fieldIdVariantBaseItem);

    // for(bomView of wsVariants.bomViews) {
    //     if(bomView.name === config.variants.bomViewNameVariants) {

    //         wsVariants.viewId = bomView.id;

    //         for(field of bomView.fields) {

    //             if(field.fieldId === config.variants.fieldIdVariantBaseItem) {

    //                 wsVariants.fieldLinkVariantBaseItem = field.__self__.link;

    //             }

    //                  if(field.fieldId === 'QUANTITY'         ) wsVariants.colIdQuantity  = field.__self__.link;
    //             else if(field.fieldId === 'EDGE_ID_BASE_ITEM') wsVariants.colIdRefEdgeId = field.__self__.link;

    //             for(fieldVariant of fieldsVariant) {
    //                 if(fieldVariant.id === field.fieldId) fieldVariant.link = field.__self__.link;
    //             }

    //         }

    //     }
    // }

    // $('#button-new').removeClass('disabled');

}
function setVariantsEditor() {

    $('.variant-column').remove();

    let indexVariant = 0;

    let elemCellSpacer = $('<th></th>');
        elemCellSpacer.addClass('variant-spacer');
        elemCellSpacer.addClass('variant-filter');
        elemCellSpacer.addClass('variant-column');

    let elemCellSpacerBody = $('<td></td>');
        elemCellSpacerBody.addClass('variant-spacer');
        elemCellSpacerBody.addClass('variant-filter');
        elemCellSpacerBody.addClass('variant-column');

    let elemTHead = $('#master-bom-thead');
    let elemTBody = $('#master-bom-tbody');
    let elemTHeadRow1 = elemTHead.children().first();
    let elemTHeadRow2 = $('#theadfields');

    $('#dialog-variants-list').children('.selected').each(function() {

        let elemSpacerHead = elemCellSpacer.clone();
            elemSpacerHead.addClass('variant-index-' + indexVariant);

        elemTHeadRow1.append(elemSpacerHead.clone());
        elemTHeadRow2.append(elemSpacerHead.clone());

        let elemCellHead = $('<th></th>');
            elemCellHead.attr('colspan', fieldsVariant.length + 1);
            elemCellHead.attr('data-link', $(this).attr('data-link'));
            elemCellHead.html($(this).attr('data-title'));
            elemCellHead.addClass('variant-head');
            elemCellHead.addClass('variant-filter');
            elemCellHead.addClass('variant-column');
            elemCellHead.addClass('variant-index-' + indexVariant);
            elemCellHead.appendTo(elemTHeadRow1);
                // elemCellHead.click(function() {
                //     openItemByLink($(this).attr('data-link'));
                // });



        for(field of fieldsVariant) {

            let elemCellHeadField = $('<th></th>');
                elemCellHeadField.html(field.title);
                elemCellHeadField.appendTo(elemTHeadRow2);
                elemCellHeadField.addClass('variant-filter');
                elemCellHeadField.addClass('variant-column');
                elemCellHeadField.addClass('variant-index-' + indexVariant);
        }

        let elemCellHeadItem = $('<th></th>');
            elemCellHeadItem.html('Item');
            elemCellHeadItem.addClass('variant-filter');
            elemCellHeadItem.addClass('variant-column');
            elemCellHeadItem.addClass('variant-index-' + indexVariant);
            elemCellHeadItem.appendTo(elemTHeadRow2);


    });
    
    $('#dialog-variants-list').children('.selected').each(function() {
        
        elemTBody.children('tr').each(function() {

            let className     = 'status-match';

            let elemSpacerBodyClone = elemCellSpacerBody.clone();
                elemSpacerBodyClone.addClass('variant-index-' + indexVariant);
                // elemSpacerBody.addClass('variant-column');
                elemSpacerBodyClone.appendTo($(this));

                    // for(fieldVariant of fieldsVariant) {

            for(field of fieldsVariant) {

                let elemCellField = $('<td></td>');
                    elemCellField.addClass('variant-filter');
                    elemCellField.addClass('field-value');
                    elemCellField.addClass('variant-column');
                    elemCellField.addClass('variant-index-' + indexVariant);
                    elemCellField.appendTo($(this));

                let elemControl = field.control.clone();
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
            
                    // }

            }

            let elemCellItem = $('<td></td>');
                // elemCellItem.attr('data-link'       , variantItem.link);
                // elemCellItem.attr('data-edgeid'     , variantItem.edgeId);
                // elemCellItem.attr('data-edgeid-ref' , variantItem.edgeIdRef);
                // elemCellItem.attr('data-quantity'   , variantItem.quantity);
                // elemCellItem.attr('data-number'     , variantItem.number);
                // elemCellItem.attr('data-link-parent', variantItem.parent);
                // elemCellItem.attr('data-link-root'  , response.params.link);
                elemCellItem.addClass('variant-filter');
                elemCellItem.addClass('variant-index-' + indexVariant);
                elemCellItem.addClass('variant-item');
                elemCellItem.addClass('variant-column');
                elemCellItem.addClass(className);
                elemCellItem.html('variantTitle');
                elemCellItem.appendTo($(this));
                elemCellItem.click(function(e) {
                    clickItemCell(e, $(this));
                });



        });


        indexVariant++;


                //#endregion
        // }

    });

}
function changeBOMViewDone(id) {

    let elemTHead = $('#' + id + '-thead');

    let elemTHeadRow2 = $('<tr><th></th><th></th></tr>');
        elemTHeadRow2.attr('id', 'theadfields');
        elemTHeadRow2.appendTo(elemTHead);

}