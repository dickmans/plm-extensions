$(document).ready(function() {
    
    appendProcessing('items', false);
    appendProcessing('item', false);

    getItemClassDetails();
    setUIEvents();

});

function setUIEvents() { 


    // Toggles
    $('#show-matches-only').click(function() {
        
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
        
        $('tr.item').each(function() {
            if($(this).find('.value.diff').length > 0) $(this).hide(); else $(this).show();
        });

    });
    $('#hide-non-matching').click(function() {

        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');

        $('tr.item').each(function() {
            if($(this).find('.value.match').length === 0) $(this).hide(); else $(this).show();
        });

    });
    $('#show-all').click(function() {

        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');

        $('tr.item').each(function() {
            $(this).show();
        });

    });


    // Item selection
    $('#close').click(function() {
        $('body').addClass('no-panel');
        $('tr.item.selected').removeClass('selected');
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
function selectItem(elemClicked) {

    let link = elemClicked.attr('data-link');

    $('#item').attr('data-link', link);
    $('#item-title').html(elemClicked.attr('data-title'));

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

    if($('body').hasClass('no-panel')) {
        $('body').removeClass('no-panel');
    }  
    
    setItemDetails(link);
    insertAttachments(link);
    insertViewer(link);
    getBookmarkStatus();

}


// Display item details
function setItemDetails(link) {

    $('#item-processing').show();
    $('#item-sections').html('');

    let elemPanelHeaderSub = $('#item-subtitle');
        elemPanelHeaderSub.html('');

    let requests = [
        $.get('/plm/sections', { 'link' : link }),
        $.get('/plm/fields'  , { 'link' : link }),
        $.get('/plm/details' , { 'link' : link })
    ];

    Promise.all(requests).then(function(responses) {

        $('#item-processing').hide();

        let lifecycle = (typeof responses[2].data.lifecycle === 'undefined') ? '' : responses[2].data.lifecycle.title;

        elemPanelHeaderSub.append($('<span>' + responses[2].data.workspace.title + '</span>'));
        if(lifecycle !== '') elemPanelHeaderSub.append($('<span>' + lifecycle + '</span>'));

        $.get('/plm/details', { 'link' : link }, function(response) {
            insertItemDetailsFields('item', '', responses[0].data, responses[1].data, responses[2].data, false, false, false);
            
        });

    });

}