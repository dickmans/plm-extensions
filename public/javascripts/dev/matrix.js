$(document).ready(function() {
    
    appendProcessing('items', false);
    appendProcessing('item', false);

    setUIEvents();
    getInitialData();

});

function setUIEvents() { 

    $('#button-toggle-details').click(function() {
        $('body').toggleClass('with-panel');
    });

}


// Retrieve Workspace Details, BOM and details
function getInitialData() {

    let requests = [
        // $.get('/plm/bom-views-and-fields'   , { 'wsId' : wsId }),
        $.get('/plm/details'     , { 'wsId' : wsId, 'dmsId' : dmsId }),
        $.get('/plm/grid'        , { 'wsId' : wsId, 'dmsId' : dmsId }),
        $.get('/plm/grid-columns', { 'wsId' : wsId })
    ];

    Promise.all(requests).then(function(responses) {

        // for(view of responses[0].data) {
        //     if(view.name === config.explorer.bomViewName) {
        //         wsItems.viewId = view.id;
        //         wsItems.viewColumns = view.fields;
        //     }
        // }

        // if(wsItems.viewId === '') showErrorMessage('Error in configuration. Could not find BOM view "' + config.explorer.bomViewName + '"');
        
        $('#header-subtitle').html(responses[0].data.title);

        let requestsSub = [];
        let columns     = responses[2].data;

        for(row of responses[1].data) {

            let linkGrid = getGridRowValue(row, 'ITEM', '');
            //let linkGrid = getGridRowValue(row, 'ITEM', '');
            // let optionTitle       = getGridRowValue(row, 'TITLE', '');
            // let optionDescription = getGridRowValue(row, 'DESCRIPTION', '');

            requestsSub.push($.get('/plm/details', { 'link' : linkGrid}) );
            requestsSub.push($.get('/plm/grid'   , { 'link' : linkGrid}) );

        }

        Promise.all(requestsSub).then(function(responsesSub) {
            console.log(responsesSub);
            insertMatrix(columns, responsesSub);
        });


        // wsItems.sections            = responses[2].data;
        // wsItems.fields              = responses[3].data;
        // wsProblemReports.sections   = responses[4].data;
        // wsProblemReports.fields     = responses[5].data;

        // if(!isBlank(config.explorer.wsIdSupplierPackages)) {
        //     wsSupplierPackages.sections = responses[6].data;
        //     wsSupplierPackages.fields   = responses[7].data;
        // } else {
        //     $('#send-selected').remove();
        // }

        // getBOMData();
        // setItemDetails('/api/v3/workspaces/' + wsId + '/items/' + dmsId);
        
        // editableFields = getEditableFields(wsItems.fields);

    });

}


function insertMatrix(columns, rows) {

    let elemTable = $('#matrix-body');

    for(let index = 0; index < rows.length; index++) {

        let rowHead = rows[index];
        let brand = getSectionFieldValue(rowHead.data.sections, 'BRAND', '');
        let elemRowHead = $('<tr></tr>');
            elemRowHead.appendTo(elemTable);

        let elemRowHeadCell = $('<td></td>');
            elemRowHeadCell.attr('colspan', '5');
            elemRowHeadCell.addClass('matrix-head');
            elemRowHeadCell.html(rowHead.data.title);
            elemRowHeadCell.appendTo(elemRowHead);

        let elemRowTitles = $('<tr></tr>');
            elemRowTitles.appendTo(elemTable);
            elemRowTitles.addClass('matrix-titles');


        let elemRowTitle1 = $('<td></td>');
            elemRowTitle1.html('Item');
            elemRowTitle1.appendTo(elemRowTitles);

        // let elemRowTitle2 = $('<td></td>');
        //     elemRowTitle2.html('DE');
        //     elemRowTitle2.appendTo(elemRowTitles);

        let elemRowTitle3 = $('<td></td>');
            elemRowTitle3.html('Include');
            elemRowTitle3.appendTo(elemRowTitles);

        let elemRowTitle4 = $('<td></td>');
            elemRowTitle4.html('Print in TIP');
            elemRowTitle4.appendTo(elemRowTitles);

        let elemRowTitle5 = $('<td></td>');
            elemRowTitle5.html('Print in DOC');
            elemRowTitle5.appendTo(elemRowTitles);

        let elemRowTitle6 = $('<td></td>');
            elemRowTitle6.html('Brand');
            elemRowTitle6.appendTo(elemRowTitles);
            
        index++;

        let rowItem = rows[index]

        console.log(rowItem);

        for(row of rowItem.data) {

            // let name = getGridRowValue(row, 'ITEM', '', 'title');
            // let itemLink = getGridRowValue(row, 'ITEM', '');
            let name = getGridRowValue(row, 'PRODUCT', '', 'title');
            let itemLink = getGridRowValue(row, 'PRODUCT', '');
            console.log(name);
            console.log(itemLink);
        
            let elemRow = $('<tr></tr>');
                elemRow.attr('data-link', itemLink);
                elemRow.appendTo(elemTable);
                elemRow.click(function() {
                    selectItem($(this));
                });

            let elemRowCell = $('<td></td>');
                elemRowCell.html(name);
                elemRowCell.appendTo(elemRow);

            let elemRowCellCheck1 = $('<td></td>');
                elemRowCellCheck1.appendTo(elemRow);
                elemRowCellCheck1.append(genToggle(''));

            // let elemRowCellCheck2 = $('<td></td>');
            //     elemRowCellCheck2.appendTo(elemRow);
            //     elemRowCellCheck2.append(genToggle(''));

            let elemRowCellCheck3 = $('<td></td>');
                elemRowCellCheck3.appendTo(elemRow);
                elemRowCellCheck3.append(genToggle(''));

            let elemRowCellCheck4 = $('<td></td>');
                elemRowCellCheck4.appendTo(elemRow);
                elemRowCellCheck4.append(genToggle(''));

            let elemRowCellCheck5 = $('<td></td>');
                elemRowCellCheck5.html(brand);
                elemRowCellCheck5.appendTo(elemRow);

        }



    }

}

function genToggle(label) {

    return '<input type="checkbox" id="vehicle1" name="vehicle1" value="Bike"><label for="vehicle1">' + label + '</label>';
}


function selectItem(elemClicked) {

    let linkSelected = elemClicked.attr('data-link');

    console.log(linkSelected);

    $('body').addClass('with-panel');
    $('#details').attr('data-link', linkSelected);
    // setItemDetails(linkSelected);

    $.get('/plm/details', { 'link' : linkSelected }, function(response) {
        console.log(response);
        insertItemDetails(linkSelected, response.data);
    });


}
function setItemDetails(link) {

    getBookmarkStatus();

    $('#details-processing').show();
    $('#details-sections').html('');

    $.get('/plm/details', { 'link' : link }, function(response) {

        if($('#details').attr('data-link') !== response.params.link) return;

        insertItemDetailsFields(link, 'details', wsItems.sections, wsItems.fields, response.data, true, false, false);

        $('#details-processing').hide();

        if(multiSelect.links.length < 2) {

            for(section of response.data.sections) {
                for(field of section.fields) {
                    if(typeof field.value !== 'undefined') {
                        if(field.value !== null) {
                            multiSelect.common.push({
                                'fieldId' : field.__self__.split('/')[10],
                                'value'   : (typeof field.value === 'object') ? field.value.link : field.value
                            });
                        }
                    }
                }
            }

        } else {

            // console.log(' > parsing common properties');

            for(let index = multiSelect.common.length - 1; index >= 0; index--) {

                let fieldId = multiSelect.common[index].fieldId;
                let keep    = false;

                for(section of response.data.sections) {
                
                    for(field of section.fields) {

                       

                        

                            let id = field.__self__.split('/')[10];
                            

                        if(fieldId === id) {

                            if(field.value !== null) {


                                let value = (typeof field.value === 'object') ? field.value.link : field.value;

                                // console.log(field);
                                // console.log(fieldId);
                                // console.log(field.value);
                                // console.log(multiSelect.common[index].value);
                                if(multiSelect.common[index].value === value) {
                                    keep = true;
                                }
                                // console.log(keep);
                            }

                        }

                    }
                
                }

                if(!keep) {
                    multiSelect.common.splice(index, 1);
                    multiSelect.varies.push(fieldId);
                }
                    
            }

            // console.log(multiSelect);

            $('#sections').find('.field-value').each(function() {

                let id = $(this).attr('data-id');
                let reset = true;
                for(field of multiSelect.common) {
                    if(id === field.fieldId) {
                        // if(field.value === $(this).val()) {
                            reset = false;
                        // }
                    }
                }

                if(reset) {
                    if($(this).hasClass('radio')) {
                        $(this).find('input').each(function() {
                            $(this).removeAttr('checked');
                        });
                    } else $(this).val('');
                } 

            });

        }

    });

}


// Get item master details
function getItemClassDetails() {

    $('#items-processing').show();
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
    
        let classPath   = getSectionFieldValue(response.data.sections, 'CLASS_PATH', '');
        let classFields = [];
        let className;

        for(section of response.data.sections) {

            if(section.hasOwnProperty('classificationId')) {

                className = section.classificationName;

                $('#header-subtitle').html(classPath);
                $('#items-title').html(className);

                let elemParent = $('#items-list');
                    elemParent.html();

                let elemHeader = $('<tr></tr>');
                    elemHeader.appendTo(elemParent);

                let elemHeaderItem = $('<th></th>');
                    elemHeaderItem.html('Item');
                    elemHeaderItem.appendTo(elemHeader);

                let elemRowRef = $('<tr></tr>');
                    elemRowRef.addClass('item');
                    elemRowRef.addClass('reference');
                    elemRowRef.attr('data-link', response.data.root.link);
                    elemRowRef.attr('data-urn', response.data.urn);
                    elemRowRef.attr('data-title', response.data.title);
                    elemRowRef.appendTo(elemParent);

                let elemRefCellItem = $('<td></td>');
                    elemRefCellItem.html(response.data.title);
                    elemRefCellItem.appendTo(elemRowRef);

                for(field of section.fields) {

                    let elemHeaderCell = $('<th></th>');
                        elemHeaderCell.html(field.title);
                        elemHeaderCell.appendTo(elemHeader);

                    let elemRefCell = $('<td></td>');
                        elemRefCell.html(getFieldDisplayValue(field.value));
                        elemRefCell.addClass('value');
                        elemRefCell.addClass('match');
                        elemRefCell.appendTo(elemRowRef);

                    classFields.push({
                        'id' : field.urn.split('.')[9],
                        'value' : getFieldDisplayValue(field.value)
                    })

                }

                let params = { 
                    'wsId'   : wsId,
                    'limit'  : 1000,
                    'offset' : 0,
                    'query'  : 'ITEM_DETAILS:CLASS_NAME%3D' + className
                }

                $.get('/plm/search-bulk', params, function(response) {

                    for(item of response.data.items) {

                        let itemDMSID = item.root.urn.split('.')[5];

                        if(itemDMSID !== dmsId) {

                            let elemRow = $('<tr></tr>');
                                elemRow.addClass('item');
                                elemRow.attr('data-link', item.root.link);
                                elemRow.attr('data-urn', item.root.urn);
                                elemRow.attr('data-title', item.title);
                                elemRow.appendTo(elemParent);

                            let elemCellItem = $('<td></td>');
                                elemCellItem.html(item.title);
                                elemCellItem.appendTo(elemRow);

                            for(classField of classFields) {

                                let value = '';
                                let style = 'diff';

                                for(itemSection of item.sections) {
                                    for(field of itemSection.fields) {
                                        let fieldId = field.urn.split('.')[9];
                                        if(fieldId === classField.id) {
                                            value = getFieldDisplayValue(field.value);
                                            if(value === classField.value) style = 'match'; else style = 'diff';
                                        }
                                    }
                                }

                                let elemCell = $('<td></td>');
                                    elemCell.html(value);
                                    elemCell.addClass('value');
                                    elemCell.addClass(style);
                                    elemCell.appendTo(elemRow);
                            }

                        }

                    }

                    $('#items-processing').hide();

                    $('tr.item').click(function() {                        
                        selectItem($(this));
                    });


                });
            }

        }    
    });
    
}
function getFieldDisplayValue(value) {

    if(value !== null) {
        if(typeof field.value === 'object') return field.value.title;
        return field.value;
    }

    return '';

}


// Upon item selection display details
// function selectItem(elemClicked) {

//     let link = elemClicked.attr('data-link');

//     $('#item').attr('data-link', link);
//     $('#item-title').html(elemClicked.attr('data-title'));

//     elemClicked.addClass('selected');
//     elemClicked.siblings().removeClass('selected');

//     if($('body').hasClass('no-panel')) {
//         $('body').removeClass('no-panel');
//     }  
    
//     setItemDetails(link);
//     insertAttachments(link);
//     insertViewer(link);
//     getBookmarkStatus();

// }


// Display item details
// function setItemDetails(link) {

//     $('#item-processing').show();
//     $('#item-sections').html('');

//     let elemPanelHeaderSub = $('#item-subtitle');
//         elemPanelHeaderSub.html('');

//     let requests = [
//         $.get('/plm/sections', { 'link' : link }),
//         $.get('/plm/fields'  , { 'link' : link }),
//         $.get('/plm/details' , { 'link' : link })
//     ];

//     Promise.all(requests).then(function(responses) {

//         $('#item-processing').hide();

//         let lifecycle = (typeof responses[2].data.lifecycle === 'undefined') ? '' : responses[2].data.lifecycle.title;

//         elemPanelHeaderSub.append($('<span>' + responses[2].data.workspace.title + '</span>'));
//         if(lifecycle !== '') elemPanelHeaderSub.append($('<span>' + lifecycle + '</span>'));
//         insertItemDetailsFields('item', '', responses[0].data, responses[1].data, responses[2].data, false, false, false);   
          
//     });

// }