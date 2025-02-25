let summaryContents = [{ 
        type         : 'details',
        params       : { 
            id               : 'item-details', 
            hideHeaderLabel  : true,
            toggles          : true,
            collapseContents : true
        }
    }, { 
        type        : 'attachments',
        params      : { 
            id          : 'item-attachments',
            hideHeader  : true,
            contentSize : 'xl'
        }
    }, { 
        type        : 'bom',
        params      : { 
            id      : 'item-bom',
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
            hideHeader : true
        }
    }
];



$(document).ready(function() {
    
    appendProcessing('items', false);

    getFeatureSettings('classes', [], function() {
        getItemClassDetails();
    });

    setUIEvents();


});

function setUIEvents() { 


    // Toggles
    $('#show-matches-only').click(function() {
        
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
        
        $('tr.content-item').each(function() {
            if($(this).find('.value.diff').length > 0) $(this).hide(); else $(this).show();
        });

    });
    $('#hide-non-matching').click(function() {

        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');

        $('tr.content-item').each(function() {
            if($(this).find('.value.match').length === 0) $(this).hide(); else $(this).show();
        });

    });
    $('#show-all').click(function() {

        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');

        $('tr.content-item').each(function() {
            $(this).show();
        });

    });

}


// Get item master details
function getItemClassDetails() {

    $('#items-processing').show();
    
    $.get('/plm/details', { 'wsId' : wsId, 'dmsId' : dmsId }, function(response) {
    
        let classPath   = getSectionFieldValue(response.data.sections, 'CLASS_PATH', '');
        let classFields = [];
        let className;

        for(let section of response.data.sections) {

            if(section.hasOwnProperty('classificationId')) {

                className = section.classificationName;

                $('#header-subtitle').html(className);
                $('#items-title').html(classPath);

                document.title = className;

                let elemParent = $('#items-list').html('');
                let elemHeader = $('<tr></tr>').appendTo(elemParent);

                $('<th></th>').appendTo(elemHeader).html('Item');

                let elemRowRef = $('<tr></tr>').appendTo(elemParent)
                    .addClass('content-item')
                    .addClass('reference')
                    .attr('data-link', response.data.root.link)
                    // .attr('data-urn', response.data.urn);
                    .attr('data-title', response.data.title);
                    
                $('<td></td>').appendTo(elemRowRef).html(response.data.title);

                for(let field of section.fields) {

                    $('<th></th>').appendTo(elemHeader).html(field.title);

                    $('<td></td>').appendTo(elemRowRef)
                        .html(getFieldDisplayValue(field.value))
                        .addClass('value')
                        .addClass('match');

                    classFields.push({
                        id      : field.urn.split('.')[9],
                        value   : getFieldDisplayValue(field.value)
                    })

                }

                let params = { 
                    wsId   : wsId,
                    limit  : 1000,
                    offset : 0,
                    query  : 'ITEM_DETAILS:CLASS_NAME%3D' + className
                }

                $.get('/plm/search-bulk', params, function(response) {

                    for(let item of response.data.items) {

                        let itemDMSID = item.root.urn.split('.')[5];

                        if(itemDMSID !== dmsId) {

                            let elemRow = $('<tr></tr>').appendTo(elemParent)
                                .addClass('content-item')
                                .attr('data-link', item.root.link)
                                .attr('data-urn', item.root.urn)
                                .attr('data-title', item.title);

                            $('<td></td>').appendTo(elemRow)
                                .html(item.title);

                            for(let classField of classFields) {

                                let value = '';
                                let style = 'diff';

                                for(let itemSection of item.sections) {
                                    for(let field of itemSection.fields) {
                                        let fieldId = field.urn.split('.')[9];
                                        if(fieldId === classField.id) {
                                            value = getFieldDisplayValue(field.value);
                                            if(value === classField.value) style = 'match'; else style = 'diff';
                                        }
                                    }
                                }

                                $('<td></td>').appendTo(elemRow)
                                    .html(value)
                                    .addClass('value')
                                    .addClass(style);
                            }

                        }

                    }

                    $('#items-processing').hide();

                    $('tr.content-item').click(function() {                        
                        selectItem($(this), className);
                    });


                });
            }

        }    
    });
    
}
function getFieldDisplayValue(value) {

    if(value !== null) {
        if(typeof value === 'object') return value.title;
        return value;
    }

    return '';

}


// Upon item selection display details
function selectItem(elemClicked, className) {

    let link = elemClicked.attr('data-link');

    elemClicked.addClass('selected');
    elemClicked.siblings().removeClass('selected');

    insertItemSummary(link, {
        bookmark        : true,
        openInPLM       : true,
        layout          : 'tabs',
        includeViewer   : true,
        toggleBodyClass : 'with-panel',
        contents        : summaryContents
    })

}
function insertDetailsDone() {

    let elemButtonClose = $('<div></div>').appendTo($('#details-controls'))
        .addClass('button')
        .addClass('icon')
        .addClass('icon-close')
        .click(function() {
            $('body').addClass('no-panel');
        });

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
        insertItemDetailsFields(link, 'item', responses[0].data, responses[1].data, responses[2].data, false, false, false);   
          
    });

}


// Add custom toolbar to viewer
function initViewerDone() {

    viewerAddViewsToolbar();

}