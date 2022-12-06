let fields, sections, viewId;
let requestsCount = 5;
let urnPartNumber = '';
let urns = {
    'partNumber' : '', 'isSparePart' : '', 'sparePart' : '', 'maintenanceKit' : ''
}


$(document).ready(function() {
    
    setAvatar();
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
    $('#item-close').click(function() {
        $('body').removeClass('with-panel');
    });
    $('#item-bookmark').click(function() {
        let dmsId = $('#item').attr('data-urn').split('.')[5];
        if($('#item-bookmark').hasClass('active')) {
            $.get('/plm/remove-bookmark', { 'dmsId' : dmsId }, function (response) {
                setBookmark();
            });
        } else {
            $.get('/plm/add-bookmark', { 'dmsId' : dmsId, 'comment' : ' ' }, function (response) {
                setBookmark();
            });
        }


    });
    $('#item-open').click(function() {
        openItemByURN($('#item').attr('data-urn'));
    });


    // Tabs of selected item
    $('#tabs > .tab').click(function() {
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        $('.panel-content').hide();
        $('#' + $(this).attr('data-id')).show();
    })

    $('#tabs > .tab').first().click();

}


// Get item master details
function getItemClassDetails() {

    $('#items-progress').show();
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
    
        let classPath = getFieldValue(response.data.sections, 'CLASS_PATH', '');
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

                    $('#items-progress').hide();

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

    $('#item').attr('data-urn', elemClicked.attr('data-urn'));
    $('#item-title').html(elemClicked.attr('data-title'));

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

    if(!$('body').hasClass('with-panel')) {
        $('body').addClass('with-panel');
    }

    let link = elemClicked.attr('data-link');
    
    setBookmark();
    setItemDetails(link);
    setAttachments(link);
    setViewer(link);

}



function setBookmark() {

    $('#item-bookmark').removeClass('active');

    $.get('/plm/bookmarks', function(response) {
        for(bookmark of response.data.bookmarks) {
            if(bookmark.item.urn === $('#item').attr('data-urn')) {
                $('#item-bookmark').addClass('active');
            }
        }
    });

}



function setItemDetails(link) {

    $('#details-progress').show();

    let elemParent = $('#details-list');
        elemParent.html('');

    let elemPanelHeaderSub = $('#panel-header-sub');
        elemPanelHeaderSub.html('');

    let wsId = link.split('/')[4];

    let promises = [
        $.get('/plm/sections', { 'wsId' : wsId }),
        $.get('/plm/fields', { 'wsId' : wsId }),
        $.get('/plm/details', { 'link' : link })
    ];

    Promise.all(promises).then(function(responses) {

        let elemPanelHeaderSub = $('#panel-header-sub');
            elemPanelHeaderSub.html('');
    

        let lifecycle = (typeof responses[2].data.lifecycle === 'undefined') ? '' : responses[2].data.lifecycle.title;

        elemPanelHeaderSub.append($('<span>' + responses[2].data.workspace.title + '</span>'));
        if(lifecycle !== '') elemPanelHeaderSub.append($('<span>' + lifecycle + '</span>'));

        $.get('/plm/details', { 'link' : link }, function(response) {
            insertItemDetails(elemParent, responses[0].data, responses[1].data, responses[2].data, false, false, false);
            $('#details-progress').hide();
        });
    });

    

}


// Display selected item's attachments
function setAttachments(link) {

    $('#files-progress').show();

    let elemParent = $('#files-list');
        elemParent.html('');

    $.get('/plm/attachments', { 'link' : link }, function(response) {
        insertAttachments(elemParent, response.data, false);
        $('#files-progress').hide();
    });

}



// Get viewable and init Forge viewer
function setViewer(link) {

    $('body').addClass('no-viewer');

    $.get( '/plm/list-viewables', { 'link' : link }, function(response) {

        if(response.params.link !== link) return;

        if(response.data.length > 0) {

            $('#product').addClass('has-viewable');

            let viewLink = response.data[0].selfLink;

            $.get( '/plm/get-viewable', { 'link' : viewLink } , function(response) {
                if(response.params.link !== viewLink) return;
                $('body').removeClass('no-viewer');

                initViewer(response.data, 238);
            });

        }

    });

}
function onSelectionChanged(event) {}
function initViewerDone() {}

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